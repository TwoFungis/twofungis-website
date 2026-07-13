"""
TradeOS Quotes/Estimates API Routes
Handles quote creation with Trial/Locked mode enforcement
"""
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
import httpx
from config import config
import os
import logging
import json
import base64

from routes.access_control import (
    compute_access_state,
    can_create_in_locked_mode,
    can_send_in_locked_mode
)

router = APIRouter(prefix="/api/quotes", tags=["quotes"])
logger = logging.getLogger(__name__)



class QuoteLineItem(BaseModel):
    description: str
    quantity: float = 1.0
    unit_price: float
    unit: Optional[str] = None


class QuoteCreate(BaseModel):
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    valid_until: Optional[str] = None
    notes: Optional[str] = None
    subtotal: float = 0
    tax_amount: float = 0
    total: float = 0
    line_items: List[QuoteLineItem] = []


def get_user_id_from_token(authorization: str) -> Optional[str]:
    """Extract user_id from JWT token"""
    if not authorization or not authorization.startswith('Bearer '):
        return None
    try:
        token = authorization.replace('Bearer ', '')
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


async def get_service_headers():
    return {
        "apikey": config.SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {config.SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }


async def supabase_request(method: str, table: str, data: Dict = None, params: Dict = None):
    """Make a request to Supabase REST API"""
    headers = await get_service_headers()
    url = f"{config.SUPABASE_URL}/rest/v1/{table}"
    
    if params:
        param_str = "&".join([f"{k}={v}" for k, v in params.items()])
        url = f"{url}?{param_str}"
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        if method == "GET":
            response = await client.get(url, headers=headers)
        elif method == "POST":
            response = await client.post(url, headers=headers, json=data)
        elif method == "PATCH":
            response = await client.patch(url, headers=headers, json=data)
        elif method == "DELETE":
            response = await client.delete(url, headers=headers)
        
        if response.status_code >= 400:
            logger.error(f"Supabase error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=response.status_code, detail=response.text)
        
        if response.text:
            return response.json()
        return {}


async def get_user_profile(user_id: str) -> Optional[Dict]:
    """Fetch user profile for access control checks"""
    try:
        # First try with new columns
        profiles = await supabase_request(
            "GET",
            "users_profile",
            params={
                "user_id": f"eq.{user_id}",
                "select": "subscription_tier,grandfathered_active,trial_started_at,trial_ends_at,locked_project_created,locked_quote_created,locked_invoice_created"
            }
        )
        return profiles[0] if profiles else None
    except HTTPException as e:
        # If columns don't exist, fall back to basic query
        if '42703' in str(e.detail) or 'does not exist' in str(e.detail):
            logger.info("Trial columns not found in quotes, using basic profile query")
            try:
                profiles = await supabase_request(
                    "GET",
                    "users_profile",
                    params={
                        "user_id": f"eq.{user_id}",
                        "select": "subscription_tier"
                    }
                )
                return profiles[0] if profiles else None
            except Exception as e2:
                logger.warning(f"Failed to fetch basic profile: {e2}")
                return None
        logger.warning(f"Failed to fetch profile: {e}")
        return None
    except Exception as e:
        logger.warning(f"Failed to fetch profile: {e}")
        return None


async def mark_locked_entity_created(user_id: str, entity_type: str):
    """Mark that a locked user has used their one free entity creation"""
    field_map = {
        "project": "locked_project_created",
        "quote": "locked_quote_created",
        "invoice": "locked_invoice_created"
    }
    field = field_map.get(entity_type)
    if field:
        try:
            await supabase_request(
                "PATCH",
                "users_profile",
                data={field: True},
                params={"user_id": f"eq.{user_id}"}
            )
            logger.info(f"Marked {field}=true for user {user_id}")
        except Exception as e:
            logger.error(f"Failed to mark {field}: {e}")


async def get_next_quote_number(user_id: str) -> str:
    """Generate next quote number for user"""
    try:
        quotes = await supabase_request(
            "GET",
            "quotes",
            params={
                "user_id": f"eq.{user_id}",
                "select": "quote_number",
                "order": "created_at.desc",
                "limit": "1"
            }
        )
        
        if quotes and quotes[0].get('quote_number'):
            last = quotes[0]['quote_number']
            # Try to extract number from format like "Q-2024-001"
            parts = last.split('-')
            if len(parts) >= 3:
                try:
                    num = int(parts[-1]) + 1
                    return f"Q-{datetime.now().year}-{num:03d}"
                except ValueError:
                    pass
        
        return f"Q-{datetime.now().year}-001"
    except Exception as e:
        logger.warning(f"Error getting next quote number: {e}")
        timestamp = datetime.now().strftime("%y%m%d%H%M")
        return f"Q-{timestamp}"


@router.post("")
async def create_quote(
    data: QuoteCreate,
    authorization: str = Header(None)
):
    """Create a new quote/estimate with locked mode enforcement"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Check access control - LOCKED mode enforcement
        profile = await get_user_profile(user_id)
        access_info = compute_access_state(profile)
        
        if access_info.state == "LOCKED":
            can_create, error_msg = can_create_in_locked_mode(profile, "quote")
            if not can_create:
                raise HTTPException(status_code=403, detail=error_msg)
        
        # Generate quote number
        quote_number = await get_next_quote_number(user_id)
        
        # Create the quote
        quote_data = {
            "user_id": user_id,
            "quote_number": quote_number,
            "project_id": data.project_id,
            "project_name": data.project_name,
            "client_name": data.client_name,
            "client_email": data.client_email,
            "valid_until": data.valid_until,
            "notes": data.notes,
            "subtotal": data.subtotal,
            "tax_amount": data.tax_amount,
            "total": data.total,
            "status": "draft",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Remove None values
        quote_data = {k: v for k, v in quote_data.items() if v is not None}
        
        result = await supabase_request("POST", "quotes", data=quote_data)
        quote = result[0] if isinstance(result, list) else result
        
        # Create line items if provided
        if data.line_items and quote.get('id'):
            for idx, item in enumerate(data.line_items):
                line_data = {
                    "quote_id": quote['id'],
                    "description": item.description,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "unit": item.unit,
                    "line_total": item.quantity * item.unit_price,
                    "sort_order": idx
                }
                try:
                    await supabase_request("POST", "quote_line_items", data=line_data)
                except Exception as e:
                    logger.warning(f"Failed to create line item: {e}")
        
        # If user is in LOCKED mode, mark their one free quote as used
        if access_info.state == "LOCKED":
            await mark_locked_entity_created(user_id, "quote")
        
        return quote
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating quote: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{quote_id}/send")
async def send_quote(
    quote_id: str,
    authorization: str = Header(None)
):
    """Send a quote to the client - LOCKED users cannot send"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Check access control - LOCKED mode cannot send
        profile = await get_user_profile(user_id)
        can_send, error_msg = can_send_in_locked_mode(profile)
        if not can_send:
            raise HTTPException(status_code=403, detail=error_msg)
        
        # Get quote
        quotes = await supabase_request(
            "GET",
            "quotes",
            params={"id": f"eq.{quote_id}", "user_id": f"eq.{user_id}"}
        )
        
        if not quotes:
            raise HTTPException(status_code=404, detail="Quote not found")
        
        # quotes[0] confirms quote exists and belongs to user
        
        # Update quote status to sent
        now = datetime.now(timezone.utc).isoformat()
        await supabase_request(
            "PATCH",
            "quotes",
            data={
                "status": "sent",
                "sent_at": now
            },
            params={"id": f"eq.{quote_id}"}
        )
        
        return {"success": True, "message": "Quote sent successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending quote: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
async def list_quotes(authorization: str = Header(None)):
    """List all quotes for the user"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        quotes = await supabase_request(
            "GET",
            "quotes",
            params={
                "user_id": f"eq.{user_id}",
                "select": "*",
                "order": "created_at.desc"
            }
        )
        return quotes
    except Exception as e:
        logger.error(f"Error listing quotes: {e}")
        raise HTTPException(status_code=500, detail=str(e))
