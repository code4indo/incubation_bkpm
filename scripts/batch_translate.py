#!/usr/bin/env python3
"""
Batch Translation Agent — qwen2.5:14b
Translates all 181 BKPM projects from Indonesian to English.
Resume-capable. Saves progress every 5 projects.
"""

import json
import re
import time
import sys
from pathlib import Path
from datetime import datetime
import urllib.request
import urllib.error

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "qwen2.5:14b"
BATCH_SAVE = 5
RATE_LIMIT_SECONDS = 0.5
TIMEOUT_SECONDS = 120
MAX_RETRIES = 3

PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "app" / "src" / "data"
SOURCE_JSON = DATA_DIR / "bkpmRealData.json"
PROGRESS_JSON = DATA_DIR / "translationProgress.json"

SYSTEM_PROMPT = """You are an expert translator for Indonesian investment and business documents, specializing in projects from BKPM (Indonesia Investment Coordinating Board).

YOUR TASK:
Translate Indonesian investment project names and descriptions into professional, formal English suitable for international investors, investment banks, and multinational corporations.

RULES:
1. Use precise industry-standard terminology:
   - "pabrik pengolahan" → "processing plant"
   - "kawasan ekonomi khusus" → "Special Economic Zone (SEZ)"
   - "hilirisasi" → "downstream processing"
   - "pakan ternak" → "animal feed"
   - "pengolahan" → "processing"
   - "industri" → "industry" (as prefix)
   - "perkebunan" → "plantation"
   - "pariwisata" → "tourism"
   - "pembangkit listrik" → "power plant"
   - "karet remah" → "crumb rubber"
   - "pewarna tekstil" → "textile dyeing"
   - "penyosohan beras" → "rice polishing"
   - "tambang" → "mining" / "mine"
   - "smelter" → "smelter" (keep as-is)
   - "bahan baku" → "raw materials"
   - "nilai tambah" → "value-added"
   - "pangan" → "food"
   - "pertanian" → "agriculture"
   - "perikanan" → "fisheries"
   - "peternakan" → "animal husbandry"
   - "komoditas" → "commodity"
   - "produksi" → "production"
   - "kapasitas" → "capacity"
   - "lapangan kerja" → "employment" / "jobs"
   - "ekspor" → "export"
   - "impor" → "import"
   - "investasi" → "investment"
   - "lahan" → "land"
   - "hektar" → "hectares"
   - "ton" → "tons"
   - "modal" → "capital"
   - "keuntungan" → "profit" / "returns"
   - "analisis kelayakan" → "feasibility study"

2. Preserve all numerical values, percentages, currency amounts, and financial metrics exactly as written.
3. Keep acronyms and technical terms in their standard English form (e.g., NPV, IRR, KBLI stays as KBLI if untranslatable).
4. Maintain formal, investment-grade tone. Do NOT use casual language.
5. Keep the output length similar to the original.
6. For project names: produce a concise, professional English title (max 10 words).
7. For descriptions: translate the full text with proper business English.

OUTPUT FORMAT (STRICT JSON):
{
  "name_en": "English project name",
  "description_en": "English description"
}

Do not output anything outside the JSON."""


def load_source_projects():
    with open(SOURCE_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("projects", [])


def load_progress():
    if PROGRESS_JSON.exists():
        with open(PROGRESS_JSON, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "translations": [],
        "metadata": {
            "total_projects": 181,
            "translated_count": 0,
            "pending_count": 181,
            "model": MODEL,
            "mode": "direct-fast",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "strategy": "Qwen2.5 batch translation"
        }
    }


def save_progress(progress):
    progress["metadata"]["last_updated"] = datetime.utcnow().isoformat() + "Z"
    progress["metadata"]["translated_count"] = len(progress["translations"])
    progress["metadata"]["pending_count"] = progress["metadata"]["total_projects"] - len(progress["translations"])
    with open(PROGRESS_JSON, "w", encoding="utf-8") as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)
    print(f"\n  💾 Saved progress: {len(progress['translations'])}/{progress['metadata']['total_projects']}")


def translate_project(name_id, description_id, retry=0):
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"""Translate this Indonesian investment project to English:

PROJECT NAME:
{name_id}

DESCRIPTION:
{description_id}

Output JSON only."""
            }
        ],
        "stream": False,
        "options": {
            "temperature": 0.1,
            "top_p": 0.9,
            "top_k": 40
        }
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        OLLAMA_URL,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as resp:
            result = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        if retry < MAX_RETRIES:
            wait = 2 ** retry
            print(f"\n  ⚠️ Error (retry {retry + 1}/{MAX_RETRIES} after {wait}s): {e}")
            time.sleep(wait)
            return translate_project(name_id, description_id, retry + 1)
        raise e

    content = result.get("message", {}).get("content", "") or result.get("response", "")
    match = re.search(r'\{[\s\S]*\}', content)
    if not match:
        if retry < MAX_RETRIES:
            wait = 2 ** retry
            print(f"\n  ⚠️ No JSON found (retry {retry + 1}/{MAX_RETRIES} after {wait}s)")
            time.sleep(wait)
            return translate_project(name_id, description_id, retry + 1)
        raise ValueError("No JSON found in response")

    parsed = json.loads(match.group(0))
    return {
        "name_en": parsed.get("name_en", name_id),
        "description_en": parsed.get("description_en", description_id)
    }


def main():
    projects = load_source_projects()
    progress = load_progress()
    existing_map = {t["id"]: t for t in progress["translations"]}

    total = len(projects)
    translated_count = len(progress["translations"])

    print(f"🚀 Batch Translation Agent")
    print(f"   Model: {MODEL}")
    print(f"   Total projects: {total}")
    print(f"   Already translated: {translated_count}")
    print(f"   Remaining: {total - translated_count}")
    print(f"   Progress file: {PROGRESS_JSON}")
    print("-" * 60)

    for i, project in enumerate(projects):
        pid = project["id"]

        if pid in existing_map:
            print(f"[{i+1:03d}/{total}] ⏭️  SKIP (already translated) — {project['name_id'][:50]}")
            continue

        name_id = project.get("name_id") or ""
        desc_id = project.get("description_id") or ""

        print(f"[{i+1:03d}/{total}] 🔄 Translating — {name_id[:50]}...", end="", flush=True)

        try:
            start = time.time()
            result = translate_project(name_id, desc_id)
            latency = (time.time() - start) * 1000

            entry = {
                "id": pid,
                "name_id": name_id,
                "name_en": result["name_en"],
                "description_id": desc_id,
                "description_en": result["description_en"],
                "latency_ms": round(latency, 1)
            }
            progress["translations"].append(entry)
            existing_map[pid] = entry
            print(f" ✅ ({latency:.0f}ms)")

            if len(progress["translations"]) % BATCH_SAVE == 0:
                save_progress(progress)

        except Exception as e:
            print(f" ❌ FAILED: {e}")

        if i < total - 1:
            time.sleep(RATE_LIMIT_SECONDS)

    save_progress(progress)
    print("\n" + "=" * 60)
    print(f"🎉 DONE! Translated {len(progress['translations'])}/{total} projects.")
    print(f"   Output: {PROGRESS_JSON}")


if __name__ == "__main__":
    main()
