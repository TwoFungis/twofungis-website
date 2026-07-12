"""
Command Center Routes - TradeOS Operating System
=================================================
Aggregated data endpoints for the Command Center (Operational Headquarters).

This provides:
- Today's Focus (AI-driven priority queue)
- Pipeline Overview (Projects + Opportunities)
- Recent Activity Timeline
- Company Brain Insights
- Quick Stats

All endpoints are organization-scoped.
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
import os
import logging
import httpx
import jwt

router = APIRouter(prefix="/api/command-center", tags=["command-center"])
logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

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

async def verify_token_and_get_context(authorization: str) -> dict:
    """Verify JWT and get user context including organization"""
    try:
        token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
        decoded = jwt.decode(token, options={"verify_signature": False})
        user_id = decoded.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Get user's organization membership
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/organization_members?"
                f"user_id=eq.{user_id}&"
                f"is_active=eq.true&"
                f"select=organization_id,role,user_name,is_primary,"
                f"organizations(id,name)",
                headers=await get_service_headers()
            )
            
            org_id = None
            org_name = None
            role = None
            user_name = None
            
            if response.status_code == 200:
                members = response.json()
                if members:
                    # Find primary or first
                    membership = next((m for m in members if m.get('is_primary')), members[0])
                    org = membership.get('organizations', {})
                    org_id = org.get('id')
                    org_name = org.get('name')
                    role = membership.get('role')
                    user_name = membership.get('user_name')
            
            # Get user email
            user_email = None
            email_response = await client.get(
                f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
                }
            )
            if email_response.status_code == 200:
                user_email = email_response.json().get('email')
            
            return {
                "user_id": user_id,
                "user_email": user_email,
                "user_name": user_name,
                "organization_id": org_id,
                "organization_name": org_name,
                "role": role
            }
            
    except jwt.DecodeError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

# =====================================================
# API ENDPOINTS
# =====================================================

@router.get("/health")
async def command_center_health():
    """Health check for command center service"""
    return {"status": "healthy", "service": "command-center", "version": "2.0.0"}

@router.get("/dashboard")
async def get_command_center_dashboard(authorization: str = Header(...)):
    """
    Get all data needed for the Command Center in a single call.
    This is the primary data source for the operational headquarters.
    
    Returns:
    - today_focus: Priority items requiring attention
    - projects: Project counts by status
    - opportunities: Opportunity counts by workflow stage
    - recent_activity: Timeline of recent events
    - brain_insights: AI-generated insights (placeholder)
    - quick_stats: Summary statistics
    """
    context = await verify_token_and_get_context(authorization)
    user_id = context["user_id"]
    org_id = context.get("organization_id")
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            headers = await get_service_headers()
            now = datetime.now(timezone.utc)
            
            # ============================================
            # PROJECTS DATA
            # ============================================
            projects_data = {
                "starting_soon": 0,
                "in_progress": 0,
                "deficiencies": 0,
                "completed": 0,
                "total": 0
            }
            
            try:
                # Query projects - try organization first, then user
                if org_id:
                    projects_query = f"organization_id=eq.{org_id}"
                else:
                    projects_query = f"user_id=eq.{user_id}"
                
                projects_res = await client.get(
                    f"{SUPABASE_URL}/rest/v1/projects?"
                    f"{projects_query}&select=id,status,start_date,created_at",
                    headers=headers
                )
                
                if projects_res.status_code == 200:
                    projects = projects_res.json()
                    projects_data["total"] = len(projects)
                    
                    for p in projects:
                        status = (p.get('status') or '').lower()
                        start_date = p.get('start_date')
                        
                        # Map statuses
                        if status in ['pending', 'planned', 'starting_soon']:
                            # Check if starting within 14 days
                            if start_date:
                                try:
                                    sd = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                                    if sd > now and sd < now + timedelta(days=14):
                                        projects_data["starting_soon"] += 1
                                    elif status not in ['active', 'in_progress']:
                                        projects_data["starting_soon"] += 1
                                except (ValueError, TypeError):
                                    projects_data["starting_soon"] += 1
                            else:
                                projects_data["starting_soon"] += 1
                        elif status in ['active', 'in_progress', 'in progress']:
                            projects_data["in_progress"] += 1
                        elif status in ['deficiency', 'on_hold', 'on hold', 'issues']:
                            projects_data["deficiencies"] += 1
                        elif status in ['completed', 'done', 'closed']:
                            projects_data["completed"] += 1
                        else:
                            # Default unrecognized to in_progress if not completed-sounding
                            if 'complet' in status or 'done' in status or 'closed' in status:
                                projects_data["completed"] += 1
                            else:
                                projects_data["in_progress"] += 1
            except Exception as e:
                logger.warning(f"Projects fetch error: {e}")
            
            # ============================================
            # OPPORTUNITIES DATA
            # ============================================
            opportunities_data = {
                "discovered": 0,
                "qualifying": 0,
                "tendering": 0,
                "submitted": 0,
                "negotiation": 0,
                "awarded": 0,
                "lost": 0,
                "total_active": 0,
                "total_value": 0
            }
            
            try:
                if org_id:
                    opps_res = await client.get(
                        f"{SUPABASE_URL}/rest/v1/opportunities?"
                        f"organization_id=eq.{org_id}&"
                        f"select=id,status,estimated_value,tender_due_date,priority",
                        headers=headers
                    )
                    
                    if opps_res.status_code == 200:
                        opps = opps_res.json()
                        active_stages = ['discovered', 'qualifying', 'tendering', 'submitted', 'negotiation']
                        
                        for opp in opps:
                            status = opp.get('status', '').lower()
                            value = float(opp.get('estimated_value') or 0)
                            
                            if status in opportunities_data:
                                opportunities_data[status] += 1
                            
                            if status in active_stages:
                                opportunities_data["total_active"] += 1
                                opportunities_data["total_value"] += value
            except Exception as e:
                logger.warning(f"Opportunities fetch error: {e}")
            
            # ============================================
            # TODAY'S FOCUS - Priority Items
            # ============================================
            today_focus = []
            
            try:
                # Tender deadlines in next 7 days
                if org_id:
                    deadline_cutoff = (now + timedelta(days=7)).isoformat()
                    
                    deadline_res = await client.get(
                        f"{SUPABASE_URL}/rest/v1/opportunities?"
                        f"organization_id=eq.{org_id}&"
                        f"status=in.(qualifying,tendering)&"
                        f"tender_due_date=lt.{deadline_cutoff}&"
                        f"select=id,name,tender_due_date,priority&"
                        f"order=tender_due_date.asc&limit=5",
                        headers=headers
                    )
                    
                    if deadline_res.status_code == 200:
                        deadlines = deadline_res.json()
                        for d in deadlines:
                            due_date = d.get('tender_due_date')
                            if due_date:
                                try:
                                    dd = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
                                    days_until = (dd - now).days
                                    priority_type = "urgent" if days_until <= 2 else "info"
                                    
                                    today_focus.append({
                                        "id": d['id'],
                                        "type": "deadline",
                                        "title": f"Tender Due: {d['name']}",
                                        "subtitle": f"Due in {days_until} day{'s' if days_until != 1 else ''}",
                                        "priority": priority_type,
                                        "link": f"/app/opportunities/{d['id']}"
                                    })
                                except (ValueError, TypeError):
                                    pass
                
                # High priority opportunities
                if org_id and len(today_focus) < 3:
                    priority_res = await client.get(
                        f"{SUPABASE_URL}/rest/v1/opportunities?"
                        f"organization_id=eq.{org_id}&"
                        f"priority=in.(high,urgent)&"
                        f"status=in.(discovered,qualifying,tendering)&"
                        f"select=id,name,status,priority&"
                        f"order=created_at.desc&limit=3",
                        headers=headers
                    )
                    
                    if priority_res.status_code == 200:
                        priorities = priority_res.json()
                        for p in priorities:
                            if not any(f['id'] == p['id'] for f in today_focus):
                                today_focus.append({
                                    "id": p['id'],
                                    "type": "priority",
                                    "title": p['name'],
                                    "subtitle": f"{p['priority'].title()} priority • {p['status'].title()}",
                                    "priority": "urgent" if p['priority'] == 'urgent' else "info",
                                    "link": f"/app/opportunities/{p['id']}"
                                })
                
                # Active projects starting soon
                if len(today_focus) < 3:
                    start_cutoff = (now + timedelta(days=14)).isoformat()
                    query = f"organization_id=eq.{org_id}" if org_id else f"user_id=eq.{user_id}"
                    
                    starting_res = await client.get(
                        f"{SUPABASE_URL}/rest/v1/projects?"
                        f"{query}&"
                        f"status=in.(pending,planned,starting_soon)&"
                        f"start_date=lt.{start_cutoff}&"
                        f"select=id,name,start_date&"
                        f"order=start_date.asc&limit=3",
                        headers=headers
                    )
                    
                    if starting_res.status_code == 200:
                        starting = starting_res.json()
                        for s in starting:
                            if len(today_focus) >= 3:
                                break
                            today_focus.append({
                                "id": s['id'],
                                "type": "project_starting",
                                "title": f"Starting Soon: {s['name']}",
                                "subtitle": f"Starts {s.get('start_date', 'Soon')[:10]}",
                                "priority": "success",
                                "link": f"/app/projects/{s['id']}"
                            })
                            
            except Exception as e:
                logger.warning(f"Today's focus fetch error: {e}")
            
            # ============================================
            # RECENT ACTIVITY TIMELINE
            # ============================================
            recent_activity = []
            
            try:
                if org_id:
                    # Get opportunity activity
                    activity_res = await client.get(
                        f"{SUPABASE_URL}/rest/v1/opportunity_activity?"
                        f"organization_id=eq.{org_id}&"
                        f"select=id,event_type,event_title,performed_by_name,created_at&"
                        f"order=created_at.desc&limit=10",
                        headers=headers
                    )
                    
                    if activity_res.status_code == 200:
                        activities = activity_res.json()
                        for a in activities:
                            event_type = a.get('event_type', '')
                            action_type = "create" if event_type == "created" else "update" if event_type == "updated" else "info"
                            
                            recent_activity.append({
                                "id": a.get('id'),
                                "user": a.get('performed_by_name') or "Team Member",
                                "action": a.get('event_title', 'Updated an opportunity'),
                                "time": a.get('created_at'),
                                "type": action_type
                            })
            except Exception as e:
                logger.warning(f"Activity fetch error: {e}")
            
            # ============================================
            # BRAIN INSIGHTS (Placeholder for AI)
            # ============================================
            brain_insights = {
                "has_insights": False,
                "insights": [],
                "recommendations": []
            }
            
            # Generate simple rule-based insights
            if opportunities_data["tendering"] > 0:
                brain_insights["has_insights"] = True
                brain_insights["insights"].append({
                    "type": "workload",
                    "message": f"You have {opportunities_data['tendering']} active tender{'s' if opportunities_data['tendering'] > 1 else ''} in progress.",
                    "priority": "info"
                })
            
            if len(today_focus) > 0:
                deadline_items = [f for f in today_focus if f['type'] == 'deadline']
                if deadline_items:
                    brain_insights["has_insights"] = True
                    brain_insights["recommendations"].append({
                        "type": "action",
                        "message": f"Review {len(deadline_items)} upcoming tender deadline{'s' if len(deadline_items) > 1 else ''}.",
                        "action_link": "/app/opportunities?status=tendering"
                    })
            
            # ============================================
            # QUICK STATS
            # ============================================
            quick_stats = {
                "active_projects": projects_data["in_progress"] + projects_data["starting_soon"],
                "active_opportunities": opportunities_data["total_active"],
                "pipeline_value": opportunities_data["total_value"],
                "tenders_in_progress": opportunities_data["tendering"],
                "pending_decisions": opportunities_data["submitted"] + opportunities_data["negotiation"]
            }
            
            return {
                "success": True,
                "organization_name": context.get("organization_name"),
                "user_name": context.get("user_name"),
                "today_focus": today_focus[:3],
                "projects": projects_data,
                "opportunities": opportunities_data,
                "recent_activity": recent_activity[:10],
                "brain_insights": brain_insights,
                "quick_stats": quick_stats,
                "generated_at": now.isoformat()
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Command center dashboard error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/quick-stats")
async def get_quick_stats(authorization: str = Header(...)):
    """Get just the quick stats for header display"""
    context = await verify_token_and_get_context(authorization)
    org_id = context.get("organization_id")
    user_id = context["user_id"]
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = await get_service_headers()
            
            stats = {
                "active_projects": 0,
                "active_opportunities": 0,
                "pipeline_value": 0
            }
            
            # Projects count
            query = f"organization_id=eq.{org_id}" if org_id else f"user_id=eq.{user_id}"
            proj_res = await client.get(
                f"{SUPABASE_URL}/rest/v1/projects?"
                f"{query}&status=in.(active,in_progress,pending,starting_soon)&"
                f"select=id",
                headers={**headers, "Prefer": "count=exact"}
            )
            if proj_res.status_code == 200:
                stats["active_projects"] = int(proj_res.headers.get('content-range', '0-0/0').split('/')[-1])
            
            # Opportunities count and value
            if org_id:
                opp_res = await client.get(
                    f"{SUPABASE_URL}/rest/v1/opportunities?"
                    f"organization_id=eq.{org_id}&"
                    f"status=in.(discovered,qualifying,tendering,submitted,negotiation)&"
                    f"select=id,estimated_value",
                    headers=headers
                )
                if opp_res.status_code == 200:
                    opps = opp_res.json()
                    stats["active_opportunities"] = len(opps)
                    stats["pipeline_value"] = sum(float(o.get('estimated_value') or 0) for o in opps)
            
            return {"success": True, **stats}
            
    except Exception as e:
        logger.error(f"Quick stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
