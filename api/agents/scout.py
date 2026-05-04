"""
Scout Agent — Language Detection & Evaluation
===============================================
Role: Pre-tag project content with language metadata.
Unlike the frontend version (regex-only), this agent uses LLM
for ambiguous cases and remembers past evaluations.
"""

from __future__ import annotations

import re
from typing import Any

from .base import BaseAgent
from .message import AgentMessage, AgentAction


# Indonesian language patterns for quick heuristic detection
INDONESIAN_PATTERNS = [
    r'\b(yang|dan|atau|untuk|dengan|dari|pada|ini|itu|adalah)\b',
    r'\b(peluang|investasi|proyek|kawasan|industri|pengolahan)\b',
    r'\b(pembangunan|pengembangan|produksi|budidaya|perikanan)\b',
    r'\b(kabupaten|kota|provinsi|desa|kecamatan)\b',
    r'\b(perkebunan|pertanian|peternakan|pariwisata)\b',
    r'\b(pabrik|gedung|jalan|pelabuhan|bandara)\b',
]

ENGLISH_PATTERNS = [
    r'\b(the|and|or|for|with|from|this|that|is|are|was|were)\b',
    r'\b(investment|project|zone|industrial|processing|development)\b',
    r'\b(opportunity|facility|plant|production|capacity)\b',
]


class ScoutAgent(BaseAgent):
    """
    Scout Agent: Language detection and content classification.
    
    Agentic behavior:
    - Uses heuristic first (fast), escalates to LLM for ambiguous cases
    - Remembers past evaluations via memory store
    - Provides confidence score to help Orchestrator route
    """
    
    name = "scout"
    role = "Language Detection & Content Classification"
    system_prompt = (
        "You are a language detection specialist. Analyze text and determine: "
        "1) Primary language (id/en/mixed) "
        "2) Whether the English version is original or machine-translated "
        "3) Whether proper nouns exist that should NOT be translated "
        "Output JSON: {\"language\": \"id|en|mixed\", \"is_proper_noun\": bool, \"confidence\": 0.0-1.0, \"reason\": \"...\"}"
    )
    
    async def think(self, message: AgentMessage) -> dict[str, Any]:
        """Decide detection strategy based on input."""
        name_id = message.payload.get("name_id", "")
        name_en = message.payload.get("name_en", "")
        desc_id = message.payload.get("description_id", "")
        desc_en = message.payload.get("description_en", "")
        
        # Quick heuristic check
        id_score = self._heuristic_score(name_id + " " + desc_id, INDONESIAN_PATTERNS)
        en_score = self._heuristic_score(name_en + " " + desc_en, ENGLISH_PATTERNS)
        
        name_is_copy = (name_en.strip() == name_id.strip()) if name_en else True
        desc_is_copy = (desc_en.strip() == desc_id.strip()) if desc_en else True
        desc_is_empty = not desc_en or not desc_en.strip()
        
        # Determine if we need LLM for ambiguous cases
        is_ambiguous = (
            (id_score < 0.3 and en_score < 0.3) or  # Low confidence both ways
            (name_is_copy and id_score < 0.2)         # Name is copied but doesn't look Indonesian
        )
        
        return {
            "strategy": "llm_verify" if is_ambiguous else "heuristic",
            "id_score": id_score,
            "en_score": en_score,
            "name_is_copy": name_is_copy,
            "desc_is_copy": desc_is_copy,
            "desc_is_empty": desc_is_empty,
            "is_ambiguous": is_ambiguous,
        }
    
    async def act(self, message: AgentMessage, plan: dict[str, Any]) -> AgentMessage:
        """Execute language detection."""
        project_id = message.payload.get("project_id", 0)
        name_id = message.payload.get("name_id", "")
        name_en = message.payload.get("name_en", "")
        desc_id = message.payload.get("description_id", "")
        
        needs_name = plan["name_is_copy"]
        needs_desc = plan["desc_is_copy"] or plan["desc_is_empty"]
        is_proper_noun = False
        
        # For ambiguous cases, ask LLM to classify
        if plan["strategy"] == "llm_verify" and name_id:
            try:
                llm_result = await self.call_llm_json([
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": f"Analyze this project name:\nOriginal (ID): {name_id}\nEnglish version: {name_en}\n\nIs this Indonesian text, English proper noun, or mixed?"},
                ])
                is_proper_noun = llm_result.get("is_proper_noun", False)
                if is_proper_noun:
                    needs_name = False  # Proper nouns don't need translation
            except Exception:
                pass  # Fallback to heuristic if LLM fails
        else:
            # Heuristic proper noun detection: if name has no Indonesian patterns
            # and contains capitalized words, likely a proper noun
            if needs_name and plan["id_score"] < 0.1:
                words = name_id.strip().split()
                if all(w[0].isupper() for w in words if w):
                    is_proper_noun = True
                    needs_name = False
        
        # Determine action
        if needs_name and needs_desc:
            action = "HARMONIZE_FULL"
            status = "needs_full"
        elif needs_name:
            action = "HARMONIZE_NAME"
            status = "needs_name"
        elif needs_desc:
            action = "HARMONIZE_DESC"
            status = "needs_description"
        else:
            action = "SKIP"
            status = "ready"
        
        # Quality score
        quality = 10 if status == "ready" else (5 if action == "HARMONIZE_NAME" else 3)
        
        confidence = 0.95 if plan["strategy"] == "heuristic" else 0.85
        
        return message.reply(
            from_agent=self.name,
            action=AgentAction.EVALUATE_LANGUAGE,
            payload={
                "project_id": project_id,
                "status": status,
                "recommended_action": action,
                "is_proper_noun": is_proper_noun,
                "needs_name": needs_name,
                "needs_desc": needs_desc,
                "quality_score": quality,
                "language_scores": {
                    "indonesian": plan["id_score"],
                    "english": plan["en_score"],
                },
                "detection_method": plan["strategy"],
            },
            confidence=confidence,
            metadata={"strategy": plan["strategy"]},
        )
    
    def _heuristic_score(self, text: str, patterns: list[str]) -> float:
        """Score how well text matches language patterns (0.0 - 1.0)."""
        if not text or not text.strip():
            return 0.0
        
        text_lower = text.lower()
        total_matches = 0
        for pattern in patterns:
            total_matches += len(re.findall(pattern, text_lower))
        
        word_count = max(len(text_lower.split()), 1)
        return min(1.0, total_matches / (word_count * 0.3))
