"""Loopback-only web/API server for the local WHENRESET preview."""

from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

from monitor import CONFIG_PATH, DATA_DIR, EVENTS_PATH, POSTS_PATH, STATE_PATH, load_json, load_notification_config, save_json, send_feishu


ROOT = Path(__file__).resolve().parent
HOST = "127.0.0.1"
PORT = 4173
ASSETS = {
    "/": (ROOT / "index.html", "text/html; charset=utf-8"),
    "/index.html": (ROOT / "index.html", "text/html; charset=utf-8"),
    "/styles.css": (ROOT / "styles.css", "text/css; charset=utf-8"),
    "/signal-console.css": (ROOT / "signal-console.css", "text/css; charset=utf-8"),
    "/site-config.js": (ROOT / "site-config.js", "text/javascript; charset=utf-8"),
    "/app.js": (ROOT / "app.js", "text/javascript; charset=utf-8"),
}
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def parse_date(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def configured_smtp() -> bool:
    return bool(os.environ.get("WHENRESET_SMTP_HOST") and os.environ.get("WHENRESET_SMTP_USER") and os.environ.get("WHENRESET_SMTP_PASSWORD") and os.environ.get("WHENRESET_SMTP_FROM"))


def event_is_reset(event: dict) -> bool:
    return event.get("category") in {"usage_reset", "banked_reset"} or event.get("type") == "reset"


def event_is_completed(event: dict) -> bool:
    return event.get("status") in {"confirmed", "community", "completed"} or bool(event.get("completedAt"))


def build_summary() -> dict:
    state = load_json(STATE_PATH, {})
    posts = load_json(POSTS_PATH, [])
    events = load_json(EVENTS_PATH, [])
    config = load_notification_config()
    ordered_events = sorted(events, key=lambda event: event.get("updatedAt") or event.get("timestamp") or "", reverse=True)
    completed = [event for event in events if event_is_reset(event) and event_is_completed(event)]
    completed.sort(key=lambda event: event.get("confirmedAt") or event.get("completedAt") or event.get("updatedAt") or event.get("timestamp") or "")
    times = []
    for event in completed:
        moment = parse_date(event.get("confirmedAt") or event.get("completedAt") or event.get("updatedAt") or event.get("timestamp"))
        if moment:
            times.append(moment)
    intervals = [(right - left).total_seconds() / 3600 for left, right in zip(times, times[1:]) if right > left]
    average_hours = sum(intervals) / len(intervals) if intervals else None
    probabilities = None
    if len(intervals) >= 4 and average_hours and average_hours > 0:
        import math
        pending = any(event_is_reset(event) and event.get("status") == "forecast" for event in events)
        boost = 1.12 if pending else 1.0
        probabilities = {
            str(hours): round(min(99, max(1, (1 - math.exp(-hours / average_hours)) * boost * 100)))
            for hours in (24, 48, 72)
        }
    intervals_days = [value / 24 for value in intervals]
    last_reset = completed[-1] if completed else None
    pending_event = next((event for event in ordered_events if event_is_reset(event) and event.get("status") == "forecast"), None)
    return {
        "connected": bool(state.get("initialized") and state.get("monitorState") == "ok"),
        "status": {
            "state": state.get("monitorState", "starting"),
            "lastAttemptAt": state.get("lastAttemptAt"),
            "lastSuccessAt": state.get("lastSuccessAt"),
            "lastNewPostAt": state.get("lastNewPostAt"),
            "nextCheckAt": None,
            "consecutiveFailures": state.get("consecutiveFailures", 0),
            "error": state.get("lastError"),
            "postsFetched": state.get("postsFetched", 0),
        },
        "posts": sorted(posts, key=lambda post: post.get("createdAt", ""), reverse=True)[:100],
        "events": ordered_events[:100],
        "summary": {
            "resetCount": len(completed),
            "cardCount": sum(1 for event in events if event.get("category") == "compensation" or event.get("type") == "card"),
            "averageIntervalDays": round(average_hours / 24, 1) if average_hours else None,
            "longestIntervalDays": round(max(intervals_days), 1) if intervals_days else None,
            "lastResetAt": (last_reset.get("confirmedAt") or last_reset.get("completedAt") or last_reset.get("updatedAt") or last_reset.get("timestamp")) if last_reset else None,
            "pendingEventId": pending_event.get("id") if pending_event else None,
            "probabilities": probabilities,
            "accuracy": None,
        },
        "notifications": {
            "emailConfigured": configured_smtp(),
            "emailSubscribers": len(config.get("emails", [])),
            "feishuConfigured": bool(config.get("feishuWebhook")),
            "browserEvents": state.get("browserAlerts", [])[-50:],
        },
        "wishes": int(state.get("wishCount", 0)),
        "archive": load_json(DATA_DIR / "archive-meta.json", None),
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "WHENRESET-local/1.0"

    def log_message(self, format_string: str, *args) -> None:
        print(f"[{datetime.now().astimezone().strftime('%H:%M:%S')}] {self.address_string()} {format_string % args}")

    def respond(self, status: int, payload: dict, content_type: str = "application/json; charset=utf-8") -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def read_json(self) -> dict:
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            raise ValueError("Invalid Content-Length")
        if length <= 0 or length > 16_384:
            raise ValueError("Request body is empty or too large")
        raw = self.rfile.read(length)
        payload = json.loads(raw.decode("utf-8"))
        if not isinstance(payload, dict):
            raise ValueError("Expected a JSON object")
        return payload

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path in {"/api/data", "/data/site-data.json"}:
            self.respond(200, build_summary())
            return
        if path == "/favicon.ico":
            self.send_response(204)
            self.end_headers()
            return
        asset = ASSETS.get(path)
        if not asset:
            self.respond(404, {"error": "Not found"})
            return
        file_path, content_type = asset
        try:
            body = file_path.read_bytes()
        except OSError:
            self.respond(404, {"error": "Asset unavailable"})
            return
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        try:
            payload = self.read_json()
        except (ValueError, json.JSONDecodeError, UnicodeDecodeError) as exc:
            self.respond(400, {"ok": False, "error": str(exc)})
            return

        if path == "/api/subscribe/email":
            email = str(payload.get("email", "")).strip().lower()
            if not EMAIL_RE.fullmatch(email):
                self.respond(400, {"ok": False, "error": "Please enter a valid email address."})
                return
            config = load_json(CONFIG_PATH, {"emails": [], "feishuWebhook": "", "feishuSecret": ""})
            emails = config.setdefault("emails", [])
            added = email not in emails
            if added:
                emails.append(email)
                save_json(CONFIG_PATH, config)
            self.respond(200, {"ok": True, "added": added, "smtpConfigured": configured_smtp()})
            return

        if path == "/api/wish":
            state = load_json(STATE_PATH, {})
            count = int(state.get("wishCount", 0)) + 1
            state["wishCount"] = count
            save_json(STATE_PATH, state)
            self.respond(200, {"ok": True, "count": count})
            return

        if path == "/api/config/feishu":
            webhook = str(payload.get("webhook", "")).strip()
            secret = str(payload.get("secret", "")).strip()
            parsed = urlparse(webhook)
            if parsed.scheme != "https" or parsed.hostname not in {"open.feishu.cn", "open.larksuite.com"} or "/open-apis/bot/v2/hook/" not in parsed.path:
                self.respond(400, {"ok": False, "error": "请输入飞书/Lark 群机器人的 HTTPS Webhook。"})
                return
            ok, detail = send_feishu(webhook, secret, "WHENRESET 测试通知：本地提醒通道已连接。")
            if not ok:
                self.respond(502, {"ok": False, "error": f"测试消息发送失败：{detail}"})
                return
            config = load_json(CONFIG_PATH, {"emails": [], "feishuWebhook": "", "feishuSecret": ""})
            config["feishuWebhook"] = webhook
            config["feishuSecret"] = secret
            save_json(CONFIG_PATH, config)
            self.respond(200, {"ok": True, "configured": True})
            return

        self.respond(404, {"ok": False, "error": "Unknown endpoint"})


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    server.daemon_threads = True
    print(f"WHENRESET local site: http://{HOST}:{PORT}")
    print("This listener binds to this computer only. Press Ctrl+C to stop.")
    try:
        server.serve_forever(poll_interval=0.4)
    except KeyboardInterrupt:
        print("\nWHENRESET local site stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
