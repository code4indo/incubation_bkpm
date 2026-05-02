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

export interface InvestorProfile {
  id: string;
  name: string;
  company: string;
  email: string;
  sectorPreferences: string[];
  minTicketSize: number; // Billion IDR
  maxTicketSize: number; // Billion IDR
  riskAppetite: 'Conservative' | 'Moderate' | 'Aggressive';
  preferredRegions: string[];
}
