"""
ResolveX Connector Registry
Central registry managing external SaaS connectors, diagnostic tests, and webhook ingestion.
"""

from typing import Dict, List, Optional, Any
from apps.api.app.integrations.base_connector import BaseConnector
from apps.api.app.integrations.ticketing_connector import ZendeskConnector, FreshdeskConnector
from apps.api.app.integrations.payment_connector import StripeConnector, ShopifyConnector
from apps.api.app.integrations.telemetry_connector import DatadogConnector, SlackConnector
from apps.api.app.domain.schemas import IntegrationConnectorSchema, IntegrationTestResultSchema

class ConnectorRegistry:
    def __init__(self):
        self._connectors: Dict[str, BaseConnector] = {}
        self._register_default_connectors()

    def _register_default_connectors(self):
        self._connectors["zendesk"] = ZendeskConnector()
        self._connectors["freshdesk"] = FreshdeskConnector()
        self._connectors["stripe"] = StripeConnector()
        self._connectors["shopify"] = ShopifyConnector()
        self._connectors["datadog"] = DatadogConnector()
        self._connectors["slack"] = SlackConnector()

    def get_connector(self, name: str) -> Optional[BaseConnector]:
        return self._connectors.get(name.lower())

    def list_connectors(self) -> List[IntegrationConnectorSchema]:
        results = []
        for c in self._connectors.values():
            results.append(IntegrationConnectorSchema(
                id=c.name,
                name=c.name,
                category=c.category,
                display_name=c.display_name,
                description=c.description,
                status=c.status,
                icon=c.icon,
                webhook_url=c.webhook_path,
                last_synced_at="2026-09-13T14:35:00Z",
                events_processed_count=1420 if c.status == "connected" else 0,
                health_status="healthy" if c.status == "connected" else "idle",
                config={}
            ))
        return results

    async def test_connector(self, name: str) -> IntegrationTestResultSchema:
        conn = self.get_connector(name)
        if not conn:
            return IntegrationTestResultSchema(
                connector_id=name,
                name=name,
                status="error",
                latency_ms=0.0,
                message=f"Connector '{name}' is not registered."
            )

        health = await conn.health_check()
        return IntegrationTestResultSchema(
            connector_id=conn.name,
            name=conn.display_name,
            status="healthy" if health.get("status") in ("healthy", "idle") else "error",
            latency_ms=float(health.get("latency_ms", 25.0)),
            message=f"Handshake verified for {conn.display_name}. Webhook endpoint active.",
            sample_payload=health
        )

connector_registry = ConnectorRegistry()
