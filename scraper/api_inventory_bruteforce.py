#!/usr/bin/env python3
"""
Brute-force common API paths on the BKPM portal.
"""

import json
import subprocess
import urllib.parse

BASE_URL = "https://regionalinvestment.bkpm.go.id"

PATHS_TO_TEST = [
    "/api/",
    "/api",
    "/be/",
    "/be",
    "/api/v1/",
    "/api/v2/",
    "/graphql",
    "/swagger",
    "/swagger-ui.html",
    "/swagger-ui/",
    "/openapi.json",
    "/api-docs",
    "/api/docs",
    "/rest/",
    "/svc/",
    "/be/home/",
    "/be/home",
    "/be/daerah/",
    "/be/daerah",
    "/be/probis/",
    "/be/probis",
    "/be/global/",
    "/be/global",
    "/be/peluang/",
    "/be/peluang",
    "/be/informasi/",
    "/be/informasi",
    "/be/hilirisasi/",
    "/be/hilirisasi",
    "/be/ipro/",
    "/be/ipro",
    "/be/api/",
    "/be/api",
    "/be/v1/",
    "/be/v2/",
    "/be/content/",
    "/be/content",
    "/be/menu/",
    "/be/menu",
    "/be/slider/",
    "/be/slider",
    "/be/search/",
    "/be/search",
    "/api/content/",
    "/api/menu/",
    "/api/slider/",
    "/api/search/",
    "/api/home/",
    "/api/daerah/",
    "/api/probis/",
    "/api/global/",
    "/api/peluang/",
    "/api/informasi/",
    "/api/hilirisasi/",
    "/api/ipro/",
    "/api/v1/content/",
    "/api/v1/menu/",
    "/api/v1/slider/",
    "/api/v1/search/",
    "/api/v1/home/",
    "/api/v1/daerah/",
    "/api/v1/probis/",
    "/api/v1/global/",
    "/api/v1/peluang/",
    "/api/v1/informasi/",
    "/api/v1/hilirisasi/",
    "/api/v1/ipro/",
]

def curl_probe(path):
    url = BASE_URL + path
    try:
        result = subprocess.run(
            [
                "curl", "-s", "-o", "/dev/null", "-w",
                "%{http_code}|%{content_type}|%{size_download}",
                "-L", "--max-redirs", "3",
                "--connect-timeout", "10",
                "--max-time", "15",
                "-H", "Accept: application/json",
                "-H", "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
                url,
            ],
            capture_output=True,
            text=True,
            timeout=20,
        )
        out = result.stdout.strip()
        parts = out.split("|", 2)
        status = parts[0] if len(parts) > 0 else "???"
        ctype = parts[1] if len(parts) > 1 else ""
        size = parts[2] if len(parts) > 2 else "0"
        return {"status": status, "content_type": ctype, "size": size, "url": url}
    except Exception as e:
        return {"status": "ERR", "content_type": "", "size": "0", "url": url, "error": str(e)}

def main():
    results = []
    for path in PATHS_TO_TEST:
        info = curl_probe(path)
        status = info["status"]
        # Keep anything that isn't a plain 404 or 403 (sometimes APIs return 403 for auth)
        if status not in ("404", "000"):
            results.append({"path": path, **info})
            print(f"  [{status}] {path} ({info.get('content_type','')})")
        else:
            print(f"  [{status}] {path}")

    with open("/media/lambda_one/DFSSD04/project/incubation/incubation_bkpm/scraper/api_inventory_bruteforce.json", "w") as f:
        json.dump({"source": "bruteforce", "results": results}, f, indent=2)

    print(f"\n[+] Brute-force complete. {len(results)} interesting paths found.")

if __name__ == "__main__":
    main()
