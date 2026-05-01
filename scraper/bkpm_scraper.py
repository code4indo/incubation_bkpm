#!/usr/bin/env python3
"""
BKPM PORTAL SCRAPER
===================
Production-grade scraper for https://regionalinvestment.bkpm.go.id/peluang_investasi

Requirements:
    pip install playwright beautifulsoup4 aiohttp aiofiles tqdm
    playwright install chromium

Usage:
    python bkpm_scraper.py --start-id 1 --end-id 1500 --output data/bkpm_projects.json
    
Architecture:
    - Uses Playwright for JavaScript rendering (Next.js ISR with client-side data)
    - Polite rate limiting (3-5s delay between requests)
    - Parallel scraping with semaphore (max 5 concurrent)
    - Automatic retry with exponential backoff
    - Data validation and quality scoring
"""

import asyncio
import argparse
import json
import logging
import re
import time
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Optional, List, Dict, Any

from playwright.async_api import async_playwright, Page, Browser
from bs4 import BeautifulSoup
from tqdm.asyncio import tqdm

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('bkpm_scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


@dataclass
class ProjectData:
    """Structured data model for BKPM investment projects"""
    id: int
    name_id: str = ""
    name_en: str = ""
    district: str = ""
    province: str = ""
    province_code: str = ""
    kbli_codes: List[str] = field(default_factory=list)
    investment_value_text: str = ""
    investment_value_idr: Optional[float] = None
    year: Optional[int] = None
    irr_percent: Optional[float] = None
    npv_text: str = ""
    npv_idr: Optional[float] = None
    payback_period_years: Optional[float] = None
    longitude: Optional[float] = None
    latitude: Optional[float] = None
    category: str = ""
    subcategory: str = ""
    likes_count: int = 0
    views_count: int = 0
    description_id: str = ""
    description_en: str = ""
    image_url: str = ""
    video_available: bool = False
    status: str = "unknown"  # "Data Tersedia" | "Data Tidak Tersedia" | "Data Parsial"
    data_quality_score: float = 0.0
    source_url: str = ""
    scraped_at: str = ""
    last_verified_at: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class DataGovernance:
    """Data validation, quality assessment, and lineage tracking"""
    
    REQUIRED_FIELDS = [
        'name_id', 'district', 'province', 'investment_value_idr',
        'year', 'longitude', 'latitude'
    ]
    
    FINANCIAL_FIELDS = ['irr_percent', 'npv_idr', 'payback_period_years']
    
    @classmethod
    def validate(cls, project: ProjectData) -> Dict[str, Any]:
        """Validate project data and compute quality score"""
        errors = []
        warnings = []
        
        # Check required fields
        for field in cls.REQUIRED_FIELDS:
            value = getattr(project, field)
            if value in [None, "", "Data Tidak Tersedia", "NaN"]:
                errors.append(f"Missing required field: {field}")
        
        # Check financial metrics
        for field in cls.FINANCIAL_FIELDS:
            value = getattr(project, field)
            if value in [None, 0, "", "0,0", "0%"]:
                warnings.append(f"Financial metric potentially missing/default: {field}")
        
        # Coordinate validation
        if project.longitude is not None and not (-180 <= project.longitude <= 180):
            errors.append(f"Invalid longitude: {project.longitude}")
        if project.latitude is not None and not (-90 <= project.latitude <= 90):
            errors.append(f"Invalid latitude: {project.latitude}")
        
        # Year validation
        if project.year is not None and not (2010 <= project.year <= 2030):
            warnings.append(f"Suspicious year: {project.year}")
        
        # Investment value validation
        if project.investment_value_idr is not None:
            if project.investment_value_idr < 1_000_000:  # Less than 1M
                warnings.append(f"Very small investment: Rp {project.investment_value_idr}")
            elif project.investment_value_idr > 100_000_000_000_000:  # More than 100T
                warnings.append(f"Very large investment: Rp {project.investment_value_idr}")
        
        # Compute quality score
        score = cls._compute_quality_score(project, errors, warnings)
        
        # Determine status
        if len(errors) == 0 and len(warnings) == 0:
            status = "Data Tersedia"
        elif len(errors) == 0 and len(warnings) > 0:
            status = "Data Parsial"
        else:
            status = "Data Tidak Tersedia"
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "quality_score": score,
            "status": status
        }
    
    @classmethod
    def _compute_quality_score(cls, project: ProjectData, errors: List, warnings: List) -> float:
        """Compute 0-100 quality score based on field completeness"""
        all_fields = [
            'name_id', 'district', 'province', 'kbli_codes', 'investment_value_idr',
            'year', 'irr_percent', 'npv_idr', 'payback_period_years',
            'longitude', 'latitude', 'category', 'description_id', 'likes_count', 'views_count'
        ]
        
        present = 0
        for field in all_fields:
            value = getattr(project, field)
            if value not in [None, "", "Data Tidak Tersedia", "NaN", [], 0, 0.0]:
                present += 1
        
        base_score = (present / len(all_fields)) * 100
        
        # Penalize errors heavily
        error_penalty = len(errors) * 10
        warning_penalty = len(warnings) * 2
        
        final_score = max(0, base_score - error_penalty - warning_penalty)
        return round(final_score, 1)
    
    @classmethod
    def enrich_metadata(cls, project: ProjectData) -> ProjectData:
        """Add computed/enriched fields"""
        # Add English translation placeholder (to be filled by NLP pipeline)
        if project.name_id and not project.name_en:
            project.name_en = project.name_id  # Will be translated by AI pipeline
        
        # Add source URL
        project.source_url = f"https://regionalinvestment.bkpm.go.id/peluang_investasi/detailed/{project.id}"
        
        # Add timestamps
        now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        if not project.scraped_at:
            project.scraped_at = now
        project.last_verified_at = now
        
        return project


class BKPMScraper:
    """Main scraper class with polite rate limiting and parallel execution"""
    
    BASE_URL = "https://regionalinvestment.bkpm.go.id/peluang_investasi/detailed/"
    CONCURRENCY = 5
    DELAY_MIN = 3
    DELAY_MAX = 5
    MAX_RETRIES = 3
    
    def __init__(self, output_dir: str = "data"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.semaphore = asyncio.Semaphore(self.CONCURRENCY)
        self.results: List[ProjectData] = []
        self.failed_ids: List[int] = []
        
    async def _init_browser(self) -> tuple[Browser, Page]:
        """Initialize headless browser with stealth settings"""
        playwright = await async_playwright().start()
        browser = await playwright.chromium.launch(
            headless=True,
            args=['--disable-blink-features=AutomationControlled']
        )
        
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1920, 'height': 1080},
            locale='id-ID',
        )
        
        page = await context.new_page()
        return playwright, browser, page
    
    async def _scrape_single(self, page: Page, project_id: int) -> Optional[ProjectData]:
        """Scrape a single project page"""
        url = f"{self.BASE_URL}{project_id}"
        
        for attempt in range(self.MAX_RETRIES):
            try:
                logger.info(f"Scraping project {project_id} (attempt {attempt + 1})")
                
                # Navigate with wait
                await page.goto(url, wait_until='networkidle', timeout=60000)
                await asyncio.sleep(3)  # Wait for dynamic content
                
                # Get page content
                content = await page.content()
                soup = BeautifulSoup(content, 'html.parser')
                
                # Extract data
                project = self._extract_data(soup, project_id)
                
                # Validate and compute quality
                validation = DataGovernance.validate(project)
                project.status = validation['status']
                project.data_quality_score = validation['quality_score']
                
                # Enrich metadata
                project = DataGovernance.enrich_metadata(project)
                
                logger.info(f"Project {project_id}: {project.name_id or 'NO NAME'} | "
                           f"Score: {project.data_quality_score} | "
                           f"Status: {project.status}")
                
                return project
                
            except Exception as e:
                logger.warning(f"Attempt {attempt + 1} failed for {project_id}: {e}")
                if attempt < self.MAX_RETRIES - 1:
                    wait_time = 2 ** attempt  # Exponential backoff
                    await asyncio.sleep(wait_time)
                else:
                    logger.error(f"Failed to scrape project {project_id} after {self.MAX_RETRIES} attempts")
                    self.failed_ids.append(project_id)
                    return None
    
    def _extract_data(self, soup: BeautifulSoup, project_id: int) -> ProjectData:
        """Extract structured data from BeautifulSoup"""
        project = ProjectData(id=project_id)
        
        # Get all text lines
        all_text = soup.get_text(separator='\n', strip=True)
        lines = [l.strip() for l in all_text.split('\n') if l.strip() and len(l.strip()) > 1]
        
        # Extract project name (usually near top, before "Kabupaten")
        for i, line in enumerate(lines):
            if 'Kabupaten' in line or 'Kota' in line:
                # Project name is likely 1-3 lines before this
                if i > 0:
                    potential_names = lines[max(0, i-3):i]
                    # Pick the longest meaningful one
                    project.name_id = max(potential_names, key=len, default="")
                break
        
        # Find specific fields using regex patterns
        for line in lines:
            line_lower = line.lower()
            
            # District
            if line.startswith('Kabupaten') or line.startswith('Kota'):
                project.district = line
            
            # Province
            if 'provinsi' in line_lower or re.match(r'^\s*[A-Z][a-z]+(\s+[A-Z][a-z]+)*\s*$', line):
                # Check if next lines contain coordinates (then this is province)
                pass
            
            # KBLI
            kbli_match = re.search(r'Kode\s*KBLI\s*[:\s]*([\d\s]+)', line, re.IGNORECASE)
            if kbli_match:
                project.kbli_codes = kbli_match.group(1).strip().split()
            
            # Investment value
            inv_match = re.search(r'Rp\s*([\d.,]+)\s*(Miliar|Triliun|Juta|M|T|B)', line, re.IGNORECASE)
            if inv_match:
                project.investment_value_text = line
                val_str = inv_match.group(1).replace('.', '').replace(',', '.')
                multiplier = {'miliar': 1e9, 'triliun': 1e12, 'juta': 1e6, 'm': 1e6, 't': 1e12, 'b': 1e9}.get(
                    inv_match.group(2).lower(), 1
                )
                project.investment_value_idr = float(val_str) * multiplier
            
            # Year
            year_match = re.search(r'Tahun\s*[:\s]*(\d{4})', line, re.IGNORECASE)
            if year_match:
                project.year = int(year_match.group(1))
            
            # IRR
            irr_match = re.search(r'IRR\s*[:\s]*([\d.,]+)\s*%', line, re.IGNORECASE)
            if irr_match:
                project.irr_percent = float(irr_match.group(1).replace(',', '.'))
            
            # NPV
            npv_match = re.search(r'NPV\s*[:\s]*Rp\s*([\d.,]+)\s*(Miliar|Triliun|Juta|M|T|B)?', line, re.IGNORECASE)
            if npv_match:
                project.npv_text = line
                val_str = npv_match.group(1).replace('.', '').replace(',', '.')
                multiplier = {'miliar': 1e9, 'triliun': 1e12, 'juta': 1e6}.get(
                    (npv_match.group(2) or '').lower(), 1
                )
                project.npv_idr = float(val_str) * multiplier
            
            # Payback
            pbp_match = re.search(r'Payback\s*Period\s*[:\s]*([\d.,]+)\s*Tahun', line, re.IGNORECASE)
            if pbp_match:
                project.payback_period_years = float(pbp_match.group(1).replace(',', '.'))
            
            # Coordinates
            long_match = re.search(r'Longitude\s*[:\s]*([-]?\d+\.\d+)', line, re.IGNORECASE)
            if long_match:
                project.longitude = float(long_match.group(1))
            
            lat_match = re.search(r'Latitude\s*[:\s]*([-]?\d+\.\d+)', line, re.IGNORECASE)
            if lat_match:
                project.latitude = float(lat_match.group(1))
        
        # Extract description
        desc_section = False
        desc_lines = []
        for line in lines:
            if 'Deskripsi' in line or 'Description' in line:
                desc_section = True
                continue
            if desc_section and len(line) > 20:
                desc_lines.append(line)
            if desc_section and ('Insentif' in line or 'Incentive' in line):
                break
        project.description_id = '\n'.join(desc_lines[:3])
        
        # Extract category from badge/tag
        category_elem = soup.find(string=re.compile(r'Industri|Agro|Pertanian|Perikanan|Energi|Digital'))
        if category_elem:
            project.category = category_elem.strip()
        
        # Extract likes and views
        likes_match = re.search(r'(\d+)\s*Sukai', all_text)
        if likes_match:
            project.likes_count = int(likes_match.group(1))
        
        views_match = re.search(r'(\d+)\s*(?:Views?|Dilihat)', all_text)
        if views_match:
            project.views_count = int(views_match.group(1))
        
        return project
    
    async def scrape_range(self, start_id: int, end_id: int) -> List[ProjectData]:
        """Scrape a range of project IDs with parallel execution"""
        playwright, browser, page = await self._init_browser()
        
        try:
            tasks = []
            for project_id in range(start_id, end_id + 1):
                task = self._scrape_with_semaphore(page, project_id)
                tasks.append(task)
            
            # Execute with progress bar
            results = []
            for coro in tqdm.as_completed(tasks, total=len(tasks), desc="Scraping projects"):
                result = await coro
                if result:
                    results.append(result)
            
            self.results = results
            return results
            
        finally:
            await browser.close()
            await playwright.stop()
    
    async def _scrape_with_semaphore(self, page: Page, project_id: int) -> Optional[ProjectData]:
        """Wrap scraping with semaphore for concurrency control"""
        async with self.semaphore:
            result = await self._scrape_single(page, project_id)
            
            # Polite delay
            delay = self.DELAY_MIN + (project_id % (self.DELAY_MAX - self.DELAY_MIN))
            await asyncio.sleep(delay)
            
            return result
    
    def save_results(self, filename: str = "bkpm_projects.json"):
        """Save scraped data to JSON with metadata"""
        output_path = self.output_dir / filename
        
        # Build data package with governance metadata
        data_package = {
            "metadata": {
                "source": "https://regionalinvestment.bkpm.go.id/peluang_investasi",
                "total_projects_expected": len(self.results) + len(self.failed_ids),
                "total_scraped": len(self.results),
                "total_failed": len(self.failed_ids),
                "failed_ids": self.failed_ids,
                "average_quality_score": round(
                    sum(p.data_quality_score for p in self.results) / len(self.results), 1
                ) if self.results else 0,
                "scraped_at": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                "scraper_version": "1.0.0",
                "data_governance": {
                    "validation_rules": "REQUIRED_FIELDS + FINANCIAL_FIELDS + COORDINATE_VALIDATION",
                    "quality_threshold": 60.0,
                    "enrichment_pipeline": "METADATA_ENRICHMENT + NLP_TRANSLATION(optional)"
                }
            },
            "projects": [p.to_dict() for p in self.results]
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data_package, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved {len(self.results)} projects to {output_path}")
        
        # Also save failed IDs for retry
        if self.failed_ids:
            failed_path = self.output_dir / "failed_ids.json"
            with open(failed_path, 'w') as f:
                json.dump({"failed_ids": self.failed_ids}, f, indent=2)
            logger.info(f"Saved {len(self.failed_ids)} failed IDs to {failed_path}")


def main():
    parser = argparse.ArgumentParser(description='BKPM Portal Scraper')
    parser.add_argument('--start-id', type=int, default=1, help='Start project ID')
    parser.add_argument('--end-id', type=int, default=1500, help='End project ID')
    parser.add_argument('--output', type=str, default='data/bkpm_projects.json', help='Output file')
    parser.add_argument('--concurrency', type=int, default=5, help='Max concurrent scrapes')
    parser.add_argument('--delay-min', type=int, default=3, help='Min delay between requests')
    parser.add_argument('--delay-max', type=int, default=5, help='Max delay between requests')
    
    args = parser.parse_args()
    
    # Override scraper settings
    BKPMScraper.CONCURRENCY = args.concurrency
    BKPMScraper.DELAY_MIN = args.delay_min
    BKPMScraper.DELAY_MAX = args.delay_max
    
    scraper = BKPMScraper()
    
    # Run scraper
    asyncio.run(scraper.scrape_range(args.start_id, args.end_id))
    scraper.save_results(args.output)
    
    # Print summary
    print("\n" + "="*60)
    print("SCRAPING COMPLETE")
    print("="*60)
    print(f"Total projects scraped: {len(scraper.results)}")
    print(f"Total failed: {len(scraper.failed_ids)}")
    print(f"Avg quality score: {sum(p.data_quality_score for p in scraper.results) / len(scraper.results):.1f}%" if scraper.results else "N/A")
    print(f"Output: {args.output}")
    print("="*60)


if __name__ == '__main__':
    main()
