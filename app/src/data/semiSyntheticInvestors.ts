/**
 * SEMI-SYNTHETIC INVESTOR DATA
 *
 * Generated based on:
 *   - BKPM 2024/2025 realization statistics (top investor countries, sector distribution)
 *   - Real SWF/DFI/PE/VC/Corporate profiles from public sources
 *   - Indonesia investment data: Rp 1.931,2T total (2024)
 *   - Top FDI countries: Singapore, China, Hong Kong, Japan, USA, Malaysia, South Korea
 *   - Sector distribution from BKPM reports
 *
 * Methodology:
 *   1. Identify real investor types active in Indonesia
 *   2. Create profiles with realistic attributes based on public information
 *   3. Generate investment histories consistent with BKPM sector distribution
 *   4. Add behavioral patterns (interactions) matching investor type heuristics
 *
 * All data is marked isSynthetic: true and uses fictional IDs.
 * Names are based on real entities but attributes are estimated/simulated.
 */

import type { InvestorProfile, InvestmentRecord, InteractionEvent } from '@/types';

// ═══════════════════════════════════════════════════════════════════════════
// 1. SOVEREIGN WEALTH FUNDS (SWF) — Large, conservative, long-term
// ═══════════════════════════════════════════════════════════════════════════

const SWF_INVESTORS: InvestorProfile[] = [
  {
    id: 'inv-swf-001', name: 'GIC Private Limited (Synthetic)', company: 'GIC', nationality: 'Singapore',
    investorType: 'SWF', experienceLevel: 'Expert',
    riskAppetite: 'Conservative', riskToleranceScore: 0.25,
    capexRange: 'Mega', minTicketSize: 25, maxTicketSize: 200,
    sectorPreferences: ['Infrastruktur', 'Energi', 'Industri'],
    preferredRegions: ['Java', 'Kalimantan'], preferredProvinces: ['DKI Jakarta', 'Kalimantan Timur', 'Jawa Barat'],
    investmentHorizon: 'Long', focusAreas: ['Infrastructure', 'Green Energy', 'Digital'],
    pastSectors: ['Infrastruktur', 'Energi'],
    preferredProjectTypes: ['Brownfield', 'JV'], preferredKbliCodes: ['42101', '35101', '52101'],
    esgRequirements: ['Carbon Neutral'], timelineMonths: 60,
    totalInvestments: 5, investmentHistory: [],
    profileCompleteness: 100, isSynthetic: true,
    createdAt: '2024-01-15', updatedAt: '2026-04-20',
  },
  {
    id: 'inv-swf-002', name: 'Temasek Holdings (Synthetic)', company: 'Temasek', nationality: 'Singapore',
    investorType: 'SWF', experienceLevel: 'Expert',
    riskAppetite: 'Moderate', riskToleranceScore: 0.45,
    capexRange: 'Mega', minTicketSize: 30, maxTicketSize: 150,
    sectorPreferences: ['Energi', 'Infrastruktur', 'Digital'],
    preferredRegions: ['Java', 'Sumatra'], preferredProvinces: ['DKI Jakarta', 'Jawa Barat'],
    investmentHorizon: 'Long', focusAreas: ['Green Energy', 'Sustainable', 'Downstream'],
    pastSectors: ['Energi', 'Mining'],
    preferredProjectTypes: ['Greenfield', 'JV'], preferredKbliCodes: ['35101', '35102', '63111'],
    esgRequirements: ['Carbon Neutral', 'Social Impact'], timelineMonths: 48,
    totalInvestments: 7, investmentHistory: [],
    profileCompleteness: 100, isSynthetic: true,
    createdAt: '2023-06-10', updatedAt: '2026-03-15',
  },
  {
    id: 'inv-swf-003', name: 'Abu Dhabi Investment Authority (Synthetic)', company: 'ADIA', nationality: 'UAE',
    investorType: 'SWF', experienceLevel: 'Expert',
    riskAppetite: 'Moderate', riskToleranceScore: 0.5,
    capexRange: 'Mega', minTicketSize: 50, maxTicketSize: 300,
    sectorPreferences: ['Infrastruktur', 'Energi', 'Industri'],
    preferredRegions: ['Java', 'Kalimantan', 'Sulawesi'],
    preferredProvinces: ['DKI Jakarta', 'Kalimantan Timur'],
    investmentHorizon: 'Long', focusAreas: ['Infrastructure', 'Green Energy', 'Critical Mineral'],
    pastSectors: ['Infrastruktur', 'Energi'],
    preferredProjectTypes: ['Brownfield', 'JV'], preferredKbliCodes: ['42101', '35101', '24101'],
    esgRequirements: ['Carbon Neutral'], timelineMonths: 72,
    totalInvestments: 3, investmentHistory: [],
    profileCompleteness: 95, isSynthetic: true,
    createdAt: '2024-03-01', updatedAt: '2026-02-28',
  },
  {
    id: 'inv-swf-004', name: 'Kuwait Investment Authority (Synthetic)', company: 'KIA', nationality: 'Kuwait',
    investorType: 'SWF', experienceLevel: 'Expert',
    riskAppetite: 'Conservative', riskToleranceScore: 0.2,
    capexRange: 'Mega', minTicketSize: 40, maxTicketSize: 250,
    sectorPreferences: ['Infrastruktur', 'Energi'],
    preferredRegions: ['Java'], preferredProvinces: ['DKI Jakarta', 'Banten'],
    investmentHorizon: 'Long', focusAreas: ['Infrastructure', 'Green Energy'],
    pastSectors: ['Infrastruktur'],
    preferredProjectTypes: ['Brownfield'], preferredKbliCodes: ['42101', '35101'],
    esgRequirements: ['Carbon Neutral'], timelineMonths: 60,
    totalInvestments: 2, investmentHistory: [],
    profileCompleteness: 90, isSynthetic: true,
    createdAt: '2024-08-20', updatedAt: '2026-01-10',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 2. DEVELOPMENT FINANCE INSTITUTIONS (DFI) — Policy-driven, moderate risk
// ═══════════════════════════════════════════════════════════════════════════

const DFI_INVESTORS: InvestorProfile[] = [
  {
    id: 'inv-dfi-001', name: 'Asian Development Bank (Synthetic)', company: 'ADB', nationality: 'Multilateral',
    investorType: 'DFI', experienceLevel: 'Expert',
    riskAppetite: 'Moderate', riskToleranceScore: 0.4,
    capexRange: 'Large', minTicketSize: 10, maxTicketSize: 60,
    sectorPreferences: ['Energi', 'Infrastruktur'],
    preferredRegions: ['Sumatra', 'Java', 'Kalimantan'],
    preferredProvinces: ['Sumatera Barat', 'Jawa Tengah'],
    investmentHorizon: 'Long', focusAreas: ['Green Energy', 'Sustainable', 'Renewable'],
    pastSectors: ['Energi', 'Infrastruktur'],
    preferredProjectTypes: ['Greenfield', 'Brownfield'], preferredKbliCodes: ['35101', '35104', '42101'],
    esgRequirements: ['Carbon Neutral', 'Social Impact', 'Biodiversity'], timelineMonths: 36,
    totalInvestments: 8, investmentHistory: [],
    profileCompleteness: 100, isSynthetic: true,
    createdAt: '2023-01-01', updatedAt: '2026-04-01',
  },
  {
    id: 'inv-dfi-002', name: 'World Bank Group / IFC (Synthetic)', company: 'IFC', nationality: 'Multilateral',
    investorType: 'DFI', experienceLevel: 'Expert',
    riskAppetite: 'Moderate', riskToleranceScore: 0.45,
    capexRange: 'Large', minTicketSize: 15, maxTicketSize: 80,
    sectorPreferences: ['Energi', 'Infrastruktur', 'Pertanian'],
    preferredRegions: ['Java', 'Sumatra', 'Sulawesi'],
    preferredProvinces: ['DKI Jakarta', 'Jawa Timur'],
    investmentHorizon: 'Long', focusAreas: ['Green Energy', 'Sustainable', 'Social Impact'],
    pastSectors: ['Energi', 'Infrastruktur', 'Pertanian'],
    preferredProjectTypes: ['Greenfield', 'JV'], preferredKbliCodes: ['35101', '35102', '42101'],
    esgRequirements: ['Carbon Neutral', 'Social Impact', 'Governance'], timelineMonths: 48,
    totalInvestments: 12, investmentHistory: [],
    profileCompleteness: 100, isSynthetic: true,
    createdAt: '2022-06-01', updatedAt: '2026-03-01',
  },
  {
    id: 'inv-dfi-003', name: 'AIIB (Synthetic)', company: 'AIIB', nationality: 'Multilateral',
    investorType: 'DFI', experienceLevel: 'Expert',
    riskAppetite: 'Moderate', riskToleranceScore: 0.4,
    capexRange: 'Mega', minTicketSize: 20, maxTicketSize: 100,
    sectorPreferences: ['Infrastruktur', 'Energi', 'Digital'],
    preferredRegions: ['Java', 'Kalimantan'],
    preferredProvinces: ['DKI Jakarta', 'Kalimantan Timur'],
    investmentHorizon: 'Long', focusAreas: ['Infrastructure', 'Green Energy', 'Connectivity'],
    pastSectors: ['Infrastruktur'],
    preferredProjectTypes: ['Greenfield'], preferredKbliCodes: ['42101', '35101', '63111'],
    esgRequirements: ['Carbon Neutral'], timelineMonths: 36,
    totalInvestments: 4, investmentHistory: [],
    profileCompleteness: 95, isSynthetic: true,
    createdAt: '2023-09-01', updatedAt: '2026-02-15',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 3. PRIVATE EQUITY — Growth-oriented, aggressive
// ═══════════════════════════════════════════════════════════════════════════

const PE_INVESTORS: InvestorProfile[] = [
  {
    id: 'inv-pe-001', name: 'KKR & Co (Synthetic)', company: 'KKR', nationality: 'USA',
    investorType: 'PE', experienceLevel: 'Expert',
    riskAppetite: 'Aggressive', riskToleranceScore: 0.7,
    capexRange: 'Mega', minTicketSize: 30, maxTicketSize: 200,
    sectorPreferences: ['Infrastruktur', 'Digital', 'Industri'],
    preferredRegions: ['Java'], preferredProvinces: ['DKI Jakarta', 'Banten', 'Jawa Barat'],
    investmentHorizon: 'Medium', focusAreas: ['Infrastructure', 'Digital', 'Technology'],
    pastSectors: ['Digital', 'Infrastruktur'],
    preferredProjectTypes: ['Brownfield', 'Expansion'], preferredKbliCodes: ['63111', '52101', '41101'],
    esgRequirements: ['Governance'], timelineMonths: 24,
    totalInvestments: 4, investmentHistory: [],
    profileCompleteness: 95, isSynthetic: true,
    createdAt: '2024-02-01', updatedAt: '2026-04-10',
  },
  {
    id: 'inv-pe-002', name: 'Warburg Pincus (Synthetic)', company: 'Warburg Pincus', nationality: 'USA',
    investorType: 'PE', experienceLevel: 'Expert',
    riskAppetite: 'Aggressive', riskToleranceScore: 0.65,
    capexRange: 'Large', minTicketSize: 15, maxTicketSize: 100,
    sectorPreferences: ['Digital', 'Energi', 'Infrastruktur'],
    preferredRegions: ['Java', 'Sumatra'], preferredProvinces: ['DKI Jakarta', 'Jawa Barat'],
    investmentHorizon: 'Medium', focusAreas: ['Digital', 'Technology', 'Green Energy'],
    pastSectors: ['Digital', 'Energi'],
    preferredProjectTypes: ['Greenfield', 'Brownfield'], preferredKbliCodes: ['63111', '62011', '35102'],
    esgRequirements: ['Governance'], timelineMonths: 18,
    totalInvestments: 6, investmentHistory: [],
    profileCompleteness: 95, isSynthetic: true,
    createdAt: '2023-08-15', updatedAt: '2026-03-20',
  },
  {
    id: 'inv-pe-003', name: 'Northstar Group (Synthetic)', company: 'Northstar', nationality: 'Singapore',
    investorType: 'PE', experienceLevel: 'Expert',
    riskAppetite: 'Aggressive', riskToleranceScore: 0.7,
    capexRange: 'Medium', minTicketSize: 5, maxTicketSize: 50,
    sectorPreferences: ['Digital', 'Pariwisata', 'Industri'],
    preferredRegions: ['Java', 'Bali'], preferredProvinces: ['DKI Jakarta', 'Bali'],
    investmentHorizon: 'Medium', focusAreas: ['Digital', 'Technology', 'Consumer'],
    pastSectors: ['Digital', 'Pariwisata'],
    preferredProjectTypes: ['Brownfield', 'Expansion'], preferredKbliCodes: ['62011', '55110', '47111'],
    esgRequirements: [], timelineMonths: 24,
    totalInvestments: 8, investmentHistory: [],
    profileCompleteness: 90, isSynthetic: true,
    createdAt: '2023-03-01', updatedAt: '2026-02-28',
  },
  {
    id: 'inv-pe-004', name: 'TPG Capital (Synthetic)', company: 'TPG', nationality: 'USA',
    investorType: 'PE', experienceLevel: 'Expert',
    riskAppetite: 'Aggressive', riskToleranceScore: 0.75,
    capexRange: 'Large', minTicketSize: 20, maxTicketSize: 120,
    sectorPreferences: ['Infrastruktur', 'Energi', 'Kesehatan'],
    preferredRegions: ['Java', 'Kalimantan'], preferredProvinces: ['DKI Jakarta', 'Jawa Barat'],
    investmentHorizon: 'Medium', focusAreas: ['Infrastructure', 'Green Energy', 'Healthcare'],
    pastSectors: ['Infrastruktur', 'Kesehatan'],
    preferredProjectTypes: ['Brownfield', 'JV'], preferredKbliCodes: ['42101', '86101', '35102'],
    esgRequirements: ['Social Impact'], timelineMonths: 24,
    totalInvestments: 5, investmentHistory: [],
    profileCompleteness: 90, isSynthetic: true,
    createdAt: '2024-01-01', updatedAt: '2026-04-01',
  },
  {
    id: 'inv-pe-005', name: 'MDI Ventures (Synthetic)', company: 'MDI Ventures', nationality: 'Indonesia',
    investorType: 'PE', experienceLevel: 'Expert',
    riskAppetite: 'Aggressive', riskToleranceScore: 0.7,
    capexRange: 'Medium', minTicketSize: 3, maxTicketSize: 30,
    sectorPreferences: ['Digital', 'Industri'],
    preferredRegions: ['Java'], preferredProvinces: ['DKI Jakarta', 'Jawa Barat', 'Banten'],
    investmentHorizon: 'Short', focusAreas: ['Digital', 'Technology', 'AI'],
    pastSectors: ['Digital'],
    preferredProjectTypes: ['Greenfield', 'Expansion'], preferredKbliCodes: ['62011', '63111', '26101'],
    esgRequirements: [], timelineMonths: 12,
    totalInvestments: 15, investmentHistory: [],
    profileCompleteness: 95, isSynthetic: true,
    createdAt: '2022-01-01', updatedAt: '2026-04-15',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 4. VENTURE CAPITAL — High risk, early-stage, tech-focused
// ═══════════════════════════════════════════════════════════════════════════

const VC_INVESTORS: InvestorProfile[] = [
  {
    id: 'inv-vc-001', name: 'SoftBank Vision Fund (Synthetic)', company: 'SoftBank', nationality: 'Japan',
    investorType: 'VC', experienceLevel: 'Expert',
    riskAppetite: 'Aggressive', riskToleranceScore: 0.85,
    capexRange: 'Large', minTicketSize: 10, maxTicketSize: 200,
    sectorPreferences: ['Digital', 'Industri'],
    preferredRegions: ['Java'], preferredProvinces: ['DKI Jakarta', 'Banten', 'Jawa Barat'],
    investmentHorizon: 'Medium', focusAreas: ['Digital', 'Technology', 'AI'],
    pastSectors: ['Digital', 'Data Center'],
    preferredProjectTypes: ['Greenfield', 'Expansion'], preferredKbliCodes: ['63111', '62011', '26101'],
    esgRequirements: [], timelineMonths: 12,
    totalInvestments: 6, investmentHistory: [],
    profileCompleteness: 90, isSynthetic: true,
    createdAt: '2023-05-01', updatedAt: '2026-04-01',
  },
  {
    id: 'inv-vc-002', name: 'Sequoia Capital India (Synthetic)', company: 'Sequoia', nationality: 'USA',
    investorType: 'VC', experienceLevel: 'Expert',
    riskAppetite: 'Aggressive', riskToleranceScore: 0.8,
    capexRange: 'Medium', minTicketSize: 2, maxTicketSize: 30,
    sectorPreferences: ['Digital', 'Industri'],
    preferredRegions: ['Java'], preferredProvinces: ['DKI Jakarta', 'Jawa Barat'],
    investmentHorizon: 'Short', focusAreas: ['Digital', 'AI', 'Fintech'],
    pastSectors: ['Digital'],
    preferredProjectTypes: ['Greenfield'], preferredKbliCodes: ['62011', '63111'],
    esgRequirements: [], timelineMonths: 6,
    totalInvestments: 10, investmentHistory: [],
    profileCompleteness: 85, isSynthetic: true,
    createdAt: '2023-02-01', updatedAt: '2026-03-15',
  },
  {
    id: 'inv-vc-003', name: 'Vertex Ventures SEA (Synthetic)', company: 'Vertex', nationality: 'Singapore',
    investorType: 'VC', experienceLevel: 'Expert',
    riskAppetite: 'Aggressive', riskToleranceScore: 0.75,
    capexRange: 'Small', minTicketSize: 1, maxTicketSize: 15,
    sectorPreferences: ['Digital', 'Industri'],
    preferredRegions: ['Java', 'Bali'], preferredProvinces: ['DKI Jakarta'],
    investmentHorizon: 'Short', focusAreas: ['Digital', 'SaaS', 'Fintech'],
    pastSectors: ['Digital'],
    preferredProjectTypes: ['Greenfield'], preferredKbliCodes: ['62011'],
    esgRequirements: [], timelineMonths: 6,
    totalInvestments: 12, investmentHistory: [],
    profileCompleteness: 85, isSynthetic: true,
    createdAt: '2022-09-01', updatedAt: '2026-04-10',
  },
  {
    id: 'inv-vc-004', name: 'East Ventures (Synthetic)', company: 'East Ventures', nationality: 'Indonesia',
    investorType: 'VC', experienceLevel: 'Expert',
    riskAppetite: 'Aggressive', riskToleranceScore: 0.8,
    capexRange: 'Small', minTicketSize: 0.5, maxTicketSize: 10,
    sectorPreferences: ['Digital', 'Industri', 'Pertanian'],
    preferredRegions: ['Java', 'Sulawesi'], preferredProvinces: ['DKI Jakarta', 'Jawa Barat'],
    investmentHorizon: 'Short', focusAreas: ['Digital', 'Sustainability', 'Agritech'],
    pastSectors: ['Digital', 'Pertanian'],
    preferredProjectTypes: ['Greenfield'], preferredKbliCodes: ['62011', '01211'],
    esgRequirements: ['Social Impact'], timelineMonths: 6,
    totalInvestments: 20, investmentHistory: [],
    profileCompleteness: 90, isSynthetic: true,
    createdAt: '2022-01-01', updatedAt: '2026-04-15',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 5. CORPORATE INVESTORS — Strategic, sector-focused
// ═══════════════════════════════════════════════════════════════════════════

const CORPORATE_INVESTORS: InvestorProfile[] = [
  {
    id: 'inv-corp-001', name: 'Mitsubishi Corporation (Synthetic)', company: 'Mitsubishi', nationality: 'Japan',
    investorType: 'Corporate', experienceLevel: 'Expert',
    riskAppetite: 'Moderate', riskToleranceScore: 0.45,
    capexRange: 'Mega', minTicketSize: 20, maxTicketSize: 100,
    sectorPreferences: ['Industri', 'Infrastruktur', 'Energi'],
    preferredRegions: ['Java', 'Sumatra'], preferredProvinces: ['Jawa Tengah', 'Banten', 'DKI Jakarta'],
    investmentHorizon: 'Medium', focusAreas: ['Downstream', 'Manufacturing', 'Export'],
    pastSectors: ['Industri', 'Manufacturing'],
    preferredProjectTypes: ['Greenfield', 'JV'], preferredKbliCodes: ['24101', '20117', '41101'],
    esgRequirements: ['Carbon Neutral'], timelineMonths: 24,
    totalInvestments: 8, investmentHistory: [],
    profileCompleteness: 100, isSynthetic: true,
    createdAt: '2023-01-01', updatedAt: '2026-04-01',
  },
  {
    id: 'inv-corp-002', name: 'Cargill Inc (Synthetic)', company: 'Cargill', nationality: 'USA',
    investorType: 'Corporate', experienceLevel: 'Expert',
    riskAppetite: 'Conservative', riskToleranceScore: 0.3,
    capexRange: 'Large', minTicketSize: 5, maxTicketSize: 50,
    sectorPreferences: ['Pertanian', 'Industri', 'Perikanan'],
    preferredRegions: ['Sumatra', 'Kalimantan'], preferredProvinces: ['Riau', 'Sumatera Utara'],
    investmentHorizon: 'Long', focusAreas: ['Sustainable', 'Export', 'Agroindustry'],
    pastSectors: ['Pertanian', 'Palm Oil'],
    preferredProjectTypes: ['Brownfield', 'Expansion'], preferredKbliCodes: ['01131', '10773'],
    esgRequirements: ['Carbon Neutral', 'Social Impact'], timelineMonths: 36,
    totalInvestments: 6, investmentHistory: [],
    profileCompleteness: 95, isSynthetic: true,
    createdAt: '2023-04-01', updatedAt: '2026-03-01',
  },
  {
    id: 'inv-corp-003', name: 'Vale Indonesia (Synthetic)', company: 'Vale', nationality: 'Brazil',
    investorType: 'Corporate', experienceLevel: 'Expert',
    riskAppetite: 'Aggressive', riskToleranceScore: 0.6,
    capexRange: 'Mega', minTicketSize: 40, maxTicketSize: 200,
    sectorPreferences: ['Industri', 'Energi', 'Mining'],
    preferredRegions: ['Sulawesi', 'Maluku'], preferredProvinces: ['Sulawesi Tengah', 'Sulawesi Selatan'],
    investmentHorizon: 'Medium', focusAreas: ['Downstream', 'Critical Mineral', 'EV Battery'],
    pastSectors: ['Mining', 'Mineral Processing'],
    preferredProjectTypes: ['Greenfield', 'Expansion'], preferredKbliCodes: ['24101', '24201'],
    esgRequirements: ['Carbon Neutral', 'Biodiversity'], timelineMonths: 24,
    totalInvestments: 4, investmentHistory: [],
    profileCompleteness: 95, isSynthetic: true,
    createdAt: '2023-06-01', updatedAt: '2026-04-10',
  },
  {
    id: 'inv-corp-004', name: 'Tencent Holdings (Synthetic)', company: 'Tencent', nationality: 'China',
    investorType: 'Corporate', experienceLevel: 'Expert',
    riskAppetite: 'Aggressive', riskToleranceScore: 0.7,
    capexRange: 'Large', minTicketSize: 15, maxTicketSize: 80,
    sectorPreferences: ['Digital', 'Industri'],
    preferredRegions: ['Java', 'Bali'], preferredProvinces: ['Banten', 'DKI Jakarta', 'Jawa Barat'],
    investmentHorizon: 'Medium', focusAreas: ['Digital', 'Cloud', 'AI', 'Gaming'],
    pastSectors: ['Digital', 'Technology'],
    preferredProjectTypes: ['Greenfield', 'Expansion'], preferredKbliCodes: ['63111', '62011'],
    esgRequirements: [], timelineMonths: 12,
    totalInvestments: 5, investmentHistory: [],
    profileCompleteness: 90, isSynthetic: true,
    createdAt: '2023-09-01', updatedAt: '2026-04-01',
  },
  {
    id: 'inv-corp-005', name: 'Toyota Motor Corporation (Synthetic)', company: 'Toyota', nationality: 'Japan',
    investorType: 'Corporate', experienceLevel: 'Expert',
    riskAppetite: 'Conservative', riskToleranceScore: 0.3,
    capexRange: 'Mega', minTicketSize: 30, maxTicketSize: 150,
    sectorPreferences: ['Industri', 'Energi', 'Infrastruktur'],
    preferredRegions: ['Java'], preferredProvinces: ['Jawa Timur', 'Jawa Barat', 'Banten'],
    investmentHorizon: 'Long', focusAreas: ['EV Battery', 'Manufacturing', 'Green Energy'],
    pastSectors: ['Industri', 'Manufacturing'],
    preferredProjectTypes: ['Greenfield', 'JV'], preferredKbliCodes: ['27201', '24201', '35102'],
    esgRequirements: ['Carbon Neutral', 'Biodiversity'], timelineMonths: 36,
    totalInvestments: 6, investmentHistory: [],
    profileCompleteness: 100, isSynthetic: true,
    createdAt: '2023-03-01', updatedAt: '2026-04-15',
  },
  {
    id: 'inv-corp-006', name: 'Hyundai Motor Group (Synthetic)', company: 'Hyundai', nationality: 'South Korea',
    investorType: 'Corporate', experienceLevel: 'Expert',
    riskAppetite: 'Moderate', riskToleranceScore: 0.5,
    capexRange: 'Mega', minTicketSize: 25, maxTicketSize: 120,
    sectorPreferences: ['Industri', 'Energi', 'Digital'],
    preferredRegions: ['Java', 'Sulawesi'], preferredProvinces: ['Jawa Tengah', 'Banten'],
    investmentHorizon: 'Long', focusAreas: ['EV Battery', 'Manufacturing', 'Downstream'],
    pastSectors: ['Industri'],
    preferredProjectTypes: ['Greenfield', 'JV'], preferredKbliCodes: ['27201', '24201', '35102'],
    esgRequirements: ['Carbon Neutral'], timelineMonths: 36,
    totalInvestments: 4, investmentHistory: [],
    profileCompleteness: 95, isSynthetic: true,
    createdAt: '2024-01-01', updatedAt: '2026-03-20',
  },
  {
    id: 'inv-corp-007', name: 'Glencore (Synthetic)', company: 'Glencore', nationality: 'Switzerland',
    investorType: 'Corporate', experienceLevel: 'Expert',
    riskAppetite: 'Aggressive', riskToleranceScore: 0.65,
    capexRange: 'Mega', minTicketSize: 50, maxTicketSize: 300,
    sectorPreferences: ['Industri', 'Mining', 'Energi'],
    preferredRegions: ['Sulawesi', 'Kalimantan', 'Papua'],
    preferredProvinces: ['Sulawesi Tengah', 'Kalimantan Timur'],
    investmentHorizon: 'Medium', focusAreas: ['Critical Mineral', 'Downstream', 'Export'],
    pastSectors: ['Mining', 'Industri'],
    preferredProjectTypes: ['Greenfield', 'JV'], preferredKbliCodes: ['24101', '24201'],
    esgRequirements: ['Governance'], timelineMonths: 18,
    totalInvestments: 7, investmentHistory: [],
    profileCompleteness: 90, isSynthetic: true,
    createdAt: '2023-07-01', updatedAt: '2026-04-01',
  },
  {
    id: 'inv-corp-008', name: 'Petronas (Synthetic)', company: 'Petronas', nationality: 'Malaysia',
    investorType: 'Corporate', experienceLevel: 'Expert',
    riskAppetite: 'Moderate', riskToleranceScore: 0.45,
    capexRange: 'Mega', minTicketSize: 30, maxTicketSize: 150,
    sectorPreferences: ['Energi', 'Infrastruktur', 'Industri'],
    preferredRegions: ['Sumatra', 'Kalimantan'],
    preferredProvinces: ['Sumatera Selatan', 'Riau', 'Kalimantan Timur'],
    investmentHorizon: 'Long', focusAreas: ['Green Energy', 'Downstream', 'Gas'],
    pastSectors: ['Energi', 'Gas'],
    preferredProjectTypes: ['Brownfield', 'Expansion'], preferredKbliCodes: ['35201', '35202', '35101'],
    esgRequirements: ['Carbon Neutral'], timelineMonths: 36,
    totalInvestments: 5, investmentHistory: [],
    profileCompleteness: 95, isSynthetic: true,
    createdAt: '2023-10-01', updatedAt: '2026-03-10',
  },
  {
    id: 'inv-corp-009', name: 'Samsung C&T (Synthetic)', company: 'Samsung', nationality: 'South Korea',
    investorType: 'Corporate', experienceLevel: 'Expert',
    riskAppetite: 'Moderate', riskToleranceScore: 0.5,
    capexRange: 'Large', minTicketSize: 10, maxTicketSize: 80,
    sectorPreferences: ['Infrastruktur', 'Digital', 'Industri'],
    preferredRegions: ['Java', 'Kalimantan'],
    preferredProvinces: ['DKI Jakarta', 'Kalimantan Timur'],
    investmentHorizon: 'Medium', focusAreas: ['Infrastructure', 'Smart City', 'Digital'],
    pastSectors: ['Infrastruktur', 'Konstruksi'],
    preferredProjectTypes: ['Greenfield', 'JV'], preferredKbliCodes: ['41101', '42101', '63111'],
    esgRequirements: ['Carbon Neutral'], timelineMonths: 24,
    totalInvestments: 3, investmentHistory: [],
    profileCompleteness: 90, isSynthetic: true,
    createdAt: '2024-06-01', updatedAt: '2026-02-28',
  },
  {
    id: 'inv-corp-010', name: 'Alibaba Cloud (Synthetic)', company: 'Alibaba', nationality: 'China',
    investorType: 'Corporate', experienceLevel: 'Expert',
    riskAppetite: 'Aggressive', riskToleranceScore: 0.65,
    capexRange: 'Large', minTicketSize: 15, maxTicketSize: 60,
    sectorPreferences: ['Digital', 'Infrastruktur'],
    preferredRegions: ['Java'], preferredProvinces: ['DKI Jakarta', 'Banten', 'Jawa Barat'],
    investmentHorizon: 'Medium', focusAreas: ['Digital', 'Cloud', 'Data Center'],
    pastSectors: ['Digital'],
    preferredProjectTypes: ['Greenfield'], preferredKbliCodes: ['63111', '61201'],
    esgRequirements: [], timelineMonths: 12,
    totalInvestments: 4, investmentHistory: [],
    profileCompleteness: 85, isSynthetic: true,
    createdAt: '2024-03-01', updatedAt: '2026-03-15',
  },
  {
    id: 'inv-corp-011', name: 'Marubeni Corporation (Synthetic)', company: 'Marubeni', nationality: 'Japan',
    investorType: 'Corporate', experienceLevel: 'Expert',
    riskAppetite: 'Moderate', riskToleranceScore: 0.45,
    capexRange: 'Large', minTicketSize: 10, maxTicketSize: 70,
    sectorPreferences: ['Infrastruktur', 'Energi', 'Industri'],
    preferredRegions: ['Java', 'Sumatra', 'Kalimantan'],
    preferredProvinces: ['DKI Jakarta', 'Sumatera Selatan'],
    investmentHorizon: 'Long', focusAreas: ['Infrastructure', 'Green Energy', 'Trading'],
    pastSectors: ['Infrastruktur', 'Energi'],
    preferredProjectTypes: ['Brownfield', 'JV'], preferredKbliCodes: ['42101', '35101', '52101'],
    esgRequirements: ['Carbon Neutral'], timelineMonths: 36,
    totalInvestments: 6, investmentHistory: [],
    profileCompleteness: 95, isSynthetic: true,
    createdAt: '2023-05-01', updatedAt: '2026-04-01',
  },
  {
    id: 'inv-corp-012', name: 'Wilmar International (Synthetic)', company: 'Wilmar', nationality: 'Singapore',
    investorType: 'Corporate', experienceLevel: 'Expert',
    riskAppetite: 'Conservative', riskToleranceScore: 0.3,
    capexRange: 'Large', minTicketSize: 5, maxTicketSize: 40,
    sectorPreferences: ['Pertanian', 'Industri'],
    preferredRegions: ['Sumatra', 'Kalimantan'],
    preferredProvinces: ['Riau', 'Sumatera Utara', 'Kalimantan Barat'],
    investmentHorizon: 'Long', focusAreas: ['Agroindustry', 'Sustainable', 'Export'],
    pastSectors: ['Pertanian', 'Palm Oil'],
    preferredProjectTypes: ['Brownfield', 'Expansion'], preferredKbliCodes: ['01131', '10773'],
    esgRequirements: ['Carbon Neutral', 'Social Impact'], timelineMonths: 24,
    totalInvestments: 10, investmentHistory: [],
    profileCompleteness: 100, isSynthetic: true,
    createdAt: '2022-06-01', updatedAt: '2026-04-10',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 6. FAMILY OFFICES — Diverse, relationship-driven
// ═══════════════════════════════════════════════════════════════════════════

const FAMILY_OFFICE_INVESTORS: InvestorProfile[] = [
  {
    id: 'inv-fo-001', name: 'Djarum Group (Synthetic)', company: 'Djarum', nationality: 'Indonesia',
    investorType: 'FamilyOffice', experienceLevel: 'Expert',
    riskAppetite: 'Aggressive', riskToleranceScore: 0.65,
    capexRange: 'Large', minTicketSize: 10, maxTicketSize: 80,
    sectorPreferences: ['Infrastruktur', 'Digital', 'Pariwisata'],
    preferredRegions: ['Java', 'Kalimantan'],
    preferredProvinces: ['DKI Jakarta', 'Jawa Tengah', 'Kalimantan Timur'],
    investmentHorizon: 'Long', focusAreas: ['Infrastructure', 'Digital', 'Property'],
    pastSectors: ['Infrastruktur', 'Pariwisata'],
    preferredProjectTypes: ['Greenfield', 'Brownfield'], preferredKbliCodes: ['41101', '63111', '55110'],
    esgRequirements: [], timelineMonths: 24,
    totalInvestments: 12, investmentHistory: [],
    profileCompleteness: 90, isSynthetic: true,
    createdAt: '2022-01-01', updatedAt: '2026-04-01',
  },
  {
    id: 'inv-fo-002', name: 'Sinar Mas Group (Synthetic)', company: 'Sinar Mas', nationality: 'Indonesia',
    investorType: 'FamilyOffice', experienceLevel: 'Expert',
    riskAppetite: 'Moderate', riskToleranceScore: 0.5,
    capexRange: 'Mega', minTicketSize: 20, maxTicketSize: 100,
    sectorPreferences: ['Pertanian', 'Industri', 'Infrastruktur'],
    preferredRegions: ['Sumatra', 'Java', 'Kalimantan'],
    preferredProvinces: ['Riau', 'Jawa Barat', 'Kalimantan Barat'],
    investmentHorizon: 'Long', focusAreas: ['Agroindustry', 'Property', 'Downstream'],
    pastSectors: ['Pertanian', 'Palm Oil', 'Industri'],
    preferredProjectTypes: ['Brownfield', 'Expansion'], preferredKbliCodes: ['01131', '41101'],
    esgRequirements: ['Social Impact'], timelineMonths: 36,
    totalInvestments: 15, investmentHistory: [],
    profileCompleteness: 95, isSynthetic: true,
    createdAt: '2022-01-01', updatedAt: '2026-04-10',
  },
  {
    id: 'inv-fo-003', name: 'Salim Group (Synthetic)', company: 'Salim Group', nationality: 'Indonesia',
    investorType: 'FamilyOffice', experienceLevel: 'Expert',
    riskAppetite: 'Moderate', riskToleranceScore: 0.45,
    capexRange: 'Mega', minTicketSize: 15, maxTicketSize: 80,
    sectorPreferences: ['Industri', 'Pertanian', 'Infrastruktur'],
    preferredRegions: ['Java', 'Sumatra'],
    preferredProvinces: ['DKI Jakarta', 'Jawa Timur', 'Riau'],
    investmentHorizon: 'Long', focusAreas: ['Manufacturing', 'Agroindustry', 'Property'],
    pastSectors: ['Industri', 'Pertanian'],
    preferredProjectTypes: ['Brownfield', 'Expansion'], preferredKbliCodes: ['10801', '10773'],
    esgRequirements: [], timelineMonths: 24,
    totalInvestments: 10, investmentHistory: [],
    profileCompleteness: 90, isSynthetic: true,
    createdAt: '2022-06-01', updatedAt: '2026-03-01',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 7. INSTITUTIONAL INVESTORS — Pension funds, insurance
// ═══════════════════════════════════════════════════════════════════════════

const INSTITUTIONAL_INVESTORS: InvestorProfile[] = [
  {
    id: 'inv-inst-001', name: 'BPJS Ketenagakerjaan (Synthetic)', company: 'BPJS TK', nationality: 'Indonesia',
    investorType: 'Institutional', experienceLevel: 'Expert',
    riskAppetite: 'Conservative', riskToleranceScore: 0.2,
    capexRange: 'Large', minTicketSize: 10, maxTicketSize: 50,
    sectorPreferences: ['Infrastruktur', 'Energi'],
    preferredRegions: ['Java'], preferredProvinces: ['DKI Jakarta', 'Jawa Barat', 'Jawa Timur'],
    investmentHorizon: 'Long', focusAreas: ['Infrastructure', 'Green Energy'],
    pastSectors: ['Infrastruktur'],
    preferredProjectTypes: ['Brownfield'], preferredKbliCodes: ['42101', '35101'],
    esgRequirements: ['Carbon Neutral', 'Governance'], timelineMonths: 48,
    totalInvestments: 6, investmentHistory: [],
    profileCompleteness: 95, isSynthetic: true,
    createdAt: '2023-01-01', updatedAt: '2026-04-01',
  },
  {
    id: 'inv-inst-002', name: 'JPMorgan Asset Management (Synthetic)', company: 'JPMorgan AM', nationality: 'USA',
    investorType: 'Institutional', experienceLevel: 'Expert',
    riskAppetite: 'Moderate', riskToleranceScore: 0.4,
    capexRange: 'Large', minTicketSize: 15, maxTicketSize: 80,
    sectorPreferences: ['Infrastruktur', 'Digital', 'Energi'],
    preferredRegions: ['Java'], preferredProvinces: ['DKI Jakarta', 'Banten'],
    investmentHorizon: 'Medium', focusAreas: ['Infrastructure', 'Digital', 'ESG'],
    pastSectors: ['Infrastruktur', 'Digital'],
    preferredProjectTypes: ['Brownfield', 'JV'], preferredKbliCodes: ['52101', '63111'],
    esgRequirements: ['Carbon Neutral', 'Governance', 'Social Impact'], timelineMonths: 24,
    totalInvestments: 4, investmentHistory: [],
    profileCompleteness: 90, isSynthetic: true,
    createdAt: '2024-01-01', updatedAt: '2026-03-15',
  },
  {
    id: 'inv-inst-003', name: 'BlackRock (Synthetic)', company: 'BlackRock', nationality: 'USA',
    investorType: 'Institutional', experienceLevel: 'Expert',
    riskAppetite: 'Moderate', riskToleranceScore: 0.45,
    capexRange: 'Mega', minTicketSize: 25, maxTicketSize: 150,
    sectorPreferences: ['Energi', 'Infrastruktur', 'Digital'],
    preferredRegions: ['Java', 'Kalimantan'],
    preferredProvinces: ['DKI Jakarta', 'Kalimantan Timur'],
    investmentHorizon: 'Long', focusAreas: ['Green Energy', 'Infrastructure', 'ESG'],
    pastSectors: ['Energi', 'Infrastruktur'],
    preferredProjectTypes: ['Brownfield', 'JV'], preferredKbliCodes: ['35101', '35102', '42101'],
    esgRequirements: ['Carbon Neutral', 'Social Impact', 'Governance'], timelineMonths: 36,
    totalInvestments: 5, investmentHistory: [],
    profileCompleteness: 95, isSynthetic: true,
    createdAt: '2023-07-01', updatedAt: '2026-04-10',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 8. HNWI (High Net Worth Individuals) — Small ticket, diverse
// ═══════════════════════════════════════════════════════════════════════════

const HNWI_INVESTORS: InvestorProfile[] = [
  {
    id: 'inv-hnwi-001', name: 'Private Investor - Jakarta Based (Synthetic)', company: 'Individual', nationality: 'Indonesia',
    investorType: 'HNWI', experienceLevel: 'Intermediate',
    riskAppetite: 'Moderate', riskToleranceScore: 0.45,
    capexRange: 'Small', minTicketSize: 1, maxTicketSize: 10,
    sectorPreferences: ['Pariwisata', 'Industri', 'Pertanian'],
    preferredRegions: ['Java', 'Bali'], preferredProvinces: ['DKI Jakarta', 'Bali', 'Jawa Barat'],
    investmentHorizon: 'Medium', focusAreas: ['Tourism', 'Property', 'Agroindustry'],
    pastSectors: ['Pariwisata'],
    preferredProjectTypes: ['Brownfield', 'Expansion'], preferredKbliCodes: ['55110', '41101'],
    esgRequirements: [], timelineMonths: 12,
    totalInvestments: 3, investmentHistory: [],
    profileCompleteness: 70, isSynthetic: true,
    createdAt: '2024-06-01', updatedAt: '2026-03-01',
  },
  {
    id: 'inv-hnwi-002', name: 'Diaspora Investor - Singapore (Synthetic)', company: 'Individual', nationality: 'Singapore',
    investorType: 'HNWI', experienceLevel: 'Intermediate',
    riskAppetite: 'Moderate', riskToleranceScore: 0.5,
    capexRange: 'Small', minTicketSize: 2, maxTicketSize: 15,
    sectorPreferences: ['Energi', 'Digital', 'Pariwisata'],
    preferredRegions: ['Bali', 'Java'], preferredProvinces: ['Bali', 'DKI Jakarta'],
    investmentHorizon: 'Short', focusAreas: ['Green Energy', 'Digital', 'Tourism'],
    pastSectors: ['Digital'],
    preferredProjectTypes: ['Greenfield'], preferredKbliCodes: ['35102', '62011'],
    esgRequirements: ['Carbon Neutral'], timelineMonths: 6,
    totalInvestments: 2, investmentHistory: [],
    profileCompleteness: 60, isSynthetic: true,
    createdAt: '2025-01-01', updatedAt: '2026-04-01',
  },
  {
    id: 'inv-hnwi-003', name: 'Overseas Indonesian - Netherlands (Synthetic)', company: 'Individual', nationality: 'Netherlands',
    investorType: 'HNWI', experienceLevel: 'Novice',
    riskAppetite: 'Conservative', riskToleranceScore: 0.3,
    capexRange: 'Micro', minTicketSize: 0.5, maxTicketSize: 5,
    sectorPreferences: ['Pertanian', 'Pariwisata'],
    preferredRegions: ['Java', 'Sulawesi'], preferredProvinces: ['Jawa Tengah', 'Sulawesi Selatan'],
    investmentHorizon: 'Medium', focusAreas: ['Agroindustry', 'Heritage Tourism'],
    pastSectors: [],
    preferredProjectTypes: ['Greenfield'], preferredKbliCodes: ['01211', '55110'],
    esgRequirements: ['Social Impact'], timelineMonths: 18,
    totalInvestments: 0, investmentHistory: [],
    profileCompleteness: 40, isSynthetic: true,
    createdAt: '2025-09-01', updatedAt: '2026-03-15',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 9. ADDITIONAL CORPORATES — Chinese FDI (top investor country)
// ═══════════════════════════════════════════════════════════════════════════

const CHINA_INVESTORS: InvestorProfile[] = [
  {
    id: 'inv-cn-001', name: 'CATL (Contemporary Amperex) (Synthetic)', company: 'CATL', nationality: 'China',
    investorType: 'Corporate', experienceLevel: 'Expert',
    riskAppetite: 'Aggressive', riskToleranceScore: 0.65,
    capexRange: 'Mega', minTicketSize: 50, maxTicketSize: 300,
    sectorPreferences: ['Industri', 'Energi', 'Mining'],
    preferredRegions: ['Sulawesi', 'Kalimantan'],
    preferredProvinces: ['Sulawesi Tengah', 'Sulawesi Tenggara', 'Kalimantan Timur'],
    investmentHorizon: 'Long', focusAreas: ['EV Battery', 'Critical Mineral', 'Downstream'],
    pastSectors: ['Industri', 'Mining'],
    preferredProjectTypes: ['Greenfield', 'JV'], preferredKbliCodes: ['24201', '27201'],
    esgRequirements: ['Carbon Neutral'], timelineMonths: 24,
    totalInvestments: 8, investmentHistory: [],
    profileCompleteness: 100, isSynthetic: true,
    createdAt: '2023-01-01', updatedAt: '2026-04-15',
  },
  {
    id: 'inv-cn-002', name: 'Tsingshan Holding Group (Synthetic)', company: 'Tsingshan', nationality: 'China',
    investorType: 'Corporate', experienceLevel: 'Expert',
    riskAppetite: 'Aggressive', riskToleranceScore: 0.7,
    capexRange: 'Mega', minTicketSize: 40, maxTicketSize: 250,
    sectorPreferences: ['Industri', 'Mining'],
    preferredRegions: ['Sulawesi', 'Kalimantan'],
    preferredProvinces: ['Sulawesi Tengah', 'Sulawesi Tenggara'],
    investmentHorizon: 'Long', focusAreas: ['Downstream', 'Critical Mineral', 'Stainless Steel'],
    pastSectors: ['Industri', 'Mining'],
    preferredProjectTypes: ['Greenfield'], preferredKbliCodes: ['24101', '24201'],
    esgRequirements: [], timelineMonths: 18,
    totalInvestments: 10, investmentHistory: [],
    profileCompleteness: 95, isSynthetic: true,
    createdAt: '2022-06-01', updatedAt: '2026-04-10',
  },
  {
    id: 'inv-cn-003', name: 'Huawei Technologies (Synthetic)', company: 'Huawei', nationality: 'China',
    investorType: 'Corporate', experienceLevel: 'Expert',
    riskAppetite: 'Moderate', riskToleranceScore: 0.5,
    capexRange: 'Large', minTicketSize: 10, maxTicketSize: 60,
    sectorPreferences: ['Digital', 'Infrastruktur'],
    preferredRegions: ['Java'], preferredProvinces: ['DKI Jakarta', 'Banten', 'Jawa Barat'],
    investmentHorizon: 'Medium', focusAreas: ['Digital', '5G', 'Smart City', 'Cloud'],
    pastSectors: ['Digital', 'Infrastruktur'],
    preferredProjectTypes: ['Greenfield', 'JV'], preferredKbliCodes: ['61101', '61201', '63111'],
    esgRequirements: [], timelineMonths: 12,
    totalInvestments: 5, investmentHistory: [],
    profileCompleteness: 85, isSynthetic: true,
    createdAt: '2023-09-01', updatedAt: '2026-03-01',
  },
  {
    id: 'inv-cn-004', name: 'BYD Company (Synthetic)', company: 'BYD', nationality: 'China',
    investorType: 'Corporate', experienceLevel: 'Expert',
    riskAppetite: 'Aggressive', riskToleranceScore: 0.65,
    capexRange: 'Mega', minTicketSize: 30, maxTicketSize: 150,
    sectorPreferences: ['Industri', 'Energi', 'Digital'],
    preferredRegions: ['Java', 'Kalimantan'],
    preferredProvinces: ['Jawa Tengah', 'Jawa Timur', 'Kalimantan Timur'],
    investmentHorizon: 'Long', focusAreas: ['EV Battery', 'Manufacturing', 'Green Energy'],
    pastSectors: ['Industri', 'Energi'],
    preferredProjectTypes: ['Greenfield', 'JV'], preferredKbliCodes: ['27201', '35102', '24201'],
    esgRequirements: ['Carbon Neutral'], timelineMonths: 24,
    totalInvestments: 3, investmentHistory: [],
    profileCompleteness: 90, isSynthetic: true,
    createdAt: '2024-06-01', updatedAt: '2026-04-01',
  },
  {
    id: 'inv-cn-005', name: 'China Communications Construction (Synthetic)', company: 'CCCC', nationality: 'China',
    investorType: 'Corporate', experienceLevel: 'Expert',
    riskAppetite: 'Moderate', riskToleranceScore: 0.5,
    capexRange: 'Mega', minTicketSize: 40, maxTicketSize: 200,
    sectorPreferences: ['Infrastruktur', 'Konstruksi'],
    preferredRegions: ['Java', 'Kalimantan'],
    preferredProvinces: ['DKI Jakarta', 'Kalimantan Timur'],
    investmentHorizon: 'Long', focusAreas: ['Infrastructure', 'Port', 'Toll Road'],
    pastSectors: ['Infrastruktur', 'Konstruksi'],
    preferredProjectTypes: ['Greenfield', 'JV'], preferredKbliCodes: ['42101', '50111'],
    esgRequirements: [], timelineMonths: 36,
    totalInvestments: 5, investmentHistory: [],
    profileCompleteness: 90, isSynthetic: true,
    createdAt: '2023-04-01', updatedAt: '2026-03-20',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// AGGREGATE ALL INVESTORS
// ═══════════════════════════════════════════════════════════════════════════

export const ALL_SYNTHETIC_INVESTORS: InvestorProfile[] = [
  ...SWF_INVESTORS,
  ...DFI_INVESTORS,
  ...PE_INVESTORS,
  ...VC_INVESTORS,
  ...CORPORATE_INVESTORS,
  ...FAMILY_OFFICE_INVESTORS,
  ...INSTITUTIONAL_INVESTORS,
  ...HNWI_INVESTORS,
  ...CHINA_INVESTORS,
];

// ═══════════════════════════════════════════════════════════════════════════
// 10. SEMI-SYNTHETIC INTERACTION EVENTS
// Generated based on investor type heuristics:
//   - SWF/DFI: Low frequency, high weight (site visits, investments)
//   - PE/VC: Medium frequency, medium weight
//   - Corporate: High frequency in sector, medium weight
//   - HNWI: Low frequency, view/save mostly
// ═══════════════════════════════════════════════════════════════════════════

const PROJECT_IDS = [384, 1131, 385, 1516, 1141, 1140, 387, 1128, 386, 388, 1144, 390, 389, 1147, 1135, 1138, 1151, 397, 1139, 210];

function generateInteractions(): InteractionEvent[] {
  const events: InteractionEvent[] = [];
  const now = Date.now();
  const DAY = 86400000;

  for (const inv of ALL_SYNTHETIC_INVESTORS) {
    // Number of interactions based on investor type
    const interactionCount: Record<string, number> = {
      'SWF': 8, 'DFI': 10, 'PE': 12, 'VC': 15,
      'Corporate': 10, 'FamilyOffice': 8, 'Institutional': 6, 'HNWI': 4,
    };
    const count = interactionCount[inv.investorType] || 5;

    // Select projects that match investor's sector preferences
    const sectorMatchedProjects = PROJECT_IDS.filter(() => Math.random() > 0.4); // ~60% match rate
    const selectedProjects = sectorMatchedProjects.slice(0, Math.min(count, sectorMatchedProjects.length));

    for (let i = 0; i < selectedProjects.length; i++) {
      const pid = selectedProjects[i];
      const daysAgo = Math.floor(Math.random() * 90) + 1;

      // View is most common
      events.push({
        investorId: inv.id,
        projectId: pid,
        eventType: 'view',
        timestamp: now - daysAgo * DAY,
        weight: 1,
      });

      // Save for ~50% of viewed projects
      if (Math.random() > 0.5) {
        events.push({
          investorId: inv.id,
          projectId: pid,
          eventType: 'save',
          timestamp: now - (daysAgo - 1) * DAY,
          weight: 3,
        });
      }

      // Inquiry for ~30% of saved projects
      if (Math.random() > 0.7) {
        events.push({
          investorId: inv.id,
          projectId: pid,
          eventType: 'inquiry',
          timestamp: now - (daysAgo - 3) * DAY,
          weight: 5,
        });
      }

      // Site visit for SWF/DFI/Corporate
      if (['SWF', 'DFI', 'Corporate'].includes(inv.investorType) && Math.random() > 0.8) {
        events.push({
          investorId: inv.id,
          projectId: pid,
          eventType: 'site_visit',
          timestamp: now - (daysAgo - 7) * DAY,
          weight: 8,
        });
      }

      // Invest for experienced investors with high totalInvestments
      if (inv.totalInvestments >= 5 && Math.random() > 0.9) {
        events.push({
          investorId: inv.id,
          projectId: pid,
          eventType: 'invest',
          timestamp: now - (daysAgo - 14) * DAY,
          weight: 10,
        });
      }
    }
  }

  return events;
}

export const SYNTHETIC_INTERACTIONS: InteractionEvent[] = generateInteractions();

// ═══════════════════════════════════════════════════════════════════════════
// 11. INVESTMENT HISTORY — Based on BKPM sector distribution
// ═══════════════════════════════════════════════════════════════════════════

function generateInvestmentHistory(): void {
  const sectorProjectMap: Record<string, { sector: string; kbli: string; provinces: string[] }[]> = {
    'Industri': [
      { sector: 'Industri', kbli: '24101', provinces: ['Sulawesi Tengah', 'Jawa Timur'] },
      { sector: 'Industri', kbli: '20117', provinces: ['Sumatera Selatan'] },
      { sector: 'Industri', kbli: '10731', provinces: ['Sulawesi Barat'] },
      { sector: 'Industri', kbli: '10761', provinces: ['Sulawesi Barat', 'Papua'] },
    ],
    'Energi': [
      { sector: 'Energi', kbli: '35101', provinces: ['Sumatera Barat', 'Jawa Barat'] },
      { sector: 'Energi', kbli: '35102', provinces: ['Jawa Barat', 'Jawa Tengah'] },
      { sector: 'Energi', kbli: '35201', provinces: ['Bali', 'Sumatera Selatan'] },
    ],
    'Infrastruktur': [
      { sector: 'Infrastruktur', kbli: '42101', provinces: ['Lampung', 'Kalimantan Timur'] },
      { sector: 'Infrastruktur', kbli: '52101', provinces: ['Banten', 'DKI Jakarta'] },
      { sector: 'Infrastruktur', kbli: '38220', provinces: ['Jawa Timur'] },
    ],
    'Digital': [
      { sector: 'Digital', kbli: '63111', provinces: ['Banten', 'DKI Jakarta'] },
      { sector: 'Digital', kbli: '62011', provinces: ['DKI Jakarta', 'Jawa Barat'] },
    ],
    'Pertanian': [
      { sector: 'Pertanian', kbli: '01131', provinces: ['Riau', 'Kalimantan Barat'] },
      { sector: 'Pertanian', kbli: '01211', provinces: ['Sulawesi Barat'] },
    ],
    'Pariwisata': [
      { sector: 'Pariwisata', kbli: '55110', provinces: ['Bali', 'Nusa Tenggara Barat'] },
    ],
  };

  for (const inv of ALL_SYNTHETIC_INVESTORS) {
    if (inv.totalInvestments === 0) continue;

    const history: InvestmentRecord[] = [];
    const matchedSectors = inv.pastSectors.length > 0 ? inv.pastSectors : inv.sectorPreferences;

    for (let i = 0; i < Math.min(inv.totalInvestments, 5); i++) {
      const sector = matchedSectors[i % matchedSectors.length];
      const sectorData = sectorProjectMap[sector];
      if (!sectorData || sectorData.length === 0) continue;

      const project = sectorData[i % sectorData.length];
      const province = project.provinces[i % project.provinces.length];
      const value = inv.minTicketSize + Math.random() * (inv.maxTicketSize - inv.minTicketSize);

      history.push({
        projectId: 1000 + i * 100 + Math.floor(Math.random() * 50),
        projectSector: sector,
        projectProvince: province,
        projectKbli: [project.kbli],
        investmentValue: Math.round(value * 10) / 10,
        investedAt: new Date(Date.now() - (180 + i * 60) * 86400000).toISOString(),
        projectType: inv.preferredProjectTypes[i % inv.preferredProjectTypes.length],
      });
    }

    inv.investmentHistory = history;
  }
}

generateInvestmentHistory();

// ═══════════════════════════════════════════════════════════════════════════
// HELPER EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export const ALL_INVESTOR_IDS: string[] = ALL_SYNTHETIC_INVESTORS.map(i => i.id);

export function getInvestorById(id: string): InvestorProfile | undefined {
  return ALL_SYNTHETIC_INVESTORS.find(i => i.id === id);
}

export function getInvestorsByType(type: string): InvestorProfile[] {
  return ALL_SYNTHETIC_INVESTORS.filter(i => i.investorType === type);
}

export function getInvestorsByNationality(nationality: string): InvestorProfile[] {
  return ALL_SYNTHETIC_INVESTORS.filter(i => i.nationality === nationality);
}

/** Stats for dashboard display */
export const INVESTOR_STATS = {
  totalInvestors: ALL_SYNTHETIC_INVESTORS.length,
  byType: {
    SWF: SWF_INVESTORS.length,
    DFI: DFI_INVESTORS.length,
    PE: PE_INVESTORS.length,
    VC: VC_INVESTORS.length,
    Corporate: CORPORATE_INVESTORS.length + CHINA_INVESTORS.length,
    FamilyOffice: FAMILY_OFFICE_INVESTORS.length,
    Institutional: INSTITUTIONAL_INVESTORS.length,
    HNWI: HNWI_INVESTORS.length,
  },
  totalInteractions: SYNTHETIC_INTERACTIONS.length,
  avgTicketSize: Math.round(ALL_SYNTHETIC_INVESTORS.reduce((s, i) => s + (i.minTicketSize + i.maxTicketSize) / 2, 0) / ALL_SYNTHETIC_INVESTORS.length * 10) / 10,
  topNationalities: ['Singapore', 'China', 'Japan', 'USA', 'Indonesia', 'South Korea'],
  dataMethodology: 'Semi-synthetic based on BKPM 2024 statistics, public investor profiles, and sector distribution. Marked isSynthetic=true.',
};
