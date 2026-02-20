"""
TradeOS Projects API Routes
Handles project creation and management with Trial/Locked mode enforcement
"""
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import httpx
import os
import logging
import json
import base64

from routes.access_control import (
    compute_access_state,
    can_create_in_locked_mode
)

router = APIRouter(prefix="/api/projects", tags=["projects"])
logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')


class ProjectCreate(BaseModel):
    name: str
    client_name: Optional[str] = None
    description: Optional[str] = None
    status: str = "active"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    contract_value: Optional[float] = None
    labor_rate: Optional[float] = None
    tax_type: Optional[str] = None
    tax_rate: Optional[float] = None


def get_user_id_from_token(authorization: str) -> Optional[str]:
    """Extract user_id from JWT token"""
    if not authorization or not authorization.startswith('Bearer '):
        return None
    try:
        token = authorization.replace('Bearer ', '')
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
    except Exception as e:
        logger.error(f"Token decode error: {e}")
        return None


async def get_service_headers():
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }


async def supabase_request(method: str, table: str, data: Dict = None, params: Dict = None):
    """Make a request to Supabase REST API"""
    headers = await get_service_headers()
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    
    if params:
        param_str = "&".join([f"{k}={v}" for k, v in params.items()])
        url = f"{url}?{param_str}"
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        if method == "GET":
            response = await client.get(url, headers=headers)
        elif method == "POST":
            response = await client.post(url, headers=headers, json=data)
        elif method == "PATCH":
            response = await client.patch(url, headers=headers, json=data)
        elif method == "DELETE":
            response = await client.delete(url, headers=headers)
        
        if response.status_code >= 400:
            logger.error(f"Supabase error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=response.status_code, detail=response.text)
        
        if response.text:
            return response.json()
        return {}


async def get_user_profile(user_id: str) -> Optional[Dict]:
    """Fetch user profile for access control checks"""
    try:
        # First try with new columns
        profiles = await supabase_request(
            "GET",
            "users_profile",
            params={
                "user_id": f"eq.{user_id}",
                "select": "subscription_tier,grandfathered_active,trial_started_at,trial_ends_at,locked_project_created,locked_quote_created,locked_invoice_created"
            }
        )
        return profiles[0] if profiles else None
    except HTTPException as e:
        # If columns don't exist, fall back to basic query
        if '42703' in str(e.detail) or 'does not exist' in str(e.detail):
            logger.info("Trial columns not found in projects, using basic profile query")
            try:
                profiles = await supabase_request(
                    "GET",
                    "users_profile",
                    params={
                        "user_id": f"eq.{user_id}",
                        "select": "subscription_tier"
                    }
                )
                return profiles[0] if profiles else None
            except Exception as e2:
                logger.warning(f"Failed to fetch basic profile: {e2}")
                return None
        logger.warning(f"Failed to fetch profile: {e}")
        return None
    except Exception as e:
        logger.warning(f"Failed to fetch profile: {e}")
        return None


async def mark_locked_entity_created(user_id: str, entity_type: str):
    """Mark that a locked user has used their one free entity creation"""
    field_map = {
        "project": "locked_project_created",
        "quote": "locked_quote_created",
        "invoice": "locked_invoice_created"
    }
    field = field_map.get(entity_type)
    if field:
        try:
            await supabase_request(
                "PATCH",
                "users_profile",
                data={field: True},
                params={"user_id": f"eq.{user_id}"}
            )
            logger.info(f"Marked {field}=true for user {user_id}")
        except Exception as e:
            logger.error(f"Failed to mark {field}: {e}")


@router.post("")
async def create_project(
    data: ProjectCreate,
    authorization: str = Header(None)
):
    """Create a new project with locked mode enforcement"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Check access control - LOCKED mode enforcement
        profile = await get_user_profile(user_id)
        access_info = compute_access_state(profile)
        
        if access_info.state == "LOCKED":
            can_create, error_msg = can_create_in_locked_mode(profile, "project")
            if not can_create:
                raise HTTPException(status_code=403, detail=error_msg)
        
        # Create the project
        project_data = {
            "user_id": user_id,
            "name": data.name,
            "client_name": data.client_name,
            "description": data.description,
            "status": data.status,
            "start_date": data.start_date,
            "end_date": data.end_date,
            "contract_value": data.contract_value,
            "labor_rate": data.labor_rate,
            "tax_type": data.tax_type,
            "tax_rate": data.tax_rate,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Remove None values
        project_data = {k: v for k, v in project_data.items() if v is not None}
        
        result = await supabase_request("POST", "projects", data=project_data)
        
        # If user is in LOCKED mode, mark their one free project as used
        if access_info.state == "LOCKED":
            await mark_locked_entity_created(user_id, "project")
        
        project = result[0] if isinstance(result, list) else result
        return project
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating project: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
async def list_projects(authorization: str = Header(None)):
    """List all projects for the user"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        projects = await supabase_request(
            "GET",
            "projects",
            params={
                "user_id": f"eq.{user_id}",
                "select": "*",
                "order": "created_at.desc"
            }
        )
        return projects
    except Exception as e:
        logger.error(f"Error listing projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))
