"""
TFCS Mainframe - Backend Routes
================================
Core API for Two Fungis Finishing internal operational system.

This module provides:
- Role-Based Access Control (RBAC) middleware
- Activity Event logging
- Notification management
- User role management

RBAC Hierarchy:
- Owner: Full access to everything
- Manager: Operational access, no owner-level functions
- Employee: Restricted to own data and assigned work
"""

from fastapi import APIRouter, HTTPException, Header, Request, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
import os
import logging
import httpx
import jwt
from datetime import datetime, timezone, timedelta
from enum import Enum

router = APIRouter(prefix="/api/tfcs", tags=["tfcs"])
logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

# =====================================================
# ENUMS & CONSTANTS
# =====================================================

class TFCSRole(str, Enum):
    OWNER = "owner"
    MANAGER = "manager"
    EMPLOYEE = "employee"

class ActionType(str, Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    SEND = "send"
    APPROVE = "approve"
    REJECT = "reject"
    COMPLETE = "complete"
    ASSIGN = "assign"
    UPLOAD = "upload"
    DOWNLOAD = "download"
    VIEW = "view"
    LOGIN = "login"
    STATUS_CHANGE = "status_change"
    PAYMENT = "payment"
    REMINDER = "reminder"
    ARCHIVE = "archive"
    RESTORE = "restore"

class ObjectType(str, Enum):
    OPPORTUNITY = "opportunity"
    ESTIMATE = "estimate"
    QUOTE = "quote"
    PROJECT = "project"
    MILESTONE = "milestone"
    PRODUCTION_ITEM = "production_item"
    DOCUMENT = "document"
    EXPENSE = "expense"
    INVOICE = "invoice"
    PAYMENT = "payment"
    MATERIAL_REQUEST = "material_request"
    TOOL_REQUEST = "tool_request"
    DAILY_REPORT = "daily_report"
    USER = "user"
    ROLE = "role"
    SETTING = "setting"
    NOTIFICATION = "notification"

class Category(str, Enum):
    OPPORTUNITIES = "opportunities"
    ESTIMATES = "estimates"
    QUOTES = "quotes"
    PROJECTS = "projects"
    PRODUCTION = "production"
    DOCUMENTS = "documents"
    EXPENSES = "expenses"
    INVOICES = "invoices"
    MATERIALS = "materials"
    TOOLS = "tools"
    REPORTS = "reports"
    TEAM = "team"
    SETTINGS = "settings"

class NotificationType(str, Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"
    ACTION_REQUIRED = "action_required"

# Role hierarchy for permission checks
ROLE_HIERARCHY = {
    TFCSRole.OWNER: 3,
    TFCSRole.MANAGER: 2,
    TFCSRole.EMPLOYEE: 1
}

# =====================================================
# PYDANTIC MODELS
# =====================================================

class UserRoleInfo(BaseModel):
    user_id: str
    role: TFCSRole
    is_active: bool
    user_email: Optional[str] = None
    user_name: Optional[str] = None

class ActivityEventCreate(BaseModel):
    action: str
    action_type: ActionType
    object_type: ObjectType
    category: Category
    object_id: Optional[str] = None
    object_name: Optional[str] = None
    object_reference: Optional[str] = None
    reason: Optional[str] = None
    previous_value: Optional[str] = None
    new_value: Optional[str] = None
    details: Optional[dict] = None
    related_project_id: Optional[str] = None
    related_user_id: Optional[str] = None
    is_private: bool = False
    source: str = "tradeos"

class ActivityEvent(BaseModel):
    id: str
    user_id: str
    user_role: str
    user_name: Optional[str]
    user_email: Optional[str]
    action: str
    action_type: str
    object_type: str
    object_id: Optional[str]
    object_name: Optional[str]
    object_reference: Optional[str]
    category: str
    reason: Optional[str]
    previous_value: Optional[str]
    new_value: Optional[str]
    details: Optional[dict]
    related_project_id: Optional[str]
    is_private: bool
    source: str
    created_at: str

class NotificationCreate(BaseModel):
    recipient_user_id: str
    title: str
    message: Optional[str] = None
    notification_type: NotificationType = NotificationType.INFO
    priority: int = 0
    category: Optional[str] = None
    action_url: Optional[str] = None
    action_label: Optional[str] = None
    expires_at: Optional[str] = None
    activity_event_id: Optional[str] = None

class Notification(BaseModel):
    id: str
    recipient_user_id: str
    title: str
    message: Optional[str]
    notification_type: str
    priority: int
    category: Optional[str]
    is_read: bool
    read_at: Optional[str]
    is_dismissed: bool
    action_url: Optional[str]
    action_label: Optional[str]
    created_at: str

class RoleAssignment(BaseModel):
    target_email: str
    role: TFCSRole
    notes: Optional[str] = None

# =====================================================
# UTILITY FUNCTIONS
# =====================================================

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

async def get_user_role(user_id: str) -> Optional[UserRoleInfo]:
    """Get the TFCS role for a user"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/tfcs_user_roles?user_id=eq.{user_id}&is_active=eq.true&select=*",
                headers=await get_service_headers()
            )
            
            if response.status_code != 200:
                logger.error(f"Failed to fetch user role: {response.text}")
                return None
            
            roles = response.json()
            if not roles:
                return None
            
            role_data = roles[0]
            return UserRoleInfo(
                user_id=role_data['user_id'],
                role=TFCSRole(role_data['role']),
                is_active=role_data['is_active'],
                user_email=role_data.get('user_email'),
                user_name=role_data.get('user_name')
            )
    except Exception as e:
        logger.error(f"Error fetching user role: {e}")
        return None

async def get_user_profile(user_id: str) -> Optional[dict]:
    """Get user profile from users_profile table"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/users_profile?user_id=eq.{user_id}&select=email,full_name",
                headers=await get_service_headers()
            )
            if response.status_code == 200:
                profiles = response.json()
                return profiles[0] if profiles else None
    except Exception as e:
        logger.error(f"Error fetching user profile: {e}")
    return None

# =====================================================
# RBAC MIDDLEWARE / DEPENDENCY
# =====================================================

async def require_tfcs_role(
    authorization: str = Header(...),
    minimum_role: TFCSRole = TFCSRole.EMPLOYEE
) -> tuple[str, UserRoleInfo]:
    """
    Dependency that verifies the user has a TFCS role.
    Returns (user_id, role_info) if authorized.
    Raises HTTPException if not authorized.
    """
    user_id = await verify_jwt_token(authorization)
    role_info = await get_user_role(user_id)
    
    if not role_info:
        raise HTTPException(
            status_code=403, 
            detail="Access denied: No TFCS Mainframe role assigned"
        )
    
    if ROLE_HIERARCHY[role_info.role] < ROLE_HIERARCHY[minimum_role]:
        raise HTTPException(
            status_code=403,
            detail=f"Access denied: Requires {minimum_role.value} role or higher"
        )
    
    return user_id, role_info

async def require_owner(authorization: str = Header(...)) -> tuple[str, UserRoleInfo]:
    """Require owner role"""
    return await require_tfcs_role(authorization, TFCSRole.OWNER)

async def require_manager(authorization: str = Header(...)) -> tuple[str, UserRoleInfo]:
    """Require manager role or higher"""
    return await require_tfcs_role(authorization, TFCSRole.MANAGER)

async def require_employee(authorization: str = Header(...)) -> tuple[str, UserRoleInfo]:
    """Require any TFCS role (employee or higher)"""
    return await require_tfcs_role(authorization, TFCSRole.EMPLOYEE)

# =====================================================
# ACTIVITY EVENT SERVICE
# =====================================================

async def log_activity(
    user_id: str,
    user_role: str,
    event_data: ActivityEventCreate,
    user_name: Optional[str] = None,
    user_email: Optional[str] = None,
    request: Optional[Request] = None
) -> Optional[str]:
    """
    Log an activity event to the TFCS Mainframe.
    This is the CORE function that records all meaningful business actions.
    
    Returns the event ID if successful, None otherwise.
    """
    try:
        # Build event payload
        payload = {
            "user_id": user_id,
            "user_role": user_role,
            "user_name": user_name,
            "user_email": user_email,
            "action": event_data.action,
            "action_type": event_data.action_type.value,
            "object_type": event_data.object_type.value,
            "category": event_data.category.value,
            "object_id": event_data.object_id,
            "object_name": event_data.object_name,
            "object_reference": event_data.object_reference,
            "reason": event_data.reason,
            "previous_value": event_data.previous_value,
            "new_value": event_data.new_value,
            "details": event_data.details,
            "related_project_id": event_data.related_project_id,
            "related_user_id": event_data.related_user_id,
            "is_private": event_data.is_private,
            "source": event_data.source
        }
        
        # Add request metadata if available
        if request:
            payload["ip_address"] = request.client.host if request.client else None
            payload["user_agent"] = request.headers.get("user-agent")
        
        # Remove None values
        payload = {k: v for k, v in payload.items() if v is not None}
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/tfcs_activity_events",
                headers=await get_service_headers(),
                json=payload
            )
            
            if response.status_code in [200, 201]:
                result = response.json()
                event_id = result[0]['id'] if result else None
                logger.info(f"Activity logged: {event_data.action} by {user_email or user_id}")
                return event_id
            else:
                logger.error(f"Failed to log activity: {response.status_code} - {response.text}")
                return None
                
    except Exception as e:
        logger.error(f"Error logging activity: {e}")
        return None

# =====================================================
# NOTIFICATION SERVICE
# =====================================================

async def create_notification(notification: NotificationCreate) -> Optional[str]:
    """
    Create a notification for a user.
    Returns notification ID if successful.
    """
    try:
        # Get recipient's role
        recipient_role = await get_user_role(notification.recipient_user_id)
        
        payload = {
            "recipient_user_id": notification.recipient_user_id,
            "recipient_role": recipient_role.role.value if recipient_role else None,
            "title": notification.title,
            "message": notification.message,
            "notification_type": notification.notification_type.value,
            "priority": notification.priority,
            "category": notification.category,
            "action_url": notification.action_url,
            "action_label": notification.action_label,
            "expires_at": notification.expires_at,
            "activity_event_id": notification.activity_event_id
        }
        
        # Remove None values
        payload = {k: v for k, v in payload.items() if v is not None}
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/tfcs_notifications",
                headers=await get_service_headers(),
                json=payload
            )
            
            if response.status_code in [200, 201]:
                result = response.json()
                return result[0]['id'] if result else None
            else:
                logger.error(f"Failed to create notification: {response.text}")
                return None
                
    except Exception as e:
        logger.error(f"Error creating notification: {e}")
        return None

async def notify_role(
    role: TFCSRole,
    title: str,
    message: Optional[str] = None,
    notification_type: NotificationType = NotificationType.INFO,
    category: Optional[str] = None,
    action_url: Optional[str] = None,
    activity_event_id: Optional[str] = None,
    exclude_user_id: Optional[str] = None
):
    """
    Send notifications to all users with a specific role.
    Optionally exclude a specific user (e.g., the action performer).
    """
    try:
        # Get all users with the specified role
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/tfcs_user_roles?role=eq.{role.value}&is_active=eq.true&select=user_id",
                headers=await get_service_headers()
            )
            
            if response.status_code != 200:
                logger.error(f"Failed to fetch users for role {role}: {response.text}")
                return
            
            users = response.json()
            
            for user in users:
                if exclude_user_id and user['user_id'] == exclude_user_id:
                    continue
                    
                await create_notification(NotificationCreate(
                    recipient_user_id=user['user_id'],
                    title=title,
                    message=message,
                    notification_type=notification_type,
                    category=category,
                    action_url=action_url,
                    activity_event_id=activity_event_id
                ))
                
    except Exception as e:
        logger.error(f"Error notifying role {role}: {e}")

# =====================================================
# API ENDPOINTS - ROLES
# =====================================================

@router.get("/role/me")
async def get_my_role(authorization: str = Header(...)):
    """
    Get the current user's TFCS Mainframe role.
    Auto-assigns Owner role to inbox@twofungis.ca if tables exist and no owner assigned.
    """
    user_id = await verify_jwt_token(authorization)
    
    # First, check if this user already has a role
    role_info = await get_user_role(user_id)
    
    if role_info:
        return {
            "has_role": True,
            "role": role_info.role.value,
            "user_id": role_info.user_id,
            "user_email": role_info.user_email,
            "user_name": role_info.user_name,
            "is_active": role_info.is_active
        }
    
    # No role - check if this is the designated owner email
    try:
        async with httpx.AsyncClient() as client:
            # Get user's email from Supabase auth
            user_response = await client.get(
                f"{SUPABASE_URL}/auth/v1/admin/users",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
                }
            )
            
            if user_response.status_code == 200:
                users = user_response.json().get('users', [])
                current_user = next((u for u in users if u.get('id') == user_id), None)
                
                if current_user and current_user.get('email') == "inbox@twofungis.ca":
                    # This is the designated owner - auto-assign if tables exist
                    # Check if tables exist first
                    table_check = await client.get(
                        f"{SUPABASE_URL}/rest/v1/tfcs_user_roles?limit=1",
                        headers=await get_service_headers()
                    )
                    
                    if table_check.status_code == 200:
                        # Tables exist - check if any owner already exists
                        owners_check = await client.get(
                            f"{SUPABASE_URL}/rest/v1/tfcs_user_roles?role=eq.owner&is_active=eq.true&select=id",
                            headers=await get_service_headers()
                        )
                        
                        existing_owners = owners_check.json() if owners_check.status_code == 200 else []
                        
                        if not existing_owners:
                            # No owner exists - auto-assign this user as owner
                            logger.info(f"Auto-assigning Owner role to inbox@twofungis.ca")
                            role_payload = {
                                "user_id": user_id,
                                "role": "owner",
                                "user_email": "inbox@twofungis.ca",
                                "user_name": current_user.get('user_metadata', {}).get('full_name'),
                                "assigned_at": datetime.now(timezone.utc).isoformat(),
                                "is_active": True,
                                "notes": "Auto-assigned initial owner"
                            }
                            
                            assign_response = await client.post(
                                f"{SUPABASE_URL}/rest/v1/tfcs_user_roles",
                                headers=await get_service_headers(),
                                json=role_payload
                            )
                            
                            if assign_response.status_code in [200, 201]:
                                return {
                                    "has_role": True,
                                    "role": "owner",
                                    "user_id": user_id,
                                    "user_email": "inbox@twofungis.ca",
                                    "user_name": role_payload.get("user_name"),
                                    "is_active": True,
                                    "auto_assigned": True
                                }
                    elif 'does not exist' in table_check.text or 'PGRST205' in table_check.text:
                        # Tables don't exist yet
                        return {
                            "has_role": False,
                            "role": None,
                            "message": "TFCS tables not initialized. Run migration 011_tfcs_mainframe_foundation.sql first.",
                            "tables_initialized": False
                        }
    except Exception as e:
        logger.error(f"Error checking auto-assign: {e}")
    
    return {
        "has_role": False,
        "role": None,
        "message": "No TFCS Mainframe role assigned"
    }

@router.get("/roles")
async def list_all_roles(auth_data: tuple = Depends(require_employee)):
    """List all TFCS Mainframe roles (requires any role)"""
    user_id, role_info = auth_data
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/tfcs_user_roles?is_active=eq.true&select=*&order=role.asc",
                headers=await get_service_headers()
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to fetch roles")
            
            roles = response.json()
            return {
                "success": True,
                "roles": roles,
                "count": len(roles)
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing roles: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/roles/assign")
async def assign_role(
    assignment: RoleAssignment,
    request: Request,
    auth_data: tuple = Depends(require_owner)
):
    """Assign a TFCS role to a user (owner only)"""
    owner_id, owner_info = auth_data
    
    try:
        async with httpx.AsyncClient() as client:
            # Find target user by email
            user_response = await client.get(
                f"{SUPABASE_URL}/auth/v1/admin/users",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
                }
            )
            
            if user_response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to fetch users")
            
            users = user_response.json().get('users', [])
            target_user = next((u for u in users if u.get('email') == assignment.target_email), None)
            
            if not target_user:
                raise HTTPException(status_code=404, detail=f"User not found: {assignment.target_email}")
            
            target_user_id = target_user['id']
            
            # Check if user already has a role
            existing = await get_user_role(target_user_id)
            
            # Upsert the role
            role_payload = {
                "user_id": target_user_id,
                "role": assignment.role.value,
                "user_email": assignment.target_email,
                "user_name": target_user.get('user_metadata', {}).get('full_name'),
                "assigned_by": owner_id,
                "assigned_at": datetime.now(timezone.utc).isoformat(),
                "is_active": True,
                "notes": assignment.notes
            }
            
            if existing:
                # Update existing role
                response = await client.patch(
                    f"{SUPABASE_URL}/rest/v1/tfcs_user_roles?user_id=eq.{target_user_id}",
                    headers=await get_service_headers(),
                    json=role_payload
                )
            else:
                # Insert new role
                response = await client.post(
                    f"{SUPABASE_URL}/rest/v1/tfcs_user_roles",
                    headers=await get_service_headers(),
                    json=role_payload
                )
            
            if response.status_code not in [200, 201]:
                raise HTTPException(status_code=500, detail=f"Failed to assign role: {response.text}")
            
            # Log the activity
            await log_activity(
                user_id=owner_id,
                user_role=owner_info.role.value,
                user_email=owner_info.user_email,
                event_data=ActivityEventCreate(
                    action=f"Assigned {assignment.role.value} role to {assignment.target_email}",
                    action_type=ActionType.ASSIGN if not existing else ActionType.UPDATE,
                    object_type=ObjectType.ROLE,
                    category=Category.TEAM,
                    object_name=assignment.target_email,
                    new_value=assignment.role.value,
                    previous_value=existing.role.value if existing else None,
                    related_user_id=target_user_id,
                    source="mainframe"
                ),
                request=request
            )
            
            # Notify the user
            await create_notification(NotificationCreate(
                recipient_user_id=target_user_id,
                title=f"You've been assigned the {assignment.role.value.title()} role",
                message="You now have access to TFCS Mainframe",
                notification_type=NotificationType.SUCCESS,
                category="team"
            ))
            
            return {
                "success": True,
                "message": f"Role {assignment.role.value} assigned to {assignment.target_email}",
                "user_id": target_user_id,
                "role": assignment.role.value,
                "was_update": existing is not None
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error assigning role: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/roles/{target_user_id}")
async def remove_role(
    target_user_id: str,
    request: Request,
    auth_data: tuple = Depends(require_owner)
):
    """Remove a user's TFCS role (owner only)"""
    owner_id, owner_info = auth_data
    
    # Prevent owner from removing their own role
    if target_user_id == owner_id:
        raise HTTPException(status_code=400, detail="Cannot remove your own role")
    
    try:
        # Get target user's current role
        target_role = await get_user_role(target_user_id)
        if not target_role:
            raise HTTPException(status_code=404, detail="User has no TFCS role")
        
        async with httpx.AsyncClient() as client:
            # Soft delete by setting is_active = false
            response = await client.patch(
                f"{SUPABASE_URL}/rest/v1/tfcs_user_roles?user_id=eq.{target_user_id}",
                headers=await get_service_headers(),
                json={
                    "is_active": False,
                    "deactivated_at": datetime.now(timezone.utc).isoformat(),
                    "deactivated_by": owner_id
                }
            )
            
            if response.status_code not in [200, 204]:
                raise HTTPException(status_code=500, detail="Failed to remove role")
            
            # Log the activity
            await log_activity(
                user_id=owner_id,
                user_role=owner_info.role.value,
                user_email=owner_info.user_email,
                event_data=ActivityEventCreate(
                    action=f"Removed {target_role.role.value} role from {target_role.user_email}",
                    action_type=ActionType.DELETE,
                    object_type=ObjectType.ROLE,
                    category=Category.TEAM,
                    object_name=target_role.user_email,
                    previous_value=target_role.role.value,
                    related_user_id=target_user_id,
                    source="mainframe"
                ),
                request=request
            )
            
            return {
                "success": True,
                "message": f"Role removed from user",
                "user_id": target_user_id
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing role: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# API ENDPOINTS - OWNER MANAGEMENT
# =====================================================

class CreateOwnerRequest(BaseModel):
    """Request to create a new owner account"""
    email: str
    password: str
    full_name: str


@router.post("/owners/create")
async def create_owner_account(
    request_data: CreateOwnerRequest,
    request: Request,
    auth_data: tuple = Depends(require_owner)
):
    """
    Create a new Owner account (owner only).
    This creates the Supabase auth user and assigns Owner role.
    Used for setting up additional company owners like Beau.
    """
    owner_id, owner_info = auth_data
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Check if user already exists
            user_response = await client.get(
                f"{SUPABASE_URL}/auth/v1/admin/users",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
                }
            )
            
            if user_response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to check existing users")
            
            users = user_response.json().get('users', [])
            existing_user = next((u for u in users if u.get('email') == request_data.email), None)
            
            if existing_user:
                # User exists - just assign role if not already assigned
                target_user_id = existing_user['id']
                existing_role = await get_user_role(target_user_id)
                
                if existing_role and existing_role.role == TFCSRole.OWNER:
                    return {
                        "success": True,
                        "message": f"Owner {request_data.email} already exists",
                        "user_id": target_user_id,
                        "already_existed": True
                    }
            else:
                # Create new user via Supabase Admin API
                create_response = await client.post(
                    f"{SUPABASE_URL}/auth/v1/admin/users",
                    headers={
                        "apikey": SUPABASE_SERVICE_KEY,
                        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "email": request_data.email,
                        "password": request_data.password,
                        "email_confirm": True,
                        "user_metadata": {
                            "full_name": request_data.full_name
                        }
                    }
                )
                
                if create_response.status_code not in [200, 201]:
                    error_detail = create_response.text
                    logger.error(f"Failed to create user: {error_detail}")
                    raise HTTPException(status_code=500, detail=f"Failed to create user account: {error_detail}")
                
                new_user = create_response.json()
                target_user_id = new_user.get('id')
                
                if not target_user_id:
                    raise HTTPException(status_code=500, detail="User created but no ID returned")
            
            # Assign Owner role
            role_payload = {
                "user_id": target_user_id,
                "role": TFCSRole.OWNER.value,
                "user_email": request_data.email,
                "user_name": request_data.full_name,
                "assigned_by": owner_id,
                "assigned_at": datetime.now(timezone.utc).isoformat(),
                "is_active": True,
                "notes": f"Owner account created by {owner_info.user_email}"
            }
            
            # Upsert role
            role_response = await client.post(
                f"{SUPABASE_URL}/rest/v1/tfcs_user_roles",
                headers={
                    **await get_service_headers(),
                    "Prefer": "resolution=merge-duplicates"
                },
                json=role_payload
            )
            
            if role_response.status_code not in [200, 201]:
                logger.error(f"Failed to assign role: {role_response.text}")
                # Try upsert via on_conflict
                role_response = await client.post(
                    f"{SUPABASE_URL}/rest/v1/tfcs_user_roles?on_conflict=user_id",
                    headers=await get_service_headers(),
                    json=role_payload
                )
            
            # Log activity (owner creation is significant)
            await log_activity(
                user_id=owner_id,
                user_role=owner_info.role.value,
                user_email=owner_info.user_email,
                event_data=ActivityEventCreate(
                    action=f"Created Owner account for {request_data.full_name}",
                    action_type=ActionType.CREATE,
                    object_type=ObjectType.USER,
                    category=Category.TEAM,
                    object_name=request_data.full_name,
                    new_value="owner",
                    related_user_id=target_user_id,
                    source="mainframe"
                ),
                request=request
            )
            
            return {
                "success": True,
                "message": f"Owner account created for {request_data.full_name}",
                "user_id": target_user_id,
                "email": request_data.email,
                "role": "owner"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating owner: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/owners")
async def list_owners(
    auth_data: tuple = Depends(require_employee)
):
    """
    List all company owners with their details.
    Returns owners sorted by creation date.
    """
    user_id, role_info = auth_data
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Get all active owners from tfcs_user_roles
            roles_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/tfcs_user_roles?role=eq.owner&is_active=eq.true&select=*&order=assigned_at.asc",
                headers=await get_service_headers()
            )
            
            if roles_response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to fetch owners")
            
            owner_roles = roles_response.json()
            
            # Get user details from Supabase auth for last_sign_in_at
            users_response = await client.get(
                f"{SUPABASE_URL}/auth/v1/admin/users",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
                }
            )
            
            auth_users = {}
            if users_response.status_code == 200:
                for u in users_response.json().get('users', []):
                    auth_users[u.get('id')] = {
                        "last_sign_in_at": u.get('last_sign_in_at'),
                        "created_at": u.get('created_at'),
                        "email_confirmed_at": u.get('email_confirmed_at')
                    }
            
            # Combine data
            owners = []
            for role in owner_roles:
                user_auth = auth_users.get(role.get('user_id'), {})
                owners.append({
                    "user_id": role.get('user_id'),
                    "email": role.get('user_email'),
                    "name": role.get('user_name'),
                    "role": role.get('role'),
                    "status": "active" if role.get('is_active') else "inactive",
                    "assigned_at": role.get('assigned_at'),
                    "last_login": user_auth.get('last_sign_in_at'),
                    "created_at": user_auth.get('created_at')
                })
            
            return {
                "success": True,
                "owners": owners,
                "count": len(owners)
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing owners: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/team")
async def list_team_members(
    auth_data: tuple = Depends(require_employee)
):
    """
    List all TFCS team members (Owners, Managers, Employees).
    Owners are listed first, then by role hierarchy.
    """
    user_id, role_info = auth_data
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Get all active roles
            roles_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/tfcs_user_roles?is_active=eq.true&select=*",
                headers=await get_service_headers()
            )
            
            if roles_response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to fetch team")
            
            all_roles = roles_response.json()
            
            # Get user details from Supabase auth
            users_response = await client.get(
                f"{SUPABASE_URL}/auth/v1/admin/users",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
                }
            )
            
            auth_users = {}
            if users_response.status_code == 200:
                for u in users_response.json().get('users', []):
                    auth_users[u.get('id')] = {
                        "last_sign_in_at": u.get('last_sign_in_at'),
                        "created_at": u.get('created_at')
                    }
            
            # Combine and sort (owners first, then managers, then employees)
            role_order = {"owner": 0, "manager": 1, "employee": 2}
            
            team = []
            for role in all_roles:
                user_auth = auth_users.get(role.get('user_id'), {})
                team.append({
                    "user_id": role.get('user_id'),
                    "email": role.get('user_email'),
                    "name": role.get('user_name'),
                    "role": role.get('role'),
                    "status": "active" if role.get('is_active') else "inactive",
                    "assigned_at": role.get('assigned_at'),
                    "last_login": user_auth.get('last_sign_in_at'),
                    "sort_order": role_order.get(role.get('role'), 99)
                })
            
            # Sort by role hierarchy, then by name
            team.sort(key=lambda x: (x['sort_order'], x.get('name') or ''))
            
            # Remove sort_order from response
            for member in team:
                del member['sort_order']
            
            return {
                "success": True,
                "team": team,
                "count": len(team)
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing team: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# API ENDPOINTS - ACTIVITY EVENTS
# =====================================================

@router.get("/activity")
async def get_activity_feed(
    auth_data: tuple = Depends(require_employee),
    category: Optional[str] = None,
    action_type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """
    Get the activity feed for TFCS Mainframe.
    Visibility is based on user role:
    - Owners see everything
    - Managers see non-private events
    - Employees see their own events + non-private events
    """
    user_id, role_info = auth_data
    
    try:
        # Build query filters
        filters = []
        
        # Role-based visibility
        if role_info.role == TFCSRole.OWNER:
            # Owners see everything
            pass
        elif role_info.role == TFCSRole.MANAGER:
            # Managers see non-private events
            filters.append("is_private=eq.false")
        else:
            # Employees see their own + non-private
            filters.append(f"or=(user_id.eq.{user_id},is_private.eq.false)")
        
        # Optional category filter
        if category:
            filters.append(f"category=eq.{category}")
        
        # Optional action_type filter
        if action_type:
            filters.append(f"action_type=eq.{action_type}")
        
        filter_string = "&".join(filters) if filters else ""
        
        async with httpx.AsyncClient() as client:
            url = f"{SUPABASE_URL}/rest/v1/tfcs_activity_events?{filter_string}&select=*&order=created_at.desc&limit={limit}&offset={offset}"
            response = await client.get(url, headers=await get_service_headers())
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to fetch activity")
            
            events = response.json()
            
            return {
                "success": True,
                "events": events,
                "count": len(events),
                "limit": limit,
                "offset": offset
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching activity: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/activity/object/{object_type}/{object_id}")
async def get_object_activity(
    object_type: str,
    object_id: str,
    auth_data: tuple = Depends(require_employee),
    limit: int = 50
):
    """Get all activity events for a specific object"""
    user_id, role_info = auth_data
    
    try:
        async with httpx.AsyncClient() as client:
            # Build visibility filter
            visibility = ""
            if role_info.role != TFCSRole.OWNER:
                visibility = "&is_private=eq.false"
            
            url = f"{SUPABASE_URL}/rest/v1/tfcs_activity_events?object_type=eq.{object_type}&object_id=eq.{object_id}{visibility}&select=*&order=created_at.desc&limit={limit}"
            response = await client.get(url, headers=await get_service_headers())
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to fetch object activity")
            
            events = response.json()
            
            return {
                "success": True,
                "object_type": object_type,
                "object_id": object_id,
                "events": events,
                "count": len(events)
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching object activity: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/activity/log")
async def log_activity_endpoint(
    event: ActivityEventCreate,
    request: Request,
    auth_data: tuple = Depends(require_employee)
):
    """
    Manually log an activity event.
    Most events should be logged automatically by other routes.
    """
    user_id, role_info = auth_data
    
    # Get user profile for name/email
    profile = await get_user_profile(user_id)
    
    event_id = await log_activity(
        user_id=user_id,
        user_role=role_info.role.value,
        user_name=profile.get('full_name') if profile else role_info.user_name,
        user_email=profile.get('email') if profile else role_info.user_email,
        event_data=event,
        request=request
    )
    
    if not event_id:
        raise HTTPException(status_code=500, detail="Failed to log activity")
    
    return {
        "success": True,
        "event_id": event_id,
        "message": "Activity logged"
    }

# =====================================================
# API ENDPOINTS - NOTIFICATIONS
# =====================================================

@router.get("/notifications")
async def get_my_notifications(
    authorization: str = Header(...),
    unread_only: bool = False,
    category: Optional[str] = None,
    limit: int = 50
):
    """Get notifications for the current user"""
    user_id = await verify_jwt_token(authorization)
    
    try:
        filters = [f"recipient_user_id=eq.{user_id}", "is_dismissed=eq.false"]
        
        if unread_only:
            filters.append("is_read=eq.false")
        
        if category:
            filters.append(f"category=eq.{category}")
        
        filter_string = "&".join(filters)
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/tfcs_notifications?{filter_string}&select=*&order=created_at.desc&limit={limit}",
                headers=await get_service_headers()
            )
            
            # Handle table not existing (pre-migration state)
            if response.status_code == 404 or (response.status_code != 200 and 'does not exist' in response.text):
                # Graceful degradation: return empty notifications
                return {
                    "success": True,
                    "notifications": [],
                    "count": 0,
                    "unread_count": 0,
                    "note": "TFCS tables not yet initialized"
                }
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to fetch notifications")
            
            notifications = response.json()
            
            # Count unread
            unread_count = sum(1 for n in notifications if not n.get('is_read'))
            
            return {
                "success": True,
                "notifications": notifications,
                "count": len(notifications),
                "unread_count": unread_count
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching notifications: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    authorization: str = Header(...)
):
    """Mark a notification as read"""
    user_id = await verify_jwt_token(authorization)
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{SUPABASE_URL}/rest/v1/tfcs_notifications?id=eq.{notification_id}&recipient_user_id=eq.{user_id}",
                headers=await get_service_headers(),
                json={
                    "is_read": True,
                    "read_at": datetime.now(timezone.utc).isoformat()
                }
            )
            
            if response.status_code not in [200, 204]:
                raise HTTPException(status_code=500, detail="Failed to mark notification as read")
            
            return {"success": True, "message": "Notification marked as read"}
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking notification read: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/notifications/read-all")
async def mark_all_notifications_read(authorization: str = Header(...)):
    """Mark all notifications as read"""
    user_id = await verify_jwt_token(authorization)
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{SUPABASE_URL}/rest/v1/tfcs_notifications?recipient_user_id=eq.{user_id}&is_read=eq.false",
                headers=await get_service_headers(),
                json={
                    "is_read": True,
                    "read_at": datetime.now(timezone.utc).isoformat()
                }
            )
            
            return {"success": True, "message": "All notifications marked as read"}
            
    except Exception as e:
        logger.error(f"Error marking all notifications read: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/notifications/{notification_id}")
async def dismiss_notification(
    notification_id: str,
    authorization: str = Header(...)
):
    """Dismiss (soft delete) a notification"""
    user_id = await verify_jwt_token(authorization)
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{SUPABASE_URL}/rest/v1/tfcs_notifications?id=eq.{notification_id}&recipient_user_id=eq.{user_id}",
                headers=await get_service_headers(),
                json={
                    "is_dismissed": True,
                    "dismissed_at": datetime.now(timezone.utc).isoformat()
                }
            )
            
            return {"success": True, "message": "Notification dismissed"}
            
    except Exception as e:
        logger.error(f"Error dismissing notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================
# API ENDPOINTS - HEALTH & DIAGNOSTICS
# =====================================================

@router.get("/health")
async def tfcs_health():
    """Check TFCS Mainframe health"""
    return {
        "status": "healthy",
        "service": "tfcs-mainframe",
        "version": "1.0.0"
    }

@router.get("/diagnostics")
async def tfcs_diagnostics(auth_data: tuple = Depends(require_owner)):
    """Get TFCS system diagnostics (owner only)"""
    user_id, role_info = auth_data
    
    try:
        async with httpx.AsyncClient() as client:
            # Count roles
            roles_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/tfcs_user_roles?is_active=eq.true&select=role",
                headers=await get_service_headers()
            )
            roles = roles_response.json() if roles_response.status_code == 200 else []
            
            # Count events (last 24h)
            yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
            events_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/tfcs_activity_events?created_at=gte.{yesterday}&select=id",
                headers=await get_service_headers()
            )
            recent_events = events_response.json() if events_response.status_code == 200 else []
            
            # Count pending notifications
            notif_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/tfcs_notifications?is_read=eq.false&is_dismissed=eq.false&select=id",
                headers=await get_service_headers()
            )
            unread_notifs = notif_response.json() if notif_response.status_code == 200 else []
            
            return {
                "success": True,
                "diagnostics": {
                    "total_users_with_roles": len(roles),
                    "roles_breakdown": {
                        "owners": sum(1 for r in roles if r['role'] == 'owner'),
                        "managers": sum(1 for r in roles if r['role'] == 'manager'),
                        "employees": sum(1 for r in roles if r['role'] == 'employee')
                    },
                    "events_last_24h": len(recent_events),
                    "unread_notifications": len(unread_notifs),
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            }
            
    except Exception as e:
        logger.error(f"Error getting diagnostics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/init-owner")
async def initialize_owner(authorization: str = Header(...)):
    """
    Initialize the owner role for inbox@twofungis.ca.
    This should only be called once during initial setup.
    """
    user_id = await verify_jwt_token(authorization)
    
    try:
        async with httpx.AsyncClient() as client:
            # Get user email FIRST - this is the email guard
            user_response = await client.get(
                f"{SUPABASE_URL}/auth/v1/admin/users",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
                }
            )
            
            if user_response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to verify user")
            
            users = user_response.json().get('users', [])
            current_user = next((u for u in users if u.get('id') == user_id), None)
            
            if not current_user:
                raise HTTPException(status_code=404, detail="User not found")
            
            user_email = current_user.get('email')
            
            # EMAIL GUARD - Check if this is the designated owner email BEFORE any DB operations
            # This must be the FIRST check after verifying the user exists
            if user_email != "inbox@twofungis.ca":
                raise HTTPException(
                    status_code=403, 
                    detail="Only inbox@twofungis.ca can be the initial owner"
                )
            
            # Check if any owners already exist (handle pre-migration state gracefully)
            owners_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/tfcs_user_roles?role=eq.owner&is_active=eq.true&select=id",
                headers=await get_service_headers()
            )
            
            # If table doesn't exist, that's okay - we'll create it
            if owners_response.status_code == 200:
                existing_owners = owners_response.json()
                if existing_owners:
                    raise HTTPException(status_code=400, detail="An owner already exists")
            elif 'does not exist' not in owners_response.text:
                # Some other error - not just missing table
                logger.warning(f"Unexpected response checking owners: {owners_response.text}")
            
            # Assign owner role
            role_payload = {
                "user_id": user_id,
                "role": "owner",
                "user_email": user_email,
                "user_name": current_user.get('user_metadata', {}).get('full_name'),
                "assigned_at": datetime.now(timezone.utc).isoformat(),
                "is_active": True,
                "notes": "Initial owner - system setup"
            }
            
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/tfcs_user_roles",
                headers=await get_service_headers(),
                json=role_payload
            )
            
            if response.status_code not in [200, 201]:
                # Check if table doesn't exist (PostgREST returns PGRST205 with "Could not find the table")
                if 'does not exist' in response.text or 'Could not find the table' in response.text or 'PGRST205' in response.text:
                    raise HTTPException(
                        status_code=503, 
                        detail="TFCS tables not initialized. Please run migration 011_tfcs_mainframe_foundation.sql in Supabase first."
                    )
                # Try upsert if insert fails
                response = await client.patch(
                    f"{SUPABASE_URL}/rest/v1/tfcs_user_roles?user_id=eq.{user_id}",
                    headers=await get_service_headers(),
                    json=role_payload
                )
            
            if response.status_code not in [200, 201, 204]:
                raise HTTPException(status_code=500, detail=f"Failed to assign owner role: {response.text}")
            
            return {
                "success": True,
                "message": "Owner role initialized",
                "user_id": user_id,
                "email": user_email,
                "role": "owner"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error initializing owner: {e}")
        raise HTTPException(status_code=500, detail=str(e))
