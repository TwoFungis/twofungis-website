"""
TFCS Activity Logger Helper
============================
This module provides a simple interface for logging activity events
from other TradeOS routes (quotes, invoices, projects, etc.).

Usage:
    from routes.tfcs_activity import log_tradeos_activity

    # In your route handler:
    await log_tradeos_activity(
        user_id=user_id,
        action="Created invoice INV-0001",
        action_type="create",
        object_type="invoice",
        category="invoices",
        object_id=invoice_id,
        object_name="Kitchen Renovation - Johnson",
        object_reference="INV-0001",
        related_project_id=project_id
    )
"""

import os
import logging
import httpx
from config import config
from typing import Optional, Literal
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


# Valid values for enums
ACTION_TYPES = [
    'create', 'update', 'delete', 'send', 'approve', 'reject',
    'complete', 'assign', 'upload', 'download', 'view', 'login',
    'status_change', 'payment', 'reminder', 'archive', 'restore'
]

OBJECT_TYPES = [
    'opportunity', 'estimate', 'quote', 'project', 'milestone',
    'production_item', 'document', 'expense', 'invoice', 'payment',
    'material_request', 'tool_request', 'daily_report', 'user',
    'role', 'setting', 'notification'
]

CATEGORIES = [
    'opportunities', 'estimates', 'quotes', 'projects', 'production',
    'documents', 'expenses', 'invoices', 'materials', 'tools',
    'reports', 'team', 'settings'
]


async def get_service_headers():
    """Get headers for Supabase service role requests"""
    return {
        "apikey": config.SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {config.SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }


async def get_user_tfcs_role(user_id: str) -> Optional[str]:
    """
    Get the TFCS role for a user.
    Returns 'owner', 'manager', 'employee', or None if no role.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/tfcs_user_roles?user_id=eq.{user_id}&is_active=eq.true&select=role",
                headers=await get_service_headers()
            )
            
            if response.status_code == 200:
                roles = response.json()
                if roles:
                    return roles[0].get('role')
    except Exception as e:
        logger.debug(f"Could not fetch TFCS role for user {user_id}: {e}")
    
    return None


async def get_user_info(user_id: str) -> tuple[Optional[str], Optional[str]]:
    """
    Get user's name and email from users_profile.
    Returns (full_name, email)
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/users_profile?user_id=eq.{user_id}&select=full_name,email",
                headers=await get_service_headers()
            )
            
            if response.status_code == 200:
                profiles = response.json()
                if profiles:
                    return profiles[0].get('full_name'), profiles[0].get('email')
    except Exception as e:
        logger.debug(f"Could not fetch user info for {user_id}: {e}")
    
    return None, None


async def log_tradeos_activity(
    user_id: str,
    action: str,
    action_type: str,
    object_type: str,
    category: str,
    object_id: Optional[str] = None,
    object_name: Optional[str] = None,
    object_reference: Optional[str] = None,
    reason: Optional[str] = None,
    previous_value: Optional[str] = None,
    new_value: Optional[str] = None,
    details: Optional[dict] = None,
    related_project_id: Optional[str] = None,
    related_user_id: Optional[str] = None,
    is_private: bool = False
) -> Optional[str]:
    """
    Log an activity event from a TradeOS route.
    
    This is a simplified interface for logging activities from existing
    TradeOS routes (quotes, invoices, projects, expenses, etc.).
    
    The function will:
    1. Look up the user's TFCS role (defaults to 'user' if no role)
    2. Fetch user name/email from profile
    3. Insert the activity event
    
    Args:
        user_id: The Supabase auth user ID
        action: Human-readable action description (e.g., "Created quote #Q-0001")
        action_type: One of: create, update, delete, send, approve, etc.
        object_type: One of: quote, invoice, project, expense, etc.
        category: One of: quotes, invoices, projects, expenses, etc.
        object_id: UUID of the affected object
        object_name: Display name of the object
        object_reference: Short reference code (Q-0001, INV-0042)
        reason: Optional reason for the action
        previous_value: Previous value (for updates)
        new_value: New value (for updates)
        details: Additional JSON data
        related_project_id: Parent project UUID if applicable
        related_user_id: Another user involved in the action
        is_private: If True, only owners can see this event
    
    Returns:
        Event ID if successful, None otherwise
    """
    # Validate inputs
    if action_type not in ACTION_TYPES:
        logger.warning(f"Invalid action_type '{action_type}', defaulting to 'update'")
        action_type = 'update'
    
    if object_type not in OBJECT_TYPES:
        logger.warning(f"Invalid object_type '{object_type}', skipping activity log")
        return None
    
    if category not in CATEGORIES:
        logger.warning(f"Invalid category '{category}', skipping activity log")
        return None
    
    try:
        # Get user's TFCS role (or default to 'user' for regular TradeOS users)
        user_role = await get_user_tfcs_role(user_id) or 'user'
        
        # Get user name and email
        user_name, user_email = await get_user_info(user_id)
        
        # Build payload
        payload = {
            "user_id": user_id,
            "user_role": user_role,
            "user_name": user_name,
            "user_email": user_email,
            "action": action,
            "action_type": action_type,
            "object_type": object_type,
            "category": category,
            "object_id": object_id,
            "object_name": object_name,
            "object_reference": object_reference,
            "reason": reason,
            "previous_value": previous_value,
            "new_value": new_value,
            "details": details,
            "related_project_id": related_project_id,
            "related_user_id": related_user_id,
            "is_private": is_private,
            "source": "tradeos"  # Always from TradeOS when using this helper
        }
        
        # Remove None values
        payload = {k: v for k, v in payload.items() if v is not None}
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{config.SUPABASE_URL}/rest/v1/tfcs_activity_events",
                headers=await get_service_headers(),
                json=payload
            )
            
            if response.status_code in [200, 201]:
                result = response.json()
                event_id = result[0]['id'] if result else None
                logger.info(f"Activity logged: {action[:50]}...")
                return event_id
            else:
                # Log error but don't fail the parent operation
                logger.warning(f"Failed to log activity: {response.status_code} - {response.text[:100]}")
                return None
                
    except Exception as e:
        # Activity logging should never break the parent operation
        logger.warning(f"Error logging activity: {e}")
        return None


async def create_tradeos_notification(
    recipient_user_id: str,
    title: str,
    message: Optional[str] = None,
    notification_type: str = "info",
    priority: int = 0,
    category: Optional[str] = None,
    action_url: Optional[str] = None,
    action_label: Optional[str] = None,
    activity_event_id: Optional[str] = None
) -> Optional[str]:
    """
    Create a notification for a user from TradeOS.
    
    Args:
        recipient_user_id: User to notify
        title: Notification title
        message: Optional longer message
        notification_type: info, success, warning, error, action_required
        priority: 0=normal, 1=important, 2=urgent
        category: Category for filtering
        action_url: URL to navigate when clicked
        action_label: Button text (e.g., "View Invoice")
        activity_event_id: Link to the source activity event
    
    Returns:
        Notification ID if successful, None otherwise
    """
    try:
        # Get recipient's TFCS role
        recipient_role = await get_user_tfcs_role(recipient_user_id)
        
        payload = {
            "recipient_user_id": recipient_user_id,
            "recipient_role": recipient_role,
            "title": title,
            "message": message,
            "notification_type": notification_type,
            "priority": priority,
            "category": category,
            "action_url": action_url,
            "action_label": action_label,
            "activity_event_id": activity_event_id
        }
        
        # Remove None values
        payload = {k: v for k, v in payload.items() if v is not None}
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{config.SUPABASE_URL}/rest/v1/tfcs_notifications",
                headers=await get_service_headers(),
                json=payload
            )
            
            if response.status_code in [200, 201]:
                result = response.json()
                return result[0]['id'] if result else None
            else:
                logger.warning(f"Failed to create notification: {response.text[:100]}")
                return None
                
    except Exception as e:
        logger.warning(f"Error creating notification: {e}")
        return None
