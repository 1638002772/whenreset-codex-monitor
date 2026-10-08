"""Build the static GitHub Pages site from the monitor's public data."""

from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from server import build_summary  # noqa: E402


def main() -> None:
    data_path = ROOT / "data" / "site-data.json"
    data_path.write_text(json.dumps(build_summary(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    output = ROOT / "dist"
    output.mkdir(exist_ok=True)
    for name in ("index.html", "styles.css", "signal-console.css", "app.js"):
        shutil.copy2(ROOT / name, output / name)
    output_data = output / "data"
    output_data.mkdir(exist_ok=True)
    shutil.copy2(data_path, output_data / data_path.name)


if __name__ == "__main__":
    main()
