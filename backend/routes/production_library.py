"""
Production Library Routes - TradeOS Company Knowledge Engine
=============================================================

The Production Library is the operational knowledge engine of TradeOS.
Knowledge belongs to the company. Not the estimate.

Four-Level Hierarchy:
- Level 1: Knowledge Domain (Finish Carpentry, Doors & Hardware, etc.)
- Level 2: Service Category (Residential, Commercial, etc.)
- Level 3: Production Item (the knowledge records)
- Level 4: Measurement Unit (EA, LF, SF, LS, DAY, HR, SET, KIT, PAIR, COST)

Every completed project makes the next project smarter.
"""

from fastapi import APIRouter, HTTPException, Header, Query, UploadFile, File
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import logging
import httpx
import jwt
import csv
import io

# Use centralized config for lazy environment variable access
from config import config

router = APIRouter(prefix="/api/production-library", tags=["production-library"])
logger = logging.getLogger(__name__)

# =====================================================
# PYDANTIC MODELS
# =====================================================

class MeasurementUnit(BaseModel):
    id: str
    code: str
    name: str
    description: Optional[str] = None

class KnowledgeDomainCreate(BaseModel):
    code: Optional[str] = None
    name: str
    description: Optional[str] = None
    sort_order: Optional[int] = 0
    icon: Optional[str] = None
    color: Optional[str] = None

class KnowledgeDomain(KnowledgeDomainCreate):
    id: str
    is_active: bool = True

class ServiceCategoryCreate(BaseModel):
    code: Optional[str] = None
    name: str
    description: Optional[str] = None
    sort_order: Optional[int] = 0
    icon: Optional[str] = None
    color: Optional[str] = None

class ServiceCategory(ServiceCategoryCreate):
    id: str
    is_active: bool = True

class ProductionItemCreate(BaseModel):
    production_code: str
    production_name: str
    description: Optional[str] = None
    knowledge_domain_id: str
    measurement_unit_id: str
    # Production metrics
    production_per_day: Optional[float] = None
    production_output: Optional[float] = None  # Units per hour
    crew_size: Optional[float] = 1
    labour_hours: Optional[float] = None
    # Labour rates (Low/Standard/Premium)
    low_labour_rate: Optional[float] = None
    standard_rate: Optional[float] = None  # Standard labour rate
    premium_labour_rate: Optional[float] = None
    premium_rate: Optional[float] = None  # Legacy, same as premium_labour_rate
    complex_rate: Optional[float] = None
    # Material & Equipment rates
    material_rate: Optional[float] = None
    equipment_rate: Optional[float] = None
    # Organization & Classification
    division_id: Optional[str] = None
    trade_discipline: Optional[str] = None
    cost_code: Optional[str] = None
    tags: Optional[List[str]] = None
    # Status
    is_company_standard: Optional[bool] = False
    notes: Optional[str] = None
    service_category_ids: Optional[List[str]] = []

class ProductionItemUpdate(BaseModel):
    production_name: Optional[str] = None
    description: Optional[str] = None
    knowledge_domain_id: Optional[str] = None
    measurement_unit_id: Optional[str] = None
    # Production metrics
    production_per_day: Optional[float] = None
    production_output: Optional[float] = None
    crew_size: Optional[float] = None
    labour_hours: Optional[float] = None
    # Labour rates
    low_labour_rate: Optional[float] = None
    standard_rate: Optional[float] = None
    premium_labour_rate: Optional[float] = None
    premium_rate: Optional[float] = None
    complex_rate: Optional[float] = None
    # Material & Equipment rates
    material_rate: Optional[float] = None
    equipment_rate: Optional[float] = None
    # Organization & Classification
    division_id: Optional[str] = None
    trade_discipline: Optional[str] = None
    cost_code: Optional[str] = None
    tags: Optional[List[str]] = None
    # Status
    is_company_standard: Optional[bool] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None
    service_category_ids: Optional[List[str]] = None

class ProductionAssemblyCreate(BaseModel):
    assembly_code: Optional[str] = None
    assembly_name: str
    description: Optional[str] = None
    knowledge_domain_id: Optional[str] = None
    is_company_standard: Optional[bool] = False
    notes: Optional[str] = None

class AssemblyItemCreate(BaseModel):
    production_item_id: str
    quantity: float = 1
    rate_override: Optional[float] = None
    sort_order: Optional[int] = 0
    group_name: Optional[str] = None
    notes: Optional[str] = None

# =====================================================
# UTILITY FUNCTIONS
# =====================================================

async def get_service_headers():
    return {
        "apikey": config.SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {config.SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

async def verify_token_and_get_org(authorization: str) -> dict:
    """Verify JWT and get organization context"""
    try:
        token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
        decoded = jwt.decode(token, options={"verify_signature": False})
        user_id = decoded.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Get user's organization
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/organization_members?"
                f"user_id=eq.{user_id}&"
                f"is_active=eq.true&"
                f"select=organization_id,role,organizations(id,name)",
                headers=await get_service_headers()
            )
            
            if response.status_code == 200:
                members = response.json()
                if members:
                    membership = next((m for m in members if m.get('is_primary')), members[0])
                    org = membership.get('organizations', {})
                    return {
                        "user_id": user_id,
                        "organization_id": org.get('id'),
                        "organization_name": org.get('name'),
                        "role": membership.get('role')
                    }
            
            raise HTTPException(status_code=403, detail="No organization access")
            
    except jwt.DecodeError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

# =====================================================
# MEASUREMENT UNITS
# =====================================================

@router.get("/units")
async def get_measurement_units(authorization: str = Header(...)):
    """Get all measurement units (controlled lookup)"""
    await verify_token_and_get_org(authorization)
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/measurement_units?"
                f"is_active=eq.true&"
                f"order=sort_order.asc",
                headers=await get_service_headers()
            )
            
            if response.status_code == 200:
                units = response.json()
                return {"success": True, "units": units}
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch units")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching units: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================
# KNOWLEDGE DOMAINS (Level 1)
# =====================================================

@router.get("/domains")
async def get_knowledge_domains(
    authorization: str = Header(...),
    include_inactive: bool = Query(False)
):
    """Get all knowledge domains for the organization"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            query = f"organization_id=eq.{org_id}"
            if not include_inactive:
                query += "&is_active=eq.true"
            
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/knowledge_domains?"
                f"{query}&order=sort_order.asc,name.asc",
                headers=await get_service_headers()
            )
            
            if response.status_code == 200:
                domains = response.json()
                return {"success": True, "domains": domains, "count": len(domains)}
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch domains")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching domains: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/domains")
async def create_knowledge_domain(
    domain: KnowledgeDomainCreate,
    authorization: str = Header(...)
):
    """Create a new knowledge domain"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    user_id = context['user_id']
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{config.SUPABASE_URL}/rest/v1/knowledge_domains",
                headers=await get_service_headers(),
                json={
                    "organization_id": org_id,
                    "created_by": user_id,
                    **domain.model_dump(exclude_none=True)
                }
            )
            
            if response.status_code == 201:
                created = response.json()
                return {"success": True, "domain": created[0] if created else None}
            elif response.status_code == 409:
                raise HTTPException(status_code=409, detail="Domain with this name already exists")
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to create domain")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating domain: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/domains/{domain_id}")
async def delete_knowledge_domain(
    domain_id: str,
    authorization: str = Header(...)
):
    """Delete (archive) a knowledge domain - only if no items are using it"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Check if any production items use this domain
            check_response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/production_items?"
                f"knowledge_domain_id=eq.{domain_id}&is_active=eq.true&limit=1",
                headers=await get_service_headers()
            )
            
            if check_response.status_code == 200:
                items_using = check_response.json()
                if items_using:
                    raise HTTPException(
                        status_code=400, 
                        detail="Cannot delete domain - production items are using it"
                    )
            
            # Soft delete by setting is_active to false
            response = await client.patch(
                f"{config.SUPABASE_URL}/rest/v1/knowledge_domains?"
                f"id=eq.{domain_id}&organization_id=eq.{org_id}",
                headers=await get_service_headers(),
                json={"is_active": False}
            )
            
            if response.status_code in [200, 204]:
                return {"success": True, "message": "Domain archived"}
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to delete domain")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting domain: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/domains/{domain_id}/permanent")
async def permanently_delete_domain(
    domain_id: str,
    authorization: str = Header(...)
):
    """Permanently delete a knowledge domain and all its contents"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # First, get all categories in this domain
            cat_response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/service_categories?"
                f"knowledge_domain_id=eq.{domain_id}&organization_id=eq.{org_id}",
                headers=await get_service_headers()
            )
            
            if cat_response.status_code == 200:
                categories = cat_response.json()
                
                # Delete all items in those categories
                for cat in categories:
                    await client.delete(
                        f"{config.SUPABASE_URL}/rest/v1/production_items?"
                        f"service_category_id=eq.{cat['id']}&organization_id=eq.{org_id}",
                        headers=await get_service_headers()
                    )
                
                # Delete all categories
                await client.delete(
                    f"{config.SUPABASE_URL}/rest/v1/service_categories?"
                    f"knowledge_domain_id=eq.{domain_id}&organization_id=eq.{org_id}",
                    headers=await get_service_headers()
                )
            
            # Delete all items directly in this domain (no category)
            await client.delete(
                f"{config.SUPABASE_URL}/rest/v1/production_items?"
                f"knowledge_domain_id=eq.{domain_id}&organization_id=eq.{org_id}",
                headers=await get_service_headers()
            )
            
            # Finally, delete the domain itself
            response = await client.delete(
                f"{config.SUPABASE_URL}/rest/v1/knowledge_domains?"
                f"id=eq.{domain_id}&organization_id=eq.{org_id}",
                headers=await get_service_headers()
            )
            
            if response.status_code in [200, 204]:
                return {"success": True, "message": "Domain permanently deleted"}
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to delete domain")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error permanently deleting domain: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================
# SERVICE CATEGORIES (Level 2)
# =====================================================

@router.get("/service-categories")
async def get_service_categories(
    authorization: str = Header(...),
    include_inactive: bool = Query(False)
):
    """Get all service categories for the organization"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            query = f"organization_id=eq.{org_id}"
            if not include_inactive:
                query += "&is_active=eq.true"
            
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/service_categories?"
                f"{query}&order=sort_order.asc,name.asc",
                headers=await get_service_headers()
            )
            
            if response.status_code == 200:
                categories = response.json()
                return {"success": True, "categories": categories, "count": len(categories)}
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch categories")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching service categories: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/service-categories")
async def create_service_category(
    category: ServiceCategoryCreate,
    authorization: str = Header(...)
):
    """Create a new service category"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    user_id = context['user_id']
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{config.SUPABASE_URL}/rest/v1/service_categories",
                headers=await get_service_headers(),
                json={
                    "organization_id": org_id,
                    "created_by": user_id,
                    **category.model_dump(exclude_none=True)
                }
            )
            
            if response.status_code == 201:
                created = response.json()
                return {"success": True, "category": created[0] if created else None}
            elif response.status_code == 409:
                raise HTTPException(status_code=409, detail="Category with this name already exists")
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to create category")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating service category: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/service-categories/{category_id}")
async def delete_service_category(
    category_id: str,
    authorization: str = Header(...)
):
    """Delete (archive) a service category - only if no items are using it"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Soft delete by setting is_active to false
            response = await client.patch(
                f"{config.SUPABASE_URL}/rest/v1/service_categories?"
                f"id=eq.{category_id}&organization_id=eq.{org_id}",
                headers=await get_service_headers(),
                json={"is_active": False}
            )
            
            if response.status_code in [200, 204]:
                return {"success": True, "message": "Category archived"}
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to delete category")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting service category: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/service-categories/{category_id}/permanent")
async def permanently_delete_category(
    category_id: str,
    authorization: str = Header(...)
):
    """Permanently delete a service category and all its items"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            # Delete all items in this category
            await client.delete(
                f"{config.SUPABASE_URL}/rest/v1/production_items?"
                f"service_category_id=eq.{category_id}&organization_id=eq.{org_id}",
                headers=await get_service_headers()
            )
            
            # Delete the category itself
            response = await client.delete(
                f"{config.SUPABASE_URL}/rest/v1/service_categories?"
                f"id=eq.{category_id}&organization_id=eq.{org_id}",
                headers=await get_service_headers()
            )
            
            if response.status_code in [200, 204]:
                return {"success": True, "message": "Category permanently deleted"}
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to delete category")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error permanently deleting category: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================
# PRODUCTION ITEMS (Level 3)
# =====================================================

@router.get("/items")
async def get_production_items(
    authorization: str = Header(...),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=1000),
    limit: Optional[int] = Query(None, ge=1, le=1000),
    domain_id: Optional[str] = Query(None),
    service_category_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    include_inactive: bool = Query(False)
):
    """Get production items with pagination and filtering"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    
    # Support both 'limit' and 'per_page' for compatibility
    actual_per_page = limit if limit else per_page
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            headers = await get_service_headers()
            
            # Build query
            query = f"organization_id=eq.{org_id}"
            if not include_inactive:
                query += "&is_active=eq.true"
            if domain_id:
                query += f"&knowledge_domain_id=eq.{domain_id}"
            if search:
                query += f"&or=(production_code.ilike.*{search}*,production_name.ilike.*{search}*)"
            
            # Get count first
            count_response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/production_items?{query}&select=id",
                headers={**headers, "Prefer": "count=exact"}
            )
            total = int(count_response.headers.get('content-range', '0-0/0').split('/')[-1])
            
            # Get paginated items with relationships
            offset = (page - 1) * actual_per_page
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/production_items?"
                f"{query}&"
                f"select=*,knowledge_domains(id,name,code),measurement_units(id,code,name)&"
                f"order=production_code.asc&"
                f"offset={offset}&limit={actual_per_page}",
                headers=headers
            )
            
            if response.status_code == 200:
                items = response.json()
                
                # If service_category_id filter, get matching items
                if service_category_id:
                    # Get item IDs for this service category
                    sc_response = await client.get(
                        f"{config.SUPABASE_URL}/rest/v1/production_item_service_categories?"
                        f"service_category_id=eq.{service_category_id}&select=production_item_id",
                        headers=headers
                    )
                    if sc_response.status_code == 200:
                        valid_ids = {r['production_item_id'] for r in sc_response.json()}
                        items = [i for i in items if i['id'] in valid_ids]
                
                return {
                    "success": True,
                    "items": items,
                    "meta": {
                        "total": total,
                        "page": page,
                        "per_page": actual_per_page,
                        "total_pages": (total + actual_per_page - 1) // actual_per_page
                    }
                }
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch items")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching production items: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/items/{item_id}")
async def get_production_item(
    item_id: str,
    authorization: str = Header(...)
):
    """Get a single production item with full details"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = await get_service_headers()
            
            # Get item with relationships
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/production_items?"
                f"id=eq.{item_id}&"
                f"organization_id=eq.{org_id}&"
                f"select=*,knowledge_domains(id,name,code),measurement_units(id,code,name)",
                headers=headers
            )
            
            if response.status_code == 200:
                items = response.json()
                if not items:
                    raise HTTPException(status_code=404, detail="Production item not found")
                
                item = items[0]
                
                # Get service categories
                sc_response = await client.get(
                    f"{config.SUPABASE_URL}/rest/v1/production_item_service_categories?"
                    f"production_item_id=eq.{item_id}&"
                    f"select=*,service_categories(id,name,code)",
                    headers=headers
                )
                if sc_response.status_code == 200:
                    item['service_categories'] = [
                        {**r['service_categories'], 'rate_adjustment_pct': r.get('rate_adjustment_pct')}
                        for r in sc_response.json()
                    ]
                
                # Get attachments
                att_response = await client.get(
                    f"{config.SUPABASE_URL}/rest/v1/production_item_attachments?"
                    f"production_item_id=eq.{item_id}&order=sort_order.asc",
                    headers=headers
                )
                if att_response.status_code == 200:
                    item['attachments'] = att_response.json()
                
                return {"success": True, "item": item}
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch item")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching production item: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/items")
async def create_production_item(
    item: ProductionItemCreate,
    authorization: str = Header(...)
):
    """Create a new production item"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    user_id = context['user_id']
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            headers = await get_service_headers()
            
            # Create the production item
            item_data = item.model_dump(exclude={'service_category_ids'})
            response = await client.post(
                f"{config.SUPABASE_URL}/rest/v1/production_items",
                headers=headers,
                json={
                    "organization_id": org_id,
                    "created_by": user_id,
                    **item_data
                }
            )
            
            if response.status_code == 201:
                created = response.json()[0]
                
                # Create service category links
                if item.service_category_ids:
                    for sc_id in item.service_category_ids:
                        await client.post(
                            f"{config.SUPABASE_URL}/rest/v1/production_item_service_categories",
                            headers=headers,
                            json={
                                "production_item_id": created['id'],
                                "service_category_id": sc_id
                            }
                        )
                
                # Create initial revision
                await client.post(
                    f"{config.SUPABASE_URL}/rest/v1/production_item_revisions",
                    headers=headers,
                    json={
                        "production_item_id": created['id'],
                        "version": 1,
                        "snapshot": created,
                        "change_type": "created",
                        "created_by": user_id
                    }
                )
                
                return {"success": True, "item": created}
            elif response.status_code == 409:
                raise HTTPException(status_code=409, detail="Production code already exists")
            else:
                logger.error(f"Create failed: {response.status_code} - {response.text}")
                raise HTTPException(status_code=response.status_code, detail="Failed to create item")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating production item: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/items/{item_id}")
async def update_production_item(
    item_id: str,
    item: ProductionItemUpdate,
    authorization: str = Header(...)
):
    """Update a production item (creates new revision)"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    user_id = context['user_id']
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            headers = await get_service_headers()
            
            # Update the item
            update_data = {k: v for k, v in item.model_dump(exclude={'service_category_ids'}).items() if v is not None}
            update_data['updated_by'] = user_id
            update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
            
            response = await client.patch(
                f"{config.SUPABASE_URL}/rest/v1/production_items?"
                f"id=eq.{item_id}&organization_id=eq.{org_id}",
                headers=headers,
                json=update_data
            )
            
            if response.status_code == 200:
                updated = response.json()
                if not updated:
                    raise HTTPException(status_code=404, detail="Production item not found")
                
                # Update service categories if provided
                if item.service_category_ids is not None:
                    # Delete existing
                    await client.delete(
                        f"{config.SUPABASE_URL}/rest/v1/production_item_service_categories?"
                        f"production_item_id=eq.{item_id}",
                        headers=headers
                    )
                    # Create new
                    for sc_id in item.service_category_ids:
                        await client.post(
                            f"{config.SUPABASE_URL}/rest/v1/production_item_service_categories",
                            headers=headers,
                            json={
                                "production_item_id": item_id,
                                "service_category_id": sc_id
                            }
                        )
                
                return {"success": True, "item": updated[0]}
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to update item")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating production item: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/items/{item_id}/revisions")
async def get_production_item_revisions(
    item_id: str,
    authorization: str = Header(...)
):
    """Get revision history for a production item"""
    context = await verify_token_and_get_org(authorization)
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/production_item_revisions?"
                f"production_item_id=eq.{item_id}&order=version.desc",
                headers=await get_service_headers()
            )
            
            if response.status_code == 200:
                revisions = response.json()
                return {"success": True, "revisions": revisions}
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch revisions")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching revisions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/items/{item_id}")
async def delete_production_item(
    item_id: str,
    authorization: str = Header(...)
):
    """Archive (soft delete) a production item"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    user_id = context['user_id']
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Soft delete by setting is_active to false
            response = await client.patch(
                f"{config.SUPABASE_URL}/rest/v1/production_items?"
                f"id=eq.{item_id}&organization_id=eq.{org_id}",
                headers=await get_service_headers(),
                json={
                    "is_active": False,
                    "archived_at": datetime.now(timezone.utc).isoformat(),
                    "archived_by": user_id
                }
            )
            
            if response.status_code == 200:
                return {"success": True, "message": "Item archived"}
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to archive item")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error archiving production item: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/items/{item_id}/restore")
async def restore_production_item(
    item_id: str,
    authorization: str = Header(...)
):
    """Restore an archived production item"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    user_id = context['user_id']
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = await get_service_headers()
            
            # Restore by setting is_active to true
            response = await client.patch(
                f"{config.SUPABASE_URL}/rest/v1/production_items?"
                f"id=eq.{item_id}&organization_id=eq.{org_id}",
                headers=headers,
                json={
                    "is_active": True,
                    "archived_at": None,
                    "archived_by": None,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                    "updated_by": user_id
                }
            )
            
            if response.status_code == 200:
                return {"success": True, "message": "Item restored"}
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to restore item")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error restoring production item: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/items/{item_id}/duplicate")
async def duplicate_production_item(
    item_id: str,
    authorization: str = Header(...)
):
    """Duplicate a production item with a new code"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    user_id = context['user_id']
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            headers = await get_service_headers()
            
            # Get the original item
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/production_items?"
                f"id=eq.{item_id}&organization_id=eq.{org_id}",
                headers=headers
            )
            
            if response.status_code != 200 or not response.json():
                raise HTTPException(status_code=404, detail="Item not found")
            
            original = response.json()[0]
            
            # Generate new code
            base_code = original['production_code']
            suffix = 1
            new_code = f"{base_code}-COPY"
            
            # Check for existing codes
            while True:
                check_resp = await client.get(
                    f"{config.SUPABASE_URL}/rest/v1/production_items?"
                    f"organization_id=eq.{org_id}&production_code=eq.{new_code}",
                    headers=headers
                )
                if check_resp.status_code == 200 and not check_resp.json():
                    break
                suffix += 1
                new_code = f"{base_code}-COPY{suffix}"
                if suffix > 99:
                    new_code = f"{base_code}-{datetime.now().strftime('%H%M%S')}"
                    break
            
            # Create the duplicate
            new_item = {
                "organization_id": org_id,
                "production_code": new_code,
                "production_name": f"{original['production_name']} (Copy)",
                "knowledge_domain_id": original.get('knowledge_domain_id'),
                "measurement_unit_id": original.get('measurement_unit_id'),
                "description": original.get('description'),
                "notes": original.get('notes'),
                "production_per_day": original.get('production_per_day'),
                "crew_size": original.get('crew_size'),
                "labour_hours": original.get('labour_hours'),
                "production_output": original.get('production_output'),
                "standard_rate": original.get('standard_rate'),
                "premium_rate": original.get('premium_rate'),
                "complex_rate": original.get('complex_rate'),
                "is_company_standard": False,  # Start as non-standard
                "created_by": user_id
            }
            
            create_resp = await client.post(
                f"{config.SUPABASE_URL}/rest/v1/production_items",
                headers=headers,
                json=new_item
            )
            
            if create_resp.status_code == 201:
                created = create_resp.json()[0]
                
                # Copy service category links
                sc_resp = await client.get(
                    f"{config.SUPABASE_URL}/rest/v1/production_item_service_categories?"
                    f"production_item_id=eq.{item_id}",
                    headers=headers
                )
                if sc_resp.status_code == 200:
                    for link in sc_resp.json():
                        await client.post(
                            f"{config.SUPABASE_URL}/rest/v1/production_item_service_categories",
                            headers=headers,
                            json={
                                "production_item_id": created['id'],
                                "service_category_id": link['service_category_id']
                            }
                        )
                
                return {
                    "success": True,
                    "message": f"Item duplicated as {new_code}",
                    "item": created
                }
            else:
                raise HTTPException(status_code=create_resp.status_code, detail="Failed to create duplicate")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error duplicating production item: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/items/{item_id}/permanent")
async def permanently_delete_production_item(
    item_id: str,
    authorization: str = Header(...)
):
    """
    Permanently delete a production item.
    Only allowed if the item has never been referenced in:
    - Estimates
    - Projects
    - Assemblies
    """
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            headers = await get_service_headers()
            
            # Check if item exists and belongs to this org
            item_resp = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/production_items?"
                f"id=eq.{item_id}&organization_id=eq.{org_id}",
                headers=headers
            )
            
            if item_resp.status_code != 200 or not item_resp.json():
                raise HTTPException(status_code=404, detail="Item not found")
            
            # Check if item is used in any assemblies
            assembly_check = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/assembly_items?"
                f"production_item_id=eq.{item_id}&select=id",
                headers=headers
            )
            if assembly_check.status_code == 200 and assembly_check.json():
                raise HTTPException(
                    status_code=400,
                    detail="Cannot permanently delete - item is used in assemblies. Archive it instead."
                )
            
            # Check if item is used in any estimates (estimate_line_items)
            estimate_check = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/estimate_line_items?"
                f"production_item_id=eq.{item_id}&select=id",
                headers=headers
            )
            if estimate_check.status_code == 200 and estimate_check.json():
                raise HTTPException(
                    status_code=400,
                    detail="Cannot permanently delete - item is used in estimates. Archive it instead."
                )
            
            # Delete service category links first
            await client.delete(
                f"{config.SUPABASE_URL}/rest/v1/production_item_service_categories?"
                f"production_item_id=eq.{item_id}",
                headers=headers
            )
            
            # Delete revisions
            await client.delete(
                f"{config.SUPABASE_URL}/rest/v1/production_item_revisions?"
                f"production_item_id=eq.{item_id}",
                headers=headers
            )
            
            # Permanently delete the item
            delete_resp = await client.delete(
                f"{config.SUPABASE_URL}/rest/v1/production_items?"
                f"id=eq.{item_id}&organization_id=eq.{org_id}",
                headers=headers
            )
            
            if delete_resp.status_code in [200, 204]:
                return {"success": True, "message": "Item permanently deleted"}
            else:
                raise HTTPException(status_code=delete_resp.status_code, detail="Failed to delete item")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error permanently deleting production item: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================
# PRODUCTION ASSEMBLIES
# =====================================================

@router.get("/assemblies")
async def get_assemblies(
    authorization: str = Header(...),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    domain_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    include_inactive: bool = Query(False)
):
    """Get production assemblies"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            headers = await get_service_headers()
            
            query = f"organization_id=eq.{org_id}"
            if not include_inactive:
                query += "&is_active=eq.true"
            if domain_id:
                query += f"&knowledge_domain_id=eq.{domain_id}"
            if search:
                query += f"&or=(assembly_code.ilike.*{search}*,assembly_name.ilike.*{search}*)"
            
            offset = (page - 1) * per_page
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/production_assemblies?"
                f"{query}&"
                f"select=*,knowledge_domains(id,name,code)&"
                f"order=assembly_name.asc&"
                f"offset={offset}&limit={per_page}",
                headers=headers
            )
            
            if response.status_code == 200:
                assemblies = response.json()
                return {"success": True, "assemblies": assemblies}
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch assemblies")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching assemblies: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/assemblies/{assembly_id}")
async def get_assembly(
    assembly_id: str,
    authorization: str = Header(...)
):
    """Get an assembly with its items"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = await get_service_headers()
            
            # Get assembly
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/production_assemblies?"
                f"id=eq.{assembly_id}&organization_id=eq.{org_id}&"
                f"select=*,knowledge_domains(id,name,code)",
                headers=headers
            )
            
            if response.status_code == 200:
                assemblies = response.json()
                if not assemblies:
                    raise HTTPException(status_code=404, detail="Assembly not found")
                
                assembly = assemblies[0]
                
                # Get assembly items
                items_response = await client.get(
                    f"{config.SUPABASE_URL}/rest/v1/assembly_items?"
                    f"assembly_id=eq.{assembly_id}&"
                    f"select=*,production_items(id,production_code,production_name,standard_rate,premium_rate,complex_rate,labour_hours,measurement_units(code,name))&"
                    f"order=sort_order.asc",
                    headers=headers
                )
                
                if items_response.status_code == 200:
                    assembly['items'] = items_response.json()
                
                return {"success": True, "assembly": assembly}
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch assembly")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching assembly: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/assemblies")
async def create_assembly(
    assembly: ProductionAssemblyCreate,
    authorization: str = Header(...)
):
    """Create a new production assembly"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    user_id = context['user_id']
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{config.SUPABASE_URL}/rest/v1/production_assemblies",
                headers=await get_service_headers(),
                json={
                    "organization_id": org_id,
                    "created_by": user_id,
                    **assembly.model_dump(exclude_none=True)
                }
            )
            
            if response.status_code == 201:
                created = response.json()[0]
                return {"success": True, "assembly": created}
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to create assembly")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating assembly: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/assemblies/{assembly_id}/items")
async def add_assembly_item(
    assembly_id: str,
    item: AssemblyItemCreate,
    authorization: str = Header(...)
):
    """Add a production item to an assembly"""
    context = await verify_token_and_get_org(authorization)
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{config.SUPABASE_URL}/rest/v1/assembly_items",
                headers=await get_service_headers(),
                json={
                    "assembly_id": assembly_id,
                    **item.model_dump(exclude_none=True)
                }
            )
            
            if response.status_code == 201:
                created = response.json()[0]
                return {"success": True, "item": created}
            elif response.status_code == 409:
                raise HTTPException(status_code=409, detail="Item already exists in assembly")
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to add item")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding assembly item: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/assemblies/{assembly_id}/items/{item_id}")
async def remove_assembly_item(
    assembly_id: str,
    item_id: str,
    authorization: str = Header(...)
):
    """Remove a production item from an assembly"""
    context = await verify_token_and_get_org(authorization)
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.delete(
                f"{config.SUPABASE_URL}/rest/v1/assembly_items?"
                f"id=eq.{item_id}&assembly_id=eq.{assembly_id}",
                headers=await get_service_headers()
            )
            
            if response.status_code == 204 or response.status_code == 200:
                return {"success": True}
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to remove item")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing assembly item: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================
# IMPORT / EXPORT - v2.0 Import System
# =====================================================

# Import the v2.0 import engine
import sys
sys.path.insert(0, '/app/backend')
from services.import_engine import (
    MeasurementUnitAliasMapper,
    LookupResolver,
    ProductionLibraryValidator,
    ValidationResult,
    ValidationIssue,
    ValidationSeverity,
    UnitMapping,
    LookupCreation,
    ImportRow,
    ImportResult,
    DuplicateStrategy
)
import time

@router.get("/import/template/download")
async def download_import_template(authorization: str = Header(...)):
    """
    Download the official TradeOS CSV Template for Production Items import.
    
    This is the standardized import format for TradeOS Version 2.0.
    All imports must follow this exact structure.
    """
    await verify_token_and_get_org(authorization)
    
    # Get unit mapper for alias info
    unit_mapper = MeasurementUnitAliasMapper()
    
    # Official TradeOS CSV Template Columns
    template_columns = [
        "Production Code",
        "Production Name", 
        "Knowledge Domain",
        "Service Categories",
        "Measurement Unit",
        "Production Per Day",
        "Crew Size",
        "Labour Hours",
        "Standard Rate",
        "Premium Rate",
        "Complex Rate",
        "Company Standard",
        "Notes",
        "Description"
    ]
    
    # Example rows demonstrating proper format
    example_rows = [
        {
            "Production Code": "FC-001",
            "Production Name": "Door Casing Installation",
            "Knowledge Domain": "Finish Carpentry",
            "Service Categories": "Residential,Commercial",
            "Measurement Unit": "LF",
            "Production Per Day": "120",
            "Crew Size": "1",
            "Labour Hours": "0.0667",
            "Standard Rate": "8.50",
            "Premium Rate": "10.50",
            "Complex Rate": "12.50",
            "Company Standard": "true",
            "Notes": "Standard 3-1/4\" colonial casing",
            "Description": "Installation of door casing trim"
        },
        {
            "Production Code": "FC-002",
            "Production Name": "Base Trim Installation",
            "Knowledge Domain": "Finish Carpentry",
            "Service Categories": "Residential,Multifamily",
            "Measurement Unit": "LF",
            "Production Per Day": "150",
            "Crew Size": "1",
            "Labour Hours": "0.0533",
            "Standard Rate": "6.50",
            "Premium Rate": "8.00",
            "Complex Rate": "10.00",
            "Company Standard": "true",
            "Notes": "5-1/4\" MDF baseboard",
            "Description": "Installation of baseboard trim"
        },
        {
            "Production Code": "DH-001",
            "Production Name": "Interior Door Installation - Single",
            "Knowledge Domain": "Doors & Hardware",
            "Service Categories": "Residential,Commercial,Tenant Improvement",
            "Measurement Unit": "EA",
            "Production Per Day": "8",
            "Crew Size": "1",
            "Labour Hours": "1.0",
            "Standard Rate": "175.00",
            "Premium Rate": "225.00",
            "Complex Rate": "295.00",
            "Company Standard": "true",
            "Notes": "Pre-hung hollow core door",
            "Description": "Complete installation of single interior door"
        }
    ]
    
    # Build unit alias documentation
    unit_aliases = {}
    for standard_unit, aliases in unit_mapper.ALIAS_TABLE.items():
        if len(aliases) > 1:
            unit_aliases[standard_unit] = [a for a in aliases if a != standard_unit][:5]
    
    return {
        "success": True,
        "template": {
            "name": "TradeOS Production Items Import Template v2.0",
            "version": "2.0",
            "columns": template_columns,
            "column_descriptions": {
                "Production Code": "Unique identifier for this production item (required, max 50 chars)",
                "Production Name": "Human-readable name (required, max 255 chars)",
                "Knowledge Domain": "Primary classification - will be auto-created if it doesn't exist (required)",
                "Service Categories": "Comma-separated list - will be auto-created if they don't exist (optional)",
                "Measurement Unit": "Unit of measure with intelligent alias mapping (required). Supports aliases like SQ→SF, SQFT→SF",
                "Production Per Day": "Units a single worker can produce per 8-hour day (optional)",
                "Crew Size": "Typical crew size for this work (default: 1)",
                "Labour Hours": "Hours required to complete one unit (optional)",
                "Standard Rate": "Standard pricing per unit in dollars (optional)",
                "Premium Rate": "Premium/rush pricing per unit (optional)",
                "Complex Rate": "Complex conditions pricing per unit (optional)",
                "Company Standard": "Mark as company standard - true/false/yes/no (optional)",
                "Notes": "Additional notes or specifications (optional)",
                "Description": "Detailed description of the production item (optional)"
            },
            "valid_measurement_units": unit_mapper.get_valid_units(),
            "unit_aliases": unit_aliases,
            "example_rows": example_rows,
            "csv_header": ",".join(template_columns),
            "csv_content": "\n".join([
                ",".join(template_columns),
                *[",".join([f'"{row.get(col, "")}"' for col in template_columns]) for row in example_rows]
            ]),
            "import_features": {
                "auto_create_domains": True,
                "auto_create_categories": True,
                "unit_alias_mapping": True,
                "duplicate_handling": ["skip", "update", "replace"],
                "transactional_commit": True
            }
        }
    }

@router.post("/import/validate")
async def validate_import(
    file: UploadFile = File(...),
    authorization: str = Header(...)
):
    """
    Production Library Import v2.0 - Intelligent Validation
    
    Validates a CSV file with intelligent processing:
    - Auto-creates missing Knowledge Domains (case-insensitive)
    - Auto-creates missing Service Categories (case-insensitive)
    - Maps measurement unit aliases (SQ→SF, SQFT→SF, LUMP SUM→LS, etc.)
    - Separates critical errors from warnings and auto-fixes
    - Provides detailed import preview
    
    Returns validation result with 4 groups:
    1. Critical Errors (block import)
    2. Auto-Created Lookup Values (domains, categories to be created)
    3. Measurement Unit Mappings (aliases that were converted)
    4. Warnings (non-blocking issues)
    """
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    
    try:
        # Read CSV
        content = await file.read()
        try:
            text = content.decode('utf-8')
        except UnicodeDecodeError:
            text = content.decode('utf-8-sig')  # Handle BOM
        
        reader = csv.DictReader(io.StringIO(text))
        
        # Initialize validator and load lookup data
        validator = ProductionLibraryValidator()
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = await get_service_headers()
            
            # Load existing domains
            domains_resp = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/knowledge_domains?organization_id=eq.{org_id}",
                headers=headers
            )
            
            # Check for schema errors
            if domains_resp.status_code == 404:
                error_body = domains_resp.json() if domains_resp.content else {}
                if error_body.get('code') == 'PGRST205' or 'Could not find' in error_body.get('message', ''):
                    return {
                        "success": False,
                        "error": "database_schema_missing",
                        "message": "Production Library tables do not exist. Please run the migration.",
                        "action_required": "migration"
                    }
            
            domains = domains_resp.json() if domains_resp.status_code == 200 else []
            validator.lookup_resolver.load_domains(domains)
            
            # Load existing categories
            cats_resp = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/service_categories?organization_id=eq.{org_id}",
                headers=headers
            )
            categories = cats_resp.json() if cats_resp.status_code == 200 else []
            validator.lookup_resolver.load_categories(categories)
            
            # Load measurement units
            units_resp = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/measurement_units?is_active=eq.true",
                headers=headers
            )
            units = units_resp.json() if units_resp.status_code == 200 else []
            validator.lookup_resolver.load_units(units)
            
            # Get existing production codes for duplicate detection
            existing_resp = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/production_items?"
                f"organization_id=eq.{org_id}&select=production_code,id",
                headers=headers
            )
            existing_items = existing_resp.json() if existing_resp.status_code == 200 else []
            existing_codes = {item['production_code'].upper(): item['id'] for item in existing_items}
            
            # Process all rows
            seen_codes = set()
            all_issues = []
            all_unit_mappings = []
            valid_rows = []
            total_rows = 0
            error_rows = 0
            warning_rows = 0
            duplicate_codes = []
            
            for i, row in enumerate(reader, 1):
                total_rows += 1
                
                import_row, issues, unit_mappings = validator.validate_row(
                    row_num=i,
                    row=row,
                    seen_codes=seen_codes,
                    existing_codes=set(existing_codes.keys())
                )
                
                all_issues.extend(issues)
                all_unit_mappings.extend(unit_mappings)
                
                # Track seen codes
                normalized = validator.normalize_row(row)
                production_code = normalized.get('production_code', '')
                if production_code:
                    seen_codes.add(production_code.upper())
                
                # Check for critical errors
                critical = [i for i in issues if i.severity == ValidationSeverity.CRITICAL]
                warnings = [i for i in issues if i.severity == ValidationSeverity.WARNING]
                
                if critical:
                    error_rows += 1
                elif import_row:
                    valid_rows.append(import_row)
                    if warnings:
                        warning_rows += 1
                    
                    # Track duplicates
                    if import_row.is_duplicate:
                        duplicate_codes.append(production_code)
            
            # Separate issues by severity
            critical_errors = [
                {
                    "row": i.row,
                    "column": i.column,
                    "value": i.value,
                    "issue": i.issue,
                    "recommended_fix": i.recommended_fix
                }
                for i in all_issues if i.severity == ValidationSeverity.CRITICAL
            ]
            
            warnings_list = [
                {
                    "row": i.row,
                    "column": i.column,
                    "value": i.value,
                    "issue": i.issue,
                    "recommended_fix": i.recommended_fix
                }
                for i in all_issues if i.severity == ValidationSeverity.WARNING
            ]
            
            auto_created_info = [
                {
                    "row": i.row,
                    "column": i.column,
                    "original_value": i.value,
                    "auto_fix_value": i.auto_fix_value,
                    "message": i.issue
                }
                for i in all_issues if i.auto_fixed
            ]
            
            unit_mappings_list = [
                {
                    "row": m.row,
                    "original_unit": m.original_unit,
                    "mapped_to": m.mapped_to
                }
                for m in all_unit_mappings
            ]
            
            # Get pending lookups to be created
            pending_domains = validator.lookup_resolver.get_pending_domains()
            pending_categories = validator.lookup_resolver.get_pending_categories()
            
            # Build preview (first 20 valid rows)
            preview = []
            for row in valid_rows[:20]:
                preview.append({
                    "row": row.row_number,
                    "production_code": row.data['production_code'],
                    "production_name": row.data['production_name'],
                    "knowledge_domain": row.data['knowledge_domain'],
                    "measurement_unit": row.data['measurement_unit'],
                    "standard_rate": row.data.get('standard_rate'),
                    "is_duplicate": row.is_duplicate
                })
            
            # Add warnings for duplicates
            for code in duplicate_codes:
                warnings_list.append({
                    "row": "N/A",
                    "column": "Production Code",
                    "value": code,
                    "issue": f"'{code}' already exists in your Production Library",
                    "recommended_fix": "Will be skipped unless 'Update Existing' or 'Replace Existing' is selected"
                })
            
            validation_passed = error_rows == 0
            can_import = len(valid_rows) > 0
            
            return {
                "success": True,
                "validation_passed": validation_passed,
                "can_import": can_import,
                "version": "2.0",
                
                # Summary stats
                "results": {
                    "file_name": file.filename,
                    "total_rows": total_rows,
                    "valid_rows": len(valid_rows),
                    "error_rows": error_rows,
                    "warning_rows": warning_rows,
                    "duplicates_found": len(duplicate_codes),
                },
                
                # Four validation groups
                "validation_groups": {
                    "critical_errors": critical_errors,
                    "auto_created_lookups": auto_created_info,
                    "unit_mappings": unit_mappings_list,
                    "warnings": warnings_list
                },
                
                # Lookups that will be created
                "pending_lookups": {
                    "domains": pending_domains,
                    "categories": pending_categories
                },
                
                # Preview data
                "preview": preview,
                
                # Duplicate codes
                "duplicate_codes": duplicate_codes,
                
                # For backward compatibility
                "errors": critical_errors,
                "warnings": warnings_list
            }
            
    except Exception as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/import/commit")
async def commit_import(
    file: UploadFile = File(...),
    authorization: str = Header(...),
    duplicate_strategy: str = Query("skip", description="How to handle duplicates: skip, update, replace"),
    update_existing: bool = Query(False, description="Deprecated: Use duplicate_strategy instead")
):
    """
    Production Library Import v2.0 - Transactional Commit
    
    Commits a validated CSV import to the Production Library with:
    - Automatic creation of missing Knowledge Domains
    - Automatic creation of missing Service Categories
    - Measurement unit alias mapping
    - Transactional imports (all-or-nothing on failure)
    - Duplicate handling (skip/update/replace)
    - Comprehensive import report
    
    Duplicate Strategies:
    - skip: Skip rows where production_code already exists
    - update: Update existing items with new values (merge)
    - replace: Replace existing items entirely with new data
    
    Returns detailed import report with:
    - Items imported, updated, skipped
    - Lookups created
    - Unit conversions applied
    - Warnings and errors
    - Import duration
    """
    start_time = time.time()
    
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    user_id = context['user_id']
    
    # Handle deprecated update_existing parameter
    if update_existing and duplicate_strategy == "skip":
        duplicate_strategy = "update"
    
    # Validate duplicate strategy
    try:
        strategy = DuplicateStrategy(duplicate_strategy.lower())
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid duplicate_strategy. Must be one of: skip, update, replace"
        )
    
    try:
        # Read CSV
        content = await file.read()
        try:
            text = content.decode('utf-8')
        except UnicodeDecodeError:
            text = content.decode('utf-8-sig')
        
        reader = csv.DictReader(io.StringIO(text))
        
        # Initialize validator
        validator = ProductionLibraryValidator()
        
        # Results tracking
        results = ImportResult(
            success=False,
            message="",
            duration_ms=0
        )
        
        # Transaction staging
        items_to_create = []
        items_to_update = []
        domains_to_create = []
        categories_to_create = []
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            headers = await get_service_headers()
            
            # Load existing data
            domains_resp = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/knowledge_domains?organization_id=eq.{org_id}",
                headers=headers
            )
            
            if domains_resp.status_code == 404:
                error_body = domains_resp.json() if domains_resp.content else {}
                if error_body.get('code') == 'PGRST205':
                    raise HTTPException(
                        status_code=500,
                        detail="Production Library tables do not exist. Please run the database migration."
                    )
            
            domains = domains_resp.json() if domains_resp.status_code == 200 else []
            validator.lookup_resolver.load_domains(domains)
            
            cats_resp = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/service_categories?organization_id=eq.{org_id}",
                headers=headers
            )
            categories = cats_resp.json() if cats_resp.status_code == 200 else []
            validator.lookup_resolver.load_categories(categories)
            
            units_resp = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/measurement_units?is_active=eq.true",
                headers=headers
            )
            units = units_resp.json() if units_resp.status_code == 200 else []
            validator.lookup_resolver.load_units(units)
            
            # Get existing production items
            existing_resp = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/production_items?"
                f"organization_id=eq.{org_id}&select=id,production_code",
                headers=headers
            )
            existing_items = existing_resp.json() if existing_resp.status_code == 200 else []
            existing_map = {item['production_code'].upper(): item['id'] for item in existing_items}
            
            # First pass: validate all rows and collect pending lookups
            seen_codes = set()
            validated_rows = []
            
            for i, row in enumerate(reader, 1):
                import_row, issues, unit_mappings = validator.validate_row(
                    row_num=i,
                    row=row,
                    seen_codes=seen_codes,
                    existing_codes=set(existing_map.keys())
                )
                
                # Track unit conversions
                results.unit_conversions += len(unit_mappings)
                
                normalized = validator.normalize_row(row)
                production_code = normalized.get('production_code', '')
                if production_code:
                    seen_codes.add(production_code.upper())
                
                # Check for critical errors
                critical = [i for i in issues if i.severity == ValidationSeverity.CRITICAL]
                if critical:
                    results.errors += 1
                    results.error_details.append({
                        "row": i,
                        "production_code": production_code,
                        "errors": [{"column": e.column, "issue": e.issue} for e in critical]
                    })
                    continue
                
                if import_row:
                    # Track warnings
                    warnings = [i for i in issues if i.severity == ValidationSeverity.WARNING]
                    results.warnings += len(warnings)
                    validated_rows.append(import_row)
            
            # If there are critical errors, abort the transaction
            if results.errors > 0:
                duration_ms = int((time.time() - start_time) * 1000)
                results.duration_ms = duration_ms
                results.message = f"Import aborted: {results.errors} critical errors found. No data was imported."
                
                return {
                    "success": False,
                    "message": results.message,
                    "results": {
                        "imported": 0,
                        "updated": 0,
                        "skipped": 0,
                        "errors": results.errors,
                        "error_details": results.error_details,
                        "domains_created": 0,
                        "categories_created": 0,
                        "unit_conversions": results.unit_conversions,
                        "warnings": results.warnings,
                        "duration_ms": duration_ms
                    }
                }
            
            # ===== PHASE 1: Create pending lookups =====
            pending_domains = validator.lookup_resolver.get_pending_domains()
            pending_categories = validator.lookup_resolver.get_pending_categories()
            
            # Create domains
            for domain in pending_domains:
                try:
                    resp = await client.post(
                        f"{config.SUPABASE_URL}/rest/v1/knowledge_domains",
                        headers=headers,
                        json={
                            "organization_id": org_id,
                            "created_by": user_id,
                            "name": domain['name'],
                            "code": domain['code']
                        }
                    )
                    
                    if resp.status_code == 201:
                        created = resp.json()[0]
                        validator.lookup_resolver.register_created_domain(
                            domain['name'].lower(),
                            created['id'],
                            created['name'],
                            created.get('code', '')
                        )
                        results.domains_created += 1
                        results.created_lookups.append(LookupCreation(
                            lookup_type="knowledge_domain",
                            original_value=domain['name'],
                            created_id=created['id'],
                            created_name=created['name']
                        ))
                        logger.info(f"Created domain: {domain['name']}")
                    elif resp.status_code == 409:
                        # Already exists (race condition), fetch it
                        fetch_resp = await client.get(
                            f"{config.SUPABASE_URL}/rest/v1/knowledge_domains?"
                            f"organization_id=eq.{org_id}&name=ilike.{domain['name']}",
                            headers=headers
                        )
                        if fetch_resp.status_code == 200 and fetch_resp.json():
                            existing = fetch_resp.json()[0]
                            validator.lookup_resolver.register_created_domain(
                                domain['name'].lower(),
                                existing['id'],
                                existing['name'],
                                existing.get('code', '')
                            )
                    else:
                        logger.error(f"Failed to create domain {domain['name']}: {resp.status_code}")
                except Exception as e:
                    logger.error(f"Error creating domain {domain['name']}: {e}")
            
            # Create categories
            for category in pending_categories:
                try:
                    resp = await client.post(
                        f"{config.SUPABASE_URL}/rest/v1/service_categories",
                        headers=headers,
                        json={
                            "organization_id": org_id,
                            "created_by": user_id,
                            "name": category['name'],
                            "code": category['code']
                        }
                    )
                    
                    if resp.status_code == 201:
                        created = resp.json()[0]
                        validator.lookup_resolver.register_created_category(
                            category['name'].lower(),
                            created['id'],
                            created['name'],
                            created.get('code', '')
                        )
                        results.categories_created += 1
                        results.created_lookups.append(LookupCreation(
                            lookup_type="service_category",
                            original_value=category['name'],
                            created_id=created['id'],
                            created_name=created['name']
                        ))
                        logger.info(f"Created category: {category['name']}")
                    elif resp.status_code == 409:
                        fetch_resp = await client.get(
                            f"{config.SUPABASE_URL}/rest/v1/service_categories?"
                            f"organization_id=eq.{org_id}&name=ilike.{category['name']}",
                            headers=headers
                        )
                        if fetch_resp.status_code == 200 and fetch_resp.json():
                            existing = fetch_resp.json()[0]
                            validator.lookup_resolver.register_created_category(
                                category['name'].lower(),
                                existing['id'],
                                existing['name'],
                                existing.get('code', '')
                            )
                except Exception as e:
                    logger.error(f"Error creating category {category['name']}: {e}")
            
            # ===== PHASE 2: Resolve all IDs with newly created lookups =====
            for row in validated_rows:
                # Re-resolve domain ID if it was pending
                if row.data['knowledge_domain_id'] and row.data['knowledge_domain_id'].startswith('pending:'):
                    domain_name = row.data['knowledge_domain']
                    domain_id, _, _ = validator.lookup_resolver.resolve_domain(domain_name, auto_create=False)
                    row.data['knowledge_domain_id'] = domain_id
                
                # Re-resolve category IDs
                new_category_ids = []
                for cat_id in row.data.get('service_category_ids', []):
                    if isinstance(cat_id, str) and cat_id.startswith('pending:'):
                        # Extract category name and resolve
                        cat_key = cat_id.replace('pending:', '')
                        resolved_id, _, _ = validator.lookup_resolver.resolve_category(cat_key, auto_create=False)
                        if resolved_id and not resolved_id.startswith('pending:'):
                            new_category_ids.append(resolved_id)
                    else:
                        new_category_ids.append(cat_id)
                row.data['service_category_ids'] = new_category_ids
            
            # ===== PHASE 3: Process production items =====
            for row in validated_rows:
                production_code = row.data['production_code']
                code_upper = production_code.upper()
                
                # Check if duplicate
                is_duplicate = code_upper in existing_map
                
                if is_duplicate:
                    if strategy == DuplicateStrategy.SKIP:
                        results.skipped += 1
                        continue
                    
                    existing_id = existing_map[code_upper]
                    
                    if strategy in [DuplicateStrategy.UPDATE, DuplicateStrategy.REPLACE]:
                        # Build update data
                        update_data = {
                            "production_name": row.data['production_name'],
                            "knowledge_domain_id": row.data['knowledge_domain_id'],
                            "measurement_unit_id": row.data['measurement_unit_id'],
                            "production_per_day": row.data.get('production_per_day'),
                            "crew_size": row.data.get('crew_size', 1),
                            "labour_hours": row.data.get('labour_hours'),
                            "standard_rate": row.data.get('standard_rate'),
                            "premium_rate": row.data.get('premium_rate'),
                            "complex_rate": row.data.get('complex_rate'),
                            "is_company_standard": row.data.get('is_company_standard', False),
                            "notes": row.data.get('notes'),
                            "description": row.data.get('description'),
                            "updated_by": user_id,
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }
                        
                        # Remove None values for UPDATE (keep only fields with actual values)
                        if strategy == DuplicateStrategy.UPDATE:
                            update_data = {k: v for k, v in update_data.items() if v is not None}
                        
                        try:
                            resp = await client.patch(
                                f"{config.SUPABASE_URL}/rest/v1/production_items?id=eq.{existing_id}",
                                headers=headers,
                                json=update_data
                            )
                            
                            if resp.status_code == 200:
                                # Update service categories
                                if row.data.get('service_category_ids'):
                                    # Delete existing
                                    await client.delete(
                                        f"{config.SUPABASE_URL}/rest/v1/production_item_service_categories?"
                                        f"production_item_id=eq.{existing_id}",
                                        headers=headers
                                    )
                                    # Create new
                                    for sc_id in row.data['service_category_ids']:
                                        if sc_id and not str(sc_id).startswith('pending:'):
                                            await client.post(
                                                f"{config.SUPABASE_URL}/rest/v1/production_item_service_categories",
                                                headers=headers,
                                                json={"production_item_id": existing_id, "service_category_id": sc_id}
                                            )
                                
                                results.updated += 1
                            else:
                                results.errors += 1
                                results.error_details.append({
                                    "row": row.row_number,
                                    "production_code": production_code,
                                    "error": f"Update failed: {resp.status_code}"
                                })
                        except Exception as e:
                            results.errors += 1
                            results.error_details.append({
                                "row": row.row_number,
                                "production_code": production_code,
                                "error": str(e)
                            })
                else:
                    # Create new item
                    item_data = {
                        "organization_id": org_id,
                        "production_code": production_code,
                        "production_name": row.data['production_name'],
                        "knowledge_domain_id": row.data['knowledge_domain_id'],
                        "measurement_unit_id": row.data['measurement_unit_id'],
                        "production_per_day": row.data.get('production_per_day'),
                        "crew_size": row.data.get('crew_size', 1),
                        "labour_hours": row.data.get('labour_hours'),
                        "standard_rate": row.data.get('standard_rate'),
                        "premium_rate": row.data.get('premium_rate'),
                        "complex_rate": row.data.get('complex_rate'),
                        "is_company_standard": row.data.get('is_company_standard', False),
                        "notes": row.data.get('notes'),
                        "description": row.data.get('description'),
                        "created_by": user_id
                    }
                    
                    try:
                        resp = await client.post(
                            f"{config.SUPABASE_URL}/rest/v1/production_items",
                            headers=headers,
                            json=item_data
                        )
                        
                        if resp.status_code == 201:
                            created_item = resp.json()[0]
                            
                            # Create service category links
                            for sc_id in row.data.get('service_category_ids', []):
                                if sc_id and not str(sc_id).startswith('pending:'):
                                    await client.post(
                                        f"{config.SUPABASE_URL}/rest/v1/production_item_service_categories",
                                        headers=headers,
                                        json={"production_item_id": created_item['id'], "service_category_id": sc_id}
                                    )
                            
                            # Create initial revision
                            await client.post(
                                f"{config.SUPABASE_URL}/rest/v1/production_item_revisions",
                                headers=headers,
                                json={
                                    "production_item_id": created_item['id'],
                                    "version": 1,
                                    "snapshot": created_item,
                                    "change_type": "created",
                                    "change_reason": "Imported from CSV (v2.0)",
                                    "created_by": user_id
                                }
                            )
                            
                            results.imported += 1
                            
                            # Update existing map to prevent duplicates within same import
                            existing_map[code_upper] = created_item['id']
                        else:
                            results.errors += 1
                            results.error_details.append({
                                "row": row.row_number,
                                "production_code": production_code,
                                "error": f"Create failed: {resp.status_code}"
                            })
                    except Exception as e:
                        results.errors += 1
                        results.error_details.append({
                            "row": row.row_number,
                            "production_code": production_code,
                            "error": str(e)
                        })
            
            # Calculate duration
            duration_ms = int((time.time() - start_time) * 1000)
            results.duration_ms = duration_ms
            
            # Build success message
            total_processed = results.imported + results.updated
            results.success = total_processed > 0
            
            message_parts = []
            if results.imported > 0:
                message_parts.append(f"{results.imported} imported")
            if results.updated > 0:
                message_parts.append(f"{results.updated} updated")
            if results.skipped > 0:
                message_parts.append(f"{results.skipped} skipped")
            if results.domains_created > 0:
                message_parts.append(f"{results.domains_created} domains created")
            if results.categories_created > 0:
                message_parts.append(f"{results.categories_created} categories created")
            
            results.message = f"Import complete: {', '.join(message_parts)}" if message_parts else "No items imported"
            
            # Build response
            return {
                "success": results.success,
                "message": results.message,
                "version": "2.0",
                "results": {
                    "imported": results.imported,
                    "updated": results.updated,
                    "skipped": results.skipped,
                    "errors": results.errors,
                    "error_details": results.error_details[:20],  # Limit for response size
                    "domains_created": results.domains_created,
                    "categories_created": results.categories_created,
                    "unit_conversions": results.unit_conversions,
                    "warnings": results.warnings,
                    "duration_ms": duration_ms
                },
                "created_lookups": [
                    {
                        "type": l.lookup_type,
                        "name": l.created_name,
                        "id": l.created_id
                    }
                    for l in results.created_lookups
                ],
                # Backward compatibility
                "created": results.imported,
                "updated": results.updated,
                "skipped": results.skipped
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Import commit error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================
# STATS / DASHBOARD
# =====================================================

@router.get("/stats")
async def get_production_library_stats(authorization: str = Header(...)):
    """Get statistics for the production library"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            headers = await get_service_headers()
            
            # Get counts
            items_resp = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/production_items?"
                f"organization_id=eq.{org_id}&is_active=eq.true&select=id",
                headers={**headers, "Prefer": "count=exact"}
            )
            items_count = int(items_resp.headers.get('content-range', '0-0/0').split('/')[-1])
            
            assemblies_resp = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/production_assemblies?"
                f"organization_id=eq.{org_id}&is_active=eq.true&select=id",
                headers={**headers, "Prefer": "count=exact"}
            )
            assemblies_count = int(assemblies_resp.headers.get('content-range', '0-0/0').split('/')[-1])
            
            domains_resp = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/knowledge_domains?"
                f"organization_id=eq.{org_id}&is_active=eq.true&select=id",
                headers={**headers, "Prefer": "count=exact"}
            )
            domains_count = int(domains_resp.headers.get('content-range', '0-0/0').split('/')[-1])
            
            # Get items with high AI confidence
            ai_resp = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/production_items?"
                f"organization_id=eq.{org_id}&is_active=eq.true&"
                f"ai_confidence_score=gte.0.7&select=id",
                headers={**headers, "Prefer": "count=exact"}
            )
            ai_trained_count = int(ai_resp.headers.get('content-range', '0-0/0').split('/')[-1])
            
            return {
                "success": True,
                "stats": {
                    "production_items": items_count,
                    "assemblies": assemblies_count,
                    "knowledge_domains": domains_count,
                    "ai_trained_items": ai_trained_count,
                    "ai_coverage_pct": round((ai_trained_count / items_count * 100) if items_count > 0 else 0, 1)
                }
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def production_library_health():
    """Health check for production library service"""
    return {"status": "healthy", "service": "production-library", "version": "1.0.0"}

# =====================================================
# SEEDING / INITIALIZATION
# =====================================================

# Default Knowledge Domains for finish carpentry contractors
DEFAULT_KNOWLEDGE_DOMAINS = [
    {"code": "FC", "name": "Finish Carpentry", "description": "Trim, moldings, and finish woodwork", "sort_order": 1},
    {"code": "DH", "name": "Doors & Hardware", "description": "Door installation and hardware", "sort_order": 2},
    {"code": "AM", "name": "Architectural Millwork", "description": "Custom millwork and built-ins", "sort_order": 3},
    {"code": "CB", "name": "Cabinetry", "description": "Cabinet installation and modifications", "sort_order": 4},
    {"code": "FL", "name": "Flooring", "description": "Flooring installation and finishing", "sort_order": 5},
    {"code": "CT", "name": "Countertops", "description": "Countertop installation", "sort_order": 6},
    {"code": "SR", "name": "Stairs & Railings", "description": "Staircase and railing work", "sort_order": 7},
    {"code": "FW", "name": "Feature Walls", "description": "Accent walls and feature installations", "sort_order": 8},
    {"code": "WA", "name": "Washroom Accessories", "description": "Bathroom accessory installation", "sort_order": 9},
    {"code": "GC", "name": "General Conditions", "description": "Project overhead and general conditions", "sort_order": 10},
    {"code": "MB", "name": "Mobilization", "description": "Site setup and mobilization", "sort_order": 11},
    {"code": "CO", "name": "Closeout", "description": "Project closeout and demobilization", "sort_order": 12},
    {"code": "TR", "name": "Travel", "description": "Travel time and expenses", "sort_order": 13},
    {"code": "MS", "name": "Miscellaneous", "description": "Other production items", "sort_order": 99},
]

# Default Service Categories
DEFAULT_SERVICE_CATEGORIES = [
    {"code": "RES", "name": "Residential", "description": "Single-family residential projects", "sort_order": 1},
    {"code": "MF", "name": "Multifamily", "description": "Multi-unit residential buildings", "sort_order": 2},
    {"code": "COM", "name": "Commercial", "description": "Commercial office and retail", "sort_order": 3},
    {"code": "HOS", "name": "Hospitality", "description": "Hotels, restaurants, entertainment", "sort_order": 4},
    {"code": "INS", "name": "Institutional", "description": "Schools, government, public buildings", "sort_order": 5},
    {"code": "HC", "name": "Healthcare", "description": "Medical facilities and clinics", "sort_order": 6},
    {"code": "RET", "name": "Retail", "description": "Retail stores and shopping centers", "sort_order": 7},
    {"code": "IND", "name": "Industrial", "description": "Industrial and manufacturing facilities", "sort_order": 8},
    {"code": "TI", "name": "Tenant Improvement", "description": "Interior tenant improvements", "sort_order": 9},
    {"code": "RST", "name": "Restoration", "description": "Historic restoration and renovation", "sort_order": 10},
    {"code": "SM", "name": "Service & Maintenance", "description": "Service calls and maintenance work", "sort_order": 11},
]

@router.post("/seed")
async def seed_production_library(
    authorization: str = Header(...),
    force: bool = Query(False, description="Force re-seeding even if data exists")
):
    """
    Seed the Production Library with default Knowledge Domains and Service Categories.
    This should be run once when setting up a new organization.
    """
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    user_id = context['user_id']
    
    results = {
        "knowledge_domains": {"created": 0, "existing": 0, "errors": []},
        "service_categories": {"created": 0, "existing": 0, "errors": []}
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = await get_service_headers()
            
            # Check existing domains
            existing_domains_resp = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/knowledge_domains?"
                f"organization_id=eq.{org_id}&select=code",
                headers=headers
            )
            existing_domain_codes = set()
            if existing_domains_resp.status_code == 200:
                existing_domain_codes = {d['code'] for d in existing_domains_resp.json() if d.get('code')}
            elif existing_domains_resp.status_code == 404:
                # Table doesn't exist
                error_body = existing_domains_resp.json() if existing_domains_resp.content else {}
                if error_body.get('code') == 'PGRST205' or 'Could not find' in error_body.get('message', ''):
                    raise HTTPException(
                        status_code=500,
                        detail="Production Library tables do not exist. Please run the database migration: /app/migrations/015_production_library_foundation.sql"
                    )
            
            # Seed Knowledge Domains
            for domain in DEFAULT_KNOWLEDGE_DOMAINS:
                if domain['code'] in existing_domain_codes and not force:
                    results['knowledge_domains']['existing'] += 1
                    continue
                    
                try:
                    resp = await client.post(
                        f"{config.SUPABASE_URL}/rest/v1/knowledge_domains",
                        headers=headers,
                        json={
                            "organization_id": org_id,
                            "created_by": user_id,
                            **domain
                        }
                    )
                    if resp.status_code == 201:
                        results['knowledge_domains']['created'] += 1
                    elif resp.status_code == 409:
                        results['knowledge_domains']['existing'] += 1
                    elif resp.status_code == 404:
                        # Table doesn't exist
                        error_body = resp.json() if resp.content else {}
                        if error_body.get('code') == 'PGRST205' or 'Could not find' in error_body.get('message', ''):
                            raise HTTPException(
                                status_code=500,
                                detail="Production Library tables do not exist. Please run the database migration: /app/migrations/015_production_library_foundation.sql"
                            )
                        results['knowledge_domains']['errors'].append(f"{domain['code']}: {resp.status_code}")
                    else:
                        results['knowledge_domains']['errors'].append(f"{domain['code']}: {resp.status_code}")
                except HTTPException:
                    raise
                except Exception as e:
                    results['knowledge_domains']['errors'].append(f"{domain['code']}: {str(e)})")
            
            # Check existing service categories
            existing_cats_resp = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/service_categories?"
                f"organization_id=eq.{org_id}&select=code",
                headers=headers
            )
            existing_cat_codes = set()
            if existing_cats_resp.status_code == 200:
                existing_cat_codes = {c['code'] for c in existing_cats_resp.json() if c.get('code')}
            
            # Seed Service Categories
            for category in DEFAULT_SERVICE_CATEGORIES:
                if category['code'] in existing_cat_codes and not force:
                    results['service_categories']['existing'] += 1
                    continue
                    
                try:
                    resp = await client.post(
                        f"{config.SUPABASE_URL}/rest/v1/service_categories",
                        headers=headers,
                        json={
                            "organization_id": org_id,
                            "created_by": user_id,
                            **category
                        }
                    )
                    if resp.status_code == 201:
                        results['service_categories']['created'] += 1
                    elif resp.status_code == 409:
                        results['service_categories']['existing'] += 1
                    elif resp.status_code == 404:
                        # Table doesn't exist
                        error_body = resp.json() if resp.content else {}
                        if error_body.get('code') == 'PGRST205' or 'Could not find' in error_body.get('message', ''):
                            raise HTTPException(
                                status_code=500,
                                detail="Production Library tables do not exist. Please run the migration: /app/migrations/015_production_library_foundation.sql"
                            )
                        results['service_categories']['errors'].append(f"{category['code']}: {resp.status_code}")
                    else:
                        results['service_categories']['errors'].append(f"{category['code']}: {resp.status_code}")
                except HTTPException:
                    raise
                except Exception as e:
                    results['service_categories']['errors'].append(f"{category['code']}: {str(e)}")
            
            # Determine success based on actual results
            total_created = results['knowledge_domains']['created'] + results['service_categories']['created']
            total_existing = results['knowledge_domains']['existing'] + results['service_categories']['existing']
            total_errors = len(results['knowledge_domains']['errors']) + len(results['service_categories']['errors'])
            
            # If nothing was created and nothing existed and we have errors, it's a failure
            if total_created == 0 and total_existing == 0 and total_errors > 0:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to seed Production Library. Errors: {results['knowledge_domains']['errors'][:3] + results['service_categories']['errors'][:3]}"
                )
            
            return {
                "success": True,
                "message": "Production Library seeded successfully",
                "results": results
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Seeding error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/seed/status")
async def get_seed_status(authorization: str = Header(...)):
    """Check if the Production Library has been seeded"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = await get_service_headers()
            
            # Check domains
            domains_resp = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/knowledge_domains?"
                f"organization_id=eq.{org_id}&select=id",
                headers={**headers, "Prefer": "count=exact"}
            )
            
            # Check if tables exist (404 with PGRST205 means table doesn't exist)
            if domains_resp.status_code == 404:
                error_body = domains_resp.json() if domains_resp.content else {}
                if error_body.get('code') == 'PGRST205' or 'Could not find' in error_body.get('message', ''):
                    return {
                        "success": False,
                        "is_seeded": False,
                        "schema_error": True,
                        "error": "database_schema_missing",
                        "message": "Production Library tables do not exist in the database. Please run the migration: /app/migrations/015_production_library_foundation.sql",
                        "counts": {
                            "knowledge_domains": 0,
                            "service_categories": 0,
                            "production_items": 0
                        }
                    }
            
            domains_count = int(domains_resp.headers.get('content-range', '0-0/0').split('/')[-1]) if domains_resp.status_code == 200 else 0
            
            # Check service categories
            cats_resp = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/service_categories?"
                f"organization_id=eq.{org_id}&select=id",
                headers={**headers, "Prefer": "count=exact"}
            )
            
            if cats_resp.status_code == 404:
                error_body = cats_resp.json() if cats_resp.content else {}
                if error_body.get('code') == 'PGRST205' or 'Could not find' in error_body.get('message', ''):
                    return {
                        "success": False,
                        "is_seeded": False,
                        "schema_error": True,
                        "error": "database_schema_missing",
                        "message": "Production Library tables do not exist in the database. Please run the migration.",
                        "counts": {
                            "knowledge_domains": domains_count,
                            "service_categories": 0,
                            "production_items": 0
                        }
                    }
            
            cats_count = int(cats_resp.headers.get('content-range', '0-0/0').split('/')[-1]) if cats_resp.status_code == 200 else 0
            
            # Check production items
            items_resp = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/production_items?"
                f"organization_id=eq.{org_id}&select=id",
                headers={**headers, "Prefer": "count=exact"}
            )
            
            if items_resp.status_code == 404:
                error_body = items_resp.json() if items_resp.content else {}
                if error_body.get('code') == 'PGRST205' or 'Could not find' in error_body.get('message', ''):
                    return {
                        "success": False,
                        "is_seeded": False,
                        "schema_error": True,
                        "error": "database_schema_missing",
                        "message": "Production Library tables do not exist in the database. Please run the migration.",
                        "counts": {
                            "knowledge_domains": domains_count,
                            "service_categories": cats_count,
                            "production_items": 0
                        }
                    }
            
            items_count = int(items_resp.headers.get('content-range', '0-0/0').split('/')[-1]) if items_resp.status_code == 200 else 0
            
            is_seeded = domains_count > 0 and cats_count > 0
            
            return {
                "success": True,
                "is_seeded": is_seeded,
                "has_production_items": items_count > 0,
                "counts": {
                    "knowledge_domains": domains_count,
                    "service_categories": cats_count,
                    "production_items": items_count
                }
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Seed status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
