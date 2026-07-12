"""
Tenders Routes - Vertical Slice 1
==================================
A Tender is the estimate/quote within an Opportunity Workspace.
The Tender Workspace is where contractors build their estimates.

Per Constitution Article II: Everything happens inside a Workspace.
The Tender Workspace follows the Universal Workspace Pattern.

FULL ESTIMATE LINE ITEM STRUCTURE:
Each line item supports: Category, Scope, Description, Quantity, Unit,
Labor, Material, Equipment, Subcontract, Production Rate, Crew, Duration,
Waste, Markup, Overhead, Profit, Contingency, Tax, Notes, Attachments,
Production Library reference, Company Brain reference.

Features:
- Create/manage tenders within opportunities
- Section and line item management
- Full cost breakdown per line item
- Automatic total calculations
- Version history (nothing is ever overwritten)
- Proposal generation
"""

from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from decimal import Decimal
import os
import logging
import httpx
import jwt
import json

router = APIRouter(prefix="/api/tenders", tags=["tenders"])
logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

# =====================================================
# PYDANTIC MODELS
# =====================================================

class TenderCreate(BaseModel):
    opportunity_id: str
    version_label: Optional[str] = None
    scope_of_work: Optional[str] = None
    inclusions: Optional[str] = None
    exclusions: Optional[str] = None
    assumptions: Optional[str] = None
    clarifications: Optional[str] = None
    terms_and_conditions: Optional[str] = None
    payment_terms: Optional[str] = None
    warranty_terms: Optional[str] = None
    notes_to_client: Optional[str] = None
    internal_notes: Optional[str] = None
    valid_days: int = 30
    tax_rate: float = 12.00
    tax_included: bool = False

class TenderUpdate(BaseModel):
    version_label: Optional[str] = None
    scope_of_work: Optional[str] = None
    inclusions: Optional[str] = None
    exclusions: Optional[str] = None
    assumptions: Optional[str] = None
    clarifications: Optional[str] = None
    alternates: Optional[str] = None
    terms_and_conditions: Optional[str] = None
    payment_terms: Optional[str] = None
    warranty_terms: Optional[str] = None
    notes_to_client: Optional[str] = None
    internal_notes: Optional[str] = None
    valid_days: Optional[int] = None
    tax_rate: Optional[float] = None
    tax_included: Optional[bool] = None
    
    # Markup settings
    markup_type: Optional[str] = None
    markup_percent: Optional[float] = None
    markup_amount: Optional[float] = None
    overhead_type: Optional[str] = None
    overhead_percent: Optional[float] = None
    overhead_amount: Optional[float] = None
    profit_type: Optional[str] = None
    profit_percent: Optional[float] = None
    profit_amount: Optional[float] = None
    contingency_type: Optional[str] = None
    contingency_percent: Optional[float] = None
    contingency_amount: Optional[float] = None
    discount_type: Optional[str] = None
    discount_percent: Optional[float] = None
    discount_amount: Optional[float] = None

class SectionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    sort_order: Optional[int] = 0
    show_line_items: bool = True
    show_in_proposal: bool = True

class SectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None
    show_line_items: Optional[bool] = None
    show_in_proposal: Optional[bool] = None
    is_collapsed: Optional[bool] = None

# FULL LINE ITEM MODEL - Built as benchmark from day one
class LineItemCreate(BaseModel):
    section_id: Optional[str] = None
    
    # Core fields
    category: Optional[str] = None
    scope: Optional[str] = None
    name: str
    description: Optional[str] = None
    
    # Quantity & Unit
    quantity: float = 1
    unit: str = "each"
    
    # Labor
    labor_hours: float = 0
    labor_rate: float = 0
    labor_burden_percent: float = 0
    
    # Material
    material_quantity: float = 0
    material_unit: Optional[str] = None
    material_unit_cost: float = 0
    
    # Equipment
    equipment_description: Optional[str] = None
    equipment_hours: float = 0
    equipment_rate: float = 0
    equipment_cost: float = 0
    
    # Subcontractor
    subcontractor_name: Optional[str] = None
    subcontractor_scope: Optional[str] = None
    subcontractor_cost: float = 0
    
    # Production Rate
    production_rate: Optional[float] = None
    production_rate_unit: Optional[str] = None
    production_source: Optional[str] = None  # library, manual, brain_suggested
    
    # Crew
    crew_size: float = 1
    crew_composition: Optional[str] = None
    
    # Duration
    duration_hours: float = 0
    duration_days: float = 0
    
    # Waste
    waste_percent: float = 0
    
    # Line-level adjustments
    markup_percent: float = 0
    overhead_percent: float = 0
    profit_percent: float = 0
    contingency_percent: float = 0
    
    # Tax
    tax_percent: float = 0
    is_taxable: bool = True
    
    # Notes
    notes: Optional[str] = None
    internal_notes: Optional[str] = None
    
    # Display options
    is_optional: bool = False
    is_included: bool = True
    is_alternate: bool = False
    alternate_group: Optional[str] = None
    show_quantity: bool = True
    show_unit_price: bool = True
    show_in_proposal: bool = True
    
    # Production Library reference
    production_item_id: Optional[str] = None

class LineItemUpdate(BaseModel):
    section_id: Optional[str] = None
    category: Optional[str] = None
    scope: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    labor_hours: Optional[float] = None
    labor_rate: Optional[float] = None
    labor_burden_percent: Optional[float] = None
    material_quantity: Optional[float] = None
    material_unit: Optional[str] = None
    material_unit_cost: Optional[float] = None
    equipment_description: Optional[str] = None
    equipment_hours: Optional[float] = None
    equipment_rate: Optional[float] = None
    equipment_cost: Optional[float] = None
    subcontractor_name: Optional[str] = None
    subcontractor_scope: Optional[str] = None
    subcontractor_cost: Optional[float] = None
    production_rate: Optional[float] = None
    production_rate_unit: Optional[str] = None
    production_source: Optional[str] = None
    crew_size: Optional[float] = None
    crew_composition: Optional[str] = None
    duration_hours: Optional[float] = None
    duration_days: Optional[float] = None
    waste_percent: Optional[float] = None
    markup_percent: Optional[float] = None
    overhead_percent: Optional[float] = None
    profit_percent: Optional[float] = None
    contingency_percent: Optional[float] = None
    tax_percent: Optional[float] = None
    is_taxable: Optional[bool] = None
    notes: Optional[str] = None
    internal_notes: Optional[str] = None
    is_optional: Optional[bool] = None
    is_included: Optional[bool] = None
    is_alternate: Optional[bool] = None
    alternate_group: Optional[str] = None
    show_quantity: Optional[bool] = None
    show_unit_price: Optional[bool] = None
    show_in_proposal: Optional[bool] = None
    sort_order: Optional[int] = None
    production_item_id: Optional[str] = None

class ReorderRequest(BaseModel):
    item_ids: List[str]

class SubmitTenderRequest(BaseModel):
    version_label: Optional[str] = None
    submitted_to: Optional[str] = None
    submission_method: Optional[str] = None  # email, portal, hand_delivered, mail

# =====================================================
# UTILITY FUNCTIONS
# =====================================================

async def get_service_headers():
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

async def verify_token_and_get_org(authorization: str) -> tuple:
    """Verify JWT and get user_id and organization_id"""
    try:
        token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
        decoded = jwt.decode(token, options={"verify_signature": False})
        user_id = decoded.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/organization_members?"
                f"user_id=eq.{user_id}&is_active=eq.true&is_primary=eq.true&select=organization_id",
                headers=await get_service_headers()
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to fetch organization")
            
            members = response.json()
            if not members:
                response = await client.get(
                    f"{SUPABASE_URL}/rest/v1/organization_members?"
                    f"user_id=eq.{user_id}&is_active=eq.true&select=organization_id&limit=1",
                    headers=await get_service_headers()
                )
                members = response.json() if response.status_code == 200 else []
            
            if not members:
                raise HTTPException(status_code=403, detail="User not a member of any organization")
            
            return user_id, members[0]['organization_id']
            
    except jwt.DecodeError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

async def verify_tender_access(tender_id: str, org_id: str) -> dict:
    """Verify user has access to tender and return tender data"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/tenders?"
            f"id=eq.{tender_id}&organization_id=eq.{org_id}&select=*",
            headers=await get_service_headers()
        )
        
        if response.status_code != 200 or not response.json():
            raise HTTPException(status_code=404, detail="Tender not found")
        
        return response.json()[0]

async def calculate_line_item_totals(item: dict) -> dict:
    """Calculate all totals for a line item"""
    # Labor
    labor_hours = float(item.get('labor_hours', 0) or 0)
    labor_rate = float(item.get('labor_rate', 0) or 0)
    labor_total = labor_hours * labor_rate
    
    # Labor burden
    labor_burden_percent = float(item.get('labor_burden_percent', 0) or 0)
    labor_burden_amount = round(labor_total * (labor_burden_percent / 100), 2)
    
    # Material
    material_quantity = float(item.get('material_quantity', 0) or 0)
    material_unit_cost = float(item.get('material_unit_cost', 0) or 0)
    material_total = material_quantity * material_unit_cost
    
    # Equipment
    equipment_hours = float(item.get('equipment_hours', 0) or 0)
    equipment_rate = float(item.get('equipment_rate', 0) or 0)
    equipment_cost = float(item.get('equipment_cost', 0) or 0)
    if equipment_hours > 0 and equipment_rate > 0:
        equipment_cost = equipment_hours * equipment_rate
    
    # Subcontractor
    subcontractor_cost = float(item.get('subcontractor_cost', 0) or 0)
    
    # Base cost
    cost_total = labor_total + labor_burden_amount + material_total + equipment_cost + subcontractor_cost
    
    # Waste
    waste_percent = float(item.get('waste_percent', 0) or 0)
    waste_amount = round(cost_total * (waste_percent / 100), 2)
    cost_total = cost_total + waste_amount
    
    # Line-level adjustments
    markup_percent = float(item.get('markup_percent', 0) or 0)
    markup_amount = round(cost_total * (markup_percent / 100), 2)
    
    overhead_percent = float(item.get('overhead_percent', 0) or 0)
    overhead_amount = round(cost_total * (overhead_percent / 100), 2)
    
    profit_percent = float(item.get('profit_percent', 0) or 0)
    profit_amount = round(cost_total * (profit_percent / 100), 2)
    
    contingency_percent = float(item.get('contingency_percent', 0) or 0)
    contingency_amount = round(cost_total * (contingency_percent / 100), 2)
    
    # Line total
    line_total = cost_total + markup_amount + overhead_amount + profit_amount + contingency_amount
    
    # Unit calculations
    quantity = float(item.get('quantity', 1) or 1)
    unit_cost = round(cost_total / quantity, 2) if quantity > 0 else 0
    unit_price = round(line_total / quantity, 2) if quantity > 0 else 0
    
    return {
        "labor_total": round(labor_total, 2),
        "labor_burden_amount": labor_burden_amount,
        "material_total": round(material_total, 2),
        "equipment_cost": round(equipment_cost, 2),
        "waste_amount": waste_amount,
        "markup_amount": markup_amount,
        "overhead_amount": overhead_amount,
        "profit_amount": profit_amount,
        "contingency_amount": contingency_amount,
        "cost_total": round(cost_total, 2),
        "unit_cost": unit_cost,
        "unit_price": unit_price,
        "line_total": round(line_total, 2)
    }

async def recalculate_tender_totals(tender_id: str):
    """Recalculate and update tender totals from line items"""
    async with httpx.AsyncClient() as client:
        # Get tender
        tender_response = await client.get(
            f"{SUPABASE_URL}/rest/v1/tenders?id=eq.{tender_id}&select=*",
            headers=await get_service_headers()
        )
        
        if tender_response.status_code != 200 or not tender_response.json():
            return
        
        tender = tender_response.json()[0]
        
        # Get included line items
        items_response = await client.get(
            f"{SUPABASE_URL}/rest/v1/tender_line_items?"
            f"tender_id=eq.{tender_id}&is_included=eq.true&select=line_total",
            headers=await get_service_headers()
        )
        
        items = items_response.json() if items_response.status_code == 200 else []
        
        # Calculate subtotal
        subtotal = sum(float(item.get('line_total', 0) or 0) for item in items)
        
        # Calculate tender-level adjustments
        markup_amount = (
            round(subtotal * float(tender.get('markup_percent', 0) or 0) / 100, 2)
            if tender.get('markup_type') == 'percent'
            else float(tender.get('markup_amount', 0) or 0)
        )
        
        overhead_amount = (
            round(subtotal * float(tender.get('overhead_percent', 0) or 0) / 100, 2)
            if tender.get('overhead_type') == 'percent'
            else float(tender.get('overhead_amount', 0) or 0)
        )
        
        profit_amount = (
            round(subtotal * float(tender.get('profit_percent', 0) or 0) / 100, 2)
            if tender.get('profit_type') == 'percent'
            else float(tender.get('profit_amount', 0) or 0)
        )
        
        contingency_amount = (
            round(subtotal * float(tender.get('contingency_percent', 0) or 0) / 100, 2)
            if tender.get('contingency_type') == 'percent'
            else float(tender.get('contingency_amount', 0) or 0)
        )
        
        discount_amount = (
            round(subtotal * float(tender.get('discount_percent', 0) or 0) / 100, 2)
            if tender.get('discount_type') == 'percent'
            else float(tender.get('discount_amount', 0) or 0)
        )
        
        pretax_total = subtotal + markup_amount + overhead_amount + profit_amount + contingency_amount - discount_amount
        
        tax_amount = (
            0 if tender.get('tax_included')
            else round(pretax_total * float(tender.get('tax_rate', 12) or 12) / 100, 2)
        )
        
        total = pretax_total + tax_amount
        
        # Update tender
        await client.patch(
            f"{SUPABASE_URL}/rest/v1/tenders?id=eq.{tender_id}",
            headers=await get_service_headers(),
            json={
                "subtotal": round(subtotal, 2),
                "markup_amount": markup_amount,
                "overhead_amount": overhead_amount,
                "profit_amount": profit_amount,
                "contingency_amount": contingency_amount,
                "discount_amount": discount_amount,
                "tax_amount": tax_amount,
                "total": round(total, 2),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        )
        
        # Update section totals
        sections_response = await client.get(
            f"{SUPABASE_URL}/rest/v1/tender_sections?tender_id=eq.{tender_id}&select=id",
            headers=await get_service_headers()
        )
        
        if sections_response.status_code == 200:
            for section in sections_response.json():
                section_items_response = await client.get(
                    f"{SUPABASE_URL}/rest/v1/tender_line_items?"
                    f"section_id=eq.{section['id']}&is_included=eq.true&"
                    f"select=labor_total,material_total,equipment_cost,subcontractor_cost,line_total",
                    headers=await get_service_headers()
                )
                
                section_items = section_items_response.json() if section_items_response.status_code == 200 else []
                
                labor_total = sum(float(item.get('labor_total', 0) or 0) for item in section_items)
                material_total = sum(float(item.get('material_total', 0) or 0) for item in section_items)
                equipment_total = sum(float(item.get('equipment_cost', 0) or 0) for item in section_items)
                subcontract_total = sum(float(item.get('subcontractor_cost', 0) or 0) for item in section_items)
                section_subtotal = sum(float(item.get('line_total', 0) or 0) for item in section_items)
                
                await client.patch(
                    f"{SUPABASE_URL}/rest/v1/tender_sections?id=eq.{section['id']}",
                    headers=await get_service_headers(),
                    json={
                        "labor_total": round(labor_total, 2),
                        "material_total": round(material_total, 2),
                        "equipment_total": round(equipment_total, 2),
                        "subcontract_total": round(subcontract_total, 2),
                        "subtotal": round(section_subtotal, 2),
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                )

async def log_opportunity_activity(org_id: str, opp_id: str, event_type: str, title: str,
                                    description: str = None, event_data: dict = None,
                                    user_id: str = None, tender_id: str = None):
    """Log activity to opportunity"""
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{SUPABASE_URL}/rest/v1/opportunity_activity",
                headers=await get_service_headers(),
                json={
                    "opportunity_id": opp_id,
                    "organization_id": org_id,
                    "event_type": event_type,
                    "event_title": title,
                    "event_description": description,
                    "event_data": event_data or {},
                    "performed_by": user_id,
                    "tender_id": tender_id
                }
            )
    except Exception as e:
        logger.error(f"Failed to log activity: {e}")

# =====================================================
# TENDER ENDPOINTS
# =====================================================

@router.get("/health")
async def tenders_health():
    """Health check"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/tenders?limit=1",
                headers=await get_service_headers()
            )
            if response.status_code == 200:
                return {"status": "healthy", "service": "tenders"}
            elif 'does not exist' in response.text:
                return {"status": "pending", "message": "Run migration 014"}
            return {"status": "degraded"}
    except Exception as e:
        return {"status": "error", "error": str(e)[:100]}

@router.post("")
async def create_tender(tender: TenderCreate, authorization: str = Header(...)):
    """Create a new tender for an opportunity"""
    user_id, org_id = await verify_token_and_get_org(authorization)
    
    try:
        async with httpx.AsyncClient() as client:
            # Verify opportunity exists and belongs to org
            opp_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/opportunities?"
                f"id=eq.{tender.opportunity_id}&organization_id=eq.{org_id}&select=id,name,status",
                headers=await get_service_headers()
            )
            
            if opp_response.status_code != 200 or not opp_response.json():
                raise HTTPException(status_code=404, detail="Opportunity not found")
            
            opportunity = opp_response.json()[0]
            
            # Mark any existing current tenders as not current
            await client.patch(
                f"{SUPABASE_URL}/rest/v1/tenders?"
                f"opportunity_id=eq.{tender.opportunity_id}&is_current=eq.true",
                headers=await get_service_headers(),
                json={"is_current": False}
            )
            
            # Get next version number
            version_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/tenders?"
                f"opportunity_id=eq.{tender.opportunity_id}&select=version_number&order=version_number.desc&limit=1",
                headers=await get_service_headers()
            )
            
            version_number = 1
            if version_response.status_code == 200 and version_response.json():
                version_number = version_response.json()[0].get('version_number', 0) + 1
            
            # Calculate valid_until date
            from datetime import date, timedelta
            valid_until = (date.today() + timedelta(days=tender.valid_days)).isoformat()
            
            # Create tender
            tender_data = {
                "organization_id": org_id,
                "opportunity_id": tender.opportunity_id,
                "version_number": version_number,
                "version_label": tender.version_label or f"Version {version_number}",
                "is_current": True,
                "status": "draft",
                "scope_of_work": tender.scope_of_work,
                "inclusions": tender.inclusions,
                "exclusions": tender.exclusions,
                "assumptions": tender.assumptions,
                "clarifications": tender.clarifications,
                "terms_and_conditions": tender.terms_and_conditions,
                "payment_terms": tender.payment_terms,
                "warranty_terms": tender.warranty_terms,
                "notes_to_client": tender.notes_to_client,
                "internal_notes": tender.internal_notes,
                "valid_days": tender.valid_days,
                "valid_until": valid_until,
                "tax_rate": tender.tax_rate,
                "tax_included": tender.tax_included,
                "created_by": user_id
            }
            
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/tenders",
                headers=await get_service_headers(),
                json=tender_data
            )
            
            if response.status_code not in [200, 201]:
                raise HTTPException(status_code=500, detail="Failed to create tender")
            
            created = response.json()
            if isinstance(created, list):
                created = created[0]
            
            # Update opportunity status if it's in discovered/qualifying
            if opportunity['status'] in ['discovered', 'qualifying']:
                await client.patch(
                    f"{SUPABASE_URL}/rest/v1/opportunities?id=eq.{tender.opportunity_id}",
                    headers=await get_service_headers(),
                    json={"status": "tendering", "updated_at": datetime.now(timezone.utc).isoformat()}
                )
            
            # Log activity
            await log_opportunity_activity(
                org_id=org_id,
                opp_id=tender.opportunity_id,
                event_type="tender_created",
                title=f"Tender v{version_number} created",
                user_id=user_id,
                tender_id=created['id']
            )
            
            return {"success": True, "tender": created}
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating tender: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{tender_id}")
async def get_tender(tender_id: str, authorization: str = Header(...)):
    """Get tender with all sections and line items"""
    user_id, org_id = await verify_token_and_get_org(authorization)
    
    try:
        tender = await verify_tender_access(tender_id, org_id)
        
        async with httpx.AsyncClient() as client:
            # Get sections
            sections_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/tender_sections?"
                f"tender_id=eq.{tender_id}&select=*&order=sort_order.asc",
                headers=await get_service_headers()
            )
            sections = sections_response.json() if sections_response.status_code == 200 else []
            
            # Get all line items
            items_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/tender_line_items?"
                f"tender_id=eq.{tender_id}&select=*&order=sort_order.asc",
                headers=await get_service_headers()
            )
            items = items_response.json() if items_response.status_code == 200 else []
            
            # Group items by section
            items_by_section = {}
            unsectioned_items = []
            
            for item in items:
                section_id = item.get('section_id')
                if section_id:
                    if section_id not in items_by_section:
                        items_by_section[section_id] = []
                    items_by_section[section_id].append(item)
                else:
                    unsectioned_items.append(item)
            
            # Attach items to sections
            for section in sections:
                section['items'] = items_by_section.get(section['id'], [])
            
            # Get version history
            versions_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/tender_versions?"
                f"tender_id=eq.{tender_id}&select=id,version_number,version_label,total,submitted_at,outcome&"
                f"order=version_number.desc",
                headers=await get_service_headers()
            )
            versions = versions_response.json() if versions_response.status_code == 200 else []
            
            return {
                "success": True,
                "tender": tender,
                "sections": sections,
                "unsectioned_items": unsectioned_items,
                "versions": versions,
                "summary": {
                    "subtotal": tender.get('subtotal', 0),
                    "markup": tender.get('markup_amount', 0),
                    "overhead": tender.get('overhead_amount', 0),
                    "profit": tender.get('profit_amount', 0),
                    "contingency": tender.get('contingency_amount', 0),
                    "discount": tender.get('discount_amount', 0),
                    "tax": tender.get('tax_amount', 0),
                    "total": tender.get('total', 0)
                }
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching tender: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{tender_id}")
async def update_tender(tender_id: str, updates: TenderUpdate, authorization: str = Header(...)):
    """Update tender settings"""
    user_id, org_id = await verify_token_and_get_org(authorization)
    
    try:
        tender = await verify_tender_access(tender_id, org_id)
        
        if tender.get('status') == 'submitted':
            raise HTTPException(status_code=400, detail="Cannot edit submitted tender. Create a new version.")
        
        update_data = updates.model_dump(exclude_none=True)
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        # Recalculate valid_until if valid_days changed
        if 'valid_days' in update_data:
            from datetime import date, timedelta
            update_data['valid_until'] = (date.today() + timedelta(days=update_data['valid_days'])).isoformat()
        
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{SUPABASE_URL}/rest/v1/tenders?id=eq.{tender_id}",
                headers=await get_service_headers(),
                json=update_data
            )
            
            if response.status_code not in [200, 204]:
                raise HTTPException(status_code=500, detail="Failed to update tender")
        
        # Recalculate totals if pricing fields changed
        pricing_fields = ['markup_type', 'markup_percent', 'markup_amount', 'overhead_type', 
                         'overhead_percent', 'overhead_amount', 'profit_type', 'profit_percent',
                         'profit_amount', 'contingency_type', 'contingency_percent',
                         'contingency_amount', 'discount_type', 'discount_percent', 'discount_amount',
                         'tax_rate', 'tax_included']
        
        if any(f in update_data for f in pricing_fields):
            await recalculate_tender_totals(tender_id)
        
        return {"success": True, "message": "Tender updated"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating tender: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================
# SECTION ENDPOINTS
# =====================================================

@router.post("/{tender_id}/sections")
async def create_section(tender_id: str, section: SectionCreate, authorization: str = Header(...)):
    """Create a new section in a tender"""
    user_id, org_id = await verify_token_and_get_org(authorization)
    
    try:
        tender = await verify_tender_access(tender_id, org_id)
        
        if tender.get('status') == 'submitted':
            raise HTTPException(status_code=400, detail="Cannot edit submitted tender")
        
        async with httpx.AsyncClient() as client:
            # Get max sort order
            order_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/tender_sections?"
                f"tender_id=eq.{tender_id}&select=sort_order&order=sort_order.desc&limit=1",
                headers=await get_service_headers()
            )
            
            max_order = 0
            if order_response.status_code == 200 and order_response.json():
                max_order = order_response.json()[0].get('sort_order', 0)
            
            section_data = {
                "tender_id": tender_id,
                "name": section.name,
                "description": section.description,
                "sort_order": section.sort_order if section.sort_order > 0 else max_order + 1,
                "show_line_items": section.show_line_items,
                "show_in_proposal": section.show_in_proposal
            }
            
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/tender_sections",
                headers=await get_service_headers(),
                json=section_data
            )
            
            if response.status_code not in [200, 201]:
                raise HTTPException(status_code=500, detail="Failed to create section")
            
            created = response.json()
            if isinstance(created, list):
                created = created[0]
            
            return {"success": True, "section": created}
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating section: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{tender_id}/sections/{section_id}")
async def update_section(tender_id: str, section_id: str, updates: SectionUpdate, 
                         authorization: str = Header(...)):
    """Update a section"""
    user_id, org_id = await verify_token_and_get_org(authorization)
    
    try:
        tender = await verify_tender_access(tender_id, org_id)
        
        if tender.get('status') == 'submitted':
            raise HTTPException(status_code=400, detail="Cannot edit submitted tender")
        
        update_data = updates.model_dump(exclude_none=True)
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{SUPABASE_URL}/rest/v1/tender_sections?id=eq.{section_id}&tender_id=eq.{tender_id}",
                headers=await get_service_headers(),
                json=update_data
            )
            
            if response.status_code not in [200, 204]:
                raise HTTPException(status_code=500, detail="Failed to update section")
        
        return {"success": True, "message": "Section updated"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating section: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{tender_id}/sections/{section_id}")
async def delete_section(tender_id: str, section_id: str, authorization: str = Header(...)):
    """Delete a section (moves items to unsectioned)"""
    user_id, org_id = await verify_token_and_get_org(authorization)
    
    try:
        tender = await verify_tender_access(tender_id, org_id)
        
        if tender.get('status') == 'submitted':
            raise HTTPException(status_code=400, detail="Cannot edit submitted tender")
        
        async with httpx.AsyncClient() as client:
            # Move items to unsectioned
            await client.patch(
                f"{SUPABASE_URL}/rest/v1/tender_line_items?section_id=eq.{section_id}",
                headers=await get_service_headers(),
                json={"section_id": None}
            )
            
            # Delete section
            response = await client.delete(
                f"{SUPABASE_URL}/rest/v1/tender_sections?id=eq.{section_id}&tender_id=eq.{tender_id}",
                headers=await get_service_headers()
            )
            
            if response.status_code not in [200, 204]:
                raise HTTPException(status_code=500, detail="Failed to delete section")
        
        return {"success": True, "message": "Section deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting section: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================
# LINE ITEM ENDPOINTS
# =====================================================

@router.post("/{tender_id}/items")
async def create_line_item(tender_id: str, item: LineItemCreate, authorization: str = Header(...)):
    """Create a new line item with full cost structure"""
    user_id, org_id = await verify_token_and_get_org(authorization)
    
    try:
        tender = await verify_tender_access(tender_id, org_id)
        
        if tender.get('status') == 'submitted':
            raise HTTPException(status_code=400, detail="Cannot edit submitted tender")
        
        # Calculate totals
        item_dict = item.model_dump()
        totals = await calculate_line_item_totals(item_dict)
        
        async with httpx.AsyncClient() as client:
            # Get max sort order
            order_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/tender_line_items?"
                f"tender_id=eq.{tender_id}&select=sort_order&order=sort_order.desc&limit=1",
                headers=await get_service_headers()
            )
            
            max_order = 0
            if order_response.status_code == 200 and order_response.json():
                max_order = order_response.json()[0].get('sort_order', 0)
            
            item_data = {
                "tender_id": tender_id,
                "sort_order": max_order + 1,
                **item_dict,
                **totals
            }
            
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/tender_line_items",
                headers=await get_service_headers(),
                json=item_data
            )
            
            if response.status_code not in [200, 201]:
                raise HTTPException(status_code=500, detail="Failed to create line item")
            
            created = response.json()
            if isinstance(created, list):
                created = created[0]
        
        # Recalculate tender totals
        await recalculate_tender_totals(tender_id)
        
        return {"success": True, "item": created}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating line item: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{tender_id}/items/{item_id}")
async def update_line_item(tender_id: str, item_id: str, updates: LineItemUpdate,
                           authorization: str = Header(...)):
    """Update a line item"""
    user_id, org_id = await verify_token_and_get_org(authorization)
    
    try:
        tender = await verify_tender_access(tender_id, org_id)
        
        if tender.get('status') == 'submitted':
            raise HTTPException(status_code=400, detail="Cannot edit submitted tender")
        
        async with httpx.AsyncClient() as client:
            # Get current item
            item_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/tender_line_items?"
                f"id=eq.{item_id}&tender_id=eq.{tender_id}&select=*",
                headers=await get_service_headers()
            )
            
            if item_response.status_code != 200 or not item_response.json():
                raise HTTPException(status_code=404, detail="Line item not found")
            
            current_item = item_response.json()[0]
            
            # Merge updates
            update_data = updates.model_dump(exclude_none=True)
            merged = {**current_item, **update_data}
            
            # Recalculate line totals
            totals = await calculate_line_item_totals(merged)
            update_data.update(totals)
            update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
            
            response = await client.patch(
                f"{SUPABASE_URL}/rest/v1/tender_line_items?id=eq.{item_id}&tender_id=eq.{tender_id}",
                headers=await get_service_headers(),
                json=update_data
            )
            
            if response.status_code not in [200, 204]:
                raise HTTPException(status_code=500, detail="Failed to update line item")
        
        # Recalculate tender totals
        await recalculate_tender_totals(tender_id)
        
        return {"success": True, "message": "Line item updated"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating line item: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{tender_id}/items/{item_id}")
async def delete_line_item(tender_id: str, item_id: str, authorization: str = Header(...)):
    """Delete a line item"""
    user_id, org_id = await verify_token_and_get_org(authorization)
    
    try:
        tender = await verify_tender_access(tender_id, org_id)
        
        if tender.get('status') == 'submitted':
            raise HTTPException(status_code=400, detail="Cannot edit submitted tender")
        
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{SUPABASE_URL}/rest/v1/tender_line_items?id=eq.{item_id}&tender_id=eq.{tender_id}",
                headers=await get_service_headers()
            )
            
            if response.status_code not in [200, 204]:
                raise HTTPException(status_code=500, detail="Failed to delete line item")
        
        # Recalculate tender totals
        await recalculate_tender_totals(tender_id)
        
        return {"success": True, "message": "Line item deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting line item: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{tender_id}/items/reorder")
async def reorder_items(tender_id: str, request: ReorderRequest, authorization: str = Header(...)):
    """Reorder line items"""
    user_id, org_id = await verify_token_and_get_org(authorization)
    
    try:
        tender = await verify_tender_access(tender_id, org_id)
        
        if tender.get('status') == 'submitted':
            raise HTTPException(status_code=400, detail="Cannot edit submitted tender")
        
        async with httpx.AsyncClient() as client:
            for index, item_id in enumerate(request.item_ids):
                await client.patch(
                    f"{SUPABASE_URL}/rest/v1/tender_line_items?id=eq.{item_id}&tender_id=eq.{tender_id}",
                    headers=await get_service_headers(),
                    json={"sort_order": index}
                )
        
        return {"success": True, "message": "Items reordered"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reordering items: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================
# SUBMISSION & REVISION ENDPOINTS
# =====================================================

@router.post("/{tender_id}/submit")
async def submit_tender(tender_id: str, request: SubmitTenderRequest, authorization: str = Header(...)):
    """Submit a tender - creates immutable version record"""
    user_id, org_id = await verify_token_and_get_org(authorization)
    
    try:
        tender = await verify_tender_access(tender_id, org_id)
        
        if tender.get('status') == 'submitted':
            raise HTTPException(status_code=400, detail="Tender already submitted")
        
        async with httpx.AsyncClient() as client:
            # Get all sections and items for snapshot
            sections_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/tender_sections?tender_id=eq.{tender_id}&select=*",
                headers=await get_service_headers()
            )
            sections = sections_response.json() if sections_response.status_code == 200 else []
            
            items_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/tender_line_items?tender_id=eq.{tender_id}&select=*",
                headers=await get_service_headers()
            )
            items = items_response.json() if items_response.status_code == 200 else []
            
            # Create version record
            version_data = {
                "tender_id": tender_id,
                "version_number": tender.get('version_number', 1),
                "version_label": request.version_label or tender.get('version_label') or f"Version {tender.get('version_number', 1)}",
                "subtotal": tender.get('subtotal'),
                "markup_amount": tender.get('markup_amount'),
                "overhead_amount": tender.get('overhead_amount'),
                "profit_amount": tender.get('profit_amount'),
                "contingency_amount": tender.get('contingency_amount'),
                "discount_amount": tender.get('discount_amount'),
                "tax_amount": tender.get('tax_amount'),
                "total": tender.get('total'),
                "sections_snapshot": sections,
                "line_items_snapshot": items,
                "scope_of_work": tender.get('scope_of_work'),
                "inclusions": tender.get('inclusions'),
                "exclusions": tender.get('exclusions'),
                "assumptions": tender.get('assumptions'),
                "terms_and_conditions": tender.get('terms_and_conditions'),
                "submitted_at": datetime.now(timezone.utc).isoformat(),
                "submitted_by": user_id,
                "submitted_to": request.submitted_to,
                "submission_method": request.submission_method
            }
            
            version_response = await client.post(
                f"{SUPABASE_URL}/rest/v1/tender_versions",
                headers=await get_service_headers(),
                json=version_data
            )
            
            if version_response.status_code not in [200, 201]:
                raise HTTPException(status_code=500, detail="Failed to create version record")
            
            # Update tender status
            await client.patch(
                f"{SUPABASE_URL}/rest/v1/tenders?id=eq.{tender_id}",
                headers=await get_service_headers(),
                json={
                    "status": "submitted",
                    "submitted_at": datetime.now(timezone.utc).isoformat(),
                    "submitted_by": user_id,
                    "submitted_to": request.submitted_to,
                    "submission_method": request.submission_method,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            )
            
            # Update opportunity status
            await client.patch(
                f"{SUPABASE_URL}/rest/v1/opportunities?id=eq.{tender.get('opportunity_id')}",
                headers=await get_service_headers(),
                json={
                    "status": "submitted",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            )
            
            # Log activity
            await log_opportunity_activity(
                org_id=org_id,
                opp_id=tender.get('opportunity_id'),
                event_type="tender_submitted",
                title=f"Tender submitted: ${tender.get('total', 0):,.2f}",
                event_data={"total": tender.get('total'), "version": tender.get('version_number')},
                user_id=user_id,
                tender_id=tender_id
            )
            
            return {
                "success": True,
                "message": "Tender submitted successfully",
                "version_number": tender.get('version_number'),
                "total": tender.get('total')
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting tender: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{tender_id}/revise")
async def create_revision(tender_id: str, authorization: str = Header(...)):
    """Create a new revision of a submitted tender"""
    user_id, org_id = await verify_token_and_get_org(authorization)
    
    try:
        tender = await verify_tender_access(tender_id, org_id)
        
        async with httpx.AsyncClient() as client:
            # Mark current as not current
            await client.patch(
                f"{SUPABASE_URL}/rest/v1/tenders?id=eq.{tender_id}",
                headers=await get_service_headers(),
                json={"is_current": False}
            )
            
            # Get sections and items to copy
            sections_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/tender_sections?tender_id=eq.{tender_id}&select=*",
                headers=await get_service_headers()
            )
            sections = sections_response.json() if sections_response.status_code == 200 else []
            
            items_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/tender_line_items?tender_id=eq.{tender_id}&select=*",
                headers=await get_service_headers()
            )
            items = items_response.json() if items_response.status_code == 200 else []
            
            # Create new tender (copy of current)
            new_version = tender.get('version_number', 1) + 1
            
            from datetime import date, timedelta
            valid_until = (date.today() + timedelta(days=tender.get('valid_days', 30))).isoformat()
            
            # Fields to copy
            copy_fields = [
                'scope_of_work', 'inclusions', 'exclusions', 'assumptions', 'clarifications',
                'alternates', 'terms_and_conditions', 'payment_terms', 'warranty_terms',
                'notes_to_client', 'internal_notes', 'valid_days',
                'markup_type', 'markup_percent', 'overhead_type', 'overhead_percent',
                'profit_type', 'profit_percent', 'contingency_type', 'contingency_percent',
                'discount_type', 'discount_percent', 'tax_rate', 'tax_included'
            ]
            
            new_tender_data = {
                "organization_id": org_id,
                "opportunity_id": tender.get('opportunity_id'),
                "version_number": new_version,
                "version_label": f"Version {new_version}",
                "is_current": True,
                "parent_version_id": tender_id,
                "status": "draft",
                "subtotal": tender.get('subtotal', 0),
                "markup_amount": tender.get('markup_amount', 0),
                "overhead_amount": tender.get('overhead_amount', 0),
                "profit_amount": tender.get('profit_amount', 0),
                "contingency_amount": tender.get('contingency_amount', 0),
                "discount_amount": tender.get('discount_amount', 0),
                "tax_amount": tender.get('tax_amount', 0),
                "total": tender.get('total', 0),
                "valid_until": valid_until,
                "created_by": user_id
            }
            
            for field in copy_fields:
                if tender.get(field) is not None:
                    new_tender_data[field] = tender.get(field)
            
            new_tender_response = await client.post(
                f"{SUPABASE_URL}/rest/v1/tenders",
                headers=await get_service_headers(),
                json=new_tender_data
            )
            
            if new_tender_response.status_code not in [200, 201]:
                raise HTTPException(status_code=500, detail="Failed to create revision")
            
            new_tender = new_tender_response.json()
            if isinstance(new_tender, list):
                new_tender = new_tender[0]
            
            new_tender_id = new_tender['id']
            section_id_map = {}
            
            # Copy sections
            for section in sections:
                new_section_data = {k: v for k, v in section.items() 
                                   if k not in ['id', 'created_at', 'updated_at']}
                new_section_data['tender_id'] = new_tender_id
                
                section_response = await client.post(
                    f"{SUPABASE_URL}/rest/v1/tender_sections",
                    headers=await get_service_headers(),
                    json=new_section_data
                )
                
                if section_response.status_code in [200, 201]:
                    new_section = section_response.json()
                    if isinstance(new_section, list):
                        new_section = new_section[0]
                    section_id_map[section['id']] = new_section['id']
            
            # Copy items
            for item in items:
                new_item_data = {k: v for k, v in item.items() 
                               if k not in ['id', 'created_at', 'updated_at']}
                new_item_data['tender_id'] = new_tender_id
                
                if item.get('section_id') and item['section_id'] in section_id_map:
                    new_item_data['section_id'] = section_id_map[item['section_id']]
                else:
                    new_item_data['section_id'] = None
                
                await client.post(
                    f"{SUPABASE_URL}/rest/v1/tender_line_items",
                    headers=await get_service_headers(),
                    json=new_item_data
                )
            
            # Update opportunity status back to tendering
            await client.patch(
                f"{SUPABASE_URL}/rest/v1/opportunities?id=eq.{tender.get('opportunity_id')}",
                headers=await get_service_headers(),
                json={"status": "tendering", "updated_at": datetime.now(timezone.utc).isoformat()}
            )
            
            # Log activity
            await log_opportunity_activity(
                org_id=org_id,
                opp_id=tender.get('opportunity_id'),
                event_type="tender_created",
                title=f"Tender v{new_version} created (revision)",
                event_data={"parent_version": tender.get('version_number')},
                user_id=user_id,
                tender_id=new_tender_id
            )
            
            return {
                "success": True,
                "message": f"Revision v{new_version} created",
                "tender": new_tender
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating revision: {e}")
        raise HTTPException(status_code=500, detail=str(e))
