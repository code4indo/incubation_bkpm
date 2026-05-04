"""
Inter-Agent Message Protocol
=============================
Structured messages for agent-to-agent communication.
Every agent action is traceable via trace_id for audit trail.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional


class AgentAction(str, Enum):
    """Actions an agent can request or report."""
    # Scout actions
    EVALUATE_LANGUAGE = "evaluate_language"
    
    # Orchestrator actions
    ROUTE = "route"
    CLASSIFY_INTENT = "classify_intent"
    
    # Harmonizer actions
    TRANSLATE = "translate"
    TRANSLATE_NAME = "translate_name"
    TRANSLATE_DESCRIPTION = "translate_description"
    
    # Guardian actions
    VALIDATE_TRANSLATION = "validate_translation"
    CHECK_TERMINOLOGY = "check_terminology"
    
    # Pipeline lifecycle
    PIPELINE_START = "pipeline_start"
    PIPELINE_COMPLETE = "pipeline_complete"
    PIPELINE_ERROR = "pipeline_error"
    
    # Quality
    QUALITY_CHECK = "quality_check"
    SELF_CORRECT = "self_correct"


@dataclass
class AgentMessage:
    """
    Structured message passed between agents.
    
    Every message carries:
    - trace_id: unique pipeline execution ID (shared across all agents in one pipeline)
    - from_agent / to_agent: source and destination
    - action: what the agent did or requests
    - payload: the actual data
    - confidence: how confident the agent is in its output (0.0 - 1.0)
    """
    trace_id: str
    from_agent: str
    to_agent: str
    action: AgentAction
    payload: dict[str, Any]
    confidence: float = 0.0
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    metadata: dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None
    
    @staticmethod
    def create_trace_id() -> str:
        """Generate unique trace ID for a pipeline execution."""
        return f"tr_{uuid.uuid4().hex[:12]}_{int(datetime.now(timezone.utc).timestamp())}"
    
    def to_dict(self) -> dict[str, Any]:
        return {
            "trace_id": self.trace_id,
            "from_agent": self.from_agent,
            "to_agent": self.to_agent,
            "action": self.action.value,
            "payload": self.payload,
            "confidence": self.confidence,
            "timestamp": self.timestamp,
            "metadata": self.metadata,
            "error": self.error,
        }
    
    def reply(
        self,
        from_agent: str,
        action: AgentAction,
        payload: dict[str, Any],
        confidence: float = 0.0,
        **kwargs: Any,
    ) -> AgentMessage:
        """Create a reply message in the same trace."""
        return AgentMessage(
            trace_id=self.trace_id,
            from_agent=from_agent,
            to_agent=self.from_agent,
            action=action,
            payload=payload,
            confidence=confidence,
            metadata=kwargs.get("metadata", {}),
            error=kwargs.get("error"),
        )
