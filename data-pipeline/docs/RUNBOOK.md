# Extended Operational Runbook — Geospatial Data Pipeline
# ==========================================================

## Step-by-Step: Adding a New Data Source

### Step 1: Discover the Source

Search for official geospatial data portals:

```bash
# Search query templates
google: "site:{domain} shapefile {topic}"
google: "site:{domain} peta {topic} download"
google: "site:{domain} geoportal {topic}"

# Example searches
site:big.go.id shapefile kawasan industri
site:kemenperin.go.id peta kawasan industri download
site:kek.go.id geoportal
```

### Step 2: Identify Access Method

| Pattern | Access Type | Example |
|---------|-------------|---------|
| `/arcgis/rest/services/.../MapServer/N` | ArcGIS REST | BIG Satu Peta |
| `/id/dataset/.../download` | CKAN Portal | Kemenperin |
| Direct `.zip` download | Direct Download | BIG RBI |
| Login page + dashboard | Restricted | Geoportal KSP |

### Step 3: Test the Endpoint

```bash
# For ArcGIS REST
curl "https://example.com/arcgis/rest/services/.../MapServer/4/query?where=1%3D1&outFields=*&f=json"

# For CKAN
# Use browser automation (Playwright) to navigate and find download link
```

### Step 4: Inspect Schema

```python
import shapefile
sf = shapefile.Reader("downloaded.shp")
print([f[0] for f in sf.fields[1:]])  # Field names
print(sf.shapeType)                   # Geometry type
```

### Step 5: Add to Catalog

Edit `config/data-source-catalog.yml`:

```yaml
my_new_source:
  name: "Description"
  authority: "Agency Name"
  legal_basis: "UU/PP Number"
  reliability: high|medium|low
  access_type: arcgis_rest|ckan_portal|direct_download|restricted
  url:
    base: "..."
  fields: [field1, field2, ...]
  crs: "EPSG:4326"
```

### Step 6: Add Schema Mapping

Edit `schemas/schema-mapping.json`:

```json
"my_new_source": {
  "source_name": "...",
  "source_key": "my_new_source",
  "geometry_type": "Polygon",
  "crs": "EPSG:4326",
  "field_map": {
    "SOURCE_FIELD": { "canonical": "name", "transform": "passthrough" }
  }
}
```

### Step 7: Add Pipeline Function

Edit `scripts/pipeline.py`, add new function:

```python
def pipeline_my_new_source(output_dir: Path, schema: dict, catalog: dict) -> bool:
    log("STEP", "=== My New Source ===")
    # Implementation here
    return True
```

### Step 8: Test End-to-End

```bash
python3 scripts/pipeline.py --source my_new_source --output ./output/
python3 scripts/validate.py ./output/my_new_source.geojson
```

### Step 9: Document and Commit

Update this runbook with any new findings or gotchas.

---

## Common Gotchas

### Gotcha 1: PolygonZ Coordinates
Shapefile type 15 (PolygonZ) stores `(x, y, z, m)` per point. pyshp returns all 4 values.
Always extract `x, y` only for GeoJSON.

### Gotcha 2: Comma Decimal Separator
Indonesian numeric format uses comma as decimal separator: `65,6` = 65.6.
Use `parse_numeric_comma_decimal()` in pipeline.

### Gotcha 3: Uppercase vs Lowercase Field Names
BIG MapServer: lowercase (`namobj`, `pengelola`)
Kemenperin: UPPERCASE (`NAMOBJ`, `PENGELOLA`)
Always inspect first, map accordingly.

### Gotcha 4: Multi-Part Polygons
A single KI may consist of multiple non-contiguous land parcels.
Shapefile: multiple rings in one record → GeoJSON MultiPolygon.

### Gotcha 5: Province Name Variations
Different sources use different province names. Always standardize to canonical names.

---

## Reference: BIG MapServer Layers

| Layer ID | Name | Coverage |
|----------|------|----------|
| 1 | Kawasan Perkebunan | National |
| 2 | Kawasan Kehutanan | National |
| 3 | Kawasan Pertambangan | National |
| 4 | **Kawasan Industri** | National |
| 5 | Kawasan Pariwisata | National |
| 6 | Kawasan Perikanan | National |
| 7 | Kawasan Pertanian | National |
| 8 | Transmigrasi | National |

URL template: `https://kspservices.big.go.id/satupeta/rest/services/PUBLIK/KAWASAN_KHUSUS_DAN_TRANSMIGRASI/MapServer/{LAYER_ID}/query`

---

## Reference: Kemenperin Dataset Naming

Datasets follow yearly naming:
- `2024-peta-kawasan-industri-eksisting-skala-1-50-000`
- `2025-peta-kawasan-industri-eksisting-skala-1-50-000`
- `2026-...`

UUID in download URL changes with each new dataset version.

---

*Document version: 1.0.0 | Last updated: 2026-05-03*
