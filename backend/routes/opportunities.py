"""
Opportunities Routes - Vertical Slice 1
========================================
The Opportunity is a WORKSPACE CONTAINER for work from discovery to project.
Per Constitution Article I: Work is the primary object.

WORKFLOW STAGES (not CRM stages):
    DISCOVERED     → Initial opportunity identified
    QUALIFYING     → Gathering info, drawings, contacts, site visits
    TENDERING      → Active estimating, RFIs, takeoffs, pricing
    SUBMITTED      → Proposal delivered to client
    NEGOTIATION    → Clarifications, revisions, value engineering
    AWARDED        → Contract accepted → converts to PROJECT
    DECLINED       → We chose not to bid
    LOST           → Another contractor was awarded
    ARCHIVED       → Cancelled, duplicate, or inactive

All endpoints are organization-scoped per Specification 1.5.
"""

from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, date
from enum import Enum
import os
import logging
import httpx
import jwt
import json

router = APIRouter(prefix="/api/opportunities", tags=["opportunities"])
logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

# =====================================================
# ENUMS - WORKFLOW STAGES (Not CRM)
# =====================================================

class OpportunityStatus(str, Enum):
    DISCOVERED = "discovered"      # Initial opportunity identified
    QUALIFYING = "qualifying"      # Gathering info, drawings, site visits
    TENDERING = "tendering"        # Active estimating, RFIs, takeoffs
    SUBMITTED = "submitted"        # Proposal delivered
    NEGOTIATION = "negotiation"    # Clarifications, revisions
    AWARDED = "awarded"            # Contract accepted -> PROJECT
    DECLINED = "declined"          # We chose not to bid
    LOST = "lost"                  # Another contractor awarded
    ARCHIVED = "archived"          # Cancelled, duplicate, inactive

class ProjectType(str, Enum):
    COMMERCIAL = "commercial"
    RESIDENTIAL = "residential"
    INDUSTRIAL = "industrial"
    INSTITUTIONAL = "institutional"

class WorkType(str, Enum):
    NEW_CONSTRUCTION = "new_construction"
    RENOVATION = "renovation"
    TENANT_IMPROVEMENT = "tenant_improvement"
    SERVICE = "service"
    MAINTENANCE = "maintenance"

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

# =====================================================
# PYDANTIC MODELS
# =====================================================

class OpportunityCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    status: OpportunityStatus = OpportunityStatus.DISCOVERED
    
    # Client
    client_name: Optional[str] = None
    client_company: Optional[str] = None
    client_email: Optional[str] = None
    client_phone: Optional[str] = None
    
    # Primary Contact
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_role: Optional[str] = None
    
    # Builder
    builder_name: Optional[str] = None
    builder_company: Optional[str] = None
    builder_email: Optional[str] = None
    builder_phone: Optional[str] = None
    
    # Architect
    architect_name: Optional[str] = None
    architect_company: Optional[str] = None
    
    # Location
    site_address: Optional[str] = None
    site_city: Optional[str] = None
    site_province: str = "British Columbia"
    site_postal_code: Optional[str] = None
    site_notes: Optional[str] = None
    
    # Classification
    project_type: Optional[str] = None
    work_type: Optional[str] = None
    trade_category: Optional[str] = None
    scope_summary: Optional[str] = None
    
    # Value
    estimated_value: Optional[float] = None
    confidence_percent: int = 50
    priority: str = "medium"
    
    # Timeline
    tender_due_date: Optional[datetime] = None
    tender_due_time: Optional[str] = None
    site_visit_date: Optional[datetime] = None
    decision_expected_date: Optional[datetime] = None
    project_start_date: Optional[datetime] = None
    project_duration_days: Optional[int] = None
    
    # Source
    lead_source: Optional[str] = None
    referred_by: Optional[str] = None
    bid_invitation_date: Optional[datetime] = None
    
    # Bonding
    bond_required: bool = False
    bond_type: Optional[str] = None
    bond_amount: Optional[float] = None
    insurance_requirements: Optional[str] = None
    
    # Tags
    tags: Optional[List[str]] = None

class OpportunityUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    
    client_name: Optional[str] = None
    client_company: Optional[str] = None
    client_email: Optional[str] = None
    client_phone: Optional[str] = None
    
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_role: Optional[str] = None
    
    builder_name: Optional[str] = None
    builder_company: Optional[str] = None
    builder_email: Optional[str] = None
    builder_phone: Optional[str] = None
    
    architect_name: Optional[str] = None
    architect_company: Optional[str] = None
    architect_email: Optional[str] = None
    architect_phone: Optional[str] = None
    
    site_address: Optional[str] = None
    site_city: Optional[str] = None
    site_province: Optional[str] = None
    site_postal_code: Optional[str] = None
    site_notes: Optional[str] = None
    
    project_type: Optional[str] = None
    work_type: Optional[str] = None
    trade_category: Optional[str] = None
    scope_summary: Optional[str] = None
    
    estimated_value: Optional[float] = None
    confidence_percent: Optional[int] = None
    priority: Optional[str] = None
    
    tender_due_date: Optional[datetime] = None
    tender_due_time: Optional[str] = None
    site_visit_date: Optional[datetime] = None
    decision_expected_date: Optional[datetime] = None
    project_start_date: Optional[datetime] = None
    project_end_date: Optional[datetime] = None
    project_duration_days: Optional[int] = None
    
    lead_source: Optional[str] = None
    referred_by: Optional[str] = None
    bid_invitation_date: Optional[datetime] = None
    
    bond_required: Optional[bool] = None
    bond_type: Optional[str] = None
    bond_amount: Optional[float] = None
    insurance_requirements: Optional[str] = None
    
    assigned_to: Optional[str] = None
    assigned_estimator: Optional[str] = None
    assigned_project_manager: Optional[str] = None
    
    tags: Optional[List[str]] = None

class StatusChangeRequest(BaseModel):
    status: OpportunityStatus
    reason: Optional[str] = None
    notes: Optional[str] = None
    competitor_name: Optional[str] = None
    competitor_bid_amount: Optional[float] = None
    lessons_learned: Optional[str] = None

class ActivityCreate(BaseModel):
    event_type: str
    event_title: str
    event_description: Optional[str] = None
    event_data: Optional[Dict[str, Any]] = None

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

async def verify_token_and_get_org(authorization: str) -> tuple:
    """Verify JWT and get user_id and current organization_id"""
    try:
        token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
        decoded = jwt.decode(token, options={"verify_signature": False})
        user_id = decoded.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Get user's primary organization
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/organization_members?"
                f"user_id=eq.{user_id}&"
                f"is_active=eq.true&"
                f"is_primary=eq.true&"
                f"select=organization_id",
                headers=await get_service_headers()
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to fetch organization")
            
            members = response.json()
            if not members:
                # Try to get any organization
                response = await client.get(
                    f"{SUPABASE_URL}/rest/v1/organization_members?"
                    f"user_id=eq.{user_id}&"
                    f"is_active=eq.true&"
                    f"select=organization_id&"
                    f"limit=1",
                    headers=await get_service_headers()
                )
                members = response.json() if response.status_code == 200 else []
            
            if not members:
                raise HTTPException(status_code=403, detail="User not a member of any organization")
            
            org_id = members[0]['organization_id']
            return user_id, org_id
            
    except jwt.DecodeError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

async def log_activity(org_id: str, opp_id: str, event_type: str, title: str, 
                       description: str = None, event_data: dict = None,
                       user_id: str = None, user_name: str = None, tender_id: str = None):
    """Log an activity event for an opportunity"""
    try:
        async with httpx.AsyncClient() as client:
            activity = {
                "opportunity_id": opp_id,
                "organization_id": org_id,
                "event_type": event_type,
                "event_title": title,
                "event_description": description,
                "event_data": event_data or {},
                "performed_by": user_id,
                "performed_by_name": user_name,
                "tender_id": tender_id
            }
            
            await client.post(
                f"{SUPABASE_URL}/rest/v1/opportunity_activity",
                headers=await get_service_headers(),
                json=activity
            )
    except Exception as e:
        logger.error(f"Failed to log activity: {e}")

# =====================================================
# VALID STATUS TRANSITIONS (WORKFLOW STAGES)
# =====================================================

VALID_TRANSITIONS = {
    "discovered": ["qualifying", "tendering", "declined", "archived"],
    "qualifying": ["discovered", "tendering", "declined", "archived"],
    "tendering": ["qualifying", "submitted", "declined", "archived"],
    "submitted": ["tendering", "negotiation", "awarded", "lost", "archived"],
    "negotiation": ["submitted", "tendering", "awarded", "lost", "archived"],
    "awarded": ["archived"],  # Awarded converts to project - terminal except archive
    "declined": ["discovered", "archived"],  # Can resurrect
    "lost": ["discovered", "archived"],  # Can resurrect
    "archived": []  # Archive is terminal
}

def validate_status_transition(current: str, new: str) -> bool:
    """Check if a status transition is valid"""
    if current == new:
        return True  # No change is always valid
    return new in VALID_TRANSITIONS.get(current, [])

# =====================================================
# API ENDPOINTS
# =====================================================

@router.get("/health")
async def opportunities_health():
    """Health check for opportunities service"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/opportunities?limit=1",
                headers=await get_service_headers()
            )
            
            if response.status_code == 200:
                return {"status": "healthy", "service": "opportunities"}
            elif 'does not exist' in response.text:
                return {
                    "status": "pending",
                    "service": "opportunities",
                    "message": "Run migration 014_opportunity_tender_foundation.sql"
                }
            else:
                return {"status": "degraded", "service": "opportunities"}
    except Exception as e:
        return {"status": "error", "service": "opportunities", "error": str(e)[:100]}

@router.get("/workflow-stages")
async def get_workflow_stages():
    """Get all workflow stages and valid transitions"""
    return {
        "stages": [
            {"id": "discovered", "label": "Discovered", "description": "Initial opportunity identified"},
            {"id": "qualifying", "label": "Qualifying", "description": "Gathering info, drawings, site visits"},
            {"id": "tendering", "label": "Tendering", "description": "Active estimating, RFIs, takeoffs"},
            {"id": "submitted", "label": "Submitted", "description": "Proposal delivered to client"},
            {"id": "negotiation", "label": "Negotiation", "description": "Clarifications, revisions, value engineering"},
            {"id": "awarded", "label": "Awarded", "description": "Contract accepted - converts to project"},
            {"id": "declined", "label": "Declined", "description": "We chose not to bid"},
            {"id": "lost", "label": "Lost", "description": "Another contractor was awarded"},
            {"id": "archived", "label": "Archived", "description": "Cancelled, duplicate, or inactive"}
        ],
        "transitions": VALID_TRANSITIONS,
        "active_stages": ["discovered", "qualifying", "tendering", "submitted", "negotiation"],
        "terminal_stages": ["awarded", "declined", "lost", "archived"]
    }

@router.get("")
async def list_opportunities(
    authorization: str = Header(...),
    status: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    search: Optional[str] = Query(None, description="Search name, client, address"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """
    List opportunities for the current organization.
    Supports filtering, searching, and pagination.
    """
    user_id, org_id = await verify_token_and_get_org(authorization)
    
    try:
        async with httpx.AsyncClient() as client:
            # Build query
            query = f"organization_id=eq.{org_id}"
            
            if status:
                query += f"&status=eq.{status}"
            
            if priority:
                query += f"&priority=eq.{priority}"
            
            # Build order
            order = f"{sort_by}.{sort_order}"
            
            url = (f"{SUPABASE_URL}/rest/v1/opportunities?"
                   f"{query}&select=*&order={order}&limit={limit}&offset={offset}")
            
            response = await client.get(url, headers=await get_service_headers())
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to fetch opportunities")
            
            opportunities = response.json()
            
            # Get total count
            count_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/opportunities?{query}&select=id",
                headers={**await get_service_headers(), "Prefer": "count=exact"}
            )
            total = int(count_response.headers.get('content-range', '0-0/0').split('/')[-1])
            
            # Format response
            formatted = []
            for opp in opportunities:
                formatted.append({
                    "id": opp.get("id"),
                    "reference_number": opp.get("reference_number"),
                    "name": opp.get("name"),
                    "status": opp.get("status"),
                    "priority": opp.get("priority"),
                    "client_name": opp.get("client_name"),
                    "client_company": opp.get("client_company"),
                    "builder_company": opp.get("builder_company"),
                    "site_address": opp.get("site_address"),
                    "site_city": opp.get("site_city"),
                    "estimated_value": opp.get("estimated_value"),
                    "confidence_percent": opp.get("confidence_percent"),
                    "tender_due_date": opp.get("tender_due_date"),
                    "project_type": opp.get("project_type"),
                    "trade_category": opp.get("trade_category"),
                    "assigned_to": opp.get("assigned_to"),
                    "assigned_estimator": opp.get("assigned_estimator"),
                    "tags": opp.get("tags"),
                    "created_at": opp.get("created_at"),
                    "updated_at": opp.get("updated_at")
                })
            
            return {
                "success": True,
                "opportunities": formatted,
                "total": total,
                "limit": limit,
                "offset": offset
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing opportunities: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
async def create_opportunity(
    opportunity: OpportunityCreate,
    authorization: str = Header(...)
):
    """Create a new opportunity (starts a new Opportunity Workspace)"""
    user_id, org_id = await verify_token_and_get_org(authorization)
    
    try:
        async with httpx.AsyncClient() as client:
            # Generate reference number
            ref_response = await client.post(
                f"{SUPABASE_URL}/rest/v1/rpc/generate_opportunity_reference",
                headers=await get_service_headers(),
                json={"org_id": org_id}
            )
            
            reference_number = None
            if ref_response.status_code == 200:
                reference_number = ref_response.json()
            
            # Build opportunity data
            opp_data = {
                "organization_id": org_id,
                "reference_number": reference_number,
                "created_by": user_id,
                **opportunity.model_dump(exclude_none=True)
            }
            
            # Convert datetime objects to ISO strings
            datetime_fields = ['tender_due_date', 'site_visit_date', 'decision_expected_date', 
                             'project_start_date', 'bid_invitation_date']
            for key in datetime_fields:
                if key in opp_data and opp_data[key]:
                    if isinstance(opp_data[key], datetime):
                        opp_data[key] = opp_data[key].isoformat()
            
            # Create opportunity
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/opportunities",
                headers=await get_service_headers(),
                json=opp_data
            )
            
            if response.status_code not in [200, 201]:
                logger.error(f"Create failed: {response.text}")
                raise HTTPException(status_code=500, detail="Failed to create opportunity")
            
            created = response.json()
            if isinstance(created, list):
                created = created[0]
            
            # Log activity
            await log_activity(
                org_id=org_id,
                opp_id=created['id'],
                event_type="created",
                title=f"Opportunity created: {opportunity.name}",
                description=f"New opportunity in {opportunity.status.value} stage",
                user_id=user_id
            )
            
            return {
                "success": True,
                "opportunity": created
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating opportunity: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{opportunity_id}")
async def get_opportunity(
    opportunity_id: str,
    authorization: str = Header(...)
):
    """Get a single opportunity workspace with full details"""
    user_id, org_id = await verify_token_and_get_org(authorization)
    
    try:
        async with httpx.AsyncClient() as client:
            # Get opportunity
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/opportunities?"
                f"id=eq.{opportunity_id}&"
                f"organization_id=eq.{org_id}&"
                f"select=*",
                headers=await get_service_headers()
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to fetch opportunity")
            
            opportunities = response.json()
            if not opportunities:
                raise HTTPException(status_code=404, detail="Opportunity not found")
            
            opportunity = opportunities[0]
            
            # Get current tender (if any)
            tender_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/tenders?"
                f"opportunity_id=eq.{opportunity_id}&"
                f"is_current=eq.true&"
                f"select=id,version_number,status,total,created_at,updated_at",
                headers=await get_service_headers()
            )
            
            current_tender = None
            if tender_response.status_code == 200:
                tenders = tender_response.json()
                if tenders:
                    current_tender = tenders[0]
            
            # Get tender count
            tender_count_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/tenders?"
                f"opportunity_id=eq.{opportunity_id}&"
                f"select=id",
                headers={**await get_service_headers(), "Prefer": "count=exact"}
            )
            tender_count = int(tender_count_response.headers.get('content-range', '0-0/0').split('/')[-1])
            
            # Get document count
            doc_count_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/opportunity_documents?"
                f"opportunity_id=eq.{opportunity_id}&"
                f"select=id",
                headers={**await get_service_headers(), "Prefer": "count=exact"}
            )
            doc_count = int(doc_count_response.headers.get('content-range', '0-0/0').split('/')[-1])
            
            # Get RFI count
            rfi_count_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/opportunity_rfis?"
                f"opportunity_id=eq.{opportunity_id}&"
                f"select=id",
                headers={**await get_service_headers(), "Prefer": "count=exact"}
            )
            rfi_count = int(rfi_count_response.headers.get('content-range', '0-0/0').split('/')[-1])
            
            # Get recent activity
            activity_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/opportunity_activity?"
                f"opportunity_id=eq.{opportunity_id}&"
                f"select=id,event_type,event_title,created_at&"
                f"order=created_at.desc&limit=5",
                headers=await get_service_headers()
            )
            recent_activity = activity_response.json() if activity_response.status_code == 200 else []
            
            return {
                "success": True,
                "opportunity": opportunity,
                "workspace_summary": {
                    "current_tender": current_tender,
                    "tender_count": tender_count,
                    "document_count": doc_count,
                    "rfi_count": rfi_count,
                    "recent_activity": recent_activity
                }
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching opportunity: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{opportunity_id}")
async def update_opportunity(
    opportunity_id: str,
    updates: OpportunityUpdate,
    authorization: str = Header(...)
):
    """Update an opportunity"""
    user_id, org_id = await verify_token_and_get_org(authorization)
    
    try:
        async with httpx.AsyncClient() as client:
            # Verify ownership
            check_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/opportunities?"
                f"id=eq.{opportunity_id}&"
                f"organization_id=eq.{org_id}&"
                f"select=id,name",
                headers=await get_service_headers()
            )
            
            if check_response.status_code != 200 or not check_response.json():
                raise HTTPException(status_code=404, detail="Opportunity not found")
            
            # Build update data
            update_data = updates.model_dump(exclude_none=True)
            update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
            
            # Convert datetime objects
            datetime_fields = ['tender_due_date', 'site_visit_date', 'decision_expected_date', 
                             'project_start_date', 'project_end_date', 'bid_invitation_date']
            for key in datetime_fields:
                if key in update_data and update_data[key]:
                    if isinstance(update_data[key], datetime):
                        update_data[key] = update_data[key].isoformat()
            
            # Update
            response = await client.patch(
                f"{SUPABASE_URL}/rest/v1/opportunities?"
                f"id=eq.{opportunity_id}",
                headers=await get_service_headers(),
                json=update_data
            )
            
            if response.status_code not in [200, 204]:
                raise HTTPException(status_code=500, detail="Failed to update opportunity")
            
            # Log activity
            await log_activity(
                org_id=org_id,
                opp_id=opportunity_id,
                event_type="updated",
                title="Opportunity updated",
                event_data={"fields_updated": list(update_data.keys())},
                user_id=user_id
            )
            
            # Fetch updated record
            updated_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/opportunities?"
                f"id=eq.{opportunity_id}&select=*",
                headers=await get_service_headers()
            )
            
            updated = updated_response.json()[0] if updated_response.status_code == 200 else None
            
            return {
                "success": True,
                "opportunity": updated
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating opportunity: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{opportunity_id}/status")
async def change_opportunity_status(
    opportunity_id: str,
    status_change: StatusChangeRequest,
    authorization: str = Header(...)
):
    """
    Change the workflow stage of an opportunity.
    Validates the transition against the allowed workflow.
    """
    user_id, org_id = await verify_token_and_get_org(authorization)
    
    try:
        async with httpx.AsyncClient() as client:
            # Get current opportunity
            check_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/opportunities?"
                f"id=eq.{opportunity_id}&"
                f"organization_id=eq.{org_id}&"
                f"select=id,name,status",
                headers=await get_service_headers()
            )
            
            if check_response.status_code != 200 or not check_response.json():
                raise HTTPException(status_code=404, detail="Opportunity not found")
            
            current = check_response.json()[0]
            current_status = current['status']
            new_status = status_change.status.value
            
            # Validate transition
            if not validate_status_transition(current_status, new_status):
                raise HTTPException(
                    status_code=400, 
                    detail=f"Invalid workflow transition: {current_status} → {new_status}"
                )
            
            # Build update
            update_data = {
                "status": new_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            # Add outcome data for terminal statuses
            if new_status in ['awarded', 'lost', 'declined']:
                update_data["outcome_date"] = datetime.now(timezone.utc).isoformat()
                if status_change.reason:
                    update_data["outcome_reason"] = status_change.reason
                if status_change.notes:
                    update_data["outcome_notes"] = status_change.notes
                if status_change.lessons_learned:
                    update_data["lessons_learned"] = status_change.lessons_learned
                    
                if new_status == 'lost':
                    if status_change.competitor_name:
                        update_data["competitor_name"] = status_change.competitor_name
                    if status_change.competitor_bid_amount:
                        update_data["competitor_bid_amount"] = status_change.competitor_bid_amount
            
            # Update
            response = await client.patch(
                f"{SUPABASE_URL}/rest/v1/opportunities?"
                f"id=eq.{opportunity_id}",
                headers=await get_service_headers(),
                json=update_data
            )
            
            if response.status_code not in [200, 204]:
                raise HTTPException(status_code=500, detail="Failed to update status")
            
            # Log activity
            await log_activity(
                org_id=org_id,
                opp_id=opportunity_id,
                event_type="status_changed",
                title=f"Stage changed: {current_status} → {new_status}",
                description=status_change.reason,
                event_data={
                    "old_status": current_status,
                    "new_status": new_status,
                    "reason": status_change.reason
                },
                user_id=user_id
            )
            
            return {
                "success": True,
                "previous_status": current_status,
                "new_status": new_status,
                "message": f"Workflow stage changed to {new_status}"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error changing status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{opportunity_id}/activity")
async def get_opportunity_activity(
    opportunity_id: str,
    authorization: str = Header(...),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get activity timeline for an opportunity workspace"""
    user_id, org_id = await verify_token_and_get_org(authorization)
    
    try:
        async with httpx.AsyncClient() as client:
            # Verify access
            check_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/opportunities?"
                f"id=eq.{opportunity_id}&"
                f"organization_id=eq.{org_id}&"
                f"select=id",
                headers=await get_service_headers()
            )
            
            if check_response.status_code != 200 or not check_response.json():
                raise HTTPException(status_code=404, detail="Opportunity not found")
            
            # Get activity
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/opportunity_activity?"
                f"opportunity_id=eq.{opportunity_id}&"
                f"select=*&"
                f"order=created_at.desc&"
                f"limit={limit}&offset={offset}",
                headers=await get_service_headers()
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to fetch activity")
            
            activities = response.json()
            
            return {
                "success": True,
                "activities": activities,
                "limit": limit,
                "offset": offset
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching activity: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{opportunity_id}/activity")
async def add_activity_note(
    opportunity_id: str,
    activity: ActivityCreate,
    authorization: str = Header(...)
):
    """Add a manual activity/note to an opportunity workspace"""
    user_id, org_id = await verify_token_and_get_org(authorization)
    
    try:
        async with httpx.AsyncClient() as client:
            # Verify access
            check_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/opportunities?"
                f"id=eq.{opportunity_id}&"
                f"organization_id=eq.{org_id}&"
                f"select=id",
                headers=await get_service_headers()
            )
            
            if check_response.status_code != 200 or not check_response.json():
                raise HTTPException(status_code=404, detail="Opportunity not found")
            
            # Log the activity
            await log_activity(
                org_id=org_id,
                opp_id=opportunity_id,
                event_type=activity.event_type,
                title=activity.event_title,
                description=activity.event_description,
                event_data=activity.event_data,
                user_id=user_id
            )
            
            return {
                "success": True,
                "message": "Activity logged"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding activity: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{opportunity_id}")
async def delete_opportunity(
    opportunity_id: str,
    authorization: str = Header(...)
):
    """
    Delete an opportunity.
    Only allows deletion of opportunities in 'discovered' or 'archived' status.
    """
    user_id, org_id = await verify_token_and_get_org(authorization)
    
    try:
        async with httpx.AsyncClient() as client:
            # Get opportunity
            check_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/opportunities?"
                f"id=eq.{opportunity_id}&"
                f"organization_id=eq.{org_id}&"
                f"select=id,name,status",
                headers=await get_service_headers()
            )
            
            if check_response.status_code != 200 or not check_response.json():
                raise HTTPException(status_code=404, detail="Opportunity not found")
            
            opp = check_response.json()[0]
            
            # Only allow deletion of discovered or archived
            if opp['status'] not in ['discovered', 'archived']:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Cannot delete opportunity in '{opp['status']}' stage. Archive it first."
                )
            
            # Delete
            response = await client.delete(
                f"{SUPABASE_URL}/rest/v1/opportunities?"
                f"id=eq.{opportunity_id}",
                headers=await get_service_headers()
            )
            
            if response.status_code not in [200, 204]:
                raise HTTPException(status_code=500, detail="Failed to delete opportunity")
            
            return {
                "success": True,
                "message": f"Opportunity '{opp['name']}' deleted"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting opportunity: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats/pipeline")
async def get_pipeline_stats(authorization: str = Header(...)):
    """Get pipeline statistics grouped by workflow stage"""
    user_id, org_id = await verify_token_and_get_org(authorization)
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/opportunities?"
                f"organization_id=eq.{org_id}&"
                f"select=status,estimated_value,priority,tender_due_date",
                headers=await get_service_headers()
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to fetch stats")
            
            opportunities = response.json()
            
            # Aggregate by status
            stats = {}
            for opp in opportunities:
                status = opp.get('status', 'unknown')
                if status not in stats:
                    stats[status] = {"count": 0, "value": 0}
                stats[status]["count"] += 1
                stats[status]["value"] += float(opp.get('estimated_value') or 0)
            
            # Calculate totals
            total_count = sum(s["count"] for s in stats.values())
            total_value = sum(s["value"] for s in stats.values())
            
            # Active pipeline (excluding terminal statuses)
            active_statuses = ['discovered', 'qualifying', 'tendering', 'submitted', 'negotiation']
            active_count = sum(stats.get(s, {}).get("count", 0) for s in active_statuses)
            active_value = sum(stats.get(s, {}).get("value", 0) for s in active_statuses)
            
            return {
                "success": True,
                "by_status": stats,
                "total": {"count": total_count, "value": total_value},
                "active_pipeline": {"count": active_count, "value": active_value}
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching pipeline stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
