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
    production_per_day: Optional[float] = None
    crew_size: Optional[float] = 1
    labour_hours: Optional[float] = None
    standard_rate: Optional[float] = None
    premium_rate: Optional[float] = None
    complex_rate: Optional[float] = None
    is_company_standard: Optional[bool] = False
    notes: Optional[str] = None
    service_category_ids: Optional[List[str]] = []

class ProductionItemUpdate(BaseModel):
    production_name: Optional[str] = None
    description: Optional[str] = None
    knowledge_domain_id: Optional[str] = None
    measurement_unit_id: Optional[str] = None
    production_per_day: Optional[float] = None
    crew_size: Optional[float] = None
    labour_hours: Optional[float] = None
    standard_rate: Optional[float] = None
    premium_rate: Optional[float] = None
    complex_rate: Optional[float] = None
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

# =====================================================
# PRODUCTION ITEMS (Level 3)
# =====================================================

@router.get("/items")
async def get_production_items(
    authorization: str = Header(...),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    domain_id: Optional[str] = Query(None),
    service_category_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    include_inactive: bool = Query(False)
):
    """Get production items with pagination and filtering"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    
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
            offset = (page - 1) * per_page
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/production_items?"
                f"{query}&"
                f"select=*,knowledge_domains(id,name,code),measurement_units(id,code,name)&"
                f"order=production_code.asc&"
                f"offset={offset}&limit={per_page}",
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
                        "per_page": per_page,
                        "total_pages": (total + per_page - 1) // per_page
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
# IMPORT / EXPORT
# =====================================================

@router.get("/import/template/download")
async def download_import_template(authorization: str = Header(...)):
    """
    Download the official TradeOS CSV Template for Production Items import.
    
    This is the standardized import format for TradeOS Version 1.
    All imports must follow this exact structure.
    """
    await verify_token_and_get_org(authorization)
    
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
        "Notes"
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
            "Notes": "Standard 3-1/4\" colonial casing"
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
            "Notes": "5-1/4\" MDF baseboard"
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
            "Notes": "Pre-hung hollow core door"
        }
    ]
    
    return {
        "success": True,
        "template": {
            "name": "TradeOS Production Items Import Template v1.0",
            "columns": template_columns,
            "column_descriptions": {
                "Production Code": "Unique identifier for this production item (required, max 50 chars)",
                "Production Name": "Human-readable name (required, max 255 chars)",
                "Knowledge Domain": "Primary classification - must match existing domain name or code (required)",
                "Service Categories": "Comma-separated list of applicable service categories (optional)",
                "Measurement Unit": "Unit of measure - EA, LF, SF, LS, DAY, HR, SET, KIT, PAIR, or COST (required)",
                "Production Per Day": "Units a single worker can produce per 8-hour day (optional)",
                "Crew Size": "Typical crew size for this work (default: 1)",
                "Labour Hours": "Hours required to complete one unit (optional)",
                "Standard Rate": "Standard pricing per unit in dollars (optional)",
                "Premium Rate": "Premium/rush pricing per unit (optional)",
                "Complex Rate": "Complex conditions pricing per unit (optional)",
                "Company Standard": "Mark as company standard - true/false/yes/no (optional)",
                "Notes": "Additional notes or specifications (optional)"
            },
            "valid_measurement_units": ["EA", "LF", "SF", "LS", "DAY", "HR", "SET", "KIT", "PAIR", "COST"],
            "example_rows": example_rows,
            "csv_header": ",".join(template_columns),
            "csv_content": "\n".join([
                ",".join(template_columns),
                *[",".join([f'"{row[col]}"' for col in template_columns]) for row in example_rows]
            ])
        }
    }

@router.post("/import/validate")
async def validate_import(
    file: UploadFile = File(...),
    authorization: str = Header(...)
):
    """
    Validate a CSV file against the TradeOS Production Items template.
    
    This performs full validation WITHOUT committing any data.
    Returns detailed error reports with Row, Column, Issue, and Recommended Fix.
    
    Official TradeOS CSV Template columns:
    - Production Code (required)
    - Production Name (required)
    - Knowledge Domain (required)
    - Service Categories (optional, comma-separated)
    - Measurement Unit (required: EA, LF, SF, LS, DAY, HR, SET, KIT, PAIR, COST)
    - Production Per Day (optional)
    - Crew Size (optional, default: 1)
    - Labour Hours (optional)
    - Standard Rate (optional)
    - Premium Rate (optional)
    - Complex Rate (optional)
    - Company Standard (optional: true/false)
    - Notes (optional)
    """
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    
    VALID_UNITS = ['EA', 'LF', 'SF', 'LS', 'DAY', 'HR', 'SET', 'KIT', 'PAIR', 'COST']
    
    # Column name mapping (allow both formats)
    COLUMN_MAPPING = {
        'production code': 'production_code',
        'production_code': 'production_code',
        'production name': 'production_name',
        'production_name': 'production_name',
        'knowledge domain': 'knowledge_domain',
        'knowledge_domain': 'knowledge_domain',
        'service categories': 'service_categories',
        'service_categories': 'service_categories',
        'measurement unit': 'measurement_unit',
        'measurement_unit': 'measurement_unit',
        'production per day': 'production_per_day',
        'production_per_day': 'production_per_day',
        'crew size': 'crew_size',
        'crew_size': 'crew_size',
        'labour hours': 'labour_hours',
        'labour_hours': 'labour_hours',
        'standard rate': 'standard_rate',
        'standard_rate': 'standard_rate',
        'premium rate': 'premium_rate',
        'premium_rate': 'premium_rate',
        'complex rate': 'complex_rate',
        'complex_rate': 'complex_rate',
        'company standard': 'is_company_standard',
        'is_company_standard': 'is_company_standard',
        'notes': 'notes'
    }
    
    try:
        # Read CSV
        content = await file.read()
        try:
            text = content.decode('utf-8')
        except UnicodeDecodeError:
            text = content.decode('utf-8-sig')  # Handle BOM
        
        reader = csv.DictReader(io.StringIO(text))
        
        # Normalize column names
        if reader.fieldnames:
            normalized_fieldnames = []
            for fn in reader.fieldnames:
                normalized = COLUMN_MAPPING.get(fn.lower().strip(), fn.lower().strip().replace(' ', '_'))
                normalized_fieldnames.append(normalized)
        
        results = {
            "file_name": file.filename,
            "total_rows": 0,
            "valid_rows": 0,
            "error_rows": 0,
            "warning_rows": 0,
            "errors": [],        # Detailed errors with row/column/issue/fix
            "warnings": [],      # Warnings that don't prevent import
            "preview": [],       # First 20 valid rows for preview
            "summary": {
                "production_codes": [],
                "duplicate_codes": [],
                "domains_found": set(),
                "categories_found": set(),
                "units_found": set()
            }
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = await get_service_headers()
            
            # Get lookup tables
            domains_resp = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/knowledge_domains?organization_id=eq.{org_id}",
                headers=headers
            )
            domains = {}
            domain_names = []
            if domains_resp.status_code == 200:
                for d in domains_resp.json():
                    domains[d['name'].lower()] = d
                    domain_names.append(d['name'])
                    if d.get('code'):
                        domains[d['code'].lower()] = d
            
            cats_resp = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/service_categories?organization_id=eq.{org_id}",
                headers=headers
            )
            categories = {}
            category_names = []
            if cats_resp.status_code == 200:
                for c in cats_resp.json():
                    categories[c['name'].lower()] = c
                    category_names.append(c['name'])
                    if c.get('code'):
                        categories[c['code'].lower()] = c
            
            units_resp = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/measurement_units?is_active=eq.true",
                headers=headers
            )
            units = {}
            if units_resp.status_code == 200:
                for u in units_resp.json():
                    units[u['code'].upper()] = u
            
            # Check if library is seeded
            if not domains:
                return {
                    "success": False,
                    "error": "library_not_initialized",
                    "message": "Production Library has not been initialized. Please click 'Initialize Production Library' first.",
                    "action_required": "seed"
                }
            
            seen_codes = set()
            validated_items = []
            
            for i, row in enumerate(reader, 1):
                results['total_rows'] += 1
                row_has_errors = False
                row_has_warnings = False
                
                # Normalize row keys
                normalized_row = {}
                for key, value in row.items():
                    norm_key = COLUMN_MAPPING.get(key.lower().strip(), key.lower().strip().replace(' ', '_'))
                    normalized_row[norm_key] = (value or '').strip()
                
                # Helper to add error
                def add_error(column, issue, fix):
                    nonlocal row_has_errors
                    row_has_errors = True
                    results['errors'].append({
                        "row": i,
                        "column": column,
                        "value": normalized_row.get(COLUMN_MAPPING.get(column.lower(), column), ''),
                        "issue": issue,
                        "recommended_fix": fix
                    })
                
                # Helper to add warning
                def add_warning(column, issue, fix):
                    nonlocal row_has_warnings
                    row_has_warnings = True
                    results['warnings'].append({
                        "row": i,
                        "column": column,
                        "value": normalized_row.get(COLUMN_MAPPING.get(column.lower(), column), ''),
                        "issue": issue,
                        "recommended_fix": fix
                    })
                
                # ===== REQUIRED FIELD VALIDATION =====
                
                # Production Code
                production_code = normalized_row.get('production_code', '')
                if not production_code:
                    add_error("Production Code", "Required field is empty", "Enter a unique code like 'FC-001' or 'DH-001'")
                elif len(production_code) > 50:
                    add_error("Production Code", f"Code too long ({len(production_code)} chars, max 50)", "Shorten the production code")
                elif production_code.upper() in seen_codes:
                    add_error("Production Code", f"Duplicate code in file", f"Change to a unique code. '{production_code}' already appears in this file")
                    results['summary']['duplicate_codes'].append(production_code)
                else:
                    seen_codes.add(production_code.upper())
                    results['summary']['production_codes'].append(production_code)
                
                # Production Name
                production_name = normalized_row.get('production_name', '')
                if not production_name:
                    add_error("Production Name", "Required field is empty", "Enter a descriptive name like 'Door Casing Installation'")
                elif len(production_name) > 255:
                    add_error("Production Name", f"Name too long ({len(production_name)} chars, max 255)", "Shorten the production name")
                
                # Knowledge Domain
                knowledge_domain = normalized_row.get('knowledge_domain', '')
                domain_id = None
                if not knowledge_domain:
                    add_error("Knowledge Domain", "Required field is empty", f"Enter a valid domain. Options: {', '.join(domain_names[:5])}{'...' if len(domain_names) > 5 else ''}")
                else:
                    domain_match = domains.get(knowledge_domain.lower())
                    if not domain_match:
                        similar = [d for d in domain_names if knowledge_domain.lower() in d.lower()]
                        fix = f"Did you mean: {similar[0]}?" if similar else f"Valid options: {', '.join(domain_names[:5])}"
                        add_error("Knowledge Domain", f"'{knowledge_domain}' not found in your domains", fix)
                    else:
                        domain_id = domain_match['id']
                        results['summary']['domains_found'].add(knowledge_domain)
                
                # Measurement Unit
                measurement_unit = normalized_row.get('measurement_unit', '').upper()
                unit_id = None
                if not measurement_unit:
                    add_error("Measurement Unit", "Required field is empty", f"Enter a valid unit: {', '.join(VALID_UNITS)}")
                elif measurement_unit not in VALID_UNITS:
                    add_error("Measurement Unit", f"'{measurement_unit}' is not a valid unit", f"Use one of: {', '.join(VALID_UNITS)}")
                else:
                    unit_match = units.get(measurement_unit)
                    if unit_match:
                        unit_id = unit_match['id']
                        results['summary']['units_found'].add(measurement_unit)
                
                # ===== OPTIONAL FIELD VALIDATION =====
                
                # Parse numeric fields
                def parse_numeric(field_name, display_name, allow_zero=True, allow_negative=False):
                    value = normalized_row.get(field_name, '')
                    if not value:
                        return None
                    try:
                        cleaned = value.replace(',', '').replace('$', '').strip()
                        num = float(cleaned)
                        if not allow_negative and num < 0:
                            add_warning(display_name, f"Value is negative ({num})", "Verify this is intentional or change to positive")
                        if not allow_zero and num == 0:
                            add_warning(display_name, "Value is zero", "Consider adding a valid value or leave empty")
                        return num
                    except ValueError:
                        add_error(display_name, f"'{value}' is not a valid number", "Enter a numeric value like '8.50' or '120'")
                        return None
                
                production_per_day = parse_numeric('production_per_day', 'Production Per Day')
                crew_size = parse_numeric('crew_size', 'Crew Size') or 1
                labour_hours = parse_numeric('labour_hours', 'Labour Hours')
                standard_rate = parse_numeric('standard_rate', 'Standard Rate')
                premium_rate = parse_numeric('premium_rate', 'Premium Rate')
                complex_rate = parse_numeric('complex_rate', 'Complex Rate')
                
                # Rate hierarchy validation
                if standard_rate and premium_rate and premium_rate < standard_rate:
                    add_warning("Premium Rate", f"Premium rate (${premium_rate}) is less than standard rate (${standard_rate})", "Premium rate should typically be higher than standard rate")
                if standard_rate and complex_rate and complex_rate < standard_rate:
                    add_warning("Complex Rate", f"Complex rate (${complex_rate}) is less than standard rate (${standard_rate})", "Complex rate should typically be higher than standard rate")
                
                # Service Categories
                service_category_ids = []
                service_cats_raw = normalized_row.get('service_categories', '')
                if service_cats_raw:
                    for cat in service_cats_raw.split(','):
                        cat = cat.strip()
                        if cat:
                            cat_match = categories.get(cat.lower())
                            if cat_match:
                                service_category_ids.append(cat_match['id'])
                                results['summary']['categories_found'].add(cat)
                            else:
                                add_warning("Service Categories", f"'{cat}' not found", f"Valid categories: {', '.join(category_names[:5])}")
                
                # Company Standard (boolean)
                is_company_standard = normalized_row.get('is_company_standard', '').lower() in ('true', 'yes', '1', 'y')
                
                # Notes
                notes = normalized_row.get('notes', '') or None
                
                # Track results
                if row_has_errors:
                    results['error_rows'] += 1
                else:
                    results['valid_rows'] += 1
                    if row_has_warnings:
                        results['warning_rows'] += 1
                    
                    # Build validated item
                    validated_item = {
                        "row": i,
                        "production_code": production_code,
                        "production_name": production_name,
                        "knowledge_domain": knowledge_domain,
                        "knowledge_domain_id": domain_id,
                        "measurement_unit": measurement_unit,
                        "measurement_unit_id": unit_id,
                        "service_categories": service_cats_raw,
                        "service_category_ids": service_category_ids,
                        "production_per_day": production_per_day,
                        "crew_size": crew_size,
                        "labour_hours": labour_hours,
                        "standard_rate": standard_rate,
                        "premium_rate": premium_rate,
                        "complex_rate": complex_rate,
                        "is_company_standard": is_company_standard,
                        "notes": notes
                    }
                    validated_items.append(validated_item)
                    
                    # Add to preview (max 20)
                    if len(results['preview']) < 20:
                        results['preview'].append(validated_item)
            
            # Convert sets to lists for JSON serialization
            results['summary']['domains_found'] = list(results['summary']['domains_found'])
            results['summary']['categories_found'] = list(results['summary']['categories_found'])
            results['summary']['units_found'] = list(results['summary']['units_found'])
            
            # Check for duplicates against existing database items
            if results['summary']['production_codes']:
                existing_check = await client.get(
                    f"{config.SUPABASE_URL}/rest/v1/production_items?"
                    f"organization_id=eq.{org_id}&"
                    f"select=production_code",
                    headers=headers
                )
                if existing_check.status_code == 200:
                    existing_codes = {item['production_code'].upper() for item in existing_check.json()}
                    for code in results['summary']['production_codes']:
                        if code.upper() in existing_codes:
                            results['warnings'].append({
                                "row": "N/A",
                                "column": "Production Code",
                                "value": code,
                                "issue": f"'{code}' already exists in your Production Library",
                                "recommended_fix": "This item will be skipped unless 'Update Existing' is enabled"
                            })
            
            return {
                "success": True,
                "validation_passed": results['error_rows'] == 0,
                "can_import": results['valid_rows'] > 0,
                "results": results,
                "validated_items": validated_items
            }
            
    except Exception as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/import/commit")
async def commit_import(
    file: UploadFile = File(...),
    authorization: str = Header(...),
    update_existing: bool = Query(False)
):
    """
    Commit a validated CSV import to the Production Library.
    
    This endpoint should only be called after successful validation.
    It performs the actual database writes for production items.
    """
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    user_id = context['user_id']
    
    COLUMN_MAPPING = {
        'production code': 'production_code',
        'production_code': 'production_code',
        'production name': 'production_name',
        'production_name': 'production_name',
        'knowledge domain': 'knowledge_domain',
        'knowledge_domain': 'knowledge_domain',
        'service categories': 'service_categories',
        'service_categories': 'service_categories',
        'measurement unit': 'measurement_unit',
        'measurement_unit': 'measurement_unit',
        'production per day': 'production_per_day',
        'production_per_day': 'production_per_day',
        'crew size': 'crew_size',
        'crew_size': 'crew_size',
        'labour hours': 'labour_hours',
        'labour_hours': 'labour_hours',
        'standard rate': 'standard_rate',
        'standard_rate': 'standard_rate',
        'premium rate': 'premium_rate',
        'premium_rate': 'premium_rate',
        'complex rate': 'complex_rate',
        'complex_rate': 'complex_rate',
        'company standard': 'is_company_standard',
        'is_company_standard': 'is_company_standard',
        'notes': 'notes'
    }
    
    try:
        content = await file.read()
        try:
            text = content.decode('utf-8')
        except UnicodeDecodeError:
            text = content.decode('utf-8-sig')
        
        reader = csv.DictReader(io.StringIO(text))
        
        results = {
            "created": 0,
            "updated": 0,
            "skipped": 0,
            "errors": 0,
            "import_errors": []
        }
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            headers = await get_service_headers()
            
            # Get lookup tables
            domains_resp = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/knowledge_domains?organization_id=eq.{org_id}",
                headers=headers
            )
            domains = {}
            if domains_resp.status_code == 200:
                for d in domains_resp.json():
                    domains[d['name'].lower()] = d['id']
                    if d.get('code'):
                        domains[d['code'].lower()] = d['id']
            
            cats_resp = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/service_categories?organization_id=eq.{org_id}",
                headers=headers
            )
            categories = {}
            if cats_resp.status_code == 200:
                for c in cats_resp.json():
                    categories[c['name'].lower()] = c['id']
                    if c.get('code'):
                        categories[c['code'].lower()] = c['id']
            
            units_resp = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/measurement_units?is_active=eq.true",
                headers=headers
            )
            units = {}
            if units_resp.status_code == 200:
                for u in units_resp.json():
                    units[u['code'].upper()] = u['id']
            
            for i, row in enumerate(reader, 1):
                # Normalize row keys
                normalized_row = {}
                for key, value in row.items():
                    norm_key = COLUMN_MAPPING.get(key.lower().strip(), key.lower().strip().replace(' ', '_'))
                    normalized_row[norm_key] = (value or '').strip()
                
                production_code = normalized_row.get('production_code', '')
                production_name = normalized_row.get('production_name', '')
                knowledge_domain = normalized_row.get('knowledge_domain', '')
                measurement_unit = normalized_row.get('measurement_unit', '').upper()
                
                # Skip invalid rows
                if not production_code or not production_name or not knowledge_domain or not measurement_unit:
                    continue
                
                domain_id = domains.get(knowledge_domain.lower())
                unit_id = units.get(measurement_unit)
                
                if not domain_id or not unit_id:
                    continue
                
                # Parse numeric fields
                def parse_float(value):
                    if not value:
                        return None
                    try:
                        return float(value.replace(',', '').replace('$', '').strip())
                    except ValueError:
                        return None
                
                # Parse service categories
                service_category_ids = []
                service_cats_raw = normalized_row.get('service_categories', '')
                if service_cats_raw:
                    for cat in service_cats_raw.split(','):
                        cat = cat.strip()
                        if cat:
                            cat_id = categories.get(cat.lower())
                            if cat_id:
                                service_category_ids.append(cat_id)
                
                item_data = {
                    "organization_id": org_id,
                    "production_code": production_code,
                    "production_name": production_name,
                    "knowledge_domain_id": domain_id,
                    "measurement_unit_id": unit_id,
                    "production_per_day": parse_float(normalized_row.get('production_per_day')),
                    "crew_size": parse_float(normalized_row.get('crew_size')) or 1,
                    "labour_hours": parse_float(normalized_row.get('labour_hours')),
                    "standard_rate": parse_float(normalized_row.get('standard_rate')),
                    "premium_rate": parse_float(normalized_row.get('premium_rate')),
                    "complex_rate": parse_float(normalized_row.get('complex_rate')),
                    "is_company_standard": normalized_row.get('is_company_standard', '').lower() in ('true', 'yes', '1', 'y'),
                    "notes": normalized_row.get('notes') or None,
                    "created_by": user_id
                }
                
                try:
                    # Check if exists
                    existing_resp = await client.get(
                        f"{config.SUPABASE_URL}/rest/v1/production_items?"
                        f"organization_id=eq.{org_id}&"
                        f"production_code=eq.{production_code}",
                        headers=headers
                    )
                    
                    if existing_resp.status_code == 200 and existing_resp.json():
                        if update_existing:
                            existing_item = existing_resp.json()[0]
                            update_data = {k: v for k, v in item_data.items() 
                                         if k not in ['organization_id', 'created_by'] and v is not None}
                            update_data['updated_by'] = user_id
                            update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
                            
                            await client.patch(
                                f"{config.SUPABASE_URL}/rest/v1/production_items?id=eq.{existing_item['id']}",
                                headers=headers,
                                json=update_data
                            )
                            
                            # Update service categories
                            if service_category_ids:
                                await client.delete(
                                    f"{config.SUPABASE_URL}/rest/v1/production_item_service_categories?"
                                    f"production_item_id=eq.{existing_item['id']}",
                                    headers=headers
                                )
                                for sc_id in service_category_ids:
                                    await client.post(
                                        f"{config.SUPABASE_URL}/rest/v1/production_item_service_categories",
                                        headers=headers,
                                        json={"production_item_id": existing_item['id'], "service_category_id": sc_id}
                                    )
                            
                            results['updated'] += 1
                        else:
                            results['skipped'] += 1
                    else:
                        # Create new
                        create_resp = await client.post(
                            f"{config.SUPABASE_URL}/rest/v1/production_items",
                            headers=headers,
                            json=item_data
                        )
                        
                        if create_resp.status_code == 201:
                            created_item = create_resp.json()[0]
                            
                            # Create service category links
                            for sc_id in service_category_ids:
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
                                    "change_reason": "Imported from CSV",
                                    "created_by": user_id
                                }
                            )
                            
                            results['created'] += 1
                        else:
                            results['errors'] += 1
                            results['import_errors'].append({
                                "row": i,
                                "production_code": production_code,
                                "error": f"Database error: {create_resp.status_code}"
                            })
                            
                except Exception as e:
                    results['errors'] += 1
                    results['import_errors'].append({
                        "row": i,
                        "production_code": production_code,
                        "error": str(e)
                    })
        
        total_imported = results['created'] + results['updated']
        
        return {
            "success": True,
            "message": f"Successfully imported {total_imported} production items",
            "results": results
        }
        
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
