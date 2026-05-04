/**
 * SAMPLE BKPM PROJECTS — 20 Projects for CMS Matching Engine
 *
 * Based on:
 *   - PSN_PROJECTS and KBLI_TABLE from referenceData.ts
 *   - Real BKPM project types (PID, PPI, IPRO)
 *   - Actual Indonesian provinces, sectors, and KBLI codes
 *   - Realistic investment values, IRR, and payback periods
 *
 * investmentValue is in Million IDR:
 *   - 14,000,000 = Rp 14 Trillion = ~$886M
 *   - 1,000,000  = Rp 1 Trillion  = ~$63M
 */

import type { Project } from '@/types';

// Helper to create sample projects compatible with the existing Project type
function makeSampleProject(p: {
  id: number;
  name: string;
  sector: string;
  subSector: string;
  province: string;
  description: string;
  investmentValue: number;
  irr: number;
  paybackPeriod: number;
  projectType: 'PID' | 'PPI' | 'IPRO';
  kbliCodes: string[];
  tags: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
  status: 'Verified' | 'In Progress' | 'Planning';
  lat: number;
  lng: number;
}): Project {
  return {
    id: p.id,
    name: p.name,
    nameEn: p.name,
    nameId: p.name,
    description: p.description,
    descriptionEn: p.description,
    descriptionId: p.description,
    sector: p.sector,
    subSector: p.subSector,
    category: 'Sekunder',
    province: p.province,
    location: p.province,
    investmentValue: p.investmentValue,
    irr: p.irr,
    npv: p.investmentValue * 0.3,
    paybackPeriod: p.paybackPeriod,
    status: p.status,
    image: '',
    tags: p.tags,
    coordinates: { lat: p.lat, lng: p.lng },
    kbliCodes: p.kbliCodes,
    projectType: p.projectType,
  };
}

export const SAMPLE_PROJECTS: Project[] = [
  // ── Energi (4 projects) ──
  makeSampleProject({
    id: 384, name: 'Pembangkit Listrik Panas Bumi Sarulla Phase III',
    sector: 'Energi', subSector: 'Geothermal', province: 'Sumatera Utara',
    description: 'Expansion of the Sarulla geothermal power plant, adding 110 MW capacity. One of the largest geothermal projects in the world, located in the Sarulla geothermal field in North Sumatra.',
    investmentValue: 14000000, irr: 15, paybackPeriod: 8, projectType: 'PPI',
    kbliCodes: ['35101'], tags: ['Government Priority', 'PSN', 'Green Energy', 'Downstream'],
    riskLevel: 'Medium', status: 'In Progress', lat: 2.5, lng: 99.0,
  }),
  makeSampleProject({
    id: 1131, name: 'Pembangkit Listrik Tenaga Surya Cirata Floating Solar',
    sector: 'Energi', subSector: 'Solar', province: 'Jawa Barat',
    description: '192 MW floating solar photovoltaic power plant on the Cirata Reservoir. Largest floating solar project in Southeast Asia, supporting Indonesia\'s renewable energy transition.',
    investmentValue: 6000000, irr: 12, paybackPeriod: 10, projectType: 'PPI',
    kbliCodes: ['35102'], tags: ['Government Priority', 'PSN', 'Green Energy', 'Renewable'],
    riskLevel: 'Low', status: 'In Progress', lat: -6.7, lng: 107.35,
  }),
  makeSampleProject({
    id: 385, name: 'PLTA Upper Cisokan Pumped Storage',
    sector: 'Energi', subSector: 'Hydropower', province: 'Jawa Barat',
    description: '4x260 MW pumped-storage hydropower plant to support grid stability and renewable energy integration in the Java-Bali electricity system.',
    investmentValue: 10500000, irr: 10, paybackPeriod: 12, projectType: 'PID',
    kbliCodes: ['35104'], tags: ['Government Priority', 'PSN', 'Green Energy'],
    riskLevel: 'Medium', status: 'Planning', lat: -7.0, lng: 107.4,
  }),
  makeSampleProject({
    id: 1516, name: 'LNG Terminal dan Regasifikasi Arun',
    sector: 'Energi', subSector: 'Natural Gas', province: 'Aceh',
    description: 'LNG receiving terminal and regasification facility in Arun, Aceh, with capacity of 3 MTPA to support natural gas supply for power generation and industrial use in Sumatra.',
    investmentValue: 4500000, irr: 18, paybackPeriod: 7, projectType: 'IPRO',
    kbliCodes: ['35202', '35201'], tags: ['KEK', 'Downstream', 'Gas'],
    riskLevel: 'Medium', status: 'In Progress', lat: 5.2, lng: 97.0,
  }),

  // ── Industri (5 projects) ──
  makeSampleProject({
    id: 1141, name: 'Smelter Nikel HPAL Morowali',
    sector: 'Industri', subSector: 'Nickel Processing', province: 'Sulawesi Tengah',
    description: 'High-Pressure Acid Leach (HPAL) nickel smelter for battery-grade nickel sulfate and cobalt sulfate production. Supports Indonesia\'s EV battery downstream strategy.',
    investmentValue: 55000000, irr: 22, paybackPeriod: 5, projectType: 'PPI',
    kbliCodes: ['24101', '24201'], tags: ['Government Priority', 'PSN', 'KEK', 'Downstream', 'EV Battery'],
    riskLevel: 'Medium', status: 'In Progress', lat: -2.5, lng: 121.5,
  }),
  makeSampleProject({
    id: 1140, name: 'Industri MEG Berbasis Batu Bara Sumatera Selatan',
    sector: 'Industri', subSector: 'Chemical Processing', province: 'Sumatera Selatan',
    description: 'Coal-to-MEG (Monoethylene Glycol) plant producing 500,000 tons/year. Leverages South Sumatra\'s abundant coal reserves for downstream chemical manufacturing.',
    investmentValue: 19500000, irr: 20, paybackPeriod: 6, projectType: 'PPI',
    kbliCodes: ['20117'], tags: ['Government Priority', 'PSN', 'KEK', 'Downstream'],
    riskLevel: 'High', status: 'In Progress', lat: -3.3, lng: 104.7,
  }),
  makeSampleProject({
    id: 387, name: 'Industri Soda Ash Madura',
    sector: 'Industri', subSector: 'Chemical Manufacturing', province: 'Jawa Timur',
    description: 'Soda ash (sodium carbonate) manufacturing facility with 300,000 tons/year capacity in Madura, East Java. First domestic soda ash producer, reducing import dependency.',
    investmentValue: 3100000, irr: 16, paybackPeriod: 7, projectType: 'IPRO',
    kbliCodes: ['20111'], tags: ['Government Priority', 'PSN', 'KEK', 'Downstream'],
    riskLevel: 'Low', status: 'Planning', lat: -7.1, lng: 113.5,
  }),
  makeSampleProject({
    id: 1128, name: 'Industri Aluminium Smelter Mempawah',
    sector: 'Industri', subSector: 'Aluminium Smelting', province: 'Kalimantan Barat',
    description: 'Aluminium smelter with 1 million tons/year capacity in Mempawah, West Kalimantan. Integrated with hydroelectric power for green aluminium production.',
    investmentValue: 32000000, irr: 18, paybackPeriod: 8, projectType: 'PPI',
    kbliCodes: ['24201'], tags: ['Government Priority', 'Downstream', 'Green Energy', 'Critical Mineral'],
    riskLevel: 'Medium', status: 'In Progress', lat: 0.1, lng: 109.2,
  }),
  makeSampleProject({
    id: 386, name: 'Industri Baja Krakatau-Osaka Steel Expansion',
    sector: 'Industri', subSector: 'Steel Manufacturing', province: 'Banten',
    description: 'Expansion of Krakatau Steel joint venture with Osaka Steel, adding 500,000 tons/year of specialty steel products for automotive and construction sectors.',
    investmentValue: 8500000, irr: 14, paybackPeriod: 9, projectType: 'IPRO',
    kbliCodes: ['24101'], tags: ['Downstream', 'Manufacturing'],
    riskLevel: 'Low', status: 'In Progress', lat: -6.0, lng: 106.0,
  }),

  // ── Infrastruktur (3 projects) ──
  makeSampleProject({
    id: 388, name: 'Jalan Tol Trans Sumatera Sektor Palembang-Bengkulu',
    sector: 'Infrastruktur', subSector: 'Road Construction', province: 'Sumatera Selatan',
    description: '198 km toll road connecting Palembang to Bengkulu, part of the Trans-Sumatra Highway. Improves logistics connectivity for agricultural and industrial products from South Sumatra.',
    investmentValue: 25000000, irr: 11, paybackPeriod: 15, projectType: 'PID',
    kbliCodes: ['42101'], tags: ['Government Priority', 'PSN', 'PPP'],
    riskLevel: 'Medium', status: 'In Progress', lat: -3.0, lng: 104.7,
  }),
  makeSampleProject({
    id: 1144, name: 'Pelabuhan Internasional Kuala Tanjung',
    sector: 'Infrastruktur', subSector: 'Port Development', province: 'Sumatera Utara',
    description: 'International hub port with 6 container berths and capacity of 5 million TEU. Strategic gateway for the Malacca Strait trade route and Sumatra industrial zone.',
    investmentValue: 35000000, irr: 9, paybackPeriod: 14, projectType: 'PID',
    kbliCodes: ['50111', '52101'], tags: ['Government Priority', 'PSN', 'KEK', 'PPP'],
    riskLevel: 'Medium', status: 'In Progress', lat: 3.2, lng: 99.5,
  }),
  makeSampleProject({
    id: 390, name: 'IKN Nusantara Infrastruktur Dasar Fase II',
    sector: 'Infrastruktur', subSector: 'Urban Infrastructure', province: 'Kalimantan Timur',
    description: 'Phase II basic infrastructure development for the new capital Nusantara, including government district, water supply, waste management, and smart grid systems.',
    investmentValue: 80000000, irr: 8, paybackPeriod: 15, projectType: 'PID',
    kbliCodes: ['41101', '42101', '37022'], tags: ['Government Priority', 'PSN', 'Smart City'],
    riskLevel: 'High', status: 'In Progress', lat: -1.3, lng: 116.7,
  }),

  // ── Digital (2 projects) ──
  makeSampleProject({
    id: 389, name: 'Data Center Hub Banten',
    sector: 'Digital', subSector: 'Data Center', province: 'Banten',
    description: 'Tier-IV data center campus with 100 MW total IT load capacity. Positioned as the primary data center hub for Indonesia, serving hyperscalers and enterprise clients.',
    investmentValue: 28000000, irr: 25, paybackPeriod: 5, projectType: 'PPI',
    kbliCodes: ['63111'], tags: ['Government Priority', 'PSN', 'KEK', 'Hyperscale'],
    riskLevel: 'Low', status: 'In Progress', lat: -6.3, lng: 106.2,
  }),
  makeSampleProject({
    id: 1147, name: 'Smart City Nusantara Digital Infrastructure',
    sector: 'Digital', subSector: 'Smart City', province: 'Kalimantan Timur',
    description: 'Comprehensive smart city digital infrastructure for IKN Nusantara including IoT sensors, 5G network, command center, and e-government platform.',
    investmentValue: 15000000, irr: 20, paybackPeriod: 6, projectType: 'PID',
    kbliCodes: ['62011', '63111'], tags: ['Government Priority', 'PSN', 'Smart City', '5G'],
    riskLevel: 'Medium', status: 'Planning', lat: -1.3, lng: 116.7,
  }),

  // ── Pertanian (2 projects) ──
  makeSampleProject({
    id: 1135, name: 'Kawasan Industri Kelapa Sawit Terintegrasi Riau',
    sector: 'Pertanian', subSector: 'Palm Oil', province: 'Riau',
    description: 'Integrated palm oil industrial zone with refinery, oleochemical plant, and biodiesel facility. Processing capacity of 2 million tons CPO/year from surrounding plantations.',
    investmentValue: 8500000, irr: 18, paybackPeriod: 6, projectType: 'IPRO',
    kbliCodes: ['01131'], tags: ['KEK', 'Downstream', 'Export', 'Sustainable'],
    riskLevel: 'Low', status: 'In Progress', lat: 0.5, lng: 102.0,
  }),
  makeSampleProject({
    id: 1138, name: 'Agroindustri Kakao Sulawesi Barat',
    sector: 'Pertanian', subSector: 'Cocoa Processing', province: 'Sulawesi Barat',
    description: 'Cocoa processing industrial estate with 100,000 tons/year grinding capacity. Includes farmer development program and integrated fermentation-drying facilities.',
    investmentValue: 2500000, irr: 22, paybackPeriod: 5, projectType: 'PPI',
    kbliCodes: ['01211', '10731'], tags: ['Downstream', 'Export', 'Sustainable'],
    riskLevel: 'Low', status: 'In Progress', lat: -3.4, lng: 118.9,
  }),

  // ── Pariwisata (2 projects) ──
  makeSampleProject({
    id: 1151, name: 'Kawasan Pariwisata Mandalika',
    sector: 'Pariwisata', subSector: 'Tourism Estate', province: 'Nusa Tenggara Barat',
    description: '1,175-hectare integrated tourism estate with luxury hotels, convention center, golf course, and MotoGP circuit. Flagship tourism development in Lombok.',
    investmentValue: 12000000, irr: 14, paybackPeriod: 10, projectType: 'PID',
    kbliCodes: ['55110'], tags: ['Government Priority', 'PSN', 'KEK'],
    riskLevel: 'Medium', status: 'In Progress', lat: -8.9, lng: 116.3,
  }),
  makeSampleProject({
    id: 397, name: 'Kawasan Pariwisata Labuan Bajo',
    sector: 'Pariwisata', subSector: 'Eco-Tourism', province: 'Nusa Tenggara Timur',
    description: 'Eco-tourism development in Labuan Bajo, gateway to Komodo National Park. Includes sustainable resort, marina, and community-based tourism infrastructure.',
    investmentValue: 8500000, irr: 16, paybackPeriod: 8, projectType: 'PPI',
    kbliCodes: ['55110'], tags: ['Government Priority', 'PSN', 'KEK', 'Sustainable'],
    riskLevel: 'Low', status: 'In Progress', lat: -8.5, lng: 119.5,
  }),

  // ── Kesehatan (1 project) ──
  makeSampleProject({
    id: 1139, name: 'Kawasan Medis dan Rumah Sakit Internasional Bali',
    sector: 'Kesehatan', subSector: 'Hospital', province: 'Bali',
    description: 'International medical tourism zone with 500-bed JCI-accredited hospital, wellness center, and medical research facility. Targeting medical tourists from Australia and Southeast Asia.',
    investmentValue: 4500000, irr: 20, paybackPeriod: 6, projectType: 'PPI',
    kbliCodes: ['86101'], tags: ['KEK', 'Medical Tourism'],
    riskLevel: 'Low', status: 'Planning', lat: -8.6, lng: 115.2,
  }),

  // ── Mining (1 project) ──
  makeSampleProject({
    id: 210, name: 'Smelter Nikel Konawe Sulawesi Tenggara',
    sector: 'Industri', subSector: 'Nickel Smelting', province: 'Sulawesi Tenggara',
    description: 'Nickel smelter with 1.2 million tons/year ferronickel capacity in Konawe, Southeast Sulawesi. Integrated mining-to-smelter operation supporting Indonesia\'s downstream mineral policy.',
    investmentValue: 22000000, irr: 24, paybackPeriod: 4, projectType: 'PPI',
    kbliCodes: ['24101'], tags: ['Government Priority', 'PSN', 'KEK', 'Downstream', 'Critical Mineral'],
    riskLevel: 'Medium', status: 'In Progress', lat: -3.8, lng: 122.3,
  }),
];
