export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Project {
  id: number;
  name: string;          // Display name (fallback to ID if EN unavailable)
  nameEn: string;        // English name (if translated)
  nameId: string;        // Original Indonesian name
  description: string;   // Display description (fallback)
  descriptionEn: string; // English description (if translated)
  descriptionId: string; // Original Indonesian description
  sector: string;
  subSector: string;
  category: 'Primer' | 'Sekunder' | 'Tersier';
  province: string;
  location: string;
  investmentValue: number; // in Million IDR (use formatIdr() for display)
  irr: number; // percentage
  npv: number; // in Million IDR (use formatIdr() for display)
  paybackPeriod: number; // years
  status: 'Verified' | 'In Progress' | 'Planning';
  image: string;
  tags: string[];
  coordinates: Coordinates;
  matchScore?: number;
  hasTranslation?: boolean; // true if EN version is available
  kbliCodes?: string[];    // KBLI 2020 codes from BKPM data
  projectType?: 'PID' | 'PPI' | 'IPRO'; // BKPM project classification
}

export interface Region {
  id: number;
  name: string;
  area: number; // km2
  population: number;
  workforce: number;
  umr: number; // monthly minimum wage in IDR
  export: number; // in Million USD
  import: number; // in Million USD
  investmentRealization: number; // in Billion IDR
  infrastructureScore: number; // 0-100
  commodities: string[];
  topSectors: string[];
  projects: number;
  coordinates: Coordinates;
}

export interface Port {
  name: string;
  lat: number;
  lng: number;
  type: string;
  capacity: string;
}

export interface Airport {
  name: string;
  lat: number;
  lng: number;
  type: string;
  iata: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// UNIFIED INVESTOR PROFILE — supports all consumers:
//   - recommendationEngine.ts (content-based + collaborative filtering)
//   - conciergeAgent.ts (profile builder + chat)
//   - cmsEngine.ts (CMS formula: S_content + S_behavior + S_policy + S_risk)
// ═══════════════════════════════════════════════════════════════════════════

export type RiskAppetite = 'Conservative' | 'Moderate' | 'Aggressive';
export type InvestorType = 'SWF' | 'DFI' | 'PE' | 'VC' | 'Corporate' | 'FamilyOffice' | 'Institutional' | 'HNWI';
export type CapexRange = 'Micro' | 'Small' | 'Medium' | 'Large' | 'Mega';
export type ExperienceLevel = 'Novice' | 'Intermediate' | 'Expert';
export type ProjectTypePreference = 'Greenfield' | 'Brownfield' | 'Expansion' | 'JV';
export type InvestmentHorizon = 'Short' | 'Medium' | 'Long'; // Short < 5yr, Medium 5-10, Long > 10

export interface InvestorProfile {
  // ── Identity ──
  id: string;
  name: string;
  company: string;
  email?: string;
  nationality?: string;               // e.g., 'Singapore', 'Japan', 'Indonesia'

  // ── Investor Classification ──
  investorType: InvestorType;         // SWF, DFI, PE, VC, Corporate, FamilyOffice, Institutional, HNWI
  experienceLevel: ExperienceLevel;

  // ── Core Preferences (drive CMS matching) ──
  riskAppetite: RiskAppetite;
  riskToleranceScore: number;         // 0-1 continuous (for S_risk formula: 0=Conservative, 1=Aggressive)
  capexRange: CapexRange;
  minTicketSize: number;              // Billion IDR
  maxTicketSize: number;              // Billion IDR
  sectorPreferences: string[];        // e.g., ['Manufacturing', 'Energy', 'Digital']
  preferredRegions: string[];         // e.g., ['Java', 'Kalimantan']
  preferredProvinces: string[];       // e.g., ['Jawa Tengah', 'Banten']
  investmentHorizon: InvestmentHorizon;

  // ── Advanced Preferences ──
  focusAreas: string[];               // e.g., ['Green Energy', 'Downstream', 'Export']
  pastSectors: string[];              // sectors previously invested in
  preferredProjectTypes: ProjectTypePreference[];
  preferredKbliCodes: string[];       // KBLI 2020 codes of interest
  esgRequirements: string[];          // e.g., ['Carbon Neutral', 'Social Impact']

  // ── Timeline ──
  timelineMonths: number;

  // ── CMS-specific fields ──
  totalInvestments: number;           // N_i: total past interactions/investments (for cold-start)
  investmentHistory: InvestmentRecord[]; // past project investments

  // ── Metadata ──
  profileCompleteness: number;        // 0-100
  isSynthetic: boolean;               // true if semi-synthetic data
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentRecord {
  projectId: number;
  projectSector: string;
  projectProvince: string;
  projectKbli: string[];
  investmentValue: number;            // Billion IDR
  investedAt: string;                 // ISO date
  projectType: 'Greenfield' | 'Brownfield' | 'Expansion' | 'JV';
}

export interface InteractionEvent {
  investorId: string;
  projectId: number;
  eventType: 'view' | 'save' | 'share' | 'inquiry' | 'site_visit' | 'invest';
  timestamp: number;
  weight: number; // explicit weight for each event type
}
