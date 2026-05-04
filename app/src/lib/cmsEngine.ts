/**
 * CMS ENGINE — Composite Matching Score
 *
 * Formula: CMS(i,p) = α·S_content + β·S_behavior + γ·S_policy + δ·S_risk
 * Weights: α=0.35, β=0.25, γ=0.25, δ=0.15
 *
 * Cold-start handling: When N_i=0 (no behavior data),
 *   β redistributed to α: β_adj=0, α_adj=α+β=0.60
 *
 * Sub-scores:
 *   S_content = w1·SectorMatch + w2·GeoMatch + w3·ScaleMatch + w4·StageMatch
 *   S_behavior = w5·D_net + w6·P_domain
 *   S_policy  = Σ policy alignment factors (PSN, DNI, KEK, priority, job creation)
 *   S_risk    = 1 - |R_i - R_p|
 *
 * All scores normalized to [0,1] range.
 */

import type { InvestorProfile, Project, InteractionEvent } from '@/types';
import {
  KBLI_TABLE, PSN_PROJECTS, PRIORITY_SECTORS, REGULATORY_RISK_MAP,
  CMS_WEIGHTS, MACRO_PARAMS, STAGE_COMPATIBILITY, PROJECT_TYPE_MAP,
  getKBLIProximity, isPSNSector, isPrioritySector, getRegulatoryRisk,
  getPrioritySectorInfo,
} from '@/data/referenceData';
import { ALL_SYNTHETIC_INVESTORS, SYNTHETIC_INTERACTIONS, ALL_INVESTOR_IDS } from '@/data/semiSyntheticInvestors';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CMSScoreBreakdown {
  cms: number;            // Final CMS score [0,1]
  sContent: number;       // Content similarity [0,1]
  sBehavior: number;      // Behavioral signal [0,1]
  sPolicy: number;        // Policy alignment [0,1]
  sRisk: number;          // Risk compatibility [0,1]
  isColdStart: boolean;   // Whether cold-start handling was applied
  alphaAdj: number;       // Adjusted alpha weight
  betaAdj: number;        // Adjusted beta weight
  contentDetails: {
    sectorMatch: number;
    geoMatch: number;
    scaleMatch: number;
    stageMatch: number;
  };
  behaviorDetails: {
    dNet: number;         // Network diffusion score
    pDomain: number;      // Domain preference score
    interactionCount: number;
  };
  policyDetails: {
    psnAlignment: number;
    dniAlignment: number;
    kekAlignment: number;
    sectoralPriority: number;
    jobCreationScore: number;
  };
  riskDetails: {
    investorRisk: number;    // R_i
    projectRisk: number;     // R_p
    riskDelta: number;       // |R_i - R_p|
    macroAdjustment: number; // Market volatility adjustment
  };
  reasons: string[];
  confidence: 'High' | 'Medium' | 'Low';
}

export interface CMSRecommendationResult {
  project: Project;
  score: CMSScoreBreakdown;
  rank: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. S_CONTENT — Sector + Geo + Scale + Stage
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sector Match using Jaccard index + KBLI proximity
 * Matches investor's preferred KBLI codes against project's KBLI codes
 * Falls back to sector name matching if no KBLI overlap
 */
function calculateSectorMatch(investor: InvestorProfile, project: Project): { score: number; reason: string } {
  // ── KBLI-based matching (most precise) ──
  if (investor.preferredKbliCodes.length > 0 && project.kbliCodes && project.kbliCodes.length > 0) {
    let maxProximity = 0;
    let bestMatch = '';

    for (const invCode of investor.preferredKbliCodes) {
      for (const projCode of project.kbliCodes) {
        const proximity = getKBLIProximity(invCode, projCode);
        if (proximity > maxProximity) {
          maxProximity = proximity;
          if (proximity === 1.0) bestMatch = `Exact KBLI match: ${invCode}`;
          else if (proximity >= 0.9) bestMatch = `Close KBLI match: ${invCode} ↔ ${projCode} (3-digit)`;
          else if (proximity >= 0.7) bestMatch = `Related KBLI: ${invCode} ↔ ${projCode} (2-digit)`;
        }
      }
    }

    if (maxProximity > 0) {
      return { score: maxProximity, reason: bestMatch || `KBLI proximity: ${maxProximity}` };
    }
  }

  // ── Sector name matching (fallback) ──
  const invSectors = investor.sectorPreferences.map(s => s.toLowerCase());
  const projSector = project.sector.toLowerCase();
  const projSubSector = project.subSector.toLowerCase();
  const projTags = project.tags.map(t => t.toLowerCase());

  // Exact sector match
  if (invSectors.some(s => s === projSector)) {
    return { score: 0.9, reason: `Sector match: ${project.sector}` };
  }

  // Sub-sector or tag match
  const allProjectText = [projSector, projSubSector, ...projTags];
  if (invSectors.some(s => allProjectText.some(t => t.includes(s) || s.includes(t)))) {
    return { score: 0.7, reason: `Related sector: ${project.sector}` };
  }

  // Related sectors mapping
  const relatedMap: Record<string, string[]> = {
    'industri': ['manufacturing', 'perindustrian', 'steel', 'chemical', 'mineral', 'smelter', 'hpal', 'downstream'],
    'digital': ['data center', 'cloud', 'technology', 'smart city', 'software', 'telecom', 'komunikasi'],
    'energi': ['geothermal', 'solar', 'renewable', 'power', 'electricity', 'green energy', 'listrik', 'gas'],
    'pertanian': ['palm oil', 'agroindustry', 'food', 'plantation', 'farming', 'agro', 'sawit', 'kakao', 'kopi'],
    'mining': ['mineral', 'nickel', 'coal', 'batu bara', 'tambang'],
    'infrastruktur': ['construction', 'transport', 'logistics', 'port', 'road', 'konstruksi', 'pengangkutan'],
    'pariwisata': ['hospitality', 'hotel', 'resort', 'travel', 'tourism'],
    'keuangan': ['fintech', 'banking', 'insurance', 'capital'],
    'kesehatan': ['hospital', 'healthcare', 'medical'],
  };

  for (const invSector of invSectors) {
    const related = relatedMap[invSector] || [];
    if (related.some(r => allProjectText.some(t => t.includes(r) || r.includes(t)))) {
      return { score: 0.5, reason: `Related domain: ${invSector} ↔ ${project.sector}` };
    }
  }

  return { score: 0.1, reason: 'No direct sector match' };
}

/**
 * Geo Match — Province + island alignment
 * Exact province: 1.0, Same island: 0.6, "Anywhere": 0.3, No match: 0.05
 */
function calculateGeoMatch(investor: InvestorProfile, project: Project): { score: number; reason: string } {
  const projProvince = project.province;

  // Exact province match
  if (investor.preferredProvinces.some(p => p.toLowerCase() === projProvince.toLowerCase())) {
    return { score: 1.0, reason: `Preferred province: ${projProvince}` };
  }

  // Island group matching
  const islandMap: Record<string, string[]> = {
    'sumatra': ['Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Jambi', 'Sumatera Selatan', 'Bengkulu', 'Lampung', 'Kepulauan Bangka-Belitung', 'Kepulauan Riau'],
    'java': ['DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Daerah Istimewa Yogyakarta', 'Jawa Timur', 'Banten'],
    'kalimantan': ['Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara'],
    'sulawesi': ['Sulawesi Utara', 'Sulawesi Tengah', 'Sulawesi Selatan', 'Sulawesi Tenggara', 'Gorontalo', 'Sulawesi Barat'],
    'papua': ['Papua', 'Papua Barat', 'Papua Barat Daya', 'Papua Selatan', 'Papua Tengah', 'Papua Pegunungan'],
    'bali': ['Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur'],
    'maluku': ['Maluku', 'Maluku Utara'],
  };

  // Check region preference matching
  for (const region of investor.preferredRegions) {
    const regionLower = region.toLowerCase();
    if (['anywhere', 'indonesia', 'all'].includes(regionLower)) {
      return { score: 0.3, reason: 'Open to all regions' };
    }

    const islandProvinces = islandMap[regionLower];
    if (islandProvinces && islandProvinces.some(p => p.toLowerCase() === projProvince.toLowerCase())) {
      return { score: 0.6, reason: `In preferred island (${region}): ${projProvince}` };
    }
  }

  // Check if any preferred province is on the same island
  for (const prefProvince of investor.preferredProvinces) {
    for (const [island, provinces] of Object.entries(islandMap)) {
      if (provinces.some(p => p.toLowerCase() === prefProvince.toLowerCase())) {
        if (provinces.some(p => p.toLowerCase() === projProvince.toLowerCase())) {
          return { score: 0.5, reason: `Same island as preferred: ${projProvince}` };
        }
      }
    }
  }

  return { score: 0.05, reason: 'Outside preferred regions' };
}

/**
 * Scale Match — Logarithmic ratio of investor budget vs project value
 * ScaleMatch = 1 - |log10(budget_center / project_value)| / 3
 * Capped at [0,1]
 */
function calculateScaleMatch(investor: InvestorProfile, project: Project): { score: number; reason: string } {
  const budgetCenter = (investor.minTicketSize + investor.maxTicketSize) / 2;
  // Project value is in Million IDR, investor ticket in Billion IDR
  const projectValueB = project.investmentValue / 1000; // Convert Million to Billion

  if (projectValueB <= 0 || budgetCenter <= 0) return { score: 0.3, reason: 'Unable to compare scale' };

  // Within range check
  if (projectValueB >= investor.minTicketSize && projectValueB <= investor.maxTicketSize) {
    const distance = Math.abs(projectValueB - budgetCenter);
    const halfRange = (investor.maxTicketSize - investor.minTicketSize) / 2;
    const proximity = halfRange > 0 ? 1 - (distance / halfRange) * 0.3 : 0.8;
    return { score: Math.max(0.7, Math.min(1.0, proximity)), reason: `Within budget range (Rp ${investor.minTicketSize}-${investor.maxTicketSize}T)` };
  }

  // Outside range: logarithmic distance
  const logRatio = Math.abs(Math.log10(budgetCenter / projectValueB));
  const score = Math.max(0, 1 - logRatio / 3);

  return {
    score,
    reason: projectValueB < investor.minTicketSize
      ? `Below min ticket (Rp ${projectValueB.toFixed(1)}T < Rp ${investor.minTicketSize}T)`
      : `Above max ticket (Rp ${projectValueB.toFixed(1)}T > Rp ${investor.maxTicketSize}T)`,
  };
}

/**
 * Stage Match — Compatibility matrix: investor type × project type
 * Maps investor type to stage, project BKPM type to project category
 */
function calculateStageMatch(investor: InvestorProfile, project: Project): { score: number; reason: string } {
  // Map investor type to stage
  const investorStageMap: Record<string, string> = {
    'VC': 'EarlyStage',
    'PE': 'Growth',
    'SWF': 'Sovereign',
    'DFI': 'Institutional',
    'Corporate': 'Growth',
    'FamilyOffice': 'Growth',
    'Institutional': 'Institutional',
    'HNWI': 'EarlyStage',
  };
  const investorStage = investorStageMap[investor.investorType] || 'Growth';

  // Map project type to CMS category
  const projectTypeCode = project.projectType || 'PID';
  const projectCmsType = PROJECT_TYPE_MAP[projectTypeCode]?.cmsType || 'Greenfield';

  // Look up compatibility
  const compatMatrix = STAGE_COMPATIBILITY[investorStage];
  if (!compatMatrix) return { score: 0.5, reason: 'Standard stage compatibility' };

  const score = compatMatrix[projectCmsType] ?? 0.5;
  return {
    score,
    reason: `${investor.investorType} × ${projectCmsType}: ${score >= 0.7 ? 'Good' : score >= 0.5 ? 'Fair' : 'Low'} fit`,
  };
}

/**
 * S_CONTENT — Weighted combination of 4 sub-scores
 */
function calculateSContent(investor: InvestorProfile, project: Project): {
  score: number;
  details: CMSScoreBreakdown['contentDetails'];
  reasons: string[];
} {
  const sector = calculateSectorMatch(investor, project);
  const geo = calculateGeoMatch(investor, project);
  const scale = calculateScaleMatch(investor, project);
  const stage = calculateStageMatch(investor, project);

  const { sectorWeight, geoWeight, scaleWeight, stageWeight } = CMS_WEIGHTS;
  const score = sector.score * sectorWeight + geo.score * geoWeight + scale.score * scaleWeight + stage.score * stageWeight;

  return {
    score,
    details: {
      sectorMatch: sector.score,
      geoMatch: geo.score,
      scaleMatch: scale.score,
      stageMatch: stage.score,
    },
    reasons: [sector.reason, geo.reason, scale.reason, stage.reason],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. S_BEHAVIOR — Network Diffusion + Domain Preference
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Investor similarity: sector overlap + type similarity
 */
function investorSimilarity(a: InvestorProfile, b: InvestorProfile): number {
  // Sector overlap (Jaccard)
  const aSectors = new Set(a.sectorPreferences.map(s => s.toLowerCase()));
  const bSectors = new Set(b.sectorPreferences.map(s => s.toLowerCase()));
  const intersection = [...aSectors].filter(s => bSectors.has(s)).length;
  const union = new Set([...aSectors, ...bSectors]).size;
  const sectorSim = union > 0 ? intersection / union : 0;

  // Type similarity
  const typeSim = a.investorType === b.investorType ? 1.0 : 0.3;

  // Region overlap
  const aRegions = new Set(a.preferredRegions.map(r => r.toLowerCase()));
  const bRegions = new Set(b.preferredRegions.map(r => r.toLowerCase()));
  const regIntersection = [...aRegions].filter(r => bRegions.has(r)).length;
  const regUnion = new Set([...aRegions, ...bRegions]).size;
  const regionSim = regUnion > 0 ? regIntersection / regUnion : 0;

  return sectorSim * 0.5 + typeSim * 0.2 + regionSim * 0.3;
}

/**
 * Network Diffusion: D_net(i,p) = Σ_k sim(i,k) · r_kp / Σ_k |r_kj|
 * Where k ranges over all other investors who interacted with project p
 */
function calculateDNet(
  investor: InvestorProfile,
  project: Project,
  allInvestors: InvestorProfile[],
  interactions: InteractionEvent[]
): { score: number; similarCount: number } {
  // Find investors who interacted with this project
  const projectInteractions = interactions.filter(i => i.projectId === project.id);
  if (projectInteractions.length === 0) return { score: 0, similarCount: 0 };

  // Group by investor
  const investorRatings: Record<string, number> = {};
  for (const event of projectInteractions) {
    investorRatings[event.investorId] = (investorRatings[event.investorId] || 0) + event.weight;
  }

  // Calculate network diffusion
  let numerator = 0;
  let denominator = 0;
  let similarCount = 0;

  for (const [otherId, rating] of Object.entries(investorRatings)) {
    if (otherId === investor.id) continue;
    const otherInvestor = allInvestors.find(i => i.id === otherId);
    if (!otherInvestor) continue;

    const sim = investorSimilarity(investor, otherInvestor);
    if (sim > 0.1) {
      numerator += sim * rating;
      similarCount++;
    }

    // Sum all ratings from this investor (for normalization)
    const allRatingsByOther = interactions.filter(i => i.investorId === otherId);
    denominator += allRatingsByOther.reduce((sum, i) => sum + Math.abs(i.weight), 0);
  }

  if (denominator === 0 || similarCount === 0) return { score: 0, similarCount: 0 };

  // Normalize to [0,1]
  const rawScore = numerator / denominator;
  const normalizedScore = Math.min(1, rawScore / 10); // Cap at 10 (max weight)

  return { score: normalizedScore, similarCount };
}

/**
 * Domain Preference: P_domain(i,p) = n_{i,d(p)} / N_i
 * Fraction of investor's past investments in the same domain as project
 */
function calculatePDomain(investor: InvestorProfile, project: Project): number {
  if (investor.totalInvestments === 0 || investor.investmentHistory.length === 0) return 0;

  const projectSectorLower = project.sector.toLowerCase();
  const sameDomainCount = investor.investmentHistory.filter(h =>
    h.projectSector.toLowerCase() === projectSectorLower
  ).length;

  return sameDomainCount / investor.totalInvestments;
}

/**
 * S_BEHAVIOR — Weighted combination of D_net and P_domain
 */
function calculateSBehavior(
  investor: InvestorProfile,
  project: Project,
  allInvestors: InvestorProfile[],
  interactions: InteractionEvent[]
): {
  score: number;
  details: CMSScoreBreakdown['behaviorDetails'];
  isColdStart: boolean;
} {
  const nInteractions = interactions.filter(i => i.investorId === investor.id).length;
  const isColdStart = investor.totalInvestments < 3 && nInteractions < 3;

  if (isColdStart) {
    return {
      score: 0,
      details: { dNet: 0, pDomain: 0, interactionCount: nInteractions },
      isColdStart: true,
    };
  }

  const dNet = calculateDNet(investor, project, allInvestors, interactions);
  const pDomain = calculatePDomain(investor, project);

  // Weights: D_net 60%, P_domain 40%
  const score = dNet.score * 0.6 + pDomain * 0.4;

  return {
    score,
    details: { dNet: dNet.score, pDomain, interactionCount: nInteractions },
    isColdStart: false,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. S_POLICY — PSN + DNI + KEK + Sectoral Priority + Job Creation
// ═══════════════════════════════════════════════════════════════════════════

function calculateSPolicy(_investor: InvestorProfile, project: Project): {
  score: number;
  details: CMSScoreBreakdown['policyDetails'];
  reasons: string[];
} {
  const reasons: string[] = [];

  // ── PSN Alignment ──
  const isPSN = PSN_PROJECTS.some(p =>
    p.sector.toLowerCase() === project.sector.toLowerCase() &&
    p.province.toLowerCase() === project.province.toLowerCase()
  ) || project.tags.includes('Government Priority') || isPSNSector(project.sector);
  const psnAlignment = isPSN ? 1.0 : 0.3;
  if (isPSN) reasons.push('Aligned with PSN');

  // ── DNI Alignment ──
  const regRisk = getRegulatoryRisk(project.sector);
  const dniAlignment = regRisk.dniClassification === 'Open' ? 1.0
    : regRisk.dniClassification === 'Conditionally Open' ? 0.6
    : 0.1;
  if (dniAlignment >= 0.6) reasons.push(`DNI: ${regRisk.dniClassification}`);

  // ── KEK Alignment ──
  const isKEK = project.tags.some(t => t.toLowerCase().includes('kek'));
  const kekAlignment = isKEK ? 1.0 : 0.4;
  if (isKEK) reasons.push('In KEK zone');

  // ── Sectoral Priority ──
  const sectorInfo = getPrioritySectorInfo(project.sector);
  const sectoralPriority = sectorInfo?.isKBMT ? 1.0
    : sectorInfo?.isDNI ? 0.7
    : 0.3;
  if (sectorInfo?.isKBMT) reasons.push('KBMT priority sector');

  // ── Job Creation Score ──
  const jobMultiplier = sectorInfo?.jobCreationMultiplier || 200;
  const estimatedJobs = (project.investmentValue / 1000) * jobMultiplier / 100; // rough estimate
  const jobCreationScore = Math.min(1, estimatedJobs / 5000); // 5000 jobs = max score
  if (estimatedJobs > 1000) reasons.push(`~${Math.round(estimatedJobs)} jobs projected`);

  // Weighted combination
  const { psnWeight, dniWeight, kekWeight, sectoralPriorityWeight, jobCreationWeight } = CMS_WEIGHTS;
  const score = psnAlignment * psnWeight + dniAlignment * dniWeight +
    kekAlignment * kekWeight + sectoralPriority * sectoralPriorityWeight +
    jobCreationScore * jobCreationWeight;

  return {
    score: Math.min(1, score),
    details: { psnAlignment, dniAlignment, kekAlignment, sectoralPriority, jobCreationScore },
    reasons,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. S_RISK — Risk Compatibility + Macro Adjustment
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Project risk score based on sector regulatory risk + IRR volatility
 */
function calculateProjectRisk(project: Project): number {
  // Base: sector regulatory risk
  const regRisk = getRegulatoryRisk(project.sector);
  let risk = regRisk.riskScore;

  // IRR adjustment: very high IRR = higher risk
  if (project.irr > 30) risk += 0.15;
  else if (project.irr > 20) risk += 0.05;

  // Payback period: longer = higher risk
  if (project.paybackPeriod > 10) risk += 0.1;
  else if (project.paybackPeriod < 3) risk += 0.05; // Too short may be unrealistic

  // Investment size: very small projects may have higher relative risk
  const valueB = project.investmentValue / 1000;
  if (valueB < 1) risk += 0.1;

  return Math.min(1, Math.max(0, risk));
}

/**
 * Macro adjustment based on current market conditions
 */
function calculateMacroAdjustment(): number {
  // Adjust based on USD/IDR volatility, BI rate, etc.
  const volatilityAdjustment = MACRO_PARAMS.idrVolatility12m * 0.5; // Half of volatility as penalty
  const rateAdjustment = MACRO_PARAMS.biRate > 6 ? 0.05 : 0; // High rate = slight penalty
  return -(volatilityAdjustment + rateAdjustment); // Negative = reduces score
}

function calculateSRisk(investor: InvestorProfile, project: Project): {
  score: number;
  details: CMSScoreBreakdown['riskDetails'];
} {
  const R_i = investor.riskToleranceScore; // 0=Conservative, 1=Aggressive
  const R_p = calculateProjectRisk(project);
  const riskDelta = Math.abs(R_i - R_p);
  const macroAdjustment = calculateMacroAdjustment();

  // S_risk = 1 - |R_i - R_p| + macro adjustment
  const score = Math.min(1, Math.max(0, 1 - riskDelta + macroAdjustment));

  return {
    score,
    details: {
      investorRisk: R_i,
      projectRisk: R_p,
      riskDelta,
      macroAdjustment,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. CMS MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate CMS score for investor-project pair
 *
 * CMS(i,p) = α·S_content + β·S_behavior + γ·S_policy + δ·S_risk
 * Cold-start: When N_i=0, β→0, α→α+β
 */
export function calculateCMS(
  investor: InvestorProfile,
  project: Project,
  allInvestors?: InvestorProfile[],
  interactions?: InteractionEvent[]
): CMSScoreBreakdown {
  const investors = allInvestors || ALL_SYNTHETIC_INVESTORS;
  const events = interactions || SYNTHETIC_INTERACTIONS;

  // Calculate sub-scores
  const sContent = calculateSContent(investor, project);
  const sBehavior = calculateSBehavior(investor, project, investors, events);
  const sPolicy = calculateSPolicy(investor, project);
  const sRisk = calculateSRisk(investor, project);

  // Cold-start handling
  const isColdStart = sBehavior.isColdStart;
  const alphaAdj = isColdStart ? CMS_WEIGHTS.alpha + CMS_WEIGHTS.beta : CMS_WEIGHTS.alpha;
  const betaAdj = isColdStart ? 0 : CMS_WEIGHTS.beta;

  // Final CMS score
  const cms = alphaAdj * sContent.score +
    betaAdj * sBehavior.score +
    CMS_WEIGHTS.gamma * sPolicy.score +
    CMS_WEIGHTS.delta * sRisk.score;

  // Build reasons
  const reasons = [
    ...sContent.reasons.filter(r => r),
    ...sPolicy.reasons.filter(r => r),
  ];

  if (isColdStart) {
    reasons.push('Cold-start: using profile-based matching only');
  } else if (sBehavior.details.dNet > 0.3) {
    reasons.push(`Similar investor behavioral patterns detected`);
  }

  // Confidence level
  const confidence: 'High' | 'Medium' | 'Low' = isColdStart ? 'Low'
    : investor.totalInvestments >= 5 ? 'High'
    : 'Medium';

  return {
    cms: Math.min(1, Math.max(0, cms)),
    sContent: sContent.score,
    sBehavior: sBehavior.score,
    sPolicy: sPolicy.score,
    sRisk: sRisk.score,
    isColdStart,
    alphaAdj,
    betaAdj,
    contentDetails: sContent.details,
    behaviorDetails: sBehavior.details,
    policyDetails: sPolicy.details,
    riskDetails: sRisk.details,
    reasons: reasons.slice(0, 5),
    confidence,
  };
}

/**
 * Get ranked CMS recommendations for an investor
 */
export function getCMSRecommendations(
  investor: InvestorProfile,
  projects: Project[],
  allInvestors?: InvestorProfile[],
  interactions?: InteractionEvent[],
  topN: number = 10
): CMSRecommendationResult[] {
  const scored = projects.map(project => {
    const score = calculateCMS(investor, project, allInvestors, interactions);
    return { project, score, rank: 0 };
  });

  // Sort by CMS score descending
  scored.sort((a, b) => b.score.cms - a.score.cms);

  // Assign ranks
  scored.forEach((item, idx) => { item.rank = idx + 1; });

  return scored.slice(0, topN);
}

/**
 * Compare CMS with legacy recommendation engine score
 */
export function compareScores(
  investor: InvestorProfile,
  project: Project,
  legacyScore: number, // 0-100 scale from old engine
  allInvestors?: InvestorProfile[],
  interactions?: InteractionEvent[]
): { cms: CMSScoreBreakdown; legacyNormalized: number; delta: number } {
  const cms = calculateCMS(investor, project, allInvestors, interactions);
  const legacyNormalized = legacyScore / 100;
  const delta = cms.cms - legacyNormalized;

  return { cms, legacyNormalized, delta };
}
