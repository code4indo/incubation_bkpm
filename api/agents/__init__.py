"""
BKPM Agentic Architecture — Multi-Agent System
================================================
Backend agent layer implementing true agentic patterns:
- LLM-driven orchestration (not hard-coded routing)
- Agent memory via Qdrant
- Self-correction loops
- Inter-agent message protocol
- Audit trail for every decision
"""

from .message import AgentMessage, AgentAction
from .base import BaseAgent
from .memory import AgentMemory
from .scout import ScoutAgent
from .harmonizer import HarmonizerAgent
from .guardian import GuardianAgent
from .orchestrator import OrchestratorAgent
from .audit import AuditTrail

__all__ = [
    "AgentMessage",
    "AgentAction",
    "BaseAgent",
    "AgentMemory",
    "ScoutAgent",
    "HarmonizerAgent",
    "GuardianAgent",
    "OrchestratorAgent",
    "AuditTrail",
]
