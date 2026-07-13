"""
TradeOS Marketplace API Routes
Public contractor directory with verification tiers
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
import os
import logging
import httpx
from config import config
from datetime import datetime, timezone

router = APIRouter(prefix="/api/marketplace", tags=["marketplace"])
logger = logging.getLogger(__name__)


# =============================================================================
# MODELS
# =============================================================================

class ContractorPublicProfile(BaseModel):
    user_id: str
    company_name: str
    trade: str
    region: str
    bio: Optional[str] = None
    years_experience: int = 0
    accepting_work: bool = True
    verification_level: int = 0
    rating_average: float = 0.0
    rating_count: int = 0
    profile_image_url: Optional[str] = None

class ContractorListResponse(BaseModel):
    contractors: List[ContractorPublicProfile]
    total: int
    page: int
    limit: int

class MarketplaceProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    trade: Optional[str] = None
    region: Optional[str] = None
    bio: Optional[str] = None
    years_experience: Optional[int] = None
    accepting_work: Optional[bool] = None
    is_listed: Optional[bool] = None
    profile_image_url: Optional[str] = None
    website_url: Optional[str] = None
    phone_public: Optional[str] = None
    email_public: Optional[str] = None

class VerificationStatus(BaseModel):
    identity_verified: bool = False
    trade_verified: bool = False
    insurance_verified: bool = False
    performance_verified: bool = False
    verification_level: int = 0
    insurance_expiry_date: Optional[str] = None

class VerificationBadge(BaseModel):
    level: int
    label: str
    color: str
    description: str

# =============================================================================
# HELPERS
# =============================================================================

async def get_supabase_headers(use_service_key: bool = True):
    key = config.SUPABASE_SERVICE_KEY if use_service_key else config.SUPABASE_ANON_KEY
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

def get_verification_badge(level: int) -> VerificationBadge:
    badges = {
        0: VerificationBadge(level=0, label="Not Verified", color="gray", description="This contractor has not been verified"),
        1: VerificationBadge(level=1, label="Identity Verified", color="blue", description="Identity has been verified"),
        2: VerificationBadge(level=2, label="Trade Verified", color="teal", description="Trade credentials verified"),
        3: VerificationBadge(level=3, label="Insurance Verified", color="green", description="Insurance coverage verified"),
        4: VerificationBadge(level=4, label="Performance Verified", color="gold", description="Full TradeOS verification")
    }
    return badges.get(level, badges[0])

# =============================================================================
# PUBLIC ROUTES
# =============================================================================

@router.get("/contractors", response_model=ContractorListResponse)
async def get_contractors(
    trade: Optional[str] = Query(None, description="Filter by trade"),
    region: Optional[str] = Query(None, description="Filter by region"),
    min_verification: int = Query(0, ge=0, le=4, description="Minimum verification level"),
    accepting_only: bool = Query(False, description="Only show contractors accepting work"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=50, description="Results per page")
):
    """Get list of public contractors with filters"""
    
    offset = (page - 1) * limit
    
    try:
        async with httpx.AsyncClient() as client:
            # Use the RPC function
            response = await client.post(
                f"{config.SUPABASE_URL}/rest/v1/rpc/get_public_contractors",
                headers=await get_supabase_headers(use_service_key=False),
                json={
                    "p_trade": trade,
                    "p_region": region,
                    "p_min_verification": min_verification,
                    "p_accepting_only": accepting_only,
                    "p_limit": limit,
                    "p_offset": offset
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                contractors = [ContractorPublicProfile(**row) for row in data]
                
                # Get total count
                count_response = await client.get(
                    f"{config.SUPABASE_URL}/rest/v1/contractor_profiles_public?is_listed=eq.true&select=count",
                    headers={
                        **await get_supabase_headers(use_service_key=False),
                        "Prefer": "count=exact"
                    }
                )
                total = int(count_response.headers.get('content-range', '0-0/0').split('/')[-1]) if count_response.status_code == 200 else len(contractors)
                
                return ContractorListResponse(
                    contractors=contractors,
                    total=total,
                    page=page,
                    limit=limit
                )
            
            # Fallback: direct query
            query_params = ["is_listed=eq.true"]
            if trade:
                query_params.append(f"trade=ilike.*{trade}*")
            if region:
                query_params.append(f"region=ilike.*{region}*")
            if min_verification > 0:
                query_params.append(f"verification_level=gte.{min_verification}")
            if accepting_only:
                query_params.append("accepting_work=eq.true")
            
            query_string = "&".join(query_params)
            
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/contractor_profiles_public?{query_string}&order=verification_level.desc,rating_average.desc&limit={limit}&offset={offset}",
                headers=await get_supabase_headers(use_service_key=False)
            )
            
            if response.status_code == 200:
                data = response.json()
                contractors = [ContractorPublicProfile(**row) for row in data]
                return ContractorListResponse(
                    contractors=contractors,
                    total=len(contractors),
                    page=page,
                    limit=limit
                )
                
    except Exception as e:
        logger.error(f"Error fetching contractors: {e}")
    
    return ContractorListResponse(contractors=[], total=0, page=page, limit=limit)


@router.get("/contractors/{user_id}", response_model=ContractorPublicProfile)
async def get_contractor(user_id: str):
    """Get a single public contractor profile"""
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/contractor_profiles_public?user_id=eq.{user_id}&is_listed=eq.true",
                headers=await get_supabase_headers(use_service_key=False)
            )
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    return ContractorPublicProfile(**data[0])
                    
    except Exception as e:
        logger.error(f"Error fetching contractor {user_id}: {e}")
    
    raise HTTPException(status_code=404, detail="Contractor not found")


@router.get("/verification-badge/{level}")
async def get_badge_info(level: int):
    """Get verification badge info by level"""
    if level < 0 or level > 4:
        raise HTTPException(status_code=400, detail="Invalid verification level")
    return get_verification_badge(level)


@router.get("/trades")
async def get_available_trades():
    """Get list of unique trades in the marketplace"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/contractor_profiles_public?is_listed=eq.true&select=trade",
                headers=await get_supabase_headers(use_service_key=False)
            )
            
            if response.status_code == 200:
                data = response.json()
                trades = list(set(row['trade'] for row in data if row.get('trade')))
                return {"trades": sorted(trades)}
                
    except Exception as e:
        logger.error(f"Error fetching trades: {e}")
    
    return {"trades": []}


@router.get("/regions")
async def get_available_regions():
    """Get list of unique regions in the marketplace"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/contractor_profiles_public?is_listed=eq.true&select=region",
                headers=await get_supabase_headers(use_service_key=False)
            )
            
            if response.status_code == 200:
                data = response.json()
                regions = list(set(row['region'] for row in data if row.get('region')))
                return {"regions": sorted(regions)}
                
    except Exception as e:
        logger.error(f"Error fetching regions: {e}")
    
    return {"regions": []}


# =============================================================================
# AUTHENTICATED ROUTES
# =============================================================================

@router.get("/profile/{user_id}")
async def get_own_marketplace_profile(user_id: str):
    """Get own marketplace profile (authenticated)"""
    
    try:
        async with httpx.AsyncClient() as client:
            # Get marketplace profile
            profile_response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/contractor_profiles_public?user_id=eq.{user_id}",
                headers=await get_supabase_headers()
            )
            
            # Get verification status
            verification_response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/contractor_verification?user_id=eq.{user_id}",
                headers=await get_supabase_headers()
            )
            
            profile = None
            verification = None
            
            if profile_response.status_code == 200:
                data = profile_response.json()
                if data and len(data) > 0:
                    profile = data[0]
            
            if verification_response.status_code == 200:
                data = verification_response.json()
                if data and len(data) > 0:
                    verification = data[0]
            
            return {
                "profile": profile,
                "verification": verification,
                "badge": get_verification_badge(profile.get('verification_level', 0) if profile else 0).dict()
            }
                
    except Exception as e:
        logger.error(f"Error fetching own profile {user_id}: {e}")
    
    return {"profile": None, "verification": None, "badge": get_verification_badge(0).dict()}


@router.post("/profile/{user_id}")
async def create_marketplace_profile(user_id: str, profile: MarketplaceProfileUpdate):
    """Create marketplace profile"""
    
    try:
        async with httpx.AsyncClient() as client:
            # Check if profile exists
            check_response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/contractor_profiles_public?user_id=eq.{user_id}",
                headers=await get_supabase_headers()
            )
            
            if check_response.status_code == 200 and check_response.json():
                raise HTTPException(status_code=409, detail="Profile already exists")
            
            # Get user's main profile for defaults
            user_profile_response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/users_profile?user_id=eq.{user_id}",
                headers=await get_supabase_headers()
            )
            
            user_profile = {}
            if user_profile_response.status_code == 200:
                data = user_profile_response.json()
                if data:
                    user_profile = data[0]
            
            # Create profile with defaults from user profile
            profile_data = {
                "user_id": user_id,
                "company_name": profile.company_name or user_profile.get('company_name', 'Unknown'),
                "trade": profile.trade or user_profile.get('trade_type', 'General'),
                "region": profile.region or user_profile.get('region', 'Unknown'),
                "bio": profile.bio,
                "years_experience": profile.years_experience or 0,
                "accepting_work": profile.accepting_work if profile.accepting_work is not None else True,
                "is_listed": profile.is_listed if profile.is_listed is not None else False,
                "profile_image_url": profile.profile_image_url,
                "website_url": profile.website_url,
                "phone_public": profile.phone_public,
                "email_public": profile.email_public,
                "verification_level": 0
            }
            
            response = await client.post(
                f"{config.SUPABASE_URL}/rest/v1/contractor_profiles_public",
                headers=await get_supabase_headers(),
                json=profile_data
            )
            
            if response.status_code in [200, 201]:
                # Also create verification record
                await client.post(
                    f"{config.SUPABASE_URL}/rest/v1/contractor_verification",
                    headers=await get_supabase_headers(),
                    json={"user_id": user_id}
                )
                return {"success": True, "profile": response.json()[0] if response.json() else profile_data}
            
            logger.error(f"Failed to create profile: {response.status_code} - {response.text}")
            raise HTTPException(status_code=400, detail="Failed to create profile")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/profile/{user_id}")
async def update_marketplace_profile(user_id: str, profile: MarketplaceProfileUpdate):
    """Update marketplace profile"""
    
    try:
        update_data = {k: v for k, v in profile.dict().items() if v is not None}
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{config.SUPABASE_URL}/rest/v1/contractor_profiles_public?user_id=eq.{user_id}",
                headers=await get_supabase_headers(),
                json=update_data
            )
            
            if response.status_code in [200, 204]:
                return {"success": True}
            
            # If no profile exists, create one
            if response.status_code == 404:
                return await create_marketplace_profile(user_id, profile)
            
            logger.error(f"Failed to update profile: {response.status_code} - {response.text}")
            raise HTTPException(status_code=400, detail="Failed to update profile")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/profile/{user_id}/toggle-listing")
async def toggle_marketplace_listing(user_id: str, is_listed: bool):
    """Toggle marketplace listing visibility"""
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{config.SUPABASE_URL}/rest/v1/contractor_profiles_public?user_id=eq.{user_id}",
                headers=await get_supabase_headers(),
                json={
                    "is_listed": is_listed,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            )
            
            if response.status_code in [200, 204]:
                return {"success": True, "is_listed": is_listed}
            
            raise HTTPException(status_code=400, detail="Failed to update listing status")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling listing: {e}")
        raise HTTPException(status_code=500, detail=str(e))
