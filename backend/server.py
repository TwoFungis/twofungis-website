from dotenv import load_dotenv
from pathlib import Path
import os

# Load environment variables FIRST, before any other imports
# This ensures all route modules have access to env vars when they load
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env', override=False)

from fastapi import FastAPI, APIRouter, Request, HTTPException
from starlette.middleware.cors import CORSMiddleware
import logging
from pydantic import BaseModel
from typing import Optional
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

# Import Copilot routes
from routes.copilot import router as copilot_router

# Import Receivables routes
from routes.receivables import router as receivables_router

# Import Profile routes
from routes.profile import router as profile_router

# Import Projects routes
from routes.projects import router as projects_router

# Import Quotes routes
from routes.quotes import router as quotes_router

# Import TFCS Mainframe routes
from routes.tfcs import router as tfcs_router

# Import Company Brain routes
from routes.company_brain import router as company_brain_router

# Import Organizations routes (Phase 1A)
from routes.organizations import router as organizations_router

# Import Opportunities routes (Vertical Slice 1)
from routes.opportunities import router as opportunities_router

# Import Tenders routes (Vertical Slice 1)
from routes.tenders import router as tenders_router

# Import Workspace routes (TradeOS OS - replaces TFCS role checks)
from routes.workspace import router as workspace_router

# Import Google Auth routes (Emergent OAuth)
from routes.google_auth import router as google_auth_router

# Import Storage routes (Emergent Object Storage)
from routes.storage import router as storage_router

# Import AI Chat routes (OpenAI GPT integration)
from routes.ai_chat import router as ai_chat_router

# Import Command Center routes (TradeOS Operational Headquarters)
from routes.command_center import router as command_center_router

# Import Production Library routes (Company Knowledge Engine)
from routes.production_library import router as production_library_router
from routes.production_library_hierarchy import router as production_library_hierarchy_router
from routes.production_library_seed import router as production_library_seed_router
from routes.estimates_v2 import router as estimates_router  # v1.1.2: Unified with quotes table

# Import centralized config (env already loaded at top, but config provides lazy access)
from config import config

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


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

@api_router.get("/debug/env-check")
async def debug_env_check():
    """
    Diagnostic endpoint to verify environment variables are loaded.
    Only shows presence/format, not actual secret values.
    """
    import os
    
    def mask_value(key: str, value: str) -> dict:
        """Return info about env var without exposing secrets"""
        if not value:
            return {"status": "MISSING", "value": None}
        if key in ["SUPABASE_URL", "FRONTEND_URL"]:
            # URLs are safe to show
            return {"status": "SET", "value": value}
        else:
            # Mask secrets - show length and first/last chars
            if len(value) > 10:
                return {"status": "SET", "value": f"{value[:4]}...{value[-4:]}", "length": len(value)}
            return {"status": "SET", "value": "***", "length": len(value)}
    
    env_vars = [
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY", 
        "SUPABASE_SERVICE_KEY",
        "FRONTEND_URL",
        "STRIPE_SECRET_KEY",
        "CORS_ORIGINS"
    ]
    
    result = {
        "env_file_path": str(ROOT_DIR / '.env'),
        "env_file_exists": (ROOT_DIR / '.env').exists(),
        "variables": {}
    }
    
    for var in env_vars:
        result["variables"][var] = mask_value(var, os.environ.get(var, ""))
    
    # Also check config module values
    result["config_values"] = {
        "SUPABASE_URL": config.SUPABASE_URL if config.SUPABASE_URL else "EMPTY",
        "SUPABASE_URL_length": len(config.SUPABASE_URL) if config.SUPABASE_URL else 0
    }
    
    return result

@api_router.get("/status")
async def get_system_status():
    """
    System status endpoint - checks Supabase connectivity.
    Returns health status of all external services.
    """
    status = {
        "api": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {}
    }
    
    # Check Supabase connectivity
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/",
                headers={
                    "apikey": config.SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {config.SUPABASE_SERVICE_KEY}"
                }
            )
            status["services"]["supabase"] = "connected" if response.status_code == 200 else "error"
    except Exception as e:
        status["services"]["supabase"] = f"error: {str(e)[:50]}"
    
    # Overall status
    all_healthy = all(v == "connected" for v in status["services"].values())
    status["status"] = "healthy" if all_healthy else "degraded"
    
    return status


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

# Include AI routes
app.include_router(ai_router)

# Include Copilot routes
app.include_router(copilot_router)

# Include Receivables routes
app.include_router(receivables_router)

# Include Profile routes
app.include_router(profile_router)

# Include Projects routes
app.include_router(projects_router)

# Include Quotes routes
app.include_router(quotes_router)

# Include TFCS Mainframe routes
app.include_router(tfcs_router)

# Include Company Brain routes
app.include_router(company_brain_router)

# Include Organizations routes (Phase 1A)
app.include_router(organizations_router)

# Include Opportunities routes (Vertical Slice 1)
app.include_router(opportunities_router)

# Include Tenders routes (Vertical Slice 1)
app.include_router(tenders_router)

# Include Workspace routes (TradeOS OS)
app.include_router(workspace_router)

# Include Google Auth routes (Emergent OAuth)
app.include_router(google_auth_router)

# Include Storage routes (Emergent Object Storage)
app.include_router(storage_router)

# Include AI Chat routes (OpenAI GPT integration)
app.include_router(ai_chat_router)

# Include Command Center routes (TradeOS Operational Headquarters)
app.include_router(command_center_router)

# Include Production Library routes (Company Knowledge Engine)
app.include_router(production_library_router)
app.include_router(production_library_hierarchy_router)
app.include_router(production_library_seed_router)

# Include Estimates routes (Estimate Workbench - Phase 4 Snapshot Architecture)
app.include_router(estimates_router)

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
    # MongoDB has been removed - this is now a no-op
    # Supabase connections are handled by httpx and don't need explicit cleanup
    logger.info("Application shutting down - cleanup complete")
