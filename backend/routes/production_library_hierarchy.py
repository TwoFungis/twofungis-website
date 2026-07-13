"""
Production Library Hierarchy Routes - TradeOS Company Knowledge Engine v2.0
==========================================================================

Six-Level Hierarchy:
1. Knowledge Domain (Finish Carpentry, Doors & Hardware)
2. Service Category (Residential, Commercial, Multifamily)
3. Area (Lobby, Corridors, Suites)
4. Phase (Framing, Rough-In, Finishing)
5. Division (CSI MasterFormat: 06-Wood, 09-Finishes)
6. Production Item (the atomic work units)

Supporting entities:
- Trade Disciplines
- Cost Codes
"""

from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
import logging
import httpx
import jwt

from config import config

router = APIRouter(prefix="/api/production-library", tags=["production-library-hierarchy"])
logger = logging.getLogger(__name__)

# =====================================================
# PYDANTIC MODELS
# =====================================================

class AreaCreate(BaseModel):
    code: Optional[str] = None
    name: str
    description: Optional[str] = None
    service_category_id: Optional[str] = None
    sort_order: Optional[int] = 0
    icon: Optional[str] = None
    color: Optional[str] = None

class PhaseCreate(BaseModel):
    code: Optional[str] = None
    name: str
    description: Optional[str] = None
    area_id: Optional[str] = None
    sort_order: Optional[int] = 0
    icon: Optional[str] = None
    color: Optional[str] = None

class DivisionCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    phase_id: Optional[str] = None
    sort_order: Optional[int] = 0
    icon: Optional[str] = None
    color: Optional[str] = None

class TradeDisciplineCreate(BaseModel):
    code: Optional[str] = None
    name: str
    description: Optional[str] = None
    division_id: Optional[str] = None
    sort_order: Optional[int] = 0
    icon: Optional[str] = None
    color: Optional[str] = None

class CostCodeCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    code_type: Optional[str] = "labour"
    division_id: Optional[str] = None
    gl_account: Optional[str] = None

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
# AREAS (Level 3)
# =====================================================

@router.get("/areas")
async def get_areas(
    authorization: str = Header(...),
    service_category_id: Optional[str] = Query(None),
    include_inactive: bool = Query(False)
):
    """Get all production areas for the organization"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            query = f"organization_id=eq.{org_id}"
            if not include_inactive:
                query += "&is_active=eq.true"
            if service_category_id:
                query += f"&service_category_id=eq.{service_category_id}"
            
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/production_areas?"
                f"{query}&order=sort_order.asc,name.asc",
                headers=await get_service_headers()
            )
            
            if response.status_code == 200:
                areas = response.json()
                return {"success": True, "areas": areas, "count": len(areas)}
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch areas")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching areas: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/areas")
async def create_area(
    area: AreaCreate,
    authorization: str = Header(...)
):
    """Create a new production area"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    user_id = context['user_id']
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{config.SUPABASE_URL}/rest/v1/production_areas",
                headers=await get_service_headers(),
                json={
                    "organization_id": org_id,
                    "created_by": user_id,
                    **area.model_dump(exclude_none=True)
                }
            )
            
            if response.status_code == 201:
                created = response.json()
                return {"success": True, "area": created[0] if created else None}
            elif response.status_code == 409:
                raise HTTPException(status_code=409, detail="Area with this name already exists")
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to create area")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating area: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/areas/{area_id}")
async def update_area(
    area_id: str,
    area: AreaCreate,
    authorization: str = Header(...)
):
    """Update a production area"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            update_data = {k: v for k, v in area.model_dump().items() if v is not None}
            update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
            
            response = await client.patch(
                f"{config.SUPABASE_URL}/rest/v1/production_areas?"
                f"id=eq.{area_id}&organization_id=eq.{org_id}",
                headers=await get_service_headers(),
                json=update_data
            )
            
            if response.status_code == 200:
                updated = response.json()
                if not updated:
                    raise HTTPException(status_code=404, detail="Area not found")
                return {"success": True, "area": updated[0]}
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to update area")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating area: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/areas/{area_id}")
async def delete_area(area_id: str, authorization: str = Header(...)):
    """Soft delete a production area"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.patch(
                f"{config.SUPABASE_URL}/rest/v1/production_areas?"
                f"id=eq.{area_id}&organization_id=eq.{org_id}",
                headers=await get_service_headers(),
                json={"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}
            )
            
            if response.status_code == 200:
                return {"success": True}
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to delete area")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting area: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================
# PHASES (Level 4)
# =====================================================

@router.get("/phases")
async def get_phases(
    authorization: str = Header(...),
    area_id: Optional[str] = Query(None),
    include_inactive: bool = Query(False)
):
    """Get all production phases for the organization"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            query = f"organization_id=eq.{org_id}"
            if not include_inactive:
                query += "&is_active=eq.true"
            if area_id:
                query += f"&area_id=eq.{area_id}"
            
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/production_phases?"
                f"{query}&order=sort_order.asc,name.asc",
                headers=await get_service_headers()
            )
            
            if response.status_code == 200:
                phases = response.json()
                return {"success": True, "phases": phases, "count": len(phases)}
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch phases")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching phases: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/phases")
async def create_phase(
    phase: PhaseCreate,
    authorization: str = Header(...)
):
    """Create a new production phase"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    user_id = context['user_id']
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{config.SUPABASE_URL}/rest/v1/production_phases",
                headers=await get_service_headers(),
                json={
                    "organization_id": org_id,
                    "created_by": user_id,
                    **phase.model_dump(exclude_none=True)
                }
            )
            
            if response.status_code == 201:
                created = response.json()
                return {"success": True, "phase": created[0] if created else None}
            elif response.status_code == 409:
                raise HTTPException(status_code=409, detail="Phase with this name already exists")
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to create phase")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating phase: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/phases/{phase_id}")
async def update_phase(
    phase_id: str,
    phase: PhaseCreate,
    authorization: str = Header(...)
):
    """Update a production phase"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            update_data = {k: v for k, v in phase.model_dump().items() if v is not None}
            update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
            
            response = await client.patch(
                f"{config.SUPABASE_URL}/rest/v1/production_phases?"
                f"id=eq.{phase_id}&organization_id=eq.{org_id}",
                headers=await get_service_headers(),
                json=update_data
            )
            
            if response.status_code == 200:
                updated = response.json()
                if not updated:
                    raise HTTPException(status_code=404, detail="Phase not found")
                return {"success": True, "phase": updated[0]}
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to update phase")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating phase: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/phases/{phase_id}")
async def delete_phase(phase_id: str, authorization: str = Header(...)):
    """Soft delete a production phase"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.patch(
                f"{config.SUPABASE_URL}/rest/v1/production_phases?"
                f"id=eq.{phase_id}&organization_id=eq.{org_id}",
                headers=await get_service_headers(),
                json={"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}
            )
            
            if response.status_code == 200:
                return {"success": True}
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to delete phase")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting phase: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================
# DIVISIONS (Level 5 - CSI MasterFormat)
# =====================================================

@router.get("/divisions")
async def get_divisions(
    authorization: str = Header(...),
    phase_id: Optional[str] = Query(None),
    include_inactive: bool = Query(False)
):
    """Get all production divisions for the organization"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            query = f"organization_id=eq.{org_id}"
            if not include_inactive:
                query += "&is_active=eq.true"
            if phase_id:
                query += f"&phase_id=eq.{phase_id}"
            
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/production_divisions?"
                f"{query}&order=sort_order.asc,code.asc",
                headers=await get_service_headers()
            )
            
            if response.status_code == 200:
                divisions = response.json()
                return {"success": True, "divisions": divisions, "count": len(divisions)}
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch divisions")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching divisions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/divisions")
async def create_division(
    division: DivisionCreate,
    authorization: str = Header(...)
):
    """Create a new production division"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    user_id = context['user_id']
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{config.SUPABASE_URL}/rest/v1/production_divisions",
                headers=await get_service_headers(),
                json={
                    "organization_id": org_id,
                    "created_by": user_id,
                    **division.model_dump(exclude_none=True)
                }
            )
            
            if response.status_code == 201:
                created = response.json()
                return {"success": True, "division": created[0] if created else None}
            elif response.status_code == 409:
                raise HTTPException(status_code=409, detail="Division with this code already exists")
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to create division")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating division: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/divisions/{division_id}")
async def update_division(
    division_id: str,
    division: DivisionCreate,
    authorization: str = Header(...)
):
    """Update a production division"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            update_data = {k: v for k, v in division.model_dump().items() if v is not None}
            update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
            
            response = await client.patch(
                f"{config.SUPABASE_URL}/rest/v1/production_divisions?"
                f"id=eq.{division_id}&organization_id=eq.{org_id}",
                headers=await get_service_headers(),
                json=update_data
            )
            
            if response.status_code == 200:
                updated = response.json()
                if not updated:
                    raise HTTPException(status_code=404, detail="Division not found")
                return {"success": True, "division": updated[0]}
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to update division")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating division: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/divisions/{division_id}")
async def delete_division(division_id: str, authorization: str = Header(...)):
    """Soft delete a production division"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.patch(
                f"{config.SUPABASE_URL}/rest/v1/production_divisions?"
                f"id=eq.{division_id}&organization_id=eq.{org_id}",
                headers=await get_service_headers(),
                json={"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}
            )
            
            if response.status_code == 200:
                return {"success": True}
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to delete division")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting division: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================
# TRADE DISCIPLINES
# =====================================================

@router.get("/trade-disciplines")
async def get_trade_disciplines(
    authorization: str = Header(...),
    include_inactive: bool = Query(False)
):
    """Get all trade disciplines for the organization"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            query = f"organization_id=eq.{org_id}"
            if not include_inactive:
                query += "&is_active=eq.true"
            
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/trade_disciplines?"
                f"{query}&order=sort_order.asc,name.asc",
                headers=await get_service_headers()
            )
            
            if response.status_code == 200:
                disciplines = response.json()
                return {"success": True, "disciplines": disciplines, "count": len(disciplines)}
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch disciplines")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching disciplines: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/trade-disciplines")
async def create_trade_discipline(
    discipline: TradeDisciplineCreate,
    authorization: str = Header(...)
):
    """Create a new trade discipline"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    user_id = context['user_id']
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{config.SUPABASE_URL}/rest/v1/trade_disciplines",
                headers=await get_service_headers(),
                json={
                    "organization_id": org_id,
                    "created_by": user_id,
                    **discipline.model_dump(exclude_none=True)
                }
            )
            
            if response.status_code == 201:
                created = response.json()
                return {"success": True, "discipline": created[0] if created else None}
            elif response.status_code == 409:
                raise HTTPException(status_code=409, detail="Discipline with this name already exists")
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to create discipline")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating discipline: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================
# COST CODES
# =====================================================

@router.get("/cost-codes")
async def get_cost_codes(
    authorization: str = Header(...),
    code_type: Optional[str] = Query(None),
    division_id: Optional[str] = Query(None),
    include_inactive: bool = Query(False)
):
    """Get all cost codes for the organization"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            query = f"organization_id=eq.{org_id}"
            if not include_inactive:
                query += "&is_active=eq.true"
            if code_type:
                query += f"&code_type=eq.{code_type}"
            if division_id:
                query += f"&division_id=eq.{division_id}"
            
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/cost_codes?"
                f"{query}&order=code.asc",
                headers=await get_service_headers()
            )
            
            if response.status_code == 200:
                codes = response.json()
                return {"success": True, "cost_codes": codes, "count": len(codes)}
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch cost codes")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching cost codes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cost-codes")
async def create_cost_code(
    cost_code: CostCodeCreate,
    authorization: str = Header(...)
):
    """Create a new cost code"""
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    user_id = context['user_id']
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{config.SUPABASE_URL}/rest/v1/cost_codes",
                headers=await get_service_headers(),
                json={
                    "organization_id": org_id,
                    "created_by": user_id,
                    **cost_code.model_dump(exclude_none=True)
                }
            )
            
            if response.status_code == 201:
                created = response.json()
                return {"success": True, "cost_code": created[0] if created else None}
            elif response.status_code == 409:
                raise HTTPException(status_code=409, detail="Cost code already exists")
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to create cost code")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating cost code: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================
# HIERARCHY STATISTICS & NAVIGATION
# =====================================================

@router.get("/hierarchy")
async def get_full_hierarchy(authorization: str = Header(...)):
    """
    Get the complete production library hierarchy with counts.
    Useful for navigation trees and overview dashboards.
    """
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            headers = await get_service_headers()
            
            # Fetch all hierarchy levels in parallel
            domains_req = client.get(
                f"{config.SUPABASE_URL}/rest/v1/knowledge_domains?"
                f"organization_id=eq.{org_id}&is_active=eq.true&select=id,code,name,description,sort_order,icon,color",
                headers=headers
            )
            categories_req = client.get(
                f"{config.SUPABASE_URL}/rest/v1/service_categories?"
                f"organization_id=eq.{org_id}&is_active=eq.true&select=id,code,name,description,sort_order,icon,color",
                headers=headers
            )
            areas_req = client.get(
                f"{config.SUPABASE_URL}/rest/v1/production_areas?"
                f"organization_id=eq.{org_id}&is_active=eq.true&select=id,code,name,description,sort_order,icon,color,service_category_id",
                headers=headers
            )
            phases_req = client.get(
                f"{config.SUPABASE_URL}/rest/v1/production_phases?"
                f"organization_id=eq.{org_id}&is_active=eq.true&select=id,code,name,description,sort_order,icon,color,area_id",
                headers=headers
            )
            divisions_req = client.get(
                f"{config.SUPABASE_URL}/rest/v1/production_divisions?"
                f"organization_id=eq.{org_id}&is_active=eq.true&select=id,code,name,description,sort_order,icon,color,phase_id,is_system",
                headers=headers
            )
            items_req = client.get(
                f"{config.SUPABASE_URL}/rest/v1/production_items?"
                f"organization_id=eq.{org_id}&is_active=eq.true&select=id,knowledge_domain_id,division_id",
                headers=headers
            )
            disciplines_req = client.get(
                f"{config.SUPABASE_URL}/rest/v1/trade_disciplines?"
                f"organization_id=eq.{org_id}&is_active=eq.true&select=id,code,name,sort_order",
                headers=headers
            )
            
            # Await all responses
            domains_res = await domains_req
            categories_res = await categories_req
            areas_res = await areas_req
            phases_res = await phases_req
            divisions_res = await divisions_req
            items_res = await items_req
            disciplines_res = await disciplines_req
            
            domains = domains_res.json() if domains_res.status_code == 200 else []
            categories = categories_res.json() if categories_res.status_code == 200 else []
            areas = areas_res.json() if areas_res.status_code == 200 else []
            phases = phases_res.json() if phases_res.status_code == 200 else []
            divisions = divisions_res.json() if divisions_res.status_code == 200 else []
            items = items_res.json() if items_res.status_code == 200 else []
            disciplines = disciplines_res.json() if disciplines_res.status_code == 200 else []
            
            # Count items per domain
            domain_counts = {}
            for item in items:
                domain_id = item.get('knowledge_domain_id')
                if domain_id:
                    domain_counts[domain_id] = domain_counts.get(domain_id, 0) + 1
            
            # Count items per division
            division_counts = {}
            for item in items:
                division_id = item.get('division_id')
                if division_id:
                    division_counts[division_id] = division_counts.get(division_id, 0) + 1
            
            # Add counts to domains
            for domain in domains:
                domain['item_count'] = domain_counts.get(domain['id'], 0)
            
            # Add counts to divisions
            for division in divisions:
                division['item_count'] = division_counts.get(division['id'], 0)
            
            return {
                "success": True,
                "hierarchy": {
                    "knowledge_domains": domains,
                    "service_categories": categories,
                    "areas": areas,
                    "phases": phases,
                    "divisions": divisions,
                    "trade_disciplines": disciplines
                },
                "counts": {
                    "knowledge_domains": len(domains),
                    "service_categories": len(categories),
                    "areas": len(areas),
                    "phases": len(phases),
                    "divisions": len(divisions),
                    "production_items": len(items),
                    "trade_disciplines": len(disciplines)
                }
            }
            
    except Exception as e:
        logger.error(f"Error fetching hierarchy: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================
# SEED V2 HIERARCHY
# =====================================================

@router.post("/seed/v2")
async def seed_v2_hierarchy(authorization: str = Header(...)):
    """
    Seed the expanded production library hierarchy.
    Creates default CSI divisions, trade disciplines, areas, and phases.
    """
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    user_id = context['user_id']
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = await get_service_headers()
            
            # Check if already seeded
            divisions_check = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/production_divisions?"
                f"organization_id=eq.{org_id}&limit=1",
                headers=headers
            )
            
            # CSI MasterFormat Divisions
            csi_divisions = [
                {"code": "01", "name": "General Requirements", "description": "Summary, schedules, coordination, temporary facilities", "sort_order": 1},
                {"code": "02", "name": "Existing Conditions", "description": "Subsurface investigation, demolition, remediation", "sort_order": 2},
                {"code": "03", "name": "Concrete", "description": "Cast-in-place, precast, grouting", "sort_order": 3},
                {"code": "04", "name": "Masonry", "description": "Unit masonry, stone, assemblies", "sort_order": 4},
                {"code": "05", "name": "Metals", "description": "Structural steel, joists, decking, fabrications", "sort_order": 5},
                {"code": "06", "name": "Wood & Plastics", "description": "Rough carpentry, finish carpentry, millwork", "sort_order": 6},
                {"code": "07", "name": "Thermal & Moisture", "description": "Waterproofing, insulation, roofing, siding", "sort_order": 7},
                {"code": "08", "name": "Openings", "description": "Doors, windows, hardware, glazing", "sort_order": 8},
                {"code": "09", "name": "Finishes", "description": "Drywall, tile, flooring, painting", "sort_order": 9},
                {"code": "10", "name": "Specialties", "description": "Signage, lockers, toilet accessories", "sort_order": 10},
                {"code": "11", "name": "Equipment", "description": "Commercial equipment, appliances", "sort_order": 11},
                {"code": "12", "name": "Furnishings", "description": "Window treatments, furniture, casework", "sort_order": 12},
            ]
            
            # Trade Disciplines
            trades = [
                {"code": "CARP", "name": "Carpentry", "description": "Rough and finish carpentry, framing", "sort_order": 1},
                {"code": "MILL", "name": "Millwork", "description": "Custom millwork, cabinetry, architectural woodwork", "sort_order": 2},
                {"code": "DOOR", "name": "Doors & Hardware", "description": "Door installation, hardware, closers", "sort_order": 3},
                {"code": "DRYW", "name": "Drywall", "description": "Drywall installation, taping, finishing", "sort_order": 4},
                {"code": "TILE", "name": "Tile & Stone", "description": "Ceramic, porcelain, natural stone installation", "sort_order": 5},
                {"code": "FLOR", "name": "Flooring", "description": "Hardwood, vinyl, carpet, resilient flooring", "sort_order": 6},
                {"code": "PANT", "name": "Painting", "description": "Interior/exterior painting, staining, finishing", "sort_order": 7},
                {"code": "LABR", "name": "General Labour", "description": "General labour, cleanup, material handling", "sort_order": 8},
            ]
            
            # Areas
            areas = [
                {"code": "LOBBY", "name": "Lobby", "description": "Main entrance and reception areas", "sort_order": 1},
                {"code": "CORR", "name": "Corridors", "description": "Hallways and common circulation", "sort_order": 2},
                {"code": "AMEN", "name": "Amenity Space", "description": "Common amenity rooms and facilities", "sort_order": 3},
                {"code": "SUITE", "name": "Suites", "description": "Individual residential or office units", "sort_order": 4},
                {"code": "PARK", "name": "Parking", "description": "Underground and surface parking", "sort_order": 5},
                {"code": "GEN", "name": "General", "description": "General/unassigned areas", "sort_order": 99},
            ]
            
            # Phases
            phases = [
                {"code": "PREP", "name": "Preparation", "description": "Site prep, layout, protection", "sort_order": 1},
                {"code": "DEMO", "name": "Demolition", "description": "Selective and complete demolition", "sort_order": 2},
                {"code": "FRAM", "name": "Framing", "description": "Wood and steel framing", "sort_order": 3},
                {"code": "RUGH", "name": "Rough-In", "description": "Mechanical, electrical, plumbing rough-in", "sort_order": 4},
                {"code": "TRIM", "name": "Trim & Millwork", "description": "Doors, trim, millwork installation", "sort_order": 5},
                {"code": "FLOR", "name": "Flooring", "description": "Flooring installation", "sort_order": 6},
                {"code": "PANT", "name": "Painting", "description": "Painting and finishing", "sort_order": 7},
                {"code": "PNCH", "name": "Punchlist", "description": "Deficiency corrections and touch-ups", "sort_order": 8},
            ]
            
            results = {
                "divisions_created": 0,
                "disciplines_created": 0,
                "areas_created": 0,
                "phases_created": 0
            }
            
            # Seed divisions if empty
            if divisions_check.status_code == 200 and not divisions_check.json():
                for div in csi_divisions:
                    response = await client.post(
                        f"{config.SUPABASE_URL}/rest/v1/production_divisions",
                        headers=headers,
                        json={
                            "organization_id": org_id,
                            "created_by": user_id,
                            "is_system": True,
                            **div
                        }
                    )
                    if response.status_code == 201:
                        results["divisions_created"] += 1
            
            # Check and seed disciplines
            disciplines_check = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/trade_disciplines?"
                f"organization_id=eq.{org_id}&limit=1",
                headers=headers
            )
            if disciplines_check.status_code == 200 and not disciplines_check.json():
                for trade in trades:
                    response = await client.post(
                        f"{config.SUPABASE_URL}/rest/v1/trade_disciplines",
                        headers=headers,
                        json={
                            "organization_id": org_id,
                            "created_by": user_id,
                            **trade
                        }
                    )
                    if response.status_code == 201:
                        results["disciplines_created"] += 1
            
            # Check and seed areas
            areas_check = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/production_areas?"
                f"organization_id=eq.{org_id}&limit=1",
                headers=headers
            )
            if areas_check.status_code == 200 and not areas_check.json():
                for area in areas:
                    response = await client.post(
                        f"{config.SUPABASE_URL}/rest/v1/production_areas",
                        headers=headers,
                        json={
                            "organization_id": org_id,
                            "created_by": user_id,
                            **area
                        }
                    )
                    if response.status_code == 201:
                        results["areas_created"] += 1
            
            # Check and seed phases
            phases_check = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/production_phases?"
                f"organization_id=eq.{org_id}&limit=1",
                headers=headers
            )
            if phases_check.status_code == 200 and not phases_check.json():
                for phase in phases:
                    response = await client.post(
                        f"{config.SUPABASE_URL}/rest/v1/production_phases",
                        headers=headers,
                        json={
                            "organization_id": org_id,
                            "created_by": user_id,
                            **phase
                        }
                    )
                    if response.status_code == 201:
                        results["phases_created"] += 1
            
            return {
                "success": True,
                "message": "V2 hierarchy seeded successfully",
                "results": results
            }
            
    except Exception as e:
        logger.error(f"Error seeding v2 hierarchy: {e}")
        raise HTTPException(status_code=500, detail=str(e))
