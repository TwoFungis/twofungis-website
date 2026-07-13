"""
TradeOS Stripe Integration Routes
Handles subscriptions (Pro, Elite) and one-time payments (Lifetime Elite)
Production-hardened with atomic seat counting and country enforcement
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, Literal
import os
import logging
import stripe
import httpx
from config import config
from datetime import datetime, timezone

router = APIRouter(prefix="/api/stripe", tags=["stripe"])
logger = logging.getLogger(__name__)

# =============================================================================
# CONFIGURATION
# =============================================================================


# Stripe Price IDs
STRIPE_PRICE_IDS = {
    "PRO": os.environ.get('STRIPE_PRO_PRICE_ID', 'price_1T20NRAVLnc1BWBltTCl65We'),
    "ELITE": os.environ.get('STRIPE_ELITE_PRICE_ID', 'price_1T20OQAVLnc1BWBlxXBFkTWx'),
    "LIFETIME_ELITE": os.environ.get('STRIPE_LIFETIME_PRICE_ID', 'price_1T20WNAVLnc1BWBl0gKPyqOd'),
}

# Initialize Stripe
stripe.api_key = config.STRIPE_SECRET_KEY

# =============================================================================
# MODELS
# =============================================================================

class CreateCheckoutRequest(BaseModel):
    plan: Literal["PRO", "ELITE", "LIFETIME_ELITE"]
    user_id: str
    email: str
    country: Optional[str] = None

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
        "apikey": config.SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {config.SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

async def get_lifetime_seats() -> LifetimeSeatsResponse:
    """Get current lifetime seats status from Supabase"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{config.SUPABASE_URL}/rest/v1/rpc/get_lifetime_seats_status",
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
                f"{config.SUPABASE_URL}/rest/v1/founding_lifetime?id=eq.1",
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
    
    return LifetimeSeatsResponse(
        max_seats=100,
        seats_sold=0,
        remaining=100,
        is_active=True,
        region_lock="CA"
    )

async def increment_lifetime_seat() -> dict:
    """Atomically increment the lifetime seat counter using database transaction"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{config.SUPABASE_URL}/rest/v1/rpc/increment_lifetime_seat",
                headers=await get_supabase_headers(),
                json={}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    return data[0]
            
            logger.error(f"Failed to increment seat: {response.status_code} - {response.text}")
            return {"success": False, "error_message": "Database error - seat not claimed"}
            
    except Exception as e:
        logger.error(f"Error incrementing lifetime seat: {e}")
        return {"success": False, "error_message": str(e)}

async def check_existing_lifetime_purchase(user_id: str) -> bool:
    """Check if user already has a lifetime purchase"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/lifetime_purchases?user_id=eq.{user_id}&select=id",
                headers=await get_supabase_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                return len(data) > 0
    except Exception as e:
        logger.error(f"Error checking existing lifetime purchase: {e}")
    
    return False

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
        if stripe_subscription_id is not None:
            update_data["stripe_subscription_id"] = stripe_subscription_id
        if stripe_payment_intent_id:
            update_data["stripe_payment_intent_id"] = stripe_payment_intent_id
        if lifetime_purchased_at:
            update_data["lifetime_purchased_at"] = lifetime_purchased_at
        
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{config.SUPABASE_URL}/rest/v1/users_profile?user_id=eq.{user_id}",
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
                f"{config.SUPABASE_URL}/rest/v1/lifetime_purchases",
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
                f"{config.SUPABASE_URL}/rest/v1/users_profile?user_id=eq.{user_id}&select=*",
                headers=await get_supabase_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    return data[0]
    except Exception as e:
        logger.error(f"Error fetching user profile: {e}")
    
    return {}

async def flag_user_for_review(user_id: str, reason: str, payment_intent_id: str):
    """Flag a user for manual review due to country mismatch or other issues"""
    logger.warning(f"FLAGGED USER {user_id}: {reason} | payment_intent: {payment_intent_id}")

async def process_automatic_refund(payment_intent_id: str, reason: str) -> bool:
    """Process automatic refund via Stripe API"""
    try:
        refund = stripe.Refund.create(
            payment_intent=payment_intent_id,
            reason="fraudulent"
        )
        logger.info(f"Refund processed: {refund.id} for payment_intent {payment_intent_id} - Reason: {reason}")
        return True
    except stripe.error.StripeError as e:
        logger.error(f"Failed to process refund for {payment_intent_id}: {e}")
        return False

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
            "tagline": "For growing trades getting organized.",
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
            "tagline": "Built for contractors running serious operations.",
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
            "name": "Founding Lifetime",
            "tagline": "Permanent Elite access as an original founding contractor.",
            "price": 599,
            "currency": "CAD",
            "interval": None,
            "mode": "payment",
            "price_id": STRIPE_PRICE_IDS["LIFETIME_ELITE"],
            "region_lock": "CA",
            "max_seats": lifetime_status.max_seats,
            "seats_remaining": lifetime_status.remaining,
            "is_available": lifetime_status.is_active and lifetime_status.remaining > 0,
            "features": [
                "Elite features forever",
                "No monthly subscription",
                "Founding Member badge",
                "Priority feature voting",
                "Early access to new tools",
                "Locked pricing protection"
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
    
    if not config.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    
    plan = request.plan
    user_id = request.user_id
    email = request.email
    user_country = (request.country or "").upper()
    
    price_id = STRIPE_PRICE_IDS.get(plan)
    if not price_id:
        raise HTTPException(status_code=400, detail=f"Invalid plan: {plan}")
    
    is_lifetime = plan == "LIFETIME_ELITE"
    mode = "payment" if is_lifetime else "subscription"
    
    # === LIFETIME_ELITE VALIDATIONS (SERVER-SIDE ENFORCEMENT) ===
    if is_lifetime:
        # 1. Fetch user profile to verify country
        profile = await get_user_profile(user_id)
        profile_country = (profile.get("country") or "").upper()
        
        # 2. STRICT country check - must be CA in profile
        if profile_country != "CA" and user_country != "CA":
            raise HTTPException(
                status_code=403,
                detail="Founding Lifetime is currently available to Canadian contractors only."
            )
        
        # 3. Check if user already has lifetime
        if profile.get("plan_type") == "LIFETIME_ELITE":
            raise HTTPException(
                status_code=409,
                detail="You already have a Founding Lifetime membership."
            )
        
        # 4. Check for existing purchase record
        has_existing = await check_existing_lifetime_purchase(user_id)
        if has_existing:
            raise HTTPException(
                status_code=409,
                detail="A Founding Lifetime purchase already exists for this account."
            )
        
        # 5. Check seat availability
        seats = await get_lifetime_seats()
        if not seats.is_active or seats.remaining <= 0:
            raise HTTPException(
                status_code=410,
                detail="All Founding Lifetime memberships have been claimed."
            )
    
    success_url = f"{config.FRONTEND_URL}/app/settings?session_id={{CHECKOUT_SESSION_ID}}&payment=success&plan={plan}"
    cancel_url = f"{config.FRONTEND_URL}/app/settings?payment=cancelled"
    
    try:
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
                "plan": plan,
                "profile_country": user_country
            }
        }
        
        if is_lifetime:
            session_params["billing_address_collection"] = "required"
            session_params["payment_intent_data"] = {
                "metadata": {
                    "user_id": user_id,
                    "plan": plan,
                    "profile_country": user_country
                }
            }
        else:
            session_params["subscription_data"] = {
                "metadata": {
                    "user_id": user_id,
                    "plan": plan
                }
            }
        
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
    
    if not config.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    
    profile = await get_user_profile(request.user_id)
    
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    
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
            return_url=f"{config.FRONTEND_URL}/app/settings"
        )
        
        return CreatePortalResponse(portal_url=session.url)
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe portal error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events with strict signature verification"""
    
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    # STRICT signature verification - no bypass
    if not config.STRIPE_WEBHOOK_SECRET:
        logger.error("config.STRIPE_WEBHOOK_SECRET not configured - rejecting webhook")
        raise HTTPException(status_code=500, detail="Webhook not configured")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, config.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        logger.error(f"Invalid payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    event_type = event.type
    logger.info(f"Received webhook event: {event_type}")
    
    if event_type == "checkout.session.completed":
        session = event.data.object
        await handle_checkout_completed(session)
    
    elif event_type == "invoice.payment_failed":
        invoice = event.data.object
        await handle_payment_failed(invoice)
    
    elif event_type == "customer.subscription.deleted":
        subscription = event.data.object
        await handle_subscription_deleted(subscription)
    
    elif event_type == "customer.subscription.updated":
        subscription = event.data.object
        await handle_subscription_updated(subscription)
    
    return {"status": "received", "event": event_type}


async def handle_checkout_completed(session):
    """Handle checkout.session.completed event"""
    
    session_id = session.id
    mode = session.mode
    customer_id = session.customer
    metadata = session.metadata or {}
    user_id = metadata.get("user_id")
    plan = metadata.get("plan")
    profile_country = metadata.get("profile_country", "")
    
    logger.info(f"Processing checkout: session={session_id}, mode={mode}, plan={plan}, user={user_id}")
    
    if not user_id:
        logger.error("No user_id in metadata, cannot process")
        return
    
    # === SUBSCRIPTION MODE (PRO / ELITE) ===
    if mode == "subscription":
        subscription_id = session.subscription
        
        if not plan:
            try:
                line_items = stripe.checkout.Session.list_line_items(session_id)
                for item in line_items.data:
                    price_id = item.price.id
                    if price_id == STRIPE_PRICE_IDS["PRO"]:
                        plan = "PRO"
                    elif price_id == STRIPE_PRICE_IDS["ELITE"]:
                        plan = "ELITE"
            except Exception as e:
                logger.error(f"Error fetching line items: {e}")
        
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
        payment_intent_id = session.payment_intent
        
        # Get billing country from Stripe
        customer_details = session.customer_details
        billing_country = ""
        if customer_details and customer_details.address:
            billing_country = (customer_details.address.country or "").upper()
        
        logger.info(f"Lifetime purchase: billing_country={billing_country}, profile_country={profile_country}")
        
        # CRITICAL: Verify billing address is Canada
        if billing_country != "CA":
            logger.error(f"COUNTRY MISMATCH: billing={billing_country}, expected=CA for user {user_id}")
            await flag_user_for_review(
                user_id=user_id,
                reason=f"Billing country mismatch: {billing_country} != CA",
                payment_intent_id=payment_intent_id
            )
            await process_automatic_refund(
                payment_intent_id=payment_intent_id,
                reason=f"Non-Canadian billing country: {billing_country}"
            )
            return
        
        # Check for duplicate purchase
        has_existing = await check_existing_lifetime_purchase(user_id)
        if has_existing:
            logger.error(f"DUPLICATE PURCHASE attempt for user {user_id}")
            await process_automatic_refund(
                payment_intent_id=payment_intent_id,
                reason="Duplicate lifetime purchase attempt"
            )
            return
        
        # ATOMIC seat increment
        seat_result = await increment_lifetime_seat()
        
        if not seat_result.get("success", False):
            error_msg = seat_result.get('error_message', 'Unknown error')
            logger.error(f"SEAT CLAIM FAILED for user {user_id}: {error_msg}")
            await process_automatic_refund(
                payment_intent_id=payment_intent_id,
                reason=f"Seat claim failed: {error_msg}"
            )
            return
        
        logger.info(f"Seat claimed. Sold: {seat_result.get('seats_sold')}, Remaining: {seat_result.get('seats_remaining')}")
        
        # Update user profile
        await update_user_plan(
            user_id=user_id,
            plan_type="LIFETIME_ELITE",
            plan_status="active",
            stripe_customer_id=customer_id,
            stripe_subscription_id=None,
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
        
        logger.info(f"SUCCESS: Activated LIFETIME_ELITE for user {user_id}")


async def handle_payment_failed(invoice):
    """Handle invoice.payment_failed - only for subscriptions, never affects lifetime"""
    
    subscription_id = invoice.subscription
    
    if not subscription_id:
        return
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/users_profile?stripe_subscription_id=eq.{subscription_id}&select=user_id,plan_type",
                headers=await get_supabase_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    user = data[0]
                    user_id = user.get("user_id")
                    plan_type = user.get("plan_type")
                    
                    if plan_type == "LIFETIME_ELITE":
                        logger.info(f"PROTECTED: Ignoring payment_failed for LIFETIME_ELITE user {user_id}")
                        return
                    
                    await update_user_plan(
                        user_id=user_id,
                        plan_type=plan_type,
                        plan_status="past_due"
                    )
                    logger.info(f"Set user {user_id} to past_due")
                    
    except Exception as e:
        logger.error(f"Error handling payment_failed: {e}")


async def handle_subscription_deleted(subscription):
    """Handle subscription deletion - never affects lifetime"""
    
    subscription_id = subscription.id
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/users_profile?stripe_subscription_id=eq.{subscription_id}&select=user_id,plan_type",
                headers=await get_supabase_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    user = data[0]
                    user_id = user.get("user_id")
                    plan_type = user.get("plan_type")
                    
                    if plan_type == "LIFETIME_ELITE":
                        logger.info(f"PROTECTED: Ignoring subscription_deleted for LIFETIME_ELITE user {user_id}")
                        return
                    
                    await update_user_plan(
                        user_id=user_id,
                        plan_type="TRIAL",
                        plan_status="canceled",
                        stripe_subscription_id=None
                    )
                    logger.info(f"Downgraded user {user_id} to TRIAL")
                    
    except Exception as e:
        logger.error(f"Error handling subscription_deleted: {e}")


async def handle_subscription_updated(subscription):
    """Handle subscription updates - never affects lifetime"""
    
    subscription_id = subscription.id
    status = subscription.status
    
    items = subscription.get("items", {}).get("data", []) if isinstance(subscription, dict) else subscription.items.data
    plan = None
    for item in items:
        price_id = item.price.id if hasattr(item, 'price') else item.get("price", {}).get("id")
        if price_id == STRIPE_PRICE_IDS["PRO"]:
            plan = "PRO"
        elif price_id == STRIPE_PRICE_IDS["ELITE"]:
            plan = "ELITE"
    
    if not plan:
        return
    
    status_map = {
        "active": "active",
        "past_due": "past_due",
        "canceled": "canceled",
        "unpaid": "past_due",
        "trialing": "trialing"
    }
    plan_status = status_map.get(status, "active")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/users_profile?stripe_subscription_id=eq.{subscription_id}&select=user_id,plan_type",
                headers=await get_supabase_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    user = data[0]
                    user_id = user.get("user_id")
                    current_plan = user.get("plan_type")
                    
                    if current_plan == "LIFETIME_ELITE":
                        logger.info(f"PROTECTED: Ignoring subscription_updated for LIFETIME_ELITE user {user_id}")
                        return
                    
                    await update_user_plan(
                        user_id=user_id,
                        plan_type=plan,
                        plan_status=plan_status
                    )
                    logger.info(f"Updated user {user_id}: plan={plan}, status={plan_status}")
                    
    except Exception as e:
        logger.error(f"Error handling subscription_updated: {e}")


# =============================================================================
# BILLING ENDPOINT
# =============================================================================

@router.get("/billing/user/{user_id}")
async def get_user_billing(user_id: str):
    """Get user's billing/subscription info"""
    
    profile = await get_user_profile(user_id)
    
    if not profile:
        return {
            "has_subscription": False,
            "plan_type": "TRIAL",
            "plan_status": "inactive",
            "is_lifetime": False
        }
    
    plan_type = profile.get("plan_type", "TRIAL")
    is_lifetime = plan_type == "LIFETIME_ELITE"
    
    return {
        "has_subscription": plan_type not in [None, "TRIAL"],
        "plan_type": plan_type,
        "plan_status": profile.get("plan_status", "inactive"),
        "is_lifetime": is_lifetime,
        "lifetime_purchased_at": profile.get("lifetime_purchased_at"),
        "stripe_customer_id": profile.get("stripe_customer_id"),
        "stripe_subscription_id": profile.get("stripe_subscription_id") if not is_lifetime else None,
        "trial_ends_at": profile.get("trial_ends_at")
    }


# =============================================================================
# FOUNDERS ENDPOINTS
# =============================================================================

INITIAL_FOUNDERS = [
    "info@twofungis.ca",
    "swdmarshall@gmail.com", 
    "carpenterbeau@hotmail.com"
]

@router.get("/founders")
async def get_founders():
    """Get list of lifetime founders and remaining spots"""
    
    lifetime_status = await get_lifetime_seats()
    
    # Get founders from database
    founders_list = []
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/users_profile?plan_type=eq.LIFETIME_ELITE&select=id,full_name,company_name,created_at",
                headers=await get_supabase_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                for i, founder in enumerate(data):
                    founders_list.append({
                        "number": i + 1,
                        "name": founder.get("full_name") or founder.get("company_name") or "Founding Member",
                        "joined": founder.get("created_at")
                    })
    except Exception as e:
        logger.error(f"Error fetching founders: {e}")
    
    # Initial founders count
    initial_count = len(INITIAL_FOUNDERS)
    
    return {
        "total_spots": 100,
        "initial_founders": initial_count,
        "seats_sold": lifetime_status.seats_sold,
        "remaining": max(0, 97 - lifetime_status.seats_sold),  # 97 remaining after 3 initial founders
        "founders": founders_list,
        "initial_founder_emails": INITIAL_FOUNDERS
    }


@router.post("/check-founder")
async def check_if_founder(request: Request):
    """Check if a specific email is a founder"""
    body = await request.json()
    email = body.get("email", "").lower()
    
    # Check initial founders
    if email in [e.lower() for e in INITIAL_FOUNDERS]:
        return {"is_founder": True, "founder_number": INITIAL_FOUNDERS.index(email.lower()) + 1, "type": "initial"}
    
    # Check database founders
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/users_profile?email=eq.{email}&plan_type=eq.LIFETIME_ELITE&select=id",
                headers=await get_supabase_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    return {"is_founder": True, "type": "purchased"}
    except Exception as e:
        logger.error(f"Error checking founder status: {e}")
    
    return {"is_founder": False}

