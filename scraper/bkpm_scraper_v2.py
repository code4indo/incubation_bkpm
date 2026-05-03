#!/usr/bin/env python3
"""
BKPM PROJECT SCRAPER v2 — Enhanced Edition
Extracts COMPLETE project data including:
  - Full description from "Deskripsi" tab
  - All incentives from "Insentif" tab:
    * Tax Allowances (PP 78/2019)
    * Fasilitas Impor (PMK 176/2009)
    * Super Deduction — Vokasi (PMK 128/2019)
    * Super Deduction — Litbang (PMK 153/2020)
    * Tax Allowance details (30% neto reduction, 5%/yr x 6yr)
    * Dukungan Pemerintah Daerah

Usage:
  # Scrape single project with full details
  python bkpm_scraper_v2.py --project-id 1131 --output-format json

  # Scrape range
  python bkpm_scraper_v2.py --project-ids 1131,384,385 --output-format json

  # Scrape batch (respects rate limits)
  python bkpm_scraper_v2.py --batch projects_to_scrape.txt --output results/
"""

import asyncio
import argparse
import json
import logging
import os
import re
import sys
import time
from dataclasses import dataclass, field, asdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.parse import urljoin

# Third-party imports
import httpx
from playwright.async_api import async_playwright, Page, Browser

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-7s | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger('bkpm_scraper_v2')

# ── Constants ───────────────────────────────────────────────────────────────
BASE_URL = "https://regionalinvestment.bkpm.go.id"
LIST_URL = f"{BASE_URL}/be/peluang?page={{page}}"
DETAIL_URL = f"{BASE_URL}/peluang_investasi/detailed/{{id}}"
API_DETAIL_URL = f"{BASE_URL}/be/peluang/detail/{{id}}"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.0 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.0"
)
REQUEST_DELAY = 0.5  # seconds between requests


# ── Data Models ─────────────────────────────────────────────────────────────

@dataclass
class ProjectIncentives:
    """Stores incentive/facility data from the 'Insentif' tab."""
    tax_allowances: Optional[str] = None         # PP 78/2019, PMK 11/2020
    fasilitas_impor: Optional[str] = None         # PMK 176/2009
    super_deduction_vokasi: Optional[str] = None  # PMK 128/2019
    super_deduction_litbang: Optional[str] = None # PMK 153/2020
    tax_allowance_detail: Optional[str] = None    # 30% neto, 5%/yr x 6yr
    dukungan_pemda: Optional[str] = None          # PP 25/2014, PP 24/2019
    raw_text: Optional[str] = None                # Full raw incentive text

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class ProjectData:
    """Complete project data including incentives."""
    project_id: int
    title: str
    location: str
    province: str
    type: str                          # 'detailed' or 'regional'
    kbli_code: Optional[str] = None
    investment_value: Optional[float] = None   # in millions IDR
    year: Optional[int] = None
    irr: Optional[float] = None
    npv: Optional[float] = None                # in millions IDR
    payback_period: Optional[float] = None     # in years
    longitude: Optional[float] = None
    latitude: Optional[float] = None
    description_id: Optional[str] = None       # Full description from tab
    description_en: Optional[str] = None
    incentives: Optional[ProjectIncentives] = None
    contact: Optional[str] = None
    email: Optional[str] = None
    scraped_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> dict:
        d = asdict(self)
        if self.incentives:
            d['incentives'] = self.incentives.to_dict()
        return d


# ── Tab Incentives Parser ───────────────────────────────────────────────────

def parse_incentives(raw_text: str) -> ProjectIncentives:
    """
    Parse raw incentive text into structured categories.

    Expected sections in order:
      1. Tax Allowances
      2. Fasilitas Impor
      3. Super Deduction (contains Vokasi + Litbang subsections)
      4. Tax Allowance (detail rates)
      5. Dukungan Pemerintah Daerah
    """
    incentives = ProjectIncentives(raw_text=raw_text.strip())

    if not raw_text:
        return incentives

    text = raw_text.strip()

    # Section headers (case-insensitive)
    sections = [
        ('tax_allowances', r'Tax\s*Allowances'),
        ('fasilitas_impor', r'Fasilitas\s*Impor'),
        ('super_deduction', r'Super\s*Deduction'),
        ('tax_allowance_detail', r'Tax\s*Allowance\b(?!s)'),  # singular, not "Allowances"
        ('dukungan_pemda', r'Dukungan\s*Pemerintah\s*Daerah'),
    ]

    # Find all section positions
    section_positions = []
    for key, pattern in sections:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            section_positions.append((match.start(), key, match.group()))

    section_positions.sort(key=lambda x: x[0])

    # Extract content between sections
    for i, (pos, key, header) in enumerate(section_positions):
        start = pos + len(header)
        end = section_positions[i + 1][0] if i + 1 < len(section_positions) else len(text)
        content = text[start:end].strip()

        if key == 'tax_allowances':
            incentives.tax_allowances = clean_text(content)
        elif key == 'fasilitas_impor':
            incentives.fasilitas_impor = clean_text(content)
        elif key == 'super_deduction':
            # Parse Vokasi and Litbang subsections
            vokasi_match = re.search(
                r'(?:Vokasi|vokasi)[\s:]*(.+?)(?=Litbang|litbang|$)',
                content, re.DOTALL | re.IGNORECASE
            )
            litbang_match = re.search(
                r'(?:Litbang|litbang)[\s:]*(.+)',
                content, re.DOTALL | re.IGNORECASE
            )
            if vokasi_match:
                incentives.super_deduction_vokasi = clean_text(vokasi_match.group(1))
            if litbang_match:
                incentives.super_deduction_litbang = clean_text(litbang_match.group(1))
            # If no subsection match, store full content
            if not vokasi_match and not litbang_match:
                # Store as vokasi if contains vokasi keyword
                if 'vokasi' in content.lower():
                    incentives.super_deduction_vokasi = clean_text(content)
                else:
                    incentives.super_deduction_litbang = clean_text(content)
        elif key == 'tax_allowance_detail':
            incentives.tax_allowance_detail = clean_text(content)
        elif key == 'dukungan_pemda':
            incentives.dukungan_pemda = clean_text(content)

    return incentives


def clean_text(text: str) -> str:
    """Clean extracted text: remove excess whitespace, normalize newlines."""
    if not text:
        return ""
    # Remove bullet markers and normalize
    text = re.sub(r'^[\s•\-\*]+', '', text, flags=re.MULTILINE)
    # Collapse multiple newlines to single
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Collapse multiple spaces
    text = re.sub(r' {2,}', ' ', text)
    return text.strip()


# ── Scraper Engine ──────────────────────────────────────────────────────────

class BKPMScraperV2:
    """Enhanced BKPM scraper with full description and incentives extraction."""

    def __init__(self, output_dir: str = "scraped_data_v2"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.results: List[ProjectData] = []
        self.failed: List[Tuple[int, str]] = []

        # HTTP client
        self.client = httpx.AsyncClient(
            headers={"User-Agent": USER_AGENT},
            timeout=httpx.Timeout(30.0, connect=10.0),
            follow_redirects=True,
        )

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

    # ── Public API ──────────────────────────────────────────────────────────

    async def scrape_project(self, project_id: int, project_type: str = "detailed") -> Optional[ProjectData]:
        """Scrape a single project with FULL details including incentives."""
        logger.info("Scraping project %d (%s)", project_id, project_type)

        # Step 1: Try API endpoint first
        api_data = await self._fetch_api_detail(project_id)
        if api_data:
            project = self._build_from_api(project_id, api_data, project_type)
        else:
            project = ProjectData(
                project_id=project_id, title="", location="", province="", type=project_type
            )

        # Step 2: Use Playwright to get full description AND incentives from tabs
        try:
            tab_data = await self._scrape_detail_tabs(project_id, project_type)
            if tab_data.get("description"):
                project.description_id = tab_data["description"]
            if tab_data.get("incentives"):
                project.incentives = parse_incentives(tab_data["incentives"])
        except Exception as e:
            logger.warning("Tab scraping failed for %d: %s", project_id, e)

        # Validate
        if not project.title and not project.description_id:
            self.failed.append((project_id, "No data found"))
            return None

        return project

    async def scrape_batch(
        self,
        project_specs: List[Tuple[int, str]],
        delay: float = REQUEST_DELAY,
    ) -> None:
        """Scrape multiple projects with rate limiting."""
        logger.info("Batch scraping %d projects", len(project_specs))

        for idx, (pid, ptype) in enumerate(project_specs, 1):
            logger.info("[%d/%d] Project %d", idx, len(project_specs), pid)
            result = await self.scrape_project(pid, ptype)
            if result:
                self.results.append(result)
            await asyncio.sleep(delay)

        logger.info(
            "Batch complete: %d succeeded, %d failed",
            len(self.results), len(self.failed)
        )

    def save_results(self, fmt: str = "json") -> str:
        """Save scraped results to file."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = self.output_dir / f"bkpm_projects_v2_{timestamp}.{fmt}"

        data = [p.to_dict() for p in self.results]

        if fmt == "json":
            with open(filename, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        elif fmt == "jsonl":
            with open(filename, "w", encoding="utf-8") as f:
                for item in data:
                    f.write(json.dumps(item, ensure_ascii=False) + "\n")

        logger.info("Saved %d projects to %s", len(self.results), filename)
        return str(filename)

    # ── Private: API ────────────────────────────────────────────────────────

    async def _fetch_api_detail(self, project_id: int) -> Optional[dict]:
        """Fetch project data from BKPM API."""
        try:
            resp = await self.client.get(
                API_DETAIL_URL.format(id=project_id),
                headers={"Referer": DETAIL_URL.format(id=project_id)},
            )
            if resp.status_code != 200:
                return None
            data = resp.json()
            return data.get("data") if data.get("status") else None
        except Exception as e:
            logger.debug("API fetch failed for %d: %s", project_id, e)
            return None

    def _build_from_api(self, project_id: int, data: dict, ptype: str) -> ProjectData:
        """Build ProjectData from API response."""
        # Parse currency string to float (millions IDR)
        def parse_currency(val) -> Optional[float]:
            if val is None:
                return None
            s = str(val).replace("Rp", "").replace(".", "").replace(",", ".").strip()
            # Handle suffixes like M, B, T
            multipliers = {"M": 1, "B": 1000, "T": 1000000}
            for suffix, mult in multipliers.items():
                if suffix in s.upper():
                    try:
                        return float(s.upper().replace(suffix, "").strip()) * mult
                    except ValueError:
                        return None
            try:
                return float(s) / 1_000_000  # convert to millions
            except ValueError:
                return None

        # Parse percentage/float
        def parse_float(val) -> Optional[float]:
            if val is None:
                return None
            s = str(val).replace("%", "").replace(",", ".").strip()
            try:
                return float(s)
            except ValueError:
                return None

        # Parse year
        def parse_int(val) -> Optional[int]:
            if val is None:
                return None
            try:
                return int(val)
            except (ValueError, TypeError):
                return None

        return ProjectData(
            project_id=project_id,
            title=data.get("judul", ""),
            location=data.get("lokasi", ""),
            province=data.get("provinsi", ""),
            type=ptype,
            kbli_code=data.get("kode_kbli"),
            investment_value=parse_currency(data.get("investasi")),
            year=parse_int(data.get("tahun")),
            irr=parse_float(data.get("irr")),
            npv=parse_currency(data.get("npv")),
            payback_period=parse_float(data.get("payback_period")),
            longitude=parse_float(data.get("longitude")),
            latitude=parse_float(data.get("latitude")),
            description_id=data.get("deskripsi"),
            contact=data.get("kontak"),
            email=data.get("email"),
        )

    # ── Private: Playwright Tab Scraping ────────────────────────────────────

    async def _scrape_detail_tabs(
        self, project_id: int, project_type: str
    ) -> dict:
        """
        Use Playwright to scrape both 'Deskripsi' and 'Insentif' tabs.
        Returns dict with 'description' and 'incentives' keys.
        """
        result = {"description": None, "incentives": None}

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()

            try:
                url = DETAIL_URL.format(id=project_id)
                await page.goto(url, wait_until="domcontentloaded", timeout=60000)
                await asyncio.sleep(2.0)  # Allow JS to render tabs

                # ── Extract Description Tab ──
                desc_text = await self._extract_tab_content(page, "Deskripsi")
                if desc_text:
                    result["description"] = desc_text
                    logger.info("Project %d: Description extracted (%d chars)",
                                project_id, len(desc_text))

                # ── Extract Incentives Tab ──
                # Find and click the "Insentif" tab button
                incentif_clicked = await self._click_tab(page, "Insentif")
                if incentif_clicked:
                    await asyncio.sleep(0.8)  # Wait for content to appear
                    incentif_text = await self._extract_tab_content(page, "Insentif")
                    if incentif_text:
                        result["incentives"] = incentif_text
                        logger.info("Project %d: Incentives extracted (%d chars)",
                                    project_id, len(incentif_text))
                else:
                    # Try "Incentive" (English variant)
                    incentif_clicked = await self._click_tab(page, "Incentive")
                    if incentif_clicked:
                        await asyncio.sleep(0.8)
                        incentif_text = await self._extract_tab_content(page, "Incentive")
                        if incentif_text:
                            result["incentives"] = incentif_text

            except Exception as e:
                logger.warning("Playwright error for %d: %s", project_id, e)
            finally:
                await browser.close()

        return result

    async def _click_tab(self, page: Page, tab_name: str) -> bool:
        """Click a tab button by its text content."""
        try:
            # Try exact match first
            locator = page.locator(f"button:has-text('{tab_name}')")
            count = await locator.count()
            if count > 0:
                await locator.first.click()
                return True

            # Try contains match
            locator = page.locator(f"button:has-text('{tab_name}')")
            count = await locator.count()
            if count > 0:
                await locator.first.click()
                return True

            # Try by role
            buttons = await page.query_selector_all("button, [role='tab']")
            for btn in buttons:
                text = await btn.inner_text()
                if tab_name.lower() in text.lower():
                    await btn.click()
                    return True

            return False
        except Exception:
            return False

    async def _extract_tab_content(self, page: Page, tab_name: str) -> Optional[str]:
        """Extract text content from the active tab panel."""
        try:
            # Strategy 1: Find content by data attribute or class associated with tab
            # Look for tab panels (divs that contain the tab content)
            selectors = [
                # Common tab panel patterns
                "[role='tabpanel']",
                ".tab-content",
                ".tab-pane.active",
                "[data-state='active']",
                # BKPM-specific patterns
                "div[class*='tab']:not([class*='tabs'])",
                "div[class*='content']:not([class*='container'])",
            ]

            for selector in selectors:
                elements = await page.query_selector_all(selector)
                for elem in elements:
                    text = await elem.inner_text()
                    # Filter: content should be substantial (not just UI text)
                    if len(text) > 100:
                        return text.strip()

            # Strategy 2: Get all text after the tab buttons, filter
            full_text = await page.inner_text("body")

            # Find content after tab headers
            patterns = [
                rf'{tab_name}\s*\n(.+?)(?=\n\s*(?:Dukungan|Lokasi|Proyek|Contact|$))',
                rf'{tab_name}\s*\n\s*\n(.+)',
            ]
            for pattern in patterns:
                match = re.search(pattern, full_text, re.DOTALL | re.IGNORECASE)
                if match:
                    content = match.group(1).strip()
                    if len(content) > 50:
                        return content

            # Strategy 3: Get text from main content area
            main_content = await page.query_selector("main, article, .content, [class*='detail']")
            if main_content:
                text = await main_content.inner_text()
                return text.strip() if len(text) > 50 else None

            return None

        except Exception as e:
            logger.debug("Content extraction failed: %s", e)
            return None


# ── CLI ─────────────────────────────────────────────────────────────────────

def parse_project_ids(ids_str: str) -> List[Tuple[int, str]]:
    """Parse comma-separated project IDs."""
    result = []
    for part in ids_str.split(","):
        part = part.strip()
        if ":" in part:
            pid, ptype = part.split(":", 1)
            result.append((int(pid.strip()), ptype.strip()))
        else:
            result.append((int(part), "detailed"))
    return result


def main():
    parser = argparse.ArgumentParser(
        description="BKPM Project Scraper v2 — Full description + Incentives"
    )
    parser.add_argument("--project-id", type=int, help="Single project ID")
    parser.add_argument("--project-ids", help="Comma-separated IDs (e.g., 1131,384,385)")
    parser.add_argument("--batch", help="File with ID:TYPE lines")
    parser.add_argument("--output-format", choices=["json", "jsonl"], default="json")
    parser.add_argument("--output-dir", default="scraped_data_v2")
    parser.add_argument("--delay", type=float, default=REQUEST_DELAY)
    parser.add_argument("--verbose", "-v", action="store_true")
    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    # Collect project specs
    specs: List[Tuple[int, str]] = []
    if args.project_id:
        specs.append((args.project_id, "detailed"))
    elif args.project_ids:
        specs = parse_project_ids(args.project_ids)
    elif args.batch:
        with open(args.batch) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    specs.append(parse_project_ids(line)[0])
    else:
        # Default: test with project 1131
        specs.append((1131, "detailed"))
        print("No project IDs specified. Testing with project 1131 (Wamena Arabica).")
        print(f"Usage: python {sys.argv[0]} --project-ids 1131,384,385")

    # Run scraper
    async def run():
        async with BKPMScraperV2(output_dir=args.output_dir) as scraper:
            await scraper.scrape_batch(specs, delay=args.delay)
            output_file = scraper.save_results(fmt=args.output_format)

            # Print summary
            print(f"\n{'='*60}")
            print(f"SCRAPING COMPLETE")
            print(f"{'='*60}")
            print(f"Projects scraped: {len(scraper.results)}")
            print(f"Failed: {len(scraper.failed)}")
            print(f"Output: {output_file}")

            # Print incentive summary
            for p in scraper.results:
                if p.incentives:
                    print(f"\n--- Project {p.project_id}: {p.title} ---")
                    print(f"Description: {len(p.description_id or '')} chars")
                    inc = p.incentives
                    print(f"Incentives found:")
                    if inc.tax_allowances:
                        print(f"  ✓ Tax Allowances: {len(inc.tax_allowances)} chars")
                    if inc.fasilitas_impor:
                        print(f"  ✓ Fasilitas Impor: {len(inc.fasilitas_impor)} chars")
                    if inc.super_deduction_vokasi:
                        print(f"  ✓ Super Deduction (Vokasi): {len(inc.super_deduction_vokasi)} chars")
                    if inc.super_deduction_litbang:
                        print(f"  ✓ Super Deduction (Litbang): {len(inc.super_deduction_litbang)} chars")
                    if inc.tax_allowance_detail:
                        print(f"  ✓ Tax Allowance Detail: {len(inc.tax_allowance_detail)} chars")
                    if inc.dukungan_pemda:
                        print(f"  ✓ Dukungan Pemda: {len(inc.dukungan_pemda)} chars")

    asyncio.run(run())


if __name__ == "__main__":
    main()
