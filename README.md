# BKPM AI-Powered Investment Platform
## Complete Production Architecture with Data Scraping, Governance & API

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL DATA SOURCE                               │
│                    https://regionalinvestment.bkpm.go.id                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SCRAPER LAYER                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  bkpm_scraper.py                                                      │   │
│  │  • Playwright headless browser (JavaScript rendering)              │   │
│  │  • Polite rate limiting (3-5s delay)                                 │   │
│  │  • Parallel execution (max 5 concurrent)                            │   │
│  │  • Data validation & quality scoring                                  │   │
│  │  • Automatic retry with exponential backoff                           │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                       │                                     │
│                                       ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  data_governance.py                                                 │   │
│  │  • Field validation (CRITICAL/REQUIRED/OPTIONAL/ENRICHED)           │   │
│  │  • Quality scoring (0-100, 5 dimensions)                              │   │
│  │  • Coordinate validation (Indonesia bounding box)                     │   │
│  │  • Financial metrics sanity checks                                    │   │
│  │  • Data lineage tracking                                             │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA STORAGE LAYER                                 │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐   │
│  │  JSON Backup         │  │  Qdrant Vector DB    │  │  PostgreSQL (opt)    │   │
│  │  bkpm_projects.json  │  │  (for RAG search)    │  │  (future migration)   │   │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            API SERVICE LAYER                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  api_service.py (FastAPI)                                             │   │
│  │  • REST API with OpenAPI docs                                         │   │
│  │  • Pagination, filtering, sorting                                    │   │
│  │  • Full-text search across all fields                               │   │
│  │  • Province & sector analytics                                         │   │
│  │  • CORS enabled for webapp integration                               │   │
│  │  • Rate limiting ready                                                │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│  REACT WEBAPP        │  │  AI LEGAL CHATBOT    │  │  EXTERNAL SYSTEMS    │
│  (this project)      │  │  (NVIDIA Stack 32GB) │  │  (future consumers) │
│  • Investment intel  │  │  • Qwen3.5-122B-A10B │  │  • BI Dashboards     │
│  • Geospatial AI     │  │  • Nemotron Embed    │  │  • Mobile Apps       │
│  • Match scoring     │  │  • Nemotron Rerank   │  │  • Partner APIs      │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
```

### File Structure

```
├── scraper/
│   ├── bkpm_scraper.py          # Production scraper with Playwright
│   ├── data_governance.py        # Validation, quality, lineage
│   └── requirements.txt         # Python dependencies
│
├── api/
│   ├── api_service.py           # FastAPI REST service
│   ├── Dockerfile               # Container image
│   └── requirements.txt         # Python dependencies
│
├── data/
│   └── bkpm_projects.json       # Scraped data output
│
├── app/                         # React webapp (existing)
│   ├── src/
│   └── dist/
│
├── docker-compose.yml           # Full stack orchestration
├── nginx.conf                   # Webapp + API proxy
└── README.md                    # This file
```

### Quick Start

#### 1. Scrape Data from BKPM Portal

```bash
cd scraper
pip install -r requirements.txt
playwright install chromium

# Scrape projects 1-1500 (takes ~2-3 hours for full range)
python bkpm_scraper.py --start-id 1 --end-id 1500 --output ../data/bkpm_projects.json

# Or scrape smaller range for testing
python bkpm_scraper.py --start-id 1200 --end-id 1300 --output ../data/bkpm_test.json
```

#### 2. Start API Service

```bash
# Option A: Direct Python
cd api
pip install -r requirements.txt
uvicorn api_service:app --host 0.0.0.0 --port 8000

# Option B: Docker
docker build -t bkpm-api ./api
docker run -p 8000:8000 -v $(pwd)/data:/app/data bkpm-api

# Option C: Docker Compose (full stack)
docker-compose up -d
```

#### 3. Access Services

| Service | URL | Description |
|---------|-----|-------------|
| Webapp | http://localhost:3000 | React frontend |
| API | http://localhost:8000 | REST API |
| API Docs | http://localhost:8000/docs | OpenAPI Swagger |
| Health | http://localhost:8000/health | Status check |

### API Endpoints

```
GET  /                  → API info
GET  /health            → Health check
GET  /projects          → List projects (paginated, filterable)
GET  /projects/{id}     → Single project detail
GET  /search?q={query}  → Full-text search
GET  /provinces         → Province statistics
GET  /sectors           → Sector statistics
POST /projects          → Create project (auth)
DELETE /projects/{id}   → Delete project (auth)
```

### Data Governance

#### Quality Score Computation

| Dimension | Weight | Rule |
|-----------|--------|------|
| Field Completeness | 40% | % of fields with non-null values |
| Financial Validity | 20% | IRR/NPV/Payback in reasonable range |
| Coordinate Precision | 15% | Within Indonesia bounding box |
| Temporal Validity | 10% | Year between 2010-2035 |
| Investment Magnitude | 15% | Between 1M and 100T IDR |

#### Data Classification

| Level | Fields | Requirement |
|-------|--------|-------------|
| CRITICAL | id, name_id, district, province, lat, lng | Must be present |
| REQUIRED | investment_value, year, category, kbli | Should be present |
| OPTIONAL | irr, npv, payback, description | Nice to have |
| ENRICHED | name_en, description_en, quality_score | AI-generated |

### NVIDIA AI Stack (32GB GPU)

```
┌─────────────────────────────────────────────────┐
│  GPU 32GB — Self-Hosted                         │
├─────────────────────────────────────────────────┤
│  • llama-nemotron-embed-1b-v2   (0.5GB)         │
│  • llama-3.2-nv-rerankqa-1b-v2  (0.5GB)         │
│  • qwen3.5-122b-a10b           (~22GB) ← Main   │
│  • nemotron-ocr-v1              (1.0GB)         │
│  • nemotron-3-safety-guard-8b   (4.0GB)         │
├─────────────────────────────────────────────────┤
│  Total: ~28GB / 32GB ✅                        │
│  Context: 128K tokens (64K+ with safety margin) │
└─────────────────────────────────────────────────┘
```

### License & Attribution

- Data Source: BKPM (Badan Koordinasi Penanaman Modal) — regionalinvestment.bkpm.go.id
- Scraper: Apache 2.0
- API: Apache 2.0
- Models: Various (NVIDIA Open License, Apache 2.0)

### Troubleshooting

**Scraper times out?**
→ Increase `--delay-max` to 8 or reduce `--concurrency` to 3

**Playwright not found?**
→ Run `playwright install chromium` after pip install

**API returns empty?**
→ Check `data/bkpm_projects.json` exists or run scraper first

**GPU OOM with Qwen?**
→ Reduce `--max-model-len` to 32768 or use Qwen2.5-32B instead
