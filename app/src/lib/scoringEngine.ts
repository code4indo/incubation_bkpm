import type { Region, Project, Port, Airport } from '@/types';

// Haversine distance between two points in km
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find nearest port distance
export function nearestPortDistance(regionLat: number, regionLng: number, ports: { lat: number; lng: number }[]): number {
  let minDist = Infinity;
  for (const port of ports) {
    const d = haversineDistance(regionLat, regionLng, port.lat, port.lng);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

// Find nearest airport distance
export function nearestAirportDistance(regionLat: number, regionLng: number, airports: { lat: number; lng: number }[]): number {
  let minDist = Infinity;
  for (const airport of airports) {
    const d = haversineDistance(regionLat, regionLng, airport.lat, airport.lng);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

// Normalize value to 0-100 range
export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 50;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

export interface RegionalScore {
  regionId: number;
  regionName: string;
  coordinates: { lat: number; lng: number };
  overallScore: number;
  infrastructureScore: number;
  marketAccessScore: number;
  workforceScore: number;
  investmentClimateScore: number;
  logisticsScore: number;
  portDistance: number;
  airportDistance: number;
  color: string;
  radius: number;
}

// Compute comprehensive regional scores
export function computeRegionalScores(
  regions: Region[],
  ports: { lat: number; lng: number }[],
  airports: { lat: number; lng: number }[]
): RegionalScore[] {
  // Find min/max for normalization
  const allUmr = regions.map(r => r.umr);
  const allInvestment = regions.map(r => r.investmentRealization);
  const allExport = regions.map(r => r.export);
  const allWorkforce = regions.map(r => r.workforce);

  const minUmr = Math.min(...allUmr);
  const maxUmr = Math.max(...allUmr);
  const minInvestment = Math.min(...allInvestment);
  const maxInvestment = Math.max(...allInvestment);
  const minExport = Math.min(...allExport);
  const maxExport = Math.max(...allExport);
  const minWorkforce = Math.min(...allWorkforce);
  const maxWorkforce = Math.max(...allWorkforce);

  return regions.map(region => {
    // Infrastructure score (from BKPM data + distance to ports/airports)
    const portDist = nearestPortDistance(region.coordinates.lat, region.coordinates.lng, ports);
    const airportDist = nearestAirportDistance(region.coordinates.lat, region.coordinates.lng, airports);

    // Logistics: closer to port/airport = higher score (inverse, max 500km)
    const portScore = normalize(500 - portDist, 0, 500);
    const airportScore = normalize(500 - airportDist, 0, 500);
    const logisticsScore = (portScore * 0.6 + airportScore * 0.4);

    // Infrastructure composite
    const infraComposite = (region.infrastructureScore * 0.5 + logisticsScore * 0.5);

    // Market access (export volume + import volume as proxy)
    const marketScore = normalize(region.export, minExport, maxExport);

    // Workforce (larger workforce + lower UMR = better for investment)
    const workforceSizeScore = normalize(region.workforce, minWorkforce, maxWorkforce);
    const costScore = normalize(maxUmr - region.umr, 0, maxUmr - minUmr); // lower UMR = higher score
    const workforceComposite = (workforceSizeScore * 0.6 + costScore * 0.4);

    // Investment climate (realization + project count)
    const investmentScore = normalize(region.investmentRealization, minInvestment, maxInvestment);
    const projectCountScore = normalize(region.projects, 5, 50);
    const climateComposite = (investmentScore * 0.6 + projectCountScore * 0.4);

    // Overall composite score (weighted)
    const overallScore = Math.round(
      infraComposite * 0.30 +
      marketScore * 0.25 +
      workforceComposite * 0.25 +
      climateComposite * 0.20
    );

    // Determine color based on score
    let color: string;
    if (overallScore >= 75) color = '#22c55e';      // Green
    else if (overallScore >= 55) color = '#eab308';  // Yellow
    else if (overallScore >= 40) color = '#f97316';  // Orange
    else color = '#ef4444';                          // Red

    // Radius proportional to score
    const radius = 8 + (overallScore / 100) * 20;

    return {
      regionId: region.id,
      regionName: region.name,
      coordinates: region.coordinates,
      overallScore,
      infrastructureScore: Math.round(infraComposite),
      marketAccessScore: Math.round(marketScore),
      workforceScore: Math.round(workforceComposite),
      investmentClimateScore: Math.round(climateComposite),
      logisticsScore: Math.round(logisticsScore),
      portDistance: Math.round(portDist),
      airportDistance: Math.round(airportDist),
      color,
      radius
    };
  });
}

// Score a project-region alignment
export interface ProjectRegionAlignment {
  projectName: string;
  regionName: string;
  alignmentScore: number;
  reasons: string[];
}

export function scoreProjectRegionAlignment(project: Project, region: Region): ProjectRegionAlignment {
  const reasons: string[] = [];
  let score = 50; // Base score

  // ── PRIMARY: Geospatial proximity to region centroid ──
  const distanceKm = haversineDistance(
    project.coordinates.lat, project.coordinates.lng,
    region.coordinates.lat, region.coordinates.lng
  );
  
  // Score proximity: 0-100km = +25, 100-300km = +15, 300-600km = +8, 600-1000km = +3, >1000km = 0
  if (distanceKm <= 100) {
    score += 25;
    reasons.push(`Project is within 100km of ${region.name} (${Math.round(distanceKm)}km)`);
  } else if (distanceKm <= 300) {
    score += 15;
    reasons.push(`Project is within 300km of ${region.name} (${Math.round(distanceKm)}km)`);
  } else if (distanceKm <= 600) {
    score += 8;
    reasons.push(`Project is within 600km of ${region.name}`);
  } else if (distanceKm <= 1000) {
    score += 3;
    reasons.push(`Project is within 1000km of ${region.name}`);
  }

  // ── SECONDARY: Sector match with region top sectors ──
  if (region.topSectors.some(s =>
    project.sector.toLowerCase().includes(s.toLowerCase()) ||
    s.toLowerCase().includes(project.sector.toLowerCase())
  )) {
    score += 15;
    reasons.push(`Sector "${project.sector}" matches regional strength`);
  }

  // Check commodities alignment
  if (project.tags.some(tag =>
    region.commodities.some(c => c.toLowerCase().includes(tag.toLowerCase()))
  )) {
    score += 10;
    reasons.push("Commodity supply chain available in region");
  }

  // Infrastructure score contribution
  if (region.infrastructureScore >= 75) {
    score += 8;
    reasons.push("High infrastructure readiness");
  } else if (region.infrastructureScore >= 60) {
    score += 4;
    reasons.push("Moderate infrastructure");
  }

  // Workforce availability
  if (region.workforce > 2000000) {
    score += 5;
    reasons.push("Large workforce pool available");
  }

  // Cost competitiveness (lower UMR)
  if (region.umr < 3000000) {
    score += 5;
    reasons.push("Competitive labor costs");
  }

  // Investment activity
  if (region.investmentRealization > 20) {
    score += 5;
    reasons.push("Active investment destination");
  }

  return {
    projectName: project.nameEn,
    regionName: region.name,
    alignmentScore: Math.min(100, Math.max(0, score)),
    reasons
  };
}
