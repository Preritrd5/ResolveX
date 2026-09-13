"""
ResolveX API v1 Master Router
"""

from fastapi import APIRouter
from apps.api.app.api.v1.endpoints.health import router as health_router
from apps.api.app.api.v1.endpoints.customers import router as customers_router
from apps.api.app.api.v1.endpoints.tickets import router as tickets_router
from apps.api.app.api.v1.endpoints.orders import router as orders_router
from apps.api.app.api.v1.endpoints.payments import payments_router, refunds_router
from apps.api.app.api.v1.endpoints.incidents import router as incidents_router
from apps.api.app.api.v1.endpoints.escalations import router as escalations_router
from apps.api.app.api.v1.endpoints.analytics import router as analytics_router
from apps.api.app.api.v1.endpoints.agents import router as agents_router
from apps.api.app.api.v1.endpoints.knowledge import router as knowledge_router
from apps.api.app.api.v1.endpoints.ai import router as ai_router
from apps.api.app.api.v1.endpoints.investigations import router as investigations_router
from apps.api.app.api.v1.endpoints.actions import router as actions_router
from apps.api.app.api.v1.endpoints.predictions import router as predictions_router
from apps.api.app.api.v1.endpoints.early_warnings import router as early_warnings_router
from apps.api.app.api.v1.endpoints.proactive import router as proactive_router
from apps.api.app.api.v1.endpoints.search import router as search_router
from apps.api.app.api.v1.endpoints.demo import router as demo_router
from apps.api.app.api.v1.endpoints.support import router as support_router
from apps.api.app.api.v1.endpoints.auth import router as auth_router
from apps.api.app.api.v1.endpoints.integrations import router as integrations_router

api_router = APIRouter()

# Register health at root and api/v1
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(integrations_router)
api_router.include_router(support_router)
api_router.include_router(customers_router)
api_router.include_router(tickets_router)
api_router.include_router(orders_router)
api_router.include_router(payments_router)
api_router.include_router(refunds_router)
api_router.include_router(incidents_router)
api_router.include_router(escalations_router)
api_router.include_router(analytics_router)
api_router.include_router(agents_router)
api_router.include_router(knowledge_router)
api_router.include_router(ai_router)
api_router.include_router(investigations_router)
api_router.include_router(actions_router)
api_router.include_router(predictions_router)
api_router.include_router(early_warnings_router)
api_router.include_router(proactive_router)
api_router.include_router(search_router)
api_router.include_router(demo_router)



