"""
ResolveX Payment & Refund Endpoints
"""

from typing import Optional, List
from fastapi import APIRouter, Query
from apps.api.app.repositories.base_repository import repo
from apps.api.app.domain.schemas import ApiResponse, PaymentSchema, RefundSchema

payments_router = APIRouter(prefix="/payments", tags=["Payments"])
refunds_router = APIRouter(prefix="/refunds", tags=["Refunds"])

@payments_router.get("", response_model=ApiResponse[List[PaymentSchema]])
async def list_payments(
    customer_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    filters = {}
    if customer_id:
        filters["customer_id"] = customer_id
    if status:
        filters["status"] = status

    records, total = await repo.list_records("payments", filters=filters, page=page, limit=limit)
    payments = []
    for r in records:
        item = dict(r)
        if item.get("customer_id"):
            cust = await repo.get_record_by_id("customers", item["customer_id"])
            if cust:
                item["customer_name"] = cust.get("full_name")
        payments.append(PaymentSchema.model_validate(item))

    total_pages = (total + limit - 1) // limit if total > 0 else 1
    return ApiResponse(
        data=payments,
        meta={"page": page, "limit": limit, "total": total, "total_pages": total_pages}
    )

@refunds_router.get("", response_model=ApiResponse[List[RefundSchema]])
async def list_refunds(
    customer_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    filters = {}
    if customer_id:
        filters["customer_id"] = customer_id
    if status:
        filters["status"] = status

    records, total = await repo.list_records("refunds", filters=filters, page=page, limit=limit)
    refunds = [RefundSchema.model_validate(r) for r in records]
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    return ApiResponse(
        data=refunds,
        meta={"page": page, "limit": limit, "total": total, "total_pages": total_pages}
    )
