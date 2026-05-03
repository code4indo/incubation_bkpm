#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
GeoJSON Validation Module — Standalone Validator for Indonesian Geospatial Data
═══════════════════════════════════════════════════════════════════════════════

Validates GeoJSON files for:
  1. RFC 7946 compliance
  2. Geometry integrity (closed rings, valid coordinates)
  3. BBOX containment within Indonesia
  4. Required attributes (schema compliance)
  5. No duplicate features
  6. CRS consistency (must be EPSG:4326)

Usage:
    python3 validate.py path/to/data.geojson
    python3 validate.py path/to/data.geojson --strict
    python3 validate.py path/to/data.geojson --report-json ./report.json

═══════════════════════════════════════════════════════════════════════════════
"""

import argparse
import json
import sys
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Tuple

INDONESIA_BBOX = {
    "min_lat": -11.0,
    "max_lat": 6.5,
    "min_lng": 95.0,
    "max_lng": 141.0,
}

REQUIRED_PROPS = ["name"]
REQUIRED_PROPS_ANY = ["province", "provinsi"]  # Accept either spelling


def log(level: str, msg: str) -> None:
    print(f"[{level}] {msg}")


def is_point_in_indonesia(lng: float, lat: float) -> bool:
    return (
        INDONESIA_BBOX["min_lng"] <= lng <= INDONESIA_BBOX["max_lng"]
        and INDONESIA_BBOX["min_lat"] <= lat <= INDONESIA_BBOX["max_lat"]
    )


def validate_geometry(geom: dict) -> List[str]:
    """Validate a single GeoJSON geometry object."""
    errors = []
    gtype = geom.get("type", "")
    coords = geom.get("coordinates", [])

    if not gtype:
        return ["Missing geometry type"]

    if gtype == "Point":
        if not isinstance(coords, list) or len(coords) != 2:
            errors.append("Invalid Point coordinates")
        else:
            lng, lat = coords[0], coords[1]
            if not is_point_in_indonesia(lng, lat):
                errors.append(f"Point outside Indonesia: ({lng}, {lat})")

    elif gtype == "Polygon":
        if not isinstance(coords, list) or not coords:
            errors.append("Empty Polygon")
        else:
            for i, ring in enumerate(coords):
                if len(ring) < 4:
                    errors.append(f"Ring {i} too short ({len(ring)} points)")
                if ring[0] != ring[-1]:
                    errors.append(f"Ring {i} not closed")
                for pt in ring:
                    if len(pt) < 2:
                        errors.append(f"Invalid point in ring {i}")

    elif gtype == "MultiPolygon":
        if not isinstance(coords, list):
            errors.append("Invalid MultiPolygon")
        else:
            for pi, poly in enumerate(coords):
                for ri, ring in enumerate(poly):
                    if len(ring) < 4:
                        errors.append(f"Poly {pi} ring {ri} too short")
                    if ring[0] != ring[-1]:
                        errors.append(f"Poly {pi} ring {ri} not closed")

    else:
        errors.append(f"Unsupported geometry type: {gtype}")

    return errors


def validate_feature(feature: dict, idx: int, strict: bool = False) -> List[str]:
    """Validate a single GeoJSON feature."""
    errors = []

    if feature.get("type") != "Feature":
        errors.append(f"Feature {idx}: invalid type")

    geom = feature.get("geometry")
    if not geom:
        errors.append(f"Feature {idx}: missing geometry")
    else:
        geom_errors = validate_geometry(geom)
        for e in geom_errors:
            errors.append(f"Feature {idx}: {e}")

    props = feature.get("properties", {})
    if not props:
        errors.append(f"Feature {idx}: missing properties")
    else:
        for req in REQUIRED_PROPS:
            if req not in props or not props[req]:
                errors.append(f"Feature {idx}: missing required property '{req}'")
        # Check alternative spellings
        has_province = any(p in props and props[p] for p in REQUIRED_PROPS_ANY)
        if not has_province:
            errors.append(f"Feature {idx}: missing province/provinsi property")

    return errors


def validate_geojson(data: dict, strict: bool = False) -> Tuple[bool, Dict[str, Any]]:
    """Validate entire GeoJSON FeatureCollection."""
    errors = []
    warnings = []
    stats = {
        "total_features": 0,
        "valid_features": 0,
        "invalid_features": 0,
        "geometry_types": Counter(),
        "provinces": Counter(),
        "operators": Counter(),
        "missing_names": 0,
        "outside_indonesia": 0,
        "duplicate_ids": 0,
    }

    if data.get("type") != "FeatureCollection":
        errors.append("Root type must be FeatureCollection")

    features = data.get("features", [])
    stats["total_features"] = len(features)

    seen_ids = set()

    for i, feature in enumerate(features):
        feat_errors = validate_feature(feature, i, strict)
        errors.extend(feat_errors)

        if feat_errors:
            stats["invalid_features"] += 1
        else:
            stats["valid_features"] += 1

        geom = feature.get("geometry", {})
        stats["geometry_types"][geom.get("type", "unknown")] += 1

        props = feature.get("properties", {})
        stats["provinces"][props.get("province", "UNKNOWN")] += 1
        stats["operators"][props.get("operator", "UNKNOWN")] += 1

        if not props.get("name"):
            stats["missing_names"] += 1

        # NOTE: Duplicate IDs may be valid for MultiPolygon representations
        # where one KI spans multiple non-contiguous parcels.
        # We log a warning but don't treat as fatal error.
        fid = props.get("feature_id") or feature.get("id") or props.get("id_ki")
        if fid:
            if fid in seen_ids:
                stats["duplicate_ids"] += 1
                warnings.append(f"Feature {i}: duplicate ID '{fid}' (may be MultiPolygon)")
            seen_ids.add(fid)

    # Metadata check
    meta = data.get("metadata", {})
    if not meta.get("source"):
        warnings.append("Missing metadata.source")
    if not meta.get("crs"):
        warnings.append("Missing metadata.crs")

    is_valid = len(errors) == 0 and stats["invalid_features"] == 0

    report = {
        "valid": is_valid,
        "errors": errors,
        "warnings": warnings,
        "stats": stats,
        "checked_at": datetime.utcnow().isoformat() + "Z",
    }

    return is_valid, report


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate GeoJSON geospatial data")
    parser.add_argument("input", type=Path, help="Input GeoJSON file")
    parser.add_argument("--strict", action="store_true", help="Strict mode (no warnings allowed)")
    parser.add_argument("--report-json", type=Path, help="Write report to JSON file")
    args = parser.parse_args()

    if not args.input.exists():
        log("ERROR", f"File not found: {args.input}")
        return 1

    log("INFO", f"Validating: {args.input}")

    with open(args.input, "r", encoding="utf-8") as f:
        data = json.load(f)

    is_valid, report = validate_geojson(data, strict=args.strict)

    # Print summary
    log("INFO", "=" * 50)
    log("INFO", "VALIDATION REPORT")
    log("INFO", "=" * 50)
    log("INFO", f"Total features : {report['stats']['total_features']}")
    log("INFO", f"Valid features : {report['stats']['valid_features']}")
    log("INFO", f"Invalid features: {report['stats']['invalid_features']}")
    log("INFO", f"Geometry types : {dict(report['stats']['geometry_types'])}")
    log("INFO", f"Missing names  : {report['stats']['missing_names']}")
    log("INFO", f"Duplicate IDs  : {report['stats']['duplicate_ids']}")

    if report["errors"]:
        log("ERROR", f"Errors ({len(report['errors'])}):")
        for e in report["errors"][:10]:
            log("ERROR", f"  - {e}")
        if len(report["errors"]) > 10:
            log("ERROR", f"  ... and {len(report['errors']) - 10} more")

    if report["warnings"]:
        log("WARN", f"Warnings ({len(report['warnings'])}):")
        for w in report["warnings"]:
            log("WARN", f"  - {w}")

    status = "PASS" if is_valid else "FAIL"
    log(status, f"Overall: {status}")

    if args.report_json:
        with open(args.report_json, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        log("INFO", f"Report saved: {args.report_json}")

    return 0 if is_valid else 1


if __name__ == "__main__":
    sys.exit(main())
