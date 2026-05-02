/**
 * DUMMY DATA: Investor Profiles & Interactions
 * 
 * Purpose: Simulate real-world usage patterns for the recommendation engine.
 * This data demonstrates how the hybrid CB+CF system works end-to-end.
 * 
 * SWAP GUIDE (for real data integration):
 * - Replace investorProfiles with API call: GET /api/investors/me
 * - Replace interactions with API call: GET /api/interactions?investorId=xxx
 * - The recommendation engine accepts these as parameters — no code changes needed
 */

import type { InvestorProfile, InteractionEvent } from '@/lib/recommendationEngine';

// ============================================================================
// DUMMY INVESTOR PROFILES
// ============================================================================

export const DEFAULT_INVESTOR: InvestorProfile = {
  id: 'inv-001',
  name: 'Mitsubishi Industries (Simulated)',
  sectorPreferences: ['Manufacturing', 'Infrastructure', 'Energy'],
  minTicketSize: 20,
  maxTicketSize: 100,
  riskAppetite: 'Moderate',
  preferredRegions: ['Java', 'Sumatra'],
  preferredProvinces: ['Jawa Tengah', 'Banten', 'DKI Jakarta'],
  investmentHorizon: 'Medium',
  focusAreas: ['Green Energy', 'Downstream', 'Export'],
  pastSectors: ['Manufacturing', 'Steel'],
};

// Additional dummy investors for collaborative filtering
export const DUMMY_INVESTORS: InvestorProfile[] = [
  {
    id: 'inv-002',
    name: 'SoftBank Vision Fund',
    sectorPreferences: ['Digital', 'Technology'],
    minTicketSize: 10,
    maxTicketSize: 200,
    riskAppetite: 'Aggressive',
    preferredRegions: ['Anywhere'],
    preferredProvinces: [],
    investmentHorizon: 'Medium',
    focusAreas: ['Digital', 'Technology', 'AI'],
    pastSectors: ['Digital', 'Data Center'],
  },
  {
    id: 'inv-003',
    name: 'Temasek Holdings',
    sectorPreferences: ['Energy', 'Infrastructure', 'Mining'],
    minTicketSize: 30,
    maxTicketSize: 150,
    riskAppetite: 'Moderate',
    preferredRegions: ['Kalimantan', 'Sulawesi', 'Sumatra'],
    preferredProvinces: ['Kalimantan Timur', 'Sulawesi Tengah'],
    investmentHorizon: 'Long',
    focusAreas: ['Green Energy', 'Sustainable', 'Downstream'],
    pastSectors: ['Energy', 'Mining'],
  },
  {
    id: 'inv-004',
    name: 'Cargill Agri Investments',
    sectorPreferences: ['Agriculture', 'Agroindustry', 'Food'],
    minTicketSize: 5,
    maxTicketSize: 50,
    riskAppetite: 'Conservative',
    preferredRegions: ['Sumatra', 'Kalimantan'],
    preferredProvinces: ['Riau', 'Sumatera Utara'],
    investmentHorizon: 'Long',
    focusAreas: ['Sustainable', 'Export', 'Agroindustry'],
    pastSectors: ['Agriculture', 'Palm Oil'],
  },
  {
    id: 'inv-005',
    name: 'GIC Infrastructure',
    sectorPreferences: ['Infrastructure', 'Digital', 'Energy'],
    minTicketSize: 25,
    maxTicketSize: 120,
    riskAppetite: 'Conservative',
    preferredRegions: ['Java', 'Kalimantan'],
    preferredProvinces: ['DKI Jakarta', 'Kalimantan Timur'],
    investmentHorizon: 'Long',
    focusAreas: ['Infrastructure', 'Green Energy', 'Digital'],
    pastSectors: ['Infrastructure', 'Energy'],
  },
  {
    id: 'inv-006',
    name: 'Tencent Cloud Investment',
    sectorPreferences: ['Digital', 'Technology'],
    minTicketSize: 15,
    maxTicketSize: 80,
    riskAppetite: 'Aggressive',
    preferredRegions: ['Java', 'Bali'],
    preferredProvinces: ['Banten', 'DKI Jakarta', 'Jawa Barat'],
    investmentHorizon: 'Medium',
    focusAreas: ['Digital', 'Cloud', 'AI'],
    pastSectors: ['Digital', 'Technology'],
  },
  {
    id: 'inv-007',
    name: 'Vale Indonesia JV Partner',
    sectorPreferences: ['Mining', 'Industri', 'Energy'],
    minTicketSize: 40,
    maxTicketSize: 200,
    riskAppetite: 'Aggressive',
    preferredRegions: ['Sulawesi', 'Maluku'],
    preferredProvinces: ['Sulawesi Tengah', 'Sulawesi Selatan'],
    investmentHorizon: 'Medium',
    focusAreas: ['Downstream', 'Critical Mineral', 'EV Battery'],
    pastSectors: ['Mining', 'Mineral Processing'],
  },
  {
    id: 'inv-008',
    name: 'ADB Green Fund',
    sectorPreferences: ['Energy', 'Infrastructure'],
    minTicketSize: 10,
    maxTicketSize: 60,
    riskAppetite: 'Moderate',
    preferredRegions: ['Sumatra', 'Java'],
    preferredProvinces: ['Sumatera Barat', 'Jawa Tengah'],
    investmentHorizon: 'Long',
    focusAreas: ['Green Energy', 'Sustainable', 'Renewable'],
    pastSectors: ['Energy', 'Geothermal'],
  },
];

export const ALL_INVESTORS: InvestorProfile[] = [DEFAULT_INVESTOR, ...DUMMY_INVESTORS];

export const ALL_INVESTOR_IDS: string[] = ALL_INVESTORS.map(i => i.id);

// ============================================================================
// DUMMY INTERACTION EVENTS
// 
// Pattern Design:
// - inv-001 (Mitsubishi): Interested in manufacturing, infrastructure
// - inv-002 (SoftBank): Interested in digital/tech
// - inv-003 (Temasek): Interested in energy, mining
// - inv-004 (Cargill): Interested in agriculture
// - inv-005 (GIC): Interested in infrastructure, energy
// - inv-006 (Tencent): Interested in digital
// - inv-007 (Vale): Interested in mining/mineral processing
// - inv-008 (ADB): Interested in green energy
// ============================================================================

export const DUMMY_INTERACTIONS: InteractionEvent[] = [
  // --- inv-001 (Mitsubishi - Manufacturing focused) ---
  { investorId: 'inv-001', projectId: 1, eventType: 'view', timestamp: Date.now() - 86400000 * 5, weight: 1 },
  { investorId: 'inv-001', projectId: 1, eventType: 'save', timestamp: Date.now() - 86400000 * 4, weight: 3 },
  { investorId: 'inv-001', projectId: 1, eventType: 'inquiry', timestamp: Date.now() - 86400000 * 3, weight: 5 },
  { investorId: 'inv-001', projectId: 2, eventType: 'view', timestamp: Date.now() - 86400000 * 2, weight: 1 },
  { investorId: 'inv-001', projectId: 5, eventType: 'view', timestamp: Date.now() - 86400000, weight: 1 },
  { investorId: 'inv-001', projectId: 5, eventType: 'save', timestamp: Date.now() - 86400000, weight: 3 },
  
  // --- inv-002 (SoftBank - Digital/tech focused) ---
  { investorId: 'inv-002', projectId: 2, eventType: 'view', timestamp: Date.now() - 86400000 * 6, weight: 1 },
  { investorId: 'inv-002', projectId: 2, eventType: 'save', timestamp: Date.now() - 86400000 * 5, weight: 3 },
  { investorId: 'inv-002', projectId: 2, eventType: 'inquiry', timestamp: Date.now() - 86400000 * 4, weight: 5 },
  { investorId: 'inv-002', projectId: 5, eventType: 'view', timestamp: Date.now() - 86400000 * 3, weight: 1 },
  { investorId: 'inv-002', projectId: 5, eventType: 'share', timestamp: Date.now() - 86400000 * 2, weight: 2 },
  { investorId: 'inv-002', projectId: 6, eventType: 'view', timestamp: Date.now() - 86400000, weight: 1 },
  
  // --- inv-003 (Temasek - Energy/Mining) ---
  { investorId: 'inv-003', projectId: 4, eventType: 'view', timestamp: Date.now() - 86400000 * 7, weight: 1 },
  { investorId: 'inv-003', projectId: 4, eventType: 'save', timestamp: Date.now() - 86400000 * 6, weight: 3 },
  { investorId: 'inv-003', projectId: 6, eventType: 'view', timestamp: Date.now() - 86400000 * 5, weight: 1 },
  { investorId: 'inv-003', projectId: 6, eventType: 'save', timestamp: Date.now() - 86400000 * 4, weight: 3 },
  { investorId: 'inv-003', projectId: 6, eventType: 'inquiry', timestamp: Date.now() - 86400000 * 3, weight: 5 },
  { investorId: 'inv-003', projectId: 6, eventType: 'site_visit', timestamp: Date.now() - 86400000, weight: 8 },
  { investorId: 'inv-003', projectId: 5, eventType: 'view', timestamp: Date.now() - 86400000, weight: 1 },
  
  // --- inv-004 (Cargill - Agriculture) ---
  { investorId: 'inv-004', projectId: 3, eventType: 'view', timestamp: Date.now() - 86400000 * 4, weight: 1 },
  { investorId: 'inv-004', projectId: 3, eventType: 'save', timestamp: Date.now() - 86400000 * 3, weight: 3 },
  { investorId: 'inv-004', projectId: 3, eventType: 'inquiry', timestamp: Date.now() - 86400000 * 2, weight: 5 },
  { investorId: 'inv-004', projectId: 3, eventType: 'site_visit', timestamp: Date.now() - 86400000, weight: 8 },
  
  // --- inv-005 (GIC - Infrastructure/Energy) ---
  { investorId: 'inv-005', projectId: 1, eventType: 'view', timestamp: Date.now() - 86400000 * 5, weight: 1 },
  { investorId: 'inv-005', projectId: 1, eventType: 'save', timestamp: Date.now() - 86400000 * 4, weight: 3 },
  { investorId: 'inv-005', projectId: 4, eventType: 'view', timestamp: Date.now() - 86400000 * 3, weight: 1 },
  { investorId: 'inv-005', projectId: 4, eventType: 'inquiry', timestamp: Date.now() - 86400000 * 2, weight: 5 },
  { investorId: 'inv-005', projectId: 5, eventType: 'view', timestamp: Date.now() - 86400000, weight: 1 },
  
  // --- inv-006 (Tencent - Digital) ---
  { investorId: 'inv-006', projectId: 2, eventType: 'view', timestamp: Date.now() - 86400000 * 3, weight: 1 },
  { investorId: 'inv-006', projectId: 2, eventType: 'save', timestamp: Date.now() - 86400000 * 2, weight: 3 },
  { investorId: 'inv-006', projectId: 2, eventType: 'inquiry', timestamp: Date.now() - 86400000, weight: 5 },
  { investorId: 'inv-006', projectId: 5, eventType: 'view', timestamp: Date.now() - 86400000, weight: 1 },
  
  // --- inv-007 (Vale - Mining/Processing) ---
  { investorId: 'inv-007', projectId: 6, eventType: 'view', timestamp: Date.now() - 86400000 * 5, weight: 1 },
  { investorId: 'inv-007', projectId: 6, eventType: 'save', timestamp: Date.now() - 86400000 * 4, weight: 3 },
  { investorId: 'inv-007', projectId: 6, eventType: 'inquiry', timestamp: Date.now() - 86400000 * 3, weight: 5 },
  { investorId: 'inv-007', projectId: 6, eventType: 'site_visit', timestamp: Date.now() - 86400000 * 2, weight: 8 },
  { investorId: 'inv-007', projectId: 6, eventType: 'invest', timestamp: Date.now() - 86400000, weight: 10 },
  { investorId: 'inv-007', projectId: 1, eventType: 'view', timestamp: Date.now() - 86400000, weight: 1 },
  
  // --- inv-008 (ADB Green Fund - Energy) ---
  { investorId: 'inv-008', projectId: 4, eventType: 'view', timestamp: Date.now() - 86400000 * 4, weight: 1 },
  { investorId: 'inv-008', projectId: 4, eventType: 'save', timestamp: Date.now() - 86400000 * 3, weight: 3 },
  { investorId: 'inv-008', projectId: 4, eventType: 'inquiry', timestamp: Date.now() - 86400000 * 2, weight: 5 },
  { investorId: 'inv-008', projectId: 6, eventType: 'view', timestamp: Date.now() - 86400000, weight: 1 },
  { investorId: 'inv-008', projectId: 5, eventType: 'view', timestamp: Date.now() - 86400000, weight: 1 },
];

// ============================================================================
// HELPER: Get current investor (swap this for real auth context)
// ============================================================================

export function getCurrentInvestor(): InvestorProfile {
  // In production: const user = await auth.getUser();
  //               const profile = await api.get(`/investors/${user.id}`);
  return DEFAULT_INVESTOR;
}

export function getAllInvestorIds(): string[] {
  return ALL_INVESTOR_IDS;
}

export function getAllInteractions(): InteractionEvent[] {
  return DUMMY_INTERACTIONS;
}
