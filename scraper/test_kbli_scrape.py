#!/usr/bin/env python3
"""Test script to inspect KBLI presence in BKPM detail pages via Playwright"""
import asyncio
import re
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        page = await context.new_page()

        test_cases = [
            (384, 'pid', 'PID tanpa KBLI'),
            (931, 'ppi', 'PPI tanpa KBLI'),
            (1131, 'ppi', 'PPI dengan KBLI'),
        ]

        for pid, ptype, label in test_cases:
            url = f'https://regionalinvestment.bkpm.go.id/peluang_investasi/detailed/{ptype}/{pid}'
            print(f'\n=== {label} | {ptype.upper()} ID {pid} ===')
            print(f'URL: {url}')
            try:
                await page.goto(url, wait_until='networkidle', timeout=45000)
                await asyncio.sleep(5)

                # Get full HTML
                html = await page.content()

                # Strategy 1: Look for KBLI text pattern in HTML
                kbli_matches = re.findall(r'KBLI\s*[:\-]?\s*(\d{5})', html, re.IGNORECASE)
                if kbli_matches:
                    print(f'  [HTML KBLI match]: {kbli_matches}')

                # Strategy 2: Look for data attributes or JSON in script tags
                scripts = re.findall(r'<script[^>]*>(.*?)</script>', html, re.DOTALL)
                for script in scripts:
                    kbli_in_script = re.findall(r'"kode_kbli"\s*:\s*"(\d+)"', script)
                    if kbli_in_script:
                        print(f'  [Script KBLI]: {kbli_in_script}')

                # Strategy 3: Visible text search
                text = await page.evaluate('() => document.body.innerText')
                lines = [l.strip() for l in text.split('\n') if l.strip()]
                for i, line in enumerate(lines):
                    if 'kbli' in line.lower():
                        print(f'  [Text line {i}]: {line[:120]}')
                    elif re.search(r'\b\d{5}\b', line) and any(k in line.lower() for k in ['kode', 'klasifikasi', 'sektor']):
                        print(f'  [Text line {i} possible KBLI]: {line[:120]}')

                # Strategy 4: Check if page has any 5-digit numbers that could be KBLI
                all_5digit = re.findall(r'\b(\d{5})\b', text)
                if all_5digit:
                    print(f'  [All 5-digit codes]: {list(set(all_5digit))[:10]}')

            except Exception as e:
                print(f'  ERROR: {type(e).__name__}: {e}')

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
