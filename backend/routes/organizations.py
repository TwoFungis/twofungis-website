"""
Organizations Routes - Phase 1A
================================
Multi-tenant organization management for TradeOS.

This module provides:
- Organization listing for current user
- Organization membership management
- Workspace switching support
- Platform administration (for platform admins)

COMPATIBILITY:
- Works alongside existing TFCS routes
- Uses same auth patterns
- Gradually replaces TFCS-specific functionality
"""

from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel
from typing import Optional, List
import os
import logging
import httpx
import jwt
from datetime import datetime, timezone

router = APIRouter(prefix="/api/organizations", tags=["organizations"])
logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

# =====================================================
# PYDANTIC MODELS
# =====================================================

class OrganizationSummary(BaseModel):
    """Summary of an organization for workspace switcher"""
    id: str
    name: str
    slug: Optional[str] = None
    role: str
    is_primary: bool
    is_platform: bool = False
    logo_url: Optional[str] = None

class OrganizationDetail(BaseModel):
    """Full organization details"""
    id: str
    name: str
    slug: Optional[str] = None
    primary_trade: Optional[str] = None
    province: Optional[str] = None
    subscription_tier: str
    subscription_status: str
    is_platform: bool = False
    is_active: bool = True
    created_at: str

class MemberInfo(BaseModel):
    """Organization member information"""
    id: str
    user_id: str
    email: Optional[str] = None
    name: Optional[str] = None
    role: str
    is_active: bool
    is_primary: bool
    joined_at: Optional[str] = None

class SetPrimaryRequest(BaseModel):
    """Request to set primary organization"""
    organization_id: str

class OrganizationSettings(BaseModel):
    """Organization settings"""
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    default_tax_rate: Optional[float] = None
    default_markup_percent: Optional[float] = None
    timezone: Optional[str] = None
    currency: Optional[str] = None

# =====================================================
# UTILITY FUNCTIONS
# =====================================================

async def get_service_headers():
    """Get headers for Supabase service role requests"""
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

async def verify_jwt_token(authorization: str) -> str:
    """Verify JWT token and return user_id"""
    try:
        token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
        decoded = jwt.decode(token, options={"verify_signature": False})
        user_id = decoded.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: no user_id")
        return user_id
    except jwt.DecodeError as e:
        logger.error(f"JWT decode error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token format")
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

async def is_platform_admin(user_id: str) -> bool:
    """Check if user is a platform administrator (system-level, not org-based)"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/platform_admins?"
                f"user_id=eq.{user_id}&"
                f"is_active=eq.true&"
                f"select=id,role",
                headers=await get_service_headers()
            )
            
            if response.status_code != 200:
                return False
            
            admins = response.json()
            return len(admins) > 0
    except Exception as e:
        logger.error(f"Error checking platform admin: {e}")
        return False

# =====================================================
# API ENDPOINTS - HEALTH (No Auth Required)
# =====================================================

@router.get("/health")
async def organizations_health():
    """Check organizations service health - no auth required"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/organizations?limit=1",
                headers=await get_service_headers()
            )
            
            if response.status_code == 200:
                return {
                    "status": "healthy",
                    "service": "organizations",
                    "tables_initialized": True
                }
            elif 'does not exist' in response.text:
                return {
                    "status": "pending",
                    "service": "organizations",
                    "tables_initialized": False,
                    "message": "Run migration 013_organization_foundation.sql"
                }
            else:
                return {
                    "status": "degraded",
                    "service": "organizations",
                    "error": response.text[:100]
                }
    except Exception as e:
        return {
            "status": "error",
            "service": "organizations",
            "error": str(e)[:100]
        }

# =====================================================
# API ENDPOINTS - WORKSPACE SWITCHER
# =====================================================

@router.get("/me")
async def get_my_organizations(authorization: str = Header(...)):
    """
    Get all organizations the current user belongs to.
    This powers the Workspace Switcher.
    
    Returns:
    - organizations: List of companies the user belongs to
    - is_platform_admin: Whether user has platform-level access (separate from orgs)
    - primary_organization_id: User's default workspace
    """
    user_id = await verify_jwt_token(authorization)
    
    try:
        async with httpx.AsyncClient() as client:
            # Check platform admin status (system-level, separate from orgs)
            platform_admin = await is_platform_admin(user_id)
            
            # Get platform role if admin
            platform_role = None
            if platform_admin:
                platform_response = await client.get(
                    f"{SUPABASE_URL}/rest/v1/platform_admins?"
                    f"user_id=eq.{user_id}&"
                    f"is_active=eq.true&"
                    f"select=role",
                    headers=await get_service_headers()
                )
                if platform_response.status_code == 200:
                    platform_data = platform_response.json()
                    if platform_data:
                        platform_role = platform_data[0].get('role')
            
            # Get all organization memberships
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/organization_members?"
                f"user_id=eq.{user_id}&"
                f"is_active=eq.true&"
                f"select=id,role,is_primary,organization_id,"
                f"organizations(id,name,slug,subscription_tier),"
                f"organization_settings:organization_id(logo_url)",
                headers=await get_service_headers()
            )
            
            if response.status_code != 200:
                # Tables might not exist yet - return empty gracefully
                if 'does not exist' in response.text or response.status_code == 404:
                    return {
                        "success": True,
                        "organizations": [],
                        "primary_organization_id": None,
                        "is_platform_admin": False,
                        "platform_role": None,
                        "message": "Organization tables not yet initialized"
                    }
                raise HTTPException(status_code=500, detail="Failed to fetch organizations")
            
            memberships = response.json()
            
            # Transform to response format
            organizations = []
            primary_org_id = None
            
            for membership in memberships:
                org = membership.get('organizations', {})
                settings = membership.get('organization_settings') or {}
                
                if not org:
                    continue
                
                org_summary = {
                    "id": org.get('id'),
                    "name": org.get('name'),
                    "slug": org.get('slug'),
                    "role": membership.get('role'),
                    "is_primary": membership.get('is_primary', False),
                    "subscription_tier": org.get('subscription_tier'),
                    "logo_url": settings.get('logo_url') if isinstance(settings, dict) else None
                }
                
                organizations.append(org_summary)
                
                if membership.get('is_primary'):
                    primary_org_id = org.get('id')
            
            # Sort: primary first, then alphabetical
            organizations.sort(key=lambda x: (
                not x.get('is_primary', False),
                x.get('name', '').lower()
            ))
            
            # If no primary set, use the first org
            if not primary_org_id and organizations:
                primary_org_id = organizations[0]['id']
            
            return {
                "success": True,
                "organizations": organizations,
                "primary_organization_id": primary_org_id,
                "count": len(organizations),
                "is_platform_admin": platform_admin,
                "platform_role": platform_role
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user organizations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/me/primary")
async def set_primary_organization(
    request: SetPrimaryRequest,
    authorization: str = Header(...)
):
    """
    Set the user's primary (default) organization.
    This is the workspace they land in after login.
    """
    user_id = await verify_jwt_token(authorization)
    
    try:
        async with httpx.AsyncClient() as client:
            # Verify user is member of this organization
            verify_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/organization_members?"
                f"user_id=eq.{user_id}&"
                f"organization_id=eq.{request.organization_id}&"
                f"is_active=eq.true&"
                f"select=id",
                headers=await get_service_headers()
            )
            
            if verify_response.status_code != 200 or not verify_response.json():
                raise HTTPException(status_code=403, detail="Not a member of this organization")
            
            # Clear existing primary flags
            await client.patch(
                f"{SUPABASE_URL}/rest/v1/organization_members?"
                f"user_id=eq.{user_id}&"
                f"is_primary=eq.true",
                headers=await get_service_headers(),
                json={"is_primary": False, "updated_at": datetime.now(timezone.utc).isoformat()}
            )
            
            # Set new primary
            response = await client.patch(
                f"{SUPABASE_URL}/rest/v1/organization_members?"
                f"user_id=eq.{user_id}&"
                f"organization_id=eq.{request.organization_id}",
                headers=await get_service_headers(),
                json={"is_primary": True, "updated_at": datetime.now(timezone.utc).isoformat()}
            )
            
            if response.status_code not in [200, 204]:
                raise HTTPException(status_code=500, detail="Failed to set primary organization")
            
            return {
                "success": True,
                "message": "Primary organization updated",
                "primary_organization_id": request.organization_id
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting primary organization: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================
# API ENDPOINTS - ORGANIZATION DETAILS
# =====================================================

@router.get("/{organization_id}")
async def get_organization(
    organization_id: str,
    authorization: str = Header(...)
):
    """
    Get details of a specific organization.
    User must be a member of the organization.
    """
    user_id = await verify_jwt_token(authorization)
    
    try:
        async with httpx.AsyncClient() as client:
            # Verify membership (or platform admin)
            is_admin = await is_platform_admin(user_id)
            
            if not is_admin:
                verify_response = await client.get(
                    f"{SUPABASE_URL}/rest/v1/organization_members?"
                    f"user_id=eq.{user_id}&"
                    f"organization_id=eq.{organization_id}&"
                    f"is_active=eq.true&"
                    f"select=id,role",
                    headers=await get_service_headers()
                )
                
                if verify_response.status_code != 200 or not verify_response.json():
                    raise HTTPException(status_code=403, detail="Not a member of this organization")
            
            # Get organization details
            org_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/organizations?"
                f"id=eq.{organization_id}&"
                f"select=*",
                headers=await get_service_headers()
            )
            
            if org_response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to fetch organization")
            
            orgs = org_response.json()
            if not orgs:
                raise HTTPException(status_code=404, detail="Organization not found")
            
            org = orgs[0]
            
            # Get settings
            settings_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/organization_settings?"
                f"organization_id=eq.{organization_id}&"
                f"select=*",
                headers=await get_service_headers()
            )
            
            settings = {}
            if settings_response.status_code == 200:
                settings_list = settings_response.json()
                if settings_list:
                    settings = settings_list[0]
            
            return {
                "success": True,
                "organization": {
                    "id": org.get('id'),
                    "name": org.get('name'),
                    "slug": org.get('slug'),
                    "primary_trade": org.get('primary_trade'),
                    "province": org.get('province'),
                    "country": org.get('country'),
                    "email": org.get('email'),
                    "phone": org.get('phone'),
                    "website": org.get('website'),
                    "subscription_tier": org.get('subscription_tier'),
                    "subscription_status": org.get('subscription_status'),
                    "is_platform": org.get('is_platform', False),
                    "is_active": org.get('is_active', True),
                    "created_at": org.get('created_at')
                },
                "settings": {
                    "logo_url": settings.get('logo_url'),
                    "primary_color": settings.get('primary_color'),
                    "secondary_color": settings.get('secondary_color'),
                    "default_tax_rate": settings.get('default_tax_rate'),
                    "default_markup_percent": settings.get('default_markup_percent'),
                    "default_overhead_percent": settings.get('default_overhead_percent'),
                    "default_contingency_percent": settings.get('default_contingency_percent'),
                    "timezone": settings.get('timezone'),
                    "currency": settings.get('currency')
                }
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching organization: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{organization_id}/members")
async def get_organization_members(
    organization_id: str,
    authorization: str = Header(...)
):
    """
    Get all members of an organization.
    User must be a member of the organization.
    """
    user_id = await verify_jwt_token(authorization)
    
    try:
        async with httpx.AsyncClient() as client:
            # Verify membership (or platform admin)
            is_admin = await is_platform_admin(user_id)
            
            if not is_admin:
                verify_response = await client.get(
                    f"{SUPABASE_URL}/rest/v1/organization_members?"
                    f"user_id=eq.{user_id}&"
                    f"organization_id=eq.{organization_id}&"
                    f"is_active=eq.true&"
                    f"select=id",
                    headers=await get_service_headers()
                )
                
                if verify_response.status_code != 200 or not verify_response.json():
                    raise HTTPException(status_code=403, detail="Not a member of this organization")
            
            # Get all members
            members_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/organization_members?"
                f"organization_id=eq.{organization_id}&"
                f"select=*&"
                f"order=role.asc,user_name.asc",
                headers=await get_service_headers()
            )
            
            if members_response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to fetch members")
            
            members = members_response.json()
            
            # Role sort order (owners first, then admin hierarchy)
            role_order = {
                'platform_admin': 0,
                'owner': 1,
                'admin': 2,
                'project_manager': 3,
                'estimator': 4,
                'foreman': 5,
                'office_admin': 6,
                'accounting': 7,
                'employee': 8,
                'client': 9,
                'builder': 10,
                'subcontractor': 11
            }
            
            # Sort by role hierarchy
            members.sort(key=lambda m: (role_order.get(m.get('role'), 99), m.get('user_name', '')))
            
            return {
                "success": True,
                "members": [{
                    "id": m.get('id'),
                    "user_id": m.get('user_id'),
                    "email": m.get('user_email'),
                    "name": m.get('user_name'),
                    "role": m.get('role'),
                    "is_active": m.get('is_active'),
                    "joined_at": m.get('accepted_at') or m.get('created_at')
                } for m in members],
                "count": len(members)
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching organization members: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================
# API ENDPOINTS - ROLE CHECK (COMPATIBILITY)
# =====================================================

@router.get("/me/role")
async def get_my_organization_role(
    authorization: str = Header(...),
    organization_id: Optional[str] = None
):
    """
    Get the current user's role in an organization.
    If no organization_id provided, returns role in primary organization.
    
    This endpoint provides compatibility during migration from TFCS roles.
    """
    user_id = await verify_jwt_token(authorization)
    
    try:
        async with httpx.AsyncClient() as client:
            # If no org specified, get primary
            if not organization_id:
                primary_response = await client.get(
                    f"{SUPABASE_URL}/rest/v1/organization_members?"
                    f"user_id=eq.{user_id}&"
                    f"is_primary=eq.true&"
                    f"is_active=eq.true&"
                    f"select=organization_id,role,organizations(name,is_platform)",
                    headers=await get_service_headers()
                )
                
                if primary_response.status_code == 200:
                    primaries = primary_response.json()
                    if primaries:
                        membership = primaries[0]
                        org = membership.get('organizations', {})
                        return {
                            "success": True,
                            "has_organization": True,
                            "organization_id": membership.get('organization_id'),
                            "organization_name": org.get('name'),
                            "role": membership.get('role'),
                            "is_platform": org.get('is_platform', False)
                        }
                
                # No primary - try to find any membership
                any_response = await client.get(
                    f"{SUPABASE_URL}/rest/v1/organization_members?"
                    f"user_id=eq.{user_id}&"
                    f"is_active=eq.true&"
                    f"select=organization_id,role,organizations(name,is_platform)&"
                    f"limit=1",
                    headers=await get_service_headers()
                )
                
                if any_response.status_code == 200:
                    memberships = any_response.json()
                    if memberships:
                        membership = memberships[0]
                        org = membership.get('organizations', {})
                        return {
                            "success": True,
                            "has_organization": True,
                            "organization_id": membership.get('organization_id'),
                            "organization_name": org.get('name'),
                            "role": membership.get('role'),
                            "is_platform": org.get('is_platform', False)
                        }
                
                return {
                    "success": True,
                    "has_organization": False,
                    "organization_id": None,
                    "role": None,
                    "message": "User is not a member of any organization"
                }
            
            # Specific organization requested
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/organization_members?"
                f"user_id=eq.{user_id}&"
                f"organization_id=eq.{organization_id}&"
                f"is_active=eq.true&"
                f"select=role,organizations(name,is_platform)",
                headers=await get_service_headers()
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to fetch role")
            
            memberships = response.json()
            
            if not memberships:
                return {
                    "success": True,
                    "has_organization": False,
                    "organization_id": organization_id,
                    "role": None,
                    "message": "User is not a member of this organization"
                }
            
            membership = memberships[0]
            org = membership.get('organizations', {})
            
            return {
                "success": True,
                "has_organization": True,
                "organization_id": organization_id,
                "organization_name": org.get('name'),
                "role": membership.get('role'),
                "is_platform": org.get('is_platform', False)
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching organization role: {e}")
        raise HTTPException(status_code=500, detail=str(e))
