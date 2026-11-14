"""Local Chromium checks with synthetic data; never navigate to external services.

Requires Python Playwright and Chromium. Run while a loopback HTTP server is serving
the project on port 8765. Reports/synthetic screenshots go to work/browser only.
Known bug reproductions are evidence, not assertions that the website is fixed.
"""
import json
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "work/browser"
BASE = "http://127.0.0.1:8765/"


def run():
    OUT.mkdir(parents=True, exist_ok=True)
    report = {"mode": "headless Chromium, viewport emulation; not real mobile devices",
              "external_requests_blocked": [], "viewports": []}
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path="/usr/bin/chromium", headless=True,
                                     args=["--no-sandbox"])
        report["browser_version"] = browser.version
        for width in (320, 390, 430, 1440):
            context = browser.new_context(viewport={"width": width, "height": 900},
                                          reduced_motion="reduce")

            def local_only(route):
                url = route.request.url
                if urlsplit(url).netloc == "127.0.0.1:8765":
                    route.continue_()
                else:
                    # Avoid storing any external URL/query or form data.
                    report["external_requests_blocked"].append("external request blocked")
                    route.abort()

            context.route("**/*", local_only)
            page = context.new_page()
            errors, failed_responses = [], []
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.on("response", lambda r: failed_responses.append(r.status) if r.status >= 400 else None)
            page.goto(BASE, wait_until="networkidle")
            page.screenshot(path=str(OUT / f"forma-{width}.png"), full_page=True)
            item = {"width": width, "height": 900, "page_errors": errors,
                    "failed_http_statuses": failed_responses}
            item["layout"] = page.evaluate("""() => ({
                viewport: innerWidth, document: document.documentElement.scrollWidth,
                portfolioY: document.querySelector('#portfolio').getBoundingClientRect().top,
                comparisonY: document.querySelector('#comparison').getBoundingClientRect().top,
                globalFocusOutlineSyntaxValid: CSS.supports('outline', '2px solid:#e1c8ff'),
                topicFontSize: getComputedStyle(document.querySelector('#topic')).fontSize,
                reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches
            })""")
            assert item["layout"]["document"] <= width, "Unexpected horizontal page overflow"
            if width < 981:
                page.locator("#nav-toggle").focus()
                page.keyboard.press("Enter")
                assert page.locator("#mobile-nav").is_visible()
                page.locator('#mobile-nav a[href="#portfolio"]').focus()
                page.keyboard.press("Enter")
                assert not page.locator("#mobile-nav").is_visible()
                item["anchor_focus"] = page.evaluate("""() => ({
                    activeTag: document.activeElement.tagName,
                    targetHasFocus: document.activeElement === document.querySelector('#portfolio'),
                    hashMatches: location.hash === '#portfolio'
                })""")
                page.locator("#nav-toggle").click()
                page.keyboard.press("Escape")
                assert not page.locator("#mobile-nav").is_visible()
                assert page.locator("#nav-toggle").evaluate("e => e === document.activeElement")
            page.locator('[data-filter="science"]').click()
            assert page.locator('[data-filter="science"]').get_attribute("aria-pressed") == "true"
            assert page.locator('.portfolio-slide:not([hidden])').count() > 0
            page.locator('.portfolio-slide:not([hidden])').first.click()
            assert page.locator("#portfolio-dialog").is_visible()
            page.keyboard.press("Escape")
            assert not page.locator("#portfolio-dialog").is_visible()
            item["portfolio_filter_dialog"] = "PASS"
            faq = page.locator(".faq-list details").first
            faq.locator("summary").click()
            assert faq.get_attribute("open") is not None
            item["faq"] = "PASS"
            page.locator("#send").click()
            assert page.locator("#form-error").is_visible()
            assert page.locator("#topic").get_attribute("aria-invalid") == "true"
            item["required_empty_validation"] = "PASS"
            page.locator("#topic").fill("FORMA synthetic topic A")
            page.locator("#name").fill("Synthetic QA")
            page.locator("#contact").fill("qa@example.invalid")
            page.locator("#consent").check()
            page.locator("#send").click()
            assert page.locator("#success").is_visible()
            original = page.locator("#telegram-send").get_attribute("href")
            page.locator("#topic").fill("FORMA synthetic topic B")
            item["stale_draft_reproduced"] = (
                page.locator("#telegram-send").get_attribute("href") == original
                and page.locator("#success").is_visible())
            page.locator("#again").click()
            page.locator("#send").click()
            assert page.locator("#telegram-send").get_attribute("href") != original
            item["explicit_reprepare_updates_link"] = "PASS"
            page.locator("#again").click()
            page.locator("#topic").fill("   ")
            page.locator("#name").fill("   ")
            page.locator("#send").click()
            item["whitespace_required_fields_accepted"] = page.locator("#success").is_visible()
            item["external_telegram_link_clicked"] = False
            assert not errors, errors
            assert not failed_responses, failed_responses
            report["viewports"].append(item)
            context.close()
        browser.close()
    (OUT / "results.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    run()
