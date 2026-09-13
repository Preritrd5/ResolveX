"""
ResolveX Public Customer Support Endpoints
Allows unauthenticated customers to submit complaints, creating real tickets
in the organization's queue without requiring an internal ResolveX employee account.
"""

from fastapi import APIRouter, Request, HTTPException, status
from apps.api.app.services.support_intake_service import support_intake_service
from apps.api.app.domain.schemas import (
    ApiResponse,
    ApiErrorResponse,
    CustomerSupportIntakeRequest,
    CustomerSupportIntakeResponse,
)

router = APIRouter(prefix="/support", tags=["Public Customer Support Intake"])

@router.get("/info", response_model=ApiResponse[dict])
async def get_support_channel_info():
    """Returns public channel metadata for customer support page."""
    return ApiResponse(
        data={
            "organization_name": "Acme Commerce Inc.",
            "channel": "Public Customer Support",
            "support_email": "support@acmecommerce.com",
            "operating_status": "operational",
            "average_response_time": "15 minutes",
            "categories": [
                {"id": "billing", "label": "Payment & Billing Issues"},
                {"id": "missing_order", "label": "Missing Order / Fulfillment"},
                {"id": "refund", "label": "Returns & Refund Delay"},
                {"id": "account", "label": "Account & Subscription"},
                {"id": "general", "label": "Other Customer Inquiry"}
            ]
        }
    )

@router.post("/intake", response_model=ApiResponse[CustomerSupportIntakeResponse], status_code=status.HTTP_201_CREATED, responses={400: {"model": ApiErrorResponse}, 429: {"model": ApiErrorResponse}})
@router.post("/complaint", response_model=ApiResponse[CustomerSupportIntakeResponse], status_code=status.HTTP_201_CREATED, responses={400: {"model": ApiErrorResponse}, 429: {"model": ApiErrorResponse}})
async def submit_support_complaint(
    payload: CustomerSupportIntakeRequest,
    request: Request
):
    """
    Submits a customer complaint into ResolveX as a real, actionable ticket.
    - Public endpoint (no employee authentication required).
    - Automatically enforces anti-spam rate limiting and input sanitization.
    - Resolves customer identity or securely registers a new customer profile.
    - Queues ticket for immediate AI-assisted triage and agent resolution.
    """
    # Extract client IP
    client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "127.0.0.1")
    if "," in client_ip:
        client_ip = client_ip.split(",")[0].strip()

    res, err_msg, status_code = await support_intake_service.submit_complaint(
        payload=payload,
        client_ip=client_ip
    )

    if err_msg or not res:
        code = "RATE_LIMIT_EXCEEDED" if status_code == 429 else "VALIDATION_FAILED"
        raise HTTPException(
            status_code=status_code,
            detail={"code": code, "message": err_msg or "Failed to submit customer complaint."}
        )

    return ApiResponse(
        data=res,
        meta={
            "channel": "PUBLIC_SUPPORT_WEB",
            "ticket_number": res.ticket_number,
            "status": "QUEUED_FOR_INVESTIGATION"
        }
    )
