"""
ResolveX Predictions & Impact Analytics Endpoints
Provides evidence-backed affected customer prediction, chronological impact trends,
near-term forecasting, and prediction feedback metrics.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status, Query

from apps.api.app.domain.schemas import (
    ApiResponse,
    ApiErrorResponse,
    CustomerImpactPredictionSchema,
    ImpactTrendPointSchema,
    ImpactForecastSchema,
    IncidentImpactOverviewSchema,
    PredictionFeedbackMetricsSchema,
    CustomerRiskResponseSchema
)
from apps.api.app.services.prediction_engine import prediction_engine
from apps.api.app.services.impact_analytics_service import impact_analytics_service
from apps.api.app.services.prediction_feedback_service import prediction_feedback_service
from apps.api.app.services.incident_service import incident_service

router = APIRouter(tags=["Predictions & Impact"])

@router.get("/incidents/{incident_id}/predictions", response_model=ApiResponse[List[CustomerImpactPredictionSchema]], responses={404: {"model": ApiErrorResponse}})
async def get_incident_predictions(incident_id: str):
    """Retrieves evidence-backed customer impact predictions for a specific incident"""
    inc = await incident_service.get_incident(incident_id)
    if not inc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "INCIDENT_NOT_FOUND", "message": f"Incident '{incident_id}' not found."}
        )
    preds = await prediction_engine.predict_affected_customers(incident_id)
    return ApiResponse(data=preds, meta={"total_predictions": len(preds)})

@router.post("/incidents/{incident_id}/impact/analyze", response_model=ApiResponse[List[CustomerImpactPredictionSchema]], responses={404: {"model": ApiErrorResponse}})
async def analyze_incident_impact(incident_id: str):
    """Triggers real-time customer impact discovery and classification scan"""
    inc = await incident_service.get_incident(incident_id)
    if not inc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "INCIDENT_NOT_FOUND", "message": f"Incident '{incident_id}' not found."}
        )
    preds = await prediction_engine.predict_affected_customers(incident_id)
    return ApiResponse(data=preds, meta={"message": f"Analyzed impact: {len(preds)} candidates classified."})

@router.get("/incidents/{incident_id}/impact", response_model=ApiResponse[IncidentImpactOverviewSchema], responses={404: {"model": ApiErrorResponse}})
async def get_incident_impact_overview(incident_id: str):
    """Retrieves full impact overview including breakdown, trend, and near-term projection"""
    overview = await impact_analytics_service.get_incident_impact_overview(incident_id)
    if not overview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "INCIDENT_NOT_FOUND", "message": f"Incident '{incident_id}' not found."}
        )
    return ApiResponse(data=overview)

@router.get("/incidents/{incident_id}/impact/trend", response_model=ApiResponse[List[ImpactTrendPointSchema]], responses={404: {"model": ApiErrorResponse}})
async def get_incident_impact_trend(incident_id: str):
    """Retrieves chronological impact progression points derived from actual timestamps"""
    inc = await incident_service.get_incident(incident_id)
    if not inc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "INCIDENT_NOT_FOUND", "message": f"Incident '{incident_id}' not found."}
        )
    trend = await impact_analytics_service.get_incident_impact_trend(incident_id)
    return ApiResponse(data=trend, meta={"data_points": len(trend)})

@router.get("/incidents/{incident_id}/impact/forecast", response_model=ApiResponse[ImpactForecastSchema], responses={404: {"model": ApiErrorResponse}})
async def get_incident_impact_forecast(incident_id: str):
    """Retrieves near-term impact forecast or explicit insufficient data notice"""
    inc = await incident_service.get_incident(incident_id)
    if not inc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "INCIDENT_NOT_FOUND", "message": f"Incident '{incident_id}' not found."}
        )
    forecast = await impact_analytics_service.get_impact_forecast(incident_id)
    return ApiResponse(data=forecast)

@router.get("/predictions/metrics", response_model=ApiResponse[PredictionFeedbackMetricsSchema])
async def get_prediction_metrics():
    """Retrieves prediction feedback metrics and model versioning metadata"""
    metrics = await prediction_feedback_service.get_prediction_metrics()
    return ApiResponse(data=metrics, meta=prediction_feedback_service.model_version_info)
