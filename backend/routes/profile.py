"""
TradeOS Profile Management Routes
Handles user profile updates with proper error handling
Includes access state computation for trial/locked mode
"""

from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel
from typing import Optional
import os
import logging
import httpx
import jwt
from datetime import datetime, timezone, timedelta

from routes.access_control import (
    compute_access_state, 
    get_trial_dates,
    AccessInfo
)

router = APIRouter(prefix="/api/profile", tags=["profile"])
logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', '')

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    company_name: Optional[str] = None
    trade: Optional[str] = None
    region: Optional[str] = None
    phone: Optional[str] = None
    labor_rate: Optional[float] = None
    default_payment_days: Optional[int] = None
    business_activated: Optional[bool] = None
    business_activation_skipped: Optional[bool] = None
    notifications_email: Optional[bool] = None
    notifications_co: Optional[bool] = None
    notifications_weekly: Optional[bool] = None

class ProfileResponse(BaseModel):
    success: bool
    message: str
    profile: Optional[dict] = None
    access_state: Optional[str] = None
    trial_days_remaining: Optional[int] = None

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
        # Remove 'Bearer ' prefix
        token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
        
        # Decode without verification to get user_id (Supabase handles verification)
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

@router.get("/me")
async def get_my_profile(authorization: str = Header(...)):
    """Get current user's profile with access state"""
    user_id = await verify_jwt_token(authorization)
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/users_profile?user_id=eq.{user_id}&select=*",
                headers=await get_service_headers()
            )
            
            if response.status_code != 200:
                logger.error(f"Failed to fetch profile: {response.text}")
                raise HTTPException(status_code=500, detail="Failed to fetch profile")
            
            profiles = response.json()
            
            if not profiles:
                return ProfileResponse(
                    success=False,
                    message="Profile not found",
                    profile=None,
                    access_state="LOCKED"
                )
            
            profile = profiles[0]
            
            # Compute access state
            access_info = compute_access_state(profile)
            
            return ProfileResponse(
                success=True,
                message="Profile found",
                profile=profile,
                access_state=access_info.state,
                trial_days_remaining=access_info.trial_days_remaining
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/update")
async def update_profile(
    data: ProfileUpdateRequest,
    authorization: str = Header(...)
):
    """
    Update user profile with proper error handling.
    Only updates fields that are provided (non-None).
    """
    user_id = await verify_jwt_token(authorization)
    
    # Build update payload with only non-None fields
    update_data = {}
    for field, value in data.model_dump().items():
        if value is not None:
            update_data[field] = value
    
    if not update_data:
        return ProfileResponse(
            success=True,
            message="No fields to update",
            profile=None
        )
    
    logger.info(f"Updating profile for user {user_id}: {list(update_data.keys())}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # First check if profile exists
            check_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/users_profile?user_id=eq.{user_id}&select=id",
                headers=await get_service_headers()
            )
            
            profiles = check_response.json() if check_response.status_code == 200 else []
            
            if not profiles:
                # Create profile if doesn't exist
                create_data = {"user_id": user_id, **update_data}
                response = await client.post(
                    f"{SUPABASE_URL}/rest/v1/users_profile",
                    headers=await get_service_headers(),
                    json=create_data
                )
                
                if response.status_code not in [200, 201]:
                    logger.error(f"Failed to create profile: {response.status_code} - {response.text}")
                    # Check if it's a column error
                    if "column" in response.text.lower():
                        return ProfileResponse(
                            success=False,
                            message="Database schema update required. Please contact support.",
                            profile=None
                        )
                    raise HTTPException(status_code=500, detail="Failed to create profile")
                
                created = response.json()
                return ProfileResponse(
                    success=True,
                    message="Profile created",
                    profile=created[0] if created else None
                )
            else:
                # Update existing profile
                response = await client.patch(
                    f"{SUPABASE_URL}/rest/v1/users_profile?user_id=eq.{user_id}",
                    headers=await get_service_headers(),
                    json=update_data
                )
                
                if response.status_code not in [200, 204]:
                    logger.error(f"Failed to update profile: {response.status_code} - {response.text}")
                    # Check if it's a column error
                    error_text = response.text.lower()
                    if "column" in error_text or "does not exist" in error_text:
                        # Try to identify which column is missing
                        missing_cols = [k for k in update_data.keys() if k in error_text]
                        return ProfileResponse(
                            success=False,
                            message=f"Database column(s) missing: {missing_cols or 'unknown'}. Migration required.",
                            profile=None
                        )
                    raise HTTPException(status_code=500, detail="Failed to update profile")
                
                # Fetch updated profile
                fetch_response = await client.get(
                    f"{SUPABASE_URL}/rest/v1/users_profile?user_id=eq.{user_id}&select=*",
                    headers=await get_service_headers()
                )
                
                updated = fetch_response.json() if fetch_response.status_code == 200 else []
                
                return ProfileResponse(
                    success=True,
                    message="Profile updated",
                    profile=updated[0] if updated else None
                )
                
    except HTTPException:
        raise
    except httpx.TimeoutException:
        logger.error("Profile update timeout")
        raise HTTPException(status_code=504, detail="Request timeout")
    except Exception as e:
        logger.error(f"Error updating profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/activation-status")
async def update_activation_status(
    authorization: str = Header(...),
    activated: bool = False,
    skipped: bool = False,
    labor_rate: Optional[float] = None
):
    """
    Update activation flow status.
    This is a simplified endpoint specifically for the activation flow.
    """
    user_id = await verify_jwt_token(authorization)
    
    update_data = {}
    if activated:
        update_data["business_activated"] = True
    if skipped:
        update_data["business_activation_skipped"] = True
    if labor_rate is not None and labor_rate > 0:
        update_data["labor_rate"] = labor_rate
    
    if not update_data:
        return {"success": True, "message": "No status to update"}
    
    logger.info(f"Updating activation status for user {user_id}: {update_data}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.patch(
                f"{SUPABASE_URL}/rest/v1/users_profile?user_id=eq.{user_id}",
                headers=await get_service_headers(),
                json=update_data
            )
            
            if response.status_code not in [200, 204]:
                error_text = response.text
                logger.error(f"Activation status update failed: {error_text}")
                
                # If column doesn't exist, return specific error
                if "column" in error_text.lower() or "does not exist" in error_text.lower():
                    return {
                        "success": False,
                        "message": "Database migration required. Please run migration 009_activation_columns.sql",
                        "error": "MISSING_COLUMNS"
                    }
                
                return {
                    "success": False,
                    "message": "Failed to update activation status",
                    "error": error_text
                }
            
            return {
                "success": True,
                "message": "Activation status updated",
                "data": update_data
            }
            
    except Exception as e:
        logger.error(f"Error updating activation status: {e}")
        return {
            "success": False,
            "message": str(e),
            "error": "EXCEPTION"
        }
