/**
 * REGULATORY ASSESSMENT ENGINE
 * 
 * Evaluates regulatory compliance and permit status for investment projects.
 * Critical for foreign investors to understand legal feasibility.
 * 
 * Data Sources (Production): OSS RBA, BKPM DIPP, Kemenkeu Tax Holiday,
 *                           KLHK AMDAL, BPK Kawasan Hutan
 */

// ============================================================================
// TYPES
// ============================================================================

export interface RegulatoryAssessment {
  overallScore: number; // 0-100
  status: 'Investment Ready' | 'Permit In Progress' | 'Regulatory Risks' | 'Restricted';
  confidence: 'High' | 'Medium' | 'Low';
  details: RegulatoryDetails;
  requirements: RequirementItem[];
  riskFlags: string[];
  timeline: RegulatoryTimeline;
}

export interface RegulatoryDetails {
  ossStatus: OSSStatus;
  taxHoliday: TaxHolidayStatus;
  dniScreening: DNIScreening;
  bkpmMasterlist: BKPMMasterlistStatus;
  environmentalPermit: EnvironmentalPermit;
  spatialPlanning: SpatialPlanningStatus;
  regionalIncentives: RegionalIncentive[];
}

export interface OSSStatus {
  nibRegistered: boolean;
  nibNumber?: string;
  riskCategory: 'Low' | 'Medium' | 'High';
  permitsRequired: string[];
  permitsObtained: string[];
  completionPct: number;
}

export interface TaxHolidayStatus {
  eligible: boolean;
  type?: '100% Corporate Income Tax' | '50% Investment Allowance' | 'Net Income Reduction';
  durationYears?: number;
  minimumInvestment?: number;
  notes: string;
}

export interface DNIScreening {
  classification: 'Open' | 'Conditionally Open' | 'Closed' | 'Priority';
  maxForeignOwnership: number; // percentage
  conditionallyOpenNotes?: string;
  prioritySector: boolean;
  priorityNotes?: string;
}

export interface BKPMMasterlistStatus {
  listed: boolean;
  priorityRanking?: number;
  incentiveTier: 'National Strategic' | 'Priority' | 'Standard';
  sources: string[];
}

export interface EnvironmentalPermit {
  category: 'AMDAL' | 'UKL-UPL' | 'SPPL' | 'Exempt';
  status: 'Approved' | 'In Review' | 'Not Yet Applied' | 'Exempt';
  riskLevel: 'Red' | 'Orange' | 'Green';
  estimatedTimeline: string;
  keyRequirements: string[];
}

export interface SpatialPlanningStatus {
  conformant: boolean;
  zoningType: 'Industrial' | 'KEK' | 'Agriculture' | 'Forest' | 'Mixed Use' | 'Conservation';
  forestReleaseRequired: boolean;
  forestReleaseStatus?: 'Approved' | 'In Process' | 'Not Required';
}

export interface RegionalIncentive {
  type: string;
  value: string;
  description: string;
}

export interface RequirementItem {
  requirement: string;
  status: 'Completed' | 'In Progress' | 'Required' | 'Not Required';
  authority: string;
  estimatedDays: number;
}

export interface RegulatoryTimeline {
  totalEstimatedDays: number;
  parallelizableDays: number;
  criticalPathDays: number;
  phases: TimelinePhase[];
}

export interface TimelinePhase {
  phase: string;
  durationDays: number;
  dependencies: string[];
  authority: string;
}

// ============================================================================
// MOCK DATA: Production-ready structured for real data swap
// ============================================================================

// DNI 2021 Negative Investment List mapping
const DNI_MAPPING: Record<string, { classification: DNIScreening['classification'], maxFDI: number, notes?: string }> = {
  'Manufacturing': { classification: 'Open', maxFDI: 100, notes: '100% foreign ownership permitted' },
  'Digital': { classification: 'Open', maxFDI: 100, notes: '100% foreign ownership permitted' },
  'Energy': { classification: 'Conditionally Open', maxFDI: 95, notes: 'Geothermal max 95%, Electricity generation max 100% with conditions' },
  'Infrastructure': { classification: 'Conditionally Open', maxFDI: 95, notes: 'Port max 95%, Toll road max 100% via capital participation' },
  'Mining': { classification: 'Conditionally Open', maxFDI: 0, notes: 'Mineral downstream processing open, exploration restricted' },
  'Agriculture': { classification: 'Conditionally Open', maxFDI: 100, notes: 'Palm oil plantation max 95%, processing 100%' },
};

// Priority sector mapping (matched with KBMT/KPPIP)
const PRIORITY_SECTORS = [
  'Manufacturing', 'Digital', 'Energy', 'Infrastructure', 'Mining'
];

// Tax holiday eligibility by sector
function getTaxHolidayEligibility(sector: string, investmentValue: number): TaxHolidayStatus {
  const minInvestment = 500; // billion IDR minimum
  
  if (investmentValue < minInvestment) {
    return {
      eligible: false,
      notes: `Minimum investment for tax holiday is Rp ${minInvestment}T. Current: Rp ${investmentValue}T`,
    };
  }
  
  const sectorHoliday: Record<string, { type: TaxHolidayStatus['type'], duration: number, minInv: number }> = {
    'Manufacturing': { type: '100% Corporate Income Tax', duration: 20, minInv: 500 },
    'Digital': { type: '100% Corporate Income Tax', duration: 10, minInv: 500 },
    'Energy': { type: '100% Corporate Income Tax', duration: 20, minInv: 700 },
    'Infrastructure': { type: '100% Corporate Income Tax', duration: 20, minInv: 1000 },
    'Mining': { type: '50% Investment Allowance', duration: 15, minInv: 1000 },
    'Agriculture': { type: 'Net Income Reduction', duration: 10, minInv: 500 },
  };
  
  const sh = sectorHoliday[sector];
  if (!sh) return { eligible: false, notes: 'Sector not eligible for tax holiday' };
  
  if (investmentValue >= sh.minInv) {
    return {
      eligible: true,
      type: sh.type,
      durationYears: sh.duration,
      minimumInvestment: sh.minInv,
      notes: `${sh.type} for ${sh.duration} years. Minister of Finance Regulation 208/PMK.010/2020.`,
    };
  }
  
  return {
    eligible: false,
    notes: `Sector eligible but investment below Rp ${sh.minInv}T threshold (current: Rp ${investmentValue}T)`,
  };
}

// Environmental permit category by project type
function getEnvironmentalPermit(sector: string, subSector: string): EnvironmentalPermit {
  const highImpact = ['Steel', 'Chemical', 'Smelting', 'Mining', 'Power Plant'];
  const mediumImpact = ['Data Center', 'Industrial Zone', 'Palm Oil'];
  
  const isHigh = highImpact.some(s => subSector.includes(s) || sector.includes(s));
  const isMedium = mediumImpact.some(s => subSector.includes(s) || sector.includes(s));
  
  if (isHigh) {
    return {
      category: 'AMDAL',
      status: 'In Review',
      riskLevel: 'Red',
      estimatedTimeline: '6-12 months',
      keyRequirements: ['Environmental Impact Analysis', 'Public Consultation', 'KLHK Approval'],
    };
  }
  
  if (isMedium) {
    return {
      category: 'UKL-UPL',
      status: 'In Review',
      riskLevel: 'Orange',
      estimatedTimeline: '3-6 months',
      keyRequirements: ['Environmental Management Plan', 'Monitoring Plan'],
    };
  }
  
  return {
    category: 'SPPL',
    status: 'Approved',
    riskLevel: 'Green',
    estimatedTimeline: '1-2 months',
    keyRequirements: ['Environmental Statement Letter'],
  };
}

// ============================================================================
// MAIN ASSESSMENT FUNCTION
// ============================================================================

export function assessRegulatory(
  projectId: number,
  sector: string,
  subSector: string,
  province: string,
  _location: string,
  investmentValue: number,
  tags: string[]
): RegulatoryAssessment {
  // DNI Screening
  const dniInfo = DNI_MAPPING[sector] || { classification: 'Open' as const, maxFDI: 100, notes: 'General sector, standard rules apply' };
  const isPriority = PRIORITY_SECTORS.includes(sector);
  
  const dniScreening: DNIScreening = {
    classification: dniInfo.classification,
    maxForeignOwnership: dniInfo.maxFDI,
    conditionallyOpenNotes: dniInfo.notes,
    prioritySector: isPriority,
    priorityNotes: isPriority ? 'Included in Priority Sector List (KBMT/KPPIP)' : undefined,
  };
  
  // OSS Status
  const isKEK = tags.includes('KEK');
  const permitsRequired = [
    'NIB (Business Identification Number)',
    isKEK ? 'KEK Enterprise License' : 'Location Permit',
    'Environmental Permit',
    'Building Approval (PBG)',
    'Operational Permit',
  ];
  
  const riskCategory = investmentValue > 500 ? 'High' : investmentValue > 100 ? 'Medium' : 'Low';
  
  const ossStatus: OSSStatus = {
    nibRegistered: true,
    nibNumber: `NIB-${projectId.toString().padStart(10, '0')}`,
    riskCategory,
    permitsRequired,
    permitsObtained: [
      'NIB (Business Identification Number)',
      isKEK ? 'KEK Enterprise License' : undefined,
    ].filter(Boolean) as string[],
    completionPct: isKEK ? 40 : 20,
  };
  
  // Tax Holiday
  const taxHoliday = getTaxHolidayEligibility(sector, investmentValue);
  
  // BKPM Masterlist
  const bkpmMasterlist: BKPMMasterlistStatus = {
    listed: isPriority,
    priorityRanking: isPriority ? projectId : undefined,
    incentiveTier: isPriority ? (investmentValue > 1000 ? 'National Strategic' : 'Priority') : 'Standard',
    sources: ['DIPP BKPM', 'KPPIP Masterplan'],
  };
  
  // Environmental Permit
  const environmentalPermit = getEnvironmentalPermit(sector, subSector);
  
  // Spatial Planning
  const spatialPlanning: SpatialPlanningStatus = {
    conformant: true,
    zoningType: isKEK ? 'KEK' : 'Industrial',
    forestReleaseRequired: ['Kalimantan', 'Papua', 'Sulawesi'].some(r => province.includes(r)),
    forestReleaseStatus: isKEK ? 'Approved' : undefined,
  };
  
  // Regional Incentives
  const regionalIncentives: RegionalIncentive[] = [
    { type: 'KEK Incentive', value: '100% Tax Allowance', description: 'Available for KEK-registered enterprises' },
    { type: 'Import Duty', value: '0%', description: 'Exemption on capital goods for KEK' },
    { type: 'VAT Exemption', value: 'VAT-Free', description: 'Import of raw materials for export production' },
  ];
  
  if (isKEK) {
    regionalIncentives.push(
      { type: 'Land & Building Tax', value: '100% Reduction', description: 'For first 10 years of operation' }
    );
  }
  
  // Requirements List
  const requirements: RequirementItem[] = [
    { requirement: 'NIB Registration', status: 'Completed', authority: 'OSS RBA', estimatedDays: 1 },
    { requirement: 'Environmental Permit', status: environmentalPermit.status === 'Approved' ? 'Completed' : 'In Progress', authority: 'KLHK', estimatedDays: environmentalPermit.category === 'AMDAL' ? 180 : 90 },
    { requirement: 'Location Permit', status: 'In Progress', authority: 'Provincial Government', estimatedDays: 60 },
    { requirement: 'Building Approval (PBG)', status: 'Required', authority: 'PUPR', estimatedDays: 45 },
    { requirement: 'Tax Holiday Application', status: taxHoliday.eligible ? 'Required' : 'Not Required', authority: 'Kemenkeu / BKPM', estimatedDays: 90 },
  ];
  
  // Timeline
  const timeline: RegulatoryTimeline = {
    totalEstimatedDays: 270,
    parallelizableDays: 180,
    criticalPathDays: 150,
    phases: [
      { phase: 'NIB & Pre-permits', durationDays: 30, dependencies: [], authority: 'OSS RBA' },
      { phase: 'Environmental Assessment', durationDays: 120, dependencies: ['NIB'], authority: 'KLHK' },
      { phase: 'Spatial/Location Permits', durationDays: 90, dependencies: ['NIB'], authority: 'Local Gov' },
      { phase: 'Construction Permits', durationDays: 60, dependencies: ['Environmental', 'Location'], authority: 'PUPR' },
    ],
  };
  
  // Calculate overall score
  let score = 50; // base
  
  // DNI bonus
  if (dniScreening.classification === 'Open' || dniScreening.classification === 'Priority') score += 20;
  else if (dniScreening.classification === 'Conditionally Open') score += 10;
  else score -= 30;
  
  // OSS progress
  score += Math.round(ossStatus.completionPct * 0.15);
  
  // Tax holiday
  if (taxHoliday.eligible) score += 15;
  
  // Environmental
  if (environmentalPermit.riskLevel === 'Green') score += 10;
  else if (environmentalPermit.riskLevel === 'Red') score -= 5;
  
  // BKPM listing
  if (bkpmMasterlist.listed) score += 5;
  
  // KEK bonus
  if (isKEK) score += 5;
  
  const finalScore = Math.min(100, Math.max(0, score));
  
  // Determine status
  let status: RegulatoryAssessment['status'];
  if (dniScreening.classification === 'Closed') status = 'Restricted';
  else if (finalScore >= 75) status = 'Investment Ready';
  else if (finalScore >= 50) status = 'Permit In Progress';
  else status = 'Regulatory Risks';
  
  // Risk flags
  const riskFlags: string[] = [];
  if (dniScreening.classification === 'Conditionally Open') {
    riskFlags.push(`Foreign ownership limited to ${dniScreening.maxForeignOwnership}%`);
  }
  if (environmentalPermit.riskLevel === 'Red') {
    riskFlags.push('AMDAL required - 6-12 months environmental assessment');
  }
  if (spatialPlanning.forestReleaseRequired) {
    riskFlags.push('Forest area release permit (PKPH) may be required');
  }
  if (!taxHoliday.eligible && investmentValue < 500) {
    riskFlags.push('Investment below tax holiday threshold (Rp 500T)');
  }
  
  return {
    overallScore: finalScore,
    status,
    confidence: isKEK ? 'High' : 'Medium',
    details: {
      ossStatus,
      taxHoliday,
      dniScreening,
      bkpmMasterlist,
      environmentalPermit,
      spatialPlanning,
      regionalIncentives,
    },
    requirements,
    riskFlags,
    timeline,
  };
}
