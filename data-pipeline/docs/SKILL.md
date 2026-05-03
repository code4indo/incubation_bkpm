---
name: bkpm-geospatial-pipeline
description: |
  Reproducible geospatial data collection pipeline for Indonesian investment zones.
  Standardizes the process of discovering, downloading, converting, and validating
  shapefiles/GeoJSON from official government sources (BIG, Kemenperin, ATR/BPN)
  into a unified format for the BKPM AI Incubation Portal.
  
  Use this skill when:
  1. Collecting or updating geospatial data for KEK, KI, or infrastructure layers
  2. Converting shapefiles to GeoJSON for web mapping
  3. Validating geospatial data quality and integrity
  4. Setting up automated data refresh for the investment portal
  5. Any task requiring reproducible geospatial data workflows
---

# BKPM Geospatial Data Pipeline

## Quick Start

```bash
cd data-pipeline/scripts

# Download and convert from BIG MapServer (most stable)
python3 pipeline.py --source big_kawasan_industri --output ../output/

# Download Kemenperin shapefile (most authoritative)
python3 pipeline.py --source kemenperin_kawasan_industri_shapefile --output ../output/

# Run both
python3 pipeline.py --all --output ../output/

# Validate output
python3 validate.py ../output/kemenperin_kawasan_industri.geojson
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA SOURCE CATALOG                          │
│  (config/data-source-catalog.yml)                             │
│  ├─ BIG MapServer        [high reliability]                  │
│  ├─ Kemenperin CKAN      [medium reliability]                │
│  ├─ ATR/BPN GISTARU      [low reliability, needs login]      │
│  └─ Dewan KEK            [metadata only]                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PIPELINE ENGINE                            │
│  (scripts/pipeline.py)                                        │
│  ├─ download    → curl / requests                            │
│  ├─ extract     → unzip                                      │
│  ├─ convert     → pyshp → GeoJSON                            │
│  ├─ normalize   → schema mapping                             │
│  └─ validate    → bbox, geometry, attributes                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    STANDARD OUTPUT                              │
│  (output/*.geojson)                                           │
│  ├─ RFC 7946 compliant                                       │
│  ├─ EPSG:4326 (WGS84)                                        │
│  ├─ Canonical schema (name, province, operator, etc)         │
│  └─ Embedded metadata (source, date, validation)             │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
data-pipeline/
├── config/
│   └── data-source-catalog.yml     # Source URLs, reliability, fallback chains
├── schemas/
│   └── schema-mapping.json         # Field name mapping + normalization rules
├── scripts/
│   ├── pipeline.py                 # Main pipeline (download → convert → validate)
│   └── validate.py                 # Standalone GeoJSON validator
├── docs/
│   └── RUNBOOK.md                  # Full operational guide
├── output/                         # Generated GeoJSON files
└── tests/                          # Validation test fixtures
```

## Source Reliability & Fallback Chain

When collecting data, always try sources in this order:

### Kawasan Industri (KI) Polygons

| Priority | Source | Reliability | Method | Notes |
|----------|--------|-------------|--------|-------|
| 1 | **BIG MapServer** | High | REST API query | Live, always current, no auth |
| 2 | **Kemenperin Shapefile** | Medium | Download ZIP | Most authoritative, URL changes yearly |
| 3 | **ATR/BPN GISTARU** | Low | REST (login) | Legal boundaries, needs credentials |
| 4 | **Cache** | Fallback | Local file | Use if all above fail |

### KEK Polygons

| Priority | Source | Notes |
|----------|--------|-------|
| 1 | BIG Kawasan Khusus (layer 5) | MapServer layer for KEK/pariwisata |
| 2 | ATR/BPN GISTARU | Requires ATR/BPN login |
| 3 | Dewan KEK (kek.go.id) | Metadata only, no polygons |

### Infrastructure Points

| Type | Primary | Fallback |
|------|---------|----------|
| Ports | Pelindo website | Wikipedia + OSM |
| Airports | Kemenhub website | Wikipedia + OSM |
| Toll Roads | PUPR website | OpenStreetMap |

## Handling Common Failures

### Case 1: BIG MapServer Timeout
```
[ERROR] MapServer query failed: Connection timeout
→ Action: Retry with smaller batch size (50 instead of 200)
→ Action: If still failing, try next source in chain (Kemenperin)
```

### Case 2: Kemenperin UUID Changed
```
[ERROR] Download failed: 404
→ Action: Open browser, navigate to portal search page
→ Action: Find new dataset URL via CKAN API or Playwright
→ Action: Update config/data-source-catalog.yml with new UUID
```

### Case 3: Shapefile Field Names Changed
```
[ERROR] Field "NAMOBJ" not found
→ Action: Inspect shapefile fields with pyshp first
→ Action: Update schemas/schema-mapping.json with new field names
→ Action: Re-run pipeline
```

### Case 4: PolygonZ Geometry Issues
```
[WARN] Shape type 15 (PolygonZ) detected
→ Action: Extract x,y only — discard z,m coordinates
→ Action: Handle multi-ring via shape.parts[]
→ Action: Convert to GeoJSON Polygon or MultiPolygon
```

## Schema Normalization Rules

### Province Names (Standardized)

| Source Value | Canonical |
|--------------|-----------|
| Nanggroe Aceh Darussalam | Aceh |
| Daerah Khusus Ibukota Jakarta | DKI Jakarta |
| Di Yogyakarta | DI Yogyakarta |
| Papua Barat Daya | Papua Barat Daya |

### Number Parsing (Indonesian Format)

| Source | Parsed |
|--------|--------|
| "65,6" | 65.6 |
| "1.234,56" | 1234.56 |
| "1.000" | 1000 |

### Geometry Conversion

| Source Type | GeoJSON Type | Rule |
|-------------|--------------|------|
| PolygonZ (type 15) | Polygon | Extract (x,y) only |
| Single ring | Polygon | Single coordinates array |
| Multi ring | MultiPolygon | Each ring → separate polygon |
| Point | Point | Direct mapping |

## Validation Checklist

Every generated GeoJSON MUST pass:

- [ ] `type` = "FeatureCollection"
- [ ] All features have `geometry` and `properties`
- [ ] All coordinates within Indonesia BBOX (95°E–141°E, 11°S–6.5°N)
- [ ] Polygon rings are closed (first == last point)
- [ ] Polygon rings have ≥ 4 points
- [ ] Required properties present: `name`, `province`
- [ ] No duplicate `feature_id` values
- [ ] CRS specified in metadata (EPSG:4326)
- [ ] Source URL and download date in metadata
- [ ] Validation report generated

## AI Agent Reproduction Checklist

To reproduce this pipeline in a new environment:

1. **Install dependencies**
   ```bash
   pip install requests pyshp pyyaml
   ```

2. **Clone/download the pipeline directory**
   ```bash
   git clone https://github.com/code4indo/incubation_bkpm.git
   cd incubation_bkpm/data-pipeline
   ```

3. **Review catalog** for current source URLs
   ```bash
   cat config/data-source-catalog.yml
   ```

4. **Run pipeline**
   ```bash
   python3 scripts/pipeline.py --all --output ./output/
   ```

5. **Validate output**
   ```bash
   python3 scripts/validate.py output/*.geojson
   ```

6. **Copy to portal data directory**
   ```bash
   cp output/*.geojson ../app/src/data/
   ```

## Updating the Pipeline

When government portals update their data:

1. Check `config/data-source-catalog.yml` for `last_verified` dates
2. Try querying each source manually
3. If URL changed, update `current_download` or `query_template`
4. If field names changed, update `schemas/schema-mapping.json`
5. If new source discovered, add to catalog + create new schema mapping
6. Run full pipeline and compare output stats with previous run
7. Commit changes with note about what changed and why

## Legal & Attribution

All data collected via this pipeline is from **official Indonesian government sources**:
- **BIG**: Badan Informasi Geospasial (Perpres 9/2016)
- **Kemenperin**: Direktorat Perwilayahan Industri (UU 3/2014, PP 142/2015)
- **ATR/BPN**: Kementerian Agraria dan Tata Ruang (UU 26/2007)

Output GeoJSON files MUST include `metadata.source`, `metadata.source_url`, and `metadata.legal_basis` to maintain attribution and legal standing.

## References

- `config/data-source-catalog.yml` — Full source URLs and reliability matrix
- `schemas/schema-mapping.json` — Complete field name mappings
- `docs/RUNBOOK.md` — Extended operational guide with screenshots
