/**
 * Kemenperin Kawasan Industri GeoJSON Loader
 * Loads official 2025 Kawasan Industri Eksisting from Kemenperin Satu Data
 * Source: https://satudata.kemenperin.go.id/id/dataset/2025-peta-kawasan-industri-eksisting-skala-1-50-000
 */

import kiGeoJson from './kemenperinKawasanIndustri.geojson';

export interface KawasanIndustriFeature {
  type: 'Feature';
  id: string;
  properties: {
    name: string;
    pengelola: string;
    kabupaten: string;
    provinsi: string;
    luas_ha: string;
    id_ki: number;
    fcode: string;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

export interface KawasanIndustriCollection {
  type: 'FeatureCollection';
  metadata: {
    title: string;
    source: string;
    url: string;
    date: string;
    scale: string;
    legal_basis: string;
  };
  features: KawasanIndustriFeature[];
}

const collection = kiGeoJson as KawasanIndustriCollection;

export function getKawasanIndustriFeatures(): KawasanIndustriFeature[] {
  return collection.features;
}

export function getKawasanIndustriCollection(): KawasanIndustriCollection {
  return collection;
}

/** Get unique KI count (some KI have multiple polygons) */
export function getUniqueKICount(): number {
  return new Set(collection.features.map(f => f.properties.id_ki)).size;
}

/** Get KI by province */
export function getKIByProvince(provinsi: string): KawasanIndustriFeature[] {
  return collection.features.filter(f => f.properties.provinsi === provinsi);
}

/** Get all provinces that have KI */
export function getKIProvinces(): string[] {
  return [...new Set(collection.features.map(f => f.properties.provinsi))].sort();
}
