"""Export an explicit static artifact; source metadata is never published."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "_site"
ALLOWED = {
    ".nojekyll", "client.js", "favicon.svg", "index.html",
    "portfolio-chart.webp", "portfolio-cover.webp", "portfolio-detail.webp",
    "violet-wave.svg", "premium.css", "robots.txt", "sitemap.xml",
    "social-preview.jpg", "style.css", "cover-heart.webp", "cover-dna.webp",
    "cover-adaptation.webp", "cover-botany.webp", "cover-botany-detail.webp",
}


def package():
    if OUTPUT.is_symlink():
        raise RuntimeError("Output must not be a symlink")
    OUTPUT.mkdir(exist_ok=True)
    found = {p.relative_to(OUTPUT).as_posix() for p in OUTPUT.rglob("*")}
    if found - ALLOWED:
        raise RuntimeError(f"Unexpected output paths: {sorted(found - ALLOWED)}")
    # Only regular, tracked, unconflicted source files may enter the artifact.
    entries = subprocess.check_output(
        ["git", "ls-files", "--stage", "-z", "--", *sorted(ALLOWED)], cwd=ROOT
    ).split(b"\0")
    tracked = set()
    for entry in filter(None, entries):
        metadata, name = entry.split(b"\t", 1)
        mode, _, stage = metadata.split()
        if mode != b"100644" or stage != b"0":
            raise RuntimeError("Artifact contains a nonregular or conflicted source")
        tracked.add(name.decode("utf-8"))
    if tracked != ALLOWED:
        raise RuntimeError(f"Missing tracked assets: {sorted(ALLOWED - tracked)}")
    for name in ("index.html", "client.js"):
        text = (ROOT / name).read_text(encoding="utf-8")
        if any(value in text for value in ("/api/orders", "/api/login", "/admin", "orders.sqlite3")):
            raise RuntimeError("Private route in static output")
    manifest = {}
    for name in sorted(ALLOWED):
        source = ROOT / name
        if not source.is_file() or source.is_symlink():
            raise RuntimeError(f"Invalid source: {name}")
        target = OUTPUT / name
        if target.is_symlink():
            raise RuntimeError(f"Invalid output: {name}")
        shutil.copyfile(source, target)
        digest = hashlib.sha256(target.read_bytes()).hexdigest()
        if digest != hashlib.sha256(source.read_bytes()).hexdigest():
            raise RuntimeError(f"Copy mismatch: {name}")
        manifest[name] = digest
    if {p.name for p in OUTPUT.iterdir()} != ALLOWED:
        raise RuntimeError("Artifact file set mismatch")
    print(json.dumps({"files": manifest, "count": len(manifest)}, indent=2))


if __name__ == "__main__":
    package()
