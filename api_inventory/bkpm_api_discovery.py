#!/usr/bin/env python3
"""
Script to discover API endpoints on https://www.bkpm.go.id/
Uses Playwright to monitor network requests while visiting key pages.
"""

import asyncio
import json
from urllib.parse import urljoin, urlparse
from playwright.async_api import async_playwright

BASE_URL = "https://www.bkpm.go.id"

PAGES = [
    "/",
    "/id/halaman/data-investasi",
    "/id/halaman/berita",
    "/id/halaman/layanan-prioritas",
    "/id/halaman/kebijakan-dan-regulasi",
    "/id/halaman/tentang-bkpm",
]

API_PATTERNS = [
    "/api/",
    "/v1/",
    "/v2/",
    "/graphql",
    "/rest/",
    "/svc/",
    "/wp-json/",
    "/wp-admin/admin-ajax.php",
    "/ajax",
    "/json/",
    "/feed/",
    "/rss",
    "/wp-content/",
]

def is_api_url(url: str) -> bool:
    url_lower = url.lower()
    return any(pat in url_lower for pat in API_PATTERNS)

async def discover():
    results = {
        "cms_indicators": [],
        "api_endpoints": [],
        "page_html_snippets": {},
    }
    seen_urls = set()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )

        for page_path in PAGES:
            page_url = urljoin(BASE_URL, page_path)
            print(f"\n[+] Visiting: {page_url}")
            page = await context.new_page()

            # Capture network requests
            reqs = []
            def handle_route(route):
                url = route.request.url
                if is_api_url(url):
                    reqs.append({
                        "url": url,
                        "method": route.request.method,
                        "resource_type": route.request.resource_type,
                    })
                asyncio.create_task(route.continue_())

            await page.route("**/*", handle_route)

            try:
                await page.goto(page_url, wait_until="networkidle", timeout=60000)
            except Exception as e:
                print(f"    [!] Error loading page: {e}")
                await page.close()
                continue

            # Scroll to bottom to trigger lazy loading
            await page.evaluate("""
                async () => {
                    await new Promise(resolve => {
                        let totalHeight = 0;
                        const distance = 300;
                        const timer = setInterval(() => {
                            const scrollHeight = document.body.scrollHeight;
                            window.scrollBy(0, distance);
                            totalHeight += distance;
                            if (totalHeight >= scrollHeight) {
                                clearInterval(timer);
                                resolve();
                            }
                        }, 100);
                        setTimeout(() => { clearInterval(timer); resolve(); }, 8000);
                    });
                }
            """)

            # Wait extra 5 seconds after network idle
            await asyncio.sleep(5)

            # Get HTML snippet for CMS detection (only for homepage)
            if page_path == "/":
                html = await page.content()
                results["page_html_snippets"]["homepage"] = html

            # Collect unique API URLs
            for req in reqs:
                if req["url"] not in seen_urls:
                    seen_urls.add(req["url"])
                    results["api_endpoints"].append(req)
                    print(f"    [API] {req['method']} {req['url']}")

            await page.close()

        await context.close()
        await browser.close()

    # Save results
    with open("api_inventory/playwright_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"\n[*] Done. Found {len(results['api_endpoints'])} API-related requests.")
    return results

if __name__ == "__main__":
    asyncio.run(discover())
