"""
Guardian Agent — Compliance & Quality Gate
============================================
Role: Final validation before translation is accepted.
- Verifies terminology consistency against glossary
- Checks regulatory references are preserved
- Quality gate: APPROVE / FLAG / REJECT
"""

from __future__ import annotations

import logging
from typing import Any

from .base import BaseAgent
from .message import AgentMessage, AgentAction

logger = logging.getLogger("agents.guardian")


class GuardianAgent(BaseAgent):
    """
    Guardian Agent: Compliance & quality gate for translations.
    
    Agentic behavior:
    - think(): Identifies what checks are needed based on content
    - act(): Runs terminology + compliance checks via LLM
    - Final gate: APPROVE / FLAG (needs human review) / REJECT
    """
    
    name = "guardian"
    role = "Compliance & Quality Gate"
    system_prompt = (
        "You are BKPM's Guardian Agent — a compliance auditor for translated investment documents. "
        "Your job is to verify that translations:\n"
        "1. Preserve legal/regulatory meaning accurately\n"
        "2. Use consistent, standard terminology (KBLI→ISIC, Perda→Regional Regulation)\n"
        "3. Don't introduce misleading terms or lose critical context\n"
        "4. Maintain investment-grade professional English\n\n"
        "Output JSON: {\n"
        '  "verdict": "APPROVE" | "FLAG" | "REJECT",\n'
        '  "score": 1-10,\n'
        '  "issues": ["issue1", ...],\n'
        '  "terminology_corrections": [{"wrong": "...", "correct": "..."}],\n'
        '  "reason": "brief explanation"\n'
        "}"
    )
    
    async def think(self, message: AgentMessage) -> dict[str, Any]:
        """Decide which checks to run."""
        name_id = message.payload.get("name_id", "")
        name_en = message.payload.get("name_en", "")
        desc_en = message.payload.get("description_en", "")
        source = message.payload.get("source", "llm")
        
        # Determine check depth
        if source in ("cache", "proper_noun"):
            return {"strategy": "light_check", "checks": ["terminology"]}
        
        checks = ["terminology", "accuracy"]
        
        # If description contains regulatory references, add compliance check
        regulatory_keywords = ["perda", "perpres", "permen", "undang", "regulasi", "izin", "OSS"]
        has_regulatory = any(kw in (name_id + " " + message.payload.get("description_id", "")).lower()
                           for kw in regulatory_keywords)
        if has_regulatory:
            checks.append("regulatory_compliance")
        
        return {
            "strategy": "full_check" if has_regulatory else "standard_check",
            "checks": checks,
            "has_regulatory": has_regulatory,
        }
    
    async def act(self, message: AgentMessage, plan: dict[str, Any]) -> AgentMessage:
        """Run compliance checks."""
        name_id = message.payload.get("name_id", "")
        name_en = message.payload.get("name_en", "")
        desc_id = message.payload.get("description_id", "")
        desc_en = message.payload.get("description_en", "")
        project_id = message.payload.get("project_id", 0)
        
        # Light check: just verify it's not empty
        if plan["strategy"] == "light_check":
            verdict = "APPROVE" if (name_en and name_en.strip()) else "FLAG"
            return message.reply(
                from_agent=self.name,
                action=AgentAction.VALIDATE_TRANSLATION,
                payload={
                    "project_id": project_id,
                    "verdict": verdict,
                    "score": 8 if verdict == "APPROVE" else 4,
                    "issues": [] if verdict == "APPROVE" else ["Empty translation"],
                    "terminology_corrections": [],
                },
                confidence=0.90,
                metadata={"strategy": plan["strategy"]},
            )
        
        # Load glossary for terminology checking
        glossary_context = ""
        if self.memory:
            try:
                terms = self.memory.get_all_glossary()
                if terms:
                    glossary_context = (
                        "\n\nReference glossary (these translations should be used consistently):\n"
                        + "\n".join(f'- "{t["term_id"]}" → "{t["term_en"]}"' for t in terms[:30])
                    )
            except Exception:
                pass
        
        # LLM-powered compliance check
        try:
            check_prompt = (
                f"Verify this translation for an investment project:\n\n"
                f"ORIGINAL (Indonesian):\n"
                f"Name: {name_id}\n"
                f"Description: {desc_id[:500]}\n\n"
                f"TRANSLATION (English):\n"
                f"Name: {name_en}\n"
                f"Description: {desc_en[:500]}\n"
                f"{glossary_context}\n\n"
                f"Check: {', '.join(plan['checks'])}\n"
                f"Provide verdict (APPROVE/FLAG/REJECT) with score 1-10."
            )
            
            result = await self.call_llm_json(
                [
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": check_prompt},
                ],
                temperature=0.1,
            )
            
            verdict = result.get("verdict", "FLAG").upper()
            if verdict not in ("APPROVE", "FLAG", "REJECT"):
                verdict = "FLAG"
            
            score = min(10, max(1, int(result.get("score", 5))))
            issues = result.get("issues", [])
            corrections = result.get("terminology_corrections", [])
            
            # Auto-learn: if corrections found, add to glossary
            if corrections and self.memory:
                for corr in corrections:
                    if corr.get("wrong") and corr.get("correct"):
                        try:
                            self.memory.add_glossary_term(
                                term_id=corr["wrong"],
                                term_en=corr["correct"],
                                domain="guardian_correction",
                            )
                        except Exception:
                            pass
            
            return message.reply(
                from_agent=self.name,
                action=AgentAction.VALIDATE_TRANSLATION,
                payload={
                    "project_id": project_id,
                    "verdict": verdict,
                    "score": score,
                    "issues": issues,
                    "terminology_corrections": corrections,
                    "reason": result.get("reason", ""),
                },
                confidence=0.85,
                metadata={"strategy": plan["strategy"], "checks": plan["checks"]},
            )
            
        except Exception as e:
            logger.error(f"[guardian] Compliance check failed: {e}")
            # Graceful degradation: FLAG for human review
            return message.reply(
                from_agent=self.name,
                action=AgentAction.VALIDATE_TRANSLATION,
                payload={
                    "project_id": project_id,
                    "verdict": "FLAG",
                    "score": 5,
                    "issues": [f"Automated check failed: {str(e)}"],
                    "terminology_corrections": [],
                    "reason": "Guardian check failed — flagged for manual review",
                },
                confidence=0.30,
                metadata={"strategy": "fallback_flag"},
                error=str(e),
            )
