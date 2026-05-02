#!/usr/bin/env python3
"""
Contact Enrichment Script
=========================
Fills missing contact data in bkpm_projects.json by calling the correct API endpoints:
- PPI/IPRO: /be/peluang/detail/{id}
- PID:      /be/peluang/detail_pid/{id}

Usage:
    cd scraper && python contact_enricher.py
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


class ContactEnricher:
    def __init__(self, delay: float = 1.5, max_concurrent: int = 5):
        self.delay = delay
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.enriched = 0
        self.unchanged = 0
        self.failed = 0

    @staticmethod
    def _clean_contacts(raw_contacts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Clean contact data from API response."""
        cleaned = []
        for c in raw_contacts:
            if not isinstance(c, dict):
                continue
            contact = {}
            for key in ['Kontak', 'Alamat', 'Telepon', 'Email', 'Website']:
                val = c.get(key)
                if val is not None:
                    val = str(val).strip()
                    if val in ['', '-', 'None', 'null']:
                        val = ''
                else:
                    val = ''
                contact[key] = val
            if contact.get('Kontak') or contact.get('Email') or contact.get('Telepon'):
                cleaned.append(contact)
        return cleaned

    async def _fetch_contacts(self, session: aiohttp.ClientSession, project_id: int, project_type: str) -> List[Dict[str, Any]]:
        """Fetch contacts for a single project from the appropriate API endpoint."""
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
                                    contacts = d.get('kontak', [])
                                    if contacts:
                                        return self._clean_contacts(contacts)
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
        """Enrich all projects with missing contacts."""
        to_enrich = [(i, p) for i, p in enumerate(projects) if not p.get('contacts')]
        logger.info(f"Projects with empty contacts: {len(to_enrich)} / {len(projects)}")

        if not to_enrich:
            return projects

        async with aiohttp.ClientSession() as session:
            tasks = []
            for idx, project in to_enrich:
                task = self._fetch_and_update(session, idx, project, projects)
                tasks.append(task)

            for task in tqdm.as_completed(tasks, total=len(tasks), desc="Enriching contacts"):
                await task

        logger.info(f"Enrichment complete: {self.enriched} enriched, {self.unchanged} still empty, {self.failed} failed")
        return projects

    async def _fetch_and_update(self, session: aiohttp.ClientSession, idx: int, project: Dict, all_projects: List[Dict]):
        """Fetch contacts for a single project and update the list."""
        pid = project['id']
        ptype = project.get('project_type', '')

        contacts = await self._fetch_contacts(session, pid, ptype)

        if contacts:
            all_projects[idx]['contacts'] = contacts
            all_projects[idx]['last_verified_at'] = self._now()
            self.enriched += 1
            logger.info(f"Project {pid} ({ptype}): {len(contacts)} contact(s) enriched")
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
    original_empty = sum(1 for p in projects if not p.get('contacts'))
    logger.info(f"Original empty contacts count: {original_empty}")

    enricher = ContactEnricher(delay=1.5, max_concurrent=5)
    enriched_projects = asyncio.run(enricher.enrich(projects))

    data['projects'] = enriched_projects
    data['metadata']['contacts_enriched_at'] = enricher._now()
    data['metadata']['contacts_enrichment_stats'] = {
        'original_empty': original_empty,
        'enriched': enricher.enriched,
        'still_empty': enricher.unchanged,
        'failed': enricher.failed
    }

    # Backup
    backup_path = DATA_PATH.with_suffix('.json.bak2')
    backup_path.write_text(DATA_PATH.read_text(encoding='utf-8'), encoding='utf-8')
    logger.info(f"Backup saved to {backup_path}")

    with open(DATA_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    logger.info(f"Data saved to {DATA_PATH}")
    logger.info(f"Summary: {enricher.enriched} projects enriched with contacts, {enricher.unchanged} still empty")


if __name__ == '__main__':
    main()
