"""
TradeOS Materials API Routes
Handles CRUD operations for project materials tracking
"""
import os
import logging
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
import httpx
import json

router = APIRouter(prefix="/api/materials", tags=["materials"])
logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

# Material categories
MATERIAL_CATEGORIES = ['Materials', 'Consumables', 'Tools', 'Equipment', 'Rental', 'Delivery']
MATERIAL_UNITS = ['ea', 'box', 'sheet', 'LF', 'SF', 'hours', 'days', 'gal', 'lb', 'other']
TAX_TYPES = ['GST', 'PST', 'HST', 'Sales Tax', 'None']
PAID_STATUSES = ['Unpaid', 'Paid']


class MaterialCreate(BaseModel):
    project_id: str
    item_name: str
    category: str = 'Materials'
    vendor: Optional[str] = None
    qty: float = 1
    unit: str = 'ea'
    unit_cost: float = 0
    tax_type: str = 'None'
    tax_amount: float = 0
    purchased_date: Optional[str] = None
    paid_status: str = 'Unpaid'
    billable: bool = False
    markup_pct: float = 0
    receipt_document_id: Optional[str] = None
    notes: Optional[str] = None


class MaterialUpdate(BaseModel):
    item_name: Optional[str] = None
    category: Optional[str] = None
    vendor: Optional[str] = None
    qty: Optional[float] = None
    unit: Optional[str] = None
    unit_cost: Optional[float] = None
    tax_type: Optional[str] = None
    tax_amount: Optional[float] = None
    purchased_date: Optional[str] = None
    paid_status: Optional[str] = None
    billable: Optional[bool] = None
    markup_pct: Optional[float] = None
    receipt_document_id: Optional[str] = None
    notes: Optional[str] = None


def get_user_id_from_token(authorization: str) -> Optional[str]:
    """Extract user_id from JWT token"""
    if not authorization or not authorization.startswith('Bearer '):
        return None
    try:
        token = authorization.replace('Bearer ', '')
        import base64
        parts = token.split('.')
        if len(parts) != 3:
            return None
        payload = parts[1]
        padding = 4 - len(payload) % 4
        if padding != 4:
            payload += '=' * padding
        decoded = base64.urlsafe_b64decode(payload)
        data = json.loads(decoded)
        return data.get('sub')
    except Exception:
        return None


def get_headers(authorization: str):
    """Get headers for Supabase requests"""
    token = authorization.replace('Bearer ', '') if authorization else ''
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }


@router.get("")
async def list_materials(
    project_id: Optional[str] = None,
    category: Optional[str] = None,
    paid_status: Optional[str] = None,
    authorization: str = Header(None)
):
    """List materials with optional filters"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        params = {"user_id": f"eq.{user_id}", "order": "purchased_date.desc"}
        
        if project_id:
            params["project_id"] = f"eq.{project_id}"
        if category:
            params["category"] = f"eq.{category}"
        if paid_status:
            params["paid_status"] = f"eq.{paid_status}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/materials",
                headers=get_headers(authorization),
                params=params
            )
            
            if response.status_code != 200:
                logger.error(f"Materials list error: {response.text}")
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch materials")
            
            materials = response.json()
            
            # Calculate summary stats
            total_pretax = sum(float(m.get('line_total', 0) or 0) for m in materials)
            total_tax = sum(float(m.get('tax_amount', 0) or 0) for m in materials)
            total_with_tax = sum(float(m.get('total_with_tax', 0) or 0) for m in materials)
            billable_total = sum(
                float(m.get('marked_up_total', 0) or m.get('total_with_tax', 0) or 0) 
                for m in materials if m.get('billable')
            )
            non_billable_total = total_with_tax - billable_total
            
            return {
                "materials": materials,
                "summary": {
                    "count": len(materials),
                    "total_pretax": round(total_pretax, 2),
                    "total_tax": round(total_tax, 2),
                    "total_with_tax": round(total_with_tax, 2),
                    "billable_total": round(billable_total, 2),
                    "non_billable_total": round(non_billable_total, 2)
                }
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Materials list error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def create_material(
    material: MaterialCreate,
    authorization: str = Header(None)
):
    """Create a new material entry"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Validate category
    if material.category not in MATERIAL_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {MATERIAL_CATEGORIES}")
    
    # Validate unit
    if material.unit not in MATERIAL_UNITS:
        raise HTTPException(status_code=400, detail=f"Invalid unit. Must be one of: {MATERIAL_UNITS}")
    
    # Validate tax type
    if material.tax_type not in TAX_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid tax_type. Must be one of: {TAX_TYPES}")
    
    try:
        data = {
            "user_id": user_id,
            "project_id": material.project_id,
            "item_name": material.item_name,
            "category": material.category,
            "vendor": material.vendor,
            "qty": material.qty,
            "unit": material.unit,
            "unit_cost": material.unit_cost,
            "tax_type": material.tax_type,
            "tax_amount": material.tax_amount,
            "purchased_date": material.purchased_date or date.today().isoformat(),
            "paid_status": material.paid_status,
            "billable": material.billable,
            "markup_pct": material.markup_pct,
            "receipt_document_id": material.receipt_document_id,
            "notes": material.notes
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/materials",
                headers=get_headers(authorization),
                json=data
            )
            
            if response.status_code not in [200, 201]:
                logger.error(f"Material create error: {response.text}")
                raise HTTPException(status_code=response.status_code, detail="Failed to create material")
            
            created = response.json()
            return created[0] if isinstance(created, list) else created
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Material create error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{material_id}")
async def get_material(
    material_id: str,
    authorization: str = Header(None)
):
    """Get a specific material by ID"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/materials",
                headers=get_headers(authorization),
                params={"id": f"eq.{material_id}", "user_id": f"eq.{user_id}"}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch material")
            
            materials = response.json()
            if not materials:
                raise HTTPException(status_code=404, detail="Material not found")
            
            return materials[0]
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Material get error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{material_id}")
async def update_material(
    material_id: str,
    material: MaterialUpdate,
    authorization: str = Header(None)
):
    """Update a material entry"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Validate category if provided
    if material.category and material.category not in MATERIAL_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {MATERIAL_CATEGORIES}")
    
    # Validate unit if provided
    if material.unit and material.unit not in MATERIAL_UNITS:
        raise HTTPException(status_code=400, detail=f"Invalid unit. Must be one of: {MATERIAL_UNITS}")
    
    # Validate tax type if provided
    if material.tax_type and material.tax_type not in TAX_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid tax_type. Must be one of: {TAX_TYPES}")
    
    try:
        # Build update data, excluding None values
        update_data = {k: v for k, v in material.dict().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{SUPABASE_URL}/rest/v1/materials",
                headers=get_headers(authorization),
                params={"id": f"eq.{material_id}", "user_id": f"eq.{user_id}"},
                json=update_data
            )
            
            if response.status_code != 200:
                logger.error(f"Material update error: {response.text}")
                raise HTTPException(status_code=response.status_code, detail="Failed to update material")
            
            updated = response.json()
            if not updated:
                raise HTTPException(status_code=404, detail="Material not found")
            
            return updated[0]
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Material update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{material_id}")
async def delete_material(
    material_id: str,
    authorization: str = Header(None)
):
    """Delete a material entry"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{SUPABASE_URL}/rest/v1/materials",
                headers=get_headers(authorization),
                params={"id": f"eq.{material_id}", "user_id": f"eq.{user_id}"}
            )
            
            if response.status_code not in [200, 204]:
                raise HTTPException(status_code=response.status_code, detail="Failed to delete material")
            
            return {"message": "Material deleted successfully"}
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Material delete error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/project/{project_id}/summary")
async def get_project_materials_summary(
    project_id: str,
    authorization: str = Header(None)
):
    """Get materials summary for a specific project"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/materials",
                headers=get_headers(authorization),
                params={
                    "project_id": f"eq.{project_id}",
                    "user_id": f"eq.{user_id}"
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch materials")
            
            materials = response.json()
            
            # Calculate summary
            total_pretax = sum(float(m.get('line_total', 0) or 0) for m in materials)
            total_tax = sum(float(m.get('tax_amount', 0) or 0) for m in materials)
            total_with_tax = sum(float(m.get('total_with_tax', 0) or 0) for m in materials)
            
            billable_materials = [m for m in materials if m.get('billable')]
            billable_total = sum(
                float(m.get('marked_up_total', 0) or m.get('total_with_tax', 0) or 0) 
                for m in billable_materials
            )
            non_billable_total = total_with_tax - billable_total
            
            # Category breakdown
            by_category = {}
            for m in materials:
                cat = m.get('category', 'Other')
                if cat not in by_category:
                    by_category[cat] = {"count": 0, "total": 0}
                by_category[cat]["count"] += 1
                by_category[cat]["total"] += float(m.get('total_with_tax', 0) or 0)
            
            return {
                "project_id": project_id,
                "materials_count": len(materials),
                "total_pretax": round(total_pretax, 2),
                "total_tax": round(total_tax, 2),
                "total_with_tax": round(total_with_tax, 2),
                "billable_total": round(billable_total, 2),
                "non_billable_total": round(non_billable_total, 2),
                "by_category": by_category,
                "unpaid_count": len([m for m in materials if m.get('paid_status') == 'Unpaid']),
                "paid_count": len([m for m in materials if m.get('paid_status') == 'Paid'])
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Materials summary error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/categories/list")
async def get_material_categories():
    """Get list of valid material categories"""
    return {
        "categories": MATERIAL_CATEGORIES,
        "units": MATERIAL_UNITS,
        "tax_types": TAX_TYPES,
        "paid_statuses": PAID_STATUSES
    }
