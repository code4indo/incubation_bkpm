/**
 * BKPM Full Data Loader
 * Loads enriched project data from bkpmFullData.json (scraped with incentives, contacts, gallery)
 */

import bkpmFullData from './bkpmFullData.json';
import type { Project } from '@/types';

// Raw types from scraped data
interface ScrapedIncentive {
  name: string;
  regulation: string;
  description: string;
  benefits: string[];
}

interface ScrapedContact {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface ScrapedProject {
  project_id: number;
  title: string;
  short_title?: string;
  location: string;
  province: string;
  industrial_zone?: string;
  sector: string;
  kbli_code?: string;
  investment_value_idr?: string;
  investment_value_raw_millions?: number;
  year?: number;
  irr_percent?: number;
  npv_idr?: string;
  npv_raw_millions?: number;
  payback_years?: number;
  longitude?: number;
  latitude?: number;
  description_id?: string;
  description_short?: string;
  status?: string;
  visitor_count?: number;
  incentives: ScrapedIncentive[];
  contacts: ScrapedContact[];
  gallery_urls: string[];
  document_urls: string[];
  video_url?: string;
  main_image_url?: string;
  scraped_at: string;
  source_url: string;
}

// Extended Project with enrichment data
export interface EnrichedProject extends Project {
  shortTitle?: string;
  industrialZone?: string;
  kbliCode?: string;
  investmentValueIdr?: string;
  npvIdr?: string;
  paybackYears?: number;
  visitorCount?: number;
  incentives: ScrapedIncentive[];
  contacts: ScrapedContact[];
  galleryUrls: string[];
  documentUrls: string[];
  videoUrl?: string;
  mainImageUrl?: string;
  sourceUrl: string;
  roi?: number;
  riskLevel?: string;
  projectType?: string;
}

// Map sector names from scraped data to our sector system
function mapSector(scrapedSector: string): string {
  const sectorMap: Record<string, string> = {
    'Agro Industri': 'Agroindustry',
    'Agroindustri': 'Agroindustry',
    'Industri': 'Manufacturing',
    'Manufaktur': 'Manufacturing',
    'Pariwisata': 'Tourism',
    'Energi': 'Energy',
    'Infrastruktur': 'Infrastructure',
    'Perikanan': 'Fisheries',
    'Perdagangan': 'Trade',
    'Digital': 'Digital',
    'Pertambangan': 'Mining',
    'Kimia': 'Chemicals',
    'Logistik': 'Logistics',
    'Kesehatan': 'Health',
    'Pendidikan': 'Education',
  };

  for (const [key, val] of Object.entries(sectorMap)) {
    if (scrapedSector.toLowerCase().includes(key.toLowerCase())) {
      return val;
    }
  }
  return 'General';
}

// Validate status to match Project type
function validateStatus(status?: string): 'Verified' | 'In Progress' | 'Planning' {
  if (status === 'Verified' || status === 'In Progress' || status === 'Planning') {
    return status;
  }
  return 'Planning';
}

// Load and convert scraped data
export function loadEnrichedProjects(): EnrichedProject[] {
  const scraped = bkpmFullData as ScrapedProject[];

  return scraped.map((sp) => {
    const baseId = sp.project_id;
    const sector = mapSector(sp.sector);

    // Calculate investment value in IDR millions (our format)
    const investmentValue = sp.investment_value_raw_millions || 0;

    // NPV in our format
    const npv = sp.npv_raw_millions || 0;

    // IRR
    const irr = sp.irr_percent || 0;

    // Use full description if available
    const descriptionId = sp.description_id || sp.description_short || '';

    return {
      // Base Project fields (required)
      id: baseId,
      name: sp.title,
      nameId: sp.short_title || sp.title,
      nameEn: sp.short_title || '',
      description: descriptionId,
      descriptionId: descriptionId,
      descriptionEn: '',
      sector,
      subSector: sector,
      category: 'Sekunder' as const,
      province: sp.province,
      location: sp.location,
      coordinates: {
        lat: sp.latitude || 0,
        lng: sp.longitude || 0,
      },
      investmentValue,
      irr,
      npv,
      paybackPeriod: sp.payback_years || 0,
      status: validateStatus(sp.status),
      image: sp.main_image_url || '',
      tags: [sector, sp.province],
      hasTranslation: false,

      // Extended enrichment fields
      shortTitle: sp.short_title,
      industrialZone: sp.industrial_zone,
      kbliCode: sp.kbli_code,
      investmentValueIdr: sp.investment_value_idr,
      npvIdr: sp.npv_idr,
      paybackYears: sp.payback_years,
      visitorCount: sp.visitor_count,
      incentives: sp.incentives || [],
      contacts: sp.contacts || [],
      galleryUrls: sp.gallery_urls || [],
      documentUrls: sp.document_urls || [],
      videoUrl: sp.video_url,
      mainImageUrl: sp.main_image_url,
      sourceUrl: sp.source_url,
      roi: irr * 1.2,
      riskLevel: irr > 15 ? 'Low' : irr > 10 ? 'Medium' : 'High',
      projectType: 'detailed',
    };
  });
}

// Merge with existing realData to get projects not in scraped set
export function getAllProjectsWithEnrichment(): EnrichedProject[] {
  const enriched = loadEnrichedProjects();
  // Currently returns only enriched projects from scraped data
  return enriched;
}

// Get single enriched project
export function getEnrichedProject(id: number): EnrichedProject | undefined {
  return loadEnrichedProjects().find(p => p.id === id);
}

// Check if project has enrichment data
export function hasEnrichment(id: number): boolean {
  return loadEnrichedProjects().some(p => p.id === id);
}
