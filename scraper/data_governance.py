"""
DATA GOVERNANCE FRAMEWORK
=========================
For BKPM Regional Investment Portal Data

Version: 1.0.0
Date: 2025-06-01
Author: AI-Powered Investment Platform Team

Principles:
    1. Data Accuracy — Every record must be verifiable to source
    2. Data Consistency — Standardized terminology across all records
    3. Data Lineage — Full traceability from source to consumer
    4. Data Quality — Continuous monitoring and scoring
    5. Data Privacy — PII protection and access control
"""

from enum import Enum
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime


class DataQualityLevel(Enum):
    """Data quality classification"""
    EXCELLENT = "excellent"    # 90-100: All critical fields present, validated
    GOOD = "good"              # 75-89: Most fields present, minor gaps
    ADEQUATE = "adequate"      # 60-74: Core fields present, some gaps
    POOR = "poor"              # 40-59: Core fields missing, significant gaps
    INSUFFICIENT = "insufficient"  # 0-39: Critical data missing, not usable


class DataSource(Enum):
    """Authorized data sources"""
    BKPM_PORTAL = "https://regionalinvestment.bkpm.go.id"
    BKPM_DIPP = "https://dipp.bkpm.go.id"
    PROVINCIAL_DPMPTSP = "DPMPTSP Provincial"
    OSS_RBA = "https://oss.go.id"
    KLHK = "https://www.menlhk.go.id"
    MANUAL_ENTRY = "manual_entry"
    AI_GENERATED = "ai_generated"  # Must be flagged and reviewed


class FieldType(Enum):
    """Field classification for governance"""
    CRITICAL = "critical"      # Must be present for record to be valid
    REQUIRED = "required"      # Should be present for complete analysis
    OPTIONAL = "optional"      # Nice to have, not blocking
    ENRICHED = "enriched"      # AI-generated or computed fields


@dataclass
class FieldDefinition:
    """Schema definition for each field"""
    name: str
    field_type: FieldType
    data_type: str
    description: str
    source: DataSource
    validation_rules: List[str]
    example_value: Any
    nullable: bool
    
    
# ============================================================================
# PROJECT DATA SCHEMA
# ============================================================================

PROJECT_SCHEMA: Dict[str, FieldDefinition] = {
    # CRITICAL FIELDS
    "id": FieldDefinition(
        name="id",
        field_type=FieldType.CRITICAL,
        data_type="integer",
        description="Unique project identifier from BKPM portal",
        source=DataSource.BKPM_PORTAL,
        validation_rules=["unique", "positive_integer", "range:1-99999"],
        example_value=1279,
        nullable=False
    ),
    "name_id": FieldDefinition(
        name="name_id",
        field_type=FieldType.CRITICAL,
        data_type="string",
        description="Project name in Indonesian (as published on portal)",
        source=DataSource.BKPM_PORTAL,
        validation_rules=["not_empty", "max_length:255", "no_html"],
        example_value="Budi Daya Rumput Laut",
        nullable=False
    ),
    "district": FieldDefinition(
        name="district",
        field_type=FieldType.CRITICAL,
        data_type="string",
        description="Kabupaten/Kota where project is located",
        source=DataSource.BKPM_PORTAL,
        validation_rules=["not_empty", "matches_pattern:Kabupaten|Kota .*"],
        example_value="Kabupaten Takalar",
        nullable=False
    ),
    "province": FieldDefinition(
        name="province",
        field_type=FieldType.CRITICAL,
        data_type="string",
        description="Province where project is located",
        source=DataSource.BKPM_PORTAL,
        validation_rules=["not_empty", "in_set:38_indonesian_provinces"],
        example_value="Sulawesi Selatan",
        nullable=False
    ),
    "province_code": FieldDefinition(
        name="province_code",
        field_type=FieldType.CRITICAL,
        data_type="string",
        description="BPS province code (2 digits)",
        source=DataSource.BKPM_PORTAL,
        validation_rules=["length:2", "numeric", "in_range:11-94"],
        example_value="73",
        nullable=True
    ),
    "longitude": FieldDefinition(
        name="longitude",
        field_type=FieldType.CRITICAL,
        data_type="float",
        description="Geographic longitude (WGS84)",
        source=DataSource.BKPM_PORTAL,
        validation_rules=["range:-180_to_180", "not_zero"],
        example_value=119.487018,
        nullable=True
    ),
    "latitude": FieldDefinition(
        name="latitude",
        field_type=FieldType.CRITICAL,
        data_type="float",
        description="Geographic latitude (WGS84)",
        source=DataSource.BKPM_PORTAL,
        validation_rules=["range:-90_to_90", "not_zero"],
        example_value=-5.598972,
        nullable=True
    ),
    
    # REQUIRED FIELDS
    "investment_value_idr": FieldDefinition(
        name="investment_value_idr",
        field_type=FieldType.REQUIRED,
        data_type="float",
        description="Total investment value in Indonesian Rupiah",
        source=DataSource.BKPM_PORTAL,
        validation_rules=["positive", "range:1M_to_100T", "not_NaN"],
        example_value=102900000000,
        nullable=True
    ),
    "year": FieldDefinition(
        name="year",
        field_type=FieldType.REQUIRED,
        data_type="integer",
        description="Year of project publication/registration",
        source=DataSource.BKPM_PORTAL,
        validation_rules=["range:2010_to_2030", "not_zero"],
        example_value=2022,
        nullable=True
    ),
    "category": FieldDefinition(
        name="category",
        field_type=FieldType.REQUIRED,
        data_type="string",
        description="Project category/sector classification",
        source=DataSource.BKPM_PORTAL,
        validation_rules=["in_set:approved_categories", "not_empty"],
        example_value="Agro Industri",
        nullable=True
    ),
    "kbli_codes": FieldDefinition(
        name="kbli_codes",
        field_type=FieldType.REQUIRED,
        data_type="array[string]",
        description="KBLI (Indonesian Business Classification) codes",
        source=DataSource.BKPM_PORTAL,
        validation_rules=["valid_kbli_format", "max_items:5"],
        example_value=["03217", "46206"],
        nullable=True
    ),
    
    # OPTIONAL FIELDS
    "irr_percent": FieldDefinition(
        name="irr_percent",
        field_type=FieldType.OPTIONAL,
        data_type="float",
        description="Internal Rate of Return percentage",
        source=DataSource.BKPM_PORTAL,
        validation_rules=["range:0_to_100", "not_NaN_if_present"],
        example_value=15.7,
        nullable=True
    ),
    "npv_idr": FieldDefinition(
        name="npv_idr",
        field_type=FieldType.OPTIONAL,
        data_type="float",
        description="Net Present Value in IDR",
        source=DataSource.BKPM_PORTAL,
        validation_rules=["positive_if_present", "not_NaN_if_present"],
        example_value=38500000000,
        nullable=True
    ),
    "payback_period_years": FieldDefinition(
        name="payback_period_years",
        field_type=FieldType.OPTIONAL,
        data_type="float",
        description="Investment payback period in years",
        source=DataSource.BKPM_PORTAL,
        validation_rules=["range:0.5_to_30", "not_zero_if_present"],
        example_value=4.22,
        nullable=True
    ),
    "description_id": FieldDefinition(
        name="description_id",
        field_type=FieldType.OPTIONAL,
        data_type="text",
        description="Project description in Indonesian",
        source=DataSource.BKPM_PORTAL,
        validation_rules=["max_length:5000", "no_html"],
        example_value="Rumput laut (Eucheuma cottonii) adalah komoditas unggulan...",
        nullable=True
    ),
    "likes_count": FieldDefinition(
        name="likes_count",
        field_type=FieldType.OPTIONAL,
        data_type="integer",
        description="Number of likes on portal",
        source=DataSource.BKPM_PORTAL,
        validation_rules=["non_negative"],
        example_value=29,
        nullable=True
    ),
    "views_count": FieldDefinition(
        name="views_count",
        field_type=FieldType.OPTIONAL,
        data_type="integer",
        description="Number of views on portal",
        source=DataSource.BKPM_PORTAL,
        validation_rules=["non_negative"],
        example_value=172,
        nullable=True
    ),
    
    # ENRICHED FIELDS (AI-generated or computed)
    "name_en": FieldDefinition(
        name="name_en",
        field_type=FieldType.ENRICHED,
        data_type="string",
        description="English translation of project name (AI-generated)",
        source=DataSource.AI_GENERATED,
        validation_rules=["max_length:255", "human_reviewed"],
        example_value="Seaweed Cultivation",
        nullable=True
    ),
    "description_en": FieldDefinition(
        name="description_en",
        field_type=FieldType.ENRICHED,
        data_type="text",
        description="English translation of description (AI-generated)",
        source=DataSource.AI_GENERATED,
        validation_rules=["max_length:5000", "human_reviewed"],
        example_value="Seaweed (Eucheuma cottonii) is a leading fishery commodity...",
        nullable=True
    ),
    "data_quality_score": FieldDefinition(
        name="data_quality_score",
        field_type=FieldType.ENRICHED,
        data_type="float",
        description="Computed data quality score (0-100)",
        source=DataSource.AI_GENERATED,
        validation_rules=["range:0_to_100", "auto_computed"],
        example_value=87.5,
        nullable=False
    ),
    "status": FieldDefinition(
        name="status",
        field_type=FieldType.ENRICHED,
        data_type="string",
        description="Data availability status",
        source=DataSource.AI_GENERATED,
        validation_rules=["in_set:[Data Tersedia, Data Parsial, Data Tidak Tersedia]"],
        example_value="Data Tersedia",
        nullable=False
    ),
}


# ============================================================================
# DATA QUALITY RULES
# ============================================================================

DATA_QUALITY_RULES = {
    "field_completeness": {
        "description": "Percentage of fields that have non-null, non-empty values",
        "weight": 0.4,
        "threshold": 0.6
    },
    "financial_metrics_validity": {
        "description": "IRR, NPV, Payback must be positive and within reasonable ranges",
        "weight": 0.2,
        "threshold": 0.0
    },
    "coordinate_precision": {
        "description": "Coordinates must be within Indonesia bounding box",
        "weight": 0.15,
        "threshold": 1.0
    },
    "temporal_validity": {
        "description": "Year must be between 2010 and current year + 5",
        "weight": 0.1,
        "threshold": 1.0
    },
    "investment_magnitude": {
        "description": "Investment value must be between 1M and 100T IDR",
        "weight": 0.15,
        "threshold": 1.0
    }
}


# ============================================================================
# INDONESIA BOUNDING BOX (for coordinate validation)
# ============================================================================

INDONESIA_BOUNDS = {
    "min_longitude": 95.0,
    "max_longitude": 141.0,
    "min_latitude": -11.0,
    "max_latitude": 6.0
}


# ============================================================================
# APPROVED SECTOR CATEGORIES
# ============================================================================

APPROVED_CATEGORIES = [
    "Agro Industri",
    "Industri",
    "Pariwisata",
    "Energi",
    "Pertambangan",
    "Perikanan",
    "Perkebunan",
    "Digital",
    "Infrastruktur",
    "Transportasi",
    "Kesehatan",
    "Pendidikan",
    "Perdagangan",
    "Real Estate",
    "Jasa",
    "Lainnya"
]


# ============================================================================
# PROVINCE LIST (38 provinces)
# ============================================================================

INDONESIAN_PROVINCES = {
    "11": "Aceh",
    "12": "Sumatera Utara",
    "13": "Sumatera Barat",
    "14": "Riau",
    "15": "Jambi",
    "16": "Sumatera Selatan",
    "17": "Bengkulu",
    "18": "Lampung",
    "19": "Kepulauan Bangka Belitung",
    "21": "Kepulauan Riau",
    "31": "DKI Jakarta",
    "32": "Jawa Barat",
    "33": "Jawa Tengah",
    "34": "DI Yogyakarta",
    "35": "Jawa Timur",
    "36": "Banten",
    "51": "Bali",
    "52": "Nusa Tenggara Barat",
    "53": "Nusa Tenggara Timur",
    "61": "Kalimantan Barat",
    "62": "Kalimantan Tengah",
    "63": "Kalimantan Selatan",
    "64": "Kalimantan Timur",
    "65": "Kalimantan Utara",
    "71": "Sulawesi Utara",
    "72": "Sulawesi Tengah",
    "73": "Sulawesi Selatan",
    "74": "Sulawesi Tenggara",
    "75": "Gorontalo",
    "76": "Sulawesi Barat",
    "81": "Maluku",
    "82": "Maluku Utara",
    "91": "Papua Barat",
    "92": "Papua",
    "93": "Papua Selatan",
    "94": "Papua Tengah",
    "95": "Papua Pegunungan",
    "96": "Papua Barat Daya"
}


# ============================================================================
# DATA LINEAGE TRACKING
# ============================================================================

@dataclass
class DataLineage:
    """Track data provenance and transformations"""
    source_url: str
    source_system: str
    extraction_method: str
    extraction_timestamp: str
    transformation_steps: List[str]
    validation_result: str
    quality_score: float
    responsible_party: str
    
    
def create_lineage_record(project_id: int, source_url: str) -> DataLineage:
    """Create a lineage record for a scraped project"""
    return DataLineage(
        source_url=source_url,
        source_system="BKPM Regional Investment Portal",
        extraction_method="Playwright headless browser + BeautifulSoup parsing",
        extraction_timestamp=datetime.utcnow().isoformat() + "Z",
        transformation_steps=[
            "HTML extraction",
            "Text normalization",
            "Field parsing with regex",
            "Data validation",
            "Quality scoring",
            "Metadata enrichment"
        ],
        validation_result="pending",
        quality_score=0.0,
        responsible_party="AI-Powered Investment Platform Scraper v1.0"
    )
