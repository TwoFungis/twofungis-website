"""
Estimates Routes - TradeOS Estimate Workbench Backend v1.1.2
============================================================

IMPORTANT ARCHITECTURAL DECISION (July 15, 2026):
-------------------------------------------------
This module integrates with the EXISTING `quotes` and `quote_line_items` tables.
It does NOT create separate `estimates` tables.

Terminology:
- "Estimate" in the UI = "Quote" in the database
- The Estimate Workbench edits quotes with status='draft'
- Sending an estimate changes status to 'sent'

This ensures:
- Single source of truth for commercial pricing
- No duplicate business entities
- Organization-scoped data isolation
- Compatible with existing production schema

Key Principles:
1. Estimates snapshot production standard details at creation time
2. Modifying a Production Standard NEVER alters historical estimates
3. Cross-device synchronization through Supabase
4. Organization membership determines access (not just user_id)
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
    # Pricing tiers at time of capture
    low_rate: Optional[float] = 0
    standard_rate: Optional[float] = 0
    premium_rate: Optional[float] = 0
    complex_rate: Optional[float] = 0
    # Component pricing
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
    unit_price_override: Optional[float] = None  # Optional manual override
    notes: Optional[str] = None
    sort_order: Optional[int] = 0


class EstimateLineItem(BaseModel):
    """Full line item with snapshot data"""
    id: str
    estimate_id: str  # Actually quote_id in DB
    standard_id: Optional[str] = None
    quantity: float
    unit_price: float  # Effective price (override or snapshot)
    unit_price_override: Optional[float] = None
    notes: Optional[str] = None
    sort_order: int = 0
    domain_id: Optional[str] = None
    domain_name: Optional[str] = None
    # Snapshot data (immutable)
    snapshot: Optional[EstimateLineItemSnapshot] = None
    # Computed
    line_total: float = 0


class EstimateCreate(BaseModel):
    """Create a new estimate (persisted as draft quote)"""
    name: str
    opportunity_id: Optional[str] = None
    client_id: Optional[str] = None
    description: Optional[str] = None
    tax_rate: float = 5.0  # GST default
    markup_percent: float = 15.0
    contingency_percent: float = 10.0
    pricing_profile: str = "Standard"
    valid_until: Optional[datetime] = None
    notes: Optional[str] = None
    # Extended metadata (v1.1.2)
    client_info: Optional[Dict[str, Any]] = None
    project_info: Optional[Dict[str, Any]] = None
    company_profile_snapshot: Optional[Dict[str, Any]] = None
    clarifications: Optional[str] = None
    internal_notes: Optional[str] = None


class EstimateUpdate(BaseModel):
    """Update estimate metadata (not line items)"""
    name: Optional[str] = None
    description: Optional[str] = None
    tax_rate: Optional[float] = None
    markup_percent: Optional[float] = None
    contingency_percent: Optional[float] = None
    pricing_profile: Optional[str] = None
    valid_until: Optional[datetime] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    # Extended metadata (v1.1.2)
    client_info: Optional[Dict[str, Any]] = None
    project_info: Optional[Dict[str, Any]] = None
    company_profile_snapshot: Optional[Dict[str, Any]] = None
    clarifications: Optional[str] = None
    internal_notes: Optional[str] = None


class Estimate(BaseModel):
    """Full estimate with calculations (maps to quote in DB)"""
    id: str
    organization_id: Optional[str] = None
    user_id: str
    name: str
    estimate_number: str  # quote_number in DB
    status: str = "draft"
    opportunity_id: Optional[str] = None
    client_id: Optional[str] = None
    description: Optional[str] = None
    tax_rate: float = 5.0
    markup_percent: float = 15.0
    contingency_percent: float = 10.0
    pricing_profile: str = "Standard"
    valid_until: Optional[datetime] = None
    notes: Optional[str] = None
    # Extended metadata
    client_info: Optional[Dict[str, Any]] = None
    project_info: Optional[Dict[str, Any]] = None
    company_profile_snapshot: Optional[Dict[str, Any]] = None
    clarifications: Optional[str] = None
    internal_notes: Optional[str] = None
    # Calculated totals
    subtotal: float = 0
    markup_amount: float = 0
    contingency_amount: float = 0
    tax_amount: float = 0
    total: float = 0
    item_count: int = 0
    # Timestamps
    created_at: datetime
    updated_at: Optional[datetime] = None
    # Line items (optionally loaded)
    line_items: Optional[List[EstimateLineItem]] = None


# =====================================================
# HELPER FUNCTIONS
# =====================================================

async def get_service_headers():
    """Get headers for Supabase service role requests"""
    return {
        "apikey": config.SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {config.SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }


async def verify_token_and_get_context(authorization: str) -> dict:
    """
    Verify JWT and get user + organization context.
    Uses organization_members table (NOT public.users which doesn't exist).
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    try:
        token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
        decoded = jwt.decode(token, options={"verify_signature": False})
        user_id = decoded.get('sub')
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: no user_id")
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Get user's organization membership
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/organization_members?"
                f"user_id=eq.{user_id}&"
                f"is_active=eq.true&"
                f"select=organization_id,role,is_primary,organizations(id,name)",
                headers=await get_service_headers()
            )
            
            if response.status_code == 200:
                members = response.json()
                if members:
                    # Prefer primary org, fall back to first active
                    membership = next((m for m in members if m.get('is_primary')), members[0])
                    org = membership.get('organizations', {})
                    return {
                        "user_id": user_id,
                        "organization_id": org.get('id') if org else membership.get('organization_id'),
                        "organization_name": org.get('name') if org else None,
                        "role": membership.get('role')
                    }
            
            # User not in any organization - still allow with user_id only
            logger.warning(f"User {user_id} not in any organization")
            return {
                "user_id": user_id,
                "organization_id": None,
                "organization_name": None,
                "role": None
            }
            
    except jwt.DecodeError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")


def generate_estimate_number() -> str:
    """Generate unique estimate number (format: EST-YYYY-XXXX)"""
    now = datetime.now()
    unique = uuid.uuid4().hex[:4].upper()
    return f"EST-{now.year}-{unique}"


async def get_production_item_snapshot(standard_id: str, pricing_profile: str = "Standard") -> dict:
    """Fetch production item and create immutable snapshot"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/production_items?"
                f"id=eq.{standard_id}&"
                f"select=*,knowledge_domains(id,name),measurement_units(id,code,name)",
                headers=await get_service_headers()
            )
            
            if response.status_code == 200:
                items = response.json()
                if items:
                    item = items[0]
                    domain = item.get('knowledge_domains', {}) or {}
                    unit = item.get('measurement_units', {}) or {}
                    
                    # Determine unit price based on pricing profile
                    if pricing_profile == "Low":
                        selected_price = item.get('low_labour_rate') or item.get('standard_rate') or 0
                    elif pricing_profile == "Premium":
                        selected_price = item.get('premium_labour_rate') or item.get('premium_rate') or item.get('standard_rate') or 0
                    else:  # Standard
                        selected_price = item.get('standard_rate') or 0
                    
                    return {
                        "snapshot": {
                            "production_code": item.get('production_code', ''),
                            "production_name": item.get('production_name', ''),
                            "description": item.get('description'),
                            "unit_of_measure": unit.get('code', 'EA'),
                            "low_rate": item.get('low_labour_rate') or 0,
                            "standard_rate": item.get('standard_rate') or 0,
                            "premium_rate": item.get('premium_labour_rate') or item.get('premium_rate') or 0,
                            "complex_rate": item.get('complex_rate') or 0,
                            "labor_price": item.get('standard_rate') or 0,
                            "material_price": item.get('material_rate') or 0,
                            "price_per_unit": selected_price,
                            "captured_at": datetime.now(timezone.utc).isoformat(),
                            "captured_from_version": "v1.1.2"
                        },
                        "domain_id": domain.get('id'),
                        "domain_name": domain.get('name'),
                        "unit_price": selected_price
                    }
    except Exception as e:
        logger.error(f"Error fetching production item {standard_id}: {e}")
    
    return None


async def recalculate_estimate_totals(estimate_id: str, tax_rate: float = 5.0, markup_percent: float = 15.0, contingency_percent: float = 10.0):
    """Recalculate and update estimate totals based on line items"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Get all line items for this estimate (quote)
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/quote_line_items?"
                f"quote_id=eq.{estimate_id}&"
                f"select=line_total",
                headers=await get_service_headers()
            )
            
            if response.status_code == 200:
                items = response.json()
                subtotal = sum(item.get('line_total', 0) or 0 for item in items)
                
                # Calculate derived amounts
                markup_amount = subtotal * (markup_percent / 100)
                after_markup = subtotal + markup_amount
                contingency_amount = after_markup * (contingency_percent / 100)
                before_tax = after_markup + contingency_amount
                tax_amount = before_tax * (tax_rate / 100)
                total = before_tax + tax_amount
                
                # Update the quote record
                await client.patch(
                    f"{config.SUPABASE_URL}/rest/v1/quotes?id=eq.{estimate_id}",
                    headers=await get_service_headers(),
                    json={
                        "subtotal": round(subtotal, 2),
                        "markup_amount": round(markup_amount, 2),
                        "contingency_amount": round(contingency_amount, 2),
                        "tax_amount": round(tax_amount, 2),
                        "total": round(total, 2),
                        "item_count": len(items)
                    }
                )
    except Exception as e:
        logger.error(f"Error recalculating totals for estimate {estimate_id}: {e}")


# =====================================================
# ESTIMATE CRUD ENDPOINTS
# =====================================================

@router.post("", response_model=Estimate)
async def create_estimate(
    data: EstimateCreate,
    authorization: str = Header(None)
):
    """Create a new estimate (persisted as draft quote)"""
    context = await verify_token_and_get_context(authorization)
    
    try:
        estimate_number = generate_estimate_number()
        
        # Build quote record - maps to existing quotes table
        quote_data = {
            "user_id": context["user_id"],
            "organization_id": context["organization_id"],
            "quote_number": estimate_number,
            "project_name": data.name,  # Map estimate name to project_name
            "status": "draft",
            "notes": data.notes,
            "valid_until": data.valid_until.isoformat() if data.valid_until else None,
            # v1.1.2 extended fields
            "tax_rate": data.tax_rate,
            "markup_percent": data.markup_percent,
            "contingency_percent": data.contingency_percent,
            "pricing_profile": data.pricing_profile,
            "client_info": data.client_info,
            "project_info": data.project_info,
            "company_profile_snapshot": data.company_profile_snapshot,
            "clarifications": data.clarifications,
            "internal_notes": data.internal_notes,
            # Initialize totals
            "subtotal": 0,
            "markup_amount": 0,
            "contingency_amount": 0,
            "tax_amount": 0,
            "total": 0,
            "item_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Remove None values to avoid overwriting defaults
        quote_data = {k: v for k, v in quote_data.items() if v is not None}
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{config.SUPABASE_URL}/rest/v1/quotes",
                headers=await get_service_headers(),
                json=quote_data
            )
            
            if response.status_code in [200, 201]:
                result = response.json()
                quote = result[0] if isinstance(result, list) else result
                
                # Map DB fields back to Estimate model
                return Estimate(
                    id=quote['id'],
                    organization_id=quote.get('organization_id'),
                    user_id=quote['user_id'],
                    name=quote.get('project_name', 'New Estimate'),
                    estimate_number=quote['quote_number'],
                    status=quote.get('status', 'draft'),
                    notes=quote.get('notes'),
                    tax_rate=quote.get('tax_rate', 5.0),
                    markup_percent=quote.get('markup_percent', 15.0),
                    contingency_percent=quote.get('contingency_percent', 10.0),
                    pricing_profile=quote.get('pricing_profile', 'Standard'),
                    client_info=quote.get('client_info'),
                    project_info=quote.get('project_info'),
                    company_profile_snapshot=quote.get('company_profile_snapshot'),
                    clarifications=quote.get('clarifications'),
                    internal_notes=quote.get('internal_notes'),
                    subtotal=quote.get('subtotal', 0),
                    markup_amount=quote.get('markup_amount', 0),
                    contingency_amount=quote.get('contingency_amount', 0),
                    tax_amount=quote.get('tax_amount', 0),
                    total=quote.get('total', 0),
                    item_count=quote.get('item_count', 0),
                    created_at=datetime.fromisoformat(quote['created_at'].replace('Z', '+00:00')) if quote.get('created_at') else datetime.now(timezone.utc)
                )
            else:
                error_detail = response.text
                logger.error(f"Failed to create estimate: {error_detail}")
                raise HTTPException(status_code=response.status_code, detail=error_detail)
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating estimate: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=Dict[str, Any])
async def list_estimates(
    authorization: str = Header(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    """List estimates for the user/organization"""
    context = await verify_token_and_get_context(authorization)
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Build query - user_id OR organization membership
            params = []
            if context["organization_id"]:
                params.append(f"organization_id=eq.{context['organization_id']}")
            else:
                params.append(f"user_id=eq.{context['user_id']}")
            
            if status:
                params.append(f"status=eq.{status}")
            
            query_str = "&".join(params)
            
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/quotes?"
                f"{query_str}&"
                f"select=*&"
                f"order=created_at.desc&"
                f"limit={limit}&offset={offset}",
                headers=await get_service_headers()
            )
            
            if response.status_code == 200:
                quotes = response.json()
                
                # Map to Estimate model
                estimates = []
                for q in quotes:
                    estimates.append({
                        "id": q['id'],
                        "organization_id": q.get('organization_id'),
                        "user_id": q.get('user_id'),
                        "name": q.get('project_name', 'Untitled'),
                        "estimate_number": q.get('quote_number', ''),
                        "status": q.get('status', 'draft'),
                        "subtotal": q.get('subtotal', 0),
                        "markup_amount": q.get('markup_amount', 0),
                        "contingency_amount": q.get('contingency_amount', 0),
                        "tax_amount": q.get('tax_amount', 0),
                        "total": q.get('total', 0),
                        "item_count": q.get('item_count', 0),
                        "pricing_profile": q.get('pricing_profile', 'Standard'),
                        "created_at": q.get('created_at'),
                        "updated_at": q.get('updated_at')
                    })
                
                return {
                    "estimates": estimates,
                    "total": len(estimates),
                    "limit": limit,
                    "offset": offset
                }
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing estimates: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{estimate_id}")
async def get_estimate(
    estimate_id: str,
    authorization: str = Header(None),
    include_items: bool = Query(True)
):
    """Get a single estimate with optional line items"""
    context = await verify_token_and_get_context(authorization)
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Build access filter
            if context["organization_id"]:
                access_filter = f"organization_id=eq.{context['organization_id']}"
            else:
                access_filter = f"user_id=eq.{context['user_id']}"
            
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/quotes?"
                f"id=eq.{estimate_id}&{access_filter}&"
                f"select=*",
                headers=await get_service_headers()
            )
            
            if response.status_code == 200:
                quotes = response.json()
                if not quotes:
                    raise HTTPException(status_code=404, detail="Estimate not found")
                
                q = quotes[0]
                
                # Fetch line items if requested
                line_items = []
                if include_items:
                    items_response = await client.get(
                        f"{config.SUPABASE_URL}/rest/v1/quote_line_items?"
                        f"quote_id=eq.{estimate_id}&"
                        f"select=*&"
                        f"order=sort_order.asc,created_at.asc",
                        headers=await get_service_headers()
                    )
                    
                    if items_response.status_code == 200:
                        db_items = items_response.json()
                        for item in db_items:
                            line_items.append({
                                "id": item['id'],
                                "estimate_id": item['quote_id'],
                                "standard_id": item.get('standard_id'),
                                "quantity": item.get('quantity', 1),
                                "unit_price": item.get('unit_price', 0),
                                "unit_price_override": item.get('unit_price_override'),
                                "notes": item.get('description') or item.get('notes'),
                                "sort_order": item.get('sort_order', 0),
                                "domain_id": item.get('domain_id'),
                                "domain_name": item.get('domain_name'),
                                "snapshot": item.get('snapshot'),
                                "line_total": item.get('line_total', 0)
                            })
                
                # Build response
                return {
                    "id": q['id'],
                    "organization_id": q.get('organization_id'),
                    "user_id": q.get('user_id'),
                    "name": q.get('project_name', 'Untitled'),
                    "estimate_number": q.get('quote_number', ''),
                    "status": q.get('status', 'draft'),
                    "notes": q.get('notes'),
                    "tax_rate": q.get('tax_rate', 5.0),
                    "markup_percent": q.get('markup_percent', 15.0),
                    "contingency_percent": q.get('contingency_percent', 10.0),
                    "pricing_profile": q.get('pricing_profile', 'Standard'),
                    "valid_until": q.get('valid_until'),
                    "client_info": q.get('client_info'),
                    "project_info": q.get('project_info'),
                    "company_profile_snapshot": q.get('company_profile_snapshot'),
                    "clarifications": q.get('clarifications'),
                    "internal_notes": q.get('internal_notes'),
                    "subtotal": q.get('subtotal', 0),
                    "markup_amount": q.get('markup_amount', 0),
                    "contingency_amount": q.get('contingency_amount', 0),
                    "tax_amount": q.get('tax_amount', 0),
                    "total": q.get('total', 0),
                    "item_count": q.get('item_count', 0),
                    "created_at": q.get('created_at'),
                    "updated_at": q.get('updated_at'),
                    "line_items": line_items if include_items else None
                }
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting estimate: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{estimate_id}")
async def update_estimate(
    estimate_id: str,
    data: EstimateUpdate,
    authorization: str = Header(None)
):
    """Update estimate metadata"""
    context = await verify_token_and_get_context(authorization)
    
    try:
        # Build update data - only include fields that are set
        update_data = {}
        
        if data.name is not None:
            update_data['project_name'] = data.name
        if data.description is not None:
            update_data['description'] = data.description
        if data.tax_rate is not None:
            update_data['tax_rate'] = data.tax_rate
        if data.markup_percent is not None:
            update_data['markup_percent'] = data.markup_percent
        if data.contingency_percent is not None:
            update_data['contingency_percent'] = data.contingency_percent
        if data.pricing_profile is not None:
            update_data['pricing_profile'] = data.pricing_profile
        if data.valid_until is not None:
            update_data['valid_until'] = data.valid_until.isoformat()
        if data.notes is not None:
            update_data['notes'] = data.notes
        if data.status is not None:
            update_data['status'] = data.status
        if data.client_info is not None:
            update_data['client_info'] = data.client_info
        if data.project_info is not None:
            update_data['project_info'] = data.project_info
        if data.company_profile_snapshot is not None:
            update_data['company_profile_snapshot'] = data.company_profile_snapshot
        if data.clarifications is not None:
            update_data['clarifications'] = data.clarifications
        if data.internal_notes is not None:
            update_data['internal_notes'] = data.internal_notes
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Build access filter
            if context["organization_id"]:
                access_filter = f"organization_id=eq.{context['organization_id']}"
            else:
                access_filter = f"user_id=eq.{context['user_id']}"
            
            response = await client.patch(
                f"{config.SUPABASE_URL}/rest/v1/quotes?"
                f"id=eq.{estimate_id}&{access_filter}",
                headers=await get_service_headers(),
                json=update_data
            )
            
            if response.status_code in [200, 204]:
                # Recalculate totals if pricing changed
                if any(k in update_data for k in ['tax_rate', 'markup_percent', 'contingency_percent']):
                    await recalculate_estimate_totals(
                        estimate_id,
                        data.tax_rate or 5.0,
                        data.markup_percent or 15.0,
                        data.contingency_percent or 10.0
                    )
                
                # Fetch and return updated estimate
                return await get_estimate(estimate_id, authorization, include_items=False)
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating estimate: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{estimate_id}")
async def delete_estimate(
    estimate_id: str,
    authorization: str = Header(None),
    permanent: bool = Query(False)
):
    """Delete or archive an estimate"""
    context = await verify_token_and_get_context(authorization)
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Build access filter
            if context["organization_id"]:
                access_filter = f"organization_id=eq.{context['organization_id']}"
            else:
                access_filter = f"user_id=eq.{context['user_id']}"
            
            if permanent:
                # Permanent delete - line items cascade automatically
                response = await client.delete(
                    f"{config.SUPABASE_URL}/rest/v1/quotes?"
                    f"id=eq.{estimate_id}&{access_filter}",
                    headers=await get_service_headers()
                )
            else:
                # Soft delete - set status to archived
                response = await client.patch(
                    f"{config.SUPABASE_URL}/rest/v1/quotes?"
                    f"id=eq.{estimate_id}&{access_filter}",
                    headers=await get_service_headers(),
                    json={"status": "archived"}
                )
            
            if response.status_code in [200, 204]:
                return {"success": True, "message": "Estimate deleted" if permanent else "Estimate archived"}
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting estimate: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# LINE ITEM ENDPOINTS
# =====================================================

@router.post("/{estimate_id}/items")
async def add_line_item(
    estimate_id: str,
    data: EstimateLineItemCreate,
    authorization: str = Header(None)
):
    """Add a line item to an estimate with pricing snapshot"""
    context = await verify_token_and_get_context(authorization)
    
    try:
        # Verify access to the estimate
        async with httpx.AsyncClient(timeout=10.0) as client:
            if context["organization_id"]:
                access_filter = f"organization_id=eq.{context['organization_id']}"
            else:
                access_filter = f"user_id=eq.{context['user_id']}"
            
            est_response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/quotes?"
                f"id=eq.{estimate_id}&{access_filter}&"
                f"select=id,pricing_profile,tax_rate,markup_percent,contingency_percent",
                headers=await get_service_headers()
            )
            
            if est_response.status_code != 200 or not est_response.json():
                raise HTTPException(status_code=404, detail="Estimate not found or access denied")
            
            estimate = est_response.json()[0]
            pricing_profile = estimate.get('pricing_profile', 'Standard')
            
            # Get production item snapshot
            snapshot_data = await get_production_item_snapshot(data.standard_id, pricing_profile)
            
            if not snapshot_data:
                raise HTTPException(status_code=404, detail="Production item not found")
            
            # Calculate effective unit price
            unit_price = data.unit_price_override if data.unit_price_override is not None else snapshot_data['unit_price']
            line_total = data.quantity * unit_price
            
            # Create line item
            line_item_data = {
                "quote_id": estimate_id,
                "standard_id": data.standard_id,
                "domain_id": snapshot_data.get('domain_id'),
                "domain_name": snapshot_data.get('domain_name'),
                "description": snapshot_data['snapshot'].get('production_name', ''),
                "quantity": data.quantity,
                "unit_price": unit_price,
                "unit_price_override": data.unit_price_override,
                "unit": snapshot_data['snapshot'].get('unit_of_measure', 'EA'),
                "line_total": round(line_total, 2),
                "sort_order": data.sort_order or 0,
                "snapshot": snapshot_data['snapshot'],
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            response = await client.post(
                f"{config.SUPABASE_URL}/rest/v1/quote_line_items",
                headers=await get_service_headers(),
                json=line_item_data
            )
            
            if response.status_code in [200, 201]:
                result = response.json()
                item = result[0] if isinstance(result, list) else result
                
                # Recalculate estimate totals
                await recalculate_estimate_totals(
                    estimate_id,
                    estimate.get('tax_rate', 5.0),
                    estimate.get('markup_percent', 15.0),
                    estimate.get('contingency_percent', 10.0)
                )
                
                return {
                    "id": item['id'],
                    "estimate_id": estimate_id,
                    "standard_id": item.get('standard_id'),
                    "quantity": item.get('quantity', 1),
                    "unit_price": item.get('unit_price', 0),
                    "unit_price_override": item.get('unit_price_override'),
                    "notes": item.get('description'),
                    "sort_order": item.get('sort_order', 0),
                    "domain_id": item.get('domain_id'),
                    "domain_name": item.get('domain_name'),
                    "snapshot": item.get('snapshot'),
                    "line_total": item.get('line_total', 0)
                }
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding line item: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{estimate_id}/items/{item_id}")
async def update_line_item(
    estimate_id: str,
    item_id: str,
    quantity: Optional[float] = Query(None),
    unit_price_override: Optional[float] = Query(None),
    notes: Optional[str] = Query(None),
    authorization: str = Header(None)
):
    """Update line item quantity or price override"""
    context = await verify_token_and_get_context(authorization)
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # First get the line item to verify access and get current values
            if context["organization_id"]:
                access_filter = f"organization_id=eq.{context['organization_id']}"
            else:
                access_filter = f"user_id=eq.{context['user_id']}"
            
            # Verify estimate access
            est_check = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/quotes?"
                f"id=eq.{estimate_id}&{access_filter}&"
                f"select=id,tax_rate,markup_percent,contingency_percent",
                headers=await get_service_headers()
            )
            
            if est_check.status_code != 200 or not est_check.json():
                raise HTTPException(status_code=404, detail="Estimate not found or access denied")
            
            estimate = est_check.json()[0]
            
            # Get current line item
            item_check = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/quote_line_items?"
                f"id=eq.{item_id}&quote_id=eq.{estimate_id}&"
                f"select=*",
                headers=await get_service_headers()
            )
            
            if item_check.status_code != 200 or not item_check.json():
                raise HTTPException(status_code=404, detail="Line item not found")
            
            current_item = item_check.json()[0]
            
            # Build update
            update_data = {}
            new_quantity = quantity if quantity is not None else current_item.get('quantity', 1)
            
            if quantity is not None:
                update_data['quantity'] = quantity
            
            if unit_price_override is not None:
                update_data['unit_price_override'] = unit_price_override
                update_data['unit_price'] = unit_price_override
            
            if notes is not None:
                update_data['description'] = notes
            
            # Recalculate line total
            effective_price = unit_price_override if unit_price_override is not None else current_item.get('unit_price', 0)
            update_data['line_total'] = round(new_quantity * effective_price, 2)
            
            # Update item
            response = await client.patch(
                f"{config.SUPABASE_URL}/rest/v1/quote_line_items?"
                f"id=eq.{item_id}&quote_id=eq.{estimate_id}",
                headers=await get_service_headers(),
                json=update_data
            )
            
            if response.status_code in [200, 204]:
                # Recalculate estimate totals
                await recalculate_estimate_totals(
                    estimate_id,
                    estimate.get('tax_rate', 5.0),
                    estimate.get('markup_percent', 15.0),
                    estimate.get('contingency_percent', 10.0)
                )
                
                return {"success": True, "message": "Line item updated"}
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating line item: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{estimate_id}/items/{item_id}")
async def delete_line_item(
    estimate_id: str,
    item_id: str,
    authorization: str = Header(None)
):
    """Remove a line item from an estimate"""
    context = await verify_token_and_get_context(authorization)
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Verify estimate access
            if context["organization_id"]:
                access_filter = f"organization_id=eq.{context['organization_id']}"
            else:
                access_filter = f"user_id=eq.{context['user_id']}"
            
            est_check = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/quotes?"
                f"id=eq.{estimate_id}&{access_filter}&"
                f"select=id,tax_rate,markup_percent,contingency_percent",
                headers=await get_service_headers()
            )
            
            if est_check.status_code != 200 or not est_check.json():
                raise HTTPException(status_code=404, detail="Estimate not found or access denied")
            
            estimate = est_check.json()[0]
            
            # Delete line item
            response = await client.delete(
                f"{config.SUPABASE_URL}/rest/v1/quote_line_items?"
                f"id=eq.{item_id}&quote_id=eq.{estimate_id}",
                headers=await get_service_headers()
            )
            
            if response.status_code in [200, 204]:
                # Recalculate estimate totals
                await recalculate_estimate_totals(
                    estimate_id,
                    estimate.get('tax_rate', 5.0),
                    estimate.get('markup_percent', 15.0),
                    estimate.get('contingency_percent', 10.0)
                )
                
                return {"success": True, "message": "Line item removed"}
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting line item: {e}")
        raise HTTPException(status_code=500, detail=str(e))
