"""
Estimates Routes - TradeOS Estimate Workbench Backend
======================================================

Phase 4 of the Estimate Workbench Architecture.

Key Architectural Principle:
Estimates SNAPSHOT production standard details at the time of creation.
Modifying a Production Standard later must NEVER alter historical estimates.

Data Flow:
1. User adds Production Standard to Estimate
2. Backend captures snapshot of current pricing/description
3. Estimate stores reference ID + snapshot data
4. Historical estimates remain accurate regardless of future price changes
"""

from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import logging
import httpx
import jwt
import uuid

from config import config

router = APIRouter(prefix="/api/estimates", tags=["estimates"])
logger = logging.getLogger(__name__)


# =====================================================
# PYDANTIC MODELS
# =====================================================

class EstimateLineItemSnapshot(BaseModel):
    """Immutable snapshot of production standard at time of addition"""
    production_code: str
    production_name: str
    description: Optional[str] = None
    unit_of_measure: Optional[str] = "ea"
    # Pricing at time of capture
    labor_price: Optional[float] = 0
    material_price: Optional[float] = 0
    price_per_unit: Optional[float] = 0
    # Metadata
    captured_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    captured_from_version: Optional[str] = None


class EstimateLineItemCreate(BaseModel):
    """Create a new line item with snapshot"""
    standard_id: str  # Reference to production_items
    quantity: float = 1
    unit_price_override: Optional[float] = None  # Optional override
    notes: Optional[str] = None
    sort_order: Optional[int] = 0


class EstimateLineItem(BaseModel):
    """Full line item with snapshot data"""
    id: str
    estimate_id: str
    standard_id: str
    quantity: float
    unit_price: float  # Effective price (override or snapshot)
    unit_price_override: Optional[float] = None
    notes: Optional[str] = None
    sort_order: int = 0
    # Snapshot data (immutable)
    snapshot: EstimateLineItemSnapshot
    # Computed
    line_total: float = 0


class EstimateCreate(BaseModel):
    """Create a new estimate"""
    name: str
    opportunity_id: Optional[str] = None
    client_id: Optional[str] = None
    description: Optional[str] = None
    tax_rate: float = 13.0  # Default HST
    markup_percent: float = 0
    valid_until: Optional[datetime] = None
    notes: Optional[str] = None


class EstimateUpdate(BaseModel):
    """Update estimate metadata (not line items)"""
    name: Optional[str] = None
    description: Optional[str] = None
    tax_rate: Optional[float] = None
    markup_percent: Optional[float] = None
    valid_until: Optional[datetime] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class Estimate(BaseModel):
    """Full estimate with calculations"""
    id: str
    organization_id: str
    name: str
    estimate_number: str
    status: str = "draft"  # draft, sent, accepted, rejected, expired
    opportunity_id: Optional[str] = None
    client_id: Optional[str] = None
    description: Optional[str] = None
    tax_rate: float = 13.0
    markup_percent: float = 0
    valid_until: Optional[datetime] = None
    notes: Optional[str] = None
    # Calculated totals
    subtotal: float = 0
    markup_amount: float = 0
    tax_amount: float = 0
    total: float = 0
    item_count: int = 0
    # Timestamps
    created_at: datetime
    updated_at: datetime
    # Line items (optionally loaded)
    line_items: Optional[List[EstimateLineItem]] = None


# =====================================================
# HELPER FUNCTIONS
# =====================================================

async def get_supabase_client():
    """Get Supabase URL and key"""
    return config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY


async def verify_token(authorization: str) -> Dict[str, Any]:
    """Verify JWT token and extract user info"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        supabase_url, _ = await get_supabase_client()
        jwt_secret = config.SUPABASE_JWT_SECRET
        
        decoded = jwt.decode(
            token,
            jwt_secret,
            algorithms=["HS256"],
            audience="authenticated"
        )
        
        return decoded
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


async def get_user_organization(user_id: str) -> str:
    """Get user's organization ID"""
    supabase_url, supabase_key = await get_supabase_client()
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{supabase_url}/rest/v1/profiles?id=eq.{user_id}&select=organization_id",
            headers={
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}"
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to get user profile")
        
        profiles = response.json()
        if not profiles:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        return profiles[0].get("organization_id")


async def get_production_standard(standard_id: str, supabase_url: str, supabase_key: str) -> Dict:
    """Get production standard for snapshotting"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{supabase_url}/rest/v1/production_items?id=eq.{standard_id}&select=*",
            headers={
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}"
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to get production standard")
        
        items = response.json()
        if not items:
            raise HTTPException(status_code=404, detail=f"Production standard {standard_id} not found")
        
        return items[0]


def generate_estimate_number() -> str:
    """Generate unique estimate number"""
    timestamp = datetime.now(timezone.utc).strftime("%y%m%d")
    unique = str(uuid.uuid4())[:4].upper()
    return f"EST-{timestamp}-{unique}"


# =====================================================
# ESTIMATE ENDPOINTS
# =====================================================

@router.post("", response_model=Dict[str, Any])
async def create_estimate(
    estimate: EstimateCreate,
    authorization: str = Header(None)
):
    """
    Create a new estimate.
    Returns the created estimate with generated number.
    """
    user = await verify_token(authorization)
    user_id = user.get("sub")
    organization_id = await get_user_organization(user_id)
    
    supabase_url, supabase_key = await get_supabase_client()
    
    estimate_id = str(uuid.uuid4())
    estimate_number = generate_estimate_number()
    now = datetime.now(timezone.utc).isoformat()
    
    estimate_data = {
        "id": estimate_id,
        "organization_id": organization_id,
        "created_by": user_id,
        "name": estimate.name,
        "estimate_number": estimate_number,
        "status": "draft",
        "opportunity_id": estimate.opportunity_id,
        "client_id": estimate.client_id,
        "description": estimate.description,
        "tax_rate": estimate.tax_rate,
        "markup_percent": estimate.markup_percent,
        "valid_until": estimate.valid_until.isoformat() if estimate.valid_until else None,
        "notes": estimate.notes,
        "subtotal": 0,
        "markup_amount": 0,
        "tax_amount": 0,
        "total": 0,
        "item_count": 0,
        "created_at": now,
        "updated_at": now
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{supabase_url}/rest/v1/estimates",
            json=estimate_data,
            headers={
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            }
        )
        
        if response.status_code not in [200, 201]:
            logger.error(f"Failed to create estimate: {response.text}")
            raise HTTPException(status_code=500, detail="Failed to create estimate")
        
        return response.json()[0]


@router.get("", response_model=Dict[str, Any])
async def list_estimates(
    status: Optional[str] = None,
    opportunity_id: Optional[str] = None,
    limit: int = Query(50, le=100),
    offset: int = 0,
    authorization: str = Header(None)
):
    """List estimates for the organization"""
    user = await verify_token(authorization)
    user_id = user.get("sub")
    organization_id = await get_user_organization(user_id)
    
    supabase_url, supabase_key = await get_supabase_client()
    
    filters = f"organization_id=eq.{organization_id}"
    if status:
        filters += f"&status=eq.{status}"
    if opportunity_id:
        filters += f"&opportunity_id=eq.{opportunity_id}"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{supabase_url}/rest/v1/estimates?{filters}&order=created_at.desc&limit={limit}&offset={offset}",
            headers={
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}",
                "Prefer": "count=exact"
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch estimates")
        
        total = int(response.headers.get("content-range", "0-0/0").split("/")[1])
        
        return {
            "estimates": response.json(),
            "total": total,
            "limit": limit,
            "offset": offset
        }


@router.get("/{estimate_id}", response_model=Dict[str, Any])
async def get_estimate(
    estimate_id: str,
    include_items: bool = True,
    authorization: str = Header(None)
):
    """Get estimate with optional line items"""
    user = await verify_token(authorization)
    user_id = user.get("sub")
    organization_id = await get_user_organization(user_id)
    
    supabase_url, supabase_key = await get_supabase_client()
    
    async with httpx.AsyncClient() as client:
        # Get estimate
        response = await client.get(
            f"{supabase_url}/rest/v1/estimates?id=eq.{estimate_id}&organization_id=eq.{organization_id}",
            headers={
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}"
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch estimate")
        
        estimates = response.json()
        if not estimates:
            raise HTTPException(status_code=404, detail="Estimate not found")
        
        estimate = estimates[0]
        
        # Get line items if requested
        if include_items:
            items_response = await client.get(
                f"{supabase_url}/rest/v1/estimate_line_items?estimate_id=eq.{estimate_id}&order=sort_order.asc",
                headers={
                    "apikey": supabase_key,
                    "Authorization": f"Bearer {supabase_key}"
                }
            )
            
            if items_response.status_code == 200:
                estimate["line_items"] = items_response.json()
            else:
                estimate["line_items"] = []
        
        return estimate


@router.put("/{estimate_id}", response_model=Dict[str, Any])
async def update_estimate(
    estimate_id: str,
    update: EstimateUpdate,
    authorization: str = Header(None)
):
    """Update estimate metadata"""
    user = await verify_token(authorization)
    user_id = user.get("sub")
    organization_id = await get_user_organization(user_id)
    
    supabase_url, supabase_key = await get_supabase_client()
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if "valid_until" in update_data and update_data["valid_until"]:
        update_data["valid_until"] = update_data["valid_until"].isoformat()
    
    async with httpx.AsyncClient() as client:
        response = await client.patch(
            f"{supabase_url}/rest/v1/estimates?id=eq.{estimate_id}&organization_id=eq.{organization_id}",
            json=update_data,
            headers={
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to update estimate")
        
        estimates = response.json()
        if not estimates:
            raise HTTPException(status_code=404, detail="Estimate not found")
        
        return estimates[0]


@router.delete("/{estimate_id}")
async def delete_estimate(
    estimate_id: str,
    authorization: str = Header(None)
):
    """Delete an estimate (soft delete by setting status to 'deleted')"""
    user = await verify_token(authorization)
    user_id = user.get("sub")
    organization_id = await get_user_organization(user_id)
    
    supabase_url, supabase_key = await get_supabase_client()
    
    async with httpx.AsyncClient() as client:
        response = await client.patch(
            f"{supabase_url}/rest/v1/estimates?id=eq.{estimate_id}&organization_id=eq.{organization_id}",
            json={
                "status": "deleted",
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            headers={
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}",
                "Content-Type": "application/json"
            }
        )
        
        if response.status_code != 204:
            raise HTTPException(status_code=500, detail="Failed to delete estimate")
        
        return {"success": True, "message": "Estimate deleted"}


# =====================================================
# LINE ITEM ENDPOINTS (with Snapshotting)
# =====================================================

@router.post("/{estimate_id}/items", response_model=Dict[str, Any])
async def add_line_item(
    estimate_id: str,
    item: EstimateLineItemCreate,
    authorization: str = Header(None)
):
    """
    Add a line item to an estimate with SNAPSHOT of production standard.
    
    This is the KEY Phase 4 functionality:
    - Fetches current production standard data
    - Creates immutable snapshot
    - Stores both reference ID and snapshot
    """
    user = await verify_token(authorization)
    user_id = user.get("sub")
    organization_id = await get_user_organization(user_id)
    
    supabase_url, supabase_key = await get_supabase_client()
    
    # Verify estimate exists and belongs to organization
    async with httpx.AsyncClient() as client:
        est_response = await client.get(
            f"{supabase_url}/rest/v1/estimates?id=eq.{estimate_id}&organization_id=eq.{organization_id}",
            headers={
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}"
            }
        )
        
        if est_response.status_code != 200 or not est_response.json():
            raise HTTPException(status_code=404, detail="Estimate not found")
        
        estimate = est_response.json()[0]
    
    # Get production standard for snapshot
    standard = await get_production_standard(item.standard_id, supabase_url, supabase_key)
    
    # Create snapshot (immutable record of current state)
    snapshot = {
        "production_code": standard.get("production_code", ""),
        "production_name": standard.get("production_name", ""),
        "description": standard.get("description"),
        "unit_of_measure": standard.get("unit_of_measure") or standard.get("measurement_unit_id") or "ea",
        "labor_price": standard.get("labor_price") or standard.get("labour_price") or 0,
        "material_price": standard.get("material_price") or 0,
        "price_per_unit": standard.get("price_per_unit") or standard.get("labor_price") or 0,
        "captured_at": datetime.now(timezone.utc).isoformat(),
        "captured_from_version": standard.get("version") or "1.0"
    }
    
    # Determine effective unit price
    unit_price = item.unit_price_override if item.unit_price_override is not None else snapshot["price_per_unit"]
    line_total = item.quantity * unit_price
    
    # Get max sort order
    async with httpx.AsyncClient() as client:
        sort_response = await client.get(
            f"{supabase_url}/rest/v1/estimate_line_items?estimate_id=eq.{estimate_id}&select=sort_order&order=sort_order.desc&limit=1",
            headers={
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}"
            }
        )
        
        max_sort = 0
        if sort_response.status_code == 200 and sort_response.json():
            max_sort = sort_response.json()[0].get("sort_order", 0)
    
    # Create line item with snapshot
    line_item_id = str(uuid.uuid4())
    line_item_data = {
        "id": line_item_id,
        "estimate_id": estimate_id,
        "standard_id": item.standard_id,
        "quantity": item.quantity,
        "unit_price": unit_price,
        "unit_price_override": item.unit_price_override,
        "line_total": line_total,
        "notes": item.notes,
        "sort_order": item.sort_order if item.sort_order else max_sort + 1,
        "snapshot": snapshot,  # JSONB column for immutable snapshot
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{supabase_url}/rest/v1/estimate_line_items",
            json=line_item_data,
            headers={
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            }
        )
        
        if response.status_code not in [200, 201]:
            logger.error(f"Failed to create line item: {response.text}")
            raise HTTPException(status_code=500, detail="Failed to add line item")
        
        created_item = response.json()[0]
    
    # Recalculate estimate totals
    await recalculate_estimate_totals(estimate_id, supabase_url, supabase_key)
    
    return created_item


@router.put("/{estimate_id}/items/{item_id}", response_model=Dict[str, Any])
async def update_line_item(
    estimate_id: str,
    item_id: str,
    quantity: Optional[float] = None,
    unit_price_override: Optional[float] = None,
    notes: Optional[str] = None,
    authorization: str = Header(None)
):
    """
    Update a line item.
    Note: Snapshot data is NEVER modified - only quantity, price override, and notes.
    """
    user = await verify_token(authorization)
    user_id = user.get("sub")
    organization_id = await get_user_organization(user_id)
    
    supabase_url, supabase_key = await get_supabase_client()
    
    # Verify ownership
    async with httpx.AsyncClient() as client:
        verify_response = await client.get(
            f"{supabase_url}/rest/v1/estimates?id=eq.{estimate_id}&organization_id=eq.{organization_id}&select=id",
            headers={
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}"
            }
        )
        
        if verify_response.status_code != 200 or not verify_response.json():
            raise HTTPException(status_code=404, detail="Estimate not found")
    
    # Get current item to maintain snapshot
    async with httpx.AsyncClient() as client:
        item_response = await client.get(
            f"{supabase_url}/rest/v1/estimate_line_items?id=eq.{item_id}&estimate_id=eq.{estimate_id}",
            headers={
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}"
            }
        )
        
        if item_response.status_code != 200 or not item_response.json():
            raise HTTPException(status_code=404, detail="Line item not found")
        
        current_item = item_response.json()[0]
    
    # Prepare update (snapshot is NEVER changed)
    update_data = {}
    
    if quantity is not None:
        update_data["quantity"] = quantity
    
    if unit_price_override is not None:
        update_data["unit_price_override"] = unit_price_override
        update_data["unit_price"] = unit_price_override
    
    if notes is not None:
        update_data["notes"] = notes
    
    # Recalculate line total
    new_quantity = update_data.get("quantity", current_item["quantity"])
    new_price = update_data.get("unit_price", current_item["unit_price"])
    update_data["line_total"] = new_quantity * new_price
    
    async with httpx.AsyncClient() as client:
        response = await client.patch(
            f"{supabase_url}/rest/v1/estimate_line_items?id=eq.{item_id}",
            json=update_data,
            headers={
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to update line item")
        
        updated_item = response.json()[0]
    
    # Recalculate estimate totals
    await recalculate_estimate_totals(estimate_id, supabase_url, supabase_key)
    
    return updated_item


@router.delete("/{estimate_id}/items/{item_id}")
async def delete_line_item(
    estimate_id: str,
    item_id: str,
    authorization: str = Header(None)
):
    """Delete a line item"""
    user = await verify_token(authorization)
    user_id = user.get("sub")
    organization_id = await get_user_organization(user_id)
    
    supabase_url, supabase_key = await get_supabase_client()
    
    # Verify ownership
    async with httpx.AsyncClient() as client:
        verify_response = await client.get(
            f"{supabase_url}/rest/v1/estimates?id=eq.{estimate_id}&organization_id=eq.{organization_id}&select=id",
            headers={
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}"
            }
        )
        
        if verify_response.status_code != 200 or not verify_response.json():
            raise HTTPException(status_code=404, detail="Estimate not found")
    
    async with httpx.AsyncClient() as client:
        response = await client.delete(
            f"{supabase_url}/rest/v1/estimate_line_items?id=eq.{item_id}&estimate_id=eq.{estimate_id}",
            headers={
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}"
            }
        )
        
        if response.status_code != 204:
            raise HTTPException(status_code=500, detail="Failed to delete line item")
    
    # Recalculate estimate totals
    await recalculate_estimate_totals(estimate_id, supabase_url, supabase_key)
    
    return {"success": True, "message": "Line item deleted"}


async def recalculate_estimate_totals(estimate_id: str, supabase_url: str, supabase_key: str):
    """Recalculate estimate totals based on line items"""
    async with httpx.AsyncClient() as client:
        # Get estimate
        est_response = await client.get(
            f"{supabase_url}/rest/v1/estimates?id=eq.{estimate_id}&select=tax_rate,markup_percent",
            headers={
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}"
            }
        )
        
        if est_response.status_code != 200 or not est_response.json():
            return
        
        estimate = est_response.json()[0]
        tax_rate = estimate.get("tax_rate", 13)
        markup_percent = estimate.get("markup_percent", 0)
        
        # Get all line items
        items_response = await client.get(
            f"{supabase_url}/rest/v1/estimate_line_items?estimate_id=eq.{estimate_id}&select=line_total",
            headers={
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}"
            }
        )
        
        items = items_response.json() if items_response.status_code == 200 else []
        
        # Calculate totals
        subtotal = sum(item.get("line_total", 0) for item in items)
        markup_amount = subtotal * (markup_percent / 100)
        subtotal_with_markup = subtotal + markup_amount
        tax_amount = subtotal_with_markup * (tax_rate / 100)
        total = subtotal_with_markup + tax_amount
        
        # Update estimate
        await client.patch(
            f"{supabase_url}/rest/v1/estimates?id=eq.{estimate_id}",
            json={
                "subtotal": subtotal,
                "markup_amount": markup_amount,
                "tax_amount": tax_amount,
                "total": total,
                "item_count": len(items),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            headers={
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}",
                "Content-Type": "application/json"
            }
        )
