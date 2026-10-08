"""Import the public WHENRESET archive once as local history; future checks use X."""

import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from monitor import DATA_DIR, EVENTS_PATH, POSTS_PATH, load_json, save_json


ARCHIVE_URL = "https://whenreset.com.cn/api/prediction-v2"
META_PATH = DATA_DIR / "archive-meta.json"


def fetch_archive() -> dict:
    request = urllib.request.Request(
        ARCHIVE_URL,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36",
            "Accept": "application/json",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def map_post(item: dict) -> dict:
    created = item.get("createdAt") or item.get("created_at") or ""
    text = item.get("textEn") or item.get("bodyEn") or item.get("text") or ""
    return {
        "id": str(item.get("id") or ""),
        "author": item.get("author") or "thsottiaux",
        "createdAt": created,
        "text": text,
        "summaryZh": item.get("summaryZh") or item.get("bodyZh") or item.get("text") or "",
        "summaryEn": item.get("summaryEn") or item.get("bodyEn") or "",
        "url": item.get("url") or (f"https://x.com/thsottiaux/status/{item['id']}" if item.get("id") else ""),
        "source": item.get("source") or "public archive snapshot",
        "classification": item.get("displayType"),
        "eventStatus": item.get("displayState"),
    }


def map_event(item: dict) -> dict:
    original_type = item.get("type") or "reset"
    summary_zh = item.get("summary") or ""
    summary_en = item.get("summaryEn") or ""
    category = "compensation" if original_type == "card" else "usage_reset"
    summary_text = f"{summary_zh} {summary_en}".casefold()
    if "banked" in summary_text or "预存" in summary_text:
        category = "banked_reset"
    status_value = item.get("status")
    completed = status_value == "completed" or bool(item.get("completedAt"))
    if original_type == "card":
        status = "compensation"
    elif completed and item.get("officialStatus") == "no-confirmation-post":
        status = "community"
    elif completed:
        status = "confirmed"
    else:
        status = "forecast"
    created = item.get("timestamp") or item.get("occurred") or ""
    updated = item.get("completedAt") or created
    return {
        "id": str(item.get("id") or item.get("occurrenceId") or ""),
        "occurrenceId": item.get("occurrenceId"),
        "category": category,
        "status": status,
        "titleZh": summary_zh or "额度动态",
        "titleEn": summary_en or "Usage update",
        "summaryZh": summary_zh,
        "summaryEn": summary_en,
        "createdAt": created,
        "updatedAt": updated,
        "confirmedAt": item.get("completedAt") if completed else None,
        "timeWindow": item.get("window"),
        "postIds": [str(post_id) for post_id in (item.get("postIds") or [])],
        "timeline": [],
        "lastPostId": None,
        "lastPostUrl": None,
        "latestText": summary_zh,
        "officialStatus": item.get("officialStatus"),
        "verification": item.get("verification"),
        "confirmationSource": item.get("confirmationSource"),
        "verified": item.get("verified"),
        "archiveSource": "whenreset.com.cn public API",
        "lastAlertedStatus": status,
    }


def merge_events(existing: list[dict], incoming: list[dict]) -> list[dict]:
    merged = list(existing)
    for candidate in incoming:
        duplicate = None
        for event in merged:
            same_id = candidate.get("id") and event.get("id") == candidate.get("id")
            same_occurrence = candidate.get("occurrenceId") and event.get("occurrenceId") == candidate.get("occurrenceId")
            shared_posts = set(candidate.get("postIds", [])) & set(event.get("postIds", []))
            close_same_type = False
            if candidate.get("category") == event.get("category"):
                try:
                    left = datetime.fromisoformat((candidate.get("createdAt") or "").replace("Z", "+00:00"))
                    right = datetime.fromisoformat((event.get("createdAt") or "").replace("Z", "+00:00"))
                    close_same_type = abs((left - right).total_seconds()) <= 6 * 3600
                except ValueError:
                    pass
            if same_id or same_occurrence or shared_posts or close_same_type:
                duplicate = event
                break
        if duplicate is None:
            merged.append(candidate)
            continue
        duplicate["postIds"] = list(dict.fromkeys(duplicate.get("postIds", []) + candidate.get("postIds", [])))
        duplicate["archiveSource"] = candidate.get("archiveSource")
        if candidate.get("status") in {"confirmed", "compensation", "cap_increase"} and duplicate.get("status") not in {"confirmed", "compensation", "cap_increase"}:
            duplicate["status"] = candidate["status"]
            duplicate["confirmedAt"] = candidate.get("confirmedAt")
        if candidate.get("summaryZh") and not duplicate.get("summaryZh"):
            duplicate["summaryZh"] = candidate["summaryZh"]
            duplicate["summaryEn"] = candidate.get("summaryEn")
    return sorted(merged, key=lambda item: item.get("updatedAt", ""), reverse=True)


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    existing_meta = load_json(META_PATH, None)
    if existing_meta:
        print(json.dumps({"ok": True, "alreadyImported": True, **existing_meta}, ensure_ascii=False))
        return
    archive = fetch_archive()
    source_posts = archive.get("posts") or []
    source_events = archive.get("events") or []
    current_posts = load_json(POSTS_PATH, [])
    by_id = {str(item.get("id")): item for item in source_posts if item.get("id")}
    for item in current_posts:
        if item.get("id"):
            by_id[str(item["id"])] = item
    merged_posts = [map_post(item) for item in by_id.values() if item.get("createdAt") or item.get("created_at")]
    merged_posts.sort(key=lambda item: item.get("createdAt", ""), reverse=True)
    for item in current_posts:
        for index, mapped in enumerate(merged_posts):
            if mapped.get("id") == item.get("id"):
                merged_posts[index] = item
                break
    events = merge_events(load_json(EVENTS_PATH, []), [map_event(item) for item in source_events])
    save_json(POSTS_PATH, merged_posts[:200])
    save_json(EVENTS_PATH, events[:200])
    meta = {
        "source": ARCHIVE_URL,
        "importedAt": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "postsImported": len(source_posts),
        "eventsImported": len(source_events),
    }
    save_json(META_PATH, meta)
    print(json.dumps({"ok": True, **meta, "localPosts": len(merged_posts), "localEvents": len(events)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
