"""
ResolveX Strongly-Typed LangGraph State Definition
Enforces explicit, serializable state transitions across the multi-agent investigation lifecycle.
"""

import operator
from typing import TypedDict, List, Dict, Any, Optional, Annotated
from apps.api.app.domain.case_context import CaseContext
from apps.api.app.domain.schemas import (
    IntentClassification,
    SentimentAnalysis,
    RoutingDecision,
    SpecialistFinding,
    EvidenceItem,
    KnowledgeSnippet,
    InvestigationStepSchema,
    AgentRunSchema,
    SupervisorDecision,
    AIResponse
)

def merge_evidence(left: Optional[List[EvidenceItem]], right: Optional[List[EvidenceItem]]) -> List[EvidenceItem]:
    """
    Safely merges evidence lists from concurrent specialist nodes or supervisor aggregation
    without creating duplicate entries.
    """
    res = list(left or [])
    seen_ids = {e.id for e in res}
    seen_entities = {f"{e.type}:{e.source_entity_id}" for e in res}
    for item in (right or []):
        entity_key = f"{item.type}:{item.source_entity_id}"
        if item.id not in seen_ids and entity_key not in seen_entities:
            seen_ids.add(item.id)
            seen_entities.add(entity_key)
            res.append(item)
    return res

class InvestigationState(TypedDict, total=False):
    """
    Shared canonical state passed through the LangGraph investigation DAG.
    Reducers ensure safe concurrent fan-in from specialist agent nodes.
    """
    case_id: str
    ticket_id: str
    org_id: str
    case_context: Optional[CaseContext]
    intent: Optional[IntentClassification]
    urgency: str
    sentiment: Optional[SentimentAnalysis]
    complexity: str
    
    # Coordination & Routing
    requested_specialists: List[str]
    completed_specialists: Annotated[List[str], operator.add]
    supervisor_decision: Optional[SupervisorDecision]
    
    # Specialist Outputs (Aggregated via safe reducers)
    agent_findings: Annotated[List[SpecialistFinding], operator.add]
    evidence: Annotated[List[EvidenceItem], merge_evidence]
    knowledge_results: Annotated[List[KnowledgeSnippet], operator.add]
    investigation_steps: Annotated[List[InvestigationStepSchema], operator.add]
    agent_runs: Annotated[List[AgentRunSchema], operator.add]
    agent_errors: Annotated[List[Dict[str, Any]], operator.add]
    
    # Synthesis & Results
    confidence: float
    supervisor_summary: Optional[str]
    recommended_next_step: Optional[str]
    workflow_status: str
    routing: Optional[RoutingDecision]
    ai_response: Optional[AIResponse]
    trace_metadata: Dict[str, Any]
    
    # Timestamps
    started_at: str
    completed_at: Optional[str]
