"""
TradeOS Marketplace V2 API Routes
Enhanced marketplace with job posts, services, and networking
"""

from fastapi import APIRouter, HTTPException, Query, Header
from pydantic import BaseModel
from typing import Optional, List
import os
import logging
import httpx
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/api/marketplace", tags=["marketplace-v2"])
logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', '')

# =============================================================================
# MODELS
# =============================================================================

class JobPost(BaseModel):
    id: Optional[str] = None
    user_id: str
    title: str
    description: str
    trade_required: str
    location: str
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    timeline: Optional[str] = None
    status: str = "open"  # open, in_progress, completed, cancelled
    created_at: Optional[str] = None

class JobPostCreate(BaseModel):
    title: str
    description: str
    trade_required: str
    location: str
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    timeline: Optional[str] = None

class ServiceOffering(BaseModel):
    id: Optional[str] = None
    user_id: str
    title: str
    description: str
    trade_category: str
    price_type: str = "quote"  # quote, fixed, hourly
    price_amount: Optional[float] = None
    service_areas: List[str] = []
    is_active: bool = True
    created_at: Optional[str] = None

class ServiceOfferingCreate(BaseModel):
    title: str
    description: str
    trade_category: str
    price_type: str = "quote"
    price_amount: Optional[float] = None
    service_areas: List[str] = []

class ConnectionRequest(BaseModel):
    id: Optional[str] = None
    from_user_id: str
    to_user_id: str
    message: Optional[str] = None
    status: str = "pending"  # pending, accepted, rejected
    created_at: Optional[str] = None

class ConnectionRequestCreate(BaseModel):
    to_user_id: str
    message: Optional[str] = None

class ContactRequest(BaseModel):
    contractor_id: str
    name: str
    email: str
    phone: Optional[str] = None
    message: str
    project_type: Optional[str] = None

class ContractorFullProfile(BaseModel):
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
    website_url: Optional[str] = None
    phone_public: Optional[str] = None
    email_public: Optional[str] = None
    services: List[ServiceOffering] = []
    job_posts: List[JobPost] = []

# =============================================================================
# HELPERS
# =============================================================================

async def get_supabase_headers(use_service_key: bool = True):
    key = SUPABASE_SERVICE_KEY if use_service_key else SUPABASE_ANON_KEY
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

async def get_user_id_from_token(authorization: str = None):
    """Extract user_id from Supabase auth token"""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    token = authorization.replace("Bearer ", "")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {token}"
                }
            )
            if response.status_code == 200:
                return response.json().get("id")
    except Exception as e:
        logger.error(f"Error getting user from token: {e}")
    return None

# =============================================================================
# CONTRACTOR DETAIL ROUTES
# =============================================================================

@router.get("/contractor/{user_id}/full")
async def get_contractor_full_profile(user_id: str):
    """Get full contractor profile with services and job posts"""
    
    try:
        async with httpx.AsyncClient() as client:
            # Get basic profile
            profile_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/contractor_profiles_public?user_id=eq.{user_id}&is_listed=eq.true",
                headers=await get_supabase_headers(use_service_key=False)
            )
            
            if profile_response.status_code != 200 or not profile_response.json():
                raise HTTPException(status_code=404, detail="Contractor not found")
            
            profile = profile_response.json()[0]
            
            # Get services
            services_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/contractor_services?user_id=eq.{user_id}&is_active=eq.true",
                headers=await get_supabase_headers(use_service_key=False)
            )
            services = services_response.json() if services_response.status_code == 200 else []
            
            # Get job posts (only open ones for public view)
            jobs_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/marketplace_jobs?user_id=eq.{user_id}&status=eq.open&order=created_at.desc",
                headers=await get_supabase_headers(use_service_key=False)
            )
            jobs = jobs_response.json() if jobs_response.status_code == 200 else []
            
            return {
                **profile,
                "services": services,
                "job_posts": jobs
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching contractor full profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/contractor/{contractor_id}/contact")
async def contact_contractor(contractor_id: str, request: ContactRequest):
    """Send contact request to a contractor"""
    
    try:
        async with httpx.AsyncClient() as client:
            # Verify contractor exists and is listed
            check_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/contractor_profiles_public?user_id=eq.{contractor_id}&is_listed=eq.true",
                headers=await get_supabase_headers(use_service_key=False)
            )
            
            if check_response.status_code != 200 or not check_response.json():
                raise HTTPException(status_code=404, detail="Contractor not found")
            
            contractor = check_response.json()[0]
            
            # Store the contact request
            contact_data = {
                "id": str(uuid.uuid4()),
                "contractor_id": contractor_id,
                "name": request.name,
                "email": request.email,
                "phone": request.phone,
                "message": request.message,
                "project_type": request.project_type,
                "status": "new",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/contractor_inquiries",
                headers=await get_supabase_headers(),
                json=contact_data
            )
            
            if response.status_code in [200, 201]:
                # Optionally send email notification to contractor
                contractor_email = contractor.get("email_public")
                if contractor_email:
                    # Import and call email service
                    try:
                        from routes.email import send_email_notification
                        await send_email_notification(
                            to_email=contractor_email,
                            subject=f"New inquiry from {request.name}",
                            body=f"""
                            You have received a new inquiry through TradeOS Marketplace.
                            
                            From: {request.name}
                            Email: {request.email}
                            Phone: {request.phone or 'Not provided'}
                            
                            Message:
                            {request.message}
                            
                            Project Type: {request.project_type or 'Not specified'}
                            """
                        )
                    except Exception as email_error:
                        logger.warning(f"Failed to send notification email: {email_error}")
                
                return {"success": True, "message": "Your message has been sent to the contractor"}
            
            logger.error(f"Failed to save contact request: {response.status_code}")
            raise HTTPException(status_code=400, detail="Failed to send message")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error contacting contractor: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# JOB POSTS ROUTES
# =============================================================================

@router.get("/jobs")
async def get_marketplace_jobs(
    trade: Optional[str] = None,
    location: Optional[str] = None,
    status: str = "open",
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50)
):
    """Get all marketplace job posts"""
    
    offset = (page - 1) * limit
    
    try:
        async with httpx.AsyncClient() as client:
            query_params = [f"status=eq.{status}"]
            if trade:
                query_params.append(f"trade_required=ilike.*{trade}*")
            if location:
                query_params.append(f"location=ilike.*{location}*")
            
            query_string = "&".join(query_params)
            
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/marketplace_jobs?{query_string}&order=created_at.desc&limit={limit}&offset={offset}",
                headers=await get_supabase_headers(use_service_key=False)
            )
            
            if response.status_code == 200:
                jobs = response.json()
                
                # Enrich with poster info
                for job in jobs:
                    poster_response = await client.get(
                        f"{SUPABASE_URL}/rest/v1/contractor_profiles_public?user_id=eq.{job['user_id']}&select=company_name,verification_level",
                        headers=await get_supabase_headers(use_service_key=False)
                    )
                    if poster_response.status_code == 200 and poster_response.json():
                        poster = poster_response.json()[0]
                        job["poster_company"] = poster.get("company_name", "Unknown")
                        job["poster_verification"] = poster.get("verification_level", 0)
                
                return {"jobs": jobs, "page": page, "limit": limit}
            
            return {"jobs": [], "page": page, "limit": limit}
            
    except Exception as e:
        logger.error(f"Error fetching jobs: {e}")
        return {"jobs": [], "page": page, "limit": limit}


@router.post("/jobs")
async def create_job_post(
    job: JobPostCreate,
    authorization: str = Header(None)
):
    """Create a new job post (requires auth)"""
    
    user_id = await get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        job_data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "title": job.title,
            "description": job.description,
            "trade_required": job.trade_required,
            "location": job.location,
            "budget_min": job.budget_min,
            "budget_max": job.budget_max,
            "timeline": job.timeline,
            "status": "open",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/marketplace_jobs",
                headers=await get_supabase_headers(),
                json=job_data
            )
            
            if response.status_code in [200, 201]:
                return {"success": True, "job": response.json()[0] if response.json() else job_data}
            
            raise HTTPException(status_code=400, detail="Failed to create job post")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating job: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/jobs/{job_id}")
async def update_job_post(
    job_id: str,
    updates: dict,
    authorization: str = Header(None)
):
    """Update a job post (owner only)"""
    
    user_id = await get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        async with httpx.AsyncClient() as client:
            # Verify ownership
            check_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/marketplace_jobs?id=eq.{job_id}&user_id=eq.{user_id}",
                headers=await get_supabase_headers()
            )
            
            if check_response.status_code != 200 or not check_response.json():
                raise HTTPException(status_code=403, detail="Not authorized to update this job")
            
            updates["updated_at"] = datetime.now(timezone.utc).isoformat()
            
            response = await client.patch(
                f"{SUPABASE_URL}/rest/v1/marketplace_jobs?id=eq.{job_id}",
                headers=await get_supabase_headers(),
                json=updates
            )
            
            if response.status_code in [200, 204]:
                return {"success": True}
            
            raise HTTPException(status_code=400, detail="Failed to update job")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating job: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/jobs/{job_id}")
async def delete_job_post(
    job_id: str,
    authorization: str = Header(None)
):
    """Delete a job post (owner only)"""
    
    user_id = await get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        async with httpx.AsyncClient() as client:
            # Verify ownership
            check_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/marketplace_jobs?id=eq.{job_id}&user_id=eq.{user_id}",
                headers=await get_supabase_headers()
            )
            
            if check_response.status_code != 200 or not check_response.json():
                raise HTTPException(status_code=403, detail="Not authorized to delete this job")
            
            response = await client.delete(
                f"{SUPABASE_URL}/rest/v1/marketplace_jobs?id=eq.{job_id}",
                headers=await get_supabase_headers()
            )
            
            if response.status_code in [200, 204]:
                return {"success": True}
            
            raise HTTPException(status_code=400, detail="Failed to delete job")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting job: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# SERVICES ROUTES
# =============================================================================

@router.get("/services")
async def get_marketplace_services(
    trade: Optional[str] = None,
    location: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50)
):
    """Get all active service offerings"""
    
    offset = (page - 1) * limit
    
    try:
        async with httpx.AsyncClient() as client:
            query_params = ["is_active=eq.true"]
            if trade:
                query_params.append(f"trade_category=ilike.*{trade}*")
            
            query_string = "&".join(query_params)
            
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/contractor_services?{query_string}&order=created_at.desc&limit={limit}&offset={offset}",
                headers=await get_supabase_headers(use_service_key=False)
            )
            
            if response.status_code == 200:
                services = response.json()
                
                # Enrich with provider info
                for service in services:
                    provider_response = await client.get(
                        f"{SUPABASE_URL}/rest/v1/contractor_profiles_public?user_id=eq.{service['user_id']}&select=company_name,verification_level,rating_average",
                        headers=await get_supabase_headers(use_service_key=False)
                    )
                    if provider_response.status_code == 200 and provider_response.json():
                        provider = provider_response.json()[0]
                        service["provider_company"] = provider.get("company_name", "Unknown")
                        service["provider_verification"] = provider.get("verification_level", 0)
                        service["provider_rating"] = provider.get("rating_average", 0)
                
                return {"services": services, "page": page, "limit": limit}
            
            return {"services": [], "page": page, "limit": limit}
            
    except Exception as e:
        logger.error(f"Error fetching services: {e}")
        return {"services": [], "page": page, "limit": limit}


@router.post("/services")
async def create_service_offering(
    service: ServiceOfferingCreate,
    authorization: str = Header(None)
):
    """Create a new service offering (requires auth)"""
    
    user_id = await get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        service_data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "title": service.title,
            "description": service.description,
            "trade_category": service.trade_category,
            "price_type": service.price_type,
            "price_amount": service.price_amount,
            "service_areas": service.service_areas,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/contractor_services",
                headers=await get_supabase_headers(),
                json=service_data
            )
            
            if response.status_code in [200, 201]:
                return {"success": True, "service": response.json()[0] if response.json() else service_data}
            
            raise HTTPException(status_code=400, detail="Failed to create service")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating service: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/services/{service_id}")
async def update_service_offering(
    service_id: str,
    updates: dict,
    authorization: str = Header(None)
):
    """Update a service offering (owner only)"""
    
    user_id = await get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        async with httpx.AsyncClient() as client:
            # Verify ownership
            check_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/contractor_services?id=eq.{service_id}&user_id=eq.{user_id}",
                headers=await get_supabase_headers()
            )
            
            if check_response.status_code != 200 or not check_response.json():
                raise HTTPException(status_code=403, detail="Not authorized to update this service")
            
            updates["updated_at"] = datetime.now(timezone.utc).isoformat()
            
            response = await client.patch(
                f"{SUPABASE_URL}/rest/v1/contractor_services?id=eq.{service_id}",
                headers=await get_supabase_headers(),
                json=updates
            )
            
            if response.status_code in [200, 204]:
                return {"success": True}
            
            raise HTTPException(status_code=400, detail="Failed to update service")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating service: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# NETWORKING / CONNECTIONS ROUTES
# =============================================================================

@router.get("/connections")
async def get_connections(authorization: str = Header(None)):
    """Get user's connections"""
    
    user_id = await get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        async with httpx.AsyncClient() as client:
            # Get connections where user is either sender or receiver
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/contractor_connections?or=(from_user_id.eq.{user_id},to_user_id.eq.{user_id})&status=eq.accepted",
                headers=await get_supabase_headers()
            )
            
            if response.status_code == 200:
                connections = response.json()
                
                # Enrich with user profiles
                for conn in connections:
                    other_user_id = conn["to_user_id"] if conn["from_user_id"] == user_id else conn["from_user_id"]
                    profile_response = await client.get(
                        f"{SUPABASE_URL}/rest/v1/contractor_profiles_public?user_id=eq.{other_user_id}",
                        headers=await get_supabase_headers()
                    )
                    if profile_response.status_code == 200 and profile_response.json():
                        conn["connected_user"] = profile_response.json()[0]
                
                return {"connections": connections}
            
            return {"connections": []}
            
    except Exception as e:
        logger.error(f"Error fetching connections: {e}")
        return {"connections": []}


@router.get("/connections/pending")
async def get_pending_connections(authorization: str = Header(None)):
    """Get pending connection requests"""
    
    user_id = await get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        async with httpx.AsyncClient() as client:
            # Get pending requests sent TO this user
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/contractor_connections?to_user_id=eq.{user_id}&status=eq.pending",
                headers=await get_supabase_headers()
            )
            
            if response.status_code == 200:
                requests = response.json()
                
                # Enrich with sender profiles
                for req in requests:
                    profile_response = await client.get(
                        f"{SUPABASE_URL}/rest/v1/contractor_profiles_public?user_id=eq.{req['from_user_id']}",
                        headers=await get_supabase_headers()
                    )
                    if profile_response.status_code == 200 and profile_response.json():
                        req["from_user"] = profile_response.json()[0]
                
                return {"pending_requests": requests}
            
            return {"pending_requests": []}
            
    except Exception as e:
        logger.error(f"Error fetching pending connections: {e}")
        return {"pending_requests": []}


@router.post("/connections")
async def send_connection_request(
    request: ConnectionRequestCreate,
    authorization: str = Header(None)
):
    """Send a connection request to another contractor"""
    
    user_id = await get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    if user_id == request.to_user_id:
        raise HTTPException(status_code=400, detail="Cannot connect with yourself")
    
    try:
        async with httpx.AsyncClient() as client:
            # Check if connection already exists
            check_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/contractor_connections?or=(and(from_user_id.eq.{user_id},to_user_id.eq.{request.to_user_id}),and(from_user_id.eq.{request.to_user_id},to_user_id.eq.{user_id}))",
                headers=await get_supabase_headers()
            )
            
            if check_response.status_code == 200 and check_response.json():
                raise HTTPException(status_code=409, detail="Connection already exists or pending")
            
            connection_data = {
                "id": str(uuid.uuid4()),
                "from_user_id": user_id,
                "to_user_id": request.to_user_id,
                "message": request.message,
                "status": "pending",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/contractor_connections",
                headers=await get_supabase_headers(),
                json=connection_data
            )
            
            if response.status_code in [200, 201]:
                return {"success": True, "message": "Connection request sent"}
            
            raise HTTPException(status_code=400, detail="Failed to send connection request")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending connection request: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/connections/{connection_id}")
async def respond_to_connection(
    connection_id: str,
    action: str,  # accept or reject
    authorization: str = Header(None)
):
    """Accept or reject a connection request"""
    
    user_id = await get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    if action not in ["accept", "reject"]:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    try:
        async with httpx.AsyncClient() as client:
            # Verify this request is TO the current user
            check_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/contractor_connections?id=eq.{connection_id}&to_user_id=eq.{user_id}&status=eq.pending",
                headers=await get_supabase_headers()
            )
            
            if check_response.status_code != 200 or not check_response.json():
                raise HTTPException(status_code=403, detail="Connection request not found")
            
            new_status = "accepted" if action == "accept" else "rejected"
            
            response = await client.patch(
                f"{SUPABASE_URL}/rest/v1/contractor_connections?id=eq.{connection_id}",
                headers=await get_supabase_headers(),
                json={
                    "status": new_status,
                    "responded_at": datetime.now(timezone.utc).isoformat()
                }
            )
            
            if response.status_code in [200, 204]:
                return {"success": True, "status": new_status}
            
            raise HTTPException(status_code=400, detail="Failed to respond to connection")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error responding to connection: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# USER'S OWN MARKETPLACE DATA
# =============================================================================

@router.get("/my/jobs")
async def get_my_jobs(authorization: str = Header(None)):
    """Get current user's job posts"""
    
    user_id = await get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/marketplace_jobs?user_id=eq.{user_id}&order=created_at.desc",
                headers=await get_supabase_headers()
            )
            
            if response.status_code == 200:
                return {"jobs": response.json()}
            
            return {"jobs": []}
            
    except Exception as e:
        logger.error(f"Error fetching user jobs: {e}")
        return {"jobs": []}


@router.get("/my/services")
async def get_my_services(authorization: str = Header(None)):
    """Get current user's service offerings"""
    
    user_id = await get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/contractor_services?user_id=eq.{user_id}&order=created_at.desc",
                headers=await get_supabase_headers()
            )
            
            if response.status_code == 200:
                return {"services": response.json()}
            
            return {"services": []}
            
    except Exception as e:
        logger.error(f"Error fetching user services: {e}")
        return {"services": []}


@router.get("/my/inquiries")
async def get_my_inquiries(authorization: str = Header(None)):
    """Get contact inquiries received by the current user"""
    
    user_id = await get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/contractor_inquiries?contractor_id=eq.{user_id}&order=created_at.desc",
                headers=await get_supabase_headers()
            )
            
            if response.status_code == 200:
                return {"inquiries": response.json()}
            
            return {"inquiries": []}
            
    except Exception as e:
        logger.error(f"Error fetching inquiries: {e}")
        return {"inquiries": []}
