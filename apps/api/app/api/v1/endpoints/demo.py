"""
ResolveX Demo Controls & Safe Reset Endpoints
"""

from fastapi import APIRouter, Body
from apps.api.app.services.demo_service import demo_service
from apps.api.app.domain.schemas import ApiResponse, DemoStatusSchema, DemoResetResponseSchema

router = APIRouter(prefix="/demo", tags=["Demo Management"])

@router.get("/status", response_model=ApiResponse[DemoStatusSchema])
async def get_demo_status():
    status = await demo_service.get_demo_status()
    return ApiResponse(data=status)

@router.post("/reset", response_model=ApiResponse[DemoResetResponseSchema])
async def reset_demo_baseline(
    seed: int = Body(42, embed=True),
    actor: str = Body("operator_maya_patel", embed=True)
):
    result = await demo_service.reset_demo_data(seed=seed, requested_by=actor)
    return ApiResponse(data=result)
