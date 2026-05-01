export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Project {
  id: number;
  name: string;
  nameEn: string;
  description: string;
  sector: string;
  subSector: string;
  category: 'Primer' | 'Sekunder' | 'Tersier';
  province: string;
  location: string;
  investmentValue: number; // in Billion IDR
  irr: number; // percentage
  npv: number; // in Billion IDR
  paybackPeriod: number; // years
  status: 'Verified' | 'In Progress' | 'Planning';
  image: string;
  tags: string[];
  coordinates: Coordinates;
  matchScore?: number;
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
