"""
Audit Trail — Agent Decision Logger
=====================================
Logs every agent decision to Qdrant for traceability.
"""

from __future__ import annotations

import logging
from typing import Any, Optional

from .message import AgentMessage

logger = logging.getLogger("agents.audit")


class AuditTrail:
    """
    Logs all agent messages/decisions to persistent storage.
    Every pipeline execution is fully traceable via trace_id.
    """
    
    def __init__(self, memory: Any = None):
        self.memory = memory
    
    def log(self, message: AgentMessage) -> None:
        """Log an agent message to the audit trail."""
        msg_dict = message.to_dict()
        
        # Log to console
        logger.info(
            f"[AUDIT] {message.from_agent} → {message.to_agent}: "
            f"{message.action.value} (confidence: {message.confidence:.2f}, trace: {message.trace_id})"
        )
        
        # Persist to Qdrant
        if self.memory:
            try:
                self.memory.log_decision(msg_dict)
            except Exception as e:
                logger.warning(f"[AUDIT] Failed to persist to Qdrant: {e}")
    
    def get_trace(self, trace_id: str) -> list[dict[str, Any]]:
        """Get full audit trail for a pipeline execution."""
        if self.memory:
            try:
                return self.memory.get_decisions_by_trace(trace_id)
            except Exception as e:
                logger.warning(f"[AUDIT] Failed to retrieve trace: {e}")
        return []
