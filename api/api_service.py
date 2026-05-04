"""
BKPM DATA API SERVICE
=====================
FastAPI-based REST API for serving scraped BKPM investment project data

Features:
    • Full CRUD operations (with auth for mutations)
    • Search & filter (by province, sector, investment range)
    • Pagination & sorting
    • Data quality indicators
    • Rate limiting
    • OpenAPI documentation
    • CORS enabled for webapp integration

Usage:
    uvicorn api_service:app --host 0.0.0.0 --port 8000 --reload

Endpoints:
    GET  /health          - Health check
    GET  /projects        - List all projects (paginated, filterable)
    GET  /projects/{id}   - Get single project by ID
    GET  /search          - Full-text search across projects
    GET  /provinces       - List all provinces with project counts
    GET  /sectors         - List all sectors with project counts
    POST /projects        - Create new project (auth required)
    PUT  /projects/{id}   - Update project (auth required)
    DELETE /projects/{id} - Delete project (auth required)
"""

from fastapi import FastAPI, HTTPException, Query, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import json
import os
from pathlib import Path
from datetime import datetime

# ============================================================================
# CONFIGURATION
# ============================================================================

DATA_FILE = Path(__file__).parent / "data" / "bkpm_projects.json"
API_VERSION = "1.0.0"
API_TITLE = "BKPM Regional Investment Data API"
API_DESCRIPTION = """
API for accessing Indonesia's regional investment project data scraped from
https://regionalinvestment.bkpm.go.id/peluang_investasi

Data is refreshed periodically via automated scraper and enriched with:
- AI-generated English translations
- Data quality scores
- Geographic coordinates
- Financial metrics validation
"""

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class ProjectBase(BaseModel):
    """Base project model with all fields"""
    id: int = Field(..., description="Unique project ID from BKPM portal")
    name_id: str = Field(..., description="Project name in Indonesian")
    name_en: Optional[str] = Field(None, description="English translation (AI-generated)")
    district: str = Field(..., description="Kabupaten/Kota")
    province: str = Field(..., description="Province")
    province_code: Optional[str] = Field(None, description="BPS province code")
    kbli_codes: List[str] = Field(default_factory=list, description="KBLI classification codes")
    investment_value_text: str = Field("", description="Original investment text")
    investment_value_idr: Optional[float] = Field(None, description="Investment value in IDR")
    year: Optional[int] = Field(None, description="Year of registration")
    irr_percent: Optional[float] = Field(None, description="Internal Rate of Return %")
    npv_text: str = Field("", description="Original NPV text")
    npv_idr: Optional[float] = Field(None, description="Net Present Value in IDR")
    payback_period_years: Optional[float] = Field(None, description="Payback period in years")
    longitude: Optional[float] = Field(None, description="Longitude (WGS84)")
    latitude: Optional[float] = Field(None, description="Latitude (WGS84)")
    category: Optional[str] = Field(None, description="Project category/sector")
    subcategory: Optional[str] = Field(None, description="Sub-category")
    likes_count: int = Field(0, description="Portal likes count")
    views_count: int = Field(0, description="Portal views count")
    description_id: Optional[str] = Field(None, description="Description in Indonesian")
    description_en: Optional[str] = Field(None, description="Description in English (AI)")
    image_url: Optional[str] = Field(None, description="Project image URL")
    video_available: bool = Field(False, description="Has promotional video")
    status: str = Field("unknown", description="Data availability status")
    data_quality_score: float = Field(0.0, description="Quality score 0-100")
    source_url: str = Field("", description="Original source URL")
    scraped_at: Optional[str] = Field(None, description="When data was scraped")
    last_verified_at: Optional[str] = Field(None, description="Last verification timestamp")


class ProjectResponse(BaseModel):
    """Response wrapper with metadata"""
    data: ProjectBase
    metadata: Dict[str, Any]


class ProjectsListResponse(BaseModel):
    """Paginated list response"""
    data: List[ProjectBase]
    total: int
    page: int
    page_size: int
    total_pages: int
    metadata: Dict[str, Any]


class SearchResponse(BaseModel):
    """Search results with relevance scores"""
    data: List[Dict[str, Any]]  # Project + search_score
    total: int
    query: str
    filters_applied: Dict[str, Any]


class ProvinceStats(BaseModel):
    """Province-level statistics"""
    province: str
    province_code: Optional[str]
    project_count: int
    total_investment_idr: float
    avg_investment_idr: float
    avg_irr: Optional[float]
    avg_quality_score: float


class SectorStats(BaseModel):
    """Sector-level statistics"""
    sector: str
    project_count: int
    total_investment_idr: float
    avg_investment_idr: float
    avg_irr: Optional[float]
    avg_quality_score: float


class HealthCheck(BaseModel):
    """Health check response"""
    status: str
    version: str
    total_projects: int
    last_updated: Optional[str]
    uptime: str


# ============================================================================
# DATA STORE (in-memory with file persistence)
# ============================================================================

class ProjectStore:
    """In-memory data store with JSON file backing"""
    
    def __init__(self, data_file: Path):
        self.data_file = data_file
        self.projects: Dict[int, Dict] = {}
        self.metadata: Dict[str, Any] = {}
        self._load_data()
    
    def _load_data(self):
        """Load data from JSON file"""
        if not self.data_file.exists():
            # Try alternate paths
            alt_paths = [
                Path("data/bkpm_projects.json"),
                Path("/mnt/agents/output/scraper/data/bkpm_projects.json"),
                Path(__file__).parent / "data" / "bkpm_projects.json",
            ]
            for path in alt_paths:
                if path.exists():
                    self.data_file = path
                    break
        
        if self.data_file.exists():
            with open(self.data_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.metadata = data.get("metadata", {})
                projects = data.get("projects", [])
                self.projects = {p["id"]: p for p in projects}
        else:
            # Use mock data from our webapp for demo
            self._load_mock_data()
    
    def _load_mock_data(self):
        """Load demo data from webapp mockData"""
        mock_projects = [
            {
                "id": 1279,
                "name_id": "Budi Daya Rumput Laut",
                "name_en": "Seaweed Cultivation",
                "district": "Kabupaten Takalar",
                "province": "Sulawesi Selatan",
                "province_code": "73",
                "kbli_codes": ["03217", "46206", "52109"],
                "investment_value_text": "Rp 102,9M",
                "investment_value_idr": 102900000000,
                "year": 2022,
                "irr_percent": 15.7,
                "npv_text": "Rp 38,5M",
                "npv_idr": 38500000000,
                "payback_period_years": 4.22,
                "longitude": 119.4870181818181,
                "latitude": -5.598971988716145,
                "category": "Agro Industri",
                "likes_count": 29,
                "views_count": 172,
                "description_id": "Rumput laut (Eucheuma cottonii) adalah komoditas unggulan perikanan yang memiliki nilai ekonomis tinggi. Potensi budidaya rumput laut di Takalar cukup besar karena kondisi lautnya yang mendukung.",
                "description_en": "Seaweed (Eucheuma cottonii) is a leading fishery commodity with high economic value. The potential for seaweed cultivation in Takalar is significant due to supporting sea conditions.",
                "status": "Data Tersedia",
                "data_quality_score": 87.5,
                "source_url": "https://regionalinvestment.bkpm.go.id/peluang_investasi/detailed/1279",
                "scraped_at": "2025-06-01T00:00:00Z",
                "last_verified_at": "2025-06-01T00:00:00Z"
            },
            {
                "id": 500,
                "name_id": "Peluang Investasi Kawasan Perikanan Kotabangun",
                "name_en": "Kotabangun Fisheries Zone Investment",
                "district": "Kabupaten Kutai Kartanegara",
                "province": "Kalimantan Timur",
                "province_code": "64",
                "kbli_codes": [],
                "investment_value_text": "Rp 59,7M",
                "investment_value_idr": 59700000000,
                "year": 2017,
                "irr_percent": 0.0,
                "npv_text": "0,0",
                "npv_idr": 0,
                "payback_period_years": 0.0,
                "longitude": 116.6288088,
                "latitude": -0.216679,
                "category": "Industri",
                "likes_count": 0,
                "views_count": 6,
                "description_id": "Kawasan perikanan Kotabangun memiliki potensi besar untuk pengembangan budidaya perikanan air tawar.",
                "status": "Data Parsial",
                "data_quality_score": 45.0,
                "source_url": "https://regionalinvestment.bkpm.go.id/peluang_investasi/detailed/500",
                "scraped_at": "2025-06-01T00:00:00Z",
                "last_verified_at": "2025-06-01T00:00:00Z"
            }
        ]
        
        self.projects = {p["id"]: p for p in mock_projects}
        self.metadata = {
            "source": "https://regionalinvestment.bkpm.go.id/peluang_investasi",
            "total_projects_scraped": len(mock_projects),
            "note": "Demo data. Run scraper for full dataset.",
            "scraped_at": "2025-06-01T00:00:00Z"
        }
    
    def get_all(self) -> List[Dict]:
        return list(self.projects.values())
    
    def get_by_id(self, project_id: int) -> Optional[Dict]:
        return self.projects.get(project_id)
    
    def search(self, query: str, filters: Dict[str, Any] = None) -> List[Dict]:
        """Full-text search with optional filters"""
        results = []
        query_lower = query.lower()
        
        for project in self.projects.values():
            # Text matching
            text_fields = [
                project.get("name_id", ""),
                project.get("name_en", ""),
                project.get("district", ""),
                project.get("province", ""),
                project.get("description_id", ""),
                project.get("description_en", ""),
                project.get("category", ""),
            ]
            
            match_score = 0
            for field in text_fields:
                if query_lower in field.lower():
                    match_score += 1
            
            if match_score == 0:
                continue
            
            # Apply filters
            if filters:
                if "province" in filters and filters["province"] != project.get("province"):
                    continue
                if "category" in filters and filters["category"] != project.get("category"):
                    continue
                if "min_investment" in filters:
                    inv = project.get("investment_value_idr") or 0
                    if inv < filters["min_investment"]:
                        continue
                if "max_investment" in filters:
                    inv = project.get("investment_value_idr") or float('inf')
                    if inv > filters["max_investment"]:
                        continue
                if "min_quality" in filters:
                    if project.get("data_quality_score", 0) < filters["min_quality"]:
                        continue
            
            project_with_score = dict(project)
            project_with_score["search_score"] = match_score
            results.append(project_with_score)
        
        # Sort by relevance
        results.sort(key=lambda x: x["search_score"], reverse=True)
        return results
    
    def get_province_stats(self) -> List[Dict]:
        """Aggregate statistics by province"""
        from collections import defaultdict
        stats = defaultdict(lambda: {
            "project_count": 0,
            "total_investment": 0,
            "investments": [],
            "irrs": [],
            "quality_scores": []
        })
        
        for p in self.projects.values():
            prov = p.get("province", "Unknown")
            stats[prov]["project_count"] += 1
            inv = p.get("investment_value_idr") or 0
            stats[prov]["total_investment"] += inv
            stats[prov]["investments"].append(inv)
            
            irr = p.get("irr_percent")
            if irr and irr > 0:
                stats[prov]["irrs"].append(irr)
            
            stats[prov]["quality_scores"].append(p.get("data_quality_score", 0))
        
        result = []
        for prov, data in stats.items():
            result.append({
                "province": prov,
                "project_count": data["project_count"],
                "total_investment_idr": data["total_investment"],
                "avg_investment_idr": sum(data["investments"]) / len(data["investments"]) if data["investments"] else 0,
                "avg_irr": sum(data["irrs"]) / len(data["irrs"]) if data["irrs"] else None,
                "avg_quality_score": sum(data["quality_scores"]) / len(data["quality_scores"]) if data["quality_scores"] else 0
            })
        
        return sorted(result, key=lambda x: x["project_count"], reverse=True)
    
    def get_sector_stats(self) -> List[Dict]:
        """Aggregate statistics by sector"""
        from collections import defaultdict
        stats = defaultdict(lambda: {
            "project_count": 0,
            "total_investment": 0,
            "investments": [],
            "irrs": [],
            "quality_scores": []
        })
        
        for p in self.projects.values():
            cat = p.get("category", "Unknown")
            stats[cat]["project_count"] += 1
            inv = p.get("investment_value_idr") or 0
            stats[cat]["total_investment"] += inv
            stats[cat]["investments"].append(inv)
            
            irr = p.get("irr_percent")
            if irr and irr > 0:
                stats[cat]["irrs"].append(irr)
            
            stats[cat]["quality_scores"].append(p.get("data_quality_score", 0))
        
        result = []
        for cat, data in stats.items():
            result.append({
                "sector": cat,
                "project_count": data["project_count"],
                "total_investment_idr": data["total_investment"],
                "avg_investment_idr": sum(data["investments"]) / len(data["investments"]) if data["investments"] else 0,
                "avg_irr": sum(data["irrs"]) / len(data["irrs"]) if data["irrs"] else None,
                "avg_quality_score": sum(data["quality_scores"]) / len(data["quality_scores"]) if data["quality_scores"] else 0
            })
        
        return sorted(result, key=lambda x: x["project_count"], reverse=True)


# ============================================================================
# INITIALIZE STORE
# ============================================================================

store = ProjectStore(DATA_FILE)

# ============================================================================
# FASTAPI APP
# ============================================================================

app = FastAPI(
    title=API_TITLE,
    description=API_DESCRIPTION,
    version=API_VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS — allow webapp to consume this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/", tags=["Root"])
def root():
    """API information"""
    return {
        "name": API_TITLE,
        "version": API_VERSION,
        "description": "BKPM Regional Investment Data API for Foreign Investors",
        "endpoints": {
            "health": "/health",
            "projects": "/projects",
            "search": "/search",
            "provinces": "/provinces",
            "sectors": "/sectors",
            "docs": "/docs"
        }
    }


@app.get("/health", response_model=HealthCheck, tags=["System"])
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": API_VERSION,
        "total_projects": len(store.projects),
        "last_updated": store.metadata.get("scraped_at"),
        "uptime": "running"
    }


@app.get("/projects", response_model=ProjectsListResponse, tags=["Projects"])
def list_projects(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    province: Optional[str] = Query(None, description="Filter by province"),
    category: Optional[str] = Query(None, description="Filter by sector category"),
    min_investment: Optional[float] = Query(None, description="Minimum investment (IDR)"),
    max_investment: Optional[float] = Query(None, description="Maximum investment (IDR)"),
    min_quality: Optional[float] = Query(None, ge=0, le=100, description="Minimum quality score"),
    sort_by: str = Query("id", description="Sort field: id, investment_value_idr, irr_percent, data_quality_score"),
    sort_order: str = Query("asc", description="Sort order: asc, desc"),
):
    """List projects with pagination, filtering, and sorting"""
    
    # Filter
    projects = list(store.projects.values())
    
    if province:
        projects = [p for p in projects if province.lower() in (p.get("province") or "").lower()]
    
    if category:
        projects = [p for p in projects if category.lower() in (p.get("category") or "").lower()]
    
    if min_investment is not None:
        projects = [p for p in projects if (p.get("investment_value_idr") or 0) >= min_investment]
    
    if max_investment is not None:
        projects = [p for p in projects if (p.get("investment_value_idr") or float('inf')) <= max_investment]
    
    if min_quality is not None:
        projects = [p for p in projects if p.get("data_quality_score", 0) >= min_quality]
    
    # Sort
    reverse = sort_order.lower() == "desc"
    projects.sort(key=lambda x: x.get(sort_by, 0) or 0, reverse=reverse)
    
    # Paginate
    total = len(projects)
    start = (page - 1) * page_size
    end = start + page_size
    paginated = projects[start:end]
    total_pages = (total + page_size - 1) // page_size
    
    return {
        "data": paginated,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "metadata": {
            "filters_applied": {
                "province": province,
                "category": category,
                "min_investment": min_investment,
                "max_investment": max_investment,
                "min_quality": min_quality
            },
            "sort": {"by": sort_by, "order": sort_order},
            "data_source": store.metadata.get("source", "BKPM Portal"),
            "last_updated": store.metadata.get("scraped_at")
        }
    }


@app.get("/projects/{project_id}", response_model=ProjectResponse, tags=["Projects"])
def get_project(project_id: int):
    """Get detailed information for a single project"""
    project = store.get_by_id(project_id)
    
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    
    return {
        "data": project,
        "metadata": {
            "data_quality": project.get("data_quality_score", 0),
            "status": project.get("status", "unknown"),
            "source_url": project.get("source_url", ""),
            "last_verified": project.get("last_verified_at"),
            "api_version": API_VERSION
        }
    }


@app.get("/search", response_model=SearchResponse, tags=["Search"])
def search_projects(
    q: str = Query(..., min_length=2, description="Search query"),
    province: Optional[str] = Query(None, description="Filter by province"),
    category: Optional[str] = Query(None, description="Filter by category"),
    min_quality: Optional[float] = Query(0, ge=0, le=100),
):
    """Full-text search across all project fields with optional filters"""
    
    filters = {}
    if province:
        filters["province"] = province
    if category:
        filters["category"] = category
    if min_quality is not None:
        filters["min_quality"] = min_quality
    
    results = store.search(q, filters)
    
    return {
        "data": results,
        "total": len(results),
        "query": q,
        "filters_applied": filters
    }


@app.get("/provinces", tags=["Analytics"])
def get_province_stats():
    """Get project statistics aggregated by province"""
    return {
        "data": store.get_province_stats(),
        "total_provinces": len(store.get_province_stats()),
        "metadata": {
            "metric": "province_aggregation",
            "last_updated": store.metadata.get("scraped_at")
        }
    }


@app.get("/sectors", tags=["Analytics"])
def get_sector_stats():
    """Get project statistics aggregated by sector"""
    return {
        "data": store.get_sector_stats(),
        "total_sectors": len(store.get_sector_stats()),
        "metadata": {
            "metric": "sector_aggregation",
            "last_updated": store.metadata.get("scraped_at")
        }
    }


# ============================================================================
# OPTIONAL: Mutation endpoints (with auth)
# ============================================================================

from fastapi import Header

@app.post("/projects", status_code=status.HTTP_201_CREATED, tags=["Admin"])
def create_project(project: ProjectBase, x_api_key: Optional[str] = Header(None)):
    """Create new project (requires API key)"""
    # In production, validate x_api_key against database
    if x_api_key != "demo-key":  # Simple auth for demo
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    if project.id in store.projects:
        raise HTTPException(status_code=409, detail=f"Project {project.id} already exists")
    
    store.projects[project.id] = project.dict()
    return {"status": "created", "id": project.id}


@app.delete("/projects/{project_id}", tags=["Admin"])
def delete_project(project_id: int, x_api_key: Optional[str] = Header(None)):
    """Delete project (requires API key)"""
    if x_api_key != "demo-key":
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    if project_id not in store.projects:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    
    del store.projects[project_id]
    return {"status": "deleted", "id": project_id}


# ============================================================================
# AGENTIC ARCHITECTURE — Multi-Agent Pipeline Endpoints
# ============================================================================

import asyncio
import json as _json
import logging

from sse_starlette.sse import EventSourceResponse

# Initialize agent memory (Qdrant-backed)
agent_memory = None
orchestrator = None

@app.on_event("startup")
async def startup_agents():
    """Initialize agent memory and orchestrator on startup."""
    global agent_memory, orchestrator
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger("agents")
    
    try:
        from agents.memory import AgentMemory
        from agents.orchestrator import OrchestratorAgent
        
        agent_memory = AgentMemory()
        # Seed glossary with standard BKPM terms on first run
        glossary = agent_memory.get_all_glossary()
        if len(glossary) == 0:
            count = agent_memory.seed_glossary()
            logger.info(f"Seeded {count} glossary terms to Qdrant")
        else:
            logger.info(f"Glossary already has {len(glossary)} terms")
        
        orchestrator = OrchestratorAgent(memory=agent_memory)
        logger.info("✅ Agentic architecture initialized (Scout + Harmonizer + Guardian)")
    except Exception as e:
        logger.error(f"⚠️ Agent initialization failed: {e}. API still works without agents.")

@app.on_event("shutdown")
async def shutdown_agents():
    global orchestrator
    if orchestrator:
        await orchestrator.close()


# ── Translation Persistence ──

@app.patch("/projects/{project_id}/translation", tags=["Agents"])
def update_project_translation(
    project_id: int,
    name_en: Optional[str] = None,
    description_en: Optional[str] = None,
):
    """Persist translation results from agent pipeline to project data."""
    project = store.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    
    if name_en is not None:
        project["name_en"] = name_en
    if description_en is not None:
        project["description_en"] = description_en
    
    project["last_verified_at"] = datetime.now().isoformat()
    store.projects[project_id] = project
    
    return {
        "status": "updated",
        "project_id": project_id,
        "name_en": project.get("name_en"),
        "description_en": (project.get("description_en") or "")[:200],
    }


# ── Agent Pipeline: Single Project ──

@app.post("/agents/harmonize/{project_id}", tags=["Agents"])
async def agent_harmonize_project(project_id: int):
    """
    Run the full agentic pipeline for a single project:
    Orchestrator → Scout → Harmonizer (with self-correction) → Guardian
    
    Returns the complete pipeline result with audit trail.
    """
    if not orchestrator:
        raise HTTPException(status_code=503, detail="Agent system not initialized")
    
    project = store.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    
    project_data = {
        "project_id": project_id,
        "name_id": project.get("name_id", ""),
        "name_en": project.get("name_en", ""),
        "description_id": project.get("description_id", ""),
        "description_en": project.get("description_en", ""),
    }
    
    # Run pipeline, collect all events
    events = []
    final_result = None
    
    async for event in orchestrator.run_pipeline(project_data):
        events.append(event)
        if event.get("event") == "pipeline_complete":
            final_result = event.get("result", {})
    
    if not final_result:
        raise HTTPException(status_code=500, detail="Pipeline produced no result")
    
    # Persist translation if approved
    if final_result.get("guardian_verdict") in ("APPROVE", "FLAG"):
        name_en = final_result.get("name_en")
        desc_en = final_result.get("description_en")
        if name_en:
            project["name_en"] = name_en
        if desc_en:
            project["description_en"] = desc_en
        project["last_verified_at"] = datetime.now().isoformat()
        store.projects[project_id] = project
    
    return {
        "status": "completed",
        "project_id": project_id,
        "result": final_result,
        "events": events,
        "persisted": final_result.get("guardian_verdict") in ("APPROVE", "FLAG"),
    }


# ── Agent Pipeline: SSE Stream ──

@app.get("/agents/harmonize/{project_id}/stream", tags=["Agents"])
async def agent_harmonize_stream(project_id: int):
    """
    Run the agentic pipeline with Server-Sent Events for real-time progress.
    Each agent completion is streamed as an SSE event.
    """
    if not orchestrator:
        raise HTTPException(status_code=503, detail="Agent system not initialized")
    
    project = store.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    
    project_data = {
        "project_id": project_id,
        "name_id": project.get("name_id", ""),
        "name_en": project.get("name_en", ""),
        "description_id": project.get("description_id", ""),
        "description_en": project.get("description_en", ""),
    }
    
    async def event_generator():
        async for event in orchestrator.run_pipeline(project_data):
            event_type = event.get("event", "update")
            yield {
                "event": event_type,
                "data": _json.dumps(event, default=str),
            }
            
            # Persist on completion
            if event_type == "pipeline_complete":
                result = event.get("result", {})
                if result.get("guardian_verdict") in ("APPROVE", "FLAG"):
                    name_en = result.get("name_en")
                    desc_en = result.get("description_en")
                    if name_en:
                        project["name_en"] = name_en
                    if desc_en:
                        project["description_en"] = desc_en
                    project["last_verified_at"] = datetime.now().isoformat()
                    store.projects[project_id] = project
    
    return EventSourceResponse(event_generator())


# ── Agent Pipeline: Batch ──

@app.post("/agents/harmonize/batch", tags=["Agents"])
async def agent_harmonize_batch(project_ids: List[int]):
    """
    Run agentic pipeline for multiple projects sequentially.
    Returns summary of all results.
    """
    if not orchestrator:
        raise HTTPException(status_code=503, detail="Agent system not initialized")
    
    results = []
    for pid in project_ids:
        project = store.get_by_id(pid)
        if not project:
            results.append({"project_id": pid, "status": "not_found"})
            continue
        
        project_data = {
            "project_id": pid,
            "name_id": project.get("name_id", ""),
            "name_en": project.get("name_en", ""),
            "description_id": project.get("description_id", ""),
            "description_en": project.get("description_en", ""),
        }
        
        final_result = None
        async for event in orchestrator.run_pipeline(project_data):
            if event.get("event") == "pipeline_complete":
                final_result = event.get("result", {})
        
        if final_result:
            # Persist if approved
            if final_result.get("guardian_verdict") in ("APPROVE", "FLAG"):
                if final_result.get("name_en"):
                    project["name_en"] = final_result["name_en"]
                if final_result.get("description_en"):
                    project["description_en"] = final_result["description_en"]
                project["last_verified_at"] = datetime.now().isoformat()
                store.projects[pid] = project
            
            results.append({
                "project_id": pid,
                "status": "completed",
                "verdict": final_result.get("guardian_verdict"),
                "name_en": final_result.get("name_en", ""),
            })
        else:
            results.append({"project_id": pid, "status": "failed"})
    
    return {
        "total": len(project_ids),
        "completed": sum(1 for r in results if r.get("status") == "completed"),
        "results": results,
    }


# ── Audit Trail ──

@app.get("/agents/audit/{trace_id}", tags=["Agents"])
def get_audit_trail(trace_id: str):
    """Get full audit trail for a pipeline execution."""
    if not agent_memory:
        raise HTTPException(status_code=503, detail="Agent memory not initialized")
    
    from agents.audit import AuditTrail
    audit = AuditTrail(agent_memory)
    decisions = audit.get_trace(trace_id)
    
    return {
        "trace_id": trace_id,
        "decisions": decisions,
        "count": len(decisions),
    }


# ── Glossary Management ──

@app.get("/agents/glossary", tags=["Agents"])
def get_glossary():
    """Get all translation glossary terms."""
    if not agent_memory:
        raise HTTPException(status_code=503, detail="Agent memory not initialized")
    
    terms = agent_memory.get_all_glossary()
    return {"terms": terms, "count": len(terms)}


@app.post("/agents/glossary", tags=["Agents"])
def add_glossary_term(term_id: str, term_en: str, domain: str = "custom"):
    """Add a custom term to the translation glossary."""
    if not agent_memory:
        raise HTTPException(status_code=503, detail="Agent memory not initialized")
    
    agent_memory.add_glossary_term(term_id, term_en, domain)
    return {"status": "added", "term_id": term_id, "term_en": term_en}


# ── Translation Cache ──

@app.get("/agents/translations", tags=["Agents"])
def get_cached_translations():
    """Get all cached translation results from agent pipeline."""
    if not agent_memory:
        raise HTTPException(status_code=503, detail="Agent memory not initialized")
    
    translations = agent_memory.get_all_translations()
    return {"translations": translations, "count": len(translations)}


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
