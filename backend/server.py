from fastapi import FastAPI, APIRouter, Request, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone

# Import Stripe Checkout from emergentintegrations
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, 
    CheckoutSessionResponse, 
    CheckoutStatusResponse, 
    CheckoutSessionRequest
)

# Import bookkeeping routes
from routes.bookkeeping import router as bookkeeping_router

# Import email routes
from routes.email import router as email_router

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env', override=False)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Stripe configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'your_stripe_api_key_here')

# Subscription pricing (in CAD)
SUBSCRIPTION_PLANS = {
    "pro": {
        "name": "Pro Plan",
        "amount": 39.00,
        "currency": "cad",
        "features": ["Unlimited Projects", "Quote Builder", "Change Order Manager", "Labor Cost Engine", "Production Logs"]
    },
    "elite": {
        "name": "Elite Plan", 
        "amount": 59.00,
        "currency": "cad",
        "features": ["Everything in Pro", "Advanced Reports", "KPI Dashboard", "Production Analytics", "Priority Support"]
    }
}

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Subscription Models
class SubscriptionCheckoutRequest(BaseModel):
    plan_type: str  # 'pro' or 'elite'
    origin_url: str  # Frontend URL for success/cancel redirects
    user_id: Optional[str] = None
    email: Optional[str] = None

class SubscriptionCheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str
    plan_type: str
    amount: float

class PaymentStatusRequest(BaseModel):
    session_id: str

class PaymentStatusResponse(BaseModel):
    status: str
    payment_status: str
    amount_total: float
    currency: str
    plan_type: Optional[str] = None


# Basic API routes
@api_router.get("/")
async def root():
    return {"message": "TradeOS API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "tradeos-api"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks


# Subscription Plans endpoint
@api_router.get("/subscription/plans")
async def get_subscription_plans():
    """Get available subscription plans with pricing"""
    return {
        "plans": SUBSCRIPTION_PLANS,
        "trial_days": 7
    }


# Create Checkout Session
@api_router.post("/subscription/checkout", response_model=SubscriptionCheckoutResponse)
async def create_subscription_checkout(request: SubscriptionCheckoutRequest, http_request: Request):
    """Create a Stripe checkout session for subscription"""
    
    # Validate plan type
    if request.plan_type not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail=f"Invalid plan type. Must be one of: {list(SUBSCRIPTION_PLANS.keys())}")
    
    plan = SUBSCRIPTION_PLANS[request.plan_type]
    
    # Build success and cancel URLs from frontend origin
    success_url = f"{request.origin_url}/app/settings?session_id={{CHECKOUT_SESSION_ID}}&payment=success"
    cancel_url = f"{request.origin_url}/app/settings?payment=cancelled"
    
    # Set up webhook URL
    host_url = str(http_request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    # Initialize Stripe checkout
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    # Create metadata for tracking
    metadata = {
        "plan_type": request.plan_type,
        "plan_name": plan["name"],
        "source": "tradeos_subscription"
    }
    if request.user_id:
        metadata["user_id"] = request.user_id
    if request.email:
        metadata["email"] = request.email
    
    # Create checkout session request
    checkout_request = CheckoutSessionRequest(
        amount=plan["amount"],
        currency=plan["currency"],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata
    )
    
    try:
        # Create checkout session
        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Store transaction record in MongoDB
        transaction_record = {
            "id": str(uuid.uuid4()),
            "session_id": session.session_id,
            "user_id": request.user_id,
            "email": request.email,
            "plan_type": request.plan_type,
            "amount": plan["amount"],
            "currency": plan["currency"],
            "payment_status": "pending",
            "metadata": metadata,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payment_transactions.insert_one(transaction_record)
        
        return SubscriptionCheckoutResponse(
            checkout_url=session.url,
            session_id=session.session_id,
            plan_type=request.plan_type,
            amount=plan["amount"]
        )
        
    except Exception as e:
        logging.error(f"Error creating checkout session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")


# Check Payment Status
@api_router.get("/subscription/status/{session_id}", response_model=PaymentStatusResponse)
async def get_payment_status(session_id: str, http_request: Request):
    """Check the status of a payment session"""
    
    host_url = str(http_request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        # Get plan type from our stored transaction
        transaction = await db.payment_transactions.find_one(
            {"session_id": session_id},
            {"_id": 0}
        )
        plan_type = transaction.get("plan_type") if transaction else None
        
        # Update transaction status in database if payment completed
        if status.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {
                    "$set": {
                        "payment_status": "paid",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
        elif status.status == "expired":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {
                    "$set": {
                        "payment_status": "expired",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
        
        return PaymentStatusResponse(
            status=status.status,
            payment_status=status.payment_status,
            amount_total=status.amount_total / 100,  # Convert from cents to dollars
            currency=status.currency,
            plan_type=plan_type
        )
        
    except Exception as e:
        logging.error(f"Error checking payment status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to check payment status: {str(e)}")


# Stripe Webhook
@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update transaction based on webhook event
        if webhook_response.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {
                    "$set": {
                        "payment_status": "paid",
                        "stripe_payment_id": webhook_response.event_id,
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
        
        return {"status": "received", "event_type": webhook_response.event_type}
        
    except Exception as e:
        logging.error(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


# Get user's subscription status
@api_router.get("/subscription/user/{user_id}")
async def get_user_subscription(user_id: str):
    """Get the current subscription status for a user"""
    
    # Find the most recent paid transaction for this user
    transaction = await db.payment_transactions.find_one(
        {"user_id": user_id, "payment_status": "paid"},
        {"_id": 0},
        sort=[("created_at", -1)]
    )
    
    if transaction:
        return {
            "has_subscription": True,
            "plan_type": transaction.get("plan_type"),
            "subscribed_at": transaction.get("created_at"),
            "status": "active"
        }
    
    return {
        "has_subscription": False,
        "plan_type": "trial",
        "status": "trialing"
    }


# Include the router in the main app
app.include_router(api_router)

# Include bookkeeping routes under /api
app.include_router(bookkeeping_router, prefix="/api")

# Include email routes (already has /api prefix)
app.include_router(email_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
