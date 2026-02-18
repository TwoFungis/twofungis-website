"""
TradeOS Founders Management Routes
Handles founder accounts and badges
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List
import os
import logging
import httpx

router = APIRouter(prefix="/api/founders", tags=["founders"])
logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

# Pre-defined founder emails - these users get automatic lifetime access
FOUNDER_EMAILS = [
    "info@twofungis.ca",
    "swdmarshall@gmail.com", 
    "carpenterbeau@hotmail.com"
]

class FounderStatusResponse(BaseModel):
    is_founder: bool
    founder_number: Optional[int] = None
    email: Optional[str] = None

class FoundersCountResponse(BaseModel):
    total_founders: int
    max_founders: int
    remaining: int
    founder_emails: List[str]

async def get_supabase_headers():
    """Get headers for Supabase service role requests"""
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

@router.get("/status/{email}", response_model=FounderStatusResponse)
async def check_founder_status(email: str):
    """Check if an email is a founder"""
    email_lower = email.lower().strip()
    
    if email_lower in [e.lower() for e in FOUNDER_EMAILS]:
        founder_number = FOUNDER_EMAILS.index(next(e for e in FOUNDER_EMAILS if e.lower() == email_lower)) + 1
        return FounderStatusResponse(
            is_founder=True,
            founder_number=founder_number,
            email=email_lower
        )
    
    return FounderStatusResponse(is_founder=False)

@router.get("/count", response_model=FoundersCountResponse)
async def get_founders_count():
    """Get count of founders for display"""
    return FoundersCountResponse(
        total_founders=len(FOUNDER_EMAILS),
        max_founders=100,
        remaining=100 - len(FOUNDER_EMAILS),
        founder_emails=FOUNDER_EMAILS
    )

@router.post("/activate/{user_id}")
async def activate_founder(user_id: str, request: Request):
    """
    Activate founder status for a user if they are in the founder list.
    This updates their subscription_tier to 'founding_lifetime'.
    """
    try:
        # First, get the user's email from their profile
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/users_profile?user_id=eq.{user_id}&select=*",
                headers=await get_supabase_headers()
            )
            
            if response.status_code != 200 or not response.json():
                # Try to get email from auth.users via the user_id
                raise HTTPException(status_code=404, detail="User profile not found")
            
            profile = response.json()[0]
            
            # Get user email from Supabase auth
            auth_response = await client.get(
                f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}",
                headers=await get_supabase_headers()
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(status_code=404, detail="User not found in auth")
            
            user_data = auth_response.json()
            user_email = user_data.get('email', '').lower()
            
            # Check if email is in founder list
            if user_email not in [e.lower() for e in FOUNDER_EMAILS]:
                raise HTTPException(status_code=403, detail="Not a founder email")
            
            # Update the user's subscription to lifetime (elite access)
            update_response = await client.patch(
                f"{SUPABASE_URL}/rest/v1/users_profile?user_id=eq.{user_id}",
                headers=await get_supabase_headers(),
                json={
                    "subscription_tier": "lifetime",
                    "subscription_status": "active"
                }
            )
            
            if update_response.status_code not in [200, 204]:
                logger.error(f"Failed to update founder status: {update_response.text}")
                raise HTTPException(status_code=500, detail="Failed to activate founder status")
            
            founder_number = [e.lower() for e in FOUNDER_EMAILS].index(user_email) + 1
            
            return {
                "success": True,
                "message": f"Founder #{founder_number} activated",
                "subscription_tier": "founding_lifetime"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error activating founder: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sync-all")
async def sync_all_founders():
    """
    Sync all founder emails - update their subscription_tier if they exist in the system.
    This is an admin endpoint that should be called to initialize founders.
    """
    results = []
    
    async with httpx.AsyncClient() as client:
        for email in FOUNDER_EMAILS:
            try:
                # Find user by email via auth API
                response = await client.get(
                    f"{SUPABASE_URL}/auth/v1/admin/users",
                    headers=await get_supabase_headers(),
                    params={"page": 1, "per_page": 1000}
                )
                
                if response.status_code != 200:
                    results.append({"email": email, "status": "error", "message": "Failed to query users"})
                    continue
                
                users = response.json().get('users', [])
                user = next((u for u in users if u.get('email', '').lower() == email.lower()), None)
                
                if not user:
                    results.append({"email": email, "status": "not_found", "message": "User not registered"})
                    continue
                
                user_id = user['id']
                
                # Update their subscription tier
                update_response = await client.patch(
                    f"{SUPABASE_URL}/rest/v1/users_profile?user_id=eq.{user_id}",
                    headers=await get_supabase_headers(),
                    json={
                        "subscription_tier": "founding_lifetime",
                        "subscription_status": "active"
                    }
                )
                
                if update_response.status_code in [200, 204]:
                    results.append({"email": email, "status": "success", "user_id": user_id})
                else:
                    results.append({"email": email, "status": "error", "message": update_response.text})
                    
            except Exception as e:
                results.append({"email": email, "status": "error", "message": str(e)})
    
    return {"results": results, "total_processed": len(FOUNDER_EMAILS)}
