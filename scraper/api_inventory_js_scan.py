#!/usr/bin/env python3
"""
Fetch Next.js JS chunks and grep for hardcoded endpoint strings.
"""

import json
import re
import subprocess
import urllib.parse

BASE_URL = "https://regionalinvestment.bkpm.go.id"

CHUNK_PATTERNS = [
    r"_next/static/chunks/app/[^\"\']*page-[a-zA-Z0-9]+\.js",
    r"_next/static/chunks/\d+-[a-zA-Z0-9]+\.js",
    r"_next/static/chunks/main-[a-zA-Z0-9]+\.js",
    r"_next/static/chunks/webpack-[a-zA-Z0-9]+\.js",
    r"_next/static/chunks/framework-[a-zA-Z0-9]+\.js",
    r"_next/static/[^\"\']+\.js",
]

API_PATTERNS = [
    re.compile(r"(/be/[a-zA-Z0-9_\-/]+)"),
    re.compile(r"(/api/[a-zA-Z0-9_\-/]+)"),
    re.compile(r"(/v1/[a-zA-Z0-9_\-/]+)"),
    re.compile(r"(/v2/[a-zA-Z0-9_\-/]+)"),
    re.compile(r"(/rest/[a-zA-Z0-9_\-/]+)"),
    re.compile(r"(/svc/[a-zA-Z0-9_\-/]+)"),
    re.compile(r"(/graphql)"),
]

def fetch_html():
    result = subprocess.run(
        ["curl", "-s", "-L", "--max-time", "20", BASE_URL],
        capture_output=True,
        text=True,
        timeout=30,
    )
    return result.stdout

def fetch_js(url):
    result = subprocess.run(
        ["curl", "-s", "-L", "--max-time", "20", url],
        capture_output=True,
        text=True,
        timeout=30,
    )
    return result.stdout

def main():
    print("[+] Fetching homepage HTML to find JS chunks...")
    html = fetch_html()

    chunk_urls = set()
    for pattern in CHUNK_PATTERNS:
        for match in re.finditer(pattern, html):
            path = match.group(0)
            if path.startswith("http"):
                chunk_urls.add(path)
            else:
                chunk_urls.add(urllib.parse.urljoin(BASE_URL + "/", path))

    # Also look for any .js file
    for match in re.finditer(r'(https?://[^"\'\s]+|/_next/[^"\'\s]+)\.js', html):
        path = match.group(0)
        if "_next" in path:
            if path.startswith("http"):
                chunk_urls.add(path)
            else:
                chunk_urls.add(urllib.parse.urljoin(BASE_URL + "/", path))

    print(f"[+] Found {len(chunk_urls)} JS chunks to scan.")

    discovered = set()
    chunk_results = []

    for chunk_url in sorted(chunk_urls):
        print(f"  [FETCH] {chunk_url}")
        js_content = fetch_js(chunk_url)
        found_in_chunk = []
        for api_re in API_PATTERNS:
            for m in api_re.finditer(js_content):
                endpoint = m.group(1)
                # Filter out obvious false positives
                if len(endpoint) < 4:
                    continue
                if "//" in endpoint:
                    continue
                discovered.add(endpoint)
                found_in_chunk.append(endpoint)
        if found_in_chunk:
            chunk_results.append({"chunk": chunk_url, "endpoints": sorted(set(found_in_chunk))})

    output = {
        "source": "js_bundle_scan",
        "chunks_scanned": len(chunk_urls),
        "endpoints": sorted(discovered),
        "chunk_details": chunk_results,
    }

    with open("/media/lambda_one/DFSSD04/project/incubation/incubation_bkpm/scraper/api_inventory_js_scan.json", "w") as f:
        json.dump(output, f, indent=2)

    print(f"\n[+] JS scan complete. {len(discovered)} unique endpoint strings found.")
    for ep in sorted(discovered):
        print(f"    {ep}")

if __name__ == "__main__":
    main()
