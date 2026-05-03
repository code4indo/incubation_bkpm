#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
Indonesia Geospatial Data Pipeline — Reproducible AI-Agent Runner
═══════════════════════════════════════════════════════════════════════════════

Tujuan    : Download, convert, validate, and standardize geospatial data
              from multiple Indonesian government sources into unified GeoJSON.
Sumber    : BIG MapServer, Kemenperin CKAN Portal, ATR/BPN (when available)
Output    : Standardized GeoJSON (EPSG:4326, RFC 7946) + metadata + validation report

Cara pakai:
    python3 pipeline.py --source big_kawasan_industri --output ./output/
    python3 pipeline.py --source kemenperin_kawasan_industri_shapefile --output ./output/
    python3 pipeline.py --all --output ./output/

Author    : AI Agent (reproducible template)
Date      : 2026-05-03
Version   : 1.0.0
═══════════════════════════════════════════════════════════════════════════════
"""

import argparse
import json
import os
import re
import sys
import zipfile
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlencode, urlparse

# ── Third-party (install via: pip install requests pyshp) ──────────────────
try:
    import requests
    import shapefile
except ImportError as e:
    print(f"[ERROR] Missing dependency: {e}")
    print("Install: pip install requests pyshp")
    sys.exit(1)

# ── Configuration ────────────────────────────────────────────────────────────

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent  # /mnt/agents/output/app/
CONFIG_DIR = SCRIPT_DIR.parent / "config"
SCHEMA_DIR = SCRIPT_DIR.parent / "schemas"
OUTPUT_DIR = SCRIPT_DIR.parent / "output"

INDONESIA_BBOX = {
    "min_lat": -11.0,
    "max_lat": 6.5,
    "min_lng": 95.0,
    "max_lng": 141.0,
}

USER_AGENT = (
    "Mozilla/5.0 (compatible; BKPM-Geospatial-Pipeline/1.0; "
    "+https://github.com/code4indo/incubation_bkpm)"
)

# ── Helper Functions ────────────────────────────────────────────────────────


def log(level: str, msg: str) -> None:
    timestamp = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    print(f"[{timestamp}] [{level}] {msg}")


def safe_filename(name: str) -> str:
    """Convert any string to a safe filename."""
    return re.sub(r'[^\w\-_.]', '_', name).strip('_')


def load_json(path: Path) -> dict:
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_yaml(path: Path) -> dict:
    """Minimal YAML parser for our catalog (no deps)."""
    import yaml
    with open(path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)


def save_json(data: dict, path: Path, indent: int = 2) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=indent, ensure_ascii=False)


# ── Downloaders ─────────────────────────────────────────────────────────────


def download_file(url: str, dest: Path, timeout: int = 120) -> bool:
    """Download a file with progress logging."""
    log("INFO", f"Downloading: {url}")
    try:
        resp = requests.get(url, stream=True, timeout=timeout, headers={"User-Agent": USER_AGENT})
        resp.raise_for_status()
        total = int(resp.headers.get("content-length", 0))
        downloaded = 0
        with open(dest, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)
                downloaded += len(chunk)
        log("OK", f"Downloaded {dest.name} ({downloaded} bytes)")
        return True
    except Exception as e:
        log("ERROR", f"Download failed: {e}")
        return False


def query_big_mapserver(layer_url: str, fields: List[str], limit: int = 200) -> Optional[dict]:
    """Query BIG ArcGIS MapServer REST API for GeoJSON."""
    query_url = f"{layer_url}/query"
    params = {
        "where": "1=1",
        "outFields": ",".join(fields),
        "returnGeometry": "true",
        "f": "geojson",
        "outSR": "4326",
        "resultRecordCount": limit,
    }
    full_url = f"{query_url}?{urlencode(params)}"
    log("INFO", f"Querying BIG MapServer: {query_url}")
    try:
        resp = requests.get(full_url, timeout=60, headers={"User-Agent": USER_AGENT})
        resp.raise_for_status()
        data = resp.json()
        if data.get("type") != "FeatureCollection":
            log("WARN", f"Unexpected response type: {data.get('type')}")
            return None
        log("OK", f"Retrieved {len(data.get('features', []))} features from BIG")
        return data
    except Exception as e:
        log("ERROR", f"MapServer query failed: {e}")
        return None


# ── Shapefile → GeoJSON Converter ──────────────────────────────────────────


def convert_shapefile_to_geojson(shp_path: str, schema_map: dict) -> Tuple[Optional[dict], List[str]]:
    """Convert a PolygonZ shapefile to standardized GeoJSON."""
    warnings: List[str] = []
    sf = shapefile.Reader(shp_path)
    log("INFO", f"Shapefile: {len(sf)} records, shapeType={sf.shapeType}")

    features = []
    field_names = [f[0] for f in sf.fields[1:]]

    for shape, record in zip(sf.shapes(), sf.records()):
        # Extract x,y from PolygonZ (discard z,m)
        points_2d = [(pt[0], pt[1]) for pt in shape.points]
        parts = list(shape.parts) + [len(points_2d)]
        rings = []
        for i in range(len(shape.parts)):
            start, end = parts[i], parts[i + 1]
            ring = [list(pt) for pt in points_2d[start:end]]
            if len(ring) >= 3:
                rings.append(ring)
            else:
                warnings.append(f"Skipped short ring in record {record.get(schema_map.get('feature_id', 'ID'))}")

        if not rings:
            warnings.append("Empty geometry, skipping record")
            continue

        geometry = (
            {"type": "Polygon", "coordinates": rings}
            if len(rings) == 1
            else {"type": "MultiPolygon", "coordinates": [[r] for r in rings]}
        )

        # Build properties from schema map
        props = {}
        for src_field, mapping in schema_map.get("field_map", {}).items():
            canonical = mapping.get("canonical")
            if not canonical:
                continue
            val = record.get(src_field, "")
            transform = mapping.get("transform", "passthrough")

            if transform == "passthrough":
                props[canonical] = val
            elif transform == "parse_numeric_comma_decimal":
                props[canonical] = parse_numeric_comma_decimal(val)
            elif transform == "prefix_id_ki":
                props[canonical] = f"KI_{val}"
            elif transform == "standardize_province_name":
                props[canonical] = standardize_province(val)
            elif transform == "to_title_case":
                props[canonical] = str(val).title()
            else:
                props[canonical] = val

        features.append({
            "type": "Feature",
            "properties": props,
            "geometry": geometry,
        })

    geojson = {
        "type": "FeatureCollection",
        "metadata": {
            "title": schema_map.get("source_name", "Converted Shapefile"),
            "source": schema_map.get("source_key"),
            "converted_at": datetime.utcnow().isoformat() + "Z",
            "original_crs": schema_map.get("crs"),
            "original_geometry_type": schema_map.get("geometry_type"),
        },
        "features": features,
    }
    return geojson, warnings


# ── Validators ────────────────────────────────────────────────────────────


def validate_geojson(data: dict) -> Tuple[bool, List[str]]:
    """Validate GeoJSON features for geometry and attribute integrity."""
    warnings = []
    features = data.get("features", [])
    total = len(features)
    if total == 0:
        return False, ["No features found"]

    invalid_geom = 0
    outside_bbox = 0
    empty_props = 0

    for f in features:
        geom = f.get("geometry", {})
        coords = geom.get("coordinates", [])
        geom_type = geom.get("type", "")

        if geom_type == "Polygon":
            if not coords or not isinstance(coords, list):
                invalid_geom += 1
                continue
        elif geom_type == "MultiPolygon":
            if not coords:
                invalid_geom += 1
                continue

        # BBOX check (sample first coordinate)
        try:
            first_coord = coords[0][0][0] if geom_type == "Polygon" else coords[0][0][0][0]
            lng, lat = first_coord[0], first_coord[1]
            if not (INDONESIA_BBOX["min_lng"] <= lng <= INDONESIA_BBOX["max_lng"] and
                    INDONESIA_BBOX["min_lat"] <= lat <= INDONESIA_BBOX["max_lat"]):
                outside_bbox += 1
        except Exception:
            pass

        if not f.get("properties"):
            empty_props += 1

    # Summary
    if invalid_geom:
        warnings.append(f"Invalid geometries: {invalid_geom}/{total}")
    if outside_bbox:
        warnings.append(f"Features outside Indonesia BBOX: {outside_bbox}/{total}")
    if empty_props:
        warnings.append(f"Empty properties: {empty_props}/{total}")

    is_valid = invalid_geom == 0 and total > 0
    log("INFO", f"Validation: {total} features, {len(warnings)} warnings")
    return is_valid, warnings


# ── Transform Helpers ──────────────────────────────────────────────────────


def parse_numeric_comma_decimal(val: str) -> Optional[float]:
    """Parse '65,6' → 65.6 (Indonesian decimal format)."""
    if not val or val.strip() == "":
        return None
    cleaned = val.strip().replace(".", "").replace(",", ".")
    try:
        return float(cleaned)
    except ValueError:
        return None


def standardize_province(name: str) -> str:
    """Normalize Indonesian province names."""
    mapping = {
        "nanggroe aceh darussalam": "Aceh",
        "daerah khusus jakarta": "DKI Jakarta",
        "daerah khusus ibukota jakarta": "DKI Jakarta",
        "di yogyakarta": "DI Yogyakarta",
        "daerah istimewa yogyakarta": "DI Yogyakarta",
        "jawa barat": "Jawa Barat",
        "jawa tengah": "Jawa Tengah",
        "jawa timur": "Jawa Timur",
        "banten": "Banten",
        "bali": "Bali",
        "nusa tenggara barat": "Nusa Tenggara Barat",
        "nusa tenggara timur": "Nusa Tenggara Timur",
        "kalimantan barat": "Kalimantan Barat",
        "kalimantan tengah": "Kalimantan Tengah",
        "kalimantan selatan": "Kalimantan Selatan",
        "kalimantan timur": "Kalimantan Timur",
        "kalimantan utara": "Kalimantan Utara",
        "sulawesi utara": "Sulawesi Utara",
        "sulawesi tengah": "Sulawesi Tengah",
        "sulawesi selatan": "Sulawesi Selatan",
        "sulawesi tenggara": "Sulawesi Tenggara",
        "gorontalo": "Gorontalo",
        "maluku": "Maluku",
        "maluku utara": "Maluku Utara",
        "papua barat": "Papua Barat",
        "papua": "Papua",
        "papua selatan": "Papua Selatan",
        "papua tengah": "Papua Tengah",
        "papua pegunungan": "Papua Pegunungan",
        "riau": "Riau",
        "kepulauan riau": "Kepulauan Riau",
        "sumatera utara": "Sumatera Utara",
        "sumatera barat": "Sumatera Barat",
        "sumatera selatan": "Sumatera Selatan",
        "jambi": "Jambi",
        "bengkulu": "Bengkulu",
        "lampung": "Lampung",
    }
    return mapping.get(name.lower().strip(), name.strip())


# ── Pipeline Steps ────────────────────────────────────────────────────────


def pipeline_big_kawasan_industri(output_dir: Path, schema: dict) -> bool:
    """Pipeline for BIG MapServer KI data."""
    log("STEP", "=== BIG MapServer — Kawasan Industri ===")

    layer_url = "https://kspservices.big.go.id/satupeta/rest/services/PUBLIK/KAWASAN_KHUSUS_DAN_TRANSMIGRASI/MapServer/4"
    fields = ["namobj", "pengelola", "luas", "fokus_ind", "anchor_ind", "status", "metadata"]

    # Try querying with pagination
    all_features = []
    offset = 0
    batch_size = 200
    max_records = 1000  # Safety limit

    while offset < max_records:
        data = query_big_mapserver(layer_url, fields, limit=batch_size)
        if not data:
            break
        features = data.get("features", [])
        if not features:
            break
        all_features.extend(features)
        if len(features) < batch_size:
            break
        offset += batch_size
        log("INFO", f"Fetched {len(all_features)} records so far...")

    if not all_features:
        log("ERROR", "No data retrieved from BIG MapServer")
        return False

    geojson = {
        "type": "FeatureCollection",
        "metadata": {
            "title": "Kawasan Industri — BIG Satu Peta",
            "source": "big_kawasan_industri",
            "source_url": layer_url,
            "downloaded_at": datetime.utcnow().isoformat() + "Z",
            "crs": "EPSG:4326",
            "total_features": len(all_features),
        },
        "features": all_features,
    }

    is_valid, warnings = validate_geojson(geojson)
    geojson["metadata"]["validation"] = {"passed": is_valid, "warnings": warnings}

    out_path = output_dir / "big_kawasan_industri.geojson"
    save_json(geojson, out_path)
    log("OK", f"Saved: {out_path} ({len(all_features)} features)")
    return is_valid


def pipeline_kemenperin_shapefile(output_dir: Path, schema: dict, catalog: dict) -> bool:
    """Pipeline for Kemenperin shapefile download and convert."""
    log("STEP", "=== Kemenperin — Kawasan Industri Shapefile ===")

    # Try current known URL first
    known_url = catalog["sources"]["kemenperin_kawasan_industri_shapefile"]["url"]["current_download"]
    zip_path = output_dir / "kemenperin_kawasan_industri.zip"

    if not download_file(known_url, zip_path):
        log("WARN", "Known URL failed. AI agent should try CKAN API search or browser automation.")
        return False

    # Extract
    extract_dir = output_dir / "extracted_kemenperin"
    try:
        with zipfile.ZipFile(zip_path, 'r') as z:
            z.extractall(extract_dir)
        log("OK", f"Extracted to {extract_dir}")
    except Exception as e:
        log("ERROR", f"Extraction failed: {e}")
        return False

    # Find .shp file
    shp_files = list(extract_dir.rglob("*.shp"))
    if not shp_files:
        log("ERROR", "No .shp file found in extracted archive")
        return False
    shp_path = str(shp_files[0])

    # Convert
    schema_map = schema["source_mappings"]["kemenperin_shapefile"]
    geojson, warnings = convert_shapefile_to_geojson(shp_path, schema_map)
    if not geojson:
        log("ERROR", "Conversion failed")
        return False

    # Validate
    is_valid, val_warnings = validate_geojson(geojson)
    all_warnings = warnings + val_warnings
    geojson["metadata"]["validation"] = {"passed": is_valid, "warnings": all_warnings}

    # Save
    out_path = output_dir / "kemenperin_kawasan_industri.geojson"
    save_json(geojson, out_path)
    log("OK", f"Saved: {out_path} ({len(geojson['features'])} features)")

    # Cleanup
    zip_path.unlink(missing_ok=True)

    return is_valid


# ── Main Entry Point ────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Indonesia Geospatial Data Pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 pipeline.py --source big_kawasan_industri --output ./output/
  python3 pipeline.py --source kemenperin_kawasan_industri_shapefile --output ./output/
  python3 pipeline.py --all --output ./output/
        """,
    )
    parser.add_argument("--source", choices=["big_kawasan_industri", "kemenperin_kawasan_industri_shapefile", "all"],
                        default="all", help="Which source to process")
    parser.add_argument("--output", type=Path, default=OUTPUT_DIR, help="Output directory")
    parser.add_argument("--keep-cache", action="store_true", help="Keep downloaded files")
    args = parser.parse_args()

    args.output.mkdir(parents=True, exist_ok=True)

    log("INFO", "=" * 60)
    log("INFO", "Indonesia Geospatial Data Pipeline v1.0.0")
    log("INFO", f"Output: {args.output.absolute()}")
    log("INFO", "=" * 60)

    # Load schemas
    schema_path = SCHEMA_DIR / "schema-mapping.json"
    if not schema_path.exists():
        log("ERROR", f"Schema not found: {schema_path}")
        return 1
    schema = load_json(schema_path)

    # Load catalog (optional, for URLs)
    catalog_path = CONFIG_DIR / "data-source-catalog.yml"
    catalog = {}
    if catalog_path.exists():
        try:
            catalog = load_yaml(catalog_path)
        except Exception as e:
            log("WARN", f"Could not load catalog: {e}")

    results = {}

    if args.source in ("big_kawasan_industri", "all"):
        results["big_kawasan_industri"] = pipeline_big_kawasan_industri(args.output, schema)

    if args.source in ("kemenperin_kawasan_industri_shapefile", "all"):
        results["kemenperin"] = pipeline_kemenperin_shapefile(args.output, schema, catalog)

    # Summary
    log("INFO", "=" * 60)
    log("INFO", "PIPELINE SUMMARY")
    log("INFO", "=" * 60)
    for src, ok in results.items():
        status = "PASS" if ok else "FAIL"
        log(status, f"  {src}: {status}")

    all_ok = all(results.values())
    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
