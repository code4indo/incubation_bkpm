#!/usr/bin/env bash
set -euo pipefail

BASE="https://www.bkpm.go.id"
OUTDIR="api_inventory"
mkdir -p "$OUTDIR"

echo "=== BRUTE FORCE COMMON API PATHS ===" | tee "$OUTDIR/brute_force_results.txt"

paths=(
  "/api/"
  "/wp-json/"
  "/wp-json/wp/v2/"
  "/api/v1/"
  "/graphql"
  "/swagger"
  "/openapi.json"
  "/rest/"
  "/json/"
  "/feed/"
  "/rss/"
  "/rss"
  "/feed"
  "/wp-json/wp/v2/posts"
  "/wp-json/wp/v2/pages"
  "/wp-json/wp/v2/media"
  "/wp-json/wp/v2/categories"
  "/wp-json/wp/v2/tags"
  "/wp-json/wp/v2/types"
  "/wp-json/wp/v2/users"
  "/wp-json/wp/v2/taxonomies"
  "/wp-json/wp/v2/comments"
  "/wp-json/wp/v2/search"
  "/wp-json/wp/v2/blocks"
  "/wp-json/wp/v2/block-types"
  "/wp-json/wp/v2/templates"
  "/wp-json/wp/v2/template-parts"
  "/wp-json/wp/v2/settings"
  "/wp-json/wp/v2/menu-items"
  "/wp-json/wp/v2/menus"
  "/wp-json/wp/v2/menu-locations"
  "/wp-json/wp/v2/themes"
  "/wp-json/wp/v2/plugins"
  "/wp-json/wp/v2/sidebars"
  "/wp-json/wp/v2/widgets"
  "/wp-json/wp/v2/widget-types"
  "/wp-json/wp/v2/navigation"
  "/wp-json/wp/v2/font-families"
  "/wp-json/wp/v2/font-collections"
  "/wp-json/"
  "/wp-json/wp/v2"
  "/xmlrpc.php"
  "/wp-admin/admin-ajax.php"
  "/wp-includes/"
  "/wp-content/"
  "/wp-content/plugins/"
  "/wp-content/themes/"
  "/sitemap.xml"
  "/sitemap_index.xml"
  "/robots.txt"
  "/.well-known/"
  "/wp-login.php"
  "/wp-admin/"
)

for p in "${paths[@]}"; do
    url="${BASE}${p}"
    echo "--- Testing: $url ---" | tee -a "$OUTDIR/brute_force_results.txt"
    # Perform GET with redirect following, get status and content-type
    resp=$(curl -sSL -D - -o - -m 15 -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "$url" 2>/dev/null || echo "CURL_ERROR")
    status=$(echo "$resp" | grep -E '^HTTP' | tail -1 | awk '{print $2}')
    ctype=$(echo "$resp" | grep -i "content-type:" | tail -1 | sed 's/.*: //')
    body=$(echo "$resp" | sed '0,/\r\n\r\n/d')
    echo "Status: $status | Content-Type: $ctype" | tee -a "$OUTDIR/brute_force_results.txt"
    # Print first 500 chars of body
    echo "$body" | head -c 500 | tee -a "$OUTDIR/brute_force_results.txt"
    echo -e "\n" | tee -a "$OUTDIR/brute_force_results.txt"
done

echo "=== BRUTE FORCE DONE ===" | tee -a "$OUTDIR/brute_force_results.txt"
