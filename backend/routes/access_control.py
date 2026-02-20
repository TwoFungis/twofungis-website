"""
TradeOS Access Control Module
Handles trial, locked, and active access states
"""
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, Literal
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

# Access state types
AccessState = Literal["ACTIVE", "TRIAL", "LOCKED"]

# Paid tiers that grant ACTIVE status
PAID_TIERS = ['pro', 'elite', 'lifetime', 'founding', 'founding_lifetime', 'lifetime_elite']

class AccessInfo(BaseModel):
    """User access information"""
    state: AccessState
    trial_days_remaining: Optional[int] = None
    is_grandfathered: bool = False
    restrictions: Dict[str, Any] = {}


def compute_access_state(profile: Optional[Dict[str, Any]]) -> AccessInfo:
    """
    Compute the access state for a user based on their profile.
    
    Rules:
    - ACTIVE if: paid subscription tier OR grandfathered_active = true
    - TRIAL if: not ACTIVE and trial_ends_at > now
    - LOCKED if: not ACTIVE and trial_ends_at <= now (or no trial set for new logic)
    
    Returns AccessInfo with state and metadata.
    
    Note: Handles missing trial/grandfathered columns gracefully (for pre-migration profiles).
    """
    if not profile:
        return AccessInfo(state="LOCKED", restrictions=get_locked_restrictions())
    
    now = datetime.now(timezone.utc)
    
    # Check for paid subscription tier FIRST (this works even without migration)
    subscription_tier = (profile.get('subscription_tier') or '').lower().strip()
    if subscription_tier in PAID_TIERS:
        return AccessInfo(state="ACTIVE", is_grandfathered=False)
    
    # Check for grandfathered status (may not exist if migration not run)
    grandfathered = profile.get('grandfathered_active')
    if grandfathered is True:
        return AccessInfo(state="ACTIVE", is_grandfathered=True)
    
    # If migration hasn't been run (no grandfathered_active column), 
    # treat existing users without trial dates as ACTIVE (temporary compatibility)
    if 'grandfathered_active' not in profile and profile.get('trial_ends_at') is None:
        # Existing user without trial columns = grandfathered
        return AccessInfo(state="ACTIVE", is_grandfathered=True)
    
    # Check trial status
    trial_ends_at = profile.get('trial_ends_at')
    if trial_ends_at:
        # Parse trial end date
        if isinstance(trial_ends_at, str):
            try:
                # Handle ISO format with timezone
                if trial_ends_at.endswith('Z'):
                    trial_ends_at = trial_ends_at[:-1] + '+00:00'
                trial_end = datetime.fromisoformat(trial_ends_at)
                if trial_end.tzinfo is None:
                    trial_end = trial_end.replace(tzinfo=timezone.utc)
            except (ValueError, TypeError):
                trial_end = None
        elif isinstance(trial_ends_at, datetime):
            trial_end = trial_ends_at
            if trial_end.tzinfo is None:
                trial_end = trial_end.replace(tzinfo=timezone.utc)
        else:
            trial_end = None
        
        if trial_end:
            if now < trial_end:
                # Still in trial
                days_remaining = (trial_end - now).days
                return AccessInfo(
                    state="TRIAL",
                    trial_days_remaining=max(0, days_remaining),
                    is_grandfathered=False
                )
            else:
                # Trial expired -> LOCKED
                return AccessInfo(
                    state="LOCKED",
                    trial_days_remaining=0,
                    restrictions=get_locked_restrictions()
                )
    
    # No trial set and not grandfathered -> LOCKED (edge case)
    return AccessInfo(state="LOCKED", restrictions=get_locked_restrictions())


def get_locked_restrictions() -> Dict[str, Any]:
    """Get the restrictions applied in LOCKED mode"""
    return {
        "max_new_projects": 1,
        "max_new_quotes": 1,
        "max_new_invoices": 1,
        "can_send_invoices": False,
        "can_send_quotes": False,
        "ai_daily_limit": 3,
        "ai_project_context": False
    }


def can_create_in_locked_mode(profile: Dict[str, Any], entity_type: str) -> tuple[bool, str]:
    """
    Check if a user in LOCKED mode can create a new entity.
    
    Args:
        profile: User profile dict
        entity_type: One of 'project', 'quote', 'invoice'
    
    Returns:
        (can_create, error_message)
    """
    access = compute_access_state(profile)
    
    # If not locked, allow creation
    if access.state != "LOCKED":
        return True, ""
    
    # Check specific entity limits
    if entity_type == "project":
        if profile.get('locked_project_created', False):
            return False, "Trial ended. You've used your 1 free project. Upgrade to create more."
        return True, ""
    
    elif entity_type == "quote":
        if profile.get('locked_quote_created', False):
            return False, "Trial ended. You've used your 1 free quote. Upgrade to create more."
        return True, ""
    
    elif entity_type == "invoice":
        if profile.get('locked_invoice_created', False):
            return False, "Trial ended. You've used your 1 free invoice. Upgrade to create more."
        return True, ""
    
    return True, ""


def can_send_in_locked_mode(profile: Dict[str, Any]) -> tuple[bool, str]:
    """
    Check if a user can send/issue invoices or quotes.
    
    Returns:
        (can_send, error_message)
    """
    access = compute_access_state(profile)
    
    if access.state == "LOCKED":
        return False, "Trial ended. Upgrade to send invoices and quotes."
    
    return True, ""


def check_ai_daily_limit(profile: Dict[str, Any]) -> tuple[bool, str, bool]:
    """
    Check if a user has reached their daily AI limit (LOCKED mode only).
    
    Returns:
        (can_use_ai, error_message, needs_reset)
    """
    access = compute_access_state(profile)
    
    # Non-locked users have unlimited AI
    if access.state != "LOCKED":
        return True, "", False
    
    now = datetime.now(timezone.utc)
    daily_limit = 3
    
    # Check if reset is needed
    reset_at = profile.get('ai_usage_reset_at')
    needs_reset = False
    
    if reset_at:
        if isinstance(reset_at, str):
            try:
                if reset_at.endswith('Z'):
                    reset_at = reset_at[:-1] + '+00:00'
                reset_time = datetime.fromisoformat(reset_at)
                if reset_time.tzinfo is None:
                    reset_time = reset_time.replace(tzinfo=timezone.utc)
            except (ValueError, TypeError):
                reset_time = None
        elif isinstance(reset_at, datetime):
            reset_time = reset_at
            if reset_time.tzinfo is None:
                reset_time = reset_time.replace(tzinfo=timezone.utc)
        else:
            reset_time = None
        
        if reset_time:
            # Check if 24 hours have passed
            if (now - reset_time) >= timedelta(hours=24):
                needs_reset = True
    else:
        # No reset time set, needs initialization
        needs_reset = True
    
    # If reset needed, usage will be 0
    if needs_reset:
        return True, "", True
    
    # Check current usage
    current_usage = profile.get('ai_daily_usage', 0) or 0
    
    if current_usage >= daily_limit:
        return False, "Daily AI limit reached (3 messages). Upgrade for unlimited AI access.", False
    
    return True, "", False


def get_trial_dates() -> tuple[str, str]:
    """
    Get trial start and end dates for a new user.
    
    Returns:
        (trial_started_at, trial_ends_at) as ISO strings
    """
    now = datetime.now(timezone.utc)
    trial_end = now + timedelta(days=30)
    
    return now.isoformat(), trial_end.isoformat()
