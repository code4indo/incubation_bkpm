/**
 * ANALYST AGENT + PIR ZONE VALIDATOR
 * MAS Architecture — BKPM AI Incubation for Public Sector
 * 
 * Role: Feasibility, risk, and spatial alignment expert
 * - Financial viability validation (IRR/NPV benchmark checks)
 * - PIR Zone validation (RTRW/KEK/Kawasan Industri overlay)
 * - Infrastructure gap analysis
 * - Risk flag calculation
 */

import type { Project, Region, Port, Airport } from '@/types';
import { haversineDistance, nearestPortDistance, nearestAirportDistance } from './scoringEngine';

// ============================================================
// TYPES — Analyst Agent Output Schemas
// ============================================================

/** Financial validation result */
export interface FinancialValidation {
  /** Overall financial health score 0-100 */
  score: number;
  /** Is IRR claim realistic vs industry benchmark? */
  irrRealistic: boolean;
  /** Is NPV claim realistic? */
  npvRealistic: boolean;
  /** Is payback period reasonable? */
  paybackReasonable: boolean;
  /** Investment scale category */
  scaleCategory: 'Small' | 'Medium' | 'Large' | 'Mega';
  /** Detailed assessment notes */
  notes: string[];
}

/** Zone validation result (PIR Zone Validator) */
export interface ZoneValidation {
  /** Zone-project alignment score 0-100 */
  alignmentScore: number;
  /** Is the project compatible with its zone? */
  isCompatible: boolean;
  /** List of zoning conflicts found */
  conflicts: string[];
  /** Distance to nearest port in km */
  distanceToPortKm: number;
  /** Distance to nearest airport in km */
  distanceToAirportKm: number;
  /** Infrastructure readiness status */
  infrastructureStatus: 'Ready' | 'Developing' | 'Limited' | 'Minimal';
  /** Alternative zones if current zone is suboptimal */
  alternativeZones: string[];
  /** Nearest KEK/KI recommendations */
  nearestIndustrialZones: string[];
}

/** Infrastructure gap analysis */
export interface InfrastructureGap {
  /** Category of infrastructure */
  category: 'Port' | 'Airport' | 'Road' | 'Energy' | 'Water' | 'Telecom';
  /** Gap severity */
  severity: 'None' | 'Minor' | 'Moderate' | 'Critical';
  /** Distance to nearest facility (km) */
  distanceKm: number;
  /** Description of the gap */
  description: string;
}

/** Risk flag structure */
export interface RiskFlag {
  /** Risk category */
  category: 'Financial' | 'Regulatory' | 'Infrastructure' | 'Market' | 'Environmental' | 'Operational';
  /** Risk severity level */
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  /** Risk description */
  description: string;
  /** Mitigation suggestion */
  mitigation: string;
}

/** Complete Analyst Agent output */
export interface AnalystReport {
  /** Unique trace ID for audit trail */
  traceId: string;
  /** Timestamp of analysis */
  timestamp: string;
  /** Project analyzed */
  projectId: number;
  /** Financial validation results */
  financial: FinancialValidation;
  /** Zone validation results */
  zone: ZoneValidation;
  /** Infrastructure gap analysis */
  infrastructureGaps: InfrastructureGap[];
  /** Risk flags identified */
  riskFlags: RiskFlag[];
  /** Overall feasibility score 0-100 */
  overallFeasibility: number;
  /** Executive summary */
  summary: string;
  /** Confidence score of this analysis 0-1 */
  confidenceScore: number;
}

// ============================================================
// BENCHMARK DATA — Industry IRR/NPV Benchmarks by Sector
// ============================================================

interface SectorBenchmark {
  sector: string;
  irrMin: number;
  irrMax: number;
  irrTypical: number;
  paybackMaxYears: number;
  riskLevel: 'Low' | 'Medium' | 'High';
}

const SECTOR_BENCHMARKS: SectorBenchmark[] = [
  { sector: 'Agroindustry', irrMin: 12, irrMax: 25, irrTypical: 18, paybackMaxYears: 7, riskLevel: 'Medium' },
  { sector: 'Manufacturing', irrMin: 10, irrMax: 22, irrTypical: 16, paybackMaxYears: 8, riskLevel: 'Medium' },
  { sector: 'Tourism', irrMin: 8, irrMax: 20, irrTypical: 14, paybackMaxYears: 10, riskLevel: 'Medium' },
  { sector: 'Energy', irrMin: 8, irrMax: 18, irrTypical: 12, paybackMaxYears: 12, riskLevel: 'Low' },
  { sector: 'Infrastructure', irrMin: 6, irrMax: 15, irrTypical: 10, paybackMaxYears: 15, riskLevel: 'Low' },
  { sector: 'Fisheries', irrMin: 12, irrMax: 28, irrTypical: 20, paybackMaxYears: 6, riskLevel: 'High' },
  { sector: 'Trade', irrMin: 10, irrMax: 25, irrTypical: 18, paybackMaxYears: 5, riskLevel: 'Medium' },
  { sector: 'Digital', irrMin: 15, irrMax: 35, irrTypical: 25, paybackMaxYears: 4, riskLevel: 'High' },
  { sector: 'Mining', irrMin: 10, irrMax: 25, irrTypical: 18, paybackMaxYears: 8, riskLevel: 'High' },
  { sector: 'Chemicals', irrMin: 10, irrMax: 22, irrTypical: 16, paybackMaxYears: 9, riskLevel: 'Medium' },
  { sector: 'Logistics', irrMin: 8, irrMax: 18, irrTypical: 13, paybackMaxYears: 10, riskLevel: 'Low' },
  { sector: 'Health', irrMin: 8, irrMax: 18, irrTypical: 12, paybackMaxYears: 10, riskLevel: 'Low' },
  { sector: 'Education', irrMin: 6, irrMax: 15, irrTypical: 10, paybackMaxYears: 12, riskLevel: 'Low' },
  { sector: 'General', irrMin: 8, irrMax: 20, irrTypical: 14, paybackMaxYears: 8, riskLevel: 'Medium' },
];

// KEK (Kawasan Ekonomi Khusus) and KI (Kawasan Industri) database
const INDUSTRIAL_ZONES: { name: string; lat: number; lng: number; sectors: string[] }[] = [
  { name: 'KEK Sei Mangkei', lat: 2.9, lng: 99.3, sectors: ['Agroindustry', 'Manufacturing', 'Chemicals'] },
  { name: 'KEK Kendal', lat: -6.9, lng: 110.3, sectors: ['Manufacturing', 'Digital', 'Logistics'] },
  { name: 'KEK Batang', lat: -6.9, lng: 109.8, sectors: ['Manufacturing', 'Energy', 'Infrastructure'] },
  { name: 'KEK Maloy', lat: -8.2, lng: 117.4, sectors: ['Mining', 'Energy', 'Manufacturing'] },
  { name: 'KEK Bitung', lat: 1.4, lng: 125.1, sectors: ['Fisheries', 'Agroindustry', 'Trade'] },
  { name: 'KEK Mandalika', lat: -8.9, lng: 116.3, sectors: ['Tourism', 'Trade', 'Infrastructure'] },
  { name: 'KEK Lido', lat: -6.7, lng: 106.8, sectors: ['Tourism', 'Digital', 'Health'] },
  { name: 'KEK Tanjung Kelayang', lat: -2.3, lng: 106.0, sectors: ['Tourism', 'Infrastructure'] },
  { name: 'KEK Morotai', lat: 2.3, lng: 128.4, sectors: ['Fisheries', 'Tourism', 'Agroindustry'] },
  { name: 'KEK Singhasari', lat: -7.9, lng: 112.5, sectors: ['Digital', 'Tourism', 'Education'] },
  { name: 'KEK Palu', lat: -0.9, lng: 119.8, sectors: ['Manufacturing', 'Agroindustry', 'Mining'] },
  { name: 'KI Tanjung Uncang', lat: 1.1, lng: 104.0, sectors: ['Manufacturing', 'Chemicals', 'Energy'] },
  { name: 'KI Pasuruan', lat: -7.6, lng: 112.8, sectors: ['Manufacturing', 'Agroindustry'] },
  { name: 'KI Gresik', lat: -7.1, lng: 112.6, sectors: ['Manufacturing', 'Energy', 'Chemicals'] },
  { name: 'KI Cilegon', lat: -6.0, lng: 106.0, sectors: ['Manufacturing', 'Energy', 'Steel'] },
  { name: 'KI Tuban', lat: -6.9, lng: 111.9, sectors: ['Manufacturing', 'Energy', 'Agroindustry'] },
  { name: 'KI Terpadu Batang', lat: -6.9, lng: 109.8, sectors: ['Manufacturing', 'Energy', 'Digital'] },
  { name: 'KI Medan', lat: 3.6, lng: 98.7, sectors: ['Manufacturing', 'Agroindustry', 'Fisheries'] },
  { name: 'KI Makassar', lat: -5.1, lng: 119.4, sectors: ['Manufacturing', 'Fisheries', 'Agroindustry'] },
  { name: 'KI Banjarmasin', lat: -3.3, lng: 114.6, sectors: ['Manufacturing', 'Mining', 'Agroindustry'] },
];

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function generateTraceId(): string {
  return `tr_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
}

function getBenchmark(sector: string): SectorBenchmark {
  const match = SECTOR_BENCHMARKS.find(b =>
    sector.toLowerCase().includes(b.sector.toLowerCase()) ||
    b.sector.toLowerCase().includes(sector.toLowerCase())
  );
  return match || SECTOR_BENCHMARKS.find(b => b.sector === 'General')!;
}

function categorizeInvestment(valueMillionIdr: number): 'Small' | 'Medium' | 'Large' | 'Mega' {
  const usd = valueMillionIdr * 0.000065; // Rough IDR to USD
  if (usd < 5) return 'Small';
  if (usd < 50) return 'Medium';
  if (usd < 500) return 'Large';
  return 'Mega';
}

// ============================================================
// 1. FINANCIAL MODEL CHECKER
// ============================================================

export function validateFinancials(
  project: Project,
): FinancialValidation {
  const benchmark = getBenchmark(project.sector);
  const notes: string[] = [];
  let score = 50;

  // IRR Validation
  const irrRealistic = project.irr >= benchmark.irrMin && project.irr <= benchmark.irrMax;
  if (irrRealistic) {
    score += 20;
    notes.push(`IRR ${project.irr}% is within realistic range (${benchmark.irrMin}%-${benchmark.irrMax}%) for ${benchmark.sector}`);
  } else if (project.irr > benchmark.irrMax) {
    score += 10;
    notes.push(`IRR ${project.irr}% exceeds typical range — verify with detailed feasibility study`);
  } else {
    notes.push(`IRR ${project.irr}% is below ${benchmark.sector} threshold (${benchmark.irrMin}%) — requires review`);
  }

  // NPV Validation (positive NPV is always good)
  const npvRealistic = project.npv > 0;
  if (npvRealistic) {
    score += 15;
    notes.push(`NPV positive at Rp ${(project.npv / 1000).toFixed(1)}B — project adds value`);
  } else {
    notes.push(`NPV is negative — project may destroy value without strategic benefits`);
  }

  // Payback Period
  const paybackReasonable = project.paybackPeriod <= benchmark.paybackMaxYears;
  if (paybackReasonable) {
    score += 15;
    notes.push(`Payback period ${project.paybackPeriod}y is within acceptable range (<${benchmark.paybackMaxYears}y)`);
  } else {
    notes.push(`Payback period ${project.paybackPeriod}y exceeds ${benchmark.sector} norm — long capital lockup`);
  }

  // Investment Scale Assessment
  const scaleCategory = categorizeInvestment(project.investmentValue);
  notes.push(`Investment scale: ${scaleCategory} (Rp ${(project.investmentValue / 1000).toFixed(1)}T / ~$${(project.investmentValue * 0.065).toFixed(0)}M)`);

  return {
    score: Math.min(100, Math.max(0, score)),
    irrRealistic,
    npvRealistic,
    paybackReasonable,
    scaleCategory,
    notes,
  };
}

// ============================================================
// 2. PIR ZONE VALIDATOR (GIS Overlay)
// ============================================================

export function validateZone(
  project: Project,
  region: Region,
  ports: Port[],
  airports: Airport[],
): ZoneValidation {
  const conflicts: string[] = [];
  const alternativeZones: string[] = [];
  const nearestIndustrialZones: string[] = [];

  // Distance to nearest port/airport
  const portDist = nearestPortDistance(
    project.coordinates.lat,
    project.coordinates.lng,
    ports
  );
  const airportDist = nearestAirportDistance(
    project.coordinates.lat,
    project.coordinates.lng,
    airports
  );

  // Infrastructure status based on distances
  let infrastructureStatus: 'Ready' | 'Developing' | 'Limited' | 'Minimal';
  if (portDist <= 50 && airportDist <= 100) {
    infrastructureStatus = 'Ready';
  } else if (portDist <= 150 && airportDist <= 200) {
    infrastructureStatus = 'Developing';
  } else if (portDist <= 300 && airportDist <= 350) {
    infrastructureStatus = 'Limited';
  } else {
    infrastructureStatus = 'Minimal';
  }

  // Check sector compatibility with region
  const sectorMatch = region.topSectors.some(s =>
    project.sector.toLowerCase().includes(s.toLowerCase()) ||
    s.toLowerCase().includes(project.sector.toLowerCase())
  );
  if (!sectorMatch) {
    conflicts.push(`Project sector "${project.sector}" is not among region's top sectors: ${region.topSectors.join(', ')}`);
    // Suggest alternative zones
    alternativeZones.push(`Consider regions with ${project.sector} focus`);
  }

  // Find nearest KEK/KI zones
  const sortedZones = INDUSTRIAL_ZONES
    .map(z => ({
      ...z,
      dist: haversineDistance(project.coordinates.lat, project.coordinates.lng, z.lat, z.lng),
    }))
    .filter(z => z.sectors.some(s => project.sector.toLowerCase().includes(s.toLowerCase())))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 3);

  nearestIndustrialZones.push(...sortedZones.map(z => `${z.name} (${Math.round(z.dist)}km)`));

  // Zone alignment score
  let alignmentScore = 50; // Base

  // + Sector match
  if (sectorMatch) alignmentScore += 20;

  // + Infrastructure proximity
  if (portDist <= 50) alignmentScore += 15;
  else if (portDist <= 150) alignmentScore += 10;
  else if (portDist <= 300) alignmentScore += 5;

  if (airportDist <= 100) alignmentScore += 10;
  else if (airportDist <= 200) alignmentScore += 5;

  // + Infrastructure status bonus
  if (infrastructureStatus === 'Ready') alignmentScore += 5;

  // + Industrial zone proximity bonus
  if (sortedZones.length > 0 && sortedZones[0].dist <= 100) {
    alignmentScore += 10;
  }

  // - Conflicts penalty
  alignmentScore -= conflicts.length * 10;

  // If conflicts exist, suggest alternatives
  if (conflicts.length > 0 && sortedZones.length > 0) {
    alternativeZones.push(sortedZones[0].name);
  }

  return {
    alignmentScore: Math.min(100, Math.max(0, alignmentScore)),
    isCompatible: sectorMatch && conflicts.length === 0,
    conflicts,
    distanceToPortKm: Math.round(portDist),
    distanceToAirportKm: Math.round(airportDist),
    infrastructureStatus,
    alternativeZones: alternativeZones.length > 0 ? alternativeZones : ['No specific alternative identified'],
    nearestIndustrialZones,
  };
}

// ============================================================
// 3. INFRASTRUCTURE GAP ANALYZER
// ============================================================

export function analyzeInfrastructureGaps(
  project: Project,
  region: Region,
  ports: Port[],
  airports: Airport[],
): InfrastructureGap[] {
  const gaps: InfrastructureGap[] = [];

  // Port access
  const portDist = nearestPortDistance(project.coordinates.lat, project.coordinates.lng, ports);
  gaps.push({
    category: 'Port',
    severity: portDist <= 50 ? 'None' : portDist <= 150 ? 'Minor' : portDist <= 300 ? 'Moderate' : 'Critical',
    distanceKm: Math.round(portDist),
    description: portDist <= 50
      ? 'Project has direct port access'
      : portDist <= 150
      ? `Nearest port ${Math.round(portDist)}km — manageable with logistics planning`
      : `Nearest port ${Math.round(portDist)}km — significant logistics challenge`,
  });

  // Airport access
  const airportDist = nearestAirportDistance(project.coordinates.lat, project.coordinates.lng, airports);
  gaps.push({
    category: 'Airport',
    severity: airportDist <= 100 ? 'None' : airportDist <= 200 ? 'Minor' : airportDist <= 350 ? 'Moderate' : 'Critical',
    distanceKm: Math.round(airportDist),
    description: airportDist <= 100
      ? 'Airport within 100km — good connectivity'
      : airportDist <= 200
      ? `Airport ${Math.round(airportDist)}km — moderate connectivity`
      : `Airport ${Math.round(airportDist)}km — limited air connectivity`,
  });

  // Road/Energy based on region infrastructure score
  if (region.infrastructureScore >= 75) {
    gaps.push({
      category: 'Road',
      severity: 'None',
      distanceKm: 0,
      description: 'Road infrastructure well-developed in region',
    });
    gaps.push({
      category: 'Energy',
      severity: 'None',
      distanceKm: 0,
      description: 'Reliable energy supply in region',
    });
  } else if (region.infrastructureScore >= 50) {
    gaps.push({
      category: 'Road',
      severity: 'Minor',
      distanceKm: 0,
      description: 'Road network adequate but may need upgrades',
    });
    gaps.push({
      category: 'Energy',
      severity: 'Minor',
      distanceKm: 0,
      description: 'Energy supply stable but backup recommended',
    });
  } else {
    gaps.push({
      category: 'Road',
      severity: 'Moderate',
      distanceKm: 0,
      description: 'Road infrastructure below standard — potential delays',
    });
    gaps.push({
      category: 'Energy',
      severity: 'Moderate',
      distanceKm: 0,
      description: 'Energy supply unreliable — generator investment needed',
    });
  }

  // Telecom
  gaps.push({
    category: 'Telecom',
    severity: region.infrastructureScore >= 60 ? 'None' : 'Minor',
    distanceKm: 0,
    description: region.infrastructureScore >= 60
      ? 'Good telecom/digital connectivity'
      : 'Telecom infrastructure may need assessment',
  });

  return gaps;
}

// ============================================================
// 4. RISK CALCULATOR
// ============================================================

export function calculateRiskFlags(
  project: Project,
  region: Region,
  financial: FinancialValidation,
  zone: ZoneValidation,
): RiskFlag[] {
  const risks: RiskFlag[] = [];
  const benchmark = getBenchmark(project.sector);

  // Financial risk
  if (!financial.irrRealistic) {
    risks.push({
      category: 'Financial',
      severity: project.irr < benchmark.irrMin ? 'High' : 'Medium',
      description: `IRR ${project.irr}% is ${project.irr < benchmark.irrMin ? 'below' : 'above'} ${benchmark.sector} benchmark range (${benchmark.irrMin}%-${benchmark.irrMax}%)`,
      mitigation: project.irr < benchmark.irrMin
        ? 'Review revenue assumptions, explore cost optimization, or phased investment approach'
        : 'Verify assumptions — overly optimistic projections may indicate planning gaps',
    });
  }

  if (!financial.npvRealistic) {
    risks.push({
      category: 'Financial',
      severity: 'High',
      description: 'Negative NPV indicates project may not generate adequate returns',
      mitigation: 'Identify strategic/social benefits, explore subsidies, or reduce capex scope',
    });
  }

  // Infrastructure risk
  if (zone.distanceToPortKm > 200) {
    risks.push({
      category: 'Infrastructure',
      severity: zone.distanceToPortKm > 500 ? 'Critical' : 'High',
      description: `Nearest port is ${zone.distanceToPortKm}km away — significant logistics challenge`,
      mitigation: 'Consider on-site warehousing, negotiate freight contracts, or explore alternative sites',
    });
  }

  if (zone.infrastructureStatus === 'Minimal' || zone.infrastructureStatus === 'Limited') {
    risks.push({
      category: 'Infrastructure',
      severity: zone.infrastructureStatus === 'Minimal' ? 'Critical' : 'High',
      description: `Region infrastructure status: ${zone.infrastructureStatus} — may require significant upfront investment`,
      mitigation: 'Budget 15-25% capex for infrastructure development, engage KI/KEK with ready facilities',
    });
  }

  // Regulatory/Zoning risk
  if (zone.conflicts.length > 0) {
    risks.push({
      category: 'Regulatory',
      severity: 'Medium',
      description: zone.conflicts[0],
      mitigation: 'Consult DPMPTSP for zoning adjustments, verify Perda compliance, consider KEK with special privileges',
    });
  }

  // Market risk based on region activity
  if (region.projects < 10) {
    risks.push({
      category: 'Market',
      severity: 'Medium',
      description: `Region has only ${region.projects} active projects — limited investor ecosystem`,
      mitigation: 'Engage with BKPM for pioneer incentives, partner with local businesses for market entry',
    });
  }

  // Operational risk for high-risk sectors
  if (benchmark.riskLevel === 'High') {
    risks.push({
      category: 'Operational',
      severity: 'Medium',
      description: `${benchmark.sector} is classified as high-risk — requires experienced management`,
      mitigation: 'Hire sector-specific consultants, secure insurance, implement phased rollout',
    });
  }

  // Environmental consideration for certain sectors
  if (['Agroindustry', 'Chemicals', 'Mining', 'Fisheries'].some(s => project.sector.toLowerCase().includes(s.toLowerCase()))) {
    risks.push({
      category: 'Environmental',
      severity: 'Medium',
      description: `${project.sector} projects require AMDAL (Environmental Impact Assessment) compliance`,
      mitigation: 'Begin AMDAL process early (6-12 months), engage certified environmental consultant',
    });
  }

  return risks;
}

// ============================================================
// 5. MAIN ANALYST AGENT — Full Pipeline
// ============================================================

/**
 * Run complete Analyst Agent analysis on a project
 * This is the main entry point — combines financial, zone, infrastructure, and risk analysis
 */
export function runAnalystAgent(
  project: Project,
  region: Region,
  ports: Port[],
  airports: Airport[],
): AnalystReport {
  const traceId = generateTraceId();
  const timestamp = new Date().toISOString();

  // Step 1: Financial validation
  const financial = validateFinancials(project);

  // Step 2: Zone validation (PIR Zone Validator)
  const zone = validateZone(project, region, ports, airports);

  // Step 3: Infrastructure gap analysis
  const infrastructureGaps = analyzeInfrastructureGaps(project, region, ports, airports);

  // Step 4: Risk calculation
  const riskFlags = calculateRiskFlags(project, region, financial, zone);

  // Step 5: Calculate overall feasibility
  const financialWeight = 0.30;
  const zoneWeight = 0.30;
  const infraWeight = 0.20;
  const riskWeight = 0.20;

  // Risk penalty: critical=-20, high=-10, medium=-5, low=0
  const riskPenalty = riskFlags.reduce((acc, r) => {
    if (r.severity === 'Critical') return acc + 20;
    if (r.severity === 'High') return acc + 10;
    if (r.severity === 'Medium') return acc + 5;
    return acc;
  }, 0);

  const overallFeasibility = Math.min(100, Math.max(0, Math.round(
    financial.score * financialWeight +
    zone.alignmentScore * zoneWeight +
    (100 - Math.min(infrastructureGaps.filter(g => g.severity !== 'None').length * 15, 60)) * infraWeight +
    Math.max(0, 100 - riskPenalty) * riskWeight
  )));

  // Generate executive summary
  const criticalRisks = riskFlags.filter(r => r.severity === 'Critical').length;
  const highRisks = riskFlags.filter(r => r.severity === 'High').length;

  let summary: string;
  if (overallFeasibility >= 75) {
    summary = `Project shows strong feasibility (${overallFeasibility}/100). Financial metrics are sound, zone alignment is positive.${criticalRisks > 0 ? ` Address ${criticalRisks} critical risk(s) before proceeding.` : ''}`;
  } else if (overallFeasibility >= 50) {
    summary = `Project is viable with conditions (${overallFeasibility}/100). ${highRisks > 0 ? `${highRisks} high-risk item(s) require mitigation.` : 'Some improvements needed.'} Review infrastructure gaps and risk flags.`;
  } else {
    summary = `Project feasibility is limited (${overallFeasibility}/100). ${criticalRisks + highRisks > 0 ? `${criticalRisks + highRisks} significant risk(s) identified.` : 'Multiple challenges found.'} Consider alternative sites or phased approach.`;
  }

  // Confidence score based on data completeness
  const confidenceScore = Math.min(0.95, 0.70 +
    (project.irr > 0 ? 0.05 : 0) +
    (project.npv > 0 ? 0.05 : 0) +
    (project.investmentValue > 0 ? 0.05 : 0) +
    (region.infrastructureScore > 0 ? 0.05 : 0) +
    (ports.length > 0 ? 0.03 : 0) +
    (airports.length > 0 ? 0.02 : 0)
  );

  return {
    traceId,
    timestamp,
    projectId: project.id,
    financial,
    zone,
    infrastructureGaps,
    riskFlags,
    overallFeasibility,
    summary,
    confidenceScore,
  };
}

// ============================================================
// 6. HELPER — Get Risk Color/Severity Badge
// ============================================================

export function getRiskSeverityColor(severity: RiskFlag['severity']): string {
  switch (severity) {
    case 'Critical': return '#dc2626'; // Red
    case 'High': return '#ea580c';     // Orange
    case 'Medium': return '#ca8a04';   // Yellow
    case 'Low': return '#16a34a';      // Green
  }
}

export function getInfrastructureSeverityColor(severity: InfrastructureGap['severity']): string {
  switch (severity) {
    case 'None': return '#16a34a';
    case 'Minor': return '#ca8a04';
    case 'Moderate': return '#ea580c';
    case 'Critical': return '#dc2626';
  }
}

export function getFeasibilityColor(score: number): string {
  if (score >= 75) return '#16a34a';
  if (score >= 50) return '#ca8a04';
  if (score >= 30) return '#ea580c';
  return '#dc2626';
}

export function getFeasibilityLabel(score: number): string {
  if (score >= 75) return 'Highly Feasible';
  if (score >= 50) return 'Feasible with Conditions';
  if (score >= 30) return 'Marginally Feasible';
  return 'Not Recommended';
}
