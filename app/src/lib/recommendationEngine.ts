/**
 * HYBRID RECOMMENDATION ENGINE
 * Content-Based Filtering + Collaborative Filtering
 * 
 * Architecture:
 * 1. Content-Based: Matches investor profile attributes with project attributes
 * 2. Collaborative Filtering: Finds patterns from similar investors' behaviors
 * 3. Hybrid: Weighted combination with cold-start fallback
 * 
 * Ready for: Dummy data now, real data later via swappable data adapters
 */

import type { Project, Region } from '@/types';
import { projects, regions } from '@/data/mockData';

// ============================================================================
// TYPES
// ============================================================================

export interface InvestorProfile {
  id: string;
  name: string;
  sectorPreferences: string[];
  minTicketSize: number; // Billion IDR
  maxTicketSize: number;
  riskAppetite: 'Conservative' | 'Moderate' | 'Aggressive';
  preferredRegions: string[];
  preferredProvinces: string[];
  investmentHorizon: 'Short' | 'Medium' | 'Long'; // Short < 5yr, Medium 5-10, Long > 10
  focusAreas: string[]; // e.g., ["Green Energy", "Infrastructure", "Digital"]
  pastSectors: string[]; // sectors previously invested in
}

export interface InteractionEvent {
  investorId: string;
  projectId: number;
  eventType: 'view' | 'save' | 'share' | 'inquiry' | 'site_visit' | 'invest';
  timestamp: number;
  weight: number; // explicit weight for each event type
}

export interface MatchScoreBreakdown {
  overall: number;
  contentBased: number;
  collaborative: number;
  contentDetails: {
    sectorMatch: number;
    ticketSizeFit: number;
    regionMatch: number;
    riskAlignment: number;
    horizonFit: number;
    focusAreaMatch: number;
  };
  collaborativeDetails: {
    similarInvestorsScore: number;
    itemSimilarityScore: number;
  };
  reasons: string[];
  confidence: 'High' | 'Medium' | 'Low'; // based on data availability
}

export interface RecommendationResult {
  project: Project;
  score: MatchScoreBreakdown;
  rank: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONTENT_WEIGHTS = {
  sectorMatch: 0.25,
  ticketSizeFit: 0.20,
  regionMatch: 0.20,
  riskAlignment: 0.15,
  horizonFit: 0.10,
  focusAreaMatch: 0.10,
};

const CF_WEIGHTS = {
  userBased: 0.6,
  itemBased: 0.4,
};

const EVENT_WEIGHTS: Record<string, number> = {
  view: 1,
  save: 3,
  share: 2,
  inquiry: 5,
  site_visit: 8,
  invest: 10,
};

// Haversine distance in km
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Score proximity: 0km = 100, 3000km = 0 (linear decay)
function proximityScore(distanceKm: number): number {
  return Math.max(0, Math.round(100 - (distanceKm / 30)));
}

// Risk mapping: IRR ranges → risk categories
const RISK_IRR_MAP: Record<string, [number, number]> = {
  Conservative: [10, 16],
  Moderate: [15, 22],
  Aggressive: [20, 30],
};

// Horizon mapping: payback period ranges
const HORIZON_MAP: Record<string, [number, number]> = {
  Short: [0, 5],
  Medium: [4, 10],
  Long: [8, 20],
};

// ============================================================================
// CONTENT-BASED FILTERING ENGINE
// ============================================================================

/**
 * Calculate sector match score using Jaccard-like similarity
 * with synonym/related sector support
 */
function calculateSectorMatch(
  investorSectors: string[],
  projectSector: string,
  projectSubSector: string,
  projectTags: string[]
): { score: number; reason?: string } {
  if (investorSectors.length === 0) return { score: 50 }; // neutral

  const allProjectAttributes = [
    projectSector.toLowerCase(),
    projectSubSector.toLowerCase(),
    ...projectTags.map(t => t.toLowerCase()),
  ];

  let maxScore = 0;
  let bestMatch = '';

  for (const invSector of investorSectors) {
    const invLower = invSector.toLowerCase();
    
    // Exact match
    if (allProjectAttributes.includes(invLower)) {
      return { score: 100, reason: `Exact sector match: ${invSector}` };
    }
    
    // Partial match (substring)
    for (const attr of allProjectAttributes) {
      if (attr.includes(invLower) || invLower.includes(attr)) {
        const score = 85;
        if (score > maxScore) {
          maxScore = score;
          bestMatch = `Related sector: ${invSector} ↔ ${attr}`;
        }
      }
    }
    
    // Related sectors mapping
    const relatedScore = getRelatedSectorScore(invLower, allProjectAttributes);
    if (relatedScore > maxScore) {
      maxScore = relatedScore;
      bestMatch = `Related domain: ${invSector}`;
    }
  }

  if (maxScore > 0) {
    return { score: maxScore, reason: bestMatch };
  }

  return { score: 15, reason: 'No direct sector match' };
}

/**
 * Related sector mapping for fuzzy matching
 */
function getRelatedSectorScore(investorSector: string, projectAttrs: string[]): number {
  const relatedMap: Record<string, string[]> = {
    'manufacturing': ['industri', 'steel', 'chemical', 'automotive', 'textile', 'processing'],
    'digital': ['data center', 'cloud', 'technology', 'smart city', 'software', 'telecom'],
    'energy': ['geothermal', 'solar', 'renewable', 'power', 'electricity', 'green energy'],
    'agriculture': ['palm oil', 'agroindustry', 'food', 'plantation', 'farming'],
    'mining': ['mineral', 'nickel', 'coal', 'hpal', 'downstream', 'processing'],
    'infrastructure': ['construction', 'transport', 'logistics', 'port', 'road', 'smart city'],
    'tourism': ['hospitality', 'hotel', 'resort', 'travel', 'entertainment'],
    'finance': ['fintech', 'banking', 'insurance', 'capital', 'investment'],
  };

  const related = relatedMap[investorSector] || [];
  let matches = 0;
  
  for (const rel of related) {
    if (projectAttrs.some(attr => attr.includes(rel) || rel.includes(attr))) {
      matches++;
    }
  }

  return matches > 0 ? Math.min(70, 40 + matches * 15) : 0;
}

/**
 * Calculate ticket size fit using Gaussian-like scoring
 * Perfect at center, falls off at edges
 */
function calculateTicketSizeFit(
  minTicket: number,
  maxTicket: number,
  projectValue: number
): { score: number; reason: string } {
  const center = (minTicket + maxTicket) / 2;
  const range = maxTicket - minTicket;
  const halfRange = range / 2;
  
  if (range === 0) {
    const diff = Math.abs(projectValue - center);
    return { 
      score: Math.max(0, 100 - diff * 10), 
      reason: diff < 5 ? 'Exact ticket match' : 'Outside preferred range' 
    };
  }

  // Check if within range
  if (projectValue >= minTicket && projectValue <= maxTicket) {
    // Within range: score based on proximity to center
    const distance = Math.abs(projectValue - center);
    const score = Math.round(80 + (1 - distance / halfRange) * 20);
    return { 
      score, 
      reason: `Within preferred range (Rp ${minTicket}-${maxTicket}T)` 
    };
  }
  
  // Outside range: penalize based on distance
  const distance = projectValue < minTicket 
    ? minTicket - projectValue 
    : projectValue - maxTicket;
  const score = Math.max(0, 60 - distance * 8);
  
  return { 
    score, 
    reason: projectValue < minTicket 
      ? `Below min ticket by Rp ${distance.toFixed(1)}T`
      : `Above max ticket by Rp ${distance.toFixed(1)}T`
  };
}

/**
 * Calculate region match score — combines geospatial proximity + province name matching
 * Primary: haversine distance from project coordinates to region centroids
 * Bonus: province name exact/partial/island match
 */
function calculateRegionMatch(
  preferredProvinces: string[],
  preferredRegions: string[],
  projectProvince: string,
  projectLat: number,
  projectLng: number
): { score: number; reason: string } {
  const provinceLower = projectProvince.toLowerCase();
  
  // ── Geospatial: distance to nearest preferred region centroid ──
  let bestGeoScore = 0;
  let bestGeoReason = '';
  
  if (preferredProvinces.length > 0 || preferredRegions.length > 0) {
    for (const region of regions) {
      const isPreferred = 
        preferredProvinces.some(p => p.toLowerCase() === region.name.toLowerCase()) ||
        preferredRegions.some(r => region.name.toLowerCase().includes(r.toLowerCase()) || r.toLowerCase().includes(region.name.toLowerCase()));
      
      if (!isPreferred) continue;
      
      const dist = haversineDistance(projectLat, projectLng, region.coordinates.lat, region.coordinates.lng);
      const geoScore = proximityScore(dist);
      
      if (geoScore > bestGeoScore) {
        bestGeoScore = geoScore;
        bestGeoReason = `${Math.round(dist)}km to ${region.name}`;
      }
    }
  }
  
  // ── Province name matching (bonus layer) ──
  let nameScore = 0;
  let nameReason = '';
  
  // Exact province match
  if (preferredProvinces.some(p => p.toLowerCase() === provinceLower)) {
    nameScore = 30;
    nameReason = `Preferred province: ${projectProvince}`;
  }
  // Partial province match
  else if (preferredProvinces.some(p => provinceLower.includes(p.toLowerCase()) || p.toLowerCase().includes(provinceLower))) {
    nameScore = 20;
    nameReason = `Related to preferred: ${projectProvince}`;
  }
  // Island match
  else {
    const islandMap: Record<string, string[]> = {
      'sumatra': ['Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Jambi', 'Sumatera Selatan', 'Bengkulu', 'Lampung'],
      'java': ['DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Daerah Istimewa Yogyakarta', 'Jawa Timur', 'Banten'],
      'kalimantan': ['Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara'],
      'sulawesi': ['Sulawesi Utara', 'Sulawesi Tengah', 'Sulawesi Selatan', 'Sulawesi Tenggara', 'Gorontalo'],
      'papua': ['Papua', 'Papua Barat', 'Papua Barat Daya'],
      'bali': ['Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur'],
    };
    
    for (const [island, provinces] of Object.entries(islandMap)) {
      if (preferredRegions.some(r => r.toLowerCase().includes(island))) {
        if (provinces.some(p => p.toLowerCase() === provinceLower)) {
          nameScore = 25;
          nameReason = `In preferred island (${island}): ${projectProvince}`;
          break;
        }
      }
    }
  }
  
  // "Anywhere" preference
  if (nameScore === 0 && preferredRegions.some(r => ['anywhere', 'indonesia', 'all'].includes(r.toLowerCase()))) {
    nameScore = 15;
    nameReason = 'Open to all regions';
  }
  
  // ── Combine: geospatial (70%) + name matching (30%) ──
  const finalScore = Math.min(100, Math.round(bestGeoScore * 0.7 + nameScore * 0.3 + 10));
  
  if (finalScore >= 70) {
    return { score: finalScore, reason: bestGeoReason || nameReason || 'Regional match' };
  } else if (finalScore >= 40) {
    return { score: finalScore, reason: `${bestGeoReason ? bestGeoReason + '; ' : ''}${nameReason || 'Moderate region fit'}` };
  }
  
  return { score: Math.max(5, finalScore), reason: 'Outside preferred regions' };
}

/**
 * Calculate risk alignment based on IRR vs investor risk appetite
 */
function calculateRiskAlignment(
  riskAppetite: string,
  projectIRR: number
): { score: number; reason: string } {
  const range = RISK_IRR_MAP[riskAppetite];
  if (!range) return { score: 50, reason: 'Unknown risk profile' };
  
  const [minIRR, maxIRR] = range;
  
  if (projectIRR >= minIRR && projectIRR <= maxIRR) {
    const center = (minIRR + maxIRR) / 2;
    const dist = Math.abs(projectIRR - center);
    const halfRange = (maxIRR - minIRR) / 2;
    const score = Math.round(85 + (1 - dist / halfRange) * 15);
    return { score, reason: `IRR ${projectIRR}% matches ${riskAppetite} profile (${minIRR}-${maxIRR}%)` };
  }
  
  if (projectIRR < minIRR) {
    const gap = minIRR - projectIRR;
    const score = Math.max(0, 70 - gap * 10);
    return { score, reason: `IRR ${projectIRR}% below ${riskAppetite} threshold (${minIRR}%)` };
  }
  
  // projectIRR > maxIRR
  const gap = projectIRR - maxIRR;
  const score = Math.max(0, 70 - gap * 8);
  return { score, reason: `IRR ${projectIRR}% exceeds ${riskAppetite} comfort zone (${maxIRR}%)` };
}

/**
 * Calculate investment horizon fit based on payback period
 */
function calculateHorizonFit(
  horizon: string,
  paybackPeriod: number
): { score: number; reason: string } {
  const range = HORIZON_MAP[horizon];
  if (!range) return { score: 50, reason: 'Unknown horizon preference' };
  
  const [min, max] = range;
  
  if (paybackPeriod >= min && paybackPeriod <= max) {
    return { score: 100, reason: `Payback ${paybackPeriod}yr fits ${horizon} horizon` };
  }
  
  const distance = paybackPeriod < min ? min - paybackPeriod : paybackPeriod - max;
  const score = Math.max(0, 80 - distance * 12);
  
  return { 
    score, 
    reason: paybackPeriod < min 
      ? `Faster payback (${paybackPeriod}yr vs ${min}yr preferred)`
      : `Longer payback (${paybackPeriod}yr vs ${max}yr preferred)` 
  };
}

/**
 * Calculate focus area match (thematic alignment)
 */
function calculateFocusAreaMatch(
  focusAreas: string[],
  projectTags: string[],
  projectDescription: string
): { score: number; reason: string } {
  if (focusAreas.length === 0) return { score: 50, reason: 'No focus areas specified' };
  
  const allText = [...projectTags, projectDescription].join(' ').toLowerCase();
  let matches = 0;
  const matchedAreas: string[] = [];
  
  for (const area of focusAreas) {
    const areaLower = area.toLowerCase();
    if (allText.includes(areaLower)) {
      matches++;
      matchedAreas.push(area);
    } else {
      // Check synonyms
      const synonyms = getFocusAreaSynonyms(areaLower);
      if (synonyms.some(s => allText.includes(s))) {
        matches += 0.7;
        matchedAreas.push(`${area} (related)`);
      }
    }
  }
  
  const score = Math.min(100, Math.round((matches / focusAreas.length) * 100));
  
  if (matches === 0) return { score: 10, reason: 'No focus area overlap' };
  if (score >= 80) return { score, reason: `Strong focus match: ${matchedAreas.join(', ')}` };
  return { score, reason: `Partial match: ${matchedAreas.join(', ')}` };
}

function getFocusAreaSynonyms(area: string): string[] {
  const synonymMap: Record<string, string[]> = {
    'green energy': ['renewable', 'solar', 'geothermal', 'clean', 'sustainable'],
    'sustainable': ['green', 'eco-friendly', 'rspo', 'esg'],
    'digital': ['technology', 'data center', 'cloud', 'smart', 'software'],
    'infrastructure': ['construction', 'transport', 'logistics', 'port'],
    'downstream': ['processing', 'refining', 'manufacturing', 'hpal'],
    'export': ['export-oriented', 'global market', 'international'],
  };
  return synonymMap[area] || [];
}

/**
 * Main Content-Based Filtering function
 */
export function contentBasedScore(
  investor: InvestorProfile,
  project: Project
): { score: number; details: MatchScoreBreakdown['contentDetails']; reasons: string[] } {
  const sector = calculateSectorMatch(
    investor.sectorPreferences,
    project.sector,
    project.subSector,
    project.tags
  );
  
  const ticketSize = calculateTicketSizeFit(
    investor.minTicketSize,
    investor.maxTicketSize,
    project.investmentValue
  );
  
  const region = calculateRegionMatch(
    investor.preferredProvinces,
    investor.preferredRegions,
    project.province,
    project.coordinates.lat,
    project.coordinates.lng
  );
  
  const risk = calculateRiskAlignment(investor.riskAppetite, project.irr);
  const horizon = calculateHorizonFit(investor.investmentHorizon, project.paybackPeriod);
  const focus = calculateFocusAreaMatch(investor.focusAreas, project.tags, project.description);
  
  const details = {
    sectorMatch: sector.score,
    ticketSizeFit: ticketSize.score,
    regionMatch: region.score,
    riskAlignment: risk.score,
    horizonFit: horizon.score,
    focusAreaMatch: focus.score,
  };
  
  const score = Math.round(
    details.sectorMatch * CONTENT_WEIGHTS.sectorMatch +
    details.ticketSizeFit * CONTENT_WEIGHTS.ticketSizeFit +
    details.regionMatch * CONTENT_WEIGHTS.regionMatch +
    details.riskAlignment * CONTENT_WEIGHTS.riskAlignment +
    details.horizonFit * CONTENT_WEIGHTS.horizonFit +
    details.focusAreaMatch * CONTENT_WEIGHTS.focusAreaMatch
  );
  
  const reasons = [
    sector.reason || `Sector match: ${sector.score}%`,
    ticketSize.reason,
    region.reason,
    risk.reason,
    horizon.reason,
    focus.reason,
  ].filter(Boolean);
  
  return { score, details, reasons };
}

// ============================================================================
// COLLABORATIVE FILTERING ENGINE
// ============================================================================

/**
 * Build user-project interaction matrix
 */
function buildInteractionMatrix(
  interactions: InteractionEvent[],
  investorIds: string[],
  projectIds: number[]
): number[][] {
  const matrix: number[][] = investorIds.map(() => projectIds.map(() => 0));
  
  for (const event of interactions) {
    const userIdx = investorIds.indexOf(event.investorId);
    const itemIdx = projectIds.indexOf(event.projectId);
    if (userIdx !== -1 && itemIdx !== -1) {
      matrix[userIdx][itemIdx] += event.weight;
    }
  }
  
  return matrix;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * User-based Collaborative Filtering
 * Find similar investors and infer preference
 */
function userBasedCF(
  targetInvestorId: string,
  targetProjectId: number,
  interactions: InteractionEvent[],
  allInvestorIds: string[],
  allProjectIds: number[]
): { score: number; similarCount: number } {
  const matrix = buildInteractionMatrix(interactions, allInvestorIds, allProjectIds);
  const targetIdx = allInvestorIds.indexOf(targetInvestorId);
  const projectIdx = allProjectIds.indexOf(targetProjectId);
  
  if (targetIdx === -1 || projectIdx === -1) return { score: 0, similarCount: 0 };
  
  const targetVector = matrix[targetIdx];
  
  // Find similar users (who rated the same projects)
  const similarities: { idx: number; sim: number }[] = [];
  for (let i = 0; i < matrix.length; i++) {
    if (i !== targetIdx) {
      const sim = cosineSimilarity(targetVector, matrix[i]);
      if (sim > 0) similarities.push({ idx: i, sim });
    }
  }
  
  // Sort by similarity, take top 5
  similarities.sort((a, b) => b.sim - a.sim);
  const topSimilar = similarities.slice(0, 5);
  
  if (topSimilar.length === 0) return { score: 0, similarCount: 0 };
  
  // Weighted average of similar users' ratings for this project
  let weightedSum = 0;
  let simSum = 0;
  
  for (const { idx, sim } of topSimilar) {
    weightedSum += matrix[idx][projectIdx] * sim;
    simSum += sim;
  }
  
  // Normalize to 0-100
  const rawScore = simSum > 0 ? weightedSum / simSum : 0;
  const maxPossible = 10; // max event weight
  const normalizedScore = Math.min(100, (rawScore / maxPossible) * 100);
  
  return { score: Math.round(normalizedScore), similarCount: topSimilar.length };
}

/**
 * Item-based Collaborative Filtering
 * Find similar projects based on co-interaction patterns
 */
function itemBasedCF(
  targetInvestorId: string,
  targetProjectId: number,
  interactions: InteractionEvent[],
  allInvestorIds: string[],
  allProjectIds: number[]
): { score: number; similarCount: number } {
  const matrix = buildInteractionMatrix(interactions, allInvestorIds, allProjectIds);
  const targetIdx = allInvestorIds.indexOf(targetInvestorId);
  const projectIdx = allProjectIds.indexOf(targetProjectId);
  
  if (targetIdx === -1 || projectIdx === -1) return { score: 0, similarCount: 0 };
  
  // Get projects the target investor has interacted with
  const interactedProjectIndices: number[] = [];
  for (let j = 0; j < allProjectIds.length; j++) {
    if (matrix[targetIdx][j] > 0) interactedProjectIndices.push(j);
  }
  
  if (interactedProjectIndices.length === 0) return { score: 0, similarCount: 0 };
  
  // Build item vectors (columns of matrix)
  const getItemVector = (projIdx: number) => matrix.map(row => row[projIdx]);
  const targetItemVector = getItemVector(projectIdx);
  
  // Find similar items
  const similarities: { idx: number; sim: number; userRating: number }[] = [];
  for (const interactedIdx of interactedProjectIndices) {
    if (interactedIdx === projectIdx) continue;
    const itemVector = getItemVector(interactedIdx);
    const sim = cosineSimilarity(targetItemVector, itemVector);
    if (sim > 0) {
      similarities.push({ idx: interactedIdx, sim, userRating: matrix[targetIdx][interactedIdx] });
    }
  }
  
  similarities.sort((a, b) => b.sim - a.sim);
  const topSimilar = similarities.slice(0, 5);
  
  if (topSimilar.length === 0) return { score: 0, similarCount: 0 };
  
  let weightedSum = 0;
  let simSum = 0;
  
  for (const { sim, userRating } of topSimilar) {
    weightedSum += userRating * sim;
    simSum += sim;
  }
  
  const rawScore = simSum > 0 ? weightedSum / simSum : 0;
  const normalizedScore = Math.min(100, (rawScore / 10) * 100);
  
  return { score: Math.round(normalizedScore), similarCount: topSimilar.length };
}

/**
 * Main Collaborative Filtering function
 */
export function collaborativeScore(
  investor: InvestorProfile,
  project: Project,
  allInteractions: InteractionEvent[],
  allInvestorIds: string[]
): { score: number; details: MatchScoreBreakdown['collaborativeDetails'] } {
  const projectIds = projects.map(p => p.id);
  
  const userBased = userBasedCF(
    investor.id, project.id, allInteractions, allInvestorIds, projectIds
  );
  
  const itemBased = itemBasedCF(
    investor.id, project.id, allInteractions, allInvestorIds, projectIds
  );
  
  const score = Math.round(
    userBased.score * CF_WEIGHTS.userBased +
    itemBased.score * CF_WEIGHTS.itemBased
  );
  
  return {
    score,
    details: {
      similarInvestorsScore: userBased.score,
      itemSimilarityScore: itemBased.score,
    },
  };
}

// ============================================================================
// HYBRID RECOMMENDER
// ============================================================================

interface HybridConfig {
  contentWeight: number;   // 0-1, e.g., 0.6
  cfWeight: number;        // 0-1, e.g., 0.4
  coldStartThreshold: number; // min interactions for CF to activate
}

const DEFAULT_CONFIG: HybridConfig = {
  contentWeight: 0.6,
  cfWeight: 0.4,
  coldStartThreshold: 3, // minimum 3 interactions to use CF
};

/**
 * Count investor interactions
 */
function countInvestorInteractions(investorId: string, interactions: InteractionEvent[]): number {
  return interactions.filter(i => i.investorId === investorId).length;
}

/**
 * Main Hybrid Recommendation function
 */
export function getRecommendationScore(
  investor: InvestorProfile,
  project: Project,
  allInteractions: InteractionEvent[],
  allInvestorIds: string[],
  config: HybridConfig = DEFAULT_CONFIG
): MatchScoreBreakdown {
  // Content-based score (always available)
  const cb = contentBasedScore(investor, project);
  
  // Collaborative filtering score (conditional)
  const interactionCount = countInvestorInteractions(investor.id, allInteractions);
  const hasEnoughData = interactionCount >= config.coldStartThreshold;
  
  let cfScore = 0;
  let cfDetails: MatchScoreBreakdown['collaborativeDetails'] = {
    similarInvestorsScore: 0,
    itemSimilarityScore: 0,
  };
  
  if (hasEnoughData) {
    const cf = collaborativeScore(investor, project, allInteractions, allInvestorIds);
    cfScore = cf.score;
    cfDetails = cf.details;
  }
  
  // Weight combination (cold start: 100% content-based)
  let overall: number;
  let confidence: 'High' | 'Medium' | 'Low';
  
  if (hasEnoughData) {
    overall = Math.round(cb.score * config.contentWeight + cfScore * config.cfWeight);
    confidence = interactionCount >= 10 ? 'High' : 'Medium';
  } else {
    overall = cb.score;
    confidence = 'Low';
  }
  
  // Build reasons
  const reasons = [...cb.reasons];
  if (hasEnoughData && cfScore > 30) {
    reasons.push(`${interactionCount} similar investor patterns found`);
  }
  if (!hasEnoughData) {
    reasons.push('Personalizing based on profile (complete your profile for better matches)');
  }
  
  return {
    overall: Math.min(100, overall),
    contentBased: cb.score,
    collaborative: cfScore,
    contentDetails: cb.details,
    collaborativeDetails: cfDetails,
    reasons: reasons.slice(0, 4), // top 4 reasons
    confidence,
  };
}

/**
 * Get ranked recommendations for an investor
 */
export function getRankedRecommendations(
  investor: InvestorProfile,
  allInteractions: InteractionEvent[],
  allInvestorIds: string[],
  config?: HybridConfig
): RecommendationResult[] {
  const scored = projects.map(project => {
    const score = getRecommendationScore(investor, project, allInteractions, allInvestorIds, config);
    return { project, score, rank: 0 };
  });
  
  // Sort by overall score descending
  scored.sort((a, b) => b.score.overall - a.score.overall);
  
  // Assign ranks
  scored.forEach((item, idx) => { item.rank = idx + 1; });
  
  return scored;
}

/**
 * Get top N recommendations
 */
export function getTopRecommendations(
  investor: InvestorProfile,
  allInteractions: InteractionEvent[],
  allInvestorIds: string[],
  topN: number = 6,
  config?: HybridConfig
): RecommendationResult[] {
  const all = getRankedRecommendations(investor, allInteractions, allInvestorIds, config);
  return all.slice(0, topN);
}

// ============================================================================
// FALLBACK / UTILITY
// ============================================================================

/**
 * Generate explanations for why a project was recommended
 */
export function generateExplanation(score: MatchScoreBreakdown): string {
  const topReason = score.reasons[0] || 'Based on your profile';
  
  if (score.confidence === 'High') {
    return `${topReason}. Validated by ${Math.round(score.collaborative)}% pattern match with similar investors.`;
  }
  if (score.confidence === 'Medium') {
    return `${topReason}. Improving as more interaction data is collected.`;
  }
  return `${topReason}. Rate more projects to improve recommendations.`;
}

/**
 * Simulate interaction recording (placeholder for real analytics backend)
 */
export function recordInteraction(
  investorId: string,
  projectId: number,
  eventType: InteractionEvent['eventType'],
  existingInteractions: InteractionEvent[]
): InteractionEvent[] {
  const newEvent: InteractionEvent = {
    investorId,
    projectId,
    eventType,
    timestamp: Date.now(),
    weight: EVENT_WEIGHTS[eventType] || 1,
  };
  
  return [...existingInteractions, newEvent];
}
