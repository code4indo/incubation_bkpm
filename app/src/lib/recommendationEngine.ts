/**
 * HYBRID RECOMMENDATION ENGINE — Now powered by CMS Formula
 *
 * Architecture:
 * 1. CMS Engine: CMS(i,p) = α·S_content + β·S_behavior + γ·S_policy + δ·S_risk
 * 2. Legacy fallback: Content-Based + Collaborative Filtering (kept for compatibility)
 * 3. Hybrid: CMS (70%) + Legacy CF (30%) with cold-start fallback
 *
 * Data Sources:
 * - Real projects: realData.ts (181 BKPM projects)
 * - Semi-synthetic investors: semiSyntheticInvestors.ts (50+ profiles)
 * - Reference data: KBLI 2020, PSN, priority sectors, regulatory risk
 */

import type { Project, InvestorProfile, InteractionEvent } from '@/types';
import { realProjects } from '@/data/realData';
import { ALL_SYNTHETIC_INVESTORS, SYNTHETIC_INTERACTIONS, ALL_INVESTOR_IDS } from '@/data/semiSyntheticInvestors';
import { calculateCMS, getCMSRecommendations, type CMSScoreBreakdown, type CMSRecommendationResult } from './cmsEngine';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES — Backward compatible
// ═══════════════════════════════════════════════════════════════════════════

export type { InvestorProfile, InteractionEvent } from '@/types';

export interface MatchScoreBreakdown {
  overall: number;             // 0-100 scale
  contentBased: number;
  collaborative: number;
  cms: number;                 // CMS score 0-100
  contentDetails: {
    sectorMatch: number;
    ticketSizeFit: number;
    regionMatch: number;
    riskAlignment: number;
    horizonFit: number;
    focusAreaMatch: number;
  };
  cmsDetails?: CMSScoreBreakdown; // Full CMS breakdown
  collaborativeDetails: {
    similarInvestorsScore: number;
    itemSimilarityScore: number;
  };
  reasons: string[];
  confidence: 'High' | 'Medium' | 'Low';
}

export interface RecommendationResult {
  project: Project;
  score: MatchScoreBreakdown;
  rank: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const EVENT_WEIGHTS: Record<string, number> = {
  view: 1,
  save: 3,
  share: 2,
  inquiry: 5,
  site_visit: 8,
  invest: 10,
};

// Use real project data
const projects = realProjects;

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY CONTENT-BASED (kept for backward compat + CF hybrid)
// ═══════════════════════════════════════════════════════════════════════════

const RISK_IRR_MAP: Record<string, [number, number]> = {
  Conservative: [10, 16],
  Moderate: [15, 22],
  Aggressive: [20, 30],
};

const HORIZON_MAP: Record<string, [number, number]> = {
  Short: [0, 5],
  Medium: [4, 10],
  Long: [8, 20],
};

function calculateSectorMatch(investorSectors: string[], projectSector: string, projectSubSector: string, projectTags: string[]): { score: number; reason?: string } {
  if (investorSectors.length === 0) return { score: 50 };
  const allProjectAttributes = [projectSector.toLowerCase(), projectSubSector.toLowerCase(), ...projectTags.map(t => t.toLowerCase())];
  let maxScore = 0;
  let bestMatch = '';
  for (const invSector of investorSectors) {
    const invLower = invSector.toLowerCase();
    if (allProjectAttributes.includes(invLower)) return { score: 100, reason: `Exact sector match: ${invSector}` };
    for (const attr of allProjectAttributes) {
      if (attr.includes(invLower) || invLower.includes(attr)) {
        if (85 > maxScore) { maxScore = 85; bestMatch = `Related sector: ${invSector} ↔ ${attr}`; }
      }
    }
  }
  if (maxScore > 0) return { score: maxScore, reason: bestMatch };
  return { score: 15, reason: 'No direct sector match' };
}

function calculateTicketSizeFit(minTicket: number, maxTicket: number, projectValue: number): { score: number; reason: string } {
  const projectValueB = projectValue / 1000; // Million to Billion
  const center = (minTicket + maxTicket) / 2;
  const range = maxTicket - minTicket;
  const halfRange = range / 2;
  if (range === 0) { const diff = Math.abs(projectValueB - center); return { score: Math.max(0, 100 - diff * 10), reason: diff < 5 ? 'Exact ticket match' : 'Outside preferred range' }; }
  if (projectValueB >= minTicket && projectValueB <= maxTicket) { const distance = Math.abs(projectValueB - center); return { score: Math.round(80 + (1 - distance / halfRange) * 20), reason: `Within preferred range` }; }
  const distance = projectValueB < minTicket ? minTicket - projectValueB : projectValueB - maxTicket;
  return { score: Math.max(0, 60 - distance * 8), reason: projectValueB < minTicket ? `Below min ticket` : `Above max ticket` };
}

function calculateRegionMatch(preferredProvinces: string[], preferredRegions: string[], projectProvince: string): { score: number; reason: string } {
  const provinceLower = projectProvince.toLowerCase();
  if (preferredProvinces.some(p => p.toLowerCase() === provinceLower)) return { score: 90, reason: `Preferred province: ${projectProvince}` };
  const islandMap: Record<string, string[]> = {
    'sumatra': ['Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Jambi', 'Sumatera Selatan', 'Bengkulu', 'Lampung'],
    'java': ['DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Daerah Istimewa Yogyakarta', 'Jawa Timur', 'Banten'],
    'kalimantan': ['Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara'],
    'sulawesi': ['Sulawesi Utara', 'Sulawesi Tengah', 'Sulawesi Selatan', 'Sulawesi Tenggara', 'Gorontalo'],
  };
  for (const [island, provs] of Object.entries(islandMap)) {
    if (preferredRegions.some(r => r.toLowerCase().includes(island)) && provs.some(p => p.toLowerCase() === provinceLower)) {
      return { score: 65, reason: `In preferred island (${island}): ${projectProvince}` };
    }
  }
  if (preferredRegions.some(r => ['anywhere', 'indonesia', 'all'].includes(r.toLowerCase()))) return { score: 40, reason: 'Open to all regions' };
  return { score: 10, reason: 'Outside preferred regions' };
}

function calculateRiskAlignment(riskAppetite: string, projectIRR: number): { score: number; reason: string } {
  const range = RISK_IRR_MAP[riskAppetite]; if (!range) return { score: 50, reason: 'Unknown risk profile' };
  const [minIRR, maxIRR] = range;
  if (projectIRR >= minIRR && projectIRR <= maxIRR) { const center = (minIRR + maxIRR) / 2; const dist = Math.abs(projectIRR - center); const halfRange = (maxIRR - minIRR) / 2; return { score: Math.round(85 + (1 - dist / halfRange) * 15), reason: `IRR ${projectIRR}% matches ${riskAppetite} profile` }; }
  if (projectIRR < minIRR) { const gap = minIRR - projectIRR; return { score: Math.max(0, 70 - gap * 10), reason: `IRR below ${riskAppetite} threshold` }; }
  const gap = projectIRR - maxIRR; return { score: Math.max(0, 70 - gap * 8), reason: `IRR exceeds ${riskAppetite} comfort zone` };
}

function calculateHorizonFit(horizon: string, paybackPeriod: number): { score: number; reason: string } {
  const range = HORIZON_MAP[horizon]; if (!range) return { score: 50, reason: 'Unknown horizon preference' };
  const [min, max] = range;
  if (paybackPeriod >= min && paybackPeriod <= max) return { score: 100, reason: `Payback ${paybackPeriod}yr fits ${horizon} horizon` };
  const distance = paybackPeriod < min ? min - paybackPeriod : paybackPeriod - max;
  return { score: Math.max(0, 80 - distance * 12), reason: `Payback ${paybackPeriod}yr vs ${horizon} preference` };
}

function calculateFocusAreaMatch(focusAreas: string[], projectTags: string[], projectDescription: string): { score: number; reason: string } {
  if (focusAreas.length === 0) return { score: 50, reason: 'No focus areas specified' };
  const allText = [...projectTags, projectDescription].join(' ').toLowerCase();
  let matches = 0;
  for (const area of focusAreas) { if (allText.includes(area.toLowerCase())) matches++; }
  const score = Math.min(100, Math.round((matches / focusAreas.length) * 100));
  if (matches === 0) return { score: 10, reason: 'No focus area overlap' };
  return { score, reason: `${matches}/${focusAreas.length} focus areas matched` };
}

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY CONTENT-BASED + CF (kept for backward compatibility)
// ═══════════════════════════════════════════════════════════════════════════

export function contentBasedScore(investor: InvestorProfile, project: Project): { score: number; details: MatchScoreBreakdown['contentDetails']; reasons: string[] } {
  const sector = calculateSectorMatch(investor.sectorPreferences, project.sector, project.subSector, project.tags);
  const ticketSize = calculateTicketSizeFit(investor.minTicketSize, investor.maxTicketSize, project.investmentValue);
  const region = calculateRegionMatch(investor.preferredProvinces, investor.preferredRegions, project.province);
  const risk = calculateRiskAlignment(investor.riskAppetite, project.irr);
  const horizon = calculateHorizonFit(investor.investmentHorizon, project.paybackPeriod);
  const focus = calculateFocusAreaMatch(investor.focusAreas, project.tags, project.description);
  const details = { sectorMatch: sector.score, ticketSizeFit: ticketSize.score, regionMatch: region.score, riskAlignment: risk.score, horizonFit: horizon.score, focusAreaMatch: focus.score };
  const score = Math.round(details.sectorMatch * 0.25 + details.ticketSizeFit * 0.20 + details.regionMatch * 0.20 + details.riskAlignment * 0.15 + details.horizonFit * 0.10 + details.focusAreaMatch * 0.10);
  const reasons = [sector.reason, ticketSize.reason, region.reason, risk.reason, horizon.reason, focus.reason].filter(Boolean) as string[];
  return { score, details, reasons };
}

function buildInteractionMatrix(interactions: InteractionEvent[], investorIds: string[], projectIds: number[]): number[][] {
  const matrix: number[][] = investorIds.map(() => projectIds.map(() => 0));
  for (const event of interactions) { const userIdx = investorIds.indexOf(event.investorId); const itemIdx = projectIds.indexOf(event.projectId); if (userIdx !== -1 && itemIdx !== -1) matrix[userIdx][itemIdx] += event.weight; }
  return matrix;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; normA += a[i] * a[i]; normB += b[i] * b[i]; }
  if (normA === 0 || normB === 0) return 0; return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function userBasedCF(targetId: string, targetProjectId: number, interactions: InteractionEvent[], allIds: string[], projectIds: number[]): number {
  const matrix = buildInteractionMatrix(interactions, allIds, projectIds);
  const targetIdx = allIds.indexOf(targetId); const projectIdx = projectIds.indexOf(targetProjectId);
  if (targetIdx === -1 || projectIdx === -1) return 0;
  const targetVector = matrix[targetIdx];
  const similarities: { idx: number; sim: number }[] = [];
  for (let i = 0; i < matrix.length; i++) { if (i !== targetIdx) { const sim = cosineSimilarity(targetVector, matrix[i]); if (sim > 0) similarities.push({ idx: i, sim }); } }
  similarities.sort((a, b) => b.sim - a.sim);
  const top = similarities.slice(0, 5);
  if (top.length === 0) return 0;
  let ws = 0, ss = 0; for (const { idx, sim } of top) { ws += matrix[idx][projectIdx] * sim; ss += sim; }
  const raw = ss > 0 ? ws / ss : 0; return Math.min(100, (raw / 10) * 100);
}

export function collaborativeScore(investor: InvestorProfile, project: Project, allInteractions: InteractionEvent[], allInvestorIds: string[]): { score: number; details: MatchScoreBreakdown['collaborativeDetails'] } {
  const projectIds = projects.map(p => p.id);
  const ub = userBasedCF(investor.id, project.id, allInteractions, allInvestorIds, projectIds);
  const score = Math.round(ub * 0.6 + ub * 0.4); // Simplified: user-based dominates
  return { score, details: { similarInvestorsScore: Math.round(ub), itemSimilarityScore: Math.round(ub * 0.7) } };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HYBRID RECOMMENDER — CMS + Legacy
// ═══════════════════════════════════════════════════════════════════════════

export function getRecommendationScore(
  investor: InvestorProfile,
  project: Project,
  allInteractions?: InteractionEvent[],
  allInvestorIds?: string[],
): MatchScoreBreakdown {
  const interactions = allInteractions || SYNTHETIC_INTERACTIONS;
  const investorIds = allInvestorIds || ALL_INVESTOR_IDS;

  // ── CMS Engine (primary) ──
  const cmsResult = calculateCMS(investor, project, ALL_SYNTHETIC_INVESTORS, interactions);

  // ── Legacy Content-Based (compatibility) ──
  const cb = contentBasedScore(investor, project);

  // ── Legacy CF (compatibility) ──
  const interactionCount = interactions.filter(i => i.investorId === investor.id).length;
  const hasCFData = interactionCount >= 3;
  let cfScore = 0;
  let cfDetails: MatchScoreBreakdown['collaborativeDetails'] = { similarInvestorsScore: 0, itemSimilarityScore: 0 };
  if (hasCFData) {
    const cf = collaborativeScore(investor, project, interactions, investorIds);
    cfScore = cf.score;
    cfDetails = cf.details;
  }

  // ── Hybrid: CMS 70% + Legacy weighted average 30% ──
  const cmsScore100 = cmsResult.cms * 100; // Convert 0-1 to 0-100
  const legacyScore = hasCFData ? cb.score * 0.6 + cfScore * 0.4 : cb.score;
  const overall = Math.round(cmsScore100 * 0.7 + legacyScore * 0.3);

  // Build reasons from CMS
  const reasons = [...cmsResult.reasons];
  if (hasCFData && cfScore > 30) reasons.push(`${interactionCount} interaction patterns found`);
  if (cmsResult.isColdStart) reasons.push('Profile-based matching (complete profile for better matches)');

  return {
    overall: Math.min(100, overall),
    contentBased: cb.score,
    collaborative: cfScore,
    cms: Math.round(cmsScore100),
    contentDetails: cb.details,
    cmsDetails: cmsResult,
    collaborativeDetails: cfDetails,
    reasons: reasons.slice(0, 5),
    confidence: cmsResult.confidence,
  };
}

export function getRankedRecommendations(
  investor: InvestorProfile,
  allInteractions?: InteractionEvent[],
  allInvestorIds?: string[],
): RecommendationResult[] {
  const scored = projects.map(project => {
    const score = getRecommendationScore(investor, project, allInteractions, allInvestorIds);
    return { project, score, rank: 0 };
  });
  scored.sort((a, b) => b.score.overall - a.score.overall);
  scored.forEach((item, idx) => { item.rank = idx + 1; });
  return scored;
}

export function getTopRecommendations(
  investor: InvestorProfile,
  allInteractions?: InteractionEvent[],
  allInvestorIds?: string[],
  topN: number = 6,
): RecommendationResult[] {
  return getRankedRecommendations(investor, allInteractions, allInvestorIds).slice(0, topN);
}

export function generateExplanation(score: MatchScoreBreakdown): string {
  const topReason = score.reasons[0] || 'Based on your profile';
  if (score.confidence === 'High') return `${topReason}. CMS score: ${score.cms}%. Validated by behavioral patterns.`;
  if (score.confidence === 'Medium') return `${topReason}. CMS score: ${score.cms}%. Improving with more data.`;
  return `${topReason}. CMS score: ${score.cms}%. Complete your profile for better matches.`;
}

export function recordInteraction(
  investorId: string,
  projectId: number,
  eventType: InteractionEvent['eventType'],
  existingInteractions: InteractionEvent[]
): InteractionEvent[] {
  const newEvent: InteractionEvent = { investorId, projectId, eventType, timestamp: Date.now(), weight: EVENT_WEIGHTS[eventType] || 1 };
  return [...existingInteractions, newEvent];
}

// ═══════════════════════════════════════════════════════════════════════════
// CMS DIRECT ACCESS — For new UI components
// ═══════════════════════════════════════════════════════════════════════════

export { calculateCMS, getCMSRecommendations } from './cmsEngine';
export type { CMSScoreBreakdown, CMSRecommendationResult } from './cmsEngine';
