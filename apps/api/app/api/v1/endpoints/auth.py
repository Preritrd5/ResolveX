"""
ResolveX Authentication & RBAC Session Endpoints
Provides endpoints to inspect current user session, organization scoping,
and switch active development/evaluator personas.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel

from apps.api.app.core.auth import get_current_user, SEEDED_PERSONAS, ROLE_PERMISSIONS_MAP
from apps.api.app.domain.schemas import ApiResponse, UserSessionSchema

router = APIRouter(prefix="/auth", tags=["Authentication & Session"])

class RoleSwitchRequest(BaseModel):
    role: str

@router.get("/me", response_model=ApiResponse[UserSessionSchema])
async def get_my_session(
    current_user: UserSessionSchema = Depends(get_current_user)
):
    """Retrieves the active user identity, organization context, and RBAC permissions."""
    return ApiResponse(data=current_user)

@router.get("/personas", response_model=ApiResponse[List[Dict[str, Any]]])
async def list_available_personas():
    """Returns available internal employee personas for demonstration and testing."""
    personas = []
    for role_key, p in SEEDED_PERSONAS.items():
        personas.append({
            "id": p["id"],
            "role": p["role"],
            "full_name": p["full_name"],
            "email": p["email"],
            "org_name": p["org_name"],
            "permissions": ROLE_PERMISSIONS_MAP.get(p["role"], [])
        })
    return ApiResponse(data=personas)

@router.post("/switch-role", response_model=ApiResponse[UserSessionSchema])
async def switch_persona_role(payload: RoleSwitchRequest):
    """Simulates switching the active persona role for evaluation."""
    target_role = payload.role.lower()
    if target_role not in SEEDED_PERSONAS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_ROLE",
                "message": f"Invalid role '{payload.role}'. Must be one of: {list(SEEDED_PERSONAS.keys())}"
            }
        )
    p = SEEDED_PERSONAS[target_role]
    session = UserSessionSchema(
        id=p["id"],
        org_id=p["org_id"],
        org_name=p["org_name"],
        email=p["email"],
        full_name=p["full_name"],
        role=p["role"],
        permissions=ROLE_PERMISSIONS_MAP.get(p["role"], []),
        is_active=True
    )
    return ApiResponse(data=session)
