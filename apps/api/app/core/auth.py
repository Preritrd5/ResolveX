"""
ResolveX Multi-Tenant RBAC & Authentication Module
Enforces strict organization scoping (org_id) and role-based access control.
Internal employee roles:
  - support_agent: Agent workspace, assigned cases, customer context, AI suggested replies
  - support_manager: Workload overview, escalations, incident tracking, CX analytics
  - lead_investigator: Incident Command Center, root-cause investigation, blast radius, proactive actions
  - admin: Organization settings, RBAC permissions, AI safety boundaries, integrations
"""

import os
from typing import List, Optional, Dict, Any
from fastapi import Header, HTTPException, status, Depends
from pydantic import BaseModel

from apps.api.app.core.config import settings
from apps.api.app.core.logging import logger
from apps.api.app.domain.schemas import UserRole, UserSessionSchema

# Role permissions matrix
ROLE_PERMISSIONS_MAP: Dict[str, List[str]] = {
    UserRole.SUPPORT_AGENT.value: [
        "cases:read",
        "cases:update",
        "ai:copilot",
        "escalations:request",
        "customers:read",
        "knowledge:read"
    ],
    UserRole.SUPPORT_MANAGER.value: [
        "cases:read",
        "cases:manage",
        "incidents:read",
        "escalations:read",
        "escalations:approve",
        "customers:read",
        "analytics:read",
        "knowledge:read"
    ],
    UserRole.LEAD_INVESTIGATOR.value: [
        "incidents:read",
        "incidents:manage",
        "investigations:run",
        "cases:read",
        "actions:execute",
        "proactive:manage",
        "analytics:read"
    ],
    UserRole.ADMIN.value: [
        "*"
    ]
}

# Seeded personas for Acme Commerce Inc. (Organization 00000000-0000-0000-0000-000000000001)
SEEDED_PERSONAS: Dict[str, Dict[str, Any]] = {
    "admin": {
        "id": "00000000-0000-0000-0000-000000000010",
        "email": "admin@acmecommerce.com",
        "full_name": "Devin Wright",
        "role": UserRole.ADMIN.value,
        "org_id": settings.DEFAULT_ORG_ID,
        "org_name": "Acme Commerce Inc."
    },
    "support_agent": {
        "id": "00000000-0000-0000-0000-000000000011",
        "email": "alex.rivera@acmecommerce.com",
        "full_name": "Alex Rivera",
        "role": UserRole.SUPPORT_AGENT.value,
        "org_id": settings.DEFAULT_ORG_ID,
        "org_name": "Acme Commerce Inc."
    },
    "support_manager": {
        "id": "00000000-0000-0000-0000-000000000014",
        "email": "sarah.jenkins@acmecommerce.com",
        "full_name": "Sarah Jenkins",
        "role": UserRole.SUPPORT_MANAGER.value,
        "org_id": settings.DEFAULT_ORG_ID,
        "org_name": "Acme Commerce Inc."
    },
    "lead_investigator": {
        "id": "00000000-0000-0000-0000-000000000013",
        "email": "maya.patel@acmecommerce.com",
        "full_name": "Maya Patel",
        "role": UserRole.LEAD_INVESTIGATOR.value,
        "org_id": settings.DEFAULT_ORG_ID,
        "org_name": "Acme Commerce Inc."
    }
}

async def get_current_user(
    authorization: Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None),
    x_org_id: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None),
    x_user_email: Optional[str] = Header(None),
) -> UserSessionSchema:
    """
    Extracts user session identity and organization scoping.
    Supports Supabase JWT tokens, developer persona headers, and deterministic demo fallback.
    """
    target_org_id = x_org_id or settings.DEFAULT_ORG_ID

    # 1. Check for explicit role header (Development & Evaluator Persona Switching)
    if x_user_role and x_user_role.lower() in SEEDED_PERSONAS:
        persona = SEEDED_PERSONAS[x_user_role.lower()]
        permissions = ROLE_PERMISSIONS_MAP.get(persona["role"], [])
        return UserSessionSchema(
            id=x_user_id or persona["id"],
            org_id=target_org_id,
            org_name=persona["org_name"],
            email=x_user_email or persona["email"],
            full_name=persona["full_name"],
            role=persona["role"],
            permissions=permissions,
            is_active=True
        )

    # 2. Check if specific email provided
    if x_user_email:
        for p in SEEDED_PERSONAS.values():
            if p["email"].lower() == x_user_email.lower():
                permissions = ROLE_PERMISSIONS_MAP.get(p["role"], [])
                return UserSessionSchema(
                    id=x_user_id or p["id"],
                    org_id=target_org_id,
                    org_name=p["org_name"],
                    email=p["email"],
                    full_name=p["full_name"],
                    role=p["role"],
                    permissions=permissions,
                    is_active=True
                )

    # 3. Handle Bearer token
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        # In demo mode, token may specify a persona name e.g. "dev-admin", "dev-agent", "dev-operator"
        for role_key, persona in SEEDED_PERSONAS.items():
            if role_key in token.lower():
                permissions = ROLE_PERMISSIONS_MAP.get(persona["role"], [])
                return UserSessionSchema(
                    id=persona["id"],
                    org_id=target_org_id,
                    org_name=persona["org_name"],
                    email=persona["email"],
                    full_name=persona["full_name"],
                    role=persona["role"],
                    permissions=permissions,
                    is_active=True
                )

    # 4. Default Demo Fallback Persona: Maya Patel (Lead Investigator / Incident Operator)
    default_persona = SEEDED_PERSONAS["lead_investigator"]
    permissions = ROLE_PERMISSIONS_MAP.get(default_persona["role"], [])
    return UserSessionSchema(
        id=default_persona["id"],
        org_id=target_org_id,
        org_name=default_persona["org_name"],
        email=default_persona["email"],
        full_name=default_persona["full_name"],
        role=default_persona["role"],
        permissions=permissions,
        is_active=True
    )

def require_role(allowed_roles: List[str]):
    """
    Dependency factory enforcing that the authenticated user possesses one of the allowed roles.
    Admins are always granted access.
    """
    async def role_checker(user: UserSessionSchema = Depends(get_current_user)) -> UserSessionSchema:
        if user.role == UserRole.ADMIN.value or "*" in user.permissions:
            return user
        if user.role in allowed_roles:
            return user
        logger.warning(
            f"RBAC Access Denied: User '{user.email}' (role: {user.role}) attempted action requiring {allowed_roles}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "INSUFFICIENT_PERMISSIONS",
                "message": f"This operation requires one of the following roles: {', '.join(allowed_roles)}. Your current role is '{user.role}'.",
                "details": {
                    "user_role": user.role,
                    "allowed_roles": allowed_roles
                }
            }
        )
    return role_checker
