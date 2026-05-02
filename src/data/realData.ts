/**
 * REAL DATA FROM BKPM PORTAL - Updated from GitHub remote
 * Source: scraper/data/bkpm_projects.json
 * Format: API v2.0.0
 * Bilingual: Progressive English translation via Ollama Qwen3.5:9b
 */

import rawData from './bkpmRealData.json';
import translationProgress from './translationProgress.json';
import type { Project } from '@/types';
import { getProjectImage } from '@/lib/projectImage';

// Map of translated project IDs for fast lookup
const translationMap = new Map<number, { name_en: string; description_en: string }>();
for (const t of (translationProgress as any).translations || []) {
  translationMap.set(t.id, { name_en: t.name_en, description_en: t.description_en });
}

// Check if an external image URL is likely accessible
function isAccessibleImage(url: string): boolean {
  if (!url || url === '') return false;
  if (url.includes('regionalinvestment.bkpm.go.id')) return false;
  return true;
}

// Generate tags from available categorization data
function generateTags(category: string, subcategory: string): string[] {
  const tags: string[] = [];
  if (category) tags.push(category);
  if (subcategory) tags.push(subcategory);
  const cat = category.toLowerCase();
  if (cat.includes('pertanian') || cat.includes('agro')) tags.push('Agroindustry');
  if (cat.includes('industri') || cat.includes('perindustrian')) tags.push('Manufacturing');
  if (cat.includes('pariwisata') || cat.includes('hotel')) tags.push('Tourism');
  if (cat.includes('energi') || cat.includes('listrik')) tags.push('Energy');
  if (cat.includes('infrastruktur') || cat.includes('konstruksi')) tags.push('Infrastructure');
  if (cat.includes('perikanan')) tags.push('Fisheries');
  if (cat.includes('perdagangan')) tags.push('Trade');
  if (cat.includes('digital') || cat.includes('data')) tags.push('Digital');
  return [...new Set(tags)].slice(0, 4);
}

function normalizeStatus(status: string): 'Verified' | 'In Progress' | 'Planning' {
  if (status === 'Data Tersedia') return 'Verified';
  if (status === 'In Progress') return 'In Progress';
  return 'Planning';
}

export const realProjects: Project[] = rawData.projects.map((p: any): Project => {
  const investmentValueRaw = typeof p.investment_value_idr === 'number' ? p.investment_value_idr : 0;
  const npvRaw = typeof p.npv_idr === 'number' ? p.npv_idr : 0;
  const investmentValueM = investmentValueRaw / 1_000_000;
  const npvM = npvRaw / 1_000_000;

  const sector = p.category || 'General';
  const subSector = p.subcategory || '';
  const categoryNormalized = (p.subcategory === 'Primer' || p.subcategory === 'Sekunder' || p.subcategory === 'Tersier')
    ? p.subcategory : 'Primer';

  const district = p.district || '';
  const province = p.province || '';
  const location = district || province;

  const name_id = p.name_id || '';
  const description_id = p.description_id || '';

  // Check if translation exists
  const translation = translationMap.get(p.id);
  const name_en = translation?.name_en || '';
  const description_en = translation?.description_en || '';
  const hasTranslation = !!translation && !!name_en;

  return {
    id: p.id,
    name: hasTranslation ? name_en : name_id,
    nameEn: name_en,
    nameId: name_id,
    description: hasTranslation ? description_en : description_id,
    descriptionEn: description_en,
    descriptionId: description_id,
    sector: sector,
    subSector: subSector,
    category: categoryNormalized,
    province: province,
    location: location,
    investmentValue: investmentValueM,
    npv: npvM,
    irr: typeof p.irr_percent === 'number' ? p.irr_percent : 0,
    paybackPeriod: typeof p.payback_period_years === 'number' ? p.payback_period_years : 0,
    status: normalizeStatus(p.status),
    image: isAccessibleImage(p.image_url) ? p.image_url : getProjectImage(sector),
    tags: generateTags(sector, subSector),
    coordinates: {
      lat: typeof p.latitude === 'number' ? p.latitude : 0,
      lng: typeof p.longitude === 'number' ? p.longitude : 0,
    },
    matchScore: 0,
    hasTranslation: hasTranslation,
  } as Project;
});

export const dataMetadata = rawData.metadata;

export const translationMeta = (translationProgress as any).metadata || {};

export const stats = {
  totalProjects: realProjects.length,
  translatedProjects: realProjects.filter(p => p.hasTranslation).length,
  pendingTranslation: realProjects.filter(p => !p.hasTranslation).length,
  totalProvinces: new Set(realProjects.map(p => p.province)).size,
  totalSectors: new Set(realProjects.map(p => p.sector)).size,
  avgQualityScore: rawData.metadata?.average_quality_score || 0,
  scrapedAt: rawData.metadata?.scraped_at || '',
};
