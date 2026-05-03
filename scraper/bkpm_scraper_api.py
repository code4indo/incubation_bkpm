#!/usr/bin/env python3
"""
BKPM PROJECT SCRAPER — API-Only Edition (v3)
Extracts COMPLETE project data from BKPM API including:
  - Full description (deskripsi field — already complete)
  - All incentives (insentif array: Tax Allowances, Fasilitas Impor, Super Deduction, Tax Allowance, Dukungan Pemda)
  - Contact info (kontak array)
  - Gallery photos (galeri + info arrays)
  - Project details (detail object: KBLI, investment, IRR, NPV, payback, coords, etc.)

No Playwright needed — pure API calls, fast and reliable.

Usage:
  python bkpm_scraper_api.py --project-id 1131
  python bkpm_scraper_api.py --project-ids 1131,384,385,1516
  python bkpm_scraper_api.py --batch-file projects.txt --output results.json
"""

import argparse
import json
import logging
import re
import sys
import time
from dataclasses import dataclass, field, asdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

import requests

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-7s | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger('bkpm_api')

API_DETAIL = "https://regionalinvestment.bkpm.go.id/be/peluang/detail/{id}"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.0"


# ── Data Models ─────────────────────────────────────────────────────────────

@dataclass
class IncentiveItem:
    name: str
    regulation: str           # Extracted regulation references
    description: str
    benefits: List[str]       # Extracted benefit items (bullet points)


@dataclass
class ProjectContact:
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


@dataclass
class ScrapedProject:
    project_id: int
    title: str
    short_title: Optional[str] = None
    location: str = ""
    province: str = ""
    industrial_zone: Optional[str] = None  # lokasi_kawasan
    sector: str = ""
    kbli_code: Optional[str] = None
    investment_value_idr: Optional[str] = None
    investment_value_raw: Optional[float] = None  # in millions
    year: Optional[int] = None
    irr_percent: Optional[float] = None
    npv_idr: Optional[str] = None
    npv_raw: Optional[float] = None  # in millions
    payback_years: Optional[float] = None
    longitude: Optional[float] = None
    latitude: Optional[float] = None
    description_id: Optional[str] = None       # Full description
    description_short: Optional[str] = None     # Short version
    status: Optional[str] = None               # RE/PUBLISH, etc.
    visitor_count: Optional[int] = None
    # Collections
    incentives: List[IncentiveItem] = field(default_factory=list)
    contacts: List[ProjectContact] = field(default_factory=list)
    gallery_urls: List[str] = field(default_factory=list)
    document_urls: List[str] = field(default_factory=list)
    video_url: Optional[str] = None
    main_image_url: Optional[str] = None
    # Metadata
    scraped_at: str = field(default_factory=lambda: datetime.now().isoformat())
    source_url: str = ""

    def to_dict(self) -> dict:
        d = {
            'project_id': self.project_id,
            'title': self.title,
            'short_title': self.short_title,
            'location': self.location,
            'province': self.province,
            'industrial_zone': self.industrial_zone,
            'sector': self.sector,
            'kbli_code': self.kbli_code,
            'investment_value_idr': self.investment_value_idr,
            'investment_value_raw_millions': self.investment_value_raw,
            'year': self.year,
            'irr_percent': self.irr_percent,
            'npv_idr': self.npv_idr,
            'npv_raw_millions': self.npv_raw,
            'payback_years': self.payback_years,
            'longitude': self.longitude,
            'latitude': self.latitude,
            'description_id': self.description_id,
            'description_short': self.description_short,
            'status': self.status,
            'visitor_count': self.visitor_count,
            'incentives': [asdict(i) for i in self.incentives],
            'contacts': [asdict(c) for c in self.contacts],
            'gallery_urls': self.gallery_urls,
            'document_urls': self.document_urls,
            'video_url': self.video_url,
            'main_image_url': self.main_image_url,
            'scraped_at': self.scraped_at,
            'source_url': self.source_url,
        }
        return {k: v for k, v in d.items() if v is not None and v != []}


# ── Parsers ─────────────────────────────────────────────────────────────────

def extract_regulations(text: str) -> str:
    """Extract regulation references from incentive text."""
    # Match patterns like "PP No. 78/2019", "PMK 11/PMK.010/2020", etc.
    patterns = [
        r'Peraturan [A-Za-z\s]+Nomor\s+\d+[^,;.]*(?:Tahun \d{4})?',
        r'PP\s+No\.?\s+\d+[^,;.]*',
        r'PMK\s+Nomor\s+\d+[^,;.]*',
        r'Peraturan Menteri [A-Za-z\s]+Nomor\s+\d+[^,;.]*',
    ]
    refs = []
    for pat in patterns:
        for m in re.finditer(pat, text, re.IGNORECASE):
            ref = m.group().strip()
            if ref and ref not in refs:
                refs.append(ref)
    return '; '.join(refs[:5]) if refs else ""


def extract_benefits(text: str) -> List[str]:
    """Extract bullet-point benefits from incentive text."""
    # Split by common delimiters and patterns
    # Look for items like "Pengurangan...", "Depresiasi...", numbered lists, etc.
    benefits = []
    
    # Try splitting by uppercase-start patterns or numbered items
    parts = re.split(r'(?=[A-Z][a-z]{2,}|[\d]+[\.\)])', text)
    for p in parts:
        p = p.strip()
        if len(p) > 20 and len(p) < 300:
            benefits.append(p)
    
    # If no structured benefits, return key sentences
    if not benefits:
        sentences = re.split(r'[.\n]+', text)
        for s in sentences:
            s = s.strip()
            if len(s) > 30 and len(s) < 200:
                benefits.append(s + '.')
    
    return benefits[:8]  # Limit to 8 items


def parse_currency_value(val_str: str) -> tuple:
    """Parse currency string to (formatted, raw_number_in_millions)."""
    if not val_str:
        return None, None
    formatted = val_str.strip()
    # Extract numeric value
    num_match = re.search(r'[\d.,]+', formatted)
    if not num_match:
        return formatted, None
    num_str = num_match.group().replace('.', '').replace(',', '.')
    try:
        raw = float(num_str)
        return formatted, raw
    except ValueError:
        return formatted, None


def parse_percentage(val_str: str) -> Optional[float]:
    """Parse percentage string to float."""
    if not val_str:
        return None
    num_match = re.search(r'[\d.,]+', str(val_str))
    if not num_match:
        return None
    try:
        return float(num_match.group().replace(',', '.'))
    except ValueError:
        return None


# ── Main Scraper ────────────────────────────────────────────────────────────

def fetch_project(project_id: int) -> Optional[ScrapedProject]:
    """Fetch complete project data from BKPM API."""
    url = API_DETAIL.format(id=project_id)
    logger.info("Fetching project %d from API", project_id)
    
    try:
        resp = requests.get(
            url,
            headers={
                "User-Agent": USER_AGENT,
                "Referer": f"https://regionalinvestment.bkpm.go.id/peluang_investasi/detailed/{project_id}"
            },
            timeout=30
        )
        if resp.status_code != 200:
            logger.warning("HTTP %d for project %d", resp.status_code, project_id)
            return None
        
        data = resp.json()
        api_data = data.get("data") if isinstance(data, dict) else None
        if not api_data:
            logger.warning("No data in API response for project %d", project_id)
            return None
        detail = api_data.get("detail", {})
        
        # Parse investment and NPV
        inv_fmt, inv_raw = parse_currency_value(detail.get("nilai_investasi"))
        npv_fmt, npv_raw = parse_currency_value(detail.get("nilai_npv"))
        
        project = ScrapedProject(
            project_id=project_id,
            title=detail.get("judul", ""),
            short_title=detail.get("deskripsi_singkat"),
            location=detail.get("nama_kabkot", ""),
            province=detail.get("nama_provinsi", ""),
            industrial_zone=detail.get("lokasi_kawasan"),
            sector=detail.get("nama_sektor", ""),
            kbli_code=detail.get("kode_kbli"),
            investment_value_idr=inv_fmt,
            investment_value_raw=inv_raw,
            year=int(detail["tahun"]) if detail.get("tahun") else None,
            irr_percent=parse_percentage(detail.get("nilai_irr")),
            npv_idr=npv_fmt,
            npv_raw=npv_raw,
            payback_years=parse_percentage(detail.get("payback_period")),
            longitude=float(detail["longitude"]) if detail.get("longitude") else None,
            latitude=float(detail["latitude"]) if detail.get("latitude") else None,
            description_id=detail.get("deskripsi"),
            description_short=detail.get("deskripsi_singkat"),
            status=detail.get("status_proyek"),
            visitor_count=int(detail["total_pengunjung"]) if detail.get("total_pengunjung") else None,
            main_image_url=detail.get("image"),
            video_url=detail.get("vidio"),
            source_url=f"https://regionalinvestment.bkpm.go.id/peluang_investasi/detailed/{project_id}",
        )
        
        # Parse incentives
        for inc in api_data.get("insentif", []):
            name = inc.get("nama", "")
            keterangan = inc.get("keterangan", "")
            project.incentives.append(IncentiveItem(
                name=name,
                regulation=extract_regulations(keterangan),
                description=keterangan,
                benefits=extract_benefits(keterangan),
            ))
        
        # Parse contacts
        for kontak in api_data.get("kontak", []):
            project.contacts.append(ProjectContact(
                name=kontak.get("Kontak", ""),
                address=kontak.get("Alamat"),
                phone=kontak.get("Telepon") or kontak.get("Telefon"),
                email=kontak.get("Email"),
            ))
        
        # Parse gallery
        for g in api_data.get("galeri", []):
            if g.get("image"):
                project.gallery_urls.append(g["image"])
        
        # Parse info files (documents)
        for info in api_data.get("info", []):
            if info.get("nama") and info.get("tipe") == 4:
                project.document_urls.append(info["nama"])
        
        logger.info(
            "Project %d: '%s' | %d incentives | %d contacts | %d gallery",
            project_id,
            project.title[:50],
            len(project.incentives),
            len(project.contacts),
            len(project.gallery_urls),
        )
        
        desc_len = len(project.description_id) if project.description_id else 0
        logger.info("  Description: %d chars", desc_len)
        
        return project
        
    except Exception as e:
        logger.error("Error fetching project %d: %s", project_id, e)
        return None


def scrape_batch(project_ids: List[int], delay: float = 0.5) -> List[ScrapedProject]:
    """Scrape multiple projects with rate limiting."""
    results = []
    failed = []
    
    for i, pid in enumerate(project_ids, 1):
        logger.info("[%d/%d] Processing project %d", i, len(project_ids), pid)
        project = fetch_project(pid)
        if project:
            results.append(project)
        else:
            failed.append(pid)
        if i < len(project_ids):
            time.sleep(delay)
    
    logger.info("=" * 50)
    logger.info("COMPLETE: %d succeeded, %d failed", len(results), len(failed))
    if failed:
        logger.info("Failed IDs: %s", failed)
    
    return results


def save_results(projects: List[ScrapedProject], output_path: str, fmt: str = "json"):
    """Save scraped results to file."""
    data = [p.to_dict() for p in projects]
    
    if fmt == "json":
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    elif fmt == "jsonl":
        with open(output_path, "w", encoding="utf-8") as f:
            for item in data:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")
    
    logger.info("Saved %d projects to %s", len(projects), output_path)


# ── CLI ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="BKPM Project Scraper API Edition — Full data extraction"
    )
    parser.add_argument("--project-id", type=int, help="Single project ID")
    parser.add_argument("--project-ids", help="Comma-separated IDs")
    parser.add_argument("--batch-file", help="File with one ID per line")
    parser.add_argument("--output", "-o", default="bkpm_scraped_full.json")
    parser.add_argument("--format", choices=["json", "jsonl"], default="json")
    parser.add_argument("--delay", type=float, default=0.5)
    parser.add_argument("--verbose", "-v", action="store_true")
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Collect IDs
    ids = []
    if args.project_id:
        ids = [args.project_id]
    elif args.project_ids:
        ids = [int(x.strip()) for x in args.project_ids.split(",") if x.strip()]
    elif args.batch_file:
        with open(args.batch_file) as f:
            ids = [int(line.strip()) for line in f if line.strip() and not line.startswith("#")]
    else:
        # Default test
        ids = [1131]
        print("No IDs specified. Testing with project 1131 (Wamena Arabica Coffee).")
    
    # Scrape
    results = scrape_batch(ids, delay=args.delay)
    
    # Save
    save_results(results, args.output, args.format)
    
    # Print summary
    print(f"\n{'='*60}")
    print("SCRAPING SUMMARY")
    print(f"{'='*60}")
    for p in results:
        print(f"\n{p.project_id}: {p.title}")
        print(f"  Desc: {len(p.description_id or '')} chars")
        print(f"  Incentives ({len(p.incentives)}):")
        for inc in p.incentives:
            print(f"    • {inc.name}: {inc.description[:80]}...")
        if p.contacts:
            print(f"  Contacts: {len(p.contacts)}")
        if p.gallery_urls:
            print(f"  Gallery: {len(p.gallery_urls)} photos")
    print(f"\nOutput: {args.output}")


if __name__ == "__main__":
    main()
