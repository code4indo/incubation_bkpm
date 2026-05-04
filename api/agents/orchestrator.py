"""
Orchestrator Agent — LLM-Driven Pipeline Router
==================================================
Role: Decides which agents to invoke and coordinates execution.
Unlike the old if/else approach, this uses LLM for intent classification
and dynamic agent selection.
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any, AsyncGenerator, Optional

from .base import BaseAgent
from .message import AgentMessage, AgentAction
from .memory import AgentMemory
from .scout import ScoutAgent
from .harmonizer import HarmonizerAgent
from .guardian import GuardianAgent
from .audit import AuditTrail

logger = logging.getLogger("agents.orchestrator")


class OrchestratorAgent(BaseAgent):
    """
    Orchestrator: LLM-driven pipeline router and coordinator.
    
    Agentic behavior:
    - Uses LLM to classify intent and select agents (not hard-coded if/else)
    - Coordinates multi-agent pipeline with state tracking
    - Provides SSE-compatible progress streaming
    - Maintains audit trail of all decisions
    """
    
    name = "orchestrator"
    role = "Pipeline Coordinator & Intent Router"
    system_prompt = (
        "You are the BKPM Orchestrator. Given project data, decide the optimal agent pipeline.\n\n"
        "Available agents:\n"
        "- SCOUT: Quick language detection (fast, ~10ms, no LLM needed for most cases)\n"
        "- HARMONIZER: ID→EN translation with quality assurance (requires LLM, ~5-30s)\n"
        "- GUARDIAN: Terminology & compliance validation (requires LLM, ~5-15s)\n\n"
        "Rules:\n"
        "1. ALWAYS start with SCOUT to evaluate language status\n"
        "2. If SCOUT says 'ready' (already English), skip HARMONIZER but still run GUARDIAN\n"
        "3. If SCOUT says needs translation, run HARMONIZER then GUARDIAN\n"
        "4. For proper nouns, HARMONIZER will passthrough, GUARDIAN still validates\n\n"
        "Output JSON: {\"agents\": [\"SCOUT\", ...], \"reason\": \"...\", \"parallel\": false}"
    )
    
    def __init__(self, memory: Optional[AgentMemory] = None):
        super().__init__(memory)
        self.scout = ScoutAgent(memory)
        self.harmonizer = HarmonizerAgent(memory)
        self.guardian = GuardianAgent(memory)
        self.audit = AuditTrail(memory)
    
    async def close(self):
        """Clean up all agent HTTP clients."""
        await super().close()
        await self.scout.close()
        await self.harmonizer.close()
        await self.guardian.close()
    
    async def think(self, message: AgentMessage) -> dict[str, Any]:
        """
        LLM-driven intent classification and agent selection.
        Falls back to rule-based if LLM is unavailable.
        """
        project_id = message.payload.get("project_id", 0)
        name_id = message.payload.get("name_id", "")
        name_en = message.payload.get("name_en", "")
        desc_id = message.payload.get("description_id", "")
        desc_en = message.payload.get("description_en", "")
        
        try:
            # LLM-driven routing
            result = await self.call_llm_json(
                [
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": (
                        f"Project #{project_id}:\n"
                        f"Name (ID): {name_id}\n"
                        f"Name (EN): {name_en or '(empty)'}\n"
                        f"Description (ID): {(desc_id or '')[:200]}\n"
                        f"Description (EN): {(desc_en or '')[:200] or '(empty)'}\n\n"
                        f"Decide agent pipeline."
                    )},
                ],
                temperature=0.1,
            )
            
            agents = result.get("agents", ["SCOUT", "HARMONIZER", "GUARDIAN"])
            reason = result.get("reason", "LLM-determined routing")
            
            return {
                "strategy": "llm_routed",
                "agents": agents,
                "reason": reason,
                "parallel": result.get("parallel", False),
            }
            
        except Exception as e:
            logger.warning(f"[orchestrator] LLM routing failed ({e}), using rule-based fallback")
            
            # Rule-based fallback
            name_is_copy = (name_en.strip() == name_id.strip()) if name_en else True
            desc_is_empty = not desc_en or not desc_en.strip()
            
            if name_is_copy or desc_is_empty:
                agents = ["SCOUT", "HARMONIZER", "GUARDIAN"]
                reason = "Rule-based: needs translation"
            else:
                agents = ["SCOUT", "GUARDIAN"]
                reason = "Rule-based: already has English content"
            
            return {
                "strategy": "rule_based_fallback",
                "agents": agents,
                "reason": reason,
                "parallel": False,
            }
    
    async def act(self, message: AgentMessage, plan: dict[str, Any]) -> AgentMessage:
        """Execute the agent pipeline in sequence."""
        # This is a coordinator — the real work happens in run_pipeline()
        # act() is called by BaseAgent.run() but we override the full pipeline
        return message.reply(
            from_agent=self.name,
            action=AgentAction.ROUTE,
            payload={"plan": plan},
            confidence=0.90,
        )
    
    async def run_pipeline(
        self,
        project_data: dict[str, Any],
    ) -> AsyncGenerator[dict[str, Any], None]:
        """
        Execute the full agentic pipeline with SSE-compatible progress streaming.
        
        Yields events as each agent completes:
        {"event": "agent_start", "agent": "scout", ...}
        {"event": "agent_complete", "agent": "scout", "result": {...}}
        {"event": "pipeline_complete", "trace_id": "...", "result": {...}}
        """
        trace_id = AgentMessage.create_trace_id()
        start = time.time()
        
        # Initial message
        initial_message = AgentMessage(
            trace_id=trace_id,
            from_agent="api",
            to_agent="orchestrator",
            action=AgentAction.PIPELINE_START,
            payload=project_data,
        )
        
        # Log pipeline start
        self.audit.log(initial_message)
        
        yield {
            "event": "pipeline_start",
            "trace_id": trace_id,
            "project_id": project_data.get("project_id"),
        }
        
        # Step 1: Orchestrator decides routing
        yield {"event": "agent_start", "agent": "orchestrator", "action": "route"}
        
        plan = await self.think(initial_message)
        
        yield {
            "event": "agent_complete",
            "agent": "orchestrator",
            "result": {
                "strategy": plan["strategy"],
                "agents": plan["agents"],
                "reason": plan["reason"],
            },
        }
        
        agent_results: dict[str, AgentMessage] = {}
        
        # Step 2: Run SCOUT
        if "SCOUT" in plan["agents"]:
            yield {"event": "agent_start", "agent": "scout", "action": "evaluate_language"}
            
            scout_msg = AgentMessage(
                trace_id=trace_id,
                from_agent="orchestrator",
                to_agent="scout",
                action=AgentAction.EVALUATE_LANGUAGE,
                payload=project_data,
            )
            
            scout_result = await self.scout.run(scout_msg)
            agent_results["scout"] = scout_result
            self.audit.log(scout_result)
            
            yield {
                "event": "agent_complete",
                "agent": "scout",
                "result": scout_result.payload,
                "confidence": scout_result.confidence,
                "latency_ms": scout_result.metadata.get("latency_ms", 0),
            }
        
        # Step 3: Run HARMONIZER if needed
        if "HARMONIZER" in plan["agents"]:
            scout_payload = agent_results.get("scout", initial_message).payload
            needs_name = scout_payload.get("needs_name", True)
            needs_desc = scout_payload.get("needs_desc", True)
            is_proper_noun = scout_payload.get("is_proper_noun", False)
            
            # Skip harmonizer if scout says everything is ready
            if scout_payload.get("status") == "ready" and not needs_name and not needs_desc:
                yield {"event": "agent_skip", "agent": "harmonizer", "reason": "scout_says_ready"}
            else:
                yield {"event": "agent_start", "agent": "harmonizer", "action": "translate"}
                
                harm_msg = AgentMessage(
                    trace_id=trace_id,
                    from_agent="orchestrator",
                    to_agent="harmonizer",
                    action=AgentAction.TRANSLATE,
                    payload={
                        **project_data,
                        "needs_name": needs_name,
                        "needs_desc": needs_desc,
                        "is_proper_noun": is_proper_noun,
                    },
                )
                
                harm_result = await self.harmonizer.run(harm_msg, max_retries=2)
                agent_results["harmonizer"] = harm_result
                self.audit.log(harm_result)
                
                yield {
                    "event": "agent_complete",
                    "agent": "harmonizer",
                    "result": {
                        "name_en": harm_result.payload.get("name_en", ""),
                        "description_en": harm_result.payload.get("description_en", "")[:200],
                        "source": harm_result.payload.get("source", ""),
                        "quality_score": harm_result.metadata.get("quality_score", -1),
                    },
                    "confidence": harm_result.confidence,
                    "latency_ms": harm_result.metadata.get("latency_ms", 0),
                    "attempts": harm_result.metadata.get("attempts", 1),
                }
        
        # Step 4: Run GUARDIAN
        if "GUARDIAN" in plan["agents"]:
            yield {"event": "agent_start", "agent": "guardian", "action": "validate"}
            
            # Build guardian input from harmonizer output or original data
            harm_payload = agent_results.get("harmonizer", initial_message).payload
            
            guardian_msg = AgentMessage(
                trace_id=trace_id,
                from_agent="orchestrator",
                to_agent="guardian",
                action=AgentAction.VALIDATE_TRANSLATION,
                payload={
                    "project_id": project_data.get("project_id"),
                    "name_id": project_data.get("name_id", ""),
                    "name_en": harm_payload.get("name_en", project_data.get("name_en", "")),
                    "description_id": project_data.get("description_id", ""),
                    "description_en": harm_payload.get("description_en", project_data.get("description_en", "")),
                    "source": harm_payload.get("source", "original"),
                },
            )
            
            guardian_result = await self.guardian.run(guardian_msg, max_retries=1)
            agent_results["guardian"] = guardian_result
            self.audit.log(guardian_result)
            
            yield {
                "event": "agent_complete",
                "agent": "guardian",
                "result": guardian_result.payload,
                "confidence": guardian_result.confidence,
                "latency_ms": guardian_result.metadata.get("latency_ms", 0),
            }
        
        # Step 5: Compile final result
        total_ms = int((time.time() - start) * 1000)
        
        harm_data = agent_results.get("harmonizer", initial_message)
        guardian_data = agent_results.get("guardian")
        
        final_result = {
            "project_id": project_data.get("project_id"),
            "name_en": harm_data.payload.get("name_en", project_data.get("name_en", "")),
            "description_en": harm_data.payload.get("description_en", project_data.get("description_en", "")),
            "translation_source": harm_data.payload.get("source", "original"),
            "quality_score": harm_data.metadata.get("quality_score", -1),
            "guardian_verdict": guardian_data.payload.get("verdict", "SKIPPED") if guardian_data else "SKIPPED",
            "guardian_score": guardian_data.payload.get("score", 0) if guardian_data else 0,
            "guardian_issues": guardian_data.payload.get("issues", []) if guardian_data else [],
            "model": harm_data.metadata.get("model", "N/A"),
            "attempts": harm_data.metadata.get("attempts", 1),
            "pipeline_strategy": plan["strategy"],
            "agents_invoked": list(agent_results.keys()),
        }
        
        # Cache to Qdrant if approved
        if self.memory and final_result["guardian_verdict"] in ("APPROVE", "FLAG"):
            try:
                self.memory.cache_translation(
                    project_id=project_data.get("project_id", 0),
                    name_id=project_data.get("name_id", ""),
                    name_en=final_result["name_en"],
                    description_id=project_data.get("description_id", ""),
                    description_en=final_result["description_en"],
                    model=final_result["model"],
                    quality_score=final_result.get("quality_score", 0),
                    trace_id=trace_id,
                )
            except Exception as e:
                logger.warning(f"[orchestrator] Cache write failed: {e}")
        
        # Log completion
        completion_msg = AgentMessage(
            trace_id=trace_id,
            from_agent="orchestrator",
            to_agent="api",
            action=AgentAction.PIPELINE_COMPLETE,
            payload=final_result,
            metadata={"total_ms": total_ms},
        )
        self.audit.log(completion_msg)
        
        yield {
            "event": "pipeline_complete",
            "trace_id": trace_id,
            "total_ms": total_ms,
            "result": final_result,
        }
