"""
ResolveX Analytics & Overview Metrics Endpoints
"""

from fastapi import APIRouter
from apps.api.app.services.analytics_service import analytics_service
from apps.api.app.domain.schemas import ApiResponse, OverviewMetricsSchema, AdvancedCXAnalyticsSchema

router = APIRouter(prefix="/analytics", tags=["CX Analytics"])

@router.get("/overview", response_model=ApiResponse[OverviewMetricsSchema])
async def get_overview_metrics():
    metrics = await analytics_service.get_overview_metrics()
    return ApiResponse(data=metrics)

@router.get("/cx", response_model=ApiResponse[AdvancedCXAnalyticsSchema])
async def get_advanced_cx_analytics():
    analytics = await analytics_service.get_advanced_cx_analytics()
    return ApiResponse(data=analytics)
