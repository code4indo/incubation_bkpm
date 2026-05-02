#!/usr/bin/env python3
"""
KBLI Enrichment Script
======================
Fills missing KBLI codes in bkpm_projects.json by calling the correct API endpoints:
- PPI/IPRO: /be/peluang/detail/{id}
- PID:      /be/peluang/detail_pid/{id}

Usage:
    cd scraper && python kbli_enricher.py
"""
import asyncio
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional

import aiohttp
from tqdm.asyncio import tqdm

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent.parent
DATA_PATH = BASE_DIR / "data" / "bkpm_projects.json"

API_DETAIL_URL = "https://regionalinvestment.bkpm.go.id/be/peluang/detail"
API_DETAIL_PID_URL = "https://regionalinvestment.bkpm.go.id/be/peluang/detail_pid"


class KBLIEnricher:
    def __init__(self, delay: float = 1.5, max_concurrent: int = 5):
        self.delay = delay
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.enriched = 0
        self.failed = 0
        self.unchanged = 0

    def _parse_kbli(self, raw: Any) -> List[str]:
        """Parse KBLI from API response. Handles:
        - None / null -> []
        - '10801' -> ['10801']
        - '68111/  55900/ 68200/' -> ['68111', '55900', '68200']
        - 'null' (string) -> []
        """
        if raw is None:
            return []
        if isinstance(raw, str):
            raw = raw.strip()
            if raw.lower() == 'null' or raw == '':
                return []
            # Split by slash, comma, or space
            codes = []
            for part in raw.replace(',', ' ').split('/'):
                part = part.strip()
                if part.isdigit() and len(part) >= 3:  # KBLI min 3 digits
                    codes.append(part)
            return codes
        if isinstance(raw, list):
            return [str(k).strip() for k in raw if str(k).strip() and str(k).strip().lower() != 'null']
        return []

    async def _fetch_kbli(self, session: aiohttp.ClientSession, project_id: int, project_type: str) -> List[str]:
        """Fetch KBLI for a single project from the appropriate API endpoint."""
        async with self.semaphore:
            if project_type == "PID":
                url = f"{API_DETAIL_PID_URL}/{project_id}"
            else:
                url = f"{API_DETAIL_URL}/{project_id}"

            for attempt in range(3):
                try:
                    async with session.get(url, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                        if resp.status == 200:
                            data = await resp.json()
                            if data.get('success') and 'data' in data:
                                d = data['data']
                                if isinstance(d, dict):
                                    detail = d.get('detail', {})
                                    if isinstance(detail, dict):
                                        kbli = detail.get('kode_kbli')
                                        return self._parse_kbli(kbli)
                        else:
                            logger.warning(f"Project {project_id}: HTTP {resp.status}")
                except asyncio.TimeoutError:
                    logger.warning(f"Project {project_id}: Timeout (attempt {attempt + 1})")
                except Exception as e:
                    logger.warning(f"Project {project_id}: Error {type(e).__name__} (attempt {attempt + 1})")

                if attempt < 2:
                    await asyncio.sleep(2 ** attempt)

            return []

    async def enrich(self, projects: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Enrich all projects with missing KBLI."""
        # Filter projects with empty KBLI
        to_enrich = [(i, p) for i, p in enumerate(projects) if not p.get('kbli_codes')]
        logger.info(f"Projects with empty KBLI: {len(to_enrich)} / {len(projects)}")

        if not to_enrich:
            return projects

        async with aiohttp.ClientSession() as session:
            tasks = []
            for idx, project in to_enrich:
                task = self._fetch_and_update(session, idx, project, projects)
                tasks.append(task)

            for task in tqdm.as_completed(tasks, total=len(tasks), desc="Enriching KBLI"):
                await task

        logger.info(f"Enrichment complete: {self.enriched} enriched, {self.unchanged} still empty, {self.failed} failed")
        return projects

    async def _fetch_and_update(self, session: aiohttp.ClientSession, idx: int, project: Dict, all_projects: List[Dict]):
        """Fetch KBLI for a single project and update the list."""
        pid = project['id']
        ptype = project.get('project_type', '')

        kbli_codes = await self._fetch_kbli(session, pid, ptype)

        if kbli_codes:
            all_projects[idx]['kbli_codes'] = kbli_codes
            all_projects[idx]['last_verified_at'] = self._now()
            self.enriched += 1
            logger.info(f"Project {pid} ({ptype}): KBLI enriched -> {kbli_codes}")
        else:
            self.unchanged += 1

        await asyncio.sleep(self.delay)

    @staticmethod
    def _now() -> str:
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def main():
    logger.info(f"Loading data from {DATA_PATH}")
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    projects = data['projects']
    original_empty = sum(1 for p in projects if not p.get('kbli_codes'))
    logger.info(f"Original empty KBLI count: {original_empty}")

    enricher = KBLIEnricher(delay=1.5, max_concurrent=5)
    enriched_projects = asyncio.run(enricher.enrich(projects))

    data['projects'] = enriched_projects
    data['metadata']['kbli_enriched_at'] = enricher._now()
    data['metadata']['kbli_enrichment_stats'] = {
        'original_empty': original_empty,
        'enriched': enricher.enriched,
        'still_empty': enricher.unchanged,
        'failed': enricher.failed
    }

    # Backup original
    backup_path = DATA_PATH.with_suffix('.json.bak')
    backup_path.write_text(DATA_PATH.read_text(encoding='utf-8'), encoding='utf-8')
    logger.info(f"Backup saved to {backup_path}")

    with open(DATA_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    logger.info(f"Data saved to {DATA_PATH}")
    logger.info(f"Summary: {enricher.enriched} projects enriched with KBLI, {enricher.unchanged} still empty")


if __name__ == '__main__':
    main()
