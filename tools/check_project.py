"""Offline, read-only smoke checks; no browser or external requests."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
import re
import tomllib
from urllib.parse import urlsplit, unquote
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.urls, self.canonical = [], [], []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("id"):
            self.ids.append(a["id"])
        for key in ("src", "href"):
            if a.get(key):
                self.urls.append(a[key])
        if tag == "link" and a.get("rel") == "canonical":
            self.canonical.append(a["href"])


def main():
    page = Page()
    page.feed((ROOT / "index.html").read_text())
    errors = []
    errors.extend(f"Duplicate ID: {i}" for i, n in Counter(page.ids).items() if n > 1)
    for url in page.urls:
        parts = urlsplit(url)
        if parts.scheme or parts.netloc:
            continue
        if not parts.path and parts.fragment and unquote(parts.fragment) not in page.ids:
            errors.append(f"Missing anchor: {url}")
        if parts.path and not (ROOT / unquote(parts.path)).exists():
            errors.append(f"Missing resource: {url}")
    js_ids = re.findall(r'\$\("([^"\n]+)"\)', (ROOT / "client.js").read_text())
    errors.extend(f"Missing JS ID: {i}" for i in sorted(set(js_ids) - set(page.ids)))
    sitemap = ET.parse(ROOT / "sitemap.xml")
    locations = [e.text for e in sitemap.findall(".//{*}loc")]
    if len(page.canonical) != 1 or page.canonical[0] not in locations:
        errors.append("Canonical missing from sitemap")
    if page.canonical and f"Sitemap: {page.canonical[0]}sitemap.xml" not in (ROOT / "robots.txt").read_text():
        errors.append("robots sitemap mismatch")
    config_path = ROOT / ".codex/config.toml"
    config = tomllib.loads(config_path.read_text())
    names = {"ui_auditor", "qa_auditor", "release_auditor", "frontend_implementer"}
    for name in sorted(names):
        role = config["agents"][name]
        file = config_path.parent / role["config_file"]
        data = tomllib.loads(file.read_text())
        if not role.get("description") or not data.get("developer_instructions"):
            errors.append(f"Missing role instructions: {name}")
        if name.endswith("auditor") and data.get("sandbox_mode") != "read-only":
            errors.append(f"Auditor sandbox is not read-only: {name}")
    if errors:
        raise SystemExit("FAIL\n" + "\n".join(errors))
    print(f"PASS: HTML IDs ({len(page.ids)}), anchors/local resources, literal JS IDs, sitemap/robots, TOML and four role references")
    print("NOT RUN: browser/device flows, external links, Telegram delivery, live publication, runtime config loading")


if __name__ == "__main__":
    main()
