#!/usr/bin/env python3
"""
Test discovered endpoints with GET requests and extract JSON structure (keys only).
"""

import json
import re
import subprocess
import urllib.parse

BASE_URL = "https://regionalinvestment.bkpm.go.id"

def get_json_keys(obj, prefix=""):
    """Recursively extract keys from JSON object."""
    keys = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            keys.append(prefix + k)
            if isinstance(v, (dict, list)):
                keys.extend(get_json_keys(v, prefix + k + "."))
    elif isinstance(obj, list) and obj:
        keys.extend(get_json_keys(obj[0], prefix))
    return keys

def test_endpoint(path, full_url=None):
    url = full_url or (BASE_URL + path)
    try:
        result = subprocess.run(
            [
                "curl", "-s", "-L", "--max-redirs", "3",
                "--connect-timeout", "10",
                "--max-time", "20",
                "-H", "Accept: application/json",
                "-H", "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
                "-w", "\n__CURLMETA__%{http_code}|%{content_type}|%{size_download}",
                url,
            ],
            capture_output=True,
            text=True,
            timeout=30,
        )
        out = result.stdout
        meta_match = re.search(r'\n__CURLMETA__([0-9]+)\|([^|]*)\|(\d+)$', out)
        if meta_match:
            status = meta_match.group(1)
            ctype = meta_match.group(2)
            size = int(meta_match.group(3))
            body = out[:meta_match.start()]
        else:
            status = "???"
            ctype = ""
            size = len(out)
            body = out

        parsed = None
        keys = []
        if ctype and "json" in ctype.lower():
            try:
                parsed = json.loads(body)
                keys = get_json_keys(parsed)
            except Exception:
                pass
        elif body.strip().startswith(("{", "[")):
            try:
                parsed = json.loads(body)
                keys = get_json_keys(parsed)
            except Exception:
                pass

        return {
            "url": url,
            "path": path,
            "status": status,
            "content_type": ctype,
            "size": size,
            "json_keys": keys,
            "sample": body[:500] if not keys else None,
        }
    except Exception as e:
        return {
            "url": url,
            "path": path,
            "status": "ERR",
            "error": str(e),
        }

def load_discovered():
    endpoints = set()

    # From Playwright
    try:
        with open("/media/lambda_one/DFSSD04/project/incubation/incubation_bkpm/scraper/api_inventory_discovered.json") as f:
            data = json.load(f)
            for ep in data.get("endpoints", []):
                endpoints.add(ep.get("path", ""))
    except Exception as e:
        print(f"[!] Could not load discovered.json: {e}")

    # From bruteforce
    try:
        with open("/media/lambda_one/DFSSD04/project/incubation/incubation_bkpm/scraper/api_inventory_bruteforce.json") as f:
            data = json.load(f)
            for r in data.get("results", []):
                endpoints.add(r.get("path", ""))
    except Exception as e:
        print(f"[!] Could not load bruteforce.json: {e}")

    # From JS scan
    try:
        with open("/media/lambda_one/DFSSD04/project/incubation/incubation_bkpm/scraper/api_inventory_js_scan.json") as f:
            data = json.load(f)
            for ep in data.get("endpoints", []):
                endpoints.add(ep)
    except Exception as e:
        print(f"[!] Could not load js_scan.json: {e}")

    return sorted(e for e in endpoints if e)

def main():
    paths = load_discovered()
    print(f"[+] Testing {len(paths)} discovered endpoints...")

    results = []
    for path in paths:
        info = test_endpoint(path)
        status = info["status"]
        if status not in ("404", "000", "ERR"):
            results.append(info)
            print(f"  [{status}] {path} keys={len(info.get('json_keys', []))}")
        else:
            print(f"  [{status}] {path}")

    with open("/media/lambda_one/DFSSD04/project/incubation/incubation_bkpm/scraper/api_inventory_tested.json", "w") as f:
        json.dump({"source": "endpoint_testing", "results": results}, f, indent=2)

    print(f"\n[+] Testing complete. {len(results)} accessible endpoints documented.")

if __name__ == "__main__":
    main()
