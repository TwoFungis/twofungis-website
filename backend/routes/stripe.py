"""
Stripe Integration Routes for TradeOS
Handles subscriptions (Pro, Elite) and one-time payments (Lifetime Elite)
"""

from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel, Field
from typing import Optional, Literal
import os
import logging
import stripe
import httpx
from datetime import datetime, timezone

router = APIRouter(prefix="/api/stripe", tags=["stripe"])
logger = logging.getLogger(__name__)

# =============================================================================
# CONFIGURATION
# =============================================================================

STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', '')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')
FRONTEND_URL = os.environ.get('FRONTEND_URL', '')
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

# Stripe Price IDs
STRIPE_PRICE_IDS = {
    "PRO": os.environ.get('STRIPE_PRO_PRICE_ID', 'price_1T20NRAVLnc1BWBltTCl65We'),
    "ELITE": os.environ.get('STRIPE_ELITE_PRICE_ID', 'price_1T20OQAVLnc1BWBlxXBFkTWx'),
    "LIFETIME_ELITE": os.environ.get('STRIPE_LIFETIME_PRICE_ID', 'price_1T20WNAVLnc1BWBl0gKPyqOd'),
}

# Initialize Stripe
stripe.api_key = STRIPE_SECRET_KEY

# =============================================================================
# MODELS
# =============================================================================

class CreateCheckoutRequest(BaseModel):
    plan: Literal["PRO", "ELITE", "LIFETIME_ELITE"]
    user_id: str
    email: str
    country: Optional[str] = None  # User's country from profile

class CreateCheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str

class CreatePortalRequest(BaseModel):
    user_id: str

class CreatePortalResponse(BaseModel):
    portal_url: Optional[str] = None
    message: Optional[str] = None

class LifetimeSeatsResponse(BaseModel):
    max_seats: int
    seats_sold: int
    remaining: int
    is_active: bool
    region_lock: str = "CA"

class PlansResponse(BaseModel):
    plans: dict
    lifetime_status: LifetimeSeatsResponse

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

async def get_supabase_headers():
    """Get headers for Supabase service role requests"""
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

async def get_lifetime_seats() -> LifetimeSeatsResponse:
    """Get current lifetime seats status from Supabase"""
    try:
        async with httpx.AsyncClient() as client:
            # Try the function first
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/rpc/get_lifetime_seats_status",
                headers=await get_supabase_headers(),
                json={}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    row = data[0]
                    return LifetimeSeatsResponse(
                        max_seats=row.get('max_seats', 100),
                        seats_sold=row.get('seats_sold', 0),
                        remaining=row.get('seats_remaining', 100),
                        is_active=row.get('is_available', True),
                        region_lock=row.get('region_lock', 'CA')
                    )
            
            # Fallback: direct table query
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/founding_lifetime?id=eq.1",
                headers=await get_supabase_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    row = data[0]
                    remaining = row.get('max_seats', 100) - row.get('seats_sold', 0)
                    return LifetimeSeatsResponse(
                        max_seats=row.get('max_seats', 100),
                        seats_sold=row.get('seats_sold', 0),
                        remaining=remaining,
                        is_active=row.get('is_active', True) and remaining > 0,
                        region_lock=row.get('region_lock', 'CA')
                    )
                    
    except Exception as e:
        logger.error(f"Error fetching lifetime seats: {e}")
    
    # Default fallback
    return LifetimeSeatsResponse(
        max_seats=100,
        seats_sold=0,
        remaining=100,
        is_active=True,
        region_lock="CA"
    )

async def increment_lifetime_seat() -> dict:
    """Atomically increment the lifetime seat counter"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/rpc/increment_lifetime_seat",
                headers=await get_supabase_headers(),
                json={}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    return data[0]
            
            logger.error(f"Failed to increment seat: {response.status_code} - {response.text}")
            return {"success": False, "error_message": "Database error"}
            
    except Exception as e:
        logger.error(f"Error incrementing lifetime seat: {e}")
        return {"success": False, "error_message": str(e)}

async def update_user_plan(
    user_id: str,
    plan_type: str,
    plan_status: str = "active",
    stripe_customer_id: Optional[str] = None,
    stripe_subscription_id: Optional[str] = None,
    stripe_payment_intent_id: Optional[str] = None,
    lifetime_purchased_at: Optional[str] = None
):
    """Update user's plan in Supabase"""
    try:
        update_data = {
            "plan_type": plan_type,
            "plan_status": plan_status,
        }
        
        if stripe_customer_id:
            update_data["stripe_customer_id"] = stripe_customer_id
        if stripe_subscription_id is not None:  # Allow null
            update_data["stripe_subscription_id"] = stripe_subscription_id
        if stripe_payment_intent_id:
            update_data["stripe_payment_intent_id"] = stripe_payment_intent_id
        if lifetime_purchased_at:
            update_data["lifetime_purchased_at"] = lifetime_purchased_at
        
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{SUPABASE_URL}/rest/v1/users_profile?user_id=eq.{user_id}",
                headers=await get_supabase_headers(),
                json=update_data
            )
            
            if response.status_code not in [200, 204]:
                logger.error(f"Failed to update user plan: {response.status_code} - {response.text}")
                return False
            
            logger.info(f"Updated user {user_id} to plan {plan_type}")
            return True
            
    except Exception as e:
        logger.error(f"Error updating user plan: {e}")
        return False

async def create_lifetime_purchase_record(
    user_id: str,
    stripe_payment_intent_id: str,
    stripe_session_id: str,
    billing_country: str
):
    """Create a record in lifetime_purchases table"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/lifetime_purchases",
                headers=await get_supabase_headers(),
                json={
                    "user_id": user_id,
                    "stripe_payment_intent_id": stripe_payment_intent_id,
                    "stripe_session_id": stripe_session_id,
                    "amount": 599.00,
                    "currency": "CAD",
                    "billing_country": billing_country
                }
            )
            
            if response.status_code not in [200, 201]:
                logger.error(f"Failed to create lifetime purchase: {response.status_code} - {response.text}")
                return False
            
            return True
            
    except Exception as e:
        logger.error(f"Error creating lifetime purchase: {e}")
        return False

async def get_user_profile(user_id: str) -> dict:
    """Get user profile from Supabase"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/users_profile?user_id=eq.{user_id}&select=*",
                headers=await get_supabase_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    return data[0]
    except Exception as e:
        logger.error(f"Error fetching user profile: {e}")
    
    return {}

# =============================================================================
# ROUTES
# =============================================================================

@router.get("/plans", response_model=PlansResponse)
async def get_plans():
    """Get available plans and lifetime seat status"""
    lifetime_status = await get_lifetime_seats()
    
    plans = {
        "PRO": {
            "name": "Pro",
            "price": 39,
            "currency": "CAD",
            "interval": "month",
            "mode": "subscription",
            "price_id": STRIPE_PRICE_IDS["PRO"],
            "features": [
                "Unlimited Projects",
                "Quote Builder",
                "Change Order Manager",
                "Labor Cost Engine",
                "Production Logs"
            ]
        },
        "ELITE": {
            "name": "Elite",
            "price": 59,
            "currency": "CAD",
            "interval": "month",
            "mode": "subscription",
            "price_id": STRIPE_PRICE_IDS["ELITE"],
            "features": [
                "Everything in Pro",
                "Advanced Reports",
                "KPI Dashboard",
                "Production Analytics",
                "Priority Support"
            ]
        },
        "LIFETIME_ELITE": {
            "name": "Founding Lifetime (Elite)",
            "price": 599,
            "currency": "CAD",
            "interval": None,
            "mode": "payment",
            "price_id": STRIPE_PRICE_IDS["LIFETIME_ELITE"],
            "region_lock": "CA",
            "max_seats": lifetime_status.max_seats,
            "seats_remaining": lifetime_status.remaining,
            "is_available": lifetime_status.is_active,
            "features": [
                "Everything in Elite",
                "Lifetime Access",
                "No Monthly Fees",
                "Founding Member Badge",
                "Priority Support Forever"
            ]
        }
    }
    
    return PlansResponse(plans=plans, lifetime_status=lifetime_status)


@router.get("/lifetime-seats", response_model=LifetimeSeatsResponse)
async def get_lifetime_seats_endpoint():
    """Get current lifetime seats status"""
    return await get_lifetime_seats()


@router.post("/create-checkout-session", response_model=CreateCheckoutResponse)
async def create_checkout_session(request: CreateCheckoutRequest):
    """Create a Stripe checkout session for subscription or one-time payment"""
    
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    
    plan = request.plan
    user_id = request.user_id
    email = request.email
    user_country = request.country
    
    # Get price ID and mode
    price_id = STRIPE_PRICE_IDS.get(plan)
    if not price_id:
        raise HTTPException(status_code=400, detail=f"Invalid plan: {plan}")
    
    # Determine mode based on plan
    is_lifetime = plan == "LIFETIME_ELITE"
    mode = "payment" if is_lifetime else "subscription"
    
    # === LIFETIME_ELITE VALIDATIONS ===
    if is_lifetime:
        # 1. Check user's country (server-side enforcement)
        if user_country and user_country.upper() != "CA":
            raise HTTPException(
                status_code=403,
                detail="Founding Lifetime membership is only available to users in Canada"
            )
        
        # 2. Check seat availability
        seats = await get_lifetime_seats()
        if not seats.is_active or seats.remaining <= 0:
            raise HTTPException(
                status_code=410,
                detail="All Founding Lifetime memberships have been claimed"
            )
    
    # Build URLs
    success_url = f"{FRONTEND_URL}/app/settings?session_id={{CHECKOUT_SESSION_ID}}&payment=success&plan={plan}"
    cancel_url = f"{FRONTEND_URL}/app/settings?payment=cancelled"
    
    try:
        # Create Stripe Checkout Session
        session_params = {
            "mode": mode,
            "line_items": [{
                "price": price_id,
                "quantity": 1
            }],
            "success_url": success_url,
            "cancel_url": cancel_url,
            "customer_email": email,
            "metadata": {
                "user_id": user_id,
                "plan": plan
            },
            "payment_intent_data" if is_lifetime else "subscription_data": {
                "metadata": {
                    "user_id": user_id,
                    "plan": plan
                }
            }
        }
        
        # For lifetime, require billing address to verify country
        if is_lifetime:
            session_params["billing_address_collection"] = "required"
        
        session = stripe.checkout.Session.create(**session_params)
        
        logger.info(f"Created checkout session {session.id} for user {user_id}, plan {plan}")
        
        return CreateCheckoutResponse(
            checkout_url=session.url,
            session_id=session.id
        )
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating checkout: {e}")
        raise HTTPException(status_code=500, detail="Failed to create checkout session")


@router.post("/create-portal-session", response_model=CreatePortalResponse)
async def create_portal_session(request: CreatePortalRequest):
    """Create a Stripe Customer Portal session for subscription management"""
    
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    
    # Get user profile to check plan type and customer ID
    profile = await get_user_profile(request.user_id)
    
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Lifetime users cannot manage subscription
    if profile.get("plan_type") == "LIFETIME_ELITE":
        return CreatePortalResponse(
            portal_url=None,
            message="You have a Founding Lifetime membership. There is no subscription to manage."
        )
    
    stripe_customer_id = profile.get("stripe_customer_id")
    if not stripe_customer_id:
        raise HTTPException(
            status_code=400, 
            detail="No active subscription found. Please subscribe to a plan first."
        )
    
    try:
        session = stripe.billing_portal.Session.create(
            customer=stripe_customer_id,
            return_url=f"{FRONTEND_URL}/app/settings"
        )
        
        return CreatePortalResponse(portal_url=session.url)
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe portal error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    # Verify webhook signature if secret is configured
    if STRIPE_WEBHOOK_SECRET:
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
        except ValueError as e:
            logger.error(f"Invalid payload: {e}")
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid signature: {e}")
            raise HTTPException(status_code=400, detail="Invalid signature")
    else:
        # No webhook secret configured, parse payload directly
        import json
        event = json.loads(payload)
    
    event_type = event.get("type") if isinstance(event, dict) else event.type
    
    logger.info(f"Received webhook event: {event_type}")
    
    # === CHECKOUT.SESSION.COMPLETED ===
    if event_type == "checkout.session.completed":
        session = event.get("data", {}).get("object", {}) if isinstance(event, dict) else event.data.object
        await handle_checkout_completed(session)
    
    # === INVOICE.PAYMENT_FAILED ===
    elif event_type == "invoice.payment_failed":
        invoice = event.get("data", {}).get("object", {}) if isinstance(event, dict) else event.data.object
        await handle_payment_failed(invoice)
    
    # === CUSTOMER.SUBSCRIPTION.DELETED ===
    elif event_type == "customer.subscription.deleted":
        subscription = event.get("data", {}).get("object", {}) if isinstance(event, dict) else event.data.object
        await handle_subscription_deleted(subscription)
    
    # === CUSTOMER.SUBSCRIPTION.UPDATED ===
    elif event_type == "customer.subscription.updated":
        subscription = event.get("data", {}).get("object", {}) if isinstance(event, dict) else event.data.object
        await handle_subscription_updated(subscription)
    
    return {"status": "received", "event": event_type}


async def handle_checkout_completed(session: dict):
    """Handle checkout.session.completed event"""
    
    session_id = session.get("id")
    mode = session.get("mode")  # "subscription" or "payment"
    customer_id = session.get("customer")
    metadata = session.get("metadata", {})
    user_id = metadata.get("user_id")
    plan = metadata.get("plan")
    
    logger.info(f"Processing checkout completed: session={session_id}, mode={mode}, plan={plan}, user={user_id}")
    
    if not user_id:
        logger.error("No user_id in metadata, cannot process")
        return
    
    # === SUBSCRIPTION MODE (PRO / ELITE) ===
    if mode == "subscription":
        subscription_id = session.get("subscription")
        
        # Determine plan from line items if not in metadata
        if not plan:
            line_items = session.get("line_items", {}).get("data", [])
            for item in line_items:
                price_id = item.get("price", {}).get("id")
                if price_id == STRIPE_PRICE_IDS["PRO"]:
                    plan = "PRO"
                elif price_id == STRIPE_PRICE_IDS["ELITE"]:
                    plan = "ELITE"
        
        if plan in ["PRO", "ELITE"]:
            await update_user_plan(
                user_id=user_id,
                plan_type=plan,
                plan_status="active",
                stripe_customer_id=customer_id,
                stripe_subscription_id=subscription_id
            )
            logger.info(f"Activated {plan} subscription for user {user_id}")
    
    # === PAYMENT MODE (LIFETIME_ELITE) ===
    elif mode == "payment" and plan == "LIFETIME_ELITE":
        payment_intent_id = session.get("payment_intent")
        
        # Verify billing country
        customer_details = session.get("customer_details", {})
        address = customer_details.get("address", {})
        billing_country = address.get("country", "").upper()
        
        logger.info(f"Lifetime purchase: billing_country={billing_country}")
        
        # CRITICAL: Verify billing address is Canada
        if billing_country != "CA":
            logger.error(f"Billing country {billing_country} is not CA. Denying lifetime access.")
            # TODO: Trigger refund process
            return
        
        # Atomically increment seat counter
        seat_result = await increment_lifetime_seat()
        
        if not seat_result.get("success", False):
            logger.error(f"Failed to claim seat: {seat_result.get('error_message')}")
            # TODO: Trigger refund process
            return
        
        logger.info(f"Seat claimed. Seats sold: {seat_result.get('seats_sold')}, Remaining: {seat_result.get('seats_remaining')}")
        
        # Update user profile
        await update_user_plan(
            user_id=user_id,
            plan_type="LIFETIME_ELITE",
            plan_status="active",
            stripe_customer_id=customer_id,
            stripe_subscription_id=None,  # Clear any subscription
            stripe_payment_intent_id=payment_intent_id,
            lifetime_purchased_at=datetime.now(timezone.utc).isoformat()
        )
        
        # Create purchase record
        await create_lifetime_purchase_record(
            user_id=user_id,
            stripe_payment_intent_id=payment_intent_id,
            stripe_session_id=session_id,
            billing_country=billing_country
        )
        
        logger.info(f"Activated LIFETIME_ELITE for user {user_id}")


async def handle_payment_failed(invoice: dict):
    """Handle invoice.payment_failed event - only for subscriptions"""
    
    subscription_id = invoice.get("subscription")
    
    if not subscription_id:
        logger.info("Payment failed for non-subscription, ignoring")
        return
    
    # Find user by subscription ID
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/users_profile?stripe_subscription_id=eq.{subscription_id}&select=user_id,plan_type",
                headers=await get_supabase_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    user = data[0]
                    user_id = user.get("user_id")
                    plan_type = user.get("plan_type")
                    
                    # NEVER downgrade LIFETIME_ELITE
                    if plan_type == "LIFETIME_ELITE":
                        logger.info(f"Ignoring payment_failed for LIFETIME_ELITE user {user_id}")
                        return
                    
                    # Set plan_status to past_due
                    await update_user_plan(
                        user_id=user_id,
                        plan_type=plan_type,
                        plan_status="past_due"
                    )
                    logger.info(f"Set user {user_id} to past_due due to payment failure")
                    
    except Exception as e:
        logger.error(f"Error handling payment_failed: {e}")


async def handle_subscription_deleted(subscription: dict):
    """Handle customer.subscription.deleted event"""
    
    subscription_id = subscription.get("id")
    
    # Find user by subscription ID
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/users_profile?stripe_subscription_id=eq.{subscription_id}&select=user_id,plan_type",
                headers=await get_supabase_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    user = data[0]
                    user_id = user.get("user_id")
                    plan_type = user.get("plan_type")
                    
                    # NEVER downgrade LIFETIME_ELITE
                    if plan_type == "LIFETIME_ELITE":
                        logger.info(f"Ignoring subscription_deleted for LIFETIME_ELITE user {user_id}")
                        return
                    
                    # Downgrade to TRIAL
                    await update_user_plan(
                        user_id=user_id,
                        plan_type="TRIAL",
                        plan_status="canceled",
                        stripe_subscription_id=None
                    )
                    logger.info(f"Downgraded user {user_id} to TRIAL due to subscription deletion")
                    
    except Exception as e:
        logger.error(f"Error handling subscription_deleted: {e}")


async def handle_subscription_updated(subscription: dict):
    """Handle customer.subscription.updated event (plan changes, renewals)"""
    
    subscription_id = subscription.get("id")
    status = subscription.get("status")
    
    # Determine plan from items
    items = subscription.get("items", {}).get("data", [])
    plan = None
    for item in items:
        price_id = item.get("price", {}).get("id")
        if price_id == STRIPE_PRICE_IDS["PRO"]:
            plan = "PRO"
        elif price_id == STRIPE_PRICE_IDS["ELITE"]:
            plan = "ELITE"
    
    if not plan:
        return
    
    # Map Stripe status to our status
    status_map = {
        "active": "active",
        "past_due": "past_due",
        "canceled": "canceled",
        "unpaid": "past_due",
        "trialing": "trialing"
    }
    plan_status = status_map.get(status, "active")
    
    # Find user by subscription ID
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/users_profile?stripe_subscription_id=eq.{subscription_id}&select=user_id,plan_type",
                headers=await get_supabase_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    user = data[0]
                    user_id = user.get("user_id")
                    current_plan = user.get("plan_type")
                    
                    # NEVER modify LIFETIME_ELITE
                    if current_plan == "LIFETIME_ELITE":
                        logger.info(f"Ignoring subscription update for LIFETIME_ELITE user {user_id}")
                        return
                    
                    await update_user_plan(
                        user_id=user_id,
                        plan_type=plan,
                        plan_status=plan_status
                    )
                    logger.info(f"Updated user {user_id} subscription: plan={plan}, status={plan_status}")
                    
    except Exception as e:
        logger.error(f"Error handling subscription_updated: {e}")


# =============================================================================
# BILLING ENDPOINT (Legacy support)
# =============================================================================

@router.get("/billing/user/{user_id}")
async def get_user_billing(user_id: str):
    """Get user's billing/subscription info"""
    
    profile = await get_user_profile(user_id)
    
    if not profile:
        return {
            "has_subscription": False,
            "plan_type": "TRIAL",
            "plan_status": "inactive"
        }
    
    return {
        "has_subscription": profile.get("plan_type") not in [None, "TRIAL"],
        "plan_type": profile.get("plan_type", "TRIAL"),
        "plan_status": profile.get("plan_status", "inactive"),
        "is_lifetime": profile.get("plan_type") == "LIFETIME_ELITE",
        "lifetime_purchased_at": profile.get("lifetime_purchased_at"),
        "stripe_customer_id": profile.get("stripe_customer_id"),
        "stripe_subscription_id": profile.get("stripe_subscription_id")
    }
