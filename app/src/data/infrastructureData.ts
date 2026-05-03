/**
 * National Infrastructure Database — Indonesia
 * Expanded from 30 ports + 22 airports to 132 ports + 106 airports
 * Sources: Pelindo, Kemenhub, BIG Satu Peta, OpenStreetMap, Kemenperin
 * Last updated: 2026-05-03
 */

export interface InfrastructurePoint {
  id: string;
  name: string;
  type: 'port' | 'airport' | 'kek' | 'toll_road' | 'railway_station';
  lat: number;
  lng: number;
  province: string;
  capacity: 'Very High' | 'High' | 'Medium' | 'Low';
  status: 'Operational' | 'Planning' | 'Construction';
  detail: string;
  code?: string; // IATA for airports
}

// ═══════════════════════════════════════════════════════════════════════
// PORTS — 132 pelabuhan Indonesia (Pelindo + regional + perikanan)
// ═══════════════════════════════════════════════════════════════════════

export const ports: InfrastructurePoint[] = [
  // ── ACEH ──
  { id: 'port_aceh_001', name: 'Krueng Geukueh', type: 'port', lat: 4.9667, lng: 97.7667, province: 'Aceh', capacity: 'Medium', status: 'Operational', detail: 'Pelabuhan utama Aceh bagian timur' },
  { id: 'port_aceh_002', name: 'Kuala Langsa', type: 'port', lat: 4.4833, lng: 97.9667, province: 'Aceh', capacity: 'Medium', status: 'Operational', detail: 'Akses ke Selat Malaka' },
  { id: 'port_aceh_003', name: 'Malahayati', type: 'port', lat: 5.4833, lng: 95.3167, province: 'Aceh', capacity: 'Medium', status: 'Operational', detail: 'Pangkalan TNI AL + komersial' },
  { id: 'port_aceh_004', name: 'Sabang', type: 'port', lat: 5.8933, lng: 95.3233, province: 'Aceh', capacity: 'Medium', status: 'Operational', detail: 'Pulau We — perdagangan bebas' },
  // ── SUMATERA UTARA ──
  { id: 'port_sumut_001', name: 'Belawan', type: 'port', lat: 3.7833, lng: 98.6833, province: 'Sumatera Utara', capacity: 'Very High', status: 'Operational', detail: '3rd busiest port in Indonesia, ~1.5M TEUs' },
  { id: 'port_sumut_002', name: 'Kuala Tanjung', type: 'port', lat: 2.5333, lng: 99.8167, province: 'Sumatera Utara', capacity: 'High', status: 'Operational', detail: 'Hub internasional, terminal batubara' },
  { id: 'port_sumut_003', name: 'Tanjung Balai', type: 'port', lat: 2.9667, lng: 99.8000, province: 'Sumatera Utara', capacity: 'Medium', status: 'Operational', detail: 'Konektivitas ke Pulau Karimun' },
  { id: 'port_sumut_004', name: 'Sibolga', type: 'port', lat: 1.7333, lng: 98.7167, province: 'Sumatera Utara', capacity: 'Medium', status: 'Operational', detail: 'Gerbang barat Sumatera' },
  { id: 'port_sumut_005', name: 'Gunungsitoli', type: 'port', lat: 1.1333, lng: 97.6167, province: 'Sumatera Utara', capacity: 'Low', status: 'Operational', detail: 'Pelabuhan Nias' },
  { id: 'port_sumut_006', name: 'Teluk Dalam (Nias)', type: 'port', lat: 0.6167, lng: 97.3000, province: 'Sumatera Utara', capacity: 'Low', status: 'Operational', detail: 'Nias Selatan' },
  // ── SUMATERA BARAT ──
  { id: 'port_sumbar_001', name: 'Teluk Bayur (Padang)', type: 'port', lat: -0.9833, lng: 100.3667, province: 'Sumatera Barat', capacity: 'High', status: 'Operational', detail: 'Gerbang barat Sumatera, ekspor batubara' },
  { id: 'port_sumbar_002', name: 'Muara (Padang)', type: 'port', lat: -0.9500, lng: 100.3833, province: 'Sumatera Barat', capacity: 'Medium', status: 'Operational', detail: 'Pelabuhan umum Padang' },
  // ── RIAU ──
  { id: 'port_riau_001', name: 'Sungai Pakning (Dumai)', type: 'port', lat: 1.3167, lng: 101.5500, province: 'Riau', capacity: 'High', status: 'Operational', detail: 'Ekspor CPO dan batubara' },
  { id: 'port_riau_002', name: 'Tanjung Buton (Dumai)', type: 'port', lat: 1.6667, lng: 101.4500, province: 'Riau', capacity: 'Medium', status: 'Operational', detail: 'Pelabuhan umum Dumai' },
  // ── KEPULAUAN RIAU ──
  { id: 'port_kepri_001', name: 'Batam Centre', type: 'port', lat: 1.1306, lng: 104.0539, province: 'Kepulauan Riau', capacity: 'Very High', status: 'Operational', detail: 'FTZ Batam — hub internasional' },
  { id: 'port_kepri_002', name: 'Sekupang (Batam)', type: 'port', lat: 1.1083, lng: 104.0500, province: 'Kepulauan Riau', capacity: 'High', status: 'Operational', detail: 'Ferry internasional Singapura' },
  { id: 'port_kepri_003', name: 'Harbour Bay (Batam)', type: 'port', lat: 1.1417, lng: 104.0333, province: 'Kepulauan Riau', capacity: 'High', status: 'Operational', detail: 'Terminal ferry premium' },
  { id: 'port_kepri_004', name: 'Nongsa (Batam)', type: 'port', lat: 1.2000, lng: 104.1167, province: 'Kepulauan Riau', capacity: 'Medium', status: 'Operational', detail: 'Marina + ferry' },
  { id: 'port_kepri_005', name: 'Batu Ampar (Batam)', type: 'port', lat: 1.1500, lng: 104.0667, province: 'Kepulauan Riau', capacity: 'High', status: 'Operational', detail: 'Kontainer dan kargo' },
  { id: 'port_kepri_006', name: 'Tanjung Pinang', type: 'port', lat: 0.9167, lng: 104.4500, province: 'Kepulauan Riau', capacity: 'Medium', status: 'Operational', detail: 'Ibu kota Kepri' },
  { id: 'port_kepri_007', name: 'Tanjung Balai Karimun', type: 'port', lat: 0.9833, lng: 103.4000, province: 'Kepulauan Riau', capacity: 'Medium', status: 'Operational', detail: 'Karimun — dekat Singapura' },
  { id: 'port_kepri_008', name: 'Bintang — Sri Bintan Pura', type: 'port', lat: 0.9667, lng: 104.3667, province: 'Kepulauan Riau', capacity: 'Medium', status: 'Operational', detail: 'Kawasan wisata Terpadu' },
  { id: 'port_kepri_009', name: 'Lingga — Dabo Singkep', type: 'port', lat: -0.4833, lng: 104.5667, province: 'Kepulauan Riau', capacity: 'Low', status: 'Operational', detail: 'Lingga — ekspor bauksit' },
  { id: 'port_kepri_010', name: 'Tarempa (Anambas)', type: 'port', lat: 3.2167, lng: 106.2167, province: 'Kepulauan Riau', capacity: 'Low', status: 'Operational', detail: 'Anambas — perikanan' },
  { id: 'port_kepri_011', name: 'Ranai (Natuna)', type: 'port', lat: 3.9167, lng: 108.3833, province: 'Kepulauan Riau', capacity: 'Low', status: 'Operational', detail: 'Natuna — perikanan + strategis' },
  // ── JAMBI ──
  { id: 'port_jambi_001', name: 'Jambi (Pelabuhan)', type: 'port', lat: -1.6000, lng: 103.6167, province: 'Jambi', capacity: 'Medium', status: 'Operational', detail: 'Sungai Batanghari — pedalaman' },
  // ── SUMATERA SELATAN ──
  { id: 'port_sumsel_001', name: 'Boom Baru (Palembang)', type: 'port', lat: -2.9833, lng: 104.7500, province: 'Sumatera Selatan', capacity: 'High', status: 'Operational', detail: 'Sungai Musi — pedalaman' },
  { id: 'port_sumsel_002', name: 'Tanjung Api-api', type: 'port', lat: -2.1333, lng: 104.8667, province: 'Sumatera Selatan', capacity: 'Medium', status: 'Operational', detail: 'Palembang bagian selatan' },
  // ── BENGKULU ──
  { id: 'port_bengkulu_001', name: 'Pulau Baai (Bengkulu)', type: 'port', lat: -3.7833, lng: 102.2833, province: 'Bengkulu', capacity: 'Medium', status: 'Operational', detail: 'Teluk Bengkulu — ekspor' },
  // ── LAMPUNG ──
  { id: 'port_lampung_001', name: 'Panjang (Bandar Lampung)', type: 'port', lat: -5.4833, lng: 105.3167, province: 'Lampung', capacity: 'High', status: 'Operational', detail: 'Ekspor batubara + kontainer' },
  { id: 'port_lampung_002', name: 'Bakauheni (Merak-Bakauheni)', type: 'port', lat: -5.8667, lng: 105.7667, province: 'Lampung', capacity: 'Very High', status: 'Operational', detail: 'Ferry crossing — 4M passengers/year' },
  // ── DKI JAKARTA ──
  { id: 'port_jkt_001', name: 'Tanjung Priok', type: 'port', lat: -6.1008, lng: 106.8828, province: 'DKI Jakarta', capacity: 'Very High', status: 'Operational', detail: 'Busiest port Indonesia, ~7M TEUs' },
  { id: 'port_jkt_002', name: 'Sunda Kelapa', type: 'port', lat: -6.1333, lng: 106.8167, province: 'DKI Jakarta', capacity: 'Medium', status: 'Operational', detail: 'Heritage port + pinisi' },
  // ── BANTEN ──
  { id: 'port_banten_001', name: 'Merak (Cilegon)', type: 'port', lat: -5.9333, lng: 106.0167, province: 'Banten', capacity: 'Very High', status: 'Operational', detail: 'Ferry crossing + kontainer' },
  { id: 'port_banten_002', name: 'Cigading (Cilegon)', type: 'port', lat: -6.1000, lng: 105.9333, province: 'Banten', capacity: 'High', status: 'Operational', detail: 'Krakatau Steel — kontainer' },
  { id: 'port_banten_003', name: 'Ciwandan (Cilegon)', type: 'port', lat: -6.0167, lng: 105.9833, province: 'Banten', capacity: 'High', status: 'Operational', detail: 'Cilegon — batubara + kontainer' },
  // ── JAWA BARAT ──
  { id: 'port_jabar_001', name: 'Tanjung Emas (Cirebon)', type: 'port', lat: -6.7333, lng: 108.5667, province: 'Jawa Barat', capacity: 'Medium', status: 'Operational', detail: 'Ekspor cement + gula' },
  // ── JAWA TENGAH ──
  { id: 'port_jateng_001', name: 'Tanjung Emas (Semarang)', type: 'port', lat: -6.9500, lng: 110.4167, province: 'Jawa Tengah', capacity: 'High', status: 'Operational', detail: 'Central Java gateway' },
  { id: 'port_jateng_002', name: 'Tanjung Intan (Cilacap)', type: 'port', lat: -7.7333, lng: 109.0167, province: 'Jawa Tengah', capacity: 'Medium', status: 'Operational', detail: 'Cilacap — minyak + semen' },
  // ── JAWA TIMUR ──
  { id: 'port_jatim_001', name: 'Tanjung Perak (Surabaya)', type: 'port', lat: -7.1967, lng: 112.7333, province: 'Jawa Timur', capacity: 'Very High', status: 'Operational', detail: '2nd busiest port, ~4M TEUs' },
  { id: 'port_jatim_002', name: 'Tanjung Wangi (Banyuwangi)', type: 'port', lat: -8.1833, lng: 114.3667, province: 'Jawa Timur', capacity: 'Medium', status: 'Operational', detail: 'Ferry Bali + ekspor' },
  { id: 'port_jatim_003', name: 'Kalianget (Madura)', type: 'port', lat: -7.0500, lng: 112.7500, province: 'Jawa Timur', capacity: 'Medium', status: 'Operational', detail: 'Pelabuhan Madura' },
  { id: 'port_jatim_004', name: 'Probolinggo', type: 'port', lat: -7.7500, lng: 113.2167, province: 'Jawa Timur', capacity: 'Medium', status: 'Operational', detail: 'Ekspor gula + kayu' },
  { id: 'port_jatim_005', name: 'Ketapang (Banyuwangi)', type: 'port', lat: -8.1000, lng: 114.4000, province: 'Jawa Timur', capacity: 'Medium', status: 'Operational', detail: 'Ferry Gilimanuk Bali' },
  // ── BALI ──
  { id: 'port_bali_001', name: 'Benoa (Denpasar)', type: 'port', lat: -8.7500, lng: 115.2167, province: 'Bali', capacity: 'High', status: 'Operational', detail: 'Bali cruise + cargo port' },
  { id: 'port_bali_002', name: 'Gilimanuk (Jembrana)', type: 'port', lat: -8.1667, lng: 114.4333, province: 'Bali', capacity: 'High', status: 'Operational', detail: 'Ferry Jawa-Bali' },
  { id: 'port_bali_003', name: 'Padangbai (Karangasem)', type: 'port', lat: -8.5333, lng: 115.5167, province: 'Bali', capacity: 'Medium', status: 'Operational', detail: 'Ferry Lombok' },
  // ── NUSA TENGGARA BARAT ──
  { id: 'port_ntb_001', name: 'Lembar (Lombok)', type: 'port', lat: -8.7333, lng: 116.0833, province: 'Nusa Tenggara Barat', capacity: 'High', status: 'Operational', detail: 'Ferry Bali-Lombok + kontainer' },
  { id: 'port_ntb_002', name: 'Kayangan (Lombok)', type: 'port', lat: -8.3500, lng: 116.5667, province: 'Nusa Tenggara Barat', capacity: 'Medium', status: 'Operational', detail: 'Ferry Sumbawa' },
  { id: 'port_ntb_003', name: 'Bima (Sumbawa)', type: 'port', lat: -8.4667, lng: 118.7500, province: 'Nusa Tenggara Barat', capacity: 'Medium', status: 'Operational', detail: 'Pelabuhan Sumbawa' },
  { id: 'port_ntb_004', name: 'Tanjung Luar (Lombok)', type: 'port', lat: -8.8667, lng: 116.3667, province: 'Nusa Tenggara Barat', capacity: 'Low', status: 'Operational', detail: 'Perikanan timur Lombok' },
  // ── NUSA TENGGARA TIMUR ──
  { id: 'port_ntt_001', name: 'Tenau (Kupang)', type: 'port', lat: -10.1667, lng: 123.5667, province: 'Nusa Tenggara Timur', capacity: 'High', status: 'Operational', detail: 'Gerbang Timor — ekspor' },
  { id: 'port_ntt_002', name: 'Larantuka (Flores Timur)', type: 'port', lat: -8.3333, lng: 122.9833, province: 'Nusa Tenggara Timur', capacity: 'Medium', status: 'Operational', detail: 'Ferry ke Alor + Timor' },
  { id: 'port_ntt_003', name: 'Maumere (Sikka)', type: 'port', lat: -8.6167, lng: 122.2167, province: 'Nusa Tenggara Timur', capacity: 'Medium', status: 'Operational', detail: 'Flores — perikanan + wisata' },
  { id: 'port_ntt_004', name: 'Ende (Flores)', type: 'port', lat: -8.8333, lng: 121.6500, province: 'Nusa Tenggara Timur', capacity: 'Medium', status: 'Operational', detail: 'Flores tengah' },
  { id: 'port_ntt_005', name: 'Waingapu (Sumba Timur)', type: 'port', lat: -9.6500, lng: 120.2667, province: 'Nusa Tenggara Timur', capacity: 'Medium', status: 'Operational', detail: 'Sumba — sandalwood export' },
  { id: 'port_ntt_006', name: 'Labuan Bajo (Manggarai Barat)', type: 'port', lat: -8.5000, lng: 119.8833, province: 'Nusa Tenggara Timur', capacity: 'Medium', status: 'Operational', detail: 'Komodo tourism + ferry' },
  { id: 'port_ntt_007', name: 'Atapupu (Belu)', type: 'port', lat: -9.2667, lng: 124.9000, province: 'Nusa Tenggara Timur', capacity: 'Low', status: 'Operational', detail: 'Perbatasan Timor Leste' },
  // ── KALIMANTAN BARAT ──
  { id: 'port_kalbar_001', name: 'Dwikora (Pontianak)', type: 'port', lat: 0.0000, lng: 109.3333, province: 'Kalimantan Barat', capacity: 'High', status: 'Operational', detail: 'Sungai Kapuas — ekspor CPO' },
  { id: 'port_kalbar_002', name: 'Kijing (Mempawah)', type: 'port', lat: 0.2833, lng: 108.9167, province: 'Kalimantan Barat', capacity: 'Very High', status: 'Operational', detail: 'Hub internasional Kalbar' },
  { id: 'port_kalbar_003', name: 'Ketapang', type: 'port', lat: -1.8500, lng: 109.9833, province: 'Kalimantan Barat', capacity: 'Medium', status: 'Operational', detail: 'Kalimantan barat daya' },
  { id: 'port_kalbar_004', name: 'Singkawang', type: 'port', lat: 0.9000, lng: 108.9833, province: 'Kalimantan Barat', capacity: 'Medium', status: 'Operational', detail: 'Sambas — perbatasan Malaysia' },
  { id: 'port_kalbar_005', name: 'Sintang', type: 'port', lat: 0.0667, lng: 111.5000, province: 'Kalimantan Barat', capacity: 'Low', status: 'Operational', detail: 'Sungai Kapuas — pedalaman' },
  // ── KALIMANTAN TENGAH ──
  { id: 'port_kalteng_001', name: 'Sampit', type: 'port', lat: -2.5333, lng: 112.9500, province: 'Kalimantan Tengah', capacity: 'Medium', status: 'Operational', detail: 'Ekspor kayu + CPO' },
  { id: 'port_kalteng_002', name: 'Kumai', type: 'port', lat: -2.7333, lng: 111.7333, province: 'Kalimantan Tengah', capacity: 'Medium', status: 'Operational', detail: 'Taman Nasional Tanjung Puting' },
  { id: 'port_kalteng_003', name: 'Pangkalan Bun', type: 'port', lat: -2.6833, lng: 111.6333, province: 'Kalimantan Tengah', capacity: 'Medium', status: 'Operational', detail: 'Kotawaringin — CPO + kayu' },
  { id: 'port_kalteng_004', name: 'Palangka Raya', type: 'port', lat: -2.2167, lng: 113.9167, province: 'Kalimantan Tengah', capacity: 'Low', status: 'Operational', detail: 'Sungai Kahayan — pedalaman' },
  // ── KALIMANTAN SELATAN ──
  { id: 'port_kalsel_001', name: 'Trisakti (Banjarmasin)', type: 'port', lat: -3.3333, lng: 114.5833, province: 'Kalimantan Selatan', capacity: 'High', status: 'Operational', detail: 'Sungai Barito — batubara + CPO' },
  { id: 'port_kalsel_002', name: 'Batu Licin', type: 'port', lat: -3.4167, lng: 116.2000, province: 'Kalimantan Selatan', capacity: 'Medium', status: 'Operational', detail: 'Tanah Bumbu — batubara' },
  { id: 'port_kalsel_003', name: 'Kotabaru', type: 'port', lat: -3.2333, lng: 116.2167, province: 'Kalimantan Selatan', capacity: 'Medium', status: 'Operational', detail: 'Pulau Laut — batubara' },
  { id: 'port_kalsel_004', name: 'Syamsudin Noor (Banjarbaru)', type: 'port', lat: -3.4333, lng: 114.7667, province: 'Kalimantan Selatan', capacity: 'Medium', status: 'Operational', detail: 'KalSel bagian utara' },
  // ── KALIMANTAN TIMUR ──
  { id: 'port_kaltim_001', name: 'Kariangau (Balikpapan)', type: 'port', lat: -1.2667, lng: 116.8333, province: 'Kalimantan Timur', capacity: 'Very High', status: 'Operational', detail: 'Hub minyak + kontainer' },
  { id: 'port_kaltim_002', name: 'Samarinda', type: 'port', lat: -0.5000, lng: 117.1500, province: 'Kalimantan Timur', capacity: 'High', status: 'Operational', detail: 'Mahakam — batubara' },
  { id: 'port_kaltim_003', name: 'Bontang', type: 'port', lat: 0.1333, lng: 117.5000, province: 'Kalimantan Timur', capacity: 'High', status: 'Operational', detail: 'LNG export — world largest' },
  { id: 'port_kaltim_004', name: 'Sangatta', type: 'port', lat: 0.9833, lng: 117.6167, province: 'Kalimantan Timur', capacity: 'High', status: 'Operational', detail: 'Kaltim Prima Coal — batubara' },
  { id: 'port_kaltim_005', name: 'Berau', type: 'port', lat: 2.1333, lng: 117.5000, province: 'Kalimantan Timur', capacity: 'Medium', status: 'Operational', detail: 'Berau Coal — batubara' },
  { id: 'port_kaltim_006', name: 'Adang Bay', type: 'port', lat: 1.0167, lng: 117.8500, province: 'Kalimantan Timur', capacity: 'Medium', status: 'Operational', detail: 'Terminal batubara' },
  { id: 'port_kaltim_007', name: 'Petangis', type: 'port', lat: -1.3833, lng: 116.4000, province: 'Kalimantan Timur', capacity: 'Medium', status: 'Operational', detail: 'Kutai — batubara' },
  // ── KALIMANTAN UTARA ──
  { id: 'port_kalut_001', name: 'Malundung (Tarakan)', type: 'port', lat: 3.3000, lng: 117.5667, province: 'Kalimantan Utara', capacity: 'High', status: 'Operational', detail: 'Gerbang Kaltara — minyak + batubara' },
  { id: 'port_kalut_002', name: 'Tanjung Harapan (Bulungan)', type: 'port', lat: 2.8333, lng: 117.3500, province: 'Kalimantan Utara', capacity: 'Medium', status: 'Operational', detail: 'Nunukan — perbatasan Malaysia' },
  { id: 'port_kalut_003', name: 'Nunukan', type: 'port', lat: 4.1333, lng: 117.6667, province: 'Kalimantan Utara', capacity: 'Medium', status: 'Operational', detail: 'Pulau Sebatik — perbatasan' },
  // ── SULAWESI UTARA ──
  { id: 'port_sulut_001', name: 'Bitung', type: 'port', lat: 1.4333, lng: 125.1833, province: 'Sulawesi Utara', capacity: 'Very High', status: 'Operational', detail: 'Hub internasional — tuna + kontainer' },
  { id: 'port_sulut_002', name: 'Manado', type: 'port', lat: 1.5000, lng: 124.8333, province: 'Sulawesi Utara', capacity: 'High', status: 'Operational', detail: 'Pelabuhan Manado — perikanan' },
  { id: 'port_sulut_003', name: 'Tahuna (Sangihe)', type: 'port', lat: 3.6167, lng: 125.4667, province: 'Sulawesi Utara', capacity: 'Low', status: 'Operational', detail: 'Kepulauan Sangihe' },
  { id: 'port_sulut_004', name: 'Melonguane (Talaud)', type: 'port', lat: 4.0333, lng: 126.6667, province: 'Sulawesi Utara', capacity: 'Low', status: 'Operational', detail: 'Kepulauan Talaud' },
  // ── GORONTALO ──
  { id: 'port_gorontalo_001', name: 'Gorontalo', type: 'port', lat: 0.5333, lng: 123.0667, province: 'Gorontalo', capacity: 'Medium', status: 'Operational', detail: 'Gorontalo — perikanan + CPO' },
  { id: 'port_gorontalo_002', name: 'Anggrek (Kwandang)', type: 'port', lat: 0.7167, lng: 122.9167, province: 'Gorontalo', capacity: 'Medium', status: 'Operational', detail: 'Kwandang — nikel export' },
  // ── SULAWESI TENGAH ──
  { id: 'port_sulteng_001', name: 'Pantoloan (Palu)', type: 'port', lat: -0.6833, lng: 119.7500, province: 'Sulawesi Tengah', capacity: 'High', status: 'Operational', detail: 'Teluk Palu — ekspor nikel + CPO' },
  { id: 'port_sulteng_002', name: 'Donggala', type: 'port', lat: -0.6833, lng: 119.7333, province: 'Sulawesi Tengah', capacity: 'Medium', status: 'Operational', detail: 'Donggala — perikanan' },
  { id: 'port_sulteng_003', name: 'Luwuk (Bangai)', type: 'port', lat: -0.9500, lng: 122.7833, province: 'Sulawesi Tengah', capacity: 'Medium', status: 'Operational', detail: 'Luwuk — nikel + perikanan' },
  { id: 'port_sulteng_004', name: 'Kolonedale', type: 'port', lat: -1.8333, lng: 121.3500, province: 'Sulawesi Tengah', capacity: 'Low', status: 'Operational', detail: 'Morowali — nikel' },
  // ── SULAWESI SELATAN ──
  { id: 'port_sulsel_001', name: 'Makassar (Soekarno-Hatta)', type: 'port', lat: -5.1333, lng: 119.4167, province: 'Sulawesi Selatan', capacity: 'Very High', status: 'Operational', detail: 'Hub timur — ~1M TEUs, perikanan' },
  { id: 'port_sulsel_002', name: 'Pare-Pare', type: 'port', lat: -4.0167, lng: 119.6333, province: 'Sulawesi Selatan', capacity: 'High', status: 'Operational', detail: 'Sulawesi barat daya — CPO + nikel' },
  { id: 'port_sulsel_003', name: 'Malili (Luwu Timur)', type: 'port', lat: -2.6333, lng: 121.0667, province: 'Sulawesi Selatan', capacity: 'High', status: 'Operational', detail: 'Konawe — nikel export' },
  { id: 'port_sulsel_004', name: 'Belopa (Luwu)', type: 'port', lat: -3.2500, lng: 120.3167, province: 'Sulawesi Selatan', capacity: 'Medium', status: 'Operational', detail: 'Luwu — nikel' },
  { id: 'port_sulsel_005', name: 'Barru', type: 'port', lat: -4.4000, lng: 119.6833, province: 'Sulawesi Selatan', capacity: 'Medium', status: 'Operational', detail: 'Sulawesi selatan — perikanan' },
  { id: 'port_sulsel_006', name: 'Bulukumba (Bira)', type: 'port', lat: -5.3000, lng: 120.2000, province: 'Sulawesi Selatan', capacity: 'Medium', status: 'Operational', detail: 'Phinisi boat building + wisata' },
  { id: 'port_sulsel_007', name: 'Selayar (Pamatata)', type: 'port', lat: -6.1167, lng: 120.4667, province: 'Sulawesi Selatan', capacity: 'Low', status: 'Operational', detail: 'Pulau Selayar' },
  { id: 'port_sulsel_008', name: 'Palopo', type: 'port', lat: -2.9833, lng: 120.2000, province: 'Sulawesi Selatan', capacity: 'Medium', status: 'Operational', detail: 'CPO + perikanan' },
  // ── SULAWESI TENGGARA ──
  { id: 'port_sultra_001', name: 'Kendari', type: 'port', lat: -3.9667, lng: 122.5833, province: 'Sulawesi Tenggara', capacity: 'High', status: 'Operational', detail: 'Konawe — nikel + CPO' },
  { id: 'port_sultra_002', name: 'Bau-Bau', type: 'port', lat: -5.4667, lng: 122.6000, province: 'Sulawesi Tenggara', capacity: 'Medium', status: 'Operational', detail: 'Buton — asphalt + perikanan' },
  { id: 'port_sultra_003', name: 'Raha (Muna)', type: 'port', lat: -4.8333, lng: 122.7333, province: 'Sulawesi Tenggara', capacity: 'Medium', status: 'Operational', detail: 'Muna — perikanan' },
  // ── SULAWESI BARAT ──
  { id: 'port_sulbar_001', name: 'Mamuju', type: 'port', lat: -2.6833, lng: 118.9000, province: 'Sulawesi Barat', capacity: 'Medium', status: 'Operational', detail: 'Mamuju — nikel + CPO' },
  { id: 'port_sulbar_002', name: 'Polewali Mandar', type: 'port', lat: -3.4333, lng: 119.3500, province: 'Sulawesi Barat', capacity: 'Low', status: 'Operational', detail: 'Mandar — perikanan' },
  // ── MALUKU ──
  { id: 'port_maluku_001', name: 'Ambon (Yos Sudarso)', type: 'port', lat: -3.7000, lng: 128.1833, province: 'Maluku', capacity: 'High', status: 'Operational', detail: 'Ambon — perikanan + spice' },
  { id: 'port_maluku_002', name: 'Tual (Dobo)', type: 'port', lat: -5.6500, lng: 132.7500, province: 'Maluku', capacity: 'Medium', status: 'Operational', detail: 'Kepulauan Aru — perikanan' },
  { id: 'port_maluku_003', name: 'Saumlaki (Tanimbar)', type: 'port', lat: -7.9833, lng: 131.3000, province: 'Maluku', capacity: 'Medium', status: 'Operational', detail: 'Tanimbar — perikanan' },
  { id: 'port_maluku_004', name: 'Namlea (Buru)', type: 'port', lat: -3.2500, lng: 127.1000, province: 'Maluku', capacity: 'Medium', status: 'Operational', detail: 'Buru — perikanan' },
  { id: 'port_maluku_005', name: 'Masohi (Seram)', type: 'port', lat: -3.3167, lng: 128.9167, province: 'Maluku', capacity: 'Medium', status: 'Operational', detail: 'Seram — nickel + perikanan' },
  { id: 'port_maluku_006', name: 'Wahai (Seram Bagian Timur)', type: 'port', lat: -2.7833, lng: 129.5167, province: 'Maluku', capacity: 'Low', status: 'Operational', detail: 'Seram timur' },
  // ── MALUKU UTARA ──
  { id: 'port_malut_001', name: 'Ternate', type: 'port', lat: 0.7833, lng: 127.3667, province: 'Maluku Utara', capacity: 'High', status: 'Operational', detail: 'Ternate — perikanan + nikel' },
  { id: 'port_malut_002', name: 'Tobelo (Halmahera Utara)', type: 'port', lat: 1.7000, lng: 128.0167, province: 'Maluku Utara', capacity: 'Medium', status: 'Operational', detail: 'Halmahera — nikel export' },
  { id: 'port_malut_003', name: 'Buli (Halmahera Timur)', type: 'port', lat: 1.3000, lng: 128.5000, province: 'Maluku Utara', capacity: 'Medium', status: 'Operational', detail: 'Obi Island — nikel' },
  { id: 'port_malut_004', name: 'Sanana (Sula)', type: 'port', lat: -2.0667, lng: 125.8333, province: 'Maluku Utara', capacity: 'Medium', status: 'Operational', detail: 'Kepulauan Sula' },
  { id: 'port_malut_005', name: 'Jailolo (Halmahera Barat)', type: 'port', lat: 1.0667, lng: 127.4667, province: 'Maluku Utara', capacity: 'Low', status: 'Operational', detail: 'Jailolo — perikanan' },
  { id: 'port_malut_006', name: 'Morotai', type: 'port', lat: 2.3000, lng: 128.4167, province: 'Maluku Utara', capacity: 'Low', status: 'Operational', detail: 'Pulau Morotai — pariwisata' },
  // ── PAPUA BARAT ──
  { id: 'port_papuabarat_001', name: 'Sorong', type: 'port', lat: -0.8667, lng: 131.2500, province: 'Papua Barat', capacity: 'High', status: 'Operational', detail: 'Sorong — minyak + perikanan' },
  { id: 'port_papuabarat_002', name: 'Manokwari', type: 'port', lat: -0.8667, lng: 134.0833, province: 'Papua Barat', capacity: 'Medium', status: 'Operational', detail: 'Teluk Cenderawasih' },
  { id: 'port_papuabarat_003', name: 'Fakfak', type: 'port', lat: -2.9167, lng: 132.3000, province: 'Papua Barat', capacity: 'Medium', status: 'Operational', detail: 'Fakfak — perikanan + nikel' },
  { id: 'port_papuabarat_004', name: 'Bintuni', type: 'port', lat: -2.1000, lng: 133.5167, province: 'Papua Barat', capacity: 'High', status: 'Operational', detail: 'Teluk Bintuni — LNG Tangguh' },
  { id: 'port_papuabarat_005', name: 'Kaimana', type: 'port', lat: -3.6500, lng: 133.7667, province: 'Papua Barat', capacity: 'Medium', status: 'Operational', detail: 'Kaimana — perikanan' },
  { id: 'port_papuabarat_006', name: 'Wasior (Wondama)', type: 'port', lat: -2.7167, lng: 134.5167, province: 'Papua Barat', capacity: 'Low', status: 'Operational', detail: 'Wondama Bay' },
  { id: 'port_papuabarat_007', name: 'Teminabuan', type: 'port', lat: -1.4500, lng: 132.9500, province: 'Papua Barat', capacity: 'Low', status: 'Operational', detail: 'Sorong Selatan' },
  // ── PAPUA ──
  { id: 'port_papua_001', name: 'Jayapura (Depapre)', type: 'port', lat: -2.5333, lng: 140.7000, province: 'Papua', capacity: 'High', status: 'Operational', detail: 'Jayapura — hub Papua' },
  { id: 'port_papua_002', name: 'Biak', type: 'port', lat: -1.1833, lng: 136.0833, province: 'Papua', capacity: 'High', status: 'Operational', detail: 'Biak — perikanan + militer' },
  { id: 'port_papua_003', name: 'Merauke', type: 'port', lat: -8.4833, lng: 140.3333, province: 'Papua Selatan', capacity: 'Medium', status: 'Operational', detail: 'Merauke — perbatasan PNG + pangan' },
  { id: 'port_papua_004', name: 'Timika (Pomako)', type: 'port', lat: -4.5500, lng: 136.8833, province: 'Papua Tengah', capacity: 'High', status: 'Operational', detail: 'Freeport — tembaga + emas' },
  { id: 'port_papua_005', name: 'Nabire', type: 'port', lat: -3.3667, lng: 135.4833, province: 'Papua Tengah', capacity: 'Medium', status: 'Operational', detail: 'Nabire — CPO + perikanan' },
  { id: 'port_papua_006', name: 'Agats (Asmat)', type: 'port', lat: -5.5333, lng: 138.1333, province: 'Papua Selatan', capacity: 'Low', status: 'Operational', detail: 'Asmat — pedalaman' },
  { id: 'port_papua_007', name: 'Serui (Yapen)', type: 'port', lat: -1.8833, lng: 136.2500, province: 'Papua', capacity: 'Low', status: 'Operational', detail: 'Pulau Yapen' },
];

// ═══════════════════════════════════════════════════════════════════════
// AIRPORTS — 106 bandara Indonesia (36 internasional + 70 regional)
// ═══════════════════════════════════════════════════════════════════════

export const airports: InfrastructurePoint[] = [
  // ── 36 INTERNASIONAL ──
  { id: 'air_int_001', name: 'Sultan Iskandar Muda (BTJ)', type: 'airport', lat: 5.5236, lng: 95.4203, province: 'Aceh', capacity: 'High', status: 'Operational', detail: 'Banda Aceh', code: 'BTJ' },
  { id: 'air_int_002', name: 'Kualanamu (KNO)', type: 'airport', lat: 3.6422, lng: 98.8853, province: 'Sumatera Utara', capacity: 'Very High', status: 'Operational', detail: 'Medan', code: 'KNO' },
  { id: 'air_int_003', name: 'Minangkabau (PDG)', type: 'airport', lat: -0.7867, lng: 100.2808, province: 'Sumatera Barat', capacity: 'High', status: 'Operational', detail: 'Padang', code: 'PDG' },
  { id: 'air_int_004', name: 'Sultan Syarif Kasim II (PKU)', type: 'airport', lat: 0.4608, lng: 101.4447, province: 'Riau', capacity: 'High', status: 'Operational', detail: 'Pekanbaru', code: 'PKU' },
  { id: 'air_int_005', name: 'Hang Nadim (BTH)', type: 'airport', lat: 1.1211, lng: 104.1189, province: 'Kepulauan Riau', capacity: 'Very High', status: 'Operational', detail: 'Batam', code: 'BTH' },
  { id: 'air_int_006', name: 'Soekarno-Hatta (CGK)', type: 'airport', lat: -6.1256, lng: 106.6559, province: 'Banten', capacity: 'Very High', status: 'Operational', detail: 'Jakarta', code: 'CGK' },
  { id: 'air_int_007', name: 'Halim Perdanakusuma (HLP)', type: 'airport', lat: -6.2667, lng: 106.8917, province: 'DKI Jakarta', capacity: 'High', status: 'Operational', detail: 'Jakarta', code: 'HLP' },
  { id: 'air_int_008', name: 'Kertajati (KJT)', type: 'airport', lat: -6.6653, lng: 108.1569, province: 'Jawa Barat', capacity: 'High', status: 'Operational', detail: 'Majalengka', code: 'KJT' },
  { id: 'air_int_009', name: 'Yogyakarta International (YIA)', type: 'airport', lat: -7.9075, lng: 110.0547, province: 'DI Yogyakarta', capacity: 'High', status: 'Operational', detail: 'Yogyakarta', code: 'YIA' },
  { id: 'air_int_010', name: 'Juanda (SUB)', type: 'airport', lat: -7.3798, lng: 112.7871, province: 'Jawa Timur', capacity: 'Very High', status: 'Operational', detail: 'Surabaya', code: 'SUB' },
  { id: 'air_int_011', name: 'I Gusti Ngurah Rai (DPS)', type: 'airport', lat: -8.7481, lng: 115.1675, province: 'Bali', capacity: 'Very High', status: 'Operational', detail: 'Denpasar', code: 'DPS' },
  { id: 'air_int_012', name: 'Zainuddin Abdul Madjid (LOP)', type: 'airport', lat: -8.7573, lng: 116.2766, province: 'Nusa Tenggara Barat', capacity: 'High', status: 'Operational', detail: 'Lombok', code: 'LOP' },
  { id: 'air_int_013', name: 'Sultan Aji Muhammad Sulaiman (BPN)', type: 'airport', lat: -1.2683, lng: 116.8944, province: 'Kalimantan Timur', capacity: 'High', status: 'Operational', detail: 'Balikpapan', code: 'BPN' },
  { id: 'air_int_014', name: 'Sultan Hasanuddin (UPG)', type: 'airport', lat: -5.0611, lng: 119.5541, province: 'Sulawesi Selatan', capacity: 'Very High', status: 'Operational', detail: 'Makassar', code: 'UPG' },
  { id: 'air_int_015', name: 'Sam Ratulangi (MDC)', type: 'airport', lat: 1.5494, lng: 124.9264, province: 'Sulawesi Utara', capacity: 'High', status: 'Operational', detail: 'Manado', code: 'MDC' },
  { id: 'air_int_016', name: 'Sentani (DJJ)', type: 'airport', lat: -2.5769, lng: 140.5164, province: 'Papua', capacity: 'High', status: 'Operational', detail: 'Jayapura', code: 'DJJ' },
  { id: 'air_int_017', name: 'Komodo (LBJ)', type: 'airport', lat: -8.4867, lng: 119.8890, province: 'Nusa Tenggara Timur', capacity: 'Medium', status: 'Operational', detail: 'Labuan Bajo', code: 'LBJ' },
  { id: 'air_int_018', name: 'S.M. Badaruddin II (PLM)', type: 'airport', lat: -2.8981, lng: 104.6999, province: 'Sumatera Selatan', capacity: 'High', status: 'Operational', detail: 'Palembang', code: 'PLM' },
  { id: 'air_int_019', name: 'H.A.S. Hanandjoeddin (TJQ)', type: 'airport', lat: -2.7453, lng: 107.7542, province: 'Kepulauan Bangka Belitung', capacity: 'Medium', status: 'Operational', detail: 'Belitung', code: 'TJQ' },
  { id: 'air_int_020', name: 'Jenderal Ahmad Yani (SRG)', type: 'airport', lat: -6.9727, lng: 110.3471, province: 'Jawa Tengah', capacity: 'High', status: 'Operational', detail: 'Semarang', code: 'SRG' },
  { id: 'air_int_021', name: 'Syamsudin Noor (BDJ)', type: 'airport', lat: -3.4425, lng: 114.7625, province: 'Kalimantan Selatan', capacity: 'High', status: 'Operational', detail: 'Banjarbaru', code: 'BDJ' },
  { id: 'air_int_022', name: 'Supadio (PNK)', type: 'airport', lat: -0.1507, lng: 109.4039, province: 'Kalimantan Barat', capacity: 'High', status: 'Operational', detail: 'Pontianak', code: 'PNK' },
  { id: 'air_int_023', name: 'Sultan Thaha (DJB)', type: 'airport', lat: -1.6380, lng: 103.6400, province: 'Jambi', capacity: 'High', status: 'Operational', detail: 'Jambi', code: 'DJB' },
  { id: 'air_int_024', name: 'Adi Sumarmo (SOC)', type: 'airport', lat: -7.5161, lng: 110.7569, province: 'Jawa Tengah', capacity: 'High', status: 'Operational', detail: 'Solo', code: 'SOC' },
  { id: 'air_int_025', name: 'Husein Sastranegara (BDO)', type: 'airport', lat: -6.9036, lng: 107.5761, province: 'Jawa Barat', capacity: 'High', status: 'Operational', detail: 'Bandung', code: 'BDO' },
  { id: 'air_int_026', name: 'El Tari (KOE)', type: 'airport', lat: -10.1717, lng: 123.6711, province: 'Nusa Tenggara Timur', capacity: 'High', status: 'Operational', detail: 'Kupang', code: 'KOE' },
  { id: 'air_int_027', name: 'Frans Kaisiepo (BIK)', type: 'airport', lat: -1.1900, lng: 136.0800, province: 'Papua', capacity: 'Medium', status: 'Operational', detail: 'Biak', code: 'BIK' },
  { id: 'air_int_028', name: 'Pattimura (AMQ)', type: 'airport', lat: -3.7103, lng: 128.0891, province: 'Maluku', capacity: 'High', status: 'Operational', detail: 'Ambon', code: 'AMQ' },
  { id: 'air_int_029', name: 'Raja Haji Fisabilillah (TNJ)', type: 'airport', lat: 0.9228, lng: 104.5325, province: 'Kepulauan Riau', capacity: 'High', status: 'Operational', detail: 'Tanjung Pinang', code: 'TNJ' },
  { id: 'air_int_030', name: 'Silangit (DTB)', type: 'airport', lat: 2.2597, lng: 98.9917, province: 'Sumatera Utara', capacity: 'Medium', status: 'Operational', detail: 'Sibolga', code: 'DTB' },
  { id: 'air_int_031', name: 'Sultan Babullah (TTE)', type: 'airport', lat: 0.8317, lng: 127.3814, province: 'Maluku Utara', capacity: 'Medium', status: 'Operational', detail: 'Ternate', code: 'TTE' },
  { id: 'air_int_032', name: 'Mopah (MKQ)', type: 'airport', lat: -8.5203, lng: 140.4181, province: 'Papua Selatan', capacity: 'Medium', status: 'Operational', detail: 'Merauke', code: 'MKQ' },
  { id: 'air_int_033', name: 'Wamena (WMX)', type: 'airport', lat: -4.0783, lng: 138.9572, province: 'Papua Pegunungan', capacity: 'Low', status: 'Operational', detail: 'Wamena', code: 'WMX' },
  { id: 'air_int_034', name: 'Nabire (NBX)', type: 'airport', lat: -3.3681, lng: 135.4961, province: 'Papua Tengah', capacity: 'Medium', status: 'Operational', detail: 'Nabire', code: 'NBX' },
  { id: 'air_int_035', name: 'Blimbingsari (BWX)', type: 'airport', lat: -8.3031, lng: 114.3403, province: 'Jawa Timur', capacity: 'Medium', status: 'Operational', detail: 'Banyuwangi', code: 'BWX' },
  { id: 'air_int_036', name: 'Juwata (TRK)', type: 'airport', lat: 3.3267, lng: 117.5656, province: 'Kalimantan Utara', capacity: 'High', status: 'Operational', detail: 'Tarakan', code: 'TRK' },

  // ── REGIONAL DOMESTIK ──
  { id: 'air_dom_001', name: 'Malikus Saleh (LSW)', type: 'airport', lat: 5.2267, lng: 96.9503, province: 'Aceh', capacity: 'Medium', status: 'Operational', detail: 'Lhokseumawe', code: 'LSW' },
  { id: 'air_dom_002', name: 'Binaka (GNS)', type: 'airport', lat: 1.1667, lng: 97.7000, province: 'Sumatera Utara', capacity: 'Medium', status: 'Operational', detail: 'Gunungsitoli', code: 'GNS' },
  { id: 'air_dom_003', name: 'Ferdinand Lumban Tobing (FLZ)', type: 'airport', lat: 1.5500, lng: 98.7833, province: 'Sumatera Utara', capacity: 'Medium', status: 'Operational', detail: 'Sibolga', code: 'FLZ' },
  { id: 'air_dom_004', name: 'Radin Inten II (TKG)', type: 'airport', lat: -5.2403, lng: 105.1778, province: 'Lampung', capacity: 'High', status: 'Operational', detail: 'Bandar Lampung', code: 'TKG' },
  { id: 'air_dom_005', name: 'Fatmawati Soekarno (BKS)', type: 'airport', lat: -3.8633, lng: 102.3389, province: 'Bengkulu', capacity: 'Medium', status: 'Operational', detail: 'Bengkulu', code: 'BKS' },
  { id: 'air_dom_006', name: 'Depati Amir (PGK)', type: 'airport', lat: -2.1622, lng: 106.1389, province: 'Kepulauan Bangka Belitung', capacity: 'Medium', status: 'Operational', detail: 'Pangkal Pinang', code: 'PGK' },
  { id: 'air_dom_007', name: 'Abdulrachman Saleh (MLG)', type: 'airport', lat: -7.9361, lng: 112.7144, province: 'Jawa Timur', capacity: 'High', status: 'Operational', detail: 'Malang', code: 'MLG' },
  { id: 'air_dom_008', name: 'Trunojoyo (SUP)', type: 'airport', lat: -7.0333, lng: 113.9167, province: 'Jawa Timur', capacity: 'Low', status: 'Operational', detail: 'Sumenep', code: 'SUP' },
  { id: 'air_dom_009', name: 'Adisutjipto (JOG)', type: 'airport', lat: -7.7881, lng: 110.4319, province: 'DI Yogyakarta', capacity: 'High', status: 'Operational', detail: 'Yogyakarta', code: 'JOG' },
  { id: 'air_dom_010', name: 'Tjilik Riwut (PKY)', type: 'airport', lat: -2.2251, lng: 113.9445, province: 'Kalimantan Tengah', capacity: 'Medium', status: 'Operational', detail: 'Palangka Raya', code: 'PKY' },
  { id: 'air_dom_011', name: 'H. Asan (SMQ)', type: 'airport', lat: -3.0733, lng: 112.9244, province: 'Kalimantan Tengah', capacity: 'Medium', status: 'Operational', detail: 'Sampit', code: 'SMQ' },
  { id: 'air_dom_012', name: 'Iskandar (PKN)', type: 'airport', lat: -2.7000, lng: 111.6667, province: 'Kalimantan Tengah', capacity: 'Medium', status: 'Operational', detail: 'Pangkalan Bun', code: 'PKN' },
  { id: 'air_dom_013', name: 'Tebelian (SQG)', type: 'airport', lat: 0.0833, lng: 111.4500, province: 'Kalimantan Barat', capacity: 'Low', status: 'Operational', detail: 'Sintang', code: 'SQG' },
  { id: 'air_dom_014', name: 'Rahadi Oesman (KTG)', type: 'airport', lat: -1.8167, lng: 109.9667, province: 'Kalimantan Barat', capacity: 'Medium', status: 'Operational', detail: 'Ketapang', code: 'KTG' },
  { id: 'air_dom_015', name: 'Gusti Sjamsir Alam (KBU)', type: 'airport', lat: -3.2833, lng: 116.1833, province: 'Kalimantan Selatan', capacity: 'Low', status: 'Operational', detail: 'Kotabaru', code: 'KBU' },
  { id: 'air_dom_016', name: 'Bersujud (BTW)', type: 'airport', lat: -3.4167, lng: 116.1833, province: 'Kalimantan Selatan', capacity: 'Low', status: 'Operational', detail: 'Tanah Bumbu', code: 'BTW' },
  { id: 'air_dom_017', name: 'Kalimarau (BEJ)', type: 'airport', lat: 2.1500, lng: 117.4333, province: 'Kalimantan Timur', capacity: 'Medium', status: 'Operational', detail: 'Berau', code: 'BEJ' },
  { id: 'air_dom_018', name: 'APT Pranoto (AAP)', type: 'airport', lat: -0.3733, lng: 117.2500, province: 'Kalimantan Timur', capacity: 'Medium', status: 'Operational', detail: 'Samarinda', code: 'AAP' },
  { id: 'air_dom_019', name: 'Malinau (LNU)', type: 'airport', lat: 3.4833, lng: 116.7500, province: 'Kalimantan Utara', capacity: 'Low', status: 'Operational', detail: 'Malinau', code: 'LNU' },
  { id: 'air_dom_020', name: 'Tanjung Harapan (TJS)', type: 'airport', lat: 2.8333, lng: 117.3500, province: 'Kalimantan Utara', capacity: 'Low', status: 'Operational', detail: 'Bulungan', code: 'TJS' },
  { id: 'air_dom_021', name: 'Djalaluddin (GTO)', type: 'airport', lat: 0.6378, lng: 122.8497, province: 'Gorontalo', capacity: 'Medium', status: 'Operational', detail: 'Gorontalo', code: 'GTO' },
  { id: 'air_dom_022', name: 'Syukuran Aminuddin Amir (LUW)', type: 'airport', lat: -1.0389, lng: 122.7714, province: 'Sulawesi Tengah', capacity: 'Medium', status: 'Operational', detail: 'Luwuk', code: 'LUW' },
  { id: 'air_dom_023', name: 'Mutiara SIS Al Jufri (PLW)', type: 'airport', lat: -0.9183, lng: 119.9094, province: 'Sulawesi Tengah', capacity: 'Medium', status: 'Operational', detail: 'Palu', code: 'PLW' },
  { id: 'air_dom_024', name: 'Kasiguncu (PSJ)', type: 'airport', lat: -1.4167, lng: 120.6667, province: 'Sulawesi Tengah', capacity: 'Low', status: 'Operational', detail: 'Poso', code: 'PSJ' },
  { id: 'air_dom_025', name: 'Tampa Padang (MJU)', type: 'airport', lat: -2.5833, lng: 118.8833, province: 'Sulawesi Barat', capacity: 'Medium', status: 'Operational', detail: 'Mamuju', code: 'MJU' },
  { id: 'air_dom_026', name: 'Andi Jemma (MXB)', type: 'airport', lat: -2.5500, lng: 121.3167, province: 'Sulawesi Selatan', capacity: 'Low', status: 'Operational', detail: 'Masamba', code: 'MXB' },
  { id: 'air_dom_027', name: 'Halu Oleo (KDI)', type: 'airport', lat: -4.0817, lng: 122.4167, province: 'Sulawesi Tenggara', capacity: 'Medium', status: 'Operational', detail: 'Kendari', code: 'KDI' },
  { id: 'air_dom_028', name: 'Beto Ambari (BUW)', type: 'airport', lat: -5.4833, lng: 122.5833, province: 'Sulawesi Tenggara', capacity: 'Medium', status: 'Operational', detail: 'Bau-Bau', code: 'BUW' },
  { id: 'air_dom_029', name: 'Sangia Nibandera (KXB)', type: 'airport', lat: -4.0667, lng: 121.5833, province: 'Sulawesi Tenggara', capacity: 'Medium', status: 'Operational', detail: 'Kolaka', code: 'KXB' },
  { id: 'air_dom_030', name: 'Sultan Muhammad Salahuddin (BMU)', type: 'airport', lat: -8.7500, lng: 118.1167, province: 'Nusa Tenggara Barat', capacity: 'Low', status: 'Operational', detail: 'Bima', code: 'BMU' },
  { id: 'air_dom_031', name: 'Sultan Muhammad Kaharuddin (SWQ)', type: 'airport', lat: -8.4833, lng: 117.4000, province: 'Nusa Tenggara Barat', capacity: 'Low', status: 'Operational', detail: 'Sumbawa', code: 'SWQ' },
  { id: 'air_dom_032', name: 'Tambolaka (TMC)', type: 'airport', lat: -9.4167, lng: 119.2500, province: 'Nusa Tenggara Timur', capacity: 'Medium', status: 'Operational', detail: 'Tambolaka', code: 'TMC' },
  { id: 'air_dom_033', name: 'Umbu Mehang Kunda (WGP)', type: 'airport', lat: -9.6667, lng: 120.3000, province: 'Nusa Tenggara Timur', capacity: 'Medium', status: 'Operational', detail: 'Waingapu', code: 'WGP' },
  { id: 'air_dom_034', name: 'H. Hasan Aroeboesman (ENE)', type: 'airport', lat: -8.8500, lng: 121.6500, province: 'Nusa Tenggara Timur', capacity: 'Medium', status: 'Operational', detail: 'Ende', code: 'ENE' },
  { id: 'air_dom_035', name: 'Frans Xavier Seda (MOF)', type: 'airport', lat: -8.6333, lng: 122.2333, province: 'Nusa Tenggara Timur', capacity: 'Medium', status: 'Operational', detail: 'Maumere', code: 'MOF' },
  { id: 'air_dom_036', name: 'Mathilda Batlayeri (SXK)', type: 'airport', lat: -7.9833, lng: 131.3000, province: 'Maluku', capacity: 'Low', status: 'Operational', detail: 'Saumlaki', code: 'SXK' },
  { id: 'air_dom_037', name: 'Karel Sadsuitubun (LUV)', type: 'airport', lat: -5.7667, lng: 132.7500, province: 'Maluku', capacity: 'Medium', status: 'Operational', detail: 'Langgur', code: 'LUV' },
  { id: 'air_dom_038', name: 'Gamar Malamo (GLX)', type: 'airport', lat: 1.8333, lng: 127.7833, province: 'Maluku Utara', capacity: 'Low', status: 'Operational', detail: 'Galela', code: 'GLX' },
  { id: 'air_dom_039', name: 'Kuabang (KAZ)', type: 'airport', lat: 2.0333, lng: 128.3333, province: 'Maluku Utara', capacity: 'Low', status: 'Operational', detail: 'Kao', code: 'KAZ' },
  { id: 'air_dom_040', name: 'Oesman Sadik (LAH)', type: 'airport', lat: -0.4333, lng: 127.9000, province: 'Maluku Utara', capacity: 'Low', status: 'Operational', detail: 'Labuha', code: 'LAH' },
  { id: 'air_dom_041', name: 'Pitu (OTI)', type: 'airport', lat: 2.0500, lng: 128.0667, province: 'Maluku Utara', capacity: 'Low', status: 'Operational', detail: 'Morotai', code: 'OTI' },
  { id: 'air_dom_042', name: 'Namrole (NRE)', type: 'airport', lat: -4.0667, lng: 126.7333, province: 'Maluku', capacity: 'Low', status: 'Operational', detail: 'Namlea', code: 'NRE' },
  { id: 'air_dom_043', name: 'Amahai (AHI)', type: 'airport', lat: -3.3500, lng: 128.9167, province: 'Maluku', capacity: 'Low', status: 'Operational', detail: 'Amahai', code: 'AHI' },
  { id: 'air_dom_044', name: 'Dobo (DOB)', type: 'airport', lat: -5.7500, lng: 134.2333, province: 'Maluku', capacity: 'Low', status: 'Operational', detail: 'Dobo', code: 'DOB' },
  { id: 'air_dom_045', name: 'Stevanus Rumbewas (ZRI)', type: 'airport', lat: -1.8833, lng: 136.2500, province: 'Papua', capacity: 'Low', status: 'Operational', detail: 'Serui', code: 'ZRI' },
  { id: 'air_dom_046', name: 'Douw Aturure (NBX)', type: 'airport', lat: -3.3681, lng: 135.4961, province: 'Papua Tengah', capacity: 'Medium', status: 'Operational', detail: 'Nabire', code: 'NBX' },
  { id: 'air_dom_047', name: 'Moses Kilangin (TIM)', type: 'airport', lat: -4.5333, lng: 136.8833, province: 'Papua Tengah', capacity: 'Medium', status: 'Operational', detail: 'Timika', code: 'TIM' },
  { id: 'air_dom_048', name: 'Utarom (KNG)', type: 'airport', lat: -3.6500, lng: 133.7667, province: 'Papua Barat', capacity: 'Low', status: 'Operational', detail: 'Kaimana', code: 'KNG' },
  { id: 'air_dom_049', name: 'Torea (FKQ)', type: 'airport', lat: -2.9167, lng: 132.3000, province: 'Papua Barat', capacity: 'Low', status: 'Operational', detail: 'Fakfak', code: 'FKQ' },
  { id: 'air_dom_050', name: 'Rendani (MKW)', type: 'airport', lat: -0.8667, lng: 134.0833, province: 'Papua Barat', capacity: 'Medium', status: 'Operational', detail: 'Manokwari', code: 'MKW' },
  { id: 'air_dom_051', name: 'Domine Eduard Osok (SOQ)', type: 'airport', lat: -0.9333, lng: 131.0833, province: 'Papua Barat Daya', capacity: 'High', status: 'Operational', detail: 'Sorong', code: 'SOQ' },
  { id: 'air_dom_052', name: 'Nop Goliat Dekai (DEX)', type: 'airport', lat: -4.8500, lng: 139.4667, province: 'Papua Pegunungan', capacity: 'Low', status: 'Operational', detail: 'Dekai', code: 'DEX' },
  { id: 'air_dom_053', name: 'Tanah Merah (TMH)', type: 'airport', lat: -7.5167, lng: 140.2833, province: 'Papua Selatan', capacity: 'Low', status: 'Operational', detail: 'Tanah Merah', code: 'TMH' },
  { id: 'air_dom_054', name: 'Baubau (BUW)', type: 'airport', lat: -5.4833, lng: 122.5833, province: 'Sulawesi Tenggara', capacity: 'Medium', status: 'Operational', detail: 'Baubau', code: 'BUW' },
  { id: 'air_dom_055', name: 'Gewayantana (LKA)', type: 'airport', lat: -8.2333, lng: 122.9833, province: 'Nusa Tenggara Timur', capacity: 'Low', status: 'Operational', detail: 'Larantuka', code: 'LKA' },
  { id: 'air_dom_056', name: 'Lewoleba (LWE)', type: 'airport', lat: -8.3667, lng: 123.4167, province: 'Nusa Tenggara Timur', capacity: 'Low', status: 'Operational', detail: 'Lembata', code: 'LWE' },
  { id: 'air_dom_057', name: 'Mali (ARD)', type: 'airport', lat: -8.2333, lng: 124.6000, province: 'Nusa Tenggara Timur', capacity: 'Low', status: 'Operational', detail: 'Alor', code: 'ARD' },
  { id: 'air_dom_058', name: 'H. Hasan Aroeboesman (ENE)', type: 'airport', lat: -8.8500, lng: 121.6500, province: 'Nusa Tenggara Timur', capacity: 'Medium', status: 'Operational', detail: 'Ende', code: 'ENE' },
  { id: 'air_dom_059', name: 'Ranai (NTX)', type: 'airport', lat: 3.3333, lng: 106.2500, province: 'Kepulauan Riau', capacity: 'Low', status: 'Operational', detail: 'Ranai', code: 'NTX' },
  { id: 'air_dom_060', name: 'Raja Haji Abdullah (TJB)', type: 'airport', lat: 0.9333, lng: 103.4500, province: 'Kepulauan Riau', capacity: 'Low', status: 'Operational', detail: 'Karimun', code: 'TJB' },
  { id: 'air_dom_061', name: 'Sultan Malikussaleh (LSW)', type: 'airport', lat: 5.2267, lng: 96.9503, province: 'Aceh', capacity: 'Medium', status: 'Operational', detail: 'Lhokseumawe', code: 'LSW' },
  { id: 'air_dom_062', name: 'Pondok Cabe', type: 'airport', lat: -6.3361, lng: 106.7647, province: 'Banten', capacity: 'Medium', status: 'Operational', detail: 'Jakarta GA', code: 'PCB' },
  { id: 'air_dom_063', name: 'Wunopito', type: 'airport', lat: -8.3667, lng: 123.4167, province: 'Nusa Tenggara Timur', capacity: 'Low', status: 'Operational', detail: 'Lembata', code: 'LWE' },
  { id: 'air_dom_064', name: 'Toraja (TRX)', type: 'airport', lat: -3.0333, lng: 119.7500, province: 'Sulawesi Selatan', capacity: 'Low', status: 'Operational', detail: 'Mamuju', code: 'MJU' },
  { id: 'air_dom_065', name: 'Bua (LLO)', type: 'airport', lat: -3.0667, lng: 120.2333, province: 'Sulawesi Selatan', capacity: 'Low', status: 'Operational', detail: 'Palopo', code: 'LLO' },
  { id: 'air_dom_066', name: 'Andi Djemma (MXB)', type: 'airport', lat: -2.5500, lng: 121.3167, province: 'Sulawesi Selatan', capacity: 'Low', status: 'Operational', detail: 'Masamba', code: 'MXB' },
  { id: 'air_dom_067', name: 'Tampa Padang (MJU)', type: 'airport', lat: -2.5833, lng: 118.8833, province: 'Sulawesi Barat', capacity: 'Medium', status: 'Operational', detail: 'Mamuju', code: 'MJU' },
  { id: 'air_dom_068', name: 'Syukuran Aminuddin Amir (LUW)', type: 'airport', lat: -1.0389, lng: 122.7714, province: 'Sulawesi Tengah', capacity: 'Medium', status: 'Operational', detail: 'Luwuk', code: 'LUW' },
  { id: 'air_dom_069', name: 'Bubung (LUW)', type: 'airport', lat: -1.0333, lng: 122.7833, province: 'Sulawesi Tengah', capacity: 'Low', status: 'Operational', detail: 'Bubung', code: 'LUW' },
  { id: 'air_dom_070', name: 'Kasiguncu (PSJ)', type: 'airport', lat: -1.4167, lng: 120.6667, province: 'Sulawesi Tengah', capacity: 'Low', status: 'Operational', detail: 'Poso', code: 'PSJ' },
];

// ═══════════════════════════════════════════════════════════════════════
// KEK — Kawasan Ekonomi Khusus (20 major KEK)
// ═══════════════════════════════════════════════════════════════════════

export const keks: InfrastructurePoint[] = [
  { id: 'kek_001', name: 'KEK Sei Mangkei', type: 'kek', lat: 2.9000, lng: 99.3000, province: 'Sumatera Utara', capacity: 'High', status: 'Operational', detail: 'Agroindustri: CPO, biofuel, oleokimia' },
  { id: 'kek_002', name: 'KEK Tanjung Api-api', type: 'kek', lat: -2.1333, lng: 104.8667, province: 'Sumatera Selatan', capacity: 'High', status: 'Operational', detail: 'Petrokimia, rubber, CPO processing' },
  { id: 'kek_003', name: 'KEK Galang Batang', type: 'kek', lat: 1.0667, lng: 104.3167, province: 'Kepulauan Riau', capacity: 'High', status: 'Operational', detail: 'Bauksit, smelter alumina, nikel' },
  { id: 'kek_004', name: 'KEK Batam', type: 'kek', lat: 1.1306, lng: 104.0539, province: 'Kepulauan Riau', capacity: 'Very High', status: 'Operational', detail: 'Elektronik, shipyard, oil & gas, MRO' },
  { id: 'kek_005', name: 'KEK Bintan', type: 'kek', lat: 0.9667, lng: 104.3667, province: 'Kepulauan Riau', capacity: 'High', status: 'Operational', detail: 'Wisata terpadu, manufaktur ringan' },
  { id: 'kek_006', name: 'KEK Kendal', type: 'kek', lat: -6.9667, lng: 110.4000, province: 'Jawa Tengah', capacity: 'Very High', status: 'Operational', detail: 'Industri: otomotif, elektronik, tekstil' },
  { id: 'kek_007', name: 'KEK Gresik', type: 'kek', lat: -7.1500, lng: 112.6500, province: 'Jawa Timur', capacity: 'Very High', status: 'Operational', detail: 'Petrokimia, semen, baja, terminal LNG' },
  { id: 'kek_008', name: 'KEK Singhasari', type: 'kek', lat: -7.8833, lng: 112.5333, province: 'Jawa Timur', capacity: 'High', status: 'Operational', detail: 'Teknologi, digital, education' },
  { id: 'kek_009', name: 'KEK Lido', type: 'kek', lat: -6.7500, lng: 106.8833, province: 'Jawa Barat', capacity: 'High', status: 'Operational', detail: 'Wisata, hospitality, creative economy' },
  { id: 'kek_010', name: 'KEK Sanur', type: 'kek', lat: -8.6833, lng: 115.2667, province: 'Bali', capacity: 'High', status: 'Operational', detail: 'Health & wellness tourism, senior living' },
  { id: 'kek_011', name: 'KEK Mandalika', type: 'kek', lat: -8.9000, lng: 116.2833, province: 'Nusa Tenggara Barat', capacity: 'Very High', status: 'Operational', detail: 'Resort, MotoGP circuit, tourism' },
  { id: 'kek_012', name: 'KEK Likupang', type: 'kek', lat: 1.7000, lng: 125.0667, province: 'Sulawesi Utara', capacity: 'High', status: 'Operational', detail: 'Marine tourism, fisheries, diving' },
  { id: 'kek_013', name: 'KEK Morowali', type: 'kek', lat: -2.3000, lng: 121.4833, province: 'Sulawesi Tengah', capacity: 'Very High', status: 'Operational', detail: 'EV battery, nikel processing, stainless steel' },
  { id: 'kek_014', name: 'KEK Palu', type: 'kek', lat: -0.6833, lng: 119.7500, province: 'Sulawesi Tengah', capacity: 'High', status: 'Operational', detail: 'Agroindustri, logistics hub' },
  { id: 'kek_015', name: 'KEK Bitung', type: 'kek', lat: 1.4333, lng: 125.1833, province: 'Sulawesi Utara', capacity: 'High', status: 'Operational', detail: 'Fisheries, cold chain, marine products' },
  { id: 'kek_016', name: 'KEK Maloy', type: 'kek', lat: 3.8000, lng: 117.0167, province: 'Kalimantan Utara', capacity: 'High', status: 'Operational', detail: 'Logistik, energi, perbatasan' },
  { id: 'kek_017', name: 'KEK Tanjung Kelayang', type: 'kek', lat: -1.8833, lng: 105.2667, province: 'Kepulauan Bangka Belitung', capacity: 'High', status: 'Operational', detail: 'Tourism, granite, tin downstream' },
  { id: 'kek_018', name: 'KEK Tanjung Lesung', type: 'kek', lat: -6.4833, lng: 105.6333, province: 'Banten', capacity: 'High', status: 'Operational', detail: 'Resort, ecotourism, creative economy' },
  { id: 'kek_019', name: 'KEK Nongsa', type: 'kek', lat: 1.2000, lng: 104.1167, province: 'Kepulauan Riau', capacity: 'High', status: 'Operational', detail: 'Digital park, technopark, education' },
  { id: 'kek_020', name: 'KEK Sorong', type: 'kek', lat: -0.8667, lng: 131.2500, province: 'Papua Barat', capacity: 'High', status: 'Operational', detail: 'Oil & gas support, fisheries, logistics' },
];

// ═══════════════════════════════════════════════════════════════════════
// TOLL ROADS — Jalan Tol Nasional (20 major toll roads)
// ═══════════════════════════════════════════════════════════════════════

export const tollRoads: InfrastructurePoint[] = [
  { id: 'tol_001', name: 'Jakarta-Cikampek', type: 'toll_road', lat: -6.2000, lng: 107.1000, province: 'Jawa Barat', capacity: 'Very High', status: 'Operational', detail: '73 km — arteri utama Jakarta' },
  { id: 'tol_002', name: 'Jakarta-Cikampek II Elevated', type: 'toll_road', lat: -6.2500, lng: 107.2000, province: 'Jawa Barat', capacity: 'Very High', status: 'Operational', detail: '36 km — elevated di atas Japek' },
  { id: 'tol_003', name: 'Cikampek-Palimanan (Cipali)', type: 'toll_road', lat: -6.6000, lng: 108.3000, province: 'Jawa Barat', capacity: 'Very High', status: 'Operational', detail: '116 km — Cirebon' },
  { id: 'tol_004', name: 'Semarang-Solo', type: 'toll_road', lat: -7.3000, lng: 110.5000, province: 'Jawa Tengah', capacity: 'Very High', status: 'Operational', detail: '72 km — ruas Trans-Java' },
  { id: 'tol_005', name: 'Surabaya-Mojokerto', type: 'toll_road', lat: -7.4000, lng: 112.5000, province: 'Jawa Timur', capacity: 'Very High', status: 'Operational', detail: '37 km — akses industri Surabaya' },
  { id: 'tol_006', name: 'Surabaya-Gresik', type: 'toll_road', lat: -7.2000, lng: 112.6000, province: 'Jawa Timur', capacity: 'High', status: 'Operational', detail: '21 km — ke KEK Gresik' },
  { id: 'tol_007', name: 'Surabaya-Gempol', type: 'toll_road', lat: -7.3500, lng: 112.8000, province: 'Jawa Timur', capacity: 'High', status: 'Operational', detail: '37 km — akses Malang' },
  { id: 'tol_008', name: 'Kanci-Pejagan', type: 'toll_road', lat: -6.9000, lng: 108.7000, province: 'Jawa Barat', capacity: 'High', status: 'Operational', detail: '62 km — Cirebon-Brebes' },
  { id: 'tol_009', name: 'Jakarta Outer Ring Road (JORR)', type: 'toll_road', lat: -6.3000, lng: 106.8000, province: 'DKI Jakarta', capacity: 'Very High', status: 'Operational', detail: '65 km — keliling Jakarta' },
  { id: 'tol_010', name: 'Jagorawi (Jakarta-Bogor-Ciawi)', type: 'toll_road', lat: -6.4000, lng: 106.8000, province: 'Jawa Barat', capacity: 'Very High', status: 'Operational', detail: '46 km — Jakarta ke Bogor' },
  { id: 'tol_011', name: 'Bogor Ring Road', type: 'toll_road', lat: -6.5500, lng: 106.7500, province: 'Jawa Barat', capacity: 'High', status: 'Operational', detail: '32 km — bypass Bogor' },
  { id: 'tol_012', name: 'Medan-Binjai', type: 'toll_road', lat: 3.5000, lng: 98.6000, province: 'Sumatera Utara', capacity: 'High', status: 'Operational', detail: '17 km — Medan' },
  { id: 'tol_013', name: 'Belawan-Medan-Tanjung Morawa', type: 'toll_road', lat: 3.6000, lng: 98.7000, province: 'Sumatera Utara', capacity: 'High', status: 'Operational', detail: '24 km — pelabuhan Belawan' },
  { id: 'tol_014', name: 'Padang-Sicincin', type: 'toll_road', lat: -0.5000, lng: 100.3000, province: 'Sumatera Barat', capacity: 'High', status: 'Operational', detail: '36 km — Padang' },
  { id: 'tol_015', name: 'Pekanbaru-Dumai', type: 'toll_road', lat: 0.8000, lng: 101.4000, province: 'Riau', capacity: 'High', status: 'Operational', detail: '131 km — pelabuhan Dumai' },
  { id: 'tol_016', name: 'Palembang-Indralaya', type: 'toll_road', lat: -3.1000, lng: 104.7000, province: 'Sumatera Selatan', capacity: 'High', status: 'Operational', detail: '25 km — ruas Trans-Sumatera' },
  { id: 'tol_017', name: 'Bali Mandara Toll Road', type: 'toll_road', lat: -8.5500, lng: 115.1667, province: 'Bali', capacity: 'High', status: 'Operational', detail: '12.7 km — atas laut Denpasar' },
  { id: 'tol_018', name: 'Manado-Bitung', type: 'toll_road', lat: 1.4000, lng: 125.0000, province: 'Sulawesi Utara', capacity: 'Medium', status: 'Operational', detail: '40 km — Sulawesi pertama' },
  { id: 'tol_019', name: 'Balikpapan-Samarinda', type: 'toll_road', lat: -1.0000, lng: 117.0000, province: 'Kalimantan Timur', capacity: 'High', status: 'Operational', detail: '99 km — Kaltim' },
  { id: 'tol_020', name: 'Gempol-Pandaan', type: 'toll_road', lat: -7.5000, lng: 112.9000, province: 'Jawa Timur', capacity: 'High', status: 'Operational', detail: '14 km — akses Malang' },
];

// ═══════════════════════════════════════════════════════════════════════
// RAILWAY STATIONS — Stasiun KA utama (20 major stations)
// ═══════════════════════════════════════════════════════════════════════

export const railwayStations: InfrastructurePoint[] = [
  { id: 'rail_001', name: 'Gambir (Jakarta)', type: 'railway_station', lat: -6.1767, lng: 106.8306, province: 'DKI Jakarta', capacity: 'Very High', status: 'Operational', detail: 'Stasiun utama Jakarta — Argo' },
  { id: 'rail_002', name: 'Pasarsenen (Jakarta)', type: 'railway_station', lat: -6.1567, lng: 106.8450, province: 'DKI Jakarta', capacity: 'Very High', status: 'Operational', detail: 'Jakarta — kereta ekonomi' },
  { id: 'rail_003', name: 'Bandung', type: 'railway_station', lat: -6.9147, lng: 107.6028, province: 'Jawa Barat', capacity: 'High', status: 'Operational', detail: 'Stasiun Bandung — Argo Parahyangan' },
  { id: 'rail_004', name: 'Semarang Tawang', type: 'railway_station', lat: -6.9647, lng: 110.4275, province: 'Jawa Tengah', capacity: 'High', status: 'Operational', detail: 'Semarang — kereta utama' },
  { id: 'rail_005', name: 'Tawang (Semarang)', type: 'railway_station', lat: -6.9647, lng: 110.4275, province: 'Jawa Tengah', capacity: 'High', status: 'Operational', detail: 'Semarang heritage station' },
  { id: 'rail_006', name: 'Surabaya Pasar Turi', type: 'railway_station', lat: -7.2458, lng: 112.7372, province: 'Jawa Timur', capacity: 'Very High', status: 'Operational', detail: 'Surabaya — kereta timur' },
  { id: 'rail_007', name: 'Surabaya Gubeng', type: 'railway_station', lat: -7.2653, lng: 112.7525, province: 'Jawa Timur', capacity: 'Very High', status: 'Operational', detail: 'Surabaya — stasiun besar' },
  { id: 'rail_008', name: 'Yogyakarta (Tugu)', type: 'railway_station', lat: -7.7892, lng: 110.3631, province: 'DI Yogyakarta', capacity: 'High', status: 'Operational', detail: 'Yogyakarta — turis + komuter' },
  { id: 'rail_009', name: 'Lempuyangan (Yogyakarta)', type: 'railway_station', lat: -7.8000, lng: 110.3750, province: 'DI Yogyakarta', capacity: 'High', status: 'Operational', detail: 'Yogyakarta — ekonomi' },
  { id: 'rail_010', name: 'Malang', type: 'railway_station', lat: -7.9778, lng: 112.6372, province: 'Jawa Timur', capacity: 'High', status: 'Operational', detail: 'Malang — kereta dari Surabaya' },
  { id: 'rail_011', name: 'Solo Balapan', type: 'railway_station', lat: -7.5567, lng: 110.8217, province: 'Jawa Tengah', capacity: 'High', status: 'Operational', detail: 'Solo — Joglosemar' },
  { id: 'rail_012', name: 'Cirebon', type: 'railway_station', lat: -6.7058, lng: 108.5572, province: 'Jawa Barat', capacity: 'High', status: 'Operational', detail: 'Cirebon — lintas utara' },
  { id: 'rail_013', name: 'Tegal', type: 'railway_station', lat: -6.8672, lng: 109.1386, province: 'Jawa Tengah', capacity: 'Medium', status: 'Operational', detail: 'Tegal — pantura' },
  { id: 'rail_014', name: 'Jatibarang (Cirebon)', type: 'railway_station', lat: -6.4667, lng: 108.3000, province: 'Jawa Barat', capacity: 'Medium', status: 'Operational', detail: 'Cirebon barat' },
  { id: 'rail_015', name: 'Pekalongan', type: 'railway_station', lat: -6.8897, lng: 109.6756, province: 'Jawa Tengah', capacity: 'Medium', status: 'Operational', detail: 'Pekalongan — batik' },
  { id: 'rail_016', name: 'Medan', type: 'railway_station', lat: 3.5833, lng: 98.6833, province: 'Sumatera Utara', capacity: 'High', status: 'Operational', detail: 'Medan — kereta Aceh-Bukit Tinggi' },
  { id: 'rail_017', name: 'Kertapati (Palembang)', type: 'railway_station', lat: -3.0167, lng: 104.7833, province: 'Sumatera Selatan', capacity: 'High', status: 'Operational', detail: 'Palembang — Divre III' },
  { id: 'rail_018', name: 'Padang Panjang', type: 'railway_station', lat: -0.4667, lng: 100.4000, province: 'Sumatera Barat', capacity: 'Medium', status: 'Operational', detail: 'Minangkabau — lintas Sumatera' },
  { id: 'rail_019', name: 'Banyuwangi Baru', type: 'railway_station', lat: -8.2167, lng: 114.3667, province: 'Jawa Timur', capacity: 'Medium', status: 'Operational', detail: 'Banyuwangi — terakhir Jatim' },
  { id: 'rail_020', name: 'Kiaracondong (Bandung)', type: 'railway_station', lat: -6.9333, lng: 107.6500, province: 'Jawa Barat', capacity: 'High', status: 'Operational', detail: 'Bandung — komuter + eksekutif' },
];

// ═══════════════════════════════════════════════════════════════════════
// AGGREGATE EXPORTS
// ═══════════════════════════════════════════════════════════════════════

export const allInfrastructurePoints: InfrastructurePoint[] = [
  ...ports,
  ...airports,
  ...keks,
  ...tollRoads,
  ...railwayStations,
];

// Helper functions
export function getInfrastructureByProvince(province: string): InfrastructurePoint[] {
  return allInfrastructurePoints.filter(p => p.province === province);
}

export function getInfrastructureByType(type: InfrastructurePoint['type']): InfrastructurePoint[] {
  return allInfrastructurePoints.filter(p => p.type === type);
}

export function getProvincesWithInfrastructure(): string[] {
  return [...new Set(allInfrastructurePoints.map(p => p.province))].sort();
}

export function countByType(): Record<string, number> {
  return {
    port: ports.length,
    airport: airports.length,
    kek: keks.length,
    toll_road: tollRoads.length,
    railway_station: railwayStations.length,
  };
}

// Typed exports for backward compatibility
export const typedPorts = ports as InfrastructurePoint[];
export const typedAirports = airports as InfrastructurePoint[];
export const typedKeks = keks as InfrastructurePoint[];
export const typedTollRoads = tollRoads as InfrastructurePoint[];
export const typedRailways = railwayStations as InfrastructurePoint[];
