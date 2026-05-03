/**
 * Suitability Layer Registry
 * Maps each of the 21 GIS layers to their data source, availability status,
 * and computation method for the weighted overlay engine.
 */

export interface LayerInfo {
  id: string;
  name: string;
  category: "spatial" | "socioeconomic" | "regulatory" | "pir";
  dataType: "raster" | "vector" | "tabular" | "derived";
  status: "ready" | "available" | "missing" | "restricted";
  source: string;
  sourceUrl?: string;
  description: string;
  weight: number;
  isConstraint: boolean;
  computationMethod: string;
}

export const layerRegistry: LayerInfo[] = [
  // ── SPATIAL LAYERS (64%) ──────────────────────────────────────────
  {
    id: "roadNetworkIndex",
    name: "Road Network Distance",
    category: "spatial",
    dataType: "vector",
    status: "available",
    source: "OpenStreetMap / Bina Marga",
    sourceUrl: "https://download.geofabrik.de/asia/indonesia.html",
    description: "Proximity to national road network (motorway, trunk, primary)",
    weight: 12,
    isConstraint: false,
    computationMethod: "Haversine distance from zone centroid to nearest road",
  },
  {
    id: "portDistanceIndex",
    name: "Port Distance",
    category: "spatial",
    dataType: "vector",
    status: "ready",
    source: "Pelindo + Existing Portal Data",
    description: "Proximity to major seaports (30 ports catalogued)",
    weight: 10,
    isConstraint: false,
    computationMethod: "Haversine distance to nearest port",
  },
  {
    id: "airportDistanceIndex",
    name: "Airport Distance",
    category: "spatial",
    dataType: "vector",
    status: "ready",
    source: "Kemenhub + Existing Portal Data",
    description: "Proximity to airports (22 airports catalogued)",
    weight: 8,
    isConstraint: false,
    computationMethod: "Haversine distance to nearest airport",
  },
  {
    id: "industrialZoneIndex",
    name: "Industrial Zone Proximity",
    category: "spatial",
    dataType: "vector",
    status: "ready",
    source: "Kemenperin Shapefile + BIG MapServer",
    sourceUrl: "https://satudata.kemenperin.go.id",
    description: "Proximity to 153 KI polygons (Kemenperin) and 20 KEK",
    weight: 15,
    isConstraint: false,
    computationMethod: "Point-in-polygon + nearest centroid distance",
  },
  {
    id: "landSuitabilityIndex",
    name: "Land Use / Land Cover",
    category: "spatial",
    dataType: "raster",
    status: "available",
    source: "ESA WorldCover / BIG RBI",
    sourceUrl: "https://esa-worldcover.org",
    description: "Suitability based on land cover class (built-up, cropland, forest)",
    weight: 8,
    isConstraint: false,
    computationMethod: "Reclassify land cover to suitability score",
  },
  {
    id: "slopeIndex",
    name: "Slope / Elevation",
    category: "spatial",
    dataType: "raster",
    status: "available",
    source: "NASA SRTM 30m",
    sourceUrl: "https://earthexplorer.usgs.gov",
    description: "Terrain slope derived from 30m DEM",
    weight: 6,
    isConstraint: false,
    computationMethod: "DEM → slope → reclassify to suitability",
  },
  {
    id: "floodRiskIndex",
    name: "Flood Risk",
    category: "spatial",
    dataType: "vector",
    status: "available",
    source: "BNPB InaRISK / BIG",
    sourceUrl: "https://inarisk.bnpb.go.id",
    description: "Flood hazard zones (low/medium/high risk)",
    weight: 5,
    isConstraint: true,
    computationMethod: "Inverse of flood risk classification",
  },
  {
    id: "utilityIndex",
    name: "Utility Infrastructure",
    category: "spatial",
    dataType: "vector",
    status: "missing",
    source: "PLN / Kominfo (no open data)",
    description: "Electricity, water, internet availability (proxy: % electrification)",
    weight: 5,
    isConstraint: false,
    computationMethod: "BPS % desa berlistrik + OpenCellID tower density",
  },

  // ── SOCIO-ECONOMIC LAYERS (34%) ───────────────────────────────────
  {
    id: "populationDensityIndex",
    name: "Population Density",
    category: "socioeconomic",
    dataType: "tabular",
    status: "ready",
    source: "BPS Sensus 2020 + Existing Portal",
    description: "Log-normalized population per km²",
    weight: 8,
    isConstraint: false,
    computationMethod: "log(population / area) normalized 0-100",
  },
  {
    id: "workforceIndex",
    name: "Workforce Availability",
    category: "socioeconomic",
    dataType: "tabular",
    status: "ready",
    source: "BPS + Existing Portal",
    description: "Total workforce (AK) per province",
    weight: 8,
    isConstraint: false,
    computationMethod: "workforce count normalized to max",
  },
  {
    id: "umrCompetitivenessIndex",
    name: "UMR (Minimum Wage)",
    category: "socioeconomic",
    dataType: "tabular",
    status: "ready",
    source: "Kemenaker + Existing Portal",
    description: "Labor cost competitiveness (inverse — lower = better)",
    weight: 5,
    isConstraint: false,
    computationMethod: "(max_UMR - current) / range × 100",
  },
  {
    id: "educationIndex",
    name: "Education Level",
    category: "socioeconomic",
    dataType: "tabular",
    status: "available",
    source: "BPS — Angka Partisipasi Sekolah",
    sourceUrl: "https://www.bps.go.id/subjek/28/pendidikan.html",
    description: "Workforce education level (SMA/S1 ratio)",
    weight: 4,
    isConstraint: false,
    computationMethod: "SMA+ ratio or APS index normalized",
  },
  {
    id: "economicActivityIndex",
    name: "Existing Economic Activity",
    category: "socioeconomic",
    dataType: "tabular",
    status: "available",
    source: "BPS — PDRB per Provinsi",
    sourceUrl: "https://www.bps.go.id/exim.html",
    description: "Economic vibrancy / PDRB per capita",
    weight: 5,
    isConstraint: false,
    computationMethod: "PDRB per capita normalized",
  },

  // ── REGULATORY LAYERS (Constraints, binary 0/1) ───────────────────
  {
    id: "zoningCompliance",
    name: "Zoning (RTRW)",
    category: "regulatory",
    dataType: "vector",
    status: "restricted",
    source: "ATR/BPN GISTARU",
    description: "Inside permitted zone per RTRW",
    weight: 0,
    isConstraint: true,
    computationMethod: "Point-in-polygon with RTRW layer (requires ATR/BPN login)",
  },
  {
    id: "protectedAreaConstraint",
    name: "Protected Areas",
    category: "regulatory",
    dataType: "vector",
    status: "available",
    source: "KLHK / UNEP-WCMC",
    sourceUrl: "https://www.protectedplanet.net",
    description: "Inside conservation area (Taman Nasional, etc.)",
    weight: 0,
    isConstraint: true,
    computationMethod: "Point-in-polygon with protected area layer",
  },
  {
    id: "forestConstraint",
    name: "Forest Status",
    category: "regulatory",
    dataType: "raster",
    status: "available",
    source: "KLHK / Global Forest Watch",
    sourceUrl: "https://www.globalforestwatch.org",
    description: "Primary forest vs production forest vs non-forest",
    weight: 0,
    isConstraint: true,
    computationMethod: "Reclassify forest status to binary constraint",
  },
  {
    id: "miningConstraint",
    name: "Mining Concessions",
    category: "regulatory",
    dataType: "vector",
    status: "available",
    source: "ESDM Minerba One Map / BIG",
    sourceUrl: "https://minerba.esdm.go.id",
    description: "Overlap with mining concession (IUP)",
    weight: 0,
    isConstraint: true,
    computationMethod: "Polygon intersection with mining concession layer",
  },

  // ── PIR-SPECIFIC LAYERS (18%) ─────────────────────────────────────
  {
    id: "investmentRealizationIndex",
    name: "Existing Investment Realization",
    category: "pir",
    dataType: "tabular",
    status: "ready",
    source: "BKPM / Existing Portal",
    description: "Historical investment absorption (Billion IDR)",
    weight: 5,
    isConstraint: false,
    computationMethod: "Investment realization per capita normalized",
  },
  {
    id: "projectDensityIndex",
    name: "Project Density",
    category: "pir",
    dataType: "derived",
    status: "ready",
    source: "Computed from project list",
    description: "Number of projects per 1000 km²",
    weight: 4,
    isConstraint: false,
    computationMethod: "count(projects) / area × 1000, normalized",
  },
  {
    id: "sectorSpecializationScore",
    name: "Sector Specialization",
    category: "pir",
    dataType: "derived",
    status: "ready",
    source: "Computed from project sectors",
    description: "Province's sector dominance index",
    weight: 4,
    isConstraint: false,
    computationMethod: "Entropy-based specialization index per sector",
  },
  {
    id: "commodityMatchScore",
    name: "Commodity Availability",
    category: "pir",
    dataType: "tabular",
    status: "ready",
    source: "Existing portal commodities array",
    description: "Match between target sector and provincial commodities",
    weight: 4,
    isConstraint: false,
    computationMethod: "Count matching commodities × 20 + base score",
  },
];

export function getReadyLayers(): LayerInfo[] {
  return layerRegistry.filter(l => l.status === "ready");
}

export function getAvailableLayers(): LayerInfo[] {
  return layerRegistry.filter(l => l.status === "available" || l.status === "ready");
}

export function getMissingLayers(): LayerInfo[] {
  return layerRegistry.filter(l => l.status === "missing");
}

export function getConstraintLayers(): LayerInfo[] {
  return layerRegistry.filter(l => l.isConstraint);
}

export function getLayerById(id: string): LayerInfo | undefined {
  return layerRegistry.find(l => l.id === id);
}

export function getTotalWeight(): number {
  return layerRegistry
    .filter(l => !l.isConstraint)
    .reduce((sum, l) => sum + l.weight, 0);
}

export function getCategoryWeight(category: LayerInfo["category"]): number {
  return layerRegistry
    .filter(l => l.category === category && !l.isConstraint)
    .reduce((sum, l) => sum + l.weight, 0);
}

export const layerCategoryLabels: Record<LayerInfo["category"], string> = {
  spatial: "Spatial / Physical (64%)",
  socioeconomic: "Socio-Economic (30%)",
  regulatory: "Regulatory / Constraints",
  pir: "PIR-Specific (18%)",
};
