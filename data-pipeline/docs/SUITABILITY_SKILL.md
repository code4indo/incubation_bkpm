---
name: bkpm-suitability-overlay
description: |
  Weighted Overlay GIS Suitability Analysis for Indonesian investment zones.
  21-layer spatial, socio-economic, regulatory, and PIR-specific scoring engine
  for calculating province-level investment suitability by sector.
  Use when: (1) Assessing investment location suitability, (2) Comparing provinces
  for specific sectors, (3) Building GIS-based feasibility analysis, (4) Needing
  reproducible multi-criteria decision analysis (MCDA) for BKPM/PMDN projects.
---

# Weighted Overlay GIS — Investment Suitability Engine

## Quick Reference

```typescript
import { 
  calculateWeightedScore,
  rankProvincesForSector,
  getTopProvincesForProject 
} from '@/data/suitability/provincialSuitabilityIndices';

// Score a province for a sector
const score = calculateWeightedScore(provinceIndices, undefined, 'Manufacturing');

// Rank all provinces
const ranked = rankProvincesForSector('Agroindustry');

// Get top 5 with match reasons
const top5 = getTopProvincesForProject('Digital', 5);
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                21 GIS LAYERS (4 categories)                 │
├───────────────┬───────────────┬───────────────┬─────────────┤
│   Spatial     │ Socio-Econ    │  Regulatory   │   PIR       │
│   (64%)       │   (30%)       │  (binary)     │   (18%)     │
├───────────────┼───────────────┼───────────────┼─────────────┤
│ Road network  │ Pop density   │ Zoning (RTRW) │ Investment  │
│ Port distance │ Workforce     │ Protected area│ Project     │
│ Airport dist  │ UMR cost      │ Forest status │ density     │
│ KI proximity  │ Education     │ Mining overlap│ Sector spec │
│ Land cover    │ Economic act  │               │ Commodities │
│ Slope/DEM     │               │               │             │
│ Flood risk    │               │               │             │
│ Utilities     │               │               │             │
└───────────────┴───────────────┴───────────────┴─────────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │  Weighted Sum        │
                   │  Σ(layer × weight)   │
                   │  × constraint_mult   │
                   └──────────────────────┘
                              │
                              ▼
                        Score: 0-100
```

## Layer Status

| Status | Count | Layers |
|--------|-------|--------|
| 🟢 Ready | 14 | Port, Airport, KI, Pop, Workforce, UMR, Investment, Project Density, Sector Spec, Commodity, Road (proxy), Land (proxy), Slope (proxy), Flood (proxy) |
| 🟡 Available | 3 | Education (BPS), Economic Activity (BPS), Protected Areas (UNEP) |
| 🔴 Missing | 1 | Utilities (PLN/Kominfo no open data) |
| 🔒 Restricted | 3 | Zoning RTRW (ATR/BPN login), Forest (KLHK), Mining (ESDM) |

## Formula

```
Suitability = Σ(opportunity_layer_i × weight_i) × constraint_multiplier

Where:
  opportunity layers = 17 spatial + socio-economic + PIR layers
  weights sum to 100% (default configuration)
  constraint_multiplier = 0 if any constraint violated, else 1

Sector adjustment:
  Manufacturing: port ↑20%, UMR ↑10%
  Agroindustry:  commodity ↑25%, land ↑15%
  Mining:        slope ↓-10%, mining constraint checked
  Tourism:       airport ↑15%, protected area relaxed
  Energy:        utility ↑10%, KI ↑10%
  Digital:       education ↑20%, utility ↑15%
```

## Data Sources

| Layer | Source | URL | Status |
|-------|--------|-----|--------|
| Ports | Pelindo + existing | — | Ready |
| Airports | Kemenhub + existing | — | Ready |
| KI Polygons | Kemenperin | satudata.kemenperin.go.id | Ready |
| Population | BPS Sensus 2020 | bps.go.id | Ready |
| Workforce | BPS | bps.go.id | Ready |
| UMR | Kemenaker | — | Ready |
| Education | BPS APS | bps.go.id/subjek/28 | Available |
| PDRB | BPS | bps.go.id/exim.html | Available |
| Slope/DEM | NASA SRTM | earthexplorer.usgs.gov | Available |
| Land Cover | ESA WorldCover | esa-worldcover.org | Available |
| Flood | BNPB InaRISK | inarisk.bnpb.go.id | Available |
| Protected | UNEP-WCMC | protectedplanet.net | Available |

## AI Reproduction

To reproduce this analysis in another system:

1. **Load data** from `app/src/data/suitability/provincialSuitabilityIndices.ts`
2. **Call `calculateWeightedScore()`** with target sector
3. **Use `rankProvincesForSector()`** for comparative analysis
4. **Use `getTopProvincesForProject()`** for recommendations

For adding new provinces or updating data:
1. Modify the `provinces_data` array in the generator (Python script)
2. Re-run generator to update `provincialSuitabilityIndices.ts`
3. Update `layerRegistry.ts` if new layers added

## File Structure

```
app/src/data/suitability/
├── provincialSuitabilityIndices.ts    # 34 provinces × 21 indices
├── layerRegistry.ts                  # Metadata for all 21 layers

app/src/sections/
└── SuitabilityOverlayPanel.tsx       # UI visualization component

data-pipeline/layers/
└── investment-suitability-catalog.yml # Full catalog with acquisition URLs
```

## Weight Configuration

Default weights (sector = generic):
```
Spatial:        64%
  roadNetworkIndex          12%
  portDistanceIndex         10%
  airportDistanceIndex       8%
  industrialZoneIndex       15%
  landSuitabilityIndex       8%
  slopeIndex                 6%
  floodRiskIndex             5%
  utilityIndex               5%

Socio-Economic: 30%
  populationDensityIndex     8%
  workforceIndex             8%
  umrCompetitivenessIndex    5%
  educationIndex             4%
  economicActivityIndex    5%

PIR:            18%
  investmentRealizationIndex 5%
  projectDensityIndex        4%
  sectorSpecializationScore  4%
  commodityMatchScore        4%
```

## Constraints (Binary Multiplier)

Any constraint = 0 → overall score = 0 (exclusion)

| Constraint | Source | Access |
|------------|--------|--------|
| zoningCompliance | ATR/BPN RTRW | Restricted — login |
| protectedAreaConstraint | KLHK / UNEP | Open data available |
| forestConstraint | KLHK / GFW | Open data available |
| miningConstraint | ESDM / BIG | Semi-open |

## Enhancement Roadmap

### Phase 1 (Done)
- [x] 14 layers ready
- [x] Sector-specific weight overrides
- [x] Provincial scoring engine
- [x] UI visualization panel

### Phase 2 (Next)
- [ ] BPS API integration (education, PDRB)
- [ ] NASA SRTM DEM → slope calculation
- [ ] ESA WorldCover → land cover reclassification
- [ ] BNPB flood risk → province-level proxy

### Phase 3 (Requires institutional access)
- [ ] ATR/BPN RTRW zone query
- [ ] KLHK protected area polygons
- [ ] ESDM mining concession overlay
- [ ] PLN utility network data
