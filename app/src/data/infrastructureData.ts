/**
 * INFRASTRUCTURE DATA — Indonesia National Infrastructure Database
 * Compiled from open data sources:
 *   - Pelindo: pelabuhan.co.id (30 ports)
 *   - Angkasa Pura: angkasapura2.co.id (22 airports)
 *   - Dewan KEK: kek.go.id (20 KEK)
 *   - PUPR: data.pu.go.id (20 toll roads)
 * Sources date: 2024-2025
 */

import type { Port, Airport } from '@/types';

export interface InfrastructurePoint {
  id: string;
  name: string;
  type: 'port' | 'airport' | 'toll_road' | 'kek';
  lat: number;
  lng: number;
  province: string;
  capacity: string;
  status: string;
  detail: string;
}

export const ports: InfrastructurePoint[] = [
  { id: 'port_001', name: 'Tanjung Priok', type: 'port', lat: -6.1008, lng: 106.8828, province: 'DKI Jakarta', capacity: 'Very High', status: 'Operational', detail: 'Pelabuhan terbesar Indonesia, kontainer' },
  { id: 'port_002', name: 'Tanjung Perak', type: 'port', lat: -7.1962, lng: 112.7314, province: 'Jawa Timur', capacity: 'Very High', status: 'Operational', detail: 'Gateway utama Jatim' },
  { id: 'port_003', name: 'Belawan', type: 'port', lat: 3.7836, lng: 98.6950, province: 'Sumatera Utara', capacity: 'High', status: 'Operational', detail: 'Pelabuhan internasional Sumut' },
  { id: 'port_004', name: 'Makassar', type: 'port', lat: -5.1164, lng: 119.4086, province: 'Sulawesi Selatan', capacity: 'High', status: 'Operational', detail: 'Pelabuhan utama Sulsel' },
  { id: 'port_005', name: 'Bitung', type: 'port', lat: 1.4404, lng: 125.1847, province: 'Sulawesi Utara', capacity: 'Medium', status: 'Operational', detail: 'Pelabuhan perikanan & logistik' },
  { id: 'port_006', name: 'Sorong', type: 'port', lat: -0.8766, lng: 131.2555, province: 'Papua Barat', capacity: 'Medium', status: 'Operational', detail: 'Gateway Papua Barat' },
  { id: 'port_007', name: 'Banjarmasin', type: 'port', lat: -3.3203, lng: 114.5822, province: 'Kalimantan Selatan', capacity: 'High', status: 'Operational', detail: 'Pelabuhan utama Kalsel' },
  { id: 'port_008', name: 'Pontianak', type: 'port', lat: -0.0202, lng: 109.3416, province: 'Kalimantan Barat', capacity: 'Medium', status: 'Operational', detail: 'Akses ke Malaysia' },
  { id: 'port_009', name: 'Palembang', type: 'port', lat: -2.9881, lng: 104.7565, province: 'Sumatera Selatan', capacity: 'Medium', status: 'Operational', detail: 'Sungai Musi' },
  { id: 'port_010', name: 'Padang', type: 'port', lat: -0.9907, lng: 100.3740, province: 'Sumatera Barat', capacity: 'Medium', status: 'Operational', detail: 'Pelabuhan utama Sumbar' },
  { id: 'port_011', name: 'Ambon', type: 'port', lat: -3.6953, lng: 128.1814, province: 'Maluku', capacity: 'Medium', status: 'Operational', detail: 'Gateway Maluku' },
  { id: 'port_012', name: 'Jayapura', type: 'port', lat: -2.5916, lng: 140.6684, province: 'Papua', capacity: 'Medium', status: 'Operational', detail: 'Pelabuhan utama Papua' },
  { id: 'port_013', name: 'Batu Ampar', type: 'port', lat: 1.1884, lng: 104.1134, province: 'Kepulauan Riau', capacity: 'High', status: 'Operational', detail: 'Free Trade Zone' },
  { id: 'port_014', name: 'Semarang', type: 'port', lat: -6.9497, lng: 110.4278, province: 'Jawa Tengah', capacity: 'High', status: 'Operational', detail: 'Pelabuhan utama Jateng' },
  { id: 'port_015', name: 'Gresik', type: 'port', lat: -7.1500, lng: 112.6500, province: 'Jawa Timur', capacity: 'High', status: 'Operational', detail: 'Petrokimia & industri' },
  { id: 'port_016', name: 'Balikpapan', type: 'port', lat: -1.2654, lng: 116.8311, province: 'Kalimantan Timur', capacity: 'High', status: 'Operational', detail: 'Pelabuhan minyak' },
  { id: 'port_017', name: 'Kupang', type: 'port', lat: -10.1628, lng: 123.5780, province: 'NTT', capacity: 'Medium', status: 'Operational', detail: 'Pelabuhan utama NTT' },
  { id: 'port_018', name: 'Buleleng', type: 'port', lat: -8.1152, lng: 115.0880, province: 'Bali', capacity: 'Medium', status: 'Operational', detail: 'Pelabuhan Bali' },
  { id: 'port_019', name: 'Tarakan', type: 'port', lat: 3.3133, lng: 117.5915, province: 'Kalimantan Utara', capacity: 'Medium', status: 'Operational', detail: 'Gateway Kaltara' },
  { id: 'port_020', name: 'Merak', type: 'port', lat: -5.9333, lng: 106.0000, province: 'Banten', capacity: 'High', status: 'Operational', detail: 'Penyeberangan ke Sumatera' },
  { id: 'port_021', name: 'Lhokseumawe', type: 'port', lat: 5.1801, lng: 97.0524, province: 'Aceh', capacity: 'Medium', status: 'Operational', detail: 'Pelabuhan LNG & umum' },
  { id: 'port_022', name: 'Kendari', type: 'port', lat: -3.9720, lng: 122.5149, province: 'Sulawesi Tenggara', capacity: 'Medium', status: 'Operational', detail: 'Pelabuhan utama Sultra' },
  { id: 'port_023', name: 'Probolinggo', type: 'port', lat: -7.7211, lng: 113.2164, province: 'Jawa Timur', capacity: 'Medium', status: 'Operational', detail: 'Tujuan pelayaran' },
  { id: 'port_024', name: 'Panjang', type: 'port', lat: -5.4765, lng: 105.3210, province: 'Lampung', capacity: 'Medium', status: 'Operational', detail: 'Penyeberangan Merak-Bakau' },
  { id: 'port_025', name: 'Jambi', type: 'port', lat: -1.6101, lng: 103.6131, province: 'Jambi', capacity: 'Low', status: 'Operational', detail: 'Sungai Batanghari' },
  { id: 'port_026', name: 'Palu', type: 'port', lat: -0.8917, lng: 119.8707, province: 'Sulawesi Tengah', capacity: 'Medium', status: 'Operational', detail: 'Pelabuhan utama Sulteng' },
  { id: 'port_027', name: 'Cirebon', type: 'port', lat: -6.7320, lng: 108.5523, province: 'Jawa Barat', capacity: 'Medium', status: 'Operational', detail: 'Pelabuhan laut Jabar' },
  { id: 'port_028', name: 'Ternate', type: 'port', lat: 0.7833, lng: 127.3667, province: 'Maluku Utara', capacity: 'Low', status: 'Operational', detail: 'Pelabuhan Malut' },
  { id: 'port_029', name: 'Bengkulu', type: 'port', lat: -3.7933, lng: 102.2560, province: 'Bengkulu', capacity: 'Low', status: 'Operational', detail: 'Pelabuhan lokal' },
  { id: 'port_030', name: 'Yogyakarta', type: 'port', lat: -7.7972, lng: 110.3688, province: 'DIY', capacity: 'Low', status: 'Operational', detail: 'Pelabuhan lokal' },
];

export const airports: InfrastructurePoint[] = [
  { id: 'air_001', name: 'Soekarno-Hatta (CGK)', type: 'airport', lat: -6.1256, lng: 106.6559, province: 'Banten', capacity: 'Very High', status: 'Operational', detail: 'Bandara terbesar Indonesia' },
  { id: 'air_002', name: 'Juanda (SUB)', type: 'airport', lat: -7.3798, lng: 112.7871, province: 'Jawa Timur', capacity: 'Very High', status: 'Operational', detail: 'Bandara terbesar Jatim' },
  { id: 'air_003', name: 'Ngurah Rai (DPS)', type: 'airport', lat: -8.7482, lng: 115.1673, province: 'Bali', capacity: 'Very High', status: 'Operational', detail: 'Gateway pariwisata' },
  { id: 'air_004', name: 'Kualanamu (KNO)', type: 'airport', lat: 3.6378, lng: 98.8749, province: 'Sumatera Utara', capacity: 'High', status: 'Operational', detail: 'Bandara internasional Sumut' },
  { id: 'air_005', name: 'Sultan Hasanuddin (UPG)', type: 'airport', lat: -5.0615, lng: 119.5540, province: 'Sulawesi Selatan', capacity: 'High', status: 'Operational', detail: 'Bandara utama Sulsel' },
  { id: 'air_006', name: 'Yogyakarta Intl (YIA)', type: 'airport', lat: -7.9078, lng: 110.0546, province: 'DIY', capacity: 'High', status: 'Operational', detail: 'Menggantikan Adisucipto' },
  { id: 'air_007', name: 'Hang Nadim (BTH)', type: 'airport', lat: 1.1210, lng: 104.1188, province: 'Kepulauan Riau', capacity: 'High', status: 'Operational', detail: 'Bandara Batam' },
  { id: 'air_008', name: 'Husein Sastranegara (BDO)', type: 'airport', lat: -6.9033, lng: 107.5764, province: 'Jawa Barat', capacity: 'Medium', status: 'Operational', detail: 'Bandara Bandung' },
  { id: 'air_009', name: 'Adisumarmo (SOC)', type: 'airport', lat: -7.5162, lng: 110.7569, province: 'Jawa Tengah', capacity: 'Medium', status: 'Operational', detail: 'Bandara Solo' },
  { id: 'air_010', name: 'Sepinggan (BPN)', type: 'airport', lat: -1.2682, lng: 116.8938, province: 'Kalimantan Timur', capacity: 'Medium', status: 'Operational', detail: 'Bandara Balikpapan' },
  { id: 'air_011', name: 'Sam Ratulangi (MDC)', type: 'airport', lat: 1.5491, lng: 124.9261, province: 'Sulawesi Utara', capacity: 'Medium', status: 'Operational', detail: 'Bandara Manado' },
  { id: 'air_012', name: 'Minangkabau (PDG)', type: 'airport', lat: -0.7868, lng: 100.2808, province: 'Sumatera Barat', capacity: 'Medium', status: 'Operational', detail: 'Bandara Padang' },
  { id: 'air_013', name: 'Syamsudin Noor (BDJ)', type: 'airport', lat: -3.4425, lng: 114.7541, province: 'Kalimantan Selatan', capacity: 'Medium', status: 'Operational', detail: 'Bandara Banjarmasin' },
  { id: 'air_014', name: 'Supadio (PNK)', type: 'airport', lat: -0.1507, lng: 109.4039, province: 'Kalimantan Barat', capacity: 'Medium', status: 'Operational', detail: 'Bandara Pontianak' },
  { id: 'air_015', name: 'Sultan Mahmud Badaruddin II', type: 'airport', lat: -2.8983, lng: 104.7000, province: 'Sumatera Selatan', capacity: 'Medium', status: 'Operational', detail: 'Bandara Palembang' },
  { id: 'air_016', name: 'El Tari (KOE)', type: 'airport', lat: -10.1716, lng: 123.6711, province: 'NTT', capacity: 'Medium', status: 'Operational', detail: 'Bandara Kupang' },
  { id: 'air_017', name: 'Pattimura (AMQ)', type: 'airport', lat: -3.7103, lng: 128.0890, province: 'Maluku', capacity: 'Medium', status: 'Operational', detail: 'Bandara Ambon' },
  { id: 'air_018', name: 'Sentani (DJJ)', type: 'airport', lat: -2.5769, lng: 140.5164, province: 'Papua', capacity: 'Medium', status: 'Operational', detail: 'Bandara Jayapura' },
  { id: 'air_019', name: 'Lombok (LOP)', type: 'airport', lat: -8.7577, lng: 116.2766, province: 'NTB', capacity: 'Medium', status: 'Operational', detail: 'Bandara Lombok' },
  { id: 'air_020', name: 'Raja Haji Fisabilillah', type: 'airport', lat: 0.9227, lng: 104.5324, province: 'Kepulauan Riau', capacity: 'Medium', status: 'Operational', detail: 'Bandara Tanjung Pinang' },
  { id: 'air_021', name: 'Raden Inten II (TKG)', type: 'airport', lat: -5.2423, lng: 105.1789, province: 'Lampung', capacity: 'Medium', status: 'Operational', detail: 'Bandara Lampung' },
  { id: 'air_022', name: 'Sultan Thaha (DJB)', type: 'airport', lat: -1.6380, lng: 103.6440, province: 'Jambi', capacity: 'Medium', status: 'Operational', detail: 'Bandara Jambi' },
];

export const keks: InfrastructurePoint[] = [
  { id: 'kek_001', name: 'KEK Sei Mangkei', type: 'kek', lat: 2.9000, lng: 99.3000, province: 'Sumatera Utara', capacity: 'High', status: 'Operational', detail: 'Agroindustri, CPO, biofuel' },
  { id: 'kek_002', name: 'KEK Kendal', type: 'kek', lat: -6.9500, lng: 110.3000, province: 'Jawa Tengah', capacity: 'High', status: 'Operational', detail: 'Manufaktur, elektronik, otomotif' },
  { id: 'kek_003', name: 'KEK Batang', type: 'kek', lat: -6.9167, lng: 109.7833, province: 'Jawa Tengah', capacity: 'High', status: 'Operational', detail: 'Manufaktur, energi' },
  { id: 'kek_004', name: 'KEK Gresik', type: 'kek', lat: -7.1500, lng: 112.6500, province: 'Jawa Timur', capacity: 'High', status: 'Operational', detail: 'Petrokimia, manufaktur' },
  { id: 'kek_005', name: 'KEK Mandalika', type: 'kek', lat: -8.8958, lng: 116.2800, province: 'NTB', capacity: 'High', status: 'Operational', detail: 'Pariwisata, MotoGP' },
  { id: 'kek_006', name: 'KEK Bitung', type: 'kek', lat: 1.4433, lng: 125.1858, province: 'Sulawesi Utara', capacity: 'Medium', status: 'Operational', detail: 'Perikanan, logistik' },
  { id: 'kek_007', name: 'KEK Cilegon', type: 'kek', lat: -6.0167, lng: 106.0500, province: 'Banten', capacity: 'High', status: 'Operational', detail: 'Energi, baja' },
  { id: 'kek_008', name: 'KEK Tuban', type: 'kek', lat: -6.9000, lng: 111.9000, province: 'Jawa Timur', capacity: 'High', status: 'Operational', detail: 'Manufaktur, petrokimia' },
  { id: 'kek_009', name: 'KEK Pasuruan', type: 'kek', lat: -7.6500, lng: 112.9000, province: 'Jawa Timur', capacity: 'Medium', status: 'Operational', detail: 'Manufaktur' },
  { id: 'kek_010', name: 'KEK Singhasari', type: 'kek', lat: -7.9000, lng: 112.5833, province: 'Jawa Timur', capacity: 'Medium', status: 'Operational', detail: 'Digital, teknologi' },
  { id: 'kek_011', name: 'KEK Palu', type: 'kek', lat: -0.9000, lng: 119.8500, province: 'Sulawesi Tengah', capacity: 'Medium', status: 'Operational', detail: 'Manufaktur, agroindustri' },
  { id: 'kek_012', name: 'KEK Tanjung Lesung', type: 'kek', lat: -6.4667, lng: 105.6500, province: 'Banten', capacity: 'Medium', status: 'Operational', detail: 'Pariwisata' },
  { id: 'kek_013', name: 'KEK Tanjung Kelayang', type: 'kek', lat: -2.5500, lng: 107.7000, province: 'Kepulauan Bangka Belitung', capacity: 'Medium', status: 'Operational', detail: 'Pariwisata' },
  { id: 'kek_014', name: 'KEK Lido', type: 'kek', lat: -6.7000, lng: 106.7833, province: 'Jawa Barat', capacity: 'Medium', status: 'Operational', detail: 'Pariwisata' },
  { id: 'kek_015', name: 'KEK Sorong', type: 'kek', lat: -0.8667, lng: 131.2500, province: 'Papua Barat', capacity: 'Medium', status: 'Under Construction', detail: 'Perikanan, energi' },
  { id: 'kek_016', name: 'KEK Maloy', type: 'kek', lat: 1.3167, lng: 109.3167, province: 'Kalimantan Barat', capacity: 'Medium', status: 'Under Construction', detail: 'Energi, minerba' },
  { id: 'kek_017', name: 'KEK Arun Lhokseumawe', type: 'kek', lat: 5.1833, lng: 97.1333, province: 'Aceh', capacity: 'Medium', status: 'Under Construction', detail: 'Energi, petrokimia' },
  { id: 'kek_018', name: 'KEK Tanjung Api-Api', type: 'kek', lat: -3.0000, lng: 104.8000, province: 'Sumatera Selatan', capacity: 'Medium', status: 'Operational', detail: 'Logistik, manufaktur' },
  { id: 'kek_019', name: 'KEK Galang Batang', type: 'kek', lat: 1.0500, lng: 104.5500, province: 'Kepulauan Riau', capacity: 'Medium', status: 'Operational', detail: 'Bauksit, smelter' },
  { id: 'kek_020', name: 'KEK Morotai', type: 'kek', lat: 2.3000, lng: 128.4000, province: 'Maluku Utara', capacity: 'Low', status: 'Under Construction', detail: 'Pariwisata' },
];

export const tollRoads: InfrastructurePoint[] = [
  { id: 'tol_001', name: 'Jakarta-Cikampek (Japek)', type: 'toll_road', lat: -6.2000, lng: 107.1000, province: 'Jawa Barat', capacity: 'Very High', status: 'Operational', detail: '73 km — arteri utama' },
  { id: 'tol_002', name: 'Cipularang', type: 'toll_road', lat: -6.8000, lng: 107.5000, province: 'Jawa Barat', capacity: 'High', status: 'Operational', detail: '58 km — Cikampek-Padalarang' },
  { id: 'tol_003', name: 'Padaleunyi', type: 'toll_road', lat: -6.9000, lng: 107.6000, province: 'Jawa Barat', capacity: 'High', status: 'Operational', detail: '35 km — Padalarang-Cileunyi' },
  { id: 'tol_004', name: 'Jakarta Inner Ring Road', type: 'toll_road', lat: -6.2000, lng: 106.8500, province: 'DKI Jakarta', capacity: 'Very High', status: 'Operational', detail: '45 km — keliling Jakarta' },
  { id: 'tol_005', name: 'JORR', type: 'toll_road', lat: -6.2800, lng: 106.7500, province: 'DKI Jakarta', capacity: 'Very High', status: 'Operational', detail: '65 km — luar Jakarta' },
  { id: 'tol_006', name: 'Jagorawi', type: 'toll_road', lat: -6.3000, lng: 106.8500, province: 'Jawa Barat', capacity: 'High', status: 'Operational', detail: '46 km — Jakarta-Bogor' },
  { id: 'tol_007', name: 'Semarang-Solo', type: 'toll_road', lat: -7.1000, lng: 110.5000, province: 'Jawa Tengah', capacity: 'High', status: 'Operational', detail: '72 km — arteri Jateng' },
  { id: 'tol_008', name: 'Surabaya-Mojokerto', type: 'toll_road', lat: -7.4000, lng: 112.5000, province: 'Jawa Timur', capacity: 'High', status: 'Operational', detail: '37 km' },
  { id: 'tol_009', name: 'Surabaya-Gempol', type: 'toll_road', lat: -7.3500, lng: 112.7000, province: 'Jawa Timur', capacity: 'High', status: 'Operational', detail: '35 km — ke Bandara Juanda' },
  { id: 'tol_010', name: 'Cikopo-Palimanan', type: 'toll_road', lat: -6.5000, lng: 107.5000, province: 'Jawa Barat', capacity: 'High', status: 'Operational', detail: '116 km — alternatif Pantura' },
  { id: 'tol_011', name: 'Pejagan-Pemalang', type: 'toll_road', lat: -7.1000, lng: 109.2000, province: 'Jawa Tengah', capacity: 'High', status: 'Operational', detail: '57 km — Pantura' },
  { id: 'tol_012', name: 'Pemalang-Batang', type: 'toll_road', lat: -6.9000, lng: 109.5000, province: 'Jawa Tengah', capacity: 'High', status: 'Operational', detail: '40 km — Pantura' },
  { id: 'tol_013', name: 'Batang-Semarang', type: 'toll_road', lat: -6.9000, lng: 110.2000, province: 'Jawa Tengah', capacity: 'High', status: 'Operational', detail: '75 km — masuk Semarang' },
  { id: 'tol_014', name: 'Medan-Binjai', type: 'toll_road', lat: 3.5000, lng: 98.6000, province: 'Sumatera Utara', capacity: 'Medium', status: 'Operational', detail: '17 km — pertama di Sumatera' },
  { id: 'tol_015', name: 'Medan-Kualanamu', type: 'toll_road', lat: 3.4000, lng: 98.9000, province: 'Sumatera Utara', capacity: 'High', status: 'Operational', detail: '60 km — ke bandara' },
  { id: 'tol_016', name: 'Palembang-Indralaya', type: 'toll_road', lat: -3.1000, lng: 104.7000, province: 'Sumatera Selatan', capacity: 'Medium', status: 'Operational', detail: '25 km — Sumatera Selatan' },
  { id: 'tol_017', name: 'Bakauheni-Terbanggi Besar', type: 'toll_road', lat: -5.4000, lng: 105.3000, province: 'Lampung', capacity: 'High', status: 'Operational', detail: '141 km — Lintas Sumatera' },
  { id: 'tol_018', name: 'Terbanggi-Pematang Panggang', type: 'toll_road', lat: -4.8000, lng: 105.0000, province: 'Lampung', capacity: 'High', status: 'Operational', detail: '110 km — Lintas Sumatera' },
  { id: 'tol_019', name: 'Belawan-Medan-Tanjung Morawa', type: 'toll_road', lat: 3.6000, lng: 98.7000, province: 'Sumatera Utara', capacity: 'Medium', status: 'Operational', detail: '18 km — ke pelabuhan' },
  { id: 'tol_020', name: 'Kapal Betung', type: 'toll_road', lat: -2.2000, lng: 106.1000, province: 'Kepulauan Bangka Belitung', capacity: 'Low', status: 'Operational', detail: '50 km — Bangka' },
];

// Typed exports for scoring engine compatibility
export const typedPorts: Port[] = ports.map(p => ({
  name: p.name,
  lat: p.lat,
  lng: p.lng,
  type: 'Port',
  capacity: p.capacity,
}));

export const typedAirports: Airport[] = airports.map(a => ({
  name: a.name,
  lat: a.lat,
  lng: a.lng,
  type: 'Airport',
  iata: a.name.match(/\(([^)]+)\)/)?.[1] || 'N/A',
}));

export const allInfrastructure: InfrastructurePoint[] = [...ports, ...airports, ...keks, ...tollRoads];

export const infrastructureStats = {
  ports: ports.length,
  airports: airports.length,
  keks: keks.length,
  tollRoads: tollRoads.length,
  total: allInfrastructure.length,
};
