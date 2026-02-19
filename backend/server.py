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
import httpx

# Import bookkeeping routes
from routes.bookkeeping import router as bookkeeping_router

# Import email routes
from routes.email import router as email_router

# Import Stripe routes
from routes.stripe import router as stripe_router

# Import Invoices routes
from routes.invoices import router as invoices_router

# Import Milestones routes
from routes.milestones import router as milestones_router

# Import Expenses routes
from routes.expenses import router as expenses_router

# Import Trial Emails routes
from routes.trial_emails import router as trial_emails_router

# Import Materials routes
from routes.materials import router as materials_router

# Import Founders routes
from routes.founders import router as founders_router

# Import AI routes
from routes.ai import router as ai_router

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env', override=False)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Supabase configuration for direct DB access
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

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

# Subscription Models (kept for backward compatibility)
class SubscriptionCheckoutRequest(BaseModel):
    plan_type: str  # 'pro', 'elite' or 'lifetime_elite'
    origin_url: str  # Frontend URL for success/cancel redirects
    user_id: Optional[str] = None
    email: Optional[str] = None
    country: Optional[str] = None

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


# Legacy subscription endpoints (redirect to /api/stripe routes)
@api_router.get("/subscription/plans")
async def get_subscription_plans():
    """Redirect to new plans endpoint"""
    from routes.stripe import get_plans
    return await get_plans()

@api_router.get("/subscription/lifetime/status")
async def get_lifetime_seats_status():
    """Redirect to new lifetime-seats endpoint"""
    from routes.stripe import get_lifetime_seats_endpoint
    return await get_lifetime_seats_endpoint()


# Include the router in the main app
app.include_router(api_router)

# Include bookkeeping routes under /api
app.include_router(bookkeeping_router, prefix="/api")

# Include email routes (already has /api prefix)
app.include_router(email_router)

# Include Stripe routes
app.include_router(stripe_router)

# Include Invoices routes
app.include_router(invoices_router)

# Include Milestones routes
app.include_router(milestones_router)

# Include Expenses routes
app.include_router(expenses_router)

# Include Trial Emails routes
app.include_router(trial_emails_router)

# Include Materials routes
app.include_router(materials_router)

# Include Founders routes
app.include_router(founders_router)

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
