"""
ResolveX Customer Endpoints
"""

from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException, status
from apps.api.app.services.customer_service import customer_service
from apps.api.app.domain.schemas import ApiResponse, CustomerSchema, CustomerDetailSchema, ApiErrorResponse

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("", response_model=ApiResponse[List[CustomerSchema]])
async def list_customers(
    query: Optional[str] = Query(None, description="Search by name, email, or external customer ID"),
    status: Optional[str] = Query(None, description="Filter by status (active, blocked, flagged_for_fraud)"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    customers, total = await customer_service.list_customers(query=query, status=status, page=page, limit=limit)
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    return ApiResponse(
        data=customers,
        meta={
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages
        }
    )

@router.get("/{customer_id}", response_model=ApiResponse[CustomerDetailSchema], responses={404: {"model": ApiErrorResponse}})
async def get_customer(customer_id: str):
    detail = await customer_service.get_customer_detail(customer_id)
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CUSTOMER_NOT_FOUND", "message": f"Customer '{customer_id}' does not exist in organization."}
        )
    return ApiResponse(data=detail)
