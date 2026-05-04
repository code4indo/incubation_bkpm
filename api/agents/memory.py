"""
Agent Memory Store — Qdrant-backed Persistent Memory
=====================================================
Provides agents with:
- Translation glossary (consistent ID→EN terminology)
- Translation cache (avoid re-translating same content)
- Agent decision history (for learning and audit)
"""

from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Any, Optional

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PointStruct,
    VectorParams,
)

logger = logging.getLogger("agents.memory")

QDRANT_HOST = "bkpm-qdrant"  # Docker service name
QDRANT_PORT = 6333

# Collection names
GLOSSARY_COLLECTION = "translation_glossary"
TRANSLATION_CACHE = "translation_cache"
AGENT_DECISIONS = "agent_decisions"

# We use a simple deterministic "embedding" based on text hash
# In production, replace with real embeddings (e.g., sentence-transformers)
VECTOR_SIZE = 64


def _text_to_vector(text: str) -> list[float]:
    """
    Deterministic pseudo-embedding from text hash.
    This is NOT semantic — it's for exact-match lookup.
    Replace with real embeddings for semantic search.
    """
    h = hashlib.sha512(text.encode()).digest()
    # Convert 64 bytes → 64 floats in [-1, 1]
    return [(b / 128.0) - 1.0 for b in h[:VECTOR_SIZE]]


class AgentMemory:
    """
    Persistent memory store for all agents.
    
    Capabilities:
    - Store/retrieve translation glossary terms
    - Cache translation results to avoid redundant LLM calls
    - Log agent decisions for audit and learning
    """
    
    def __init__(self, host: str = QDRANT_HOST, port: int = QDRANT_PORT):
        self.client = QdrantClient(host=host, port=port, timeout=10)
        self._ensure_collections()
    
    def _ensure_collections(self):
        """Create collections if they don't exist."""
        existing = {c.name for c in self.client.get_collections().collections}
        
        for name in [GLOSSARY_COLLECTION, TRANSLATION_CACHE, AGENT_DECISIONS]:
            if name not in existing:
                self.client.create_collection(
                    collection_name=name,
                    vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
                )
                logger.info(f"Created Qdrant collection: {name}")
    
    # ── Translation Glossary ──
    
    def add_glossary_term(self, term_id: str, term_en: str, domain: str = "general") -> None:
        """Add a translation term to the glossary for consistency."""
        point_id = int(hashlib.md5(term_id.encode()).hexdigest()[:15], 16)
        
        self.client.upsert(
            collection_name=GLOSSARY_COLLECTION,
            points=[
                PointStruct(
                    id=point_id,
                    vector=_text_to_vector(term_id.lower()),
                    payload={
                        "term_id": term_id,
                        "term_en": term_en,
                        "domain": domain,
                        "created_at": datetime.now(timezone.utc).isoformat(),
                    },
                )
            ],
        )
    
    def get_glossary_term(self, term_id: str) -> Optional[str]:
        """Look up a term in the glossary. Returns English translation or None."""
        results = self.client.search(
            collection_name=GLOSSARY_COLLECTION,
            query_vector=_text_to_vector(term_id.lower()),
            limit=1,
            score_threshold=0.99,  # Near-exact match only
        )
        if results and results[0].payload.get("term_id", "").lower() == term_id.lower():
            return results[0].payload["term_en"]
        return None
    
    def get_all_glossary(self) -> list[dict[str, str]]:
        """Get all glossary terms for context injection."""
        results = self.client.scroll(
            collection_name=GLOSSARY_COLLECTION,
            limit=500,
        )
        return [
            {"term_id": p.payload["term_id"], "term_en": p.payload["term_en"]}
            for p in results[0]
        ]
    
    def seed_glossary(self) -> int:
        """Seed the glossary with standard BKPM terminology."""
        standard_terms = {
            "Peluang investasi": "Investment opportunity",
            "Pabrik pengolahan": "Processing plant",
            "Kawasan industri": "Industrial estate",
            "Kawasan ekonomi khusus": "Special Economic Zone (SEZ)",
            "Perda": "Regional Regulation",
            "Pemda": "Regional Government",
            "KBLI": "ISIC code",
            "RTRW": "Spatial Plan",
            "KEK": "Special Economic Zone (SEZ)",
            "hilirisasi": "downstream processing",
            "pakan ternak": "animal feed",
            "perkebunan": "plantation",
            "pariwisata": "tourism",
            "pembangkit listrik": "power plant",
            "karet remah": "crumb rubber",
            "pewarna tekstil": "textile dyeing",
            "penyosohan beras": "rice polishing",
            "bahan baku": "raw materials",
            "nilai tambah": "value-added",
            "lapangan kerja": "employment",
            "analisis kelayakan": "feasibility study",
            "izin lokasi": "site permit",
            "izin usaha": "business license",
            "AMDAL": "Environmental Impact Assessment (EIA)",
            "OSS": "Online Single Submission",
            "DPMPTSP": "Investment and One-Stop Service Agency",
            "Perpres": "Presidential Regulation",
            "Permen": "Ministerial Regulation",
            "insentif fiskal": "fiscal incentive",
            "tax holiday": "tax holiday",
            "budi daya": "cultivation",
            "rumput laut": "seaweed",
            "perikanan": "fisheries",
            "pertanian": "agriculture",
            "peternakan": "animal husbandry",
        }
        
        count = 0
        for term_id, term_en in standard_terms.items():
            self.add_glossary_term(term_id, term_en, domain="bkpm")
            count += 1
        
        logger.info(f"Seeded glossary with {count} standard terms")
        return count
    
    # ── Translation Cache ──
    
    def cache_translation(
        self,
        project_id: int,
        name_id: str,
        name_en: str,
        description_id: str,
        description_en: str,
        model: str,
        quality_score: float,
        trace_id: str,
    ) -> None:
        """Cache a translation result to avoid re-translating."""
        self.client.upsert(
            collection_name=TRANSLATION_CACHE,
            points=[
                PointStruct(
                    id=project_id,
                    vector=_text_to_vector(name_id.lower()),
                    payload={
                        "project_id": project_id,
                        "name_id": name_id,
                        "name_en": name_en,
                        "description_id": description_id,
                        "description_en": description_en,
                        "model": model,
                        "quality_score": quality_score,
                        "trace_id": trace_id,
                        "translated_at": datetime.now(timezone.utc).isoformat(),
                    },
                )
            ],
        )
    
    def get_cached_translation(self, project_id: int) -> Optional[dict[str, Any]]:
        """Retrieve cached translation for a project."""
        results = self.client.retrieve(
            collection_name=TRANSLATION_CACHE,
            ids=[project_id],
        )
        if results:
            return results[0].payload
        return None
    
    def get_all_translations(self) -> list[dict[str, Any]]:
        """Get all cached translations."""
        results = self.client.scroll(
            collection_name=TRANSLATION_CACHE,
            limit=500,
        )
        return [p.payload for p in results[0]]
    
    # ── Agent Decision Log ──
    
    def log_decision(self, message_dict: dict[str, Any]) -> None:
        """Log an agent decision for audit trail."""
        point_id = int(hashlib.md5(
            json.dumps(message_dict, default=str).encode()
        ).hexdigest()[:15], 16)
        
        self.client.upsert(
            collection_name=AGENT_DECISIONS,
            points=[
                PointStruct(
                    id=point_id,
                    vector=_text_to_vector(json.dumps(message_dict, default=str)),
                    payload={
                        **message_dict,
                        "logged_at": datetime.now(timezone.utc).isoformat(),
                    },
                )
            ],
        )
    
    def get_decisions_by_trace(self, trace_id: str) -> list[dict[str, Any]]:
        """Get all agent decisions for a specific pipeline execution."""
        results = self.client.scroll(
            collection_name=AGENT_DECISIONS,
            scroll_filter=Filter(
                must=[FieldCondition(key="trace_id", match=MatchValue(value=trace_id))]
            ),
            limit=100,
        )
        return [p.payload for p in results[0]]
