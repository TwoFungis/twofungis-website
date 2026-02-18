"""
TradeOS Trial Email API Routes
Handles trial-related email triggers for the 30-day beta trial strategy
"""
import os
import asyncio
import logging
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timezone
import json
import httpx

router = APIRouter(prefix="/api/trial", tags=["trial"])
logger = logging.getLogger(__name__)

# Check if resend is available
try:
    import resend
    RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
    if RESEND_API_KEY:
        resend.api_key = RESEND_API_KEY
        EMAIL_ENABLED = True
    else:
        EMAIL_ENABLED = False
except ImportError:
    EMAIL_ENABLED = False

SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')
APP_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://tradeos.com')


class TrialEmailRequest(BaseModel):
    user_id: str
    email: EmailStr
    name: str
    trigger_day: int  # 1, 3, 7, 14, 21, 25, 30


def get_user_id_from_token(authorization: str) -> Optional[str]:
    if not authorization or not authorization.startswith('Bearer '):
        return None
    try:
        token = authorization.replace('Bearer ', '')
        import base64
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
    except:
        return None


# Email Templates
EMAIL_TEMPLATES = {
    1: {
        "subject": "Welcome to TradeOS - Let's Get You Set Up!",
        "template": "day1_welcome"
    },
    3: {
        "subject": "Quick Win: Create Your First Project in TradeOS",
        "template": "day3_first_action"
    },
    7: {
        "subject": "Pro Tip: Set Your Labor Rate for Accurate Quotes",
        "template": "day7_labor_quote"
    },
    14: {
        "subject": "Milestone Billing: Get Paid Faster with TradeOS",
        "template": "day14_invoice_milestone"
    },
    21: {
        "subject": "Tax Time Made Easy: Your Financial Summary",
        "template": "day21_tax_summary"
    },
    25: {
        "subject": "5 Days Left: Don't Lose Your TradeOS Progress",
        "template": "day25_conversion"
    },
    30: {
        "subject": "Your TradeOS Trial Ends Today",
        "template": "day30_expiration"
    }
}


def generate_email_html(template_name: str, name: str, days_remaining: int = 0) -> str:
    """Generate branded HTML email based on template"""
    
    base_style = """
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #1a1a1a; }
        .container { max-width: 600px; margin: 0 auto; background-color: #262626; border-radius: 12px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); padding: 30px; text-align: center; }
        .logo { color: #5a8fb8; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .content { padding: 30px; color: #e5e5e5; }
        .content h1 { color: #ffffff; font-size: 24px; margin-bottom: 20px; }
        .content p { line-height: 1.6; margin-bottom: 15px; color: #a3a3a3; }
        .cta-button { display: inline-block; background-color: #5a8fb8; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .cta-button:hover { background-color: #4a7fa8; }
        .tip-box { background-color: #333; border-left: 4px solid #5a8fb8; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .tip-box h3 { color: #5a8fb8; margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; }
        .footer { background-color: #1a1a1a; padding: 20px 30px; text-align: center; color: #666; font-size: 12px; }
        .urgent { background-color: #dc262620; border: 1px solid #dc262650; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .urgent-text { color: #dc2626; font-weight: 600; }
    """
    
    templates = {
        "day1_welcome": f"""
            <h1>Welcome to TradeOS, {name}!</h1>
            <p>You've just taken the first step toward running a more profitable trade business. Over the next 30 days, you'll have full access to everything TradeOS has to offer.</p>
            
            <div class="tip-box">
                <h3>Quick Start Checklist</h3>
                <p style="margin: 0; color: #e5e5e5;">✓ Create your first project<br>✓ Set your labor rate<br>✓ Add an expense<br>✓ Generate your first invoice</p>
            </div>
            
            <p>Ready to dive in?</p>
            <a href="{APP_URL}/app/dashboard" class="cta-button">Go to Dashboard</a>
            
            <p style="margin-top: 30px;">Questions? Just reply to this email - we're here to help.</p>
        """,
        
        "day3_first_action": f"""
            <h1>Quick Win: Create Your First Project</h1>
            <p>Hey {name},</p>
            <p>The best way to see TradeOS in action is to add your current project. It takes less than 2 minutes:</p>
            
            <div class="tip-box">
                <h3>How to Create a Project</h3>
                <p style="margin: 0; color: #e5e5e5;">1. Click "Quick Add" → "New Project"<br>2. Enter the project name and client<br>3. Add the contract value<br>4. That's it!</p>
            </div>
            
            <a href="{APP_URL}/app/projects?new=true" class="cta-button">Create Your First Project</a>
            
            <p>Once you have a project, you can track expenses, create milestones, and generate invoices - all in one place.</p>
        """,
        
        "day7_labor_quote": f"""
            <h1>Set Your Labor Rate for Accurate Quotes</h1>
            <p>Hey {name},</p>
            <p>One of the most powerful features in TradeOS is automatic quote generation. But first, you need to set your labor rate.</p>
            
            <div class="tip-box">
                <h3>Why This Matters</h3>
                <p style="margin: 0; color: #e5e5e5;">Your labor rate helps TradeOS calculate accurate estimates. Include your overhead, profit margin, and true cost of labor.</p>
            </div>
            
            <p><strong>Tip:</strong> Most contractors undercharge. If you're charging $50/hour but your fully loaded cost is $65, you're losing money on every job.</p>
            
            <a href="{APP_URL}/app/settings" class="cta-button">Set Your Labor Rate</a>
        """,
        
        "day14_invoice_milestone": f"""
            <h1>Get Paid Faster with Milestone Billing</h1>
            <p>Hey {name},</p>
            <p>Stop waiting until the end of a project to get paid. With milestone billing, you can invoice as you complete phases of work.</p>
            
            <div class="tip-box">
                <h3>Example Milestone Structure</h3>
                <p style="margin: 0; color: #e5e5e5;">• Deposit: 25% at signing<br>• Rough-in: 25% at completion<br>• Final: 50% at project end</p>
            </div>
            
            <p>TradeOS makes it easy to create milestones and automatically generate invoices when each one is complete.</p>
            
            <a href="{APP_URL}/app/milestones" class="cta-button">Create Milestones</a>
        """,
        
        "day21_tax_summary": f"""
            <h1>Your Financial Summary is Ready</h1>
            <p>Hey {name},</p>
            <p>With 9 days left in your trial, now is a great time to check out your Tax Summary. TradeOS automatically tracks:</p>
            
            <div class="tip-box">
                <h3>What's Tracked</h3>
                <p style="margin: 0; color: #e5e5e5;">• Total revenue by project<br>• Expenses by category<br>• Estimated tax liability<br>• Recommended set-aside percentage</p>
            </div>
            
            <p>No more scrambling at tax time. TradeOS keeps you organized year-round.</p>
            
            <a href="{APP_URL}/app/dashboard" class="cta-button">View Your Summary</a>
        """,
        
        "day25_conversion": f"""
            <h1>5 Days Left in Your Trial</h1>
            <p>Hey {name},</p>
            <p>Your TradeOS trial ends in 5 days. Don't worry - your data is safe. But to keep using all the features, you'll need to upgrade.</p>
            
            <div class="tip-box">
                <h3>What You'll Keep</h3>
                <p style="margin: 0; color: #e5e5e5;">✓ All your projects<br>✓ Invoice history<br>✓ Expense records<br>✓ Financial reports</p>
            </div>
            
            <p>Upgrade today and never miss a beat.</p>
            
            <a href="{APP_URL}/app/settings" class="cta-button">Upgrade to Pro</a>
            
            <p style="font-size: 14px; color: #666;">Have questions? Reply to this email - we're happy to help.</p>
        """,
        
        "day30_expiration": f"""
            <h1>Your Trial Ends Today</h1>
            <p>Hey {name},</p>
            
            <div class="urgent">
                <p class="urgent-text">Your 30-day TradeOS trial expires today.</p>
            </div>
            
            <p>After today, you'll lose access to:</p>
            <ul style="color: #a3a3a3;">
                <li>Creating new projects and invoices</li>
                <li>Financial reports and dashboards</li>
                <li>Expense tracking</li>
            </ul>
            
            <p><strong>Good news:</strong> Your data will be preserved. Upgrade anytime to pick up right where you left off.</p>
            
            <a href="{APP_URL}/app/settings" class="cta-button" style="background-color: #dc2626;">Upgrade Now</a>
            
            <p style="margin-top: 20px;">Questions? Just reply to this email.</p>
        """
    }
    
    content = templates.get(template_name, templates["day1_welcome"])
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>{base_style}</style>
    </head>
    <body>
        <div style="padding: 20px; background-color: #1a1a1a;">
            <div class="container">
                <div class="header">
                    <div class="logo">TradeOS™</div>
                    <p style="margin: 0; color: #666; font-size: 12px;">Built for Builders</p>
                </div>
                <div class="content">
                    {content}
                </div>
                <div class="footer">
                    <p>TradeOS™ - Know your margin. Control your projects. Get paid faster.</p>
                    <p style="margin-top: 10px;">© 2026 TradeOS. All rights reserved.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """


@router.post("/send-email")
async def send_trial_email(request: TrialEmailRequest):
    """Send trial-related email based on trigger day"""
    
    if not EMAIL_ENABLED:
        return {
            "status": "skipped",
            "message": "Email sending not configured",
            "trigger_day": request.trigger_day
        }
    
    template_info = EMAIL_TEMPLATES.get(request.trigger_day)
    if not template_info:
        raise HTTPException(status_code=400, detail=f"Invalid trigger day: {request.trigger_day}")
    
    days_remaining = max(0, 30 - request.trigger_day)
    html_content = generate_email_html(
        template_info["template"], 
        request.name,
        days_remaining
    )
    
    params = {
        "from": SENDER_EMAIL,
        "to": [request.email],
        "subject": template_info["subject"],
        "html": html_content
    }
    
    try:
        email = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Trial email (day {request.trigger_day}) sent to {request.email}")
        
        # Log email sent to database
        await log_email_sent(request.user_id, request.trigger_day)
        
        return {
            "status": "success",
            "message": f"Trial email sent for day {request.trigger_day}",
            "email_id": email.get("id")
        }
    except Exception as e:
        logger.error(f"Failed to send trial email: {str(e)}")
        return {
            "status": "failed",
            "message": str(e),
            "trigger_day": request.trigger_day
        }


async def log_email_sent(user_id: str, trigger_day: int):
    """Log that an email was sent to prevent duplicates"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return
    
    try:
        async with httpx.AsyncClient() as client:
            # First, get current emails_sent array
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/users_profile",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
                },
                params={"user_id": f"eq.{user_id}", "select": "trial_emails_sent"}
            )
            
            current_emails = []
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    current_emails = data[0].get('trial_emails_sent') or []
            
            # Add new trigger day if not already sent
            if trigger_day not in current_emails:
                current_emails.append(trigger_day)
                
                # Update profile
                await client.patch(
                    f"{SUPABASE_URL}/rest/v1/users_profile",
                    headers={
                        "apikey": SUPABASE_SERVICE_KEY,
                        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                        "Content-Type": "application/json"
                    },
                    params={"user_id": f"eq.{user_id}"},
                    json={"trial_emails_sent": current_emails}
                )
    except Exception as e:
        logger.warning(f"Failed to log email sent: {e}")


@router.get("/check-pending-emails")
async def check_pending_emails(authorization: str = Header(None)):
    """Check if any trial emails need to be sent for the current user"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return {"pending_emails": [], "trial_day": 0}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/users_profile",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
                },
                params={
                    "user_id": f"eq.{user_id}",
                    "select": "trial_ends_at,trial_emails_sent,full_name,subscription_tier"
                }
            )
            
            if response.status_code != 200:
                return {"pending_emails": [], "trial_day": 0}
            
            data = response.json()
            if not data or len(data) == 0:
                return {"pending_emails": [], "trial_day": 0}
            
            profile = data[0]
            
            # Only for trial users
            if profile.get('subscription_tier') != 'trial':
                return {"pending_emails": [], "trial_day": 0, "reason": "not_trial"}
            
            trial_ends_at = profile.get('trial_ends_at')
            if not trial_ends_at:
                return {"pending_emails": [], "trial_day": 0}
            
            # Calculate trial day
            trial_end = datetime.fromisoformat(trial_ends_at.replace('Z', '+00:00'))
            trial_start = trial_end - timedelta(days=30)
            now = datetime.now(timezone.utc)
            trial_day = (now - trial_start).days + 1
            
            # Get sent emails
            sent_emails = profile.get('trial_emails_sent') or []
            
            # Determine which emails should have been sent
            trigger_days = [1, 3, 7, 14, 21, 25, 30]
            pending = [day for day in trigger_days if day <= trial_day and day not in sent_emails]
            
            return {
                "pending_emails": pending,
                "trial_day": trial_day,
                "sent_emails": sent_emails,
                "user_name": profile.get('full_name', 'Builder')
            }
    except Exception as e:
        logger.error(f"Error checking pending emails: {e}")
        return {"pending_emails": [], "trial_day": 0, "error": str(e)}


from datetime import timedelta

@router.post("/process-pending-emails")
async def process_pending_emails(authorization: str = Header(None)):
    """Process and send any pending trial emails for the current user"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Get user email from Supabase auth
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return {"sent": [], "status": "skipped"}
    
    try:
        async with httpx.AsyncClient() as client:
            # Get user info
            response = await client.get(
                f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
                }
            )
            
            if response.status_code != 200:
                return {"sent": [], "status": "user_not_found"}
            
            user_data = response.json()
            user_email = user_data.get('email')
            
            # Get pending emails
            pending_response = await check_pending_emails("Bearer dummy")  # We already have user_id
            pending = pending_response.get('pending_emails', [])
            user_name = pending_response.get('user_name', 'Builder')
            
            sent = []
            for day in pending:
                result = await send_trial_email(TrialEmailRequest(
                    user_id=user_id,
                    email=user_email,
                    name=user_name,
                    trigger_day=day
                ))
                if result.get('status') == 'success':
                    sent.append(day)
            
            return {"sent": sent, "pending": pending, "status": "processed"}
    except Exception as e:
        logger.error(f"Error processing pending emails: {e}")
        return {"sent": [], "status": "error", "error": str(e)}


@router.get("/status")
async def trial_email_status():
    """Check trial email system status"""
    return {
        "email_enabled": EMAIL_ENABLED,
        "trigger_days": list(EMAIL_TEMPLATES.keys()),
        "sender_email": SENDER_EMAIL if EMAIL_ENABLED else None
    }
