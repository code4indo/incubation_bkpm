"""
BaseAgent — Abstract Agent Foundation
=======================================
All agents extend this class. Provides:
- LLM communication (Ollama)
- Memory access (Qdrant)
- Think → Act → Reflect loop
- Structured logging
"""

from __future__ import annotations

import logging
import time
from abc import ABC, abstractmethod
from typing import Any, Optional

import httpx

from .message import AgentMessage, AgentAction

logger = logging.getLogger("agents")

# Ollama configuration — accessible from Docker via host gateway
OLLAMA_BASE_URL = "http://172.27.0.1:11434"
DEFAULT_MODEL = "qwen2.5:14b"
FALLBACK_MODEL = "qwen2.5:7b"
LLM_TIMEOUT = 120  # seconds


class BaseAgent(ABC):
    """
    Abstract base for all BKPM agents.
    
    Agentic contract:
    1. think()   — Reason about the input, plan action
    2. act()     — Execute the plan (call LLM, tools, etc.)
    3. reflect() — Evaluate quality of own output, decide if retry needed
    """
    
    name: str = "base"
    role: str = "Generic agent"
    system_prompt: str = ""
    
    def __init__(self, memory: Any = None):
        self.memory = memory
        self._http = httpx.AsyncClient(timeout=httpx.Timeout(LLM_TIMEOUT))
    
    async def close(self):
        await self._http.aclose()
    
    # ── Core Agentic Loop ──
    
    @abstractmethod
    async def think(self, message: AgentMessage) -> dict[str, Any]:
        """
        Reason about the input. Return a plan dict describing what to do.
        This is where the agent decides its strategy.
        """
        ...
    
    @abstractmethod
    async def act(self, message: AgentMessage, plan: dict[str, Any]) -> AgentMessage:
        """
        Execute the plan. Call LLM, tools, or other agents.
        Returns a structured AgentMessage with results.
        """
        ...
    
    async def reflect(self, message: AgentMessage, result: AgentMessage) -> bool:
        """
        Evaluate quality of own output.
        Returns True if result is acceptable, False if retry needed.
        Default: always accept (override for self-correction).
        """
        return True
    
    async def run(self, message: AgentMessage, max_retries: int = 2) -> AgentMessage:
        """
        Execute the full Think → Act → Reflect loop with retry.
        """
        logger.info(f"[{self.name}] ▶️  Processing: {message.action.value} (trace: {message.trace_id})")
        start = time.time()
        
        last_result: Optional[AgentMessage] = None
        
        for attempt in range(1, max_retries + 1):
            try:
                # 1. Think: plan the action
                plan = await self.think(message)
                logger.info(f"[{self.name}] 🧠 Plan (attempt {attempt}): {plan.get('strategy', 'default')}")
                
                # 2. Act: execute
                result = await self.act(message, plan)
                last_result = result
                
                # 3. Reflect: is this good enough?
                is_acceptable = await self.reflect(message, result)
                
                if is_acceptable:
                    latency_ms = int((time.time() - start) * 1000)
                    result.metadata["latency_ms"] = latency_ms
                    result.metadata["attempts"] = attempt
                    logger.info(f"[{self.name}] ✅ Completed in {latency_ms}ms (attempt {attempt})")
                    return result
                
                logger.warning(f"[{self.name}] 🔄 Reflection failed, retrying ({attempt}/{max_retries})")
                
                # Update message with reflection feedback for next attempt
                message.metadata["retry_reason"] = result.metadata.get("reflection_feedback", "quality_below_threshold")
                message.metadata["previous_attempt"] = result.payload
                
            except Exception as e:
                logger.error(f"[{self.name}] ❌ Attempt {attempt} failed: {e}")
                if attempt == max_retries:
                    latency_ms = int((time.time() - start) * 1000)
                    return message.reply(
                        from_agent=self.name,
                        action=AgentAction.PIPELINE_ERROR,
                        payload={"error": str(e)},
                        confidence=0.0,
                        metadata={"latency_ms": latency_ms, "attempts": attempt},
                        error=str(e),
                    )
        
        # All retries exhausted, return last result even if imperfect
        if last_result:
            last_result.metadata["quality_warning"] = "max_retries_exhausted"
            return last_result
        
        return message.reply(
            from_agent=self.name,
            action=AgentAction.PIPELINE_ERROR,
            payload={"error": "No result after retries"},
            error="Agent exhausted all retries without producing a result",
        )
    
    # ── LLM Communication ──
    
    async def call_llm(
        self,
        messages: list[dict[str, str]],
        model: str = DEFAULT_MODEL,
        temperature: float = 0.2,
        max_tokens: int = 800,
    ) -> str:
        """
        Call Ollama LLM with retry + fallback model.
        """
        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
                "top_p": 0.9,
            },
        }
        
        try:
            resp = await self._http.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            
            if data.get("error"):
                raise RuntimeError(data["error"])
            
            content = (data.get("message", {}).get("content", "") or data.get("response", "")).strip()
            
            if not content:
                raise RuntimeError("LLM returned empty content")
            
            return content
            
        except Exception as e:
            # Fallback to smaller model
            if model == DEFAULT_MODEL:
                logger.warning(f"[{self.name}] {DEFAULT_MODEL} failed ({e}), trying {FALLBACK_MODEL}")
                return await self.call_llm(messages, model=FALLBACK_MODEL, temperature=temperature, max_tokens=max_tokens)
            raise RuntimeError(f"LLM unavailable: {e}")
    
    async def call_llm_json(
        self,
        messages: list[dict[str, str]],
        model: str = DEFAULT_MODEL,
        temperature: float = 0.1,
    ) -> dict[str, Any]:
        """Call LLM expecting JSON output. Parses the response."""
        import json as _json
        import re
        
        raw = await self.call_llm(messages, model=model, temperature=temperature)
        
        # Try to extract JSON from response
        json_match = re.search(r'\{[\s\S]*\}', raw)
        if json_match:
            return _json.loads(json_match.group())
        
        raise RuntimeError(f"LLM did not return valid JSON. Raw: {raw[:200]}")
