#!/usr/bin/env python3
"""
Script to discover API endpoints from BKPM portal using Playwright.
Visits key pages, performs scrolling, and logs all network requests
matching API endpoint patterns.
"""

import asyncio
import json
from urllib.parse import urlparse
from playwright.async_api import async_playwright

BASE_URL = "https://regionalinvestment.bkpm.go.id"

PAGES_TO_VISIT = [
    {"url": "/", "name": "homepage", "scroll": True},
    {"url": "/peluang_investasi", "name": "peluang_investasi", "scroll": True},
    {"url": "/hilirisasi", "name": "hilirisasi", "scroll": True},
    {"url": "/daerah", "name": "daerah", "scroll": True},
    {"url": "/peluang_investasi/ipro/1531", "name": "detail_ipro", "scroll": False, "wait": 5000},
    {"url": "/informasi", "name": "informasi", "scroll": True},
]

PATTERNS = ["/be/", "/api/", "/v1/", "/v2/", "/graphql", "/rest/", "/svc/"]

def matches_pattern(url: str) -> bool:
    url_lower = url.lower()
    return any(p in url_lower for p in PATTERNS)

async def scroll_page(page):
    """Scroll to bottom to trigger lazy loading."""
    for _ in range(5):
        await page.evaluate("window.scrollBy(0, window.innerHeight)")
        await asyncio.sleep(0.3)
    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    await asyncio.sleep(0.5)

async def main():
    discovered = {}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1920, "height": 1080},
        )

        for page_info in PAGES_TO_VISIT:
            url = BASE_URL + page_info["url"]
            name = page_info["name"]
            print(f"[+] Visiting {name}: {url}")

            page = await context.new_page()

            async def handle_route(route, request):
                req_url = request.url
                if matches_pattern(req_url):
                    parsed = urlparse(req_url)
                    key = parsed.scheme + "://" + parsed.netloc + parsed.path
                    if key not in discovered:
                        discovered[key] = {
                            "url": req_url,
                            "path": parsed.path,
                            "page": name,
                            "method": request.method,
                            "params": parsed.query,
                        }
                        print(f"  [DISCOVERED] {request.method} {req_url}")
                await route.continue_()

            await page.route("**/*", handle_route)

            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            except Exception as e:
                print(f"  [!] Error loading {url}: {e}")
                await page.close()
                continue

            # Wait a bit for JS to fire initial requests
            await asyncio.sleep(2)

            if page_info.get("scroll"):
                await scroll_page(page)

            if page_info.get("wait"):
                await asyncio.sleep(page_info["wait"] / 1000)
            else:
                await asyncio.sleep(2)

            # Also capture from performance entries as fallback
            try:
                entries_json = await page.evaluate(
                    "() => JSON.stringify(performance.getEntriesByType('resource'))"
                )
                entries = json.loads(entries_json)
                for entry in entries:
                    req_url = entry.get("name", "")
                    if matches_pattern(req_url):
                        parsed = urlparse(req_url)
                        key = parsed.scheme + "://" + parsed.netloc + parsed.path
                        if key not in discovered:
                            discovered[key] = {
                                "url": req_url,
                                "path": parsed.path,
                                "page": name,
                                "method": "GET",
                                "params": parsed.query,
                            }
                            print(f"  [DISCOVERED-perf] GET {req_url}")
            except Exception as e:
                print(f"  [!] Error getting performance entries: {e}")

            await page.close()

        await browser.close()

    output = {
        "source": "playwright_network_capture",
        "base_url": BASE_URL,
        "endpoints": list(discovered.values()),
    }

    with open("/media/lambda_one/DFSSD04/project/incubation/incubation_bkpm/scraper/api_inventory_discovered.json", "w") as f:
        json.dump(output, f, indent=2)

    print(f"\n[+] Playwright scan complete. {len(discovered)} endpoints discovered.")
    return discovered

if __name__ == "__main__":
    asyncio.run(main())
