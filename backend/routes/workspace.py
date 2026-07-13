"""
Workspace Routes - TradeOS Operating System
============================================
Core workspace routing and context management.

This module provides:
- Post-login workspace resolution (replaces TFCS role check)
- User context for the TradeOS Operating System
- Organization-based authorization

This replaces the legacy tfcs_user_roles system with the new architecture:
- platform_admins: System-level platform administrators
- organization_members: Users belong to organizations with roles
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import os
import logging
import httpx
from config import config
import jwt
from datetime import datetime, timezone

router = APIRouter(prefix="/api/workspace", tags=["workspace"])
logger = logging.getLogger(__name__)


# =====================================================
# PYDANTIC MODELS
# =====================================================

class WorkspaceContext(BaseModel):
    """User's workspace context for the TradeOS Operating System"""
    has_access: bool
    user_id: str
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    # Organization context
    has_organization: bool = False
    organization_id: Optional[str] = None
    organization_name: Optional[str] = None
    organization_role: Optional[str] = None
    is_owner: bool = False
    # Platform context
    is_platform_admin: bool = False
    platform_role: Optional[str] = None
    # Destination
    redirect_to: str = "/app/dashboard"
    message: Optional[str] = None

# =====================================================
# UTILITY FUNCTIONS
# =====================================================

async def get_service_headers():
    """Get headers for Supabase service role requests"""
    return {
        "apikey": config.SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {config.SUPABASE_SERVICE_KEY}",
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

async def get_user_email(user_id: str) -> Optional[str]:
    """Get user email from Supabase auth"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{config.SUPABASE_URL}/auth/v1/admin/users/{user_id}",
                headers={
                    "apikey": config.SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {config.SUPABASE_SERVICE_KEY}"
                }
            )
            if response.status_code == 200:
                user_data = response.json()
                return user_data.get('email')
    except Exception as e:
        logger.error(f"Error fetching user email: {e}")
    return None

# =====================================================
# API ENDPOINTS
# =====================================================

@router.get("/health")
async def workspace_health():
    """Check workspace service health"""
    return {
        "status": "healthy",
        "service": "workspace",
        "version": "2.0.0",
        "architecture": "organization-based"
    }

@router.get("/context")
async def get_workspace_context(authorization: str = Header(...)):
    """
    Get the current user's workspace context.
    
    This endpoint determines:
    1. Whether the user has access to TradeOS
    2. Which organization workspace to load
    3. The user's role and permissions
    
    This replaces the legacy /api/tfcs/role/me endpoint.
    
    Routing Logic:
    - User with organization membership → Organization Workspace Command Center
    - Platform admin without org → Platform Admin Dashboard
    - No access → Onboarding or error
    """
    user_id = await verify_jwt_token(authorization)
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Get user's email
            user_email = await get_user_email(user_id)
            
            # Initialize response
            context = {
                "has_access": False,
                "user_id": user_id,
                "user_email": user_email,
                "has_organization": False,
                "is_platform_admin": False,
                "redirect_to": "/app/dashboard"
            }
            
            # Check platform admin status first
            platform_response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/platform_admins?"
                f"user_id=eq.{user_id}&"
                f"is_active=eq.true&"
                f"select=id,role",
                headers=await get_service_headers()
            )
            
            if platform_response.status_code == 200:
                platform_admins = platform_response.json()
                if platform_admins:
                    context["is_platform_admin"] = True
                    context["platform_role"] = platform_admins[0].get('role')
                    context["has_access"] = True
            
            # Check organization membership (primary org first)
            org_response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/organization_members?"
                f"user_id=eq.{user_id}&"
                f"is_active=eq.true&"
                f"select=id,role,is_primary,user_name,organization_id,"
                f"organizations(id,name,slug,subscription_tier,is_active)",
                headers=await get_service_headers()
            )
            
            if org_response.status_code == 200:
                memberships = org_response.json()
                
                if memberships:
                    # Find primary organization, or use the first one
                    primary_membership = next(
                        (m for m in memberships if m.get('is_primary')),
                        memberships[0]
                    )
                    
                    org = primary_membership.get('organizations', {})
                    
                    if org and org.get('is_active', True):
                        context["has_access"] = True
                        context["has_organization"] = True
                        context["organization_id"] = org.get('id')
                        context["organization_name"] = org.get('name')
                        context["organization_role"] = primary_membership.get('role')
                        context["user_name"] = primary_membership.get('user_name')
                        context["is_owner"] = primary_membership.get('role') == 'owner'
                        
                        # Users with orgs go to the Command Center (workspace home)
                        context["redirect_to"] = "/app/command-center"
            elif org_response.status_code != 200 and 'does not exist' in org_response.text:
                # Tables not initialized yet - check legacy TFCS
                logger.info("Organization tables not initialized, falling back to legacy check")
                context["message"] = "Organization tables pending migration"
            
            # Fallback: Check legacy TFCS roles for backward compatibility during migration
            if not context["has_access"]:
                try:
                    tfcs_response = await client.get(
                        f"{config.SUPABASE_URL}/rest/v1/tfcs_user_roles?"
                        f"user_id=eq.{user_id}&"
                        f"is_active=eq.true&"
                        f"select=role,user_email,user_name",
                        headers=await get_service_headers()
                    )
                    
                    if tfcs_response.status_code == 200:
                        tfcs_roles = tfcs_response.json()
                        if tfcs_roles:
                            role_data = tfcs_roles[0]
                            context["has_access"] = True
                            context["organization_role"] = role_data.get('role')
                            context["user_email"] = role_data.get('user_email') or user_email
                            context["user_name"] = role_data.get('user_name')
                            context["is_owner"] = role_data.get('role') == 'owner'
                            # Legacy users go to command center too
                            context["redirect_to"] = "/app/command-center"
                            context["message"] = "Using legacy TFCS role (migration pending)"
                except Exception as tfcs_error:
                    logger.warning(f"TFCS fallback check failed: {tfcs_error}")
            
            # Final fallback - if user exists in Supabase, they have basic access
            if not context["has_access"]:
                # User can still access basic dashboard (onboarding might be needed)
                context["has_access"] = True
                context["redirect_to"] = "/app/dashboard"
                context["message"] = "No organization membership found"
            
            return context
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting workspace context: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/permissions")
async def get_workspace_permissions(authorization: str = Header(...)):
    """
    Get the current user's permissions in their primary workspace.
    
    Returns a structured permissions object based on organization role.
    """
    user_id = await verify_jwt_token(authorization)
    
    try:
        # Get context first
        context_response = await get_workspace_context(authorization)
        
        # Define permission sets by role
        role_permissions = {
            'owner': {
                'full_access': True,
                'financial': True,
                'user_management': True,
                'settings': True,
                'company_brain': True,
                'reports': True,
                'projects': True,
                'opportunities': True,
                'clients': True,
                'invoicing': True,
                'expenses': True,
                'documents': True,
                'team': True
            },
            'admin': {
                'full_access': False,
                'financial': True,
                'user_management': True,
                'settings': True,
                'company_brain': True,
                'reports': True,
                'projects': True,
                'opportunities': True,
                'clients': True,
                'invoicing': True,
                'expenses': True,
                'documents': True,
                'team': True
            },
            'project_manager': {
                'full_access': False,
                'financial': False,
                'user_management': False,
                'settings': False,
                'company_brain': True,
                'reports': True,
                'projects': True,
                'opportunities': True,
                'clients': True,
                'invoicing': False,
                'expenses': True,
                'documents': True,
                'team': False
            },
            'employee': {
                'full_access': False,
                'financial': False,
                'user_management': False,
                'settings': False,
                'company_brain': True,
                'reports': False,
                'projects': True,
                'opportunities': False,
                'clients': False,
                'invoicing': False,
                'expenses': True,
                'documents': True,
                'team': False
            }
        }
        
        role = context_response.get('organization_role', 'employee')
        permissions = role_permissions.get(role, role_permissions['employee'])
        
        return {
            "success": True,
            "user_id": user_id,
            "organization_id": context_response.get('organization_id'),
            "role": role,
            "is_owner": context_response.get('is_owner', False),
            "is_platform_admin": context_response.get('is_platform_admin', False),
            "permissions": permissions
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting permissions: {e}")
        raise HTTPException(status_code=500, detail=str(e))
