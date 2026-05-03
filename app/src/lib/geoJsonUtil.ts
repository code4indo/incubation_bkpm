/**
 * GeoJSON Utility Module — PIR Zone Overlay Engine
 *
 * Provides:
 *  - Point-in-polygon (Ray Casting)
 *  - Zone containment query
 *  - Nearest zone finder
 *  - Zone-sector compatibility checking
 *  - GeoJSON data loading
 *
 * Standards: RFC 7946 (GeoJSON) / OGC Simple Features
 */

import pirZonesData from '@/data/pirZones.json';

// ── GeoJSON Types (RFC 7946) ────────────────────────────────────────────────

export interface GeoJsonPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: number[][][]; // Array of linear rings
}

export interface GeoJsonMultiPolygon {
  type: 'MultiPolygon';
  coordinates: number[][][][];
}

export type GeoJsonGeometry = GeoJsonPoint | GeoJsonPolygon | GeoJsonMultiPolygon;

export interface PirZoneProperties {
  name: string;
  type: 'KEK' | 'KI';
  province: string;
  sectors: string[];
  status: string;
  priority: 'High' | 'Medium' | 'Low';
  incentives: string[];
  description: string;
}

export interface PirZoneFeature {
  type: 'Feature';
  id: string;
  properties: PirZoneProperties;
  geometry: GeoJsonPolygon;
}

export interface PirZoneCollection {
  type: 'FeatureCollection';
  metadata: {
    title: string;
    source: string;
    date: string;
    crs: { type: string; properties: { name: string } };
    note: string;
  };
  features: PirZoneFeature[];
}

// ── Point-in-Polygon: Ray Casting Algorithm ─────────────────────────────────

export function pointInPolygon(lat: number, lng: number, polygon: number[][][]): boolean {
  for (const ring of polygon) {
    if (rayCasting(lng, lat, ring)) {
      return true;
    }
  }
  return false;
}

function rayCasting(x: number, y: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

// ── GeoJSON Data Access ────────────────────────────────────────────────────

const zoneCollection = pirZonesData as PirZoneCollection;

export function getPirZones(): PirZoneCollection {
  return zoneCollection;
}

export function getPirZoneFeatures(): PirZoneFeature[] {
  return zoneCollection.features;
}

export function getZoneById(id: string): PirZoneFeature | undefined {
  return zoneCollection.features.find(f => f.id === id);
}

// ── Spatial Queries ─────────────────────────────────────────────────────────

export interface ZoneContainmentResult {
  /** Is the point inside any PIR zone? */
  insideZone: boolean;
  /** All zones that contain this point */
  containingZones: PirZoneFeature[];
  /** Best matching zone (by sector compatibility) */
  bestMatch: PirZoneFeature | null;
  /** Alignment score 0-100 based on sector match */
  sectorAlignmentScore: number;
}

/**
 * Check if a coordinate point is inside any PIR zone,
 * and find the best matching zone for a given sector.
 */
export function checkZoneContainment(
  lat: number,
  lng: number,
  sector: string
): ZoneContainmentResult {
  const containingZones: PirZoneFeature[] = [];

  for (const zone of zoneCollection.features) {
    if (zone.geometry.type === 'Polygon') {
      if (pointInPolygon(lat, lng, zone.geometry.coordinates)) {
        containingZones.push(zone);
      }
    }
  }

  // Find best match by sector compatibility
  let bestMatch: PirZoneFeature | null = null;
  let bestScore = 0;

  for (const zone of containingZones) {
    const score = sectorMatchScore(sector, zone.properties.sectors);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = zone;
    }
  }

  return {
    insideZone: containingZones.length > 0,
    containingZones,
    bestMatch,
    sectorAlignmentScore: bestMatch ? Math.round(bestScore * 100) : 0,
  };
}

/**
 * Find nearest PIR zones to a point, sorted by distance.
 * Returns up to `limit` zones with distance in km.
 */
export interface NearbyZone {
  zone: PirZoneFeature;
  distanceKm: number;
  sectorAlignmentScore: number;
}

export function findNearestZones(
  lat: number,
  lng: number,
  sector: string,
  limit: number = 3
): NearbyZone[] {
  const results: NearbyZone[] = [];

  for (const zone of zoneCollection.features) {
    const dist = distanceToZoneCentroid(lat, lng, zone);
    results.push({
      zone,
      distanceKm: dist,
      sectorAlignmentScore: Math.round(sectorMatchScore(sector, zone.properties.sectors) * 100),
    });
  }

  results.sort((a, b) => a.distanceKm - b.distanceKm);
  return results.slice(0, limit);
}

/**
 * Find all PIR zones compatible with a given sector,
 * sorted by distance to the point.
 */
export function findCompatibleZones(
  lat: number,
  lng: number,
  sector: string,
  limit: number = 5
): NearbyZone[] {
  return findNearestZones(lat, lng, sector, limit)
    .filter(z => z.sectorAlignmentScore > 0)
    .sort((a, b) => {
      // Sort by a combination of sector match and distance
      const scoreA = a.sectorAlignmentScore * 0.6 + (1 - a.distanceKm / 500) * 40;
      const scoreB = b.sectorAlignmentScore * 0.6 + (1 - b.distanceKm / 500) * 40;
      return scoreB - scoreA;
    });
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function sectorMatchScore(projectSector: string, zoneSectors: string[]): number {
  const normalizedProject = projectSector.toLowerCase().trim();

  // Direct match
  for (const zs of zoneSectors) {
    if (normalizedProject === zs.toLowerCase()) return 1.0;
    if (normalizedProject.includes(zs.toLowerCase())) return 0.9;
    if (zs.toLowerCase().includes(normalizedProject)) return 0.8;
  }

  // Fuzzy match with known mappings
  const aliases: Record<string, string[]> = {
    'manufacturing': ['industri', 'pabrik', 'konstruksi', 'manufaktur', 'perindustrian'],
    'agroindustry': ['pertanian', 'perkebunan', 'pangan', 'agro', 'agro industri', 'agrobisnis', 'peternakan', 'hortikultura'],
    'tourism': ['pariwisata', 'hotel', 'resort', 'wisata', 'perhotelan'],
    'fisheries': ['perikanan', 'ikan', 'udang', 'rumput laut', 'akuakultur', 'budidaya'],
    'energy': ['energi', 'listrik', 'pembangkit', 'gas', 'lng', 'tenaga', 'baterai', 'ev'],
    'mining': ['tambang', 'mineral', 'nikel', 'bauksit', 'smelter', 'pertambangan'],
    'digital': ['teknologi', 'digital', 'it', 'data', 'teknologi informasi'],
    'logistics': ['logistik', 'pergudangan', 'pelabuhan', 'pengangkutan', 'transportasi'],
    'chemicals': ['kimia', 'petrokimia', 'oleokimia', 'biodiesel'],
    'infrastructure': ['infrastruktur', 'jalan tol', 'jembatan', 'bandara', 'pelabuhan'],
    'health': ['kesehatan', 'rumah sakit', 'farmasi', 'obat'],
    'education': ['pendidikan', 'pelatihan', 'vokasi'],
  };

  for (const [key, synonyms] of Object.entries(aliases)) {
    // Check if project sector matches this alias group
    const projectMatchesGroup = synonyms.some(s => normalizedProject.includes(s));
    if (projectMatchesGroup) {
      for (const zs of zoneSectors) {
        if (zs.toLowerCase() === key) return 0.7;
        if (zs.toLowerCase().includes(key)) return 0.65;
      }
    }
  }

  return 0;
}

function distanceToZoneCentroid(lat: number, lng: number, zone: PirZoneFeature): number {
  // Calculate polygon centroid from coordinates
  const ring = zone.geometry.coordinates[0]; // Outer ring
  let cx = 0, cy = 0;
  for (const pt of ring) {
    cx += pt[0]; // lng
    cy += pt[1]; // lat
  }
  cx /= ring.length;
  cy /= ring.length;

  return haversineDistance(lat, lng, cy, cx);
}

// Haversine distance in km
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ── GeoJSON Loader (Async, for future dynamic loading) ─────────────────────

/**
 * Load a GeoJSON file from URL.
 * Use for dynamic loading of updated shapefiles in production.
 */
export async function loadGeoJsonFromUrl(url: string): Promise<PirZoneCollection> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load GeoJSON from ${url}: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.type !== 'FeatureCollection') {
    throw new Error(`Invalid GeoJSON: expected FeatureCollection, got ${data.type}`);
  }
  return data as PirZoneCollection;
}

/**
 * Merge an external GeoJSON collection into the current one.
 * Useful for incrementally adding new zones without redeploy.
 */
export function mergeZones(base: PirZoneCollection, overlay: PirZoneCollection): PirZoneCollection {
  const existingIds = new Set(base.features.map(f => f.id));
  const newFeatures = overlay.features.filter(f => !existingIds.has(f.id));
  return {
    ...base,
    features: [...base.features, ...newFeatures],
  };
}
