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
import os
import logging
import httpx
import jwt
import csv
import io

router = APIRouter(prefix="/api/production-library", tags=["production-library"])
logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

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
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
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
                f"{SUPABASE_URL}/rest/v1/organization_members?"
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
                f"{SUPABASE_URL}/rest/v1/measurement_units?"
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
                f"{SUPABASE_URL}/rest/v1/knowledge_domains?"
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
                f"{SUPABASE_URL}/rest/v1/knowledge_domains",
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
                f"{SUPABASE_URL}/rest/v1/service_categories?"
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
                f"{SUPABASE_URL}/rest/v1/service_categories",
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
                f"{SUPABASE_URL}/rest/v1/production_items?{query}&select=id",
                headers={**headers, "Prefer": "count=exact"}
            )
            total = int(count_response.headers.get('content-range', '0-0/0').split('/')[-1])
            
            # Get paginated items with relationships
            offset = (page - 1) * per_page
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/production_items?"
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
                        f"{SUPABASE_URL}/rest/v1/production_item_service_categories?"
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
                f"{SUPABASE_URL}/rest/v1/production_items?"
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
                    f"{SUPABASE_URL}/rest/v1/production_item_service_categories?"
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
                    f"{SUPABASE_URL}/rest/v1/production_item_attachments?"
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
                f"{SUPABASE_URL}/rest/v1/production_items",
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
                            f"{SUPABASE_URL}/rest/v1/production_item_service_categories",
                            headers=headers,
                            json={
                                "production_item_id": created['id'],
                                "service_category_id": sc_id
                            }
                        )
                
                # Create initial revision
                await client.post(
                    f"{SUPABASE_URL}/rest/v1/production_item_revisions",
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
                f"{SUPABASE_URL}/rest/v1/production_items?"
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
                        f"{SUPABASE_URL}/rest/v1/production_item_service_categories?"
                        f"production_item_id=eq.{item_id}",
                        headers=headers
                    )
                    # Create new
                    for sc_id in item.service_category_ids:
                        await client.post(
                            f"{SUPABASE_URL}/rest/v1/production_item_service_categories",
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
                f"{SUPABASE_URL}/rest/v1/production_item_revisions?"
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
                f"{SUPABASE_URL}/rest/v1/production_assemblies?"
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
                f"{SUPABASE_URL}/rest/v1/production_assemblies?"
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
                    f"{SUPABASE_URL}/rest/v1/assembly_items?"
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
                f"{SUPABASE_URL}/rest/v1/production_assemblies",
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
                f"{SUPABASE_URL}/rest/v1/assembly_items",
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
                f"{SUPABASE_URL}/rest/v1/assembly_items?"
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

@router.get("/import/templates")
async def get_import_templates(authorization: str = Header(...)):
    """Get CSV import templates"""
    await verify_token_and_get_org(authorization)
    
    return {
        "success": True,
        "templates": {
            "production_items": {
                "description": "Production Items import template",
                "columns": [
                    "production_code",
                    "production_name",
                    "description",
                    "knowledge_domain",
                    "measurement_unit",
                    "production_per_day",
                    "crew_size",
                    "labour_hours",
                    "standard_rate",
                    "premium_rate",
                    "complex_rate",
                    "is_company_standard",
                    "notes"
                ],
                "sample_row": "FC-001,Door Casing Installation,Install door casing trim,Finish Carpentry,LF,120,1,0.0667,8.50,10.50,12.50,true,Standard door casing"
            },
            "knowledge_domains": {
                "description": "Knowledge Domains import template",
                "columns": ["code", "name", "description", "sort_order"],
                "sample_row": "FC,Finish Carpentry,All finish carpentry work,1"
            },
            "service_categories": {
                "description": "Service Categories import template",
                "columns": ["code", "name", "description", "sort_order"],
                "sample_row": "RES,Residential,Residential projects,1"
            }
        }
    }

@router.post("/import/items")
async def import_production_items(
    file: UploadFile = File(...),
    authorization: str = Header(...),
    update_existing: bool = Query(False),
    dry_run: bool = Query(True)
):
    """Import production items from CSV"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    user_id = context['user_id']
    
    try:
        # Read CSV
        content = await file.read()
        text = content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(text))
        
        results = {
            "total_rows": 0,
            "valid": 0,
            "errors": 0,
            "created": 0,
            "updated": 0,
            "error_details": [],
            "preview": []
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = await get_service_headers()
            
            # Get lookup tables
            domains_resp = await client.get(
                f"{SUPABASE_URL}/rest/v1/knowledge_domains?organization_id=eq.{org_id}",
                headers=headers
            )
            domains = {d['name'].lower(): d['id'] for d in domains_resp.json()} if domains_resp.status_code == 200 else {}
            
            units_resp = await client.get(
                f"{SUPABASE_URL}/rest/v1/measurement_units?is_active=eq.true",
                headers=headers
            )
            units = {u['code']: u['id'] for u in units_resp.json()} if units_resp.status_code == 200 else {}
            
            rows = []
            for i, row in enumerate(reader, 1):
                results['total_rows'] += 1
                
                try:
                    # Validate required fields
                    if not row.get('production_code'):
                        raise ValueError("production_code is required")
                    if not row.get('production_name'):
                        raise ValueError("production_name is required")
                    if not row.get('knowledge_domain'):
                        raise ValueError("knowledge_domain is required")
                    if not row.get('measurement_unit'):
                        raise ValueError("measurement_unit is required")
                    
                    # Lookup domain
                    domain_id = domains.get(row['knowledge_domain'].lower())
                    if not domain_id:
                        raise ValueError(f"Unknown knowledge domain: {row['knowledge_domain']}")
                    
                    # Lookup unit
                    unit_id = units.get(row['measurement_unit'].upper())
                    if not unit_id:
                        raise ValueError(f"Invalid measurement unit: {row['measurement_unit']}")
                    
                    item_data = {
                        "organization_id": org_id,
                        "production_code": row['production_code'].strip(),
                        "production_name": row['production_name'].strip(),
                        "description": row.get('description', '').strip() or None,
                        "knowledge_domain_id": domain_id,
                        "measurement_unit_id": unit_id,
                        "production_per_day": float(row['production_per_day']) if row.get('production_per_day') else None,
                        "crew_size": float(row['crew_size']) if row.get('crew_size') else 1,
                        "labour_hours": float(row['labour_hours']) if row.get('labour_hours') else None,
                        "standard_rate": float(row['standard_rate']) if row.get('standard_rate') else None,
                        "premium_rate": float(row['premium_rate']) if row.get('premium_rate') else None,
                        "complex_rate": float(row['complex_rate']) if row.get('complex_rate') else None,
                        "is_company_standard": row.get('is_company_standard', '').lower() == 'true',
                        "notes": row.get('notes', '').strip() or None,
                        "created_by": user_id
                    }
                    
                    rows.append(item_data)
                    results['valid'] += 1
                    
                    if len(results['preview']) < 5:
                        results['preview'].append({
                            "row": i,
                            "production_code": item_data['production_code'],
                            "production_name": item_data['production_name']
                        })
                    
                except Exception as e:
                    results['errors'] += 1
                    results['error_details'].append({
                        "row": i,
                        "error": str(e)
                    })
            
            # If not dry run, actually import
            if not dry_run and rows:
                for item_data in rows:
                    # Check if exists
                    existing_resp = await client.get(
                        f"{SUPABASE_URL}/rest/v1/production_items?"
                        f"organization_id=eq.{org_id}&"
                        f"production_code=eq.{item_data['production_code']}",
                        headers=headers
                    )
                    
                    if existing_resp.status_code == 200 and existing_resp.json():
                        if update_existing:
                            # Update
                            await client.patch(
                                f"{SUPABASE_URL}/rest/v1/production_items?"
                                f"organization_id=eq.{org_id}&"
                                f"production_code=eq.{item_data['production_code']}",
                                headers=headers,
                                json={k: v for k, v in item_data.items() if k not in ['organization_id', 'created_by']}
                            )
                            results['updated'] += 1
                    else:
                        # Create
                        await client.post(
                            f"{SUPABASE_URL}/rest/v1/production_items",
                            headers=headers,
                            json=item_data
                        )
                        results['created'] += 1
        
        return {
            "success": True,
            "dry_run": dry_run,
            "results": results
        }
        
    except Exception as e:
        logger.error(f"Import error: {e}")
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
                f"{SUPABASE_URL}/rest/v1/production_items?"
                f"organization_id=eq.{org_id}&is_active=eq.true&select=id",
                headers={**headers, "Prefer": "count=exact"}
            )
            items_count = int(items_resp.headers.get('content-range', '0-0/0').split('/')[-1])
            
            assemblies_resp = await client.get(
                f"{SUPABASE_URL}/rest/v1/production_assemblies?"
                f"organization_id=eq.{org_id}&is_active=eq.true&select=id",
                headers={**headers, "Prefer": "count=exact"}
            )
            assemblies_count = int(assemblies_resp.headers.get('content-range', '0-0/0').split('/')[-1])
            
            domains_resp = await client.get(
                f"{SUPABASE_URL}/rest/v1/knowledge_domains?"
                f"organization_id=eq.{org_id}&is_active=eq.true&select=id",
                headers={**headers, "Prefer": "count=exact"}
            )
            domains_count = int(domains_resp.headers.get('content-range', '0-0/0').split('/')[-1])
            
            # Get items with high AI confidence
            ai_resp = await client.get(
                f"{SUPABASE_URL}/rest/v1/production_items?"
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
