"""
Google OAuth Routes for TradeOS
================================
Handles Emergent Google OAuth integration.

Flow:
1. Frontend redirects to auth.emergentagent.com
2. User authenticates with Google
3. User returns with session_id in URL fragment
4. Frontend sends session_id to this backend
5. Backend exchanges session_id for user data
6. Backend creates/updates user and sets session cookie
7. Frontend redirects to Command Center
"""

from fastapi import APIRouter, HTTPException, Response, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import os
import httpx
import logging
from datetime import datetime, timezone, timedelta
import uuid

router = APIRouter(prefix="/api/auth/google", tags=["google-auth"])
logger = logging.getLogger(__name__)

# Emergent Auth endpoint
EMERGENT_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

# Supabase config
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

# Session duration (7 days)
SESSION_DURATION_DAYS = 7


class GoogleCallbackRequest(BaseModel):
    session_id: str


class UserResponse(BaseModel):
    user_id: str
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None
    auth_method: str = "google"


async def get_supabase_headers():
    """Get headers for Supabase service role requests"""
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }


@router.post("/callback")
async def google_oauth_callback(request: GoogleCallbackRequest, response: Response):
    """
    Exchange session_id from Emergent Auth for user data and create session.
    
    This endpoint:
    1. Validates session_id with Emergent Auth
    2. Gets user data (email, name, picture)
    3. Creates or updates user in Supabase profiles
    4. Creates organization membership if needed
    5. Sets session cookie
    6. Returns user data to frontend
    """
    try:
        # Exchange session_id with Emergent Auth
        async with httpx.AsyncClient(timeout=15.0) as client:
            auth_response = await client.get(
                EMERGENT_AUTH_URL,
                headers={"X-Session-ID": request.session_id}
            )
            
            if auth_response.status_code != 200:
                logger.error(f"Emergent Auth error: {auth_response.status_code} - {auth_response.text}")
                raise HTTPException(
                    status_code=401, 
                    detail="Invalid or expired session. Please try again."
                )
            
            auth_data = auth_response.json()
            
        # Extract user data from Emergent response
        google_id = auth_data.get('id')
        email = auth_data.get('email')
        name = auth_data.get('name')
        picture = auth_data.get('picture')
        session_token = auth_data.get('session_token')
        
        if not email:
            raise HTTPException(status_code=400, detail="Email not provided by Google")
        
        logger.info(f"Google Auth: Processing user {email}")
        
        # Check if user exists in Supabase profiles
        async with httpx.AsyncClient(timeout=15.0) as client:
            headers = await get_supabase_headers()
            
            # First, check if this Google user exists by email in profiles
            profile_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/profiles?email=eq.{email}&select=id,email,full_name,company_name,google_id",
                headers=headers
            )
            
            profiles = profile_response.json() if profile_response.status_code == 200 else []
            
            if profiles and len(profiles) > 0:
                # User exists - update with Google info if needed
                profile = profiles[0]
                user_id = profile['id']
                
                # Update profile with Google data if not already set
                if not profile.get('google_id'):
                    await client.patch(
                        f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}",
                        headers=headers,
                        json={
                            "google_id": google_id,
                            "avatar_url": picture,
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }
                    )
                    logger.info(f"Updated existing profile with Google data: {email}")
            else:
                # Check if email exists in Supabase Auth
                auth_users_response = await client.get(
                    f"{SUPABASE_URL}/auth/v1/admin/users",
                    headers={
                        "apikey": SUPABASE_SERVICE_KEY,
                        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
                    }
                )
                
                existing_auth_user = None
                if auth_users_response.status_code == 200:
                    users_data = auth_users_response.json()
                    users_list = users_data.get('users', users_data) if isinstance(users_data, dict) else users_data
                    for u in users_list:
                        if u.get('email') == email:
                            existing_auth_user = u
                            break
                
                if existing_auth_user:
                    user_id = existing_auth_user['id']
                    # Create profile for existing auth user
                    await client.post(
                        f"{SUPABASE_URL}/rest/v1/profiles",
                        headers=headers,
                        json={
                            "id": user_id,
                            "email": email,
                            "full_name": name,
                            "google_id": google_id,
                            "avatar_url": picture,
                            "subscription_tier": "trial",
                            "created_at": datetime.now(timezone.utc).isoformat(),
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }
                    )
                    logger.info(f"Created profile for existing auth user: {email}")
                else:
                    # Create new user in Supabase Auth
                    user_id = str(uuid.uuid4())
                    create_user_response = await client.post(
                        f"{SUPABASE_URL}/auth/v1/admin/users",
                        headers={
                            "apikey": SUPABASE_SERVICE_KEY,
                            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "email": email,
                            "email_confirm": True,
                            "user_metadata": {
                                "full_name": name,
                                "avatar_url": picture,
                                "google_id": google_id,
                                "auth_method": "google"
                            }
                        }
                    )
                    
                    if create_user_response.status_code in [200, 201]:
                        created_user = create_user_response.json()
                        user_id = created_user.get('id', user_id)
                        
                        # Create profile
                        await client.post(
                            f"{SUPABASE_URL}/rest/v1/profiles",
                            headers=headers,
                            json={
                                "id": user_id,
                                "email": email,
                                "full_name": name,
                                "google_id": google_id,
                                "avatar_url": picture,
                                "subscription_tier": "trial",
                                "created_at": datetime.now(timezone.utc).isoformat(),
                                "updated_at": datetime.now(timezone.utc).isoformat()
                            }
                        )
                        logger.info(f"Created new user and profile: {email}")
                    else:
                        logger.error(f"Failed to create user: {create_user_response.text}")
                        raise HTTPException(status_code=500, detail="Failed to create user account")
            
            # Store Google session in our sessions table
            session_expires = datetime.now(timezone.utc) + timedelta(days=SESSION_DURATION_DAYS)
            
            # Check if google_sessions table exists, if not use a simpler approach
            try:
                await client.post(
                    f"{SUPABASE_URL}/rest/v1/google_sessions",
                    headers=headers,
                    json={
                        "user_id": user_id,
                        "session_token": session_token,
                        "google_id": google_id,
                        "expires_at": session_expires.isoformat(),
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }
                )
            except Exception as session_err:
                # Table might not exist, that's ok - we'll rely on Emergent's session
                logger.warning(f"Could not store session: {session_err}")
        
        # Set session cookie
        response.set_cookie(
            key="google_session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=SESSION_DURATION_DAYS * 24 * 60 * 60,
            path="/"
        )
        
        # Return user data
        return {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "auth_method": "google",
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google OAuth callback error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me")
async def get_google_user(request: Request):
    """
    Get current user data from Google session.
    
    Checks for google_session_token cookie and validates session.
    """
    session_token = request.cookies.get("google_session_token")
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        # Validate session with Emergent
        async with httpx.AsyncClient(timeout=10.0) as client:
            auth_response = await client.get(
                EMERGENT_AUTH_URL,
                headers={"X-Session-ID": session_token}
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Session expired or invalid")
            
            auth_data = auth_response.json()
            
            return {
                "user_id": auth_data.get('id'),
                "email": auth_data.get('email'),
                "name": auth_data.get('name'),
                "picture": auth_data.get('picture'),
                "auth_method": "google"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get Google user error: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify session")


@router.post("/logout")
async def google_logout(response: Response):
    """
    Logout user by clearing the Google session cookie.
    """
    response.delete_cookie(
        key="google_session_token",
        path="/",
        secure=True,
        samesite="none"
    )
    
    return {"success": True, "message": "Logged out successfully"}
