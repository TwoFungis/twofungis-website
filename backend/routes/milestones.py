"""
TradeOS Milestones API Routes
Handles project milestone management with status workflow
"""
from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, timezone, date
import httpx
import os
import logging
import json

router = APIRouter(prefix="/api/milestones", tags=["milestones"])
logger = logging.getLogger(__name__)

# Environment variables
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

# Valid status transitions
STATUS_TRANSITIONS = {
    'draft': ['submitted'],
    'submitted': ['approved', 'draft'],  # Can reject back to draft
    'approved': ['invoiced'],
    'invoiced': ['paid'],
    'paid': []  # Terminal state
}

# Pydantic Models
class MilestoneCreate(BaseModel):
    project_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    amount: float
    due_date: Optional[str] = None
    notes: Optional[str] = None

class MilestoneUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    due_date: Optional[str] = None
    notes: Optional[str] = None

class MilestoneStatusUpdate(BaseModel):
    status: str


def get_user_id_from_token(authorization: str) -> Optional[str]:
    """Extract user_id from JWT token"""
    if not authorization or not authorization.startswith('Bearer '):
        return None
    try:
        token = authorization.replace('Bearer ', '')
        import base64
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


async def supabase_request(method: str, endpoint: str, data: Optional[Dict] = None, params: Optional[Dict] = None) -> Dict:
    """Make authenticated request to Supabase REST API"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    
    async with httpx.AsyncClient() as client:
        if method == "GET":
            response = await client.get(url, headers=headers, params=params)
        elif method == "POST":
            response = await client.post(url, headers=headers, json=data)
        elif method == "PATCH":
            response = await client.patch(url, headers=headers, json=data, params=params)
        elif method == "DELETE":
            response = await client.delete(url, headers=headers, params=params)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        if response.status_code >= 400:
            logger.error(f"Supabase error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=response.status_code, detail=response.text)
        
        if response.text:
            return response.json()
        return {}


@router.get("")
async def list_milestones(
    authorization: str = Header(None),
    project_id: Optional[str] = None,
    status: Optional[str] = None
):
    """List all milestones for the authenticated user"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        params = {
            "user_id": f"eq.{user_id}",
            "order": "created_at.desc",
            "select": "*"
        }
        
        if project_id:
            params["project_id"] = f"eq.{project_id}"
        
        if status and status != 'all':
            params["status"] = f"eq.{status}"
        
        milestones = await supabase_request("GET", "project_milestones", params=params)
        
        if not isinstance(milestones, list):
            milestones = []
        
        # Calculate stats
        stats = {
            "total": len(milestones),
            "pending_approval": len([m for m in milestones if m.get('status') == 'submitted']),
            "ready_to_invoice": len([m for m in milestones if m.get('status') == 'approved']),
            "total_value": sum(m.get('amount', 0) for m in milestones),
            "invoiced_value": sum(m.get('amount', 0) for m in milestones if m.get('status') in ['invoiced', 'paid']),
            "paid_value": sum(m.get('amount', 0) for m in milestones if m.get('status') == 'paid')
        }
        
        return {"milestones": milestones, "stats": stats}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing milestones: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{milestone_id}")
async def get_milestone(
    milestone_id: str,
    authorization: str = Header(None)
):
    """Get a specific milestone"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        milestones = await supabase_request(
            "GET",
            "project_milestones",
            params={"id": f"eq.{milestone_id}", "user_id": f"eq.{user_id}"}
        )
        
        if not milestones or len(milestones) == 0:
            raise HTTPException(status_code=404, detail="Milestone not found")
        
        milestone = milestones[0]
        
        # Check if there's a linked invoice
        if milestone.get('status') in ['invoiced', 'paid']:
            try:
                invoices = await supabase_request(
                    "GET",
                    "invoices",
                    params={"milestone_id": f"eq.{milestone_id}"}
                )
                if invoices and len(invoices) > 0:
                    milestone['linked_invoice'] = invoices[0]
            except:
                pass
        
        return milestone
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting milestone: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def create_milestone(
    data: MilestoneCreate,
    authorization: str = Header(None)
):
    """Create a new milestone"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        milestone_data = {
            "user_id": user_id,
            "project_id": data.project_id,
            "name": data.name,
            "description": data.description,
            "amount": data.amount,
            "due_date": data.due_date,
            "notes": data.notes,
            "status": "draft"
        }
        
        result = await supabase_request("POST", "project_milestones", data=milestone_data)
        
        if not result or len(result) == 0:
            raise HTTPException(status_code=500, detail="Failed to create milestone")
        
        return result[0]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating milestone: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{milestone_id}")
async def update_milestone(
    milestone_id: str,
    data: MilestoneUpdate,
    authorization: str = Header(None)
):
    """Update a milestone (only if not invoiced/paid)"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Get existing milestone
        milestones = await supabase_request(
            "GET",
            "project_milestones",
            params={"id": f"eq.{milestone_id}", "user_id": f"eq.{user_id}"}
        )
        
        if not milestones or len(milestones) == 0:
            raise HTTPException(status_code=404, detail="Milestone not found")
        
        milestone = milestones[0]
        
        # Check if locked
        if milestone['status'] in ['invoiced', 'paid']:
            raise HTTPException(
                status_code=400, 
                detail="Cannot edit milestone that has been invoiced or paid"
            )
        
        # Build update data
        update_data = {k: v for k, v in data.model_dump().items() if v is not None}
        update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        result = await supabase_request(
            "PATCH",
            "project_milestones",
            data=update_data,
            params={"id": f"eq.{milestone_id}"}
        )
        
        return result[0] if result else {"status": "updated"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating milestone: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{milestone_id}/status")
async def update_milestone_status(
    milestone_id: str,
    data: MilestoneStatusUpdate,
    authorization: str = Header(None)
):
    """Update milestone status (with workflow validation)"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Get existing milestone
        milestones = await supabase_request(
            "GET",
            "project_milestones",
            params={"id": f"eq.{milestone_id}", "user_id": f"eq.{user_id}"}
        )
        
        if not milestones or len(milestones) == 0:
            raise HTTPException(status_code=404, detail="Milestone not found")
        
        milestone = milestones[0]
        current_status = milestone['status']
        new_status = data.status
        
        # Validate transition
        allowed_transitions = STATUS_TRANSITIONS.get(current_status, [])
        if new_status not in allowed_transitions:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot transition from '{current_status}' to '{new_status}'. Allowed: {allowed_transitions}"
            )
        
        now = datetime.now(timezone.utc).isoformat()
        
        # Build update data with timestamps
        update_data = {
            "status": new_status,
            "updated_at": now
        }
        
        if new_status == 'submitted':
            update_data['submitted_at'] = now
        elif new_status == 'approved':
            update_data['approved_at'] = now
        elif new_status == 'invoiced':
            update_data['invoiced_at'] = now
        elif new_status == 'paid':
            update_data['paid_at'] = now
        
        result = await supabase_request(
            "PATCH",
            "project_milestones",
            data=update_data,
            params={"id": f"eq.{milestone_id}"}
        )
        
        return result[0] if result else {"status": new_status, "message": "Status updated"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating milestone status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{milestone_id}")
async def delete_milestone(
    milestone_id: str,
    authorization: str = Header(None)
):
    """Delete a milestone (only if draft)"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Get existing milestone
        milestones = await supabase_request(
            "GET",
            "project_milestones",
            params={"id": f"eq.{milestone_id}", "user_id": f"eq.{user_id}"}
        )
        
        if not milestones or len(milestones) == 0:
            raise HTTPException(status_code=404, detail="Milestone not found")
        
        if milestones[0]['status'] != 'draft':
            raise HTTPException(
                status_code=400,
                detail="Can only delete milestones in draft status"
            )
        
        await supabase_request(
            "DELETE",
            "project_milestones",
            params={"id": f"eq.{milestone_id}"}
        )
        
        return {"status": "deleted", "message": "Milestone deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting milestone: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/project/{project_id}/summary")
async def get_project_milestones_summary(
    project_id: str,
    authorization: str = Header(None)
):
    """Get milestone summary for a specific project"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        milestones = await supabase_request(
            "GET",
            "project_milestones",
            params={
                "user_id": f"eq.{user_id}",
                "project_id": f"eq.{project_id}",
                "order": "created_at.asc"
            }
        )
        
        if not isinstance(milestones, list):
            milestones = []
        
        # Calculate summary
        total_value = sum(m.get('amount', 0) for m in milestones)
        invoiced_value = sum(m.get('amount', 0) for m in milestones if m.get('status') in ['invoiced', 'paid'])
        paid_value = sum(m.get('amount', 0) for m in milestones if m.get('status') == 'paid')
        
        return {
            "project_id": project_id,
            "milestones": milestones,
            "summary": {
                "total_milestones": len(milestones),
                "total_value": total_value,
                "invoiced_value": invoiced_value,
                "paid_value": paid_value,
                "remaining_value": total_value - paid_value,
                "completion_percentage": (paid_value / total_value * 100) if total_value > 0 else 0
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting project milestones summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))
