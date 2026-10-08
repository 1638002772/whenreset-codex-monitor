"""Public X Posts monitor for @thsottiaux. Uses page SSR data; no login/API."""

from __future__ import annotations

import argparse
import base64
import hashlib
import hmac
import json
import os
import re
import smtplib
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
STATE_PATH = DATA_DIR / "state.json"
POSTS_PATH = DATA_DIR / "posts.json"
EVENTS_PATH = DATA_DIR / "events.json"
CONFIG_PATH = DATA_DIR / "notification-config.json"
DIAGNOSTICS_DIR = DATA_DIR / "diagnostics"
PROFILE_URL = "https://x.com/thsottiaux"
BASELINE_TWEET_ID = "2107676072871600470"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)
MAX_SEEN = 200
MAX_POSTS = 200
MAX_EVENTS = 200
BEIJING_TZ = timezone(timedelta(hours=8))

ENTRY_RE = re.compile(r'(?:"entry_id"|entry_id)\s*:\s*"?tweet-(\d+)"?')
HREF_RE = re.compile(r'data-href="/thsottiaux/status/(\d+)"')
TWEET_ID_RE = re.compile(r'(?:"id"|\bid)\s*:\s*"?(VHdlZXQ6[A-Za-z0-9+/=]+)"?')
FULL_TEXT_RE = re.compile(r'(?:"full_text"|full_text)\s*:\s*"((?:\\.|[^"\\])*)"')
CREATED_MS_RE = re.compile(r'(?:"created_at_ms"|created_at_ms)\s*:\s*(\d+)')
SCREEN_NAME_RE = re.compile(r'(?:"screen_name"|screen_name)\s*:\s*"([^"]+)"')

WINDOW_PATTERNS = [
    re.compile(r"\bby\s+EOD\s+(?:PST|PDT|PT)\b", re.I),
    re.compile(r"\bby\s+the\s+end\s+of\s+(?:today|the\s+day)(?:\s+(?:PST|PDT|PT|Pacific\s+Time))?\b", re.I),
    re.compile(r"\bwithin\s+(?:the\s+)?(?:next\s+)?(?:\d+\s+)?(?:minutes?|hours?|days?|hour|day)\b", re.I),
    re.compile(r"\bin\s+\d+\s+(?:minutes?|hours?|days?)\b", re.I),
    re.compile(r"\b(?:later\s+today|tonight|tomorrow)\b", re.I),
    re.compile(r"\bat\s+\d{1,2}(?::\d{2})?\s*(?:a\.m\.|p\.m\.|am|pm)\s*(?:PST|PDT|PT)\b", re.I),
]
DELIVERY_WORDS = re.compile(r"\b(reset|land|landed|arrive|arrival|available|live|receive|received|load|loading|issue|issued|roll\s*out)\b", re.I)
CONFIRMED_WORDS = re.compile(r"\b(confirmed|landed|now\s+live|are\s+live|is\s+live|fully\s+live|has\s+arrived|have\s+arrived|received|issued|applied)\b", re.I)
RESET_WORDS = re.compile(r"\b(reset|resets|resetting|banked\s+reset|reset\s+card)\b", re.I)
RESET_CONTEXT_WORDS = re.compile(r"\b(codex|usage|quota|credit|credits|paid\s+accounts?|all\s+accounts?|limit|allowance|banked)\b", re.I)


class ScrapeError(RuntimeError):
    pass


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def ensure_dirs() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    DIAGNOSTICS_DIR.mkdir(parents=True, exist_ok=True)


def load_json(path: Path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return default


def save_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")
    temporary.replace(path)


def decode_rsc_string(value: str) -> str:
    try:
        return json.loads('"' + value + '"')
    except json.JSONDecodeError:
        return value.replace(r"\n", "\n").replace(r"\u0026", "&").replace(r"\u003c", "<").replace(r"\u003e", ">")


def fetch_html() -> str:
    profile_url = os.environ.get("WHENRESET_X_PROFILE_URL", PROFILE_URL)
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
    }
    proxy_token = os.environ.get("WHENRESET_PROFILE_PROXY_TOKEN", "").strip()
    if proxy_token:
        headers["Authorization"] = f"Bearer {proxy_token}"
    request = urllib.request.Request(
        profile_url,
        headers=headers,
    )
    try:
        with urllib.request.urlopen(request, timeout=35) as response:
            if response.status != 200:
                raise ScrapeError(f"X returned HTTP {response.status}")
            raw = response.read()
            charset = response.headers.get_content_charset() or "utf-8"
            html = raw.decode(charset, errors="replace")
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        raise ScrapeError(f"X fetch failed: {exc}") from exc
    if len(html) < 10_000 or "VHdlZXQ6" not in html:
        raise ScrapeError("X page did not contain the expected public SSR tweet data")
    return html


def save_html_evidence(html: str) -> None:
    ensure_dirs()
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    evidence = DIAGNOSTICS_DIR / f"x-fetch-{stamp}.html"
    evidence.write_text(html, encoding="utf-8")
    files = sorted(DIAGNOSTICS_DIR.glob("x-fetch-*.html"), key=lambda item: item.stat().st_mtime, reverse=True)
    for old in files[3:]:
        old.unlink(missing_ok=True)


def tweet_key(tweet_id: str) -> str:
    return base64.b64encode(f"Tweet:{tweet_id}".encode("utf-8")).decode("ascii")


def extract_posts(html: str) -> list[dict]:
    entries = [match.group(1) for match in ENTRY_RE.finditer(html)]
    if not entries:
        # Fallback for markup variants. This can include quote cards, so deduplicate.
        entries = [match.group(1) for match in HREF_RE.finditer(html)]
    ids = list(dict.fromkeys(entries))
    if not ids:
        raise ScrapeError("X SSR format changed: no Posts timeline entries found")

    posts = []
    for tweet_id in ids:
        key = tweet_key(tweet_id)
        positions = [match.start() for match in re.finditer(re.escape(key), html)]
        if not positions:
            raise ScrapeError(f"X SSR format changed: no serialized Tweet object for {tweet_id}")
        post = None
        for position in positions:
            start = max(0, position - 8000)
            before = html[start:position]
            text_matches = list(FULL_TEXT_RE.finditer(before))
            date_matches = list(CREATED_MS_RE.finditer(before))
            if not text_matches or not date_matches:
                continue
            text = decode_rsc_string(text_matches[-1].group(1)).strip()
            timestamp = int(date_matches[-1].group(1)) / 1000
            author_matches = list(SCREEN_NAME_RE.finditer(before[max(0, text_matches[-1].start() - 2400):]))
            author = author_matches[-1].group(1) if author_matches else "thsottiaux"
            if author.casefold() != "thsottiaux":
                continue
            created = datetime.fromtimestamp(timestamp, timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
            post = {
                "id": tweet_id,
                "author": "thsottiaux",
                "createdAt": created,
                "text": text,
                "url": f"https://x.com/thsottiaux/status/{tweet_id}",
                "fetchedAt": now_iso(),
            }
            break
        if post is None:
            raise ScrapeError(f"X SSR format changed: could not decode text/time for {tweet_id}")
        posts.append(post)

    return sorted(posts, key=lambda item: (item["createdAt"], item["id"]), reverse=True)


def parse_time_window(text: str) -> str | None:
    for sentence in re.split(r"(?<=[.!?])\s+|\n+", text):
        match = next((pattern.search(sentence) for pattern in WINDOW_PATTERNS if pattern.search(sentence)), None)
        if not match:
            continue
        phrase = match.group(0)
        if phrase.casefold() in {"tomorrow", "later today", "tonight"} and not DELIVERY_WORDS.search(text):
            continue
        return phrase
    return None


def event_category(text: str) -> str | None:
    lower = text.casefold()
    if re.search(r"\b(cap|limit)\s+(is\s+)?(raised|increased|expanded)|higher\s+(usage|limit|cap)\b", lower):
        return "cap_increase"
    if re.search(r"\b(compensat\w*|credit\s+grant|extra\s+credit|reset\s+card)\b", lower):
        return "compensation"
    if re.search(r"\bbanked\s+reset\b", lower):
        return "banked_reset"
    if RESET_WORDS.search(text) and RESET_CONTEXT_WORDS.search(text):
        return "usage_reset"
    return None


def parse_date(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def pending_event_for(events: list[dict], post_time: str) -> dict | None:
    try:
        current = parse_date(post_time)
    except ValueError:
        return None
    candidates = []
    for event in events:
        if event.get("status") != "forecast":
            continue
        try:
            age_hours = (current - parse_date(event["createdAt"])).total_seconds() / 3600
        except (KeyError, ValueError):
            continue
        if 0 <= age_hours <= 36:
            candidates.append((age_hours, event))
    return min(candidates, key=lambda item: item[0])[1] if candidates else None


def classify_post(post: dict, events: list[dict]) -> dict | None:
    text = post["text"]
    category = event_category(text)
    if post["id"] == BASELINE_TWEET_ID:
        category = "usage_reset"
    pending = pending_event_for(events, post["createdAt"])
    followup = False
    if category is None and pending and re.search(r"\b(confirmed|landed|now\s+live|all\s+accounts|already\s+live)\b", text, re.I):
        category = pending["category"]
        followup = True
    if category is None:
        return None

    completion = bool(CONFIRMED_WORDS.search(text))
    if post["id"] == BASELINE_TWEET_ID:
        completion = True
    if followup and re.search(r"\b(confirmed|landed|now\s+live|already\s+live)\b", text, re.I):
        completion = True
    time_window = parse_time_window(text)
    if category == "cap_increase":
        status = "cap_increase"
    elif category == "compensation":
        status = "compensation"
    else:
        status = "confirmed" if completion else "forecast"

    return {"category": category, "status": status, "timeWindow": time_window, "isFollowup": followup}


def localized_status(category: str, status: str) -> tuple[str, str]:
    names = {
        "usage_reset": ("额度重置", "Usage reset"),
        "banked_reset": ("预存重置额度", "Banked reset"),
        "compensation": ("额度补偿", "Usage compensation"),
        "cap_increase": ("额度上限提升", "Usage cap increase"),
    }
    labels = {"forecast": ("重置预告", "Reset forecast"), "confirmed": ("已确认到账", "Confirmed landed"), "compensation": ("额度补偿", "Usage compensation"), "cap_increase": ("上限提升", "Limit increase")}
    name = names.get(category, ("额度动态", "Usage update"))
    label = labels.get(status, ("动态", "Update"))
    return name[0] + " · " + label[0], name[1] + " · " + label[1]


def matching_event(events: list[dict], category: str, post_time: str) -> dict | None:
    try:
        current = parse_date(post_time)
    except ValueError:
        return None
    for event in sorted(events, key=lambda item: item.get("updatedAt", ""), reverse=True):
        if event.get("category") != category:
            continue
        try:
            age = abs((current - parse_date(event["updatedAt"])).total_seconds()) / 3600
        except (KeyError, ValueError):
            continue
        if age <= 36 and event.get("status") != "confirmed":
            return event
    return None


def apply_post_to_events(events: list[dict], post: dict, notify: bool) -> tuple[list[dict], dict | None]:
    classification = classify_post(post, events)
    if not classification:
        return events, None
    category = classification["category"]
    status = classification["status"]
    event = matching_event(events, category, post["createdAt"])
    if event is None and classification["isFollowup"]:
        event = pending_event_for(events, post["createdAt"])
    created = event is None
    if created:
        title_zh, title_en = localized_status(category, status)
        event = {
            "id": post["id"],
            "category": category,
            "status": status,
            "titleZh": title_zh,
            "titleEn": title_en,
            "createdAt": post["createdAt"],
            "updatedAt": post["createdAt"],
            "confirmedAt": post["createdAt"] if status == "confirmed" else None,
            "timeWindow": classification["timeWindow"],
            "postIds": [],
            "timeline": [],
            "lastAlertedStatus": status if not notify else None,
        }
        events.append(event)

    if post["id"] not in event["postIds"]:
        event["postIds"].append(post["id"])
    event["updatedAt"] = post["createdAt"]
    event["lastPostId"] = post["id"]
    event["lastPostUrl"] = post["url"]
    event["timeWindow"] = classification["timeWindow"] or event.get("timeWindow")
    event["timeline"].append({
        "postId": post["id"], "createdAt": post["createdAt"], "url": post["url"],
        "text": post["text"], "status": status, "timeWindow": classification["timeWindow"],
    })
    if status in {"confirmed", "compensation", "cap_increase"}:
        event["status"] = status
        if status == "confirmed":
            event["confirmedAt"] = post["createdAt"]
    elif event.get("status") not in {"confirmed", "compensation", "cap_increase"}:
        event["status"] = "forecast"

    title_zh, title_en = localized_status(category, event["status"])
    event["titleZh"], event["titleEn"] = title_zh, title_en
    event["latestText"] = post["text"]
    should_alert = False
    if notify and event.get("lastAlertedStatus") != event["status"]:
        should_alert = event["status"] in {"confirmed", "compensation", "cap_increase"} or (event["status"] == "forecast" and bool(event.get("timeWindow")))
    return events, {"event": event, "shouldAlert": should_alert, "created": created}


def load_notification_config() -> dict:
    config = load_json(CONFIG_PATH, {"emails": [], "feishuWebhook": "", "feishuSecret": ""})
    config["feishuWebhook"] = os.environ.get("WHENRESET_FEISHU_WEBHOOK", config.get("feishuWebhook", ""))
    config["feishuSecret"] = os.environ.get("WHENRESET_FEISHU_SECRET", config.get("feishuSecret", ""))
    return config


def sign_feishu(secret: str, timestamp: str) -> str:
    string_to_sign = f"{timestamp}\n{secret}".encode("utf-8")
    digest = hmac.new(string_to_sign, b"", hashlib.sha256).digest()
    return base64.b64encode(digest).decode("ascii")


def send_feishu(webhook: str, secret: str, message: str) -> tuple[bool, str]:
    if not webhook:
        return False, "Feishu webhook is not configured"
    payload = {"msg_type": "text", "content": {"text": message}}
    if secret:
        timestamp = str(int(time.time()))
        payload["timestamp"] = timestamp
        payload["sign"] = sign_feishu(secret, timestamp)
    request = urllib.request.Request(
        webhook,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            result = json.loads(response.read().decode("utf-8", errors="replace") or "{}")
        if result.get("code", 0) == 0:
            return True, "sent"
        return False, str(result.get("msg") or result.get("code"))
    except (urllib.error.URLError, TimeoutError, OSError, json.JSONDecodeError) as exc:
        return False, str(exc)


def send_email(recipients: list[str], subject: str, body: str) -> tuple[int, str]:
    host = os.environ.get("WHENRESET_SMTP_HOST", "")
    user = os.environ.get("WHENRESET_SMTP_USER", "")
    password = os.environ.get("WHENRESET_SMTP_PASSWORD", "")
    sender = os.environ.get("WHENRESET_SMTP_FROM", user)
    if not (host and user and password and sender and recipients):
        return 0, "SMTP is not configured"
    port = int(os.environ.get("WHENRESET_SMTP_PORT", "587"))
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = sender
    message["To"] = ", ".join(recipients)
    message.set_content(body)
    try:
        with smtplib.SMTP(host, port, timeout=15) as smtp:
            smtp.ehlo()
            if os.environ.get("WHENRESET_SMTP_TLS", "1") != "0":
                smtp.starttls(context=ssl.create_default_context())
                smtp.ehlo()
            smtp.login(user, password)
            refused = smtp.send_message(message)
        return len(recipients) - len(refused), "sent"
    except (OSError, smtplib.SMTPException) as exc:
        return 0, str(exc)


def event_message(event: dict) -> str:
    labels = {
        "confirmed": "✅ 已确认重置",
        "compensation": "⚪ 额度补偿",
        "cap_increase": "🔵 额度上限提升",
        "forecast": "🟡 重置预告",
    }
    label = labels.get(event.get("status"), "WHENRESET 更新")
    latest = event.get("latestText", "")
    try:
        when = parse_date(event.get("updatedAt", "")).astimezone(BEIJING_TZ).strftime("%Y-%m-%d %H:%M")
    except (TypeError, ValueError):
        when = event.get("updatedAt", "")
    lines = [label, f"时间（北京时间）：{when}"]
    if event.get("timeWindow"):
        lines.append(f"原文时间窗：{event['timeWindow']}")
    if latest:
        lines.append(f"原文：{latest}")
    if event.get("lastPostUrl"):
        lines.append(event["lastPostUrl"])
    return "\n".join(lines)


def queue_browser_alert(state: dict, key: str, title: str, body: str, url: str | None = None) -> None:
    alerts = state.setdefault("browserAlerts", [])
    if any(alert.get("key") == key for alert in alerts):
        return
    alerts.append({"key": key, "title": title, "body": body, "url": url, "createdAt": now_iso()})
    state["browserAlerts"] = alerts[-50:]


def send_event_notifications(event: dict) -> dict:
    config = load_notification_config()
    text = event_message(event)
    results = {"feishu": None, "emailCount": 0, "errors": []}
    if config.get("feishuWebhook"):
        ok, detail = send_feishu(config["feishuWebhook"], config.get("feishuSecret", ""), text)
        results["feishu"] = ok
        if not ok:
            results["errors"].append(f"Feishu: {detail}")
    emails = [str(item) for item in config.get("emails", []) if item]
    if emails:
        count, detail = send_email(emails, "WHENRESET · Codex 重置消息", text)
        results["emailCount"] = count
        if count == 0 and detail != "SMTP is not configured":
            results["errors"].append(f"Email: {detail}")
    return results


def build_event_record(category: str, status: str, post: dict) -> dict:
    title_zh, title_en = localized_status(category, status)
    return {
        "id": post["id"], "category": category, "status": status,
        "titleZh": title_zh, "titleEn": title_en,
        "createdAt": post["createdAt"], "updatedAt": post["createdAt"], "confirmedAt": post["createdAt"],
        "timeWindow": None, "postIds": [post["id"]],
        "timeline": [{"postId": post["id"], "createdAt": post["createdAt"], "url": post["url"], "text": post["text"], "status": status, "timeWindow": None}],
        "lastPostId": post["id"], "lastPostUrl": post["url"], "latestText": post["text"],
        "lastAlertedStatus": status,
    }


def run_once() -> dict:
    ensure_dirs()
    state = load_json(STATE_PATH, {})
    state["lastAttemptAt"] = now_iso()
    try:
        html = fetch_html()
        posts = extract_posts(html)
    except Exception as exc:
        state["consecutiveFailures"] = int(state.get("consecutiveFailures", 0)) + 1
        state["lastError"] = str(exc)
        state["monitorState"] = "error"
        if "html" in locals():
            save_html_evidence(html)
        if state["consecutiveFailures"] >= 2 and not state.get("failureAlertSent"):
            config = load_notification_config()
            text = f"❗️ WHENRESET 抓取暂时受阻\n连续失败：{state['consecutiveFailures']} 次\n原因：{state['lastError']}"
            feishu_ok = False
            if config.get("feishuWebhook"):
                feishu_ok, _ = send_feishu(config["feishuWebhook"], config.get("feishuSecret", ""), text)
            emails = [str(item) for item in config.get("emails", []) if item]
            send_email(emails, "WHENRESET 监控暂时受阻", text)
            state["failureAlertSent"] = True
            state["failureAlertAt"] = now_iso()
            queue_browser_alert(state, f"fetch-error:{state['failureAlertAt']}", "WHENRESET 抓取暂时受阻", text)
        save_json(STATE_PATH, state)
        return {"ok": False, "error": str(exc), "consecutiveFailures": state["consecutiveFailures"]}

    previous_failures = int(state.get("consecutiveFailures", 0))
    seen = list(state.get("seenIds", []))
    seen_set = set(seen)
    existing_posts = load_json(POSTS_PATH, [])
    events = load_json(EVENTS_PATH, [])
    first_run = not bool(state.get("initialized"))
    ordered = list(reversed(posts))

    if first_run:
        # First pass establishes a quiet baseline but still builds a real local timeline.
        events = []
        saved_posts = []
        for post in ordered:
            events, result = apply_post_to_events(events, post, notify=False)
            post["classification"] = result["event"]["category"] if result else None
            post["eventStatus"] = result["event"]["status"] if result else None
            saved_posts.append(post)
        existing_posts = list(reversed(saved_posts))
        seen = [post["id"] for post in posts]
    else:
        new_posts = [post for post in ordered if post["id"] not in seen_set]
        alert_events = {}
        for post in new_posts:
            events, result = apply_post_to_events(events, post, notify=True)
            post["classification"] = result["event"]["category"] if result else None
            post["eventStatus"] = result["event"]["status"] if result else None
            if result and result["shouldAlert"]:
                alert_events[result["event"]["id"]] = result["event"]
        notifications = []
        for event in alert_events.values():
            delivery = send_event_notifications(event)
            event["lastAlertedStatus"] = event["status"]
            queue_browser_alert(
                state,
                f"{event['id']}:{event['status']}:{event['updatedAt']}",
                event.get("titleZh", "WHENRESET 更新"),
                event_message(event),
                event.get("lastPostUrl"),
            )
            notifications.append({"eventId": event["id"], "status": event["status"], **delivery})
        if new_posts:
            by_id = {item.get("id"): item for item in existing_posts if item.get("id")}
            for post in posts:
                by_id[post["id"]] = post
            existing_posts = sorted(by_id.values(), key=lambda item: item.get("createdAt", ""), reverse=True)[:MAX_POSTS]
        else:
            notifications = []
        state["lastNewPostAt"] = max((post["createdAt"] for post in new_posts), default=state.get("lastNewPostAt"))
        state["lastNewPostIds"] = [post["id"] for post in new_posts]
        state["lastNotifications"] = notifications
        seen.extend(post["id"] for post in new_posts)
        seen = seen[-MAX_SEEN:]

    events.sort(key=lambda item: item.get("updatedAt", ""), reverse=True)
    events = events[:MAX_EVENTS]
    state.update({
        "initialized": True,
        "seenIds": seen[-MAX_SEEN:],
        "lastSuccessAt": now_iso(),
        "consecutiveFailures": 0,
        "lastError": None,
        "monitorState": "ok",
        "postsFetched": len(posts),
        "failureAlertSent": False,
    })
    if previous_failures >= 2 and state.get("failureAlertAt"):
        config = load_notification_config()
        text = f"✅ WHENRESET 抓取已恢复\n恢复时间（UTC）：{state['lastSuccessAt']}"
        if config.get("feishuWebhook"):
            send_feishu(config["feishuWebhook"], config.get("feishuSecret", ""), text)
        send_email([str(item) for item in config.get("emails", []) if item], "WHENRESET 监控已恢复", text)
        state["recoveryNoticeAt"] = now_iso()
        queue_browser_alert(state, f"fetch-recovered:{state['recoveryNoticeAt']}", "WHENRESET 监控已恢复", text)

    save_json(POSTS_PATH, existing_posts[:MAX_POSTS])
    save_json(EVENTS_PATH, events)
    save_json(STATE_PATH, state)
    return {"ok": True, "postsFetched": len(posts), "newPosts": state.get("lastNewPostIds", []), "events": len(events), "baselineOnly": first_run}


def main() -> int:
    parser = argparse.ArgumentParser(description="Fetch public X Posts and update WHENRESET local data.")
    parser.add_argument("--once", action="store_true", help="Run one fetch cycle and exit (default).")
    args = parser.parse_args()
    result = run_once()
    print(json.dumps(result, ensure_ascii=False))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
