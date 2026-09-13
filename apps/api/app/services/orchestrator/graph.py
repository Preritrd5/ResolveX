"""
ResolveX LangGraph Investigation DAG
Compiles the multi-agent investigation workflow with dynamic Send routing,
parallel specialist execution, evidence aggregation, and supervisor synthesis.
"""

from typing import List, Dict, Any
from langgraph.graph import StateGraph, START, END
from langgraph.types import Send

from apps.api.app.services.orchestrator.state import InvestigationState
from apps.api.app.services.orchestrator.supervisor import supervisor_agent
from apps.api.app.services.specialists.agent_base import execute_specialist_node
from apps.api.app.services.specialists.billing_investigator import billing_investigator
from apps.api.app.services.specialists.order_investigator import order_investigator
from apps.api.app.services.specialists.refund_investigator import refund_investigator
from apps.api.app.services.specialists.account_investigator import account_investigator
from apps.api.app.services.specialists.technical_investigator import technical_investigator
from apps.api.app.services.specialists.policy_investigator import policy_investigator

# Agent IDs matching seeded registry
AGENT_IDS = {
    "supervisor": "b5d4473a-b5fd-5d38-8c74-be0fd1b68679",
    "billing": "a5f7e8bb-885b-5586-a315-4d43c7201e68",
    "order": "97286ac0-3b7a-5905-a7b8-d5f7c9304b43",
    "refund": "9dd9f0b1-43df-5c03-9bb5-4f3874b6be6c",
    "account": "77bef7b7-0543-5a6b-977c-02e27443aa4b",
    "technical": "b89594fe-6651-5322-a2d4-65584894040e",
    "policy": "a982e9a2-18ff-51ff-9b13-b815544bef42"
}

# Specialist Node Wrappers
def billing_node(state: InvestigationState) -> Dict[str, Any]:
    return execute_specialist_node(
        agent_name="Billing Agent",
        agent_id=AGENT_IDS["billing"],
        action_type="payment_gateway_audit",
        tool_name="billing_investigator",
        state=state,
        investigate_fn=billing_investigator.investigate
    )

def order_node(state: InvestigationState) -> Dict[str, Any]:
    return execute_specialist_node(
        agent_name="Order Agent",
        agent_id=AGENT_IDS["order"],
        action_type="order_lifecycle_audit",
        tool_name="order_investigator",
        state=state,
        investigate_fn=order_investigator.investigate
    )

def technical_node(state: InvestigationState) -> Dict[str, Any]:
    return execute_specialist_node(
        agent_name="Technical Agent",
        agent_id=AGENT_IDS["technical"],
        action_type="microservice_telemetry_audit",
        tool_name="technical_investigator",
        state=state,
        investigate_fn=technical_investigator.investigate
    )

def policy_node(state: InvestigationState) -> Dict[str, Any]:
    return execute_specialist_node(
        agent_name="Policy Agent",
        agent_id=AGENT_IDS["policy"],
        action_type="policy_sla_audit",
        tool_name="policy_investigator",
        state=state,
        investigate_fn=policy_investigator.investigate
    )

def refund_node(state: InvestigationState) -> Dict[str, Any]:
    return execute_specialist_node(
        agent_name="Refund Agent",
        agent_id=AGENT_IDS["refund"],
        action_type="refund_clearinghouse_audit",
        tool_name="refund_investigator",
        state=state,
        investigate_fn=refund_investigator.investigate
    )

def account_node(state: InvestigationState) -> Dict[str, Any]:
    return execute_specialist_node(
        agent_name="Account Agent",
        agent_id=AGENT_IDS["account"],
        action_type="account_security_audit",
        tool_name="account_investigator",
        state=state,
        investigate_fn=account_investigator.investigate
    )

SPECIALIST_NODES = {
    "billing": "billing_node",
    "order": "order_node",
    "technical": "technical_node",
    "policy": "policy_node",
    "refund": "refund_node",
    "account": "account_node"
}

def route_specialists(state: InvestigationState) -> List[Send]:
    """
    Dynamic Send router: dispatches only the specialists selected by Supervisor.
    Prevents unnecessary LLM and tool execution for unrelated domains.
    """
    requested = state.get("requested_specialists", ["billing", "order", "policy"])
    sends = []
    for agent_key in requested:
        node_name = SPECIALIST_NODES.get(agent_key.lower())
        if node_name:
            sends.append(Send(node_name, state))
    
    # Fallback to billing if empty
    if not sends:
        sends.append(Send("billing_node", state))
        
    return sends

def build_investigation_graph():
    """
    Constructs and compiles the LangGraph StateGraph.
    """
    builder = StateGraph(InvestigationState)

    # 1. Register Nodes
    builder.add_node("supervisor_plan", supervisor_agent.plan_investigation)
    builder.add_node("billing_node", billing_node)
    builder.add_node("order_node", order_node)
    builder.add_node("technical_node", technical_node)
    builder.add_node("policy_node", policy_node)
    builder.add_node("refund_node", refund_node)
    builder.add_node("account_node", account_node)
    builder.add_node("evidence_aggregator", supervisor_agent.aggregate_evidence)
    builder.add_node("supervisor_synthesis", supervisor_agent.synthesize_findings)

    # 2. Wire Entry Point & Dynamic Dispatch
    builder.add_edge(START, "supervisor_plan")
    builder.add_conditional_edges(
        "supervisor_plan",
        route_specialists,
        list(SPECIALIST_NODES.values())
    )

    # 3. Fan-in from all Specialists to Evidence Aggregator
    for node_name in SPECIALIST_NODES.values():
        builder.add_edge(node_name, "evidence_aggregator")

    # 4. Final Synthesis & Termination
    builder.add_edge("evidence_aggregator", "supervisor_synthesis")
    builder.add_edge("supervisor_synthesis", END)

    return builder.compile()

# Singleton compiled graph
investigation_graph = build_investigation_graph()
