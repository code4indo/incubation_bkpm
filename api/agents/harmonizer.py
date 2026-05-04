"""
Harmonizer Agent — Translation with Self-Correction
=====================================================
Role: Translate ID → Business English with:
- Glossary-aware translation (consistent terminology via Qdrant)
- Self-correction loop (translate → evaluate quality → retry if poor)
- Proper noun detection (don't translate brand names)
"""

from __future__ import annotations

import logging
from typing import Any, Optional

from .base import BaseAgent
from .message import AgentMessage, AgentAction

logger = logging.getLogger("agents.harmonizer")


class HarmonizerAgent(BaseAgent):
    """
    Harmonizer Agent: Contextual ID→EN translation with self-correction.
    
    Agentic behavior:
    - think(): Checks glossary, decides translation strategy
    - act(): Translates via LLM with glossary context injection
    - reflect(): Evaluates translation quality via separate LLM call, retries if < 7/10
    """
    
    name = "harmonizer"
    role = "Indonesian → Business English Translation with Quality Assurance"
    
    async def think(self, message: AgentMessage) -> dict[str, Any]:
        """Plan translation strategy based on context."""
        name_id = message.payload.get("name_id", "")
        desc_id = message.payload.get("description_id", "")
        needs_name = message.payload.get("needs_name", True)
        needs_desc = message.payload.get("needs_desc", True)
        is_proper_noun = message.payload.get("is_proper_noun", False)
        retry_reason = message.metadata.get("retry_reason", None)
        
        # Load glossary from memory for context injection
        glossary_terms: list[dict] = []
        if self.memory:
            try:
                glossary_terms = self.memory.get_all_glossary()
            except Exception:
                pass
        
        # Check if we already have a cached translation
        cached: Optional[dict] = None
        project_id = message.payload.get("project_id", 0)
        if self.memory and project_id:
            try:
                cached = self.memory.get_cached_translation(project_id)
            except Exception:
                pass
        
        strategy = "translate"
        if cached and cached.get("quality_score", 0) >= 8.0:
            strategy = "use_cache"
        elif retry_reason:
            strategy = "retry_with_different_approach"
        elif is_proper_noun and not needs_desc:
            strategy = "proper_noun_passthrough"
        
        return {
            "strategy": strategy,
            "needs_name": needs_name and not is_proper_noun,
            "needs_desc": needs_desc,
            "glossary_terms": glossary_terms,
            "cached": cached,
            "is_retry": retry_reason is not None,
        }
    
    async def act(self, message: AgentMessage, plan: dict[str, Any]) -> AgentMessage:
        """Execute translation."""
        project_id = message.payload.get("project_id", 0)
        name_id = message.payload.get("name_id", "")
        desc_id = message.payload.get("description_id", "")
        
        # Strategy: use cache
        if plan["strategy"] == "use_cache" and plan["cached"]:
            return message.reply(
                from_agent=self.name,
                action=AgentAction.TRANSLATE,
                payload={
                    "project_id": project_id,
                    "name_en": plan["cached"]["name_en"],
                    "description_en": plan["cached"]["description_en"],
                    "source": "cache",
                },
                confidence=0.95,
                metadata={"strategy": "cache_hit", "model": plan["cached"].get("model", "cached")},
            )
        
        # Strategy: proper noun passthrough
        if plan["strategy"] == "proper_noun_passthrough":
            return message.reply(
                from_agent=self.name,
                action=AgentAction.TRANSLATE,
                payload={
                    "project_id": project_id,
                    "name_en": name_id,  # Keep as-is
                    "description_en": "",
                    "source": "proper_noun",
                },
                confidence=0.90,
                metadata={"strategy": "proper_noun_passthrough"},
            )
        
        # Build glossary context for prompt
        glossary_str = ""
        if plan["glossary_terms"]:
            terms = plan["glossary_terms"][:30]  # Max 30 terms to avoid prompt overflow
            glossary_str = "\n".join(f'   - "{t["term_id"]}" → "{t["term_en"]}"' for t in terms)
            glossary_str = f"\n\nUse this terminology glossary for consistency:\n{glossary_str}"
        
        # Retry strategy: ask for different approach
        retry_instruction = ""
        if plan["is_retry"]:
            prev_attempt = message.metadata.get("previous_attempt", {})
            retry_instruction = (
                f"\n\nIMPORTANT: Your previous translation was rated below quality threshold. "
                f"Previous attempt: \"{prev_attempt.get('name_en', 'N/A')}\" "
                f"Please improve: use more professional terminology, better grammar, "
                f"and ensure investment-grade business English."
            )
        
        system_prompt = (
            f"You are BKPM's Harmonizer Agent — a specialist in Indonesian → English "
            f"translation for investment documentation.\n\n"
            f"Rules:\n"
            f"1. Translate to professional Business English for international investors.\n"
            f"2. NEVER translate literally — preserve meaning and business context.\n"
            f"3. For names: concise title case, max 12 words. If already English proper noun, return unchanged.\n"
            f"4. For descriptions: clear paragraphs, active voice, no markdown.\n"
            f"5. Output ONLY the translated text — no prefixes, no explanations."
            f"{glossary_str}{retry_instruction}"
        )
        
        name_en = name_id  # Default
        description_en = desc_id  # Default
        model_used = "qwen2.5:14b"
        
        # Translate name
        if plan["needs_name"] and name_id.strip():
            try:
                name_en = await self.call_llm(
                    [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Translate this investment project name to Business English:\n---\n{name_id}\n---\nKeep it concise, title case, max 12 words. If already English, return as-is."},
                    ],
                    max_tokens=100,
                )
                name_en = name_en.strip().strip('"').strip("'")
            except Exception as e:
                logger.error(f"[harmonizer] Name translation failed: {e}")
                name_en = name_id
        
        # Translate description
        if plan["needs_desc"] and desc_id.strip():
            try:
                description_en = await self.call_llm(
                    [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Translate this investment project description to Business English:\n---\n{desc_id}\n---\nUse clear paragraphs, active voice, professional tone."},
                    ],
                    max_tokens=800,
                )
            except Exception as e:
                logger.error(f"[harmonizer] Description translation failed: {e}")
                description_en = desc_id
        
        return message.reply(
            from_agent=self.name,
            action=AgentAction.TRANSLATE,
            payload={
                "project_id": project_id,
                "name_id": name_id,
                "name_en": name_en,
                "description_id": desc_id,
                "description_en": description_en,
                "source": "llm",
            },
            confidence=0.80,
            metadata={"strategy": plan["strategy"], "model": model_used},
        )
    
    async def reflect(self, message: AgentMessage, result: AgentMessage) -> bool:
        """
        Self-correction: evaluate translation quality via LLM.
        If quality < 7/10, return False to trigger retry.
        """
        if result.error:
            return False
        
        name_id = message.payload.get("name_id", "")
        name_en = result.payload.get("name_en", "")
        desc_id = message.payload.get("description_id", "")
        desc_en = result.payload.get("description_en", "")
        
        # Skip quality check for cache hits and proper nouns
        source = result.payload.get("source", "")
        if source in ("cache", "proper_noun"):
            return True
        
        # If name didn't change and it was supposed to be translated, that's suspicious
        if name_en == name_id and message.payload.get("needs_name", False):
            # But check if it's a proper noun first
            if message.payload.get("is_proper_noun", False):
                return True
            result.metadata["reflection_feedback"] = "name_unchanged_suspicious"
            return False
        
        # LLM quality evaluation
        try:
            quality = await self.call_llm_json(
                [
                    {"role": "system", "content": (
                        "You are a translation quality evaluator for investment documents. "
                        "Rate the English translation quality 1-10. "
                        "Criteria: business terminology, grammar, naturalness, accuracy. "
                        "Output JSON: {\"score\": N, \"issues\": [\"...\"]}"
                    )},
                    {"role": "user", "content": (
                        f"Original (Indonesian): {name_id}\n"
                        f"Translation (English): {name_en}\n\n"
                        f"Original description: {desc_id[:200]}\n"
                        f"Translation: {desc_en[:200]}\n\n"
                        f"Rate quality 1-10."
                    )},
                ],
                temperature=0.1,
            )
            
            score = float(quality.get("score", 5))
            result.metadata["quality_score"] = score
            result.metadata["quality_issues"] = quality.get("issues", [])
            
            if score < 7.0:
                result.metadata["reflection_feedback"] = f"quality_score_{score}_below_threshold"
                logger.warning(f"[harmonizer] Quality {score}/10 below threshold — will retry")
                return False
            
            logger.info(f"[harmonizer] Quality {score}/10 — accepted")
            return True
            
        except Exception as e:
            # If quality check fails, accept the translation (graceful degradation)
            logger.warning(f"[harmonizer] Quality check failed ({e}), accepting translation")
            result.metadata["quality_score"] = -1
            return True
