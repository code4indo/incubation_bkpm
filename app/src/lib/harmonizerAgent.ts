/**
 * HARMONIZER AGENT — Frontend Integration Layer
 * 
 * This file handles the initial client-side evaluation (Scout pre-check)
 * to identify projects needing translation. 
 * 
 * The actual agentic harmonization (Scout → Orchestrator → Harmonizer → Guardian)
 * has been moved to the Backend Agent MAS (Python) for reliability.
 */

import { realProjects } from '@/data/realData';
import { getEnrichedProject } from '@/data/bkpmFullDataLoader';

// ── Types ──

export interface LanguageEvaluation {
  projectId: number;
  nameId: string;
  descriptionId: string;
  /** Current English name (from translation or copy of Indonesian) */
  nameEn: string;
  /** Current English description */
  descriptionEn: string;
  /** Language detected from Indonesian text */
  detectedLanguage: 'id' | 'en' | 'mixed' | 'unknown';
  /** Confidence of language detection */
  detectionConfidence: number;
  /** Whether project already has a real (non-copy) English translation */
  hasRealTranslation: boolean;
  /** Whether name_en is just a copy of name_id (not actually translated) */
  nameEnIsCopy: boolean;
  /** Whether description_en is empty or a copy of description_id */
  descriptionEnIsCopy: boolean;
  /** Routing decision */
  action: 'SKIP' | 'HARMONIZE_NAME' | 'HARMONIZE_DESC' | 'HARMONIZE_FULL';
  /** Quality assessment score (1-10) if English exists */
  qualityScore: number;
  /** Status for admin dashboard */
  status: 'ready' | 'needs_name' | 'needs_description' | 'needs_full' | 'harmonizing' | 'done';
  /** Detected problems that need admin attention */
  problems: string[];
}

export interface HarmonizationResult {
  projectId: number;
  nameEn: string;
  descriptionEn: string;
  success: boolean;
  latencyMs: number;
  model: string;
  error?: string;
}

export interface AdminStats {
  totalProjects: number;
  readyCount: number;
  needsNameCount: number;
  needsDescriptionCount: number;
  needsFullCount: number;
  harmonizingCount: number;
}

// ── Scout (Frontend Pre-check): Language Detection ──

const INDONESIAN_PATTERNS = [
  /\b(dan|atau|yang|ini|itu|dengan|untuk|pada|dari|ke|di|oleh|sebagai|sudah|telah|akan|dapat|bisa|harus|perlu|ada|tidak|juga|saja|lagi|serta|karena|tetapi|namun|jika|kalau|agar|supaya|sehingga|maka|ketika|saat|setelah|sebelum|selama|sambil)\b/i,
  /\b(peluang|investasi|pembangunan|pengembangan|peningkatan|pemanfaatan|pengolahan|produksi|distribusi|pemasaran|penyediaan|pengadaan|perbaikan|perluasan|pendirian|pembangunan)\b/i,
  /\b(pabrik|kawasan|industri|perdagangan|pertanian|perikanan|pariwisata|energi|infrastruktur|transportasi|telekomunikasi|pendidikan|kesehatan)\b/i,
];

function detectIndonesian(text: string): { score: number; matches: number } {
  let matches = 0;
  for (const pattern of INDONESIAN_PATTERNS) {
    const m = text.match(pattern);
    if (m) matches += m.length;
  }
  const words = text.trim().split(/\s+/).length || 1;
  const density = matches / words;
  const score = Math.min(1, density * 3);
  return { score, matches };
}

function hasNonAsciiWords(text: string): boolean {
  return /[^\x00-\x7F]{3,}/.test(text);
}

/**
 * Evaluate project language status (runs client-side, no LLM)
 */
export function evaluateLanguage(
  nameId: string,
  descriptionId: string,
  nameEn: string,
  descriptionEn: string,
  hasTranslation: boolean,
): LanguageEvaluation {
  const idText = [nameId, descriptionId].filter(Boolean).join(' ');
  const enNameText = nameEn || '';
  const enDescText = descriptionEn || '';
  const problems: string[] = [];

  // Detect language of Indonesian originals
  const idDetection = detectIndonesian(idText);
  const detectedLanguage = idDetection.score > 0.15 ? 'id' : 'unknown';
  const detectionConfidence = Math.min(0.98, idDetection.score * 1.2);

  // Check if English fields are just copies of Indonesian
  const nameEnIsCopy = !enNameText || enNameText === nameId;
  const descriptionEnIsCopy = !enDescText || enDescText === descriptionId || enDescText === '';

  // Build problems list
  if (nameEnIsCopy) problems.push('Project name not in English');
  if (descriptionEnIsCopy && descriptionId) problems.push('Project description not in English');

  // Check if real translation exists
  const hasRealTranslation = hasTranslation && !nameEnIsCopy;

  // Quality assessment of English text
  let qualityScore = 5;
  if (!nameEnIsCopy && !descriptionEnIsCopy) {
    // English exists and differs from Indonesian — assess quality
    if (!hasNonAsciiWords(enNameText + enDescText)) {
      qualityScore = Math.min(10, 7 + (hasRealTranslation ? 3 : 1));
    } else {
      qualityScore = 4; // Mixed/ID characters remain
    }
  }

  // Orchestrator routing
  let action: LanguageEvaluation['action'] = 'SKIP';
  if (nameEnIsCopy && descriptionEnIsCopy) {
    action = 'HARMONIZE_FULL';
  } else if (nameEnIsCopy) {
    action = 'HARMONIZE_NAME';
  } else if (descriptionEnIsCopy) {
    action = 'HARMONIZE_DESC';
  }

  let status: LanguageEvaluation['status'] = 'ready';
  switch (action) {
    case 'HARMONIZE_FULL': status = 'needs_full'; break;
    case 'HARMONIZE_NAME': status = 'needs_name'; break;
    case 'HARMONIZE_DESC': status = 'needs_description'; break;
    default: status = 'ready'; break;
  }

  return {
    projectId: 0, 
    nameId,
    descriptionId,
    nameEn: enNameText,
    descriptionEn: enDescText,
    detectedLanguage,
    detectionConfidence,
    hasRealTranslation,
    nameEnIsCopy,
    descriptionEnIsCopy,
    action,
    qualityScore,
    status,
    problems,
  };
}

/**
 * Check enrichment data for language problems.
 */
function checkEnrichmentProblems(projectId: number): string[] {
  const enriched = getEnrichedProject(projectId);
  if (!enriched) return [];

  const problems: string[] = [];
  const idPattern = /\b(dan|atau|yang|ini|itu|dengan|untuk|pada|dari|ke|di|oleh|sebagai|sudah|telah|akan|dapat|bisa|harus|perlu|ada|tidak|juga|saja|serta|karena|tetapi|namun|jika|kalau|agar|supaya|maka|ketika|saat|setelah|sebelum|selama|sambil)\b/i;
  const idExtendedPattern = /\b(peluang|investasi|pembangunan|pengembangan|peningkatan|pemanfaatan|pengolahan|produksi|distribusi|pemasaran|penyediaan|pendirian|kawasan|industri|perdagangan|pertanian|perikanan|pariwisata|energi|infrastruktur|transportasi|telekomunikasi|pendidikan|kesehatan|peraturan|pemerintah|menteri|nomor|tentang|pemberian|fasilitas|insentif|kemudahan|berusaha|penanaman|modal\b)/i;

  function isIndonesian(text: string): boolean {
    return idPattern.test(text) || idExtendedPattern.test(text);
  }

  // 1. Short title
  if (enriched.shortTitle && isIndonesian(enriched.shortTitle)) {
    problems.push('Short title in Indonesian');
  }

  // 2. Industrial zone name
  if (enriched.industrialZone && isIndonesian(enriched.industrialZone)) {
    problems.push('Industrial zone name in Indonesian');
  }

  // 3. Incentives
  if (enriched.incentives?.length > 0) {
    let idNames = 0;
    for (const inc of enriched.incentives) {
      if (isIndonesian(inc.name)) idNames++;
    }
    if (idNames > 0) problems.push(`${idNames} incentive names in Indonesian`);
  }

  return problems;
}

/**
 * Evaluate ALL projects and return language status list
 */
export function evaluateAllProjects(): LanguageEvaluation[] {
  return realProjects.map((p) => {
    const base = evaluateLanguage(
      p.nameId,
      p.descriptionId,
      p.nameEn,
      p.descriptionEn,
      !!p.hasTranslation,
    );
    base.projectId = p.id;

    // Check sector/category
    const idSectors = /^(PERINDUSTRIAN|PERTANIAN|PERIKANAN|PARIWISATA|PERDAGANGAN|PERTAMBANGAN|INFRASTRUKTUR|ENERGI|KESEHATAN|PENDIDIKAN|KONSTRUKSI|TRANSPORTASI|TELEKOMUNIKASI|JASA|KEUANGAN)$/i;
    if (p.sector && idSectors.test(p.sector)) {
      base.problems.push(`Sector name in Indonesian ("${p.sector}")`);
    }

    // Add enrichment-specific problems
    const enrichmentProblems = checkEnrichmentProblems(p.id);
    base.problems = [...base.problems, ...enrichmentProblems];

    return base;
  });
}

/**
 * Calculate admin dashboard stats
 */
export function calculateStats(evaluations: LanguageEvaluation[]): AdminStats {
  return {
    totalProjects: evaluations.length,
    readyCount: evaluations.filter(e => e.status === 'ready').length,
    needsNameCount: evaluations.filter(e => e.status === 'needs_name').length,
    needsDescriptionCount: evaluations.filter(e => e.status === 'needs_description').length,
    needsFullCount: evaluations.filter(e => e.status === 'needs_full').length,
    harmonizingCount: evaluations.filter(e => e.status === 'harmonizing').length,
  };
}

