/**
 * TECHNICAL ASSESSMENT ENGINE
 * 
 * Evaluates technical feasibility, site readiness, resource availability,
 * infrastructure access, and environmental factors for investment projects.
 * 
 * Critical for investor due diligence on project viability.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface TechnicalAssessment {
  overallScore: number; // 0-100
  status: 'Fully Ready' | 'Site Preparation' | 'Early Stage' | 'Major Constraints';
  confidence: 'High' | 'Medium' | 'Low';
  details: TechnicalDetails;
  riskFactors: RiskFactor[];
  readiness: ReadinessMatrix;
}

export interface TechnicalDetails {
  siteReadiness: SiteReadiness;
  infrastructureAccess: InfrastructureAccess;
  resourceAvailability: ResourceAvailability;
  environmentalFactors: EnvironmentalFactors;
  workforceAssessment: WorkforceAssessment;
  engineeringReadiness: EngineeringReadiness;
}

export interface SiteReadiness {
  landStatus: 'Owned' | 'HGU Lease' | 'HGB' | 'In Acquisition' | 'Unacquired';
  landAreaHectares: number;
  topography: 'Flat' | 'Rolling' | 'Hilly' | 'Mountainous';
  soilCondition: 'Stable' | 'Soft Soil' | 'Peat' | 'Rocky';
  floodRisk: 'Low' | 'Medium' | 'High';
  seismicZone: 'Low' | 'Moderate' | 'High' | 'Very High';
  sitePreparationCostPct: number; // % of total investment
}

export interface InfrastructureAccess {
  nearestPort: PortAccess;
  nearestAirport: AirportAccess;
  highwayAccess: RoadAccess;
  gridConnection: GridConnection;
  waterSupply: WaterSupply;
  telecomInfrastructure: TelecomInfrastructure;
  compositeScore: number; // 0-100
}

export interface PortAccess {
  name: string;
  distanceKm: number;
  type: 'Deep Sea' | 'Feeder' | 'River';
  capacity: string;
  score: number; // 0-100
}

export interface AirportAccess {
  name: string;
  distanceKm: number;
  type: 'International' | 'Domestic' | 'General Aviation';
  score: number;
}

export interface RoadAccess {
  nearestHighway: string;
  distanceKm: number;
  roadQuality: 'Toll' | 'National' | 'Provincial' | 'Local';
  score: number;
}

export interface GridConnection {
  plnSubstation: string;
  distanceKm: number;
  availableCapacityMW: number;
  requiredCapacityMW: number;
  connectionQueue: number; // months
  score: number;
}

export interface WaterSupply {
  source: 'River' | 'Groundwater' | 'PDAM' | 'Sea Water' | 'Rain Harvesting';
  availability: 'Abundant' | 'Adequate' | 'Limited' | 'Scarce';
  permitRequired: boolean;
  permitStatus: 'Approved' | 'In Process' | 'Required';
  score: number;
}

export interface TelecomInfrastructure {
  fiberOptic: boolean;
  fiberDistanceKm: number;
  fourGCoverage: boolean;
  fiveGReady: boolean;
  score: number;
}

export interface ResourceAvailability {
  primaryResource: ResourceInfo;
  secondaryResources: ResourceInfo[];
  supplyChainProximity: number; // 0-100
  logisticsCostEstimate: string;
}

export interface ResourceInfo {
  type: string;
  availability: 'Abundant' | 'Adequate' | 'Limited' | 'Import Dependent';
  localProduction: string;
  nearestSource: string;
  distanceKm: number;
}

export interface EnvironmentalFactors {
  climate: 'Tropical' | 'Monsoon' | 'Equatorial' | 'Highland';
  annualRainfallMm: number;
  temperatureRange: string;
  humidity: 'Low' | 'Medium' | 'High';
  environmentalRiskScore: number; // 0-100, higher = less risk
  carbonFootprint: string;
  esgRating: 'A' | 'B' | 'C' | 'D' | 'Unrated';
}

export interface WorkforceAssessment {
  localWorkforce: number;
  skilledLaborAvailability: number; // 0-100
  trainingRequired: boolean;
  trainingDuration: string;
  umrLocal: number; // monthly IDR
  umrCompetitiveness: string; // vs national average
  talentPoolScore: number;
}

export interface EngineeringReadiness {
  feasibilityStudy: 'Completed' | 'In Progress' | 'Not Started';
  detailEngineering: 'Completed' | 'In Progress' | 'Not Started';
  epcdContractor: 'Selected' | 'In Tender' | 'Not Selected';
  constructionReady: boolean;
  estimatedConstructionDuration: string;
  technologyPartner: string;
}

export interface RiskFactor {
  category: string;
  level: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  mitigation?: string;
}

export interface ReadinessMatrix {
  landReadiness: number;
  infraReadiness: number;
  utilityReadiness: number;
  envReadiness: number;
  workforceReadiness: number;
  engineeringReadiness: number;
}

// ============================================================================
// PROJECT-SPECIFIC TECHNICAL DATA
// ============================================================================

const PROJECT_TECHNICAL_DATA: Record<number, Partial<TechnicalDetails>> = {
  1: { // Batang Integrated Industrial Zone
    siteReadiness: {
      landStatus: 'HGU Lease', landAreaHectares: 4300,
      topography: 'Flat', soilCondition: 'Stable', floodRisk: 'Low', seismicZone: 'Moderate',
      sitePreparationCostPct: 3,
    },
    infrastructureAccess: {
      nearestPort: { name: 'Tanjung Emas Port', distanceKm: 75, type: 'Deep Sea', capacity: '5M TEU', score: 85 },
      nearestAirport: { name: 'Adi Soemarmo', distanceKm: 90, type: 'Domestic', score: 70 },
      highwayAccess: { nearestHighway: 'Trans Java Toll', distanceKm: 8, roadQuality: 'Toll', score: 90 },
      gridConnection: { plnSubstation: 'Batang GITET', distanceKm: 15, availableCapacityMW: 500, requiredCapacityMW: 200, connectionQueue: 6, score: 80 },
      waterSupply: { source: 'River', availability: 'Abundant', permitRequired: true, permitStatus: 'Approved', score: 90 },
      telecomInfrastructure: { fiberOptic: true, fiberDistanceKm: 5, fourGCoverage: true, fiveGReady: true, score: 85 },
      compositeScore: 83,
    },
    resourceAvailability: {
      primaryResource: { type: 'Industrial Land', availability: 'Abundant', localProduction: '4,300 ha available', nearestSource: 'On-site', distanceKm: 0 },
      secondaryResources: [
        { type: 'Steel Raw Materials', availability: 'Adequate', localProduction: 'Local scrap + import', nearestSource: 'Cilegon', distanceKm: 350 },
        { type: 'Natural Gas', availability: 'Adequate', localProduction: 'Cirebon gas field', nearestSource: 'Cirebon', distanceKm: 120 },
      ],
      supplyChainProximity: 78, logisticsCostEstimate: '8-12% of COGS',
    },
    environmentalFactors: {
      climate: 'Tropical', annualRainfallMm: 2500, temperatureRange: '24-32°C', humidity: 'High',
      environmentalRiskScore: 82, carbonFootprint: 'Moderate - industrial emissions managed', esgRating: 'B',
    },
    workforceAssessment: {
      localWorkforce: 3400000, skilledLaborAvailability: 65, trainingRequired: true, trainingDuration: '3-6 months',
      umrLocal: 2800000, umrCompetitiveness: '20% below Jakarta - highly competitive', talentPoolScore: 70,
    },
    engineeringReadiness: {
      feasibilityStudy: 'Completed', detailEngineering: 'In Progress', epcdContractor: 'In Tender',
      constructionReady: false, estimatedConstructionDuration: '18-24 months', technologyPartner: 'JFE Steel / POSCO',
    },
  },
  2: { // Hyperscale Data Center
    siteReadiness: {
      landStatus: 'HGB', landAreaHectares: 50,
      topography: 'Flat', soilCondition: 'Stable', floodRisk: 'Low', seismicZone: 'Moderate',
      sitePreparationCostPct: 5,
    },
    infrastructureAccess: {
      nearestPort: { name: 'Tanjung Priok', distanceKm: 45, type: 'Deep Sea', capacity: '15M TEU', score: 90 },
      nearestAirport: { name: 'Soekarno-Hatta', distanceKm: 25, type: 'International', score: 95 },
      highwayAccess: { nearestHighway: 'Jakarta-Cikampek Toll', distanceKm: 3, roadQuality: 'Toll', score: 95 },
      gridConnection: { plnSubstation: 'Cibitung High Voltage', distanceKm: 8, availableCapacityMW: 200, requiredCapacityMW: 150, connectionQueue: 4, score: 85 },
      waterSupply: { source: 'PDAM', availability: 'Adequate', permitRequired: true, permitStatus: 'In Process', score: 75 },
      telecomInfrastructure: { fiberOptic: true, fiberDistanceKm: 2, fourGCoverage: true, fiveGReady: true, score: 95 },
      compositeScore: 89,
    },
    resourceAvailability: {
      primaryResource: { type: 'Electricity', availability: 'Adequate', localProduction: 'PLN grid + captive solar', nearestSource: 'Cibitung substation', distanceKm: 8 },
      secondaryResources: [
        { type: 'Fiber Optic', availability: 'Abundant', localProduction: 'Multiple ISPs', nearestSource: 'On-site', distanceKm: 2 },
      ],
      supplyChainProximity: 92, logisticsCostEstimate: '3-5% of COGS',
    },
    environmentalFactors: {
      climate: 'Tropical', annualRainfallMm: 1800, temperatureRange: '25-33°C', humidity: 'High',
      environmentalRiskScore: 78, carbonFootprint: 'Targeted net-zero with renewable PPA', esgRating: 'A',
    },
    workforceAssessment: {
      localWorkforce: 4500000, skilledLaborAvailability: 85, trainingRequired: false, trainingDuration: '1-3 months',
      umrLocal: 4900000, umrCompetitiveness: 'Jakarta UMR - high but talent abundant', talentPoolScore: 88,
    },
    engineeringReadiness: {
      feasibilityStudy: 'Completed', detailEngineering: 'Completed', epcdContractor: 'Selected',
      constructionReady: true, estimatedConstructionDuration: '12-15 months', technologyPartner: 'Mitsubishi Electric',
    },
  },
  3: { // Palm Oil Agroindustry
    siteReadiness: {
      landStatus: 'HGU Lease', landAreaHectares: 12000,
      topography: 'Rolling', soilCondition: 'Stable', floodRisk: 'Medium', seismicZone: 'Low',
      sitePreparationCostPct: 2,
    },
    infrastructureAccess: {
      nearestPort: { name: 'Dumai Port', distanceKm: 85, type: 'Feeder', capacity: '500K TEU', score: 65 },
      nearestAirport: { name: 'Sultan Syarif Kasim II', distanceKm: 110, type: 'Domestic', score: 55 },
      highwayAccess: { nearestHighway: 'Trans Sumatra', distanceKm: 20, roadQuality: 'National', score: 60 },
      gridConnection: { plnSubstation: 'Pekanbaru', distanceKm: 45, availableCapacityMW: 50, requiredCapacityMW: 30, connectionQueue: 8, score: 65 },
      waterSupply: { source: 'River', availability: 'Abundant', permitRequired: true, permitStatus: 'Approved', score: 85 },
      telecomInfrastructure: { fiberOptic: false, fiberDistanceKm: 25, fourGCoverage: true, fiveGReady: false, score: 55 },
      compositeScore: 64,
    },
    resourceAvailability: {
      primaryResource: { type: 'FFB (Fresh Fruit Bunches)', availability: 'Abundant', localProduction: '120K ha plantation', nearestSource: 'On-site', distanceKm: 0 },
      secondaryResources: [
        { type: 'Processing Chemicals', availability: 'Adequate', localProduction: 'Imported + Surabaya', nearestSource: 'Surabaya', distanceKm: 1200 },
      ],
      supplyChainProximity: 70, logisticsCostEstimate: '10-15% of COGS',
    },
    environmentalFactors: {
      climate: 'Tropical', annualRainfallMm: 2800, temperatureRange: '24-31°C', humidity: 'High',
      environmentalRiskScore: 65, carbonFootprint: 'Low with methane capture - RSPO certified', esgRating: 'A',
    },
    workforceAssessment: {
      localWorkforce: 2100000, skilledLaborAvailability: 45, trainingRequired: true, trainingDuration: '6-12 months',
      umrLocal: 3200000, umrCompetitiveness: '10% below national average - competitive', talentPoolScore: 55,
    },
    engineeringReadiness: {
      feasibilityStudy: 'Completed', detailEngineering: 'Completed', epcdContractor: 'Selected',
      constructionReady: true, estimatedConstructionDuration: '8-12 months', technologyPartner: 'Andritz',
    },
  },
  4: { // Geothermal Power Plant
    siteReadiness: {
      landStatus: 'In Acquisition', landAreaHectares: 500,
      topography: 'Mountainous', soilCondition: 'Rocky', floodRisk: 'Low', seismicZone: 'High',
      sitePreparationCostPct: 8,
    },
    infrastructureAccess: {
      nearestPort: { name: 'Teluk Bayur', distanceKm: 180, type: 'Deep Sea', capacity: '300K TEU', score: 40 },
      nearestAirport: { name: 'Minangkabau', distanceKm: 120, type: 'International', score: 50 },
      highwayAccess: { nearestHighway: 'Padang-Solok', distanceKm: 35, roadQuality: 'National', score: 50 },
      gridConnection: { plnSubstation: 'Muara Laboh', distanceKm: 25, availableCapacityMW: 100, requiredCapacityMW: 350, connectionQueue: 12, score: 55 },
      waterSupply: { source: 'Groundwater', availability: 'Abundant', permitRequired: true, permitStatus: 'Approved', score: 80 },
      telecomInfrastructure: { fiberOptic: false, fiberDistanceKm: 40, fourGCoverage: true, fiveGReady: false, score: 45 },
      compositeScore: 53,
    },
    resourceAvailability: {
      primaryResource: { type: 'Geothermal Steam', availability: 'Abundant', localProduction: '350 MW potential confirmed', nearestSource: 'On-site', distanceKm: 0 },
      secondaryResources: [
        { type: 'Drilling Equipment', availability: 'Limited', localProduction: 'Import dependent', nearestSource: 'Jakarta/Singapore', distanceKm: 900 },
      ],
      supplyChainProximity: 45, logisticsCostEstimate: '15-20% of COGS',
    },
    environmentalFactors: {
      climate: 'Highland', annualRainfallMm: 3200, temperatureRange: '15-25°C', humidity: 'High',
      environmentalRiskScore: 75, carbonFootprint: 'Very low - renewable baseload', esgRating: 'A',
    },
    workforceAssessment: {
      localWorkforce: 950000, skilledLaborAvailability: 35, trainingRequired: true, trainingDuration: '12-18 months',
      umrLocal: 2600000, umrCompetitiveness: '30% below Jakarta - very competitive', talentPoolScore: 40,
    },
    engineeringReadiness: {
      feasibilityStudy: 'Completed', detailEngineering: 'In Progress', epcdContractor: 'In Tender',
      constructionReady: false, estimatedConstructionDuration: '36-48 months', technologyPartner: 'Ormat / Toshiba',
    },
  },
  5: { // Nusantara Smart City
    siteReadiness: {
      landStatus: 'Owned', landAreaHectares: 2560,
      topography: 'Rolling', soilCondition: 'Stable', floodRisk: 'Low', seismicZone: 'Low',
      sitePreparationCostPct: 12,
    },
    infrastructureAccess: {
      nearestPort: { name: 'Balikpapan', distanceKm: 120, type: 'Deep Sea', capacity: '2M TEU', score: 50 },
      nearestAirport: { name: 'APT Pranoto', distanceKm: 60, type: 'Domestic', score: 55 },
      highwayAccess: { nearestHighway: 'Balikpapan-Samarinda', distanceKm: 40, roadQuality: 'National', score: 50 },
      gridConnection: { plnSubstation: 'New Capital Grid', distanceKm: 20, availableCapacityMW: 300, requiredCapacityMW: 500, connectionQueue: 18, score: 50 },
      waterSupply: { source: 'River', availability: 'Adequate', permitRequired: true, permitStatus: 'In Process', score: 70 },
      telecomInfrastructure: { fiberOptic: true, fiberDistanceKm: 30, fourGCoverage: false, fiveGReady: true, score: 60 },
      compositeScore: 56,
    },
    resourceAvailability: {
      primaryResource: { type: 'Construction Materials', availability: 'Adequate', localProduction: 'Limited local - Kalimantan import', nearestSource: 'Balikpapan', distanceKm: 120 },
      secondaryResources: [
        { type: 'IT Equipment', availability: 'Import Dependent', localProduction: 'None', nearestSource: 'Jakarta/Singapore', distanceKm: 1250 },
      ],
      supplyChainProximity: 40, logisticsCostEstimate: '20-25% of COGS (greenfield site)',
    },
    environmentalFactors: {
      climate: 'Tropical', annualRainfallMm: 2200, temperatureRange: '25-33°C', humidity: 'High',
      environmentalRiskScore: 70, carbonFootprint: 'Targeted net-zero smart city', esgRating: 'A',
    },
    workforceAssessment: {
      localWorkforce: 850000, skilledLaborAvailability: 30, trainingRequired: true, trainingDuration: '12-24 months',
      umrLocal: 3100000, umrCompetitiveness: '15% below national average', talentPoolScore: 35,
    },
    engineeringReadiness: {
      feasibilityStudy: 'Completed', detailEngineering: 'In Progress', epcdContractor: 'In Tender',
      constructionReady: false, estimatedConstructionDuration: '60-120 months (phased)', technologyPartner: 'Various (Smart City Consortium)',
    },
  },
  6: { // HPAL Nickel Processing
    siteReadiness: {
      landStatus: 'HGU Lease', landAreaHectares: 200,
      topography: 'Hilly', soilCondition: 'Rocky', floodRisk: 'Low', seismicZone: 'Moderate',
      sitePreparationCostPct: 10,
    },
    infrastructureAccess: {
      nearestPort: { name: 'Morowali Port', distanceKm: 25, type: 'Deep Sea', capacity: '1M TEU', score: 80 },
      nearestAirport: { name: 'Kasiguncu', distanceKm: 80, type: 'Domestic', score: 50 },
      highwayAccess: { nearestHighway: 'Morowali Ring Road', distanceKm: 15, roadQuality: 'Provincial', score: 55 },
      gridConnection: { plnSubstation: 'Morowali Industrial', distanceKm: 10, availableCapacityMW: 400, requiredCapacityMW: 300, connectionQueue: 6, score: 80 },
      waterSupply: { source: 'Sea Water', availability: 'Abundant', permitRequired: true, permitStatus: 'Approved', score: 90 },
      telecomInfrastructure: { fiberOptic: true, fiberDistanceKm: 12, fourGCoverage: true, fiveGReady: false, score: 65 },
      compositeScore: 70,
    },
    resourceAvailability: {
      primaryResource: { type: 'Nickel Ore (Limonite)', availability: 'Abundant', localProduction: 'IMIP integrated supply', nearestSource: 'IMIP mine', distanceKm: 15 },
      secondaryResources: [
        { type: 'Sulfuric Acid', availability: 'Adequate', localProduction: 'On-site acid plant', nearestSource: 'On-site', distanceKm: 0 },
        { type: 'Hydrogen', availability: 'Adequate', localProduction: 'On-site electrolysis', nearestSource: 'On-site', distanceKm: 0 },
      ],
      supplyChainProximity: 85, logisticsCostEstimate: '5-8% of COGS (integrated park)',
    },
    environmentalFactors: {
      climate: 'Tropical', annualRainfallMm: 2000, temperatureRange: '25-32°C', humidity: 'High',
      environmentalRiskScore: 60, carbonFootprint: 'Moderate - HPAL has tailings management', esgRating: 'B',
    },
    workforceAssessment: {
      localWorkforce: 450000, skilledLaborAvailability: 25, trainingRequired: true, trainingDuration: '12-18 months',
      umrLocal: 2900000, umrCompetitiveness: '20% below Jakarta - competitive but limited talent pool', talentPoolScore: 35,
    },
    engineeringReadiness: {
      feasibilityStudy: 'Completed', detailEngineering: 'Completed', epcdContractor: 'Selected',
      constructionReady: true, estimatedConstructionDuration: '24-30 months', technologyPartner: 'Huayou / Tsingshan',
    },
  },
};

// ============================================================================
// MAIN ASSESSMENT FUNCTION
// ============================================================================

export function assessTechnical(projectId: number): TechnicalAssessment {
  const data = PROJECT_TECHNICAL_DATA[projectId];
  
  if (!data) {
    return createDefaultAssessment();
  }
  
  const site = data.siteReadiness!;
  const infra = data.infrastructureAccess!;
  const env = data.environmentalFactors!;
  const workforce = data.workforceAssessment!;
  const eng = data.engineeringReadiness!;
  
  // Calculate readiness scores
  const landReadiness = calculateLandReadiness(site);
  const infraReadiness = infra.compositeScore;
  const utilityReadiness = Math.round((infra.gridConnection.score + infra.waterSupply.score) / 2);
  const envReadiness = env.environmentalRiskScore;
  const workforceReadiness = workforce.talentPoolScore;
  const engineeringReadiness = calculateEngineeringReadiness(eng);
  
  // Overall score (weighted)
  const overallScore = Math.round(
    landReadiness * 0.15 +
    infraReadiness * 0.20 +
    utilityReadiness * 0.15 +
    envReadiness * 0.10 +
    workforceReadiness * 0.15 +
    engineeringReadiness * 0.25
  );
  
  // Status determination
  let status: TechnicalAssessment['status'];
  if (overallScore >= 75 && engineeringReadiness >= 80) status = 'Fully Ready';
  else if (overallScore >= 60) status = 'Site Preparation';
  else if (overallScore >= 40) status = 'Early Stage';
  else status = 'Major Constraints';
  
  // Risk factors
  const riskFactors: RiskFactor[] = [];
  
  if (site.seismicZone === 'High' || site.seismicZone === 'Very High') {
    riskFactors.push({ category: 'Seismic', level: 'High', description: `Located in ${site.seismicZone} seismic zone`, mitigation: 'Design to SNI 1726 earthquake standards' });
  }
  if (site.floodRisk === 'High') {
    riskFactors.push({ category: 'Flood', level: 'High', description: 'High flood risk area', mitigation: 'Elevate critical infrastructure, install drainage' });
  }
  if (infra.gridConnection.requiredCapacityMW > infra.gridConnection.availableCapacityMW) {
    riskFactors.push({ category: 'Power', level: 'Critical', description: `Required ${infra.gridConnection.requiredCapacityMW}MW but only ${infra.gridConnection.availableCapacityMW}MW available`, mitigation: 'Build captive power or negotiate PLN grid expansion' });
  }
  if (workforce.skilledLaborAvailability < 50) {
    riskFactors.push({ category: 'Workforce', level: 'High', description: `Skilled labor availability only ${workforce.skilledLaborAvailability}%`, mitigation: 'Comprehensive training program + expatriate team initially' });
  }
  if (infra.compositeScore < 60) {
    riskFactors.push({ category: 'Infrastructure', level: 'Medium', description: 'Limited infrastructure access', mitigation: 'Budget for infrastructure development in project cost' });
  }
  
  return {
    overallScore: Math.min(100, overallScore),
    status,
    confidence: data ? 'High' : 'Medium',
    details: data as TechnicalDetails,
    riskFactors,
    readiness: {
      landReadiness,
      infraReadiness,
      utilityReadiness,
      envReadiness,
      workforceReadiness,
      engineeringReadiness,
    },
  };
}

function calculateLandReadiness(site: SiteReadiness): number {
  let score = 70; // base
  if (site.landStatus === 'Owned') score += 15;
  else if (site.landStatus === 'HGU Lease') score += 10;
  else if (site.landStatus === 'In Acquisition') score -= 10;
  else if (site.landStatus === 'Unacquired') score -= 20;
  
  if (site.topography === 'Flat') score += 10;
  else if (site.topography === 'Mountainous') score -= 10;
  
  if (site.soilCondition === 'Stable') score += 10;
  else if (site.soilCondition === 'Peat') score -= 15;
  
  if (site.floodRisk === 'Low') score += 5;
  else if (site.floodRisk === 'High') score -= 10;
  
  return Math.min(100, Math.max(0, score));
}

function calculateEngineeringReadiness(eng: EngineeringReadiness): number {
  let score = 40; // base
  if (eng.feasibilityStudy === 'Completed') score += 20;
  if (eng.detailEngineering === 'Completed') score += 20;
  else if (eng.detailEngineering === 'In Progress') score += 10;
  if (eng.epcdContractor === 'Selected') score += 10;
  else if (eng.epcdContractor === 'In Tender') score += 5;
  if (eng.constructionReady) score += 10;
  return Math.min(100, score);
}

function createDefaultAssessment(): TechnicalAssessment {
  return {
    overallScore: 50,
    status: 'Early Stage',
    confidence: 'Low',
    details: {} as TechnicalDetails,
    riskFactors: [{ category: 'Data', level: 'Medium', description: 'Limited technical data available' }],
    readiness: { landReadiness: 50, infraReadiness: 50, utilityReadiness: 50, envReadiness: 50, workforceReadiness: 50, engineeringReadiness: 50 },
  };
}
