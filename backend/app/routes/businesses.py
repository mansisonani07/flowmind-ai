"""
Business CRUD endpoints for multi-tenant business management.
Uses in-memory storage suitable for development and single-instance deployments.
"""

import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.utils.logger import logger

router = APIRouter()


# ---------------------------------------------------------------------------
# In-memory storage
# ---------------------------------------------------------------------------
_businesses: Dict[str, Dict[str, Any]] = {}


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class BusinessCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="Business display name")
    description: str = Field(default="", max_length=2000, description="Business description")
    branding: Optional[Dict[str, str]] = Field(
        default=None,
        description="Brand customization: primary_color, logo_url, etc.",
    )


class BusinessUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    branding: Optional[Dict[str, str]] = Field(default=None)


class BusinessResponse(BaseModel):
    id: str
    name: str
    description: str
    branding: Dict[str, str]
    created_at: str
    updated_at: str


class BusinessListResponse(BaseModel):
    businesses: List[BusinessResponse]
    total: int


# ---------------------------------------------------------------------------
# Seed default business
# ---------------------------------------------------------------------------

def _seed_default_business() -> None:
    """Create a default business on startup if none exist."""
    if _businesses:
        return
    now = datetime.now(timezone.utc).isoformat()
    default_id = str(uuid.uuid4())
    _businesses[default_id] = {
        "id": default_id,
        "name": "FlowMind Demo Business",
        "description": "Default business for demonstration and testing purposes.",
        "branding": {
            "primary_color": "#6366f1",
            "logo_url": "",
            "theme": "default",
        },
        "created_at": now,
        "updated_at": now,
    }
    logger.info(f"Seeded default business: {default_id}")


# Call seed on module import
_seed_default_business()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _to_response(business: Dict[str, Any]) -> BusinessResponse:
    return BusinessResponse(**business)


def _get_or_404(business_id: str) -> Dict[str, Any]:
    if business_id not in _businesses:
        raise HTTPException(status_code=404, detail=f"Business '{business_id}' not found")
    return _businesses[business_id]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/businesses", response_model=BusinessResponse, status_code=201)
async def create_business(body: BusinessCreate) -> BusinessResponse:
    """
    Create a new business tenant.
    """
    now = datetime.now(timezone.utc).isoformat()
    business_id = str(uuid.uuid4())

    business = {
        "id": business_id,
        "name": body.name,
        "description": body.description,
        "branding": body.branding or {},
        "created_at": now,
        "updated_at": now,
    }
    _businesses[business_id] = business
    logger.info(f"Business created: {business_id} ({body.name})")
    return _to_response(business)


@router.get("/businesses", response_model=BusinessListResponse)
async def list_businesses(
    limit: int = 50,
    offset: int = 0,
) -> BusinessListResponse:
    """
    List all businesses with pagination.
    """
    limit = min(limit, 200)
    all_businesses = list(_businesses.values())
    total = len(all_businesses)
    paginated = all_businesses[offset:offset + limit]
    return BusinessListResponse(
        businesses=[_to_response(b) for b in paginated],
        total=total,
    )


@router.get("/businesses/{business_id}", response_model=BusinessResponse)
async def get_business(business_id: str) -> BusinessResponse:
    """
    Get a single business by ID.
    """
    business = _get_or_404(business_id)
    return _to_response(business)


@router.put("/businesses/{business_id}", response_model=BusinessResponse)
async def update_business(business_id: str, body: BusinessUpdate) -> BusinessResponse:
    """
    Update an existing business. Only provided fields are updated.
    """
    business = _get_or_404(business_id)
    now = datetime.now(timezone.utc).isoformat()

    update_data = body.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    business.update(update_data)
    business["updated_at"] = now
    logger.info(f"Business updated: {business_id} (fields: {list(update_data.keys())})")
    return _to_response(business)


@router.delete("/businesses/{business_id}", status_code=204)
async def delete_business(business_id: str) -> None:
    """
    Delete a business by ID.
    """
    if business_id not in _businesses:
        raise HTTPException(status_code=404, detail=f"Business '{business_id}' not found")

    deleted = _businesses.pop(business_id)
    logger.info(f"Business deleted: {business_id} ({deleted['name']})")
