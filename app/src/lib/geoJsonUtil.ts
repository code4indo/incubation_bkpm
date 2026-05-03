/**
 * GeoJSON Utility Module — PIR Zone Overlay Engine
 *
 * Merges two official data sources:
 *   1. KEK zones (pirZones.json — approximate boundaries, sector data, incentives)
 *   2. KI zones (kemenperinKawasanIndustri.geojson — Kemenperin official 1:50k boundaries)
 *
 * Provides:
 *  - Point-in-polygon (Ray Casting) — Polygon + MultiPolygon
 *  - Zone containment query
 *  - Nearest zone finder
 *  - Zone-sector compatibility checking
 *  - GeoJSON data loading
 *
 * Standards: RFC 7946 (GeoJSON) / OGC Simple Features / Kemenperin Portal Satu Data
 */

import kekZonesData from '@/data/pirZones.json';
import kiZonesData from '@/data/kemenperinKawasanIndustri.json';

// ── GeoJSON Types (RFC 7946) ────────────────────────────────────────────────

export interface GeoJsonPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: number[][][];
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
  status?: string;
  priority?: 'High' | 'Medium' | 'Low';
  incentives?: string[];
  description?: string;
  pengelola?: string;
  kabupaten?: string;
  luas_ha?: string;
}

export interface PirZoneFeature {
  type: 'Feature';
  id: string;
  properties: PirZoneProperties;
  geometry: GeoJsonGeometry;
}

export interface PirZoneCollection {
  type: 'FeatureCollection';
  features: PirZoneFeature[];
}

// ── Point-in-Polygon: Ray Casting Algorithm ─────────────────────────────────

export function pointInPolygon(lat: number, lng: number, polygon: number[][][]): boolean {
  for (const ring of polygon) {
    if (rayCasting(lng, lat, ring)) return true;
  }
  return false;
}

export function pointInMultiPolygon(lat: number, lng: number, multiPolygon: number[][][][]): boolean {
  for (const polygon of multiPolygon) {
    if (pointInPolygon(lat, lng, polygon)) return true;
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

export function pointInGeometry(lat: number, lng: number, geometry: GeoJsonGeometry): boolean {
  if (geometry.type === 'Polygon') {
    return pointInPolygon(lat, lng, geometry.coordinates);
  }
  if (geometry.type === 'MultiPolygon') {
    return pointInMultiPolygon(lat, lng, geometry.coordinates);
  }
  return false;
}

// ── Data Merging — KEK (pirZones) + KI (Kemenperin) ─────────────────────────

interface RawKekProperties {
  name: string;
  type: string;
  province: string;
  sectors: string[];
  status: string;
  priority: string;
  incentives: string[];
  description: string;
}

interface RawKiProperties {
  name: string;
  pengelola: string;
  kabupaten: string;
  provinsi: string;
  luas_ha: string;
  id_ki: string;
  fcode: string;
}

function normalizeKekFeature(f: any): PirZoneFeature {
  const p = f.properties as RawKekProperties;
  return {
    type: 'Feature',
    id: f.id || `KEK_${f.properties.name}`,
    properties: {
      name: p.name,
      type: 'KEK',
      province: p.province,
      sectors: p.sectors || [],
      status: p.status,
      priority: p.priority as PirZoneProperties['priority'],
      incentives: p.incentives,
      description: p.description,
    },
    geometry: f.geometry,
  };
}

function normalizeKiFeature(f: any, index: number): PirZoneFeature {
  const p = f.properties as RawKiProperties;
  return {
    type: 'Feature',
    id: `KI_${p.id_ki}_${index}`,
    properties: {
      name: p.name,
      type: 'KI',
      province: p.provinsi || '',
      sectors: [], // Kemenperin data does not include sector classification
      pengelola: p.pengelola,
      kabupaten: p.kabupaten,
      luas_ha: p.luas_ha,
    },
    geometry: f.geometry,
  };
}

let _mergedFeatures: PirZoneFeature[] | null = null;

function loadAllZones(): PirZoneFeature[] {
  if (_mergedFeatures) return _mergedFeatures;

  const kekFeatures = ((kekZonesData as any).features || []).map(normalizeKekFeature);
  const kiFeatures = ((kiZonesData as any).features || [])
    .map((f: any, i: number) => normalizeKiFeature(f, i));

  _mergedFeatures = [...kekFeatures, ...kiFeatures];
  return _mergedFeatures;
}

const allFeatures = loadAllZones();

// ── GeoJSON Data Access ────────────────────────────────────────────────────

export function getPirZones(): PirZoneCollection {
  return { type: 'FeatureCollection', features: allFeatures };
}

export function getPirZoneFeatures(): PirZoneFeature[] {
  return allFeatures;
}

export function getZoneById(id: string): PirZoneFeature | undefined {
  return allFeatures.find(f => f.id === id);
}

export function getPirZoneStats() {
  const kek = allFeatures.filter(f => f.properties.type === 'KEK').length;
  const ki = allFeatures.filter(f => f.properties.type === 'KI').length;
  return { total: allFeatures.length, kek, ki };
}

// ── Spatial Queries ─────────────────────────────────────────────────────────

export interface ZoneContainmentResult {
  insideZone: boolean;
  containingZones: PirZoneFeature[];
  bestMatch: PirZoneFeature | null;
  sectorAlignmentScore: number;
}

export function checkZoneContainment(
  lat: number,
  lng: number,
  sector: string
): ZoneContainmentResult {
  const containingZones: PirZoneFeature[] = [];

  for (const zone of allFeatures) {
    if (pointInGeometry(lat, lng, zone.geometry)) {
      containingZones.push(zone);
    }
  }

  let bestMatch: PirZoneFeature | null = null;
  let bestScore = 0;

  for (const zone of containingZones) {
    const score = sectorMatchScore(sector, zone.properties.sectors, zone.properties.type);
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

export interface NearbyZone {
  zone: PirZoneFeature;
  distanceKm: number;
  sectorAlignmentScore: number;
}

export function findNearestZones(
  lat: number,
  lng: number,
  sector: string,
  limit: number = 5
): NearbyZone[] {
  const results: NearbyZone[] = [];

  for (const zone of allFeatures) {
    const dist = distanceToZoneCentroid(lat, lng, zone);
    results.push({
      zone,
      distanceKm: dist,
      sectorAlignmentScore: Math.round(
        sectorMatchScore(sector, zone.properties.sectors, zone.properties.type) * 100
      ),
    });
  }

  results.sort((a, b) => a.distanceKm - b.distanceKm);
  return results.slice(0, limit);
}

export function findCompatibleZones(
  lat: number,
  lng: number,
  sector: string,
  limit: number = 10
): NearbyZone[] {
  return findNearestZones(lat, lng, sector, 100)
    .filter(z => z.sectorAlignmentScore > 0)
    .sort((a, b) => {
      const scoreA = a.sectorAlignmentScore * 0.6 + Math.max(0, 100 - a.distanceKm / 5) * 0.4;
      const scoreB = b.sectorAlignmentScore * 0.6 + Math.max(0, 100 - b.distanceKm / 5) * 0.4;
      return scoreB - scoreA;
    })
    .slice(0, limit);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function sectorMatchScore(
  projectSector: string,
  zoneSectors: string[],
  zoneType: 'KEK' | 'KI'
): number {
  // KI zones from Kemenperin don't have sector data — treat as general-industrial compatible
  if (zoneType === 'KI' && zoneSectors.length === 0) {
    return 0.4; // Moderate default compatibility for any sector in industrial zones
  }

  const normalizedProject = projectSector.toLowerCase().trim();

  for (const zs of zoneSectors) {
    if (normalizedProject === zs.toLowerCase()) return 1.0;
    if (normalizedProject.includes(zs.toLowerCase())) return 0.9;
    if (zs.toLowerCase().includes(normalizedProject)) return 0.8;
  }

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
  const ring = getOuterRing(zone.geometry);
  if (!ring) return 9999;

  let cx = 0, cy = 0;
  for (const pt of ring) {
    cx += pt[0];
    cy += pt[1];
  }
  cx /= ring.length;
  cy /= ring.length;

  return haversineDistance(lat, lng, cy, cx);
}

function getOuterRing(geom: GeoJsonGeometry): number[][] | null {
  if (geom.type === 'Polygon' && geom.coordinates.length > 0) {
    return geom.coordinates[0];
  }
  if (geom.type === 'MultiPolygon' && geom.coordinates.length > 0 && geom.coordinates[0].length > 0) {
    return geom.coordinates[0][0];
  }
  return null;
}

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

// ── GeoJSON Loader ─────────────────────────────────────────────────────────

export async function loadGeoJsonFromUrl(url: string): Promise<PirZoneCollection> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load GeoJSON from ${url}: ${response.statusText}`);
  }
  return response.json();
}

export function mergeZones(
  base: PirZoneCollection,
  overlay: PirZoneCollection
): PirZoneCollection {
  const existingIds = new Set(base.features.map(f => f.id));
  const newFeatures = overlay.features.filter(f => !existingIds.has(f.id));
  return {
    ...base,
    features: [...base.features, ...newFeatures],
  };
}
