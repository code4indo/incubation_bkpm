/**
 * REFERENCE DATA — KBLI 2020, PSN, Priority Sectors, Policy Maps
 *
 * Sources:
 *   - KBLI 2020: BPS (Badan Pusat Statistik) — Klasifikasi Baku Lapangan Usaha Indonesia
 *   - PSN: Kementerian PPN/Bappenas — Proyek Strategis Nasional
 *   - Priority Sectors: RPJMN 2025-2029, KBMT (Komite Percepatan Penyediaan Infrastruktur)
 *   - DNI: Daftar Negatif Investasi (Presidential Regulation No. 10/2021)
 *   - KEK: Kawasan Ekonomi Khusus
 *
 * Status: Data publik yang dapat diverifikasi. Beberapa disederhanakan untuk keperluan simulasi.
 */

// ═══════════════════════════════════════════════════════════════════════════
// 1. KBLI 2020 — Sector Classification (simplified for matching)
// Full table has 1,500+ codes; here we include the major investment-relevant ones
// ═══════════════════════════════════════════════════════════════════════════

export interface KBLIEntry {
  code: string;          // 5-digit KBLI code
  label_id: string;      // Indonesian label
  label_en: string;      // English label
  category: string;      // Broad category: A-U (BPS classification)
  sector: string;        // Mapped to BKPM sector names
  parent2digit: string;  // 2-digit parent for proximity scoring
  parent3digit: string;  // 3-digit parent for proximity scoring
  fdiOpen: boolean;      // Whether 100% FDI is allowed
  maxFdiPct: number;     // Max foreign ownership %
  isPriority: boolean;   // Priority sector per KBMT
}

export const KBLI_TABLE: KBLIEntry[] = [
  // ── A: Pertanian, Kehutanan, Perikanan ──
  { code: '01111', label_id: 'Tanaman Padi', label_en: 'Rice Cultivation', category: 'A', sector: 'Pertanian', parent2digit: '01', parent3digit: '011', fdiOpen: false, maxFdiPct: 0, isPriority: false },
  { code: '01131', label_id: 'Tanaman Kelapa Sawit', label_en: 'Palm Oil Plantation', category: 'A', sector: 'Pertanian', parent2digit: '01', parent3digit: '011', fdiOpen: true, maxFdiPct: 95, isPriority: true },
  { code: '01211', label_id: 'Tanaman Kakao', label_en: 'Cocoa Cultivation', category: 'A', sector: 'Pertanian', parent2digit: '01', parent3digit: '012', fdiOpen: true, maxFdiPct: 95, isPriority: true },
  { code: '01231', label_id: 'Tanaman Kopi', label_en: 'Coffee Cultivation', category: 'A', sector: 'Pertanian', parent2digit: '01', parent3digit: '012', fdiOpen: true, maxFdiPct: 95, isPriority: true },
  { code: '01301', label_id: 'Tanaman Rempah dan Obat', label_en: 'Spice & Medicinal Plants', category: 'A', sector: 'Pertanian', parent2digit: '01', parent3digit: '013', fdiOpen: true, maxFdiPct: 95, isPriority: false },
  { code: '02130', label_id: 'Budidaya Sagu', label_en: 'Sago Cultivation', category: 'A', sector: 'Pertanian', parent2digit: '02', parent3digit: '021', fdiOpen: true, maxFdiPct: 95, isPriority: false },
  { code: '03211', label_id: 'Budidaya Udang', label_en: 'Shrimp Farming', category: 'A', sector: 'Perikanan', parent2digit: '03', parent3digit: '032', fdiOpen: true, maxFdiPct: 100, isPriority: true },

  // ── C: Industri Pengolahan ──
  { code: '10622', label_id: 'Industri Pati Sagu', label_en: 'Sago Starch Manufacturing', category: 'C', sector: 'Industri', parent2digit: '10', parent3digit: '106', fdiOpen: true, maxFdiPct: 100, isPriority: true },
  { code: '10731', label_id: 'Industri Kakao dan Cokelat', label_en: 'Cocoa & Chocolate Manufacturing', category: 'C', sector: 'Industri', parent2digit: '10', parent3digit: '107', fdiOpen: true, maxFdiPct: 100, isPriority: true },
  { code: '10761', label_id: 'Industri Kopi Olahan', label_en: 'Coffee Processing', category: 'C', sector: 'Industri', parent2digit: '10', parent3digit: '107', fdiOpen: true, maxFdiPct: 100, isPriority: true },
  { code: '10773', label_id: 'Industri Kelapa dan Kopra', label_en: 'Coconut & Copra Processing', category: 'C', sector: 'Industri', parent2digit: '10', parent3digit: '107', fdiOpen: true, maxFdiPct: 100, isPriority: true },
  { code: '10801', label_id: 'Industri Pakan Ternak', label_en: 'Animal Feed Manufacturing', category: 'C', sector: 'Industri', parent2digit: '10', parent3digit: '108', fdiOpen: true, maxFdiPct: 100, isPriority: true },
  { code: '20111', label_id: 'Industri Soda Ash', label_en: 'Soda Ash Manufacturing', category: 'C', sector: 'Industri', parent2digit: '20', parent3digit: '201', fdiOpen: true, maxFdiPct: 100, isPriority: true },
  { code: '20117', label_id: 'Industri Etilen Glikol', label_en: 'Ethylene Glycol Manufacturing', category: 'C', sector: 'Industri', parent2digit: '20', parent3digit: '201', fdiOpen: true, maxFdiPct: 100, isPriority: true },
  { code: '20115', label_id: 'Industri Bahan Kimia Dasar', label_en: 'Basic Chemical Manufacturing', category: 'C', sector: 'Industri', parent2digit: '20', parent3digit: '201', fdiOpen: true, maxFdiPct: 100, isPriority: true },
  { code: '24101', label_id: 'Industri Baja Dasar', label_en: 'Basic Steel Manufacturing', category: 'C', sector: 'Industri', parent2digit: '24', parent3digit: '241', fdiOpen: true, maxFdiPct: 100, isPriority: true },
  { code: '24201', label_id: 'Industri Aluminium', label_en: 'Aluminium Manufacturing', category: 'C', sector: 'Industri', parent2digit: '24', parent3digit: '242', fdiOpen: true, maxFdiPct: 100, isPriority: true },
  { code: '27201', label_id: 'Industri Peralatan Listrik', label_en: 'Electrical Equipment Manufacturing', category: 'C', sector: 'Industri', parent2digit: '27', parent3digit: '272', fdiOpen: true, maxFdiPct: 100, isPriority: true },
  { code: '26101', label_id: 'Industri Komponen Elektronik', label_en: 'Electronic Component Manufacturing', category: 'C', sector: 'Digital', parent2digit: '26', parent3digit: '261', fdiOpen: true, maxFdiPct: 100, isPriority: true },
  { code: '32905', label_id: 'Industri Produk Serat Kaca', label_en: 'Fiberglass Product Manufacturing', category: 'C', sector: 'Industri', parent2digit: '32', parent3digit: '329', fdiOpen: true, maxFdiPct: 100, isPriority: false },

  // ── D: Pengadaan Listrik, Gas ──
  { code: '35101', label_id: 'Pembangkit Listrik Tenaga Panas Bumi', label_en: 'Geothermal Power Generation', category: 'D', sector: 'Energi', parent2digit: '35', parent3digit: '351', fdiOpen: true, maxFdiPct: 95, isPriority: true },
  { code: '35102', label_id: 'Pembangkit Listrik Tenaga Surya', label_en: 'Solar Power Generation', category: 'D', sector: 'Energi', parent2digit: '35', parent3digit: '351', fdiOpen: true, maxFdiPct: 100, isPriority: true },
  { code: '35103', label_id: 'Pembangkit Listrik Tenaga Angin', label_en: 'Wind Power Generation', category: 'D', sector: 'Energi', parent2digit: '35', parent3digit: '351', fdiOpen: true, maxFdiPct: 100, isPriority: true },
  { code: '35104', label_id: 'Pembangkit Listrik Tenaga Air', label_en: 'Hydropower Generation', category: 'D', sector: 'Energi', parent2digit: '35', parent3digit: '351', fdiOpen: true, maxFdiPct: 100, isPriority: true },
  { code: '35201', label_id: 'Distribusi Gas Alam', label_en: 'Natural Gas Distribution', category: 'D', sector: 'Energi', parent2digit: '35', parent3digit: '352', fdiOpen: true, maxFdiPct: 95, isPriority: true },
  { code: '35202', label_id: 'Terminal LNG dan Regasifikasi', label_en: 'LNG Terminal & Regasification', category: 'D', sector: 'Energi', parent2digit: '35', parent3digit: '352', fdiOpen: true, maxFdiPct: 95, isPriority: true },

  // ── E: Pengadaan Air, Pengelolaan Sampah ──
  { code: '37012', label_id: 'Pengelolaan Air Limbah Industri', label_en: 'Industrial Wastewater Management', category: 'E', sector: 'Infrastruktur', parent2digit: '37', parent3digit: '370', fdiOpen: true, maxFdiPct: 100, isPriority: true },
  { code: '37022', label_id: 'Pengelolaan Air Limbah Domestik', label_en: 'Domestic Wastewater Management', category: 'E', sector: 'Infrastruktur', parent2digit: '37', parent3digit: '370', fdiOpen: true, maxFdiPct: 100, isPriority: true },
  { code: '38220', label_id: 'Pengelolaan Limbah B3', label_en: 'Hazardous Waste Management', category: 'E', sector: 'Infrastruktur', parent2digit: '38', parent3digit: '382', fdiOpen: true, maxFdiPct: 100, isPriority: true },
  { code: '39000', label_id: 'Pemulihan dan Jasa Remediasi', label_en: 'Remediation Services', category: 'E', sector: 'Infrastruktur', parent2digit: '39', parent3digit: '390', fdiOpen: true, maxFdiPct: 100, isPriority: false },

  // ── F: Konstruksi ──
  { code: '41101', label_id: 'Konstruksi Gedung', label_en: 'Building Construction', category: 'F', sector: 'Konstruksi', parent2digit: '41', parent3digit: '411', fdiOpen: true, maxFdiPct: 100, isPriority: true },
  { code: '42101', label_id: 'Konstruksi Jalan dan Jembatan', label_en: 'Road & Bridge Construction', category: 'F', sector: 'Infrastruktur', parent2digit: '42', parent3digit: '421', fdiOpen: true, maxFdiPct: 100, isPriority: true },
  { code: '42201', label_id: 'Konstruksi Sistem Pipa dan Kabel', label_en: 'Pipeline & Cable Construction', category: 'F', sector: 'Infrastruktur', parent2digit: '42', parent3digit: '422', fdiOpen: true, maxFdiPct: 100, isPriority: false },

  // ── G: Perdagangan ──
  { code: '46101', label_id: 'Perdagangan Besar Hasil Pertanian', label_en: 'Wholesale Agricultural Products', category: 'G', sector: 'Perdagangan', parent2digit: '46', parent3digit: '461', fdiOpen: true, maxFdiPct: 100, isPriority: false },
  { code: '47111', label_id: 'Perdagangan Eceran Minimarket', label_en: 'Minimarket Retail', category: 'G', sector: 'Perdagangan', parent2digit: '47', parent3digit: '471', fdiOpen: true, maxFdiPct: 100, isPriority: false },

  // ── H: Pengangkutan dan Pergudangan ──
  { code: '50111', label_id: 'Pengangkutan Laut Penumpang', label_en: 'Sea Passenger Transport', category: 'H', sector: 'Infrastruktur', parent2digit: '50', parent3digit: '501', fdiOpen: true, maxFdiPct: 95, isPriority: false },
  { code: '52101', label_id: 'Pergudangan dan Penyimpanan', label_en: 'Warehousing & Storage', category: 'H', sector: 'Infrastruktur', parent2digit: '52', parent3digit: '521', fdiOpen: true, maxFdiPct: 100, isPriority: true },
  { code: '52201', label_id: 'Jasa Pendukung Pengangkutan', label_en: 'Transport Support Services', category: 'H', sector: 'Infrastruktur', parent2digit: '52', parent3digit: '522', fdiOpen: true, maxFdiPct: 100, isPriority: false },

  // ── I: Akomodasi dan Makan Minum ──
  { code: '55110', label_id: 'Akomodasi Hotel dan Motel', label_en: 'Hotel & Motel Accommodation', category: 'I', sector: 'Pariwisata', parent2digit: '55', parent3digit: '551', fdiOpen: true, maxFdiPct: 100, isPriority: true },

  // ── J: Informasi dan Komunikasi ──
  { code: '61101', label_id: 'Jasa Telekomunikasi Kabel', label_en: 'Wired Telecommunications', category: 'J', sector: 'Digital', parent2digit: '61', parent3digit: '611', fdiOpen: true, maxFdiPct: 100, isPriority: true },
  { code: '61201', label_id: 'Jasa Telekomunikasi Nirkabel', label_en: 'Wireless Telecommunications', category: 'J', sector: 'Digital', parent2digit: '61', parent3digit: '612', fdiOpen: true, maxFdiPct: 100, isPriority: true },
  { code: '62011', label_id: 'Pemrograman Komputer', label_en: 'Computer Programming', category: 'J', sector: 'Digital', parent2digit: '62', parent3digit: '620', fdiOpen: true, maxFdiPct: 100, isPriority: true },
  { code: '63111', label_id: 'Pengolahan Data dan Hosting', label_en: 'Data Processing & Hosting', category: 'J', sector: 'Digital', parent2digit: '63', parent3digit: '631', fdiOpen: true, maxFdiPct: 100, isPriority: true },

  // ── K: Aktivitas Keuangan ──
  { code: '64111', label_id: 'Aktivitas Bank Sentral', label_en: 'Central Banking', category: 'K', sector: 'Keuangan', parent2digit: '64', parent3digit: '641', fdiOpen: false, maxFdiPct: 0, isPriority: false },
  { code: '64921', label_id: 'Aktivitas Modal Ventura', label_en: 'Venture Capital Activities', category: 'K', sector: 'Keuangan', parent2digit: '64', parent3digit: '649', fdiOpen: true, maxFdiPct: 100, isPriority: true },

  // ── M: Aktivitas Profesional, Ilmiah, Teknis ──
  { code: '71101', label_id: 'Jasa Arsitektur dan Teknik', label_en: 'Architectural & Engineering Services', category: 'M', sector: 'Jasa', parent2digit: '71', parent3digit: '711', fdiOpen: true, maxFdiPct: 100, isPriority: false },
  { code: '72101', label_id: 'Riset dan Pengembangan Biotech', label_en: 'Biotech R&D', category: 'M', sector: 'Jasa', parent2digit: '72', parent3digit: '721', fdiOpen: true, maxFdiPct: 100, isPriority: true },

  // ── Q: Aktivitas Kesehatan ──
  { code: '86101', label_id: 'Aktivitas Rumah Sakit', label_en: 'Hospital Activities', category: 'Q', sector: 'Kesehatan', parent2digit: '86', parent3digit: '861', fdiOpen: true, maxFdiPct: 100, isPriority: true },
];

/** KBLI Proximity scoring for CMS formula */
export function getKBLIProximity(code1: string, code2: string): number {
  if (code1 === code2) return 1.0;         // Exact 5-digit match
  if (code1.substring(0, 3) === code2.substring(0, 3)) return 0.9;  // Same 3-digit
  if (code1.substring(0, 2) === code2.substring(0, 2)) return 0.7;  // Same 2-digit
  return 0.0;                              // No similarity
}

/** Find KBLI entries by sector name */
export function getKBLIBySector(sector: string): KBLIEntry[] {
  return KBLI_TABLE.filter(k => k.sector.toLowerCase() === sector.toLowerCase());
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. PROYEK STRATEGIS NASIONAL (PSN) — Simplified list
// Source: Kementerian PPN/Bappenas, KPPIP
// Updated for RPJMN 2025-2029 period
// ═══════════════════════════════════════════════════════════════════════════

export interface PSNProject {
  id: string;
  name: string;
  sector: string;
  province: string;
  status: 'Completed' | 'In Progress' | 'Planning' | 'Delayed';
  investmentValueIdrB: number; // Billion IDR
  isDNI: boolean;              // Proyek dalam DNI (Daftar Proyek Investasi Nasional)
  isKEK: boolean;              // Dalam Kawasan Ekonomi Khusus
  kbliCodes: string[];
}

export const PSN_PROJECTS: PSNProject[] = [
  // ── Energi ──
  { id: 'PSN-001', name: 'Pembangkit Listrik Panas Bumi Sarulla', sector: 'Energi', province: 'Sumatera Utara', status: 'Completed', investmentValueIdrB: 14000, isDNI: true, isKEK: false, kbliCodes: ['35101'] },
  { id: 'PSN-002', name: 'Pembangkit Listrik Panas Bumi Wayang Windu', sector: 'Energi', province: 'Jawa Barat', status: 'In Progress', investmentValueIdrB: 3500, isDNI: true, isKEK: false, kbliCodes: ['35101'] },
  { id: 'PSN-003', name: 'Pembangkit Listrik Tenaga Surya Cirata', sector: 'Energi', province: 'Jawa Barat', status: 'Completed', investmentValueIdrB: 6000, isDNI: true, isKEK: false, kbliCodes: ['35102'] },
  { id: 'PSN-004', name: 'Industri Smelter Nikel Morowali', sector: 'Industri', province: 'Sulawesi Tengah', status: 'Completed', investmentValueIdrB: 28000, isDNI: true, isKEK: true, kbliCodes: ['24101', '24201'] },
  { id: 'PSN-005', name: 'Industri Smelter Nikel Konawe', sector: 'Industri', province: 'Sulawesi Tenggara', status: 'In Progress', investmentValueIdrB: 22000, isDNI: true, isKEK: true, kbliCodes: ['24101'] },

  // ── Infrastruktur ──
  { id: 'PSN-006', name: 'Jalan Tol Trans Sumatera', sector: 'Infrastruktur', province: 'Lampung', status: 'In Progress', investmentValueIdrB: 50000, isDNI: true, isKEK: false, kbliCodes: ['42101'] },
  { id: 'PSN-007', name: 'Pelabuhan Internasional Kuala Tanjung', sector: 'Infrastruktur', province: 'Sumatera Utara', status: 'In Progress', investmentValueIdrB: 35000, isDNI: true, isKEK: true, kbliCodes: ['50111', '52101'] },
  { id: 'PSN-008', name: 'Bandara Internasional Yogyakarta', sector: 'Infrastruktur', province: 'Daerah Istimewa Yogyakarta', status: 'Completed', investmentValueIdrB: 8500, isDNI: true, isKEK: false, kbliCodes: ['41101'] },
  { id: 'PSN-009', name: 'IKN Nusantara Infrastruktur Dasar', sector: 'Infrastruktur', province: 'Kalimantan Timur', status: 'In Progress', investmentValueIdrB: 80000, isDNI: true, isKEK: false, kbliCodes: ['41101', '42101'] },

  // ── Industri Hilirisasi ──
  { id: 'PSN-010', name: 'Industri MEG Berbasis Batu Bara', sector: 'Industri', province: 'Sumatera Selatan', status: 'In Progress', investmentValueIdrB: 19500, isDNI: true, isKEK: true, kbliCodes: ['20117'] },
  { id: 'PSN-011', name: 'Industri Soda Ash Madura', sector: 'Industri', province: 'Jawa Timur', status: 'Planning', investmentValueIdrB: 3100, isDNI: true, isKEK: true, kbliCodes: ['20111'] },
  { id: 'PSN-012', name: 'Industri Pengolahan Limbah B3 Mojokerto', sector: 'Infrastruktur', province: 'Jawa Timur', status: 'In Progress', investmentValueIdrB: 1700, isDNI: true, isKEK: false, kbliCodes: ['38220', '37022'] },

  // ── Digital ──
  { id: 'PSN-013', name: 'Data Center Hub Banten', sector: 'Digital', province: 'Banten', status: 'In Progress', investmentValueIdrB: 28000, isDNI: true, isKEK: true, kbliCodes: ['63111'] },
  { id: 'PSN-014', name: 'Smart City Nusantara', sector: 'Digital', province: 'Kalimantan Timur', status: 'In Progress', investmentValueIdrB: 85000, isDNI: true, isKEK: false, kbliCodes: ['62011', '63111'] },

  // ── Pariwisata ──
  { id: 'PSN-015', name: 'Kawasan Pariwisata Mandalika', sector: 'Pariwisata', province: 'Nusa Tenggara Barat', status: 'Completed', investmentValueIdrB: 12000, isDNI: true, isKEK: true, kbliCodes: ['55110'] },
  { id: 'PSN-016', name: 'Kawasan Pariwisata Labuan Bajo', sector: 'Pariwisata', province: 'Nusa Tenggara Timur', status: 'In Progress', investmentValueIdrB: 8500, isDNI: true, isKEK: true, kbliCodes: ['55110'] },

  // ── Pertambangan ──
  { id: 'PSN-017', name: 'Industri HPAL Nikel Sulawesi', sector: 'Industri', province: 'Sulawesi Tengah', status: 'In Progress', investmentValueIdrB: 55000, isDNI: true, isKEK: true, kbliCodes: ['24101', '24201'] },
];

// ═══════════════════════════════════════════════════════════════════════════
// 3. PRIORITY SECTORS — RPJMN 2025-2029 + KBMT
// ═══════════════════════════════════════════════════════════════════════════

export interface PrioritySector {
  name: string;
  weight: number;      // Policy weight 0-1 (for S_policy formula)
  isPSN: boolean;      // Part of PSN
  isDNI: boolean;      // In DNI list
  isKBMT: boolean;     // Komite Percepatan Prioritas
  jobCreationMultiplier: number;  // Jobs per Billion IDR investment
  taxHolidayEligible: boolean;
  incentiveTier: 'National Strategic' | 'Priority' | 'Standard';
}

export const PRIORITY_SECTORS: PrioritySector[] = [
  { name: 'Manufacturing', weight: 1.0, isPSN: true, isDNI: true, isKBMT: true, jobCreationMultiplier: 250, taxHolidayEligible: true, incentiveTier: 'National Strategic' },
  { name: 'Industri', weight: 1.0, isPSN: true, isDNI: true, isKBMT: true, jobCreationMultiplier: 200, taxHolidayEligible: true, incentiveTier: 'National Strategic' },
  { name: 'Energi', weight: 0.9, isPSN: true, isDNI: true, isKBMT: true, jobCreationMultiplier: 150, taxHolidayEligible: true, incentiveTier: 'National Strategic' },
  { name: 'Digital', weight: 0.9, isPSN: true, isDNI: true, isKBMT: true, jobCreationMultiplier: 350, taxHolidayEligible: true, incentiveTier: 'National Strategic' },
  { name: 'Infrastruktur', weight: 0.85, isPSN: true, isDNI: true, isKBMT: true, jobCreationMultiplier: 300, taxHolidayEligible: true, incentiveTier: 'Priority' },
  { name: 'Mining', weight: 0.8, isPSN: true, isDNI: true, isKBMT: true, jobCreationMultiplier: 100, taxHolidayEligible: true, incentiveTier: 'Priority' },
  { name: 'Pertanian', weight: 0.75, isPSN: false, isDNI: true, isKBMT: true, jobCreationMultiplier: 400, taxHolidayEligible: true, incentiveTier: 'Priority' },
  { name: 'Pariwisata', weight: 0.7, isPSN: true, isDNI: true, isKBMT: true, jobCreationMultiplier: 350, taxHolidayEligible: true, incentiveTier: 'Priority' },
  { name: 'Perikanan', weight: 0.65, isPSN: false, isDNI: true, isKBMT: false, jobCreationMultiplier: 300, taxHolidayEligible: false, incentiveTier: 'Standard' },
  { name: 'Kesehatan', weight: 0.7, isPSN: true, isDNI: true, isKBMT: true, jobCreationMultiplier: 250, taxHolidayEligible: true, incentiveTier: 'Priority' },
  { name: 'Keuangan', weight: 0.5, isPSN: false, isDNI: false, isKBMT: false, jobCreationMultiplier: 200, taxHolidayEligible: false, incentiveTier: 'Standard' },
  { name: 'Konstruksi', weight: 0.6, isPSN: false, isDNI: true, isKBMT: false, jobCreationMultiplier: 280, taxHolidayEligible: false, incentiveTier: 'Standard' },
  { name: 'Perdagangan', weight: 0.5, isPSN: false, isDNI: false, isKBMT: false, jobCreationMultiplier: 180, taxHolidayEligible: false, incentiveTier: 'Standard' },
  { name: 'PENGANGKUTAN', weight: 0.7, isPSN: true, isDNI: true, isKBMT: false, jobCreationMultiplier: 220, taxHolidayEligible: true, incentiveTier: 'Priority' },
];

// ═══════════════════════════════════════════════════════════════════════════
// 4. REGULATORY RISK SCORES — Expert-informed synthetic
// Based on DNI classification, OSS risk categories, and permit complexity
// ═══════════════════════════════════════════════════════════════════════════

export interface RegulatoryRiskProfile {
  sector: string;
  dniClassification: 'Open' | 'Conditionally Open' | 'Closed';
  maxFdiPct: number;
  permitComplexity: 'Low' | 'Medium' | 'High';
  avgPermitDays: number;
  riskScore: number;     // 0-1 (0=safe, 1=risky)
  commonRiskFlags: string[];
}

export const REGULATORY_RISK_MAP: RegulatoryRiskProfile[] = [
  { sector: 'Industri', dniClassification: 'Open', maxFdiPct: 100, permitComplexity: 'Medium', avgPermitDays: 180, riskScore: 0.2, commonRiskFlags: ['AMDAL required for heavy industry'] },
  { sector: 'Manufacturing', dniClassification: 'Open', maxFdiPct: 100, permitComplexity: 'Medium', avgPermitDays: 180, riskScore: 0.2, commonRiskFlags: ['AMDAL may be required'] },
  { sector: 'Digital', dniClassification: 'Open', maxFdiPct: 100, permitComplexity: 'Low', avgPermitDays: 60, riskScore: 0.1, commonRiskFlags: ['Data localization requirements'] },
  { sector: 'Energi', dniClassification: 'Conditionally Open', maxFdiPct: 95, permitComplexity: 'High', avgPermitDays: 270, riskScore: 0.4, commonRiskFlags: ['PLN PPA required', 'Geothermal license complex', 'Foreign ownership 95% max'] },
  { sector: 'Infrastruktur', dniClassification: 'Conditionally Open', maxFdiPct: 95, permitComplexity: 'High', avgPermitDays: 240, riskScore: 0.35, commonRiskFlags: ['Land acquisition risk', 'PPP framework complexity'] },
  { sector: 'Mining', dniClassification: 'Conditionally Open', maxFdiPct: 0, permitComplexity: 'High', avgPermitDays: 365, riskScore: 0.6, commonRiskFlags: ['Exploration restricted for FDI', 'Forest release may be required', 'Downstream only for foreign'] },
  { sector: 'Pertanian', dniClassification: 'Conditionally Open', maxFdiPct: 95, permitComplexity: 'Medium', avgPermitDays: 120, riskScore: 0.3, commonRiskFlags: ['Palm oil plantation 95% max', 'RSPO certification needed'] },
  { sector: 'Pariwisata', dniClassification: 'Open', maxFdiPct: 100, permitComplexity: 'Low', avgPermitDays: 90, riskScore: 0.15, commonRiskFlags: ['Zoning compliance required'] },
  { sector: 'Perikanan', dniClassification: 'Conditionally Open', maxFdiPct: 80, permitComplexity: 'Medium', avgPermitDays: 150, riskScore: 0.35, commonRiskFlags: ['Fishing zone restrictions', 'Foreign ownership 80% max'] },
  { sector: 'Kesehatan', dniClassification: 'Open', maxFdiPct: 100, permitComplexity: 'High', avgPermitDays: 200, riskScore: 0.3, commonRiskFlags: ['Medical license requirements', 'BPJS compliance'] },
  { sector: 'Konstruksi', dniClassification: 'Open', maxFdiPct: 100, permitComplexity: 'Medium', avgPermitDays: 120, riskScore: 0.2, commonRiskFlags: ['PBG permit required'] },
  { sector: 'PENGANGKUTAN', dniClassification: 'Conditionally Open', maxFdiPct: 95, permitComplexity: 'Medium', avgPermitDays: 150, riskScore: 0.25, commonRiskFlags: ['Transport license required'] },
  { sector: 'Perdagangan', dniClassification: 'Open', maxFdiPct: 100, permitComplexity: 'Low', avgPermitDays: 60, riskScore: 0.1, commonRiskFlags: ['Minimal regulatory risk'] },
  { sector: 'KEK-Specific', dniClassification: 'Open', maxFdiPct: 100, permitComplexity: 'Low', avgPermitDays: 30, riskScore: 0.05, commonRiskFlags: ['One-stop service in KEK'] },
];

// ═══════════════════════════════════════════════════════════════════════════
// 5. PROJECT TYPE MAPPING — BKPM project_type to CMS categories
// ═══════════════════════════════════════════════════════════════════════════

export const PROJECT_TYPE_MAP: Record<string, { cmsType: string; riskLevel: number; typicalHorizon: string }> = {
  'PID': { cmsType: 'Greenfield', riskLevel: 0.5, typicalHorizon: 'Long' },       // Proyek Investasi Daerah
  'PPI': { cmsType: 'Greenfield', riskLevel: 0.4, typicalHorizon: 'Medium' },      // Proyek Prioritas Investasi
  'IPRO': { cmsType: 'Brownfield', riskLevel: 0.3, typicalHorizon: 'Medium' },     // Investasi Proyek
};

// ═══════════════════════════════════════════════════════════════════════════
// 6. STAGE COMPATIBILITY MATRIX — For S_content Stage Match
// Rows: Investor stage | Cols: Project type
// ═══════════════════════════════════════════════════════════════════════════

export const STAGE_COMPATIBILITY: Record<string, Record<string, number>> = {
  // Investor stage × Project type compatibility (0-1)
  'EarlyStage':   { 'Greenfield': 0.9, 'Brownfield': 0.6, 'Expansion': 0.7, 'JV': 0.8 },
  'Growth':       { 'Greenfield': 0.7, 'Brownfield': 0.8, 'Expansion': 0.9, 'JV': 0.7 },
  'Institutional': { 'Greenfield': 0.5, 'Brownfield': 0.9, 'Expansion': 0.8, 'JV': 0.6 },
  'Sovereign':    { 'Greenfield': 0.8, 'Brownfield': 0.7, 'Expansion': 0.6, 'JV': 0.9 },
};

// ═══════════════════════════════════════════════════════════════════════════
// 7. MACRO ECONOMIC PARAMETERS — For S_risk
// ═══════════════════════════════════════════════════════════════════════════

export const MACRO_PARAMS = {
  usdIdrRate: 15800,                  // April 2026 rate
  idrVolatility12m: 0.08,            // 8% annualized volatility
  biRate: 5.75,                       // Bank Indonesia benchmark rate
  gdpGrowthRate: 5.1,                 // 2025 projected GDP growth
  inflationRate: 2.8,                 // CPI inflation
  jakartaCompositeYtd: 0.03,          // JCI YTD return
  countryRiskPremium: 0.035,          // Indonesia country risk premium
};

// ═══════════════════════════════════════════════════════════════════════════
// 8. CMS CALIBRATION WEIGHTS — Default values
// Source: Expert-informed; to be calibrated with A/B testing data
// ═══════════════════════════════════════════════════════════════════════════

export const CMS_WEIGHTS = {
  alpha: 0.35,    // S_content weight
  beta: 0.25,     // S_behavior weight
  gamma: 0.25,    // S_policy weight
  delta: 0.15,    // S_risk weight

  // S_content sub-weights
  sectorWeight: 0.30,
  geoWeight: 0.25,
  scaleWeight: 0.25,
  stageWeight: 0.20,

  // S_policy sub-weights
  psnWeight: 0.25,
  dniWeight: 0.20,
  kekWeight: 0.20,
  sectoralPriorityWeight: 0.20,
  jobCreationWeight: 0.15,
};

/** Helper: check if a project sector is in PSN */
export function isPSNSector(sector: string): boolean {
  return PSN_PROJECTS.some(p => p.sector.toLowerCase() === sector.toLowerCase());
}

/** Helper: check if a project sector is priority */
export function isPrioritySector(sector: string): boolean {
  return PRIORITY_SECTORS.some(p =>
    p.name.toLowerCase() === sector.toLowerCase() && p.isKBMT
  );
}

/** Helper: get regulatory risk for a sector */
export function getRegulatoryRisk(sector: string): RegulatoryRiskProfile {
  return REGULATORY_RISK_MAP.find(r => r.sector.toLowerCase() === sector.toLowerCase()) || {
    sector,
    dniClassification: 'Open' as const,
    maxFdiPct: 100,
    permitComplexity: 'Low' as const,
    avgPermitDays: 90,
    riskScore: 0.2,
    commonRiskFlags: ['Standard regulatory requirements'],
  };
}

/** Helper: get priority sector info */
export function getPrioritySectorInfo(sector: string): PrioritySector | undefined {
  return PRIORITY_SECTORS.find(p => p.name.toLowerCase() === sector.toLowerCase());
}
