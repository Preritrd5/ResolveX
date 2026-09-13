"""
ResolveX Integration Connector Base Abstraction
Defines the unified interface for third-party enterprise integrations
(Helpdesks, E-commerce, Payment Gateways, Observability, and Telemetry).
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from pydantic import BaseModel

class InboundTicketPayload(BaseModel):
    external_id: str
    requester_email: str
    requester_name: str
    subject: str
    body: str
    priority: str = "medium"
    category: Optional[str] = None
    order_id: Optional[str] = None
    raw_payload: Dict[str, Any] = {}

class InboundPaymentEvent(BaseModel):
    event_id: str
    event_type: str
    gateway_name: str
    transaction_id: str
    customer_email: Optional[str] = None
    amount_cents: int
    currency: str = "USD"
    status: str
    failure_code: Optional[str] = None
    failure_message: Optional[str] = None
    raw_payload: Dict[str, Any] = {}

class InboundTelemetryEvent(BaseModel):
    trace_id: str
    service_name: str
    event_type: str
    severity: str
    message: str
    latency_ms: Optional[float] = None
    payload: Dict[str, Any] = {}

class BaseConnector(ABC):
    name: str
    display_name: str
    category: str
    description: str
    icon: str
    status: str = "connected"
    events_processed: int = 0
    webhook_path: str

    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """Performs connectivity & authentication handshake with the third-party service."""
        pass

    @abstractmethod
    def verify_webhook(self, headers: Dict[str, str], payload: Dict[str, Any]) -> bool:
        """Verifies cryptographic signature or webhook secret."""
        pass

    @abstractmethod
    def normalize(self, raw_payload: Dict[str, Any]) -> Any:
        """Normalizes vendor-specific payload into a standard ResolveX domain contract."""
        pass
