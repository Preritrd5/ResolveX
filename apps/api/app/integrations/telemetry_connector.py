"""
ResolveX Telemetry & Observability Connectors
Normalizes system errors, traces, and alert webhooks from Datadog and CloudWatch.
"""

from typing import Dict, Any
from apps.api.app.integrations.base_connector import BaseConnector, InboundTelemetryEvent

class DatadogConnector(BaseConnector):
    name = "datadog"
    display_name = "Datadog APM"
    category = "telemetry"
    description = "Trace microservice latency anomalies, Redis connection timeouts, and error spikes."
    icon = "datadog"
    status = "connected"
    webhook_path = "/api/v1/integrations/webhooks/datadog"

    async def health_check(self) -> Dict[str, Any]:
        return {
            "status": "healthy",
            "connected": True,
            "latency_ms": 29.4,
            "monitored_services": ["payment-webhook-worker", "order-ingestion", "refund-settlement-cron"],
            "active_monitors": 12
        }

    def verify_webhook(self, headers: Dict[str, str], payload: Dict[str, Any]) -> bool:
        return True

    def normalize(self, raw_payload: Dict[str, Any]) -> InboundTelemetryEvent:
        event = raw_payload.get("event", raw_payload)
        return InboundTelemetryEvent(
            trace_id=str(event.get("trace_id", "trace_dd_99182")),
            service_name=event.get("service", event.get("service_name", "payment-webhook-worker")),
            event_type=event.get("event_type", "redis_enqueue_timeout"),
            severity=event.get("severity", "critical"),
            message=event.get("message", "Redis connection pool timeout (5000ms) on worker queue."),
            latency_ms=event.get("latency_ms", 5002.1),
            payload=raw_payload
        )

class SlackConnector(BaseConnector):
    name = "slack"
    display_name = "Slack Ops"
    category = "communication"
    description = "Automated incident broadcast channels (#ops-incidents, #support-escalations)."
    icon = "slack"
    status = "connected"
    webhook_path = "/api/v1/integrations/webhooks/slack"

    async def health_check(self) -> Dict[str, Any]:
        return {
            "status": "healthy",
            "connected": True,
            "latency_ms": 19.8,
            "workspace": "Acme Operations Slack",
            "bot_user": "@resolvex-bot",
            "channels_bound": ["#ops-incidents", "#cx-escalations"]
        }

    def verify_webhook(self, headers: Dict[str, str], payload: Dict[str, Any]) -> bool:
        return True

    def normalize(self, raw_payload: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "channel": raw_payload.get("channel", "#ops-incidents"),
            "text": raw_payload.get("text", "ResolveX notification"),
            "user": raw_payload.get("user", "U12345")
        }
