"""Fetch X locally, update the public data, and push it to GitHub Pages."""

from __future__ import annotations

import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LOG_DIR = ROOT / "data" / "diagnostics"
LOG_PATH = LOG_DIR / "github-pages-sync.log"


def run(command: list[str], *, allow_failure: bool = False) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(command, cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    if result.stdout:
        with LOG_PATH.open("a", encoding="utf-8") as log:
            log.write(f"[{datetime.now(timezone.utc).isoformat(timespec='seconds')}] {' '.join(command)}\n")
            log.write(result.stdout.rstrip() + "\n")
        print(result.stdout, end="")
    if result.returncode and not allow_failure:
        raise RuntimeError(f"Command failed ({result.returncode}): {' '.join(command)}")
    return result


def main() -> int:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    if LOG_PATH.exists() and LOG_PATH.stat().st_size > 1_000_000:
        LOG_PATH.replace(LOG_PATH.with_suffix(".log.1"))

    try:
        run(["git", "pull", "--ff-only", "origin", "main"])
        scrape = run([sys.executable, "monitor.py", "--once"], allow_failure=True)
        if scrape.returncode:
            print("X fetch failed; publishing the updated monitor status.")
        run([sys.executable, "tools/build_site.py"])
        run(["git", "add", "--", "data/state.json", "data/posts.json", "data/events.json", "data/site-data.json"])

        changed = run(["git", "diff", "--cached", "--quiet"], allow_failure=True)
        if changed.returncode == 1:
            run(["git", "commit", "-m", "Update public reset monitor data"])
            push = run(["git", "push", "origin", "main"], allow_failure=True)
            if push.returncode:
                run(["git", "pull", "--rebase", "origin", "main"])
                run(["git", "push", "origin", "main"])
        elif changed.returncode:
            raise RuntimeError("Could not inspect staged monitor changes.")
    except (OSError, RuntimeError) as exc:
        with LOG_PATH.open("a", encoding="utf-8") as log:
            log.write(f"[{datetime.now(timezone.utc).isoformat(timespec='seconds')}] ERROR: {exc}\n")
        print(f"Publish failed: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
