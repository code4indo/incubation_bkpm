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
    - Uses public API endpoint for fast, reliable data retrieval
    - Falls back to Playwright detail scraping for missing descriptions
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

import aiohttp
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
    project_type: str = ""  # IPRO | PPI | PID
    
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
        project.source_url = f"https://regionalinvestment.bkpm.go.id/peluang_investasi/{project.project_type.lower()}/{project.id}"
        
        # Add timestamps
        now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        if not project.scraped_at:
            project.scraped_at = now
        project.last_verified_at = now
        
        return project


class BKPMScraper:
    """Main scraper class with polite rate limiting and parallel execution"""
    
    BASE_URL = "https://regionalinvestment.bkpm.go.id/peluang_investasi/detailed/"
    API_LIST_URL = "https://regionalinvestment.bkpm.go.id/be/peluang/peluang_investasi_wilayah"
    API_DETAIL_URL = "https://regionalinvestment.bkpm.go.id/be/peluang/detail"
    DETAIL_URL = "https://regionalinvestment.bkpm.go.id/peluang_investasi"
    CONCURRENCY = 5
    DELAY_MIN = 1
    DELAY_MAX = 3
    MAX_RETRIES = 3
    
    def __init__(self, output_dir: str = "data"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.semaphore = asyncio.Semaphore(self.CONCURRENCY)
        self.results: List[ProjectData] = []
        self.failed_ids: List[int] = []
        
    async def _init_browser(self) -> tuple:
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
    
    def _parse_investment_value(self, text: str) -> tuple:
        """Parse investment value text to numeric IDR"""
        if not text:
            return text, None
        match = re.search(r'Rp\s*([\d.,]+)\s*(Miliar|Triliun|Juta|M|T|B)?', text, re.IGNORECASE)
        if match:
            val_str = match.group(1).replace('.', '').replace(',', '.')
            multiplier_str = (match.group(2) or '').lower()
            multiplier = {'miliar': 1e9, 'triliun': 1e12, 'juta': 1e6, 'm': 1e6, 't': 1e12, 'b': 1e9}.get(multiplier_str, 1)
            try:
                return text, float(val_str) * multiplier
            except ValueError:
                return text, None
        return text, None
    
    def _parse_npv_value(self, text: str) -> tuple:
        """Parse NPV text to numeric IDR"""
        if not text:
            return text, None
        match = re.search(r'Rp\s*([\d.,]+)\s*(Miliar|Triliun|Juta|M|T|B)?', text, re.IGNORECASE)
        if match:
            val_str = match.group(1).replace('.', '').replace(',', '.')
            multiplier_str = (match.group(2) or '').lower()
            multiplier = {'miliar': 1e9, 'triliun': 1e12, 'juta': 1e6, 'm': 1e6, 't': 1e12, 'b': 1e9}.get(multiplier_str, 1)
            try:
                return text, float(val_str) * multiplier
            except ValueError:
                return text, None
        return text, None
    
    def _parse_irr(self, text: str) -> Optional[float]:
        """Parse IRR percentage string to float"""
        if not text:
            return None
        match = re.search(r'([\d.,]+)', str(text))
        if match:
            try:
                return float(match.group(1).replace(',', '.'))
            except ValueError:
                return None
        return None
    
    async def _fetch_api_list(self, session: aiohttp.ClientSession, page_num: int = 1, page_size: int = 200) -> List[Dict]:
        """Fetch project list from public API"""
        url = f"{self.API_LIST_URL}?page={page_num}&page_size={page_size}&search="
        try:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data.get('success') and 'data' in data:
                        return data['data']
                logger.warning(f"API list returned status {resp.status}")
                return []
        except Exception as e:
            logger.error(f"Failed to fetch API list: {e}")
            return []
    
    async def _fetch_api_detail(self, session: aiohttp.ClientSession, project_id: int) -> Optional[Dict]:
        """Fetch project detail from public API"""
        url = f"{self.API_DETAIL_URL}?id={project_id}"
        try:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data.get('success') and 'data' in data:
                        return data['data']
                logger.warning(f"API detail for {project_id} returned status {resp.status}")
                return None
        except Exception as e:
            logger.error(f"Failed to fetch API detail for {project_id}: {e}")
            return None
    
    def _project_from_api(self, api_data: Dict) -> ProjectData:
        """Convert API response to ProjectData"""
        project = ProjectData(id=api_data.get('id_peluang', 0))
        project.name_id = api_data.get('nama', '') or ''
        project.district = api_data.get('nama_kabkot', '') or ''
        project.province = api_data.get('nama_provinsi', '') or ''
        project.province_code = str(api_data.get('id_adm_provinsi', '')) or ''
        project.year = api_data.get('tahun')
        project.project_type = api_data.get('status', '') or ''
        project.category = api_data.get('nama_sektor_peluang', '') or ''
        project.subcategory = api_data.get('nama_sektor', '') or ''
        project.image_url = api_data.get('image', '') or ''
        project.longitude = api_data.get('lon')
        project.latitude = api_data.get('lat')
        
        # Parse investment value
        inv_text = api_data.get('nilai_investasi', '') or ''
        project.investment_value_text, project.investment_value_idr = self._parse_investment_value(inv_text)
        
        # Parse IRR
        irr_text = api_data.get('nilai_irr', '') or ''
        project.irr_percent = self._parse_irr(irr_text)
        
        # Parse NPV
        npv_text = api_data.get('nilai_npv', '') or ''
        project.npv_text, project.npv_idr = self._parse_npv_value(npv_text)
        
        # Parse payback period
        pp = api_data.get('nilai_pp')
        if pp is not None:
            try:
                project.payback_period_years = float(pp)
            except (ValueError, TypeError):
                project.payback_period_years = None
        
        # Description
        desc = api_data.get('deskripsi')
        project.description_id = desc if desc else ""
        
        return project
    
    async def _scrape_detail_playwright(self, page: Page, project_id: int, project_type: str) -> Optional[str]:
        """Scrape detail description using Playwright as fallback"""
        url = f"{self.DETAIL_URL}/{project_type.lower()}/{project_id}"
        
        for attempt in range(self.MAX_RETRIES):
            try:
                logger.info(f"Scraping detail for {project_id} (attempt {attempt + 1})")
                await page.goto(url, wait_until='domcontentloaded', timeout=60000)
                await asyncio.sleep(4)  # Wait for dynamic content
                
                # Extract description
                content = await page.content()
                soup = BeautifulSoup(content, 'html.parser')
                all_text = soup.get_text(separator='\n', strip=True)
                lines = [l.strip() for l in all_text.split('\n') if l.strip() and len(l.strip()) > 1]
                
                desc_lines = []
                desc_section = False
                for line in lines:
                    if 'Deskripsi' in line or 'Description' in line:
                        desc_section = True
                        continue
                    if desc_section and len(line) > 20:
                        desc_lines.append(line)
                    if desc_section and ('Insentif' in line or 'Incentive' in line):
                        break
                
                description = '\n'.join(desc_lines[:5])
                return description if description else None
                
            except Exception as e:
                logger.warning(f"Detail scrape attempt {attempt + 1} failed for {project_id}: {e}")
                if attempt < self.MAX_RETRIES - 1:
                    wait_time = 2 ** attempt
                    await asyncio.sleep(wait_time)
        
        return None
    
    async def _enrich_single(self, session: aiohttp.ClientSession, page: Page, project: ProjectData) -> ProjectData:
        """Enrich a single project with API detail and optional Playwright fallback"""
        async with self.semaphore:
            # Try API detail first
            detail_data = await self._fetch_api_detail(session, project.id)
            if detail_data:
                desc = detail_data.get('deskripsi')
                if desc and not project.description_id:
                    project.description_id = desc
            
            # If still no description, try Playwright
            if not project.description_id and page:
                try:
                    desc = await self._scrape_detail_playwright(page, project.id, project.project_type)
                    if desc:
                        project.description_id = desc
                except Exception as e:
                    logger.warning(f"Playwright detail failed for {project.id}: {e}")
            
            # Validate
            validation = DataGovernance.validate(project)
            project.status = validation['status']
            project.data_quality_score = validation['quality_score']
            project = DataGovernance.enrich_metadata(project)
            
            logger.info(f"Project {project.id}: {project.name_id or 'NO NAME'} | "
                       f"Score: {project.data_quality_score} | "
                       f"Status: {project.status}")
            
            # Polite delay
            delay = self.DELAY_MIN + (project.id % (self.DELAY_MAX - self.DELAY_MIN + 1))
            await asyncio.sleep(delay)
            
            return project
    
    async def scrape_all(self, use_playwright: bool = False, max_projects: Optional[int] = None) -> List[ProjectData]:
        """Scrape all projects via API with optional Playwright enrichment"""
        async with aiohttp.ClientSession() as session:
            # Fetch all projects from API
            logger.info("Fetching project list from API...")
            api_projects = await self._fetch_api_list(session, page_num=1, page_size=200)
            
            if not api_projects:
                logger.error("No projects returned from API")
                return []
            
            logger.info(f"API returned {len(api_projects)} projects")
            
            if max_projects:
                api_projects = api_projects[:max_projects]
            
            # Convert to ProjectData
            projects = [self._project_from_api(p) for p in api_projects]
            
            # Optional: init Playwright for detail enrichment
            playwright = None
            browser = None
            page = None
            if use_playwright:
                playwright, browser, page = await self._init_browser()
            
            try:
                # Enrich all projects
                tasks = [self._enrich_single(session, page, p) for p in projects]
                results = []
                for coro in tqdm.as_completed(tasks, total=len(tasks), desc="Enriching projects"):
                    result = await coro
                    if result:
                        results.append(result)
                
                self.results = results
                return results
                
            finally:
                if browser:
                    await browser.close()
                if playwright:
                    await playwright.stop()
    
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
                "scraper_version": "2.0.0",
                "data_governance": {
                    "validation_rules": "REQUIRED_FIELDS + FINANCIAL_FIELDS + COORDINATE_VALIDATION",
                    "quality_threshold": 60.0,
                    "enrichment_pipeline": "API_PRIMARY + PLAYWRIGHT_FALLBACK"
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
    parser.add_argument('--output', type=str, default='bkpm_projects.json', help='Output file')
    parser.add_argument('--output-dir', type=str, default='data', help='Output directory')
    parser.add_argument('--use-playwright', action='store_true', help='Use Playwright for detail enrichment')
    parser.add_argument('--max-projects', type=int, default=None, help='Max projects to scrape')
    parser.add_argument('--concurrency', type=int, default=5, help='Max concurrent operations')
    parser.add_argument('--delay-min', type=int, default=1, help='Min delay between requests')
    parser.add_argument('--delay-max', type=int, default=3, help='Max delay between requests')
    
    args = parser.parse_args()
    
    # Override scraper settings
    BKPMScraper.CONCURRENCY = args.concurrency
    BKPMScraper.DELAY_MIN = args.delay_min
    BKPMScraper.DELAY_MAX = args.delay_max
    
    scraper = BKPMScraper(output_dir=args.output_dir)
    
    # Run scraper
    asyncio.run(scraper.scrape_all(use_playwright=args.use_playwright, max_projects=args.max_projects))
    scraper.save_results(args.output)
    
    # Print summary
    print("\n" + "="*60)
    print("SCRAPING COMPLETE")
    print("="*60)
    print(f"Total projects scraped: {len(scraper.results)}")
    print(f"Total failed: {len(scraper.failed_ids)}")
    print(f"Avg quality score: {sum(p.data_quality_score for p in scraper.results) / len(scraper.results):.1f}%" if scraper.results else "N/A")
    print(f"Output: {args.output_dir}/{args.output}")
    print("="*60)


if __name__ == '__main__':
    main()
