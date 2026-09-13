"""
ResolveX Order Endpoints
"""

from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException, status
from apps.api.app.repositories.base_repository import repo
from apps.api.app.domain.schemas import ApiResponse, OrderSchema, OrderDetailSchema, OrderItemSchema

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.get("", response_model=ApiResponse[List[OrderSchema]])
async def list_orders(
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

    records, total = await repo.list_records("orders", filters=filters, page=page, limit=limit)
    orders = []
    for r in records:
        item = dict(r)
        if item.get("customer_id"):
            cust = await repo.get_record_by_id("customers", item["customer_id"])
            if cust:
                item["customer_name"] = cust.get("full_name")
        orders.append(OrderSchema.model_validate(item))

    total_pages = (total + limit - 1) // limit if total > 0 else 1
    return ApiResponse(
        data=orders,
        meta={"page": page, "limit": limit, "total": total, "total_pages": total_pages}
    )

@router.get("/{order_id}", response_model=ApiResponse[OrderDetailSchema])
async def get_order(order_id: str):
    record = await repo.get_record_by_id("orders", order_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ORDER_NOT_FOUND", "message": f"Order '{order_id}' not found."}
        )

    order_data = dict(record)
    if order_data.get("customer_id"):
        cust = await repo.get_record_by_id("customers", order_data["customer_id"])
        if cust:
            order_data["customer_name"] = cust.get("full_name")

    # Fetch items
    raw_items, _ = await repo.list_records("order_items", filters={"order_id": order_id}, limit=50)
    items = []
    for it in raw_items:
        it_dict = dict(it)
        if it_dict.get("product_id"):
            prod = await repo.get_record_by_id("products", it_dict["product_id"])
            if prod:
                it_dict["product_name"] = prod.get("name")
        items.append(OrderItemSchema.model_validate(it_dict))

    # Fetch payments
    payments, _ = await repo.list_records("payments", filters={"order_id": order_id}, limit=10)

    return ApiResponse(
        data=OrderDetailSchema(
            **order_data,
            items=items,
            payments=payments
        )
    )
