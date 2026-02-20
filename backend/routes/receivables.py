"""
TradeOS Receivables & Payment Reminders API
Handles outstanding invoices and automated reminders
"""
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime, timezone, timedelta
import httpx
import os
import logging
import json
import resend

router = APIRouter(prefix="/api/receivables", tags=["receivables"])
logger = logging.getLogger(__name__)


def parse_datetime_safe(date_str: Optional[str]) -> Optional[datetime]:
    """
    Safely parse a datetime string to a timezone-aware datetime (UTC).
    Handles various formats and ensures offset-aware datetimes.
    Returns None if parsing fails or date_str is None/empty.
    """
    if not date_str:
        return None
    
    try:
        # Handle ISO format with Z suffix
        if date_str.endswith('Z'):
            date_str = date_str[:-1] + '+00:00'
        
        # Try parsing as ISO format
        try:
            dt = datetime.fromisoformat(date_str)
        except ValueError:
            # Try parsing as date-only format
            try:
                dt = datetime.strptime(date_str[:10], '%Y-%m-%d')
            except ValueError:
                logger.warning(f"Unable to parse datetime: {date_str}")
                return None
        
        # Ensure timezone-aware (convert naive to UTC)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        
        return dt
    except Exception as e:
        logger.warning(f"Error parsing datetime '{date_str}': {e}")
        return None

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'contact@tradeos.ca')

# Initialize Resend
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

# Email Templates
EMAIL_TEMPLATES = {
    "friendly": {
        "subject": "Friendly Reminder: Invoice {invoice_number}",
        "body": """Hi {client_name},

Hope you're doing well! Just a quick reminder that invoice {invoice_number} for ${amount} is currently outstanding.

The payment was due on {due_date}, and it's now {days_overdue} days past due.

If you've already sent the payment, please disregard this message. Otherwise, we'd appreciate it if you could process this at your earliest convenience.

Thanks so much for your business!

Best regards,
{company_name}

---
Invoice Details:
Invoice #: {invoice_number}
Amount Due: ${amount}
Due Date: {due_date}
Project: {project_name}
"""
    },
    "standard": {
        "subject": "Payment Reminder: Invoice {invoice_number} - ${amount} Due",
        "body": """Dear {client_name},

This is a reminder that invoice {invoice_number} for ${amount} remains unpaid.

Payment Details:
- Invoice #: {invoice_number}
- Amount Due: ${amount}
- Original Due Date: {due_date}
- Days Overdue: {days_overdue}
- Project: {project_name}

Please remit payment at your earliest convenience. If you have any questions about this invoice, please don't hesitate to reach out.

Thank you for your prompt attention to this matter.

Regards,
{company_name}
"""
    },
    "firm": {
        "subject": "URGENT: Overdue Invoice {invoice_number} - Immediate Payment Required",
        "body": """Dear {client_name},

This is an urgent reminder regarding invoice {invoice_number} for ${amount}, which is now {days_overdue} days past due.

INVOICE DETAILS:
Invoice #: {invoice_number}
Amount Due: ${amount}
Original Due Date: {due_date}
Days Overdue: {days_overdue}
Project: {project_name}

We kindly request immediate payment to avoid any service interruptions or further collection actions. If there are any issues with this invoice, please contact us immediately.

If payment has already been sent, please disregard this notice and accept our thanks.

Regards,
{company_name}
"""
    }
}


class SendReminderRequest(BaseModel):
    invoice_id: str
    tone: Literal["friendly", "standard", "firm"] = "standard"


class AutoReminderSettings(BaseModel):
    enabled: bool = False
    first_reminder_days: int = 7  # Days after due date
    second_reminder_days: int = 14
    third_reminder_days: int = 30
    tone_progression: List[str] = ["friendly", "standard", "firm"]


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
    except Exception as e:
        logger.error(f"Token decode error: {e}")
        return None


async def supabase_request(method: str, endpoint: str, data=None, params=None):
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    
    async with httpx.AsyncClient() as client:
        if method == "GET":
            response = await client.get(url, headers=headers, params=params)
        elif method == "POST":
            response = await client.post(url, headers=headers, json=data)
        elif method == "PATCH":
            response = await client.patch(url, headers=headers, json=data, params=params)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        if response.status_code >= 400:
            logger.error(f"Supabase error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=response.status_code, detail=response.text)
        
        if response.text:
            return response.json()
        return {}


@router.get("/outstanding")
async def get_outstanding_invoices(authorization: str = Header(None)):
    """Get all outstanding (unpaid) invoices with days overdue"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Fetch invoices that are not paid
        invoices = await supabase_request(
            "GET",
            "invoices",
            params={
                "user_id": f"eq.{user_id}",
                "status": "neq.paid",
                "select": "*",
                "order": "due_date.asc"
            }
        )
        
        now = datetime.now(timezone.utc)
        outstanding = []
        total_outstanding = 0
        total_overdue = 0
        
        for inv in invoices:
            total = float(inv.get('total', 0) or 0)
            total_outstanding += total
            
            due_date_str = inv.get('due_date')
            days_overdue = 0
            is_overdue = False
            
            # Use safe datetime parsing
            due = parse_datetime_safe(due_date_str)
            if due and now > due:
                days_overdue = (now - due).days
                is_overdue = True
                total_overdue += total
            
            outstanding.append({
                **inv,
                "days_overdue": days_overdue,
                "is_overdue": is_overdue,
                "last_reminder_sent": inv.get('last_reminder_sent')
            })
        
        # Sort by overdue first, then by days overdue
        outstanding.sort(key=lambda x: (-x['is_overdue'], -x['days_overdue']))
        
        return {
            "invoices": outstanding,
            "summary": {
                "total_outstanding": total_outstanding,
                "total_overdue": total_overdue,
                "count": len(outstanding),
                "overdue_count": sum(1 for i in outstanding if i['is_overdue'])
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching outstanding invoices: {e}")
        # Return empty result instead of crashing
        return {
            "invoices": [],
            "summary": {
                "total_outstanding": 0,
                "total_overdue": 0,
                "count": 0,
                "overdue_count": 0
            },
            "error": "Unable to fetch outstanding invoices"
        }


@router.post("/send-reminder")
async def send_payment_reminder(
    request: SendReminderRequest,
    authorization: str = Header(None)
):
    """Send a payment reminder email for an invoice"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    if not RESEND_API_KEY:
        raise HTTPException(status_code=500, detail="Email service not configured")
    
    try:
        # Fetch the invoice
        invoices = await supabase_request(
            "GET",
            "invoices",
            params={
                "id": f"eq.{request.invoice_id}",
                "user_id": f"eq.{user_id}"
            }
        )
        
        if not invoices:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        invoice = invoices[0]
        
        # Check if invoice has client email
        if not invoice.get('client_email'):
            raise HTTPException(status_code=400, detail="Invoice has no client email address")
        
        # Fetch user profile for company name
        profiles = await supabase_request(
            "GET",
            "users_profile",
            params={"user_id": f"eq.{user_id}"}
        )
        company_name = profiles[0].get('company_name', 'TradeOS User') if profiles else 'TradeOS User'
        
        # Calculate days overdue using safe parsing
        now = datetime.now(timezone.utc)
        due_date_str = invoice.get('due_date')
        days_overdue = 0
        due = parse_datetime_safe(due_date_str)
        if due and now > due:
            days_overdue = (now - due).days
        
        # Get template
        template = EMAIL_TEMPLATES.get(request.tone, EMAIL_TEMPLATES["standard"])
        
        # Format email
        subject = template["subject"].format(
            invoice_number=invoice.get('invoice_number', 'N/A'),
            amount=f"{float(invoice.get('total', 0)):,.2f}"
        )
        
        body = template["body"].format(
            client_name=invoice.get('client_name', 'Valued Customer'),
            invoice_number=invoice.get('invoice_number', 'N/A'),
            amount=f"{float(invoice.get('total', 0)):,.2f}",
            due_date=due_date[:10] if due_date else 'N/A',
            days_overdue=days_overdue,
            project_name=invoice.get('project_name', 'N/A'),
            company_name=company_name
        )
        
        # Send email via Resend
        params = {
            "from": f"{company_name} <{SENDER_EMAIL}>",
            "to": [invoice.get('client_email')],
            "subject": subject,
            "text": body
        }
        
        email_response = resend.Emails.send(params)
        
        # Update invoice with reminder sent timestamp
        await supabase_request(
            "PATCH",
            "invoices",
            data={
                "last_reminder_sent": datetime.now(timezone.utc).isoformat(),
                "reminder_count": (invoice.get('reminder_count', 0) or 0) + 1
            },
            params={"id": f"eq.{request.invoice_id}"}
        )
        
        return {
            "success": True,
            "message": f"Reminder sent to {invoice.get('client_email')}",
            "email_id": email_response.get('id') if isinstance(email_response, dict) else str(email_response),
            "tone": request.tone
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending reminder: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cash-flow-forecast")
async def get_cash_flow_forecast(
    authorization: str = Header(None),
    days: int = 30
):
    """
    Get 30-day cash flow forecast
    - Expected income: open invoices + milestones due within period
    - Expected expenses: recurring + logged unpaid expenses
    - Net projected balance
    """
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        now = datetime.now(timezone.utc)
        forecast_end = now + timedelta(days=days)
        
        # Fetch open invoices (expected income)
        invoices = await supabase_request(
            "GET",
            "invoices",
            params={
                "user_id": f"eq.{user_id}",
                "status": "neq.paid",
                "select": "id,invoice_number,client_name,total,due_date,status"
            }
        )
        
        # Fetch milestones due in next 30 days (expected income)
        milestones = await supabase_request(
            "GET",
            "project_milestones",
            params={
                "user_id": f"eq.{user_id}",
                "status": "neq.paid",
                "due_date": f"lte.{forecast_end.isoformat()}",
                "select": "id,name,amount,due_date,status,project_id"
            }
        )
        
        # Fetch recent expenses (last 30 days for projection)
        expenses = await supabase_request(
            "GET",
            "expenses",
            params={
                "user_id": f"eq.{user_id}",
                "expense_date": f"gte.{(now - timedelta(days=30)).date().isoformat()}",
                "select": "id,description,amount,category,expense_date"
            }
        )
        
        # Calculate expected income from invoices
        invoice_income = []
        for inv in invoices:
            due_date = inv.get('due_date')
            total = float(inv.get('total', 0) or 0)
            is_in_period = True
            if due_date:
                due = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
                is_in_period = due <= forecast_end
            
            if is_in_period:
                invoice_income.append({
                    "type": "invoice",
                    "id": inv.get('id'),
                    "description": f"Invoice {inv.get('invoice_number')} - {inv.get('client_name')}",
                    "amount": total,
                    "due_date": due_date,
                    "status": inv.get('status')
                })
        
        # Calculate expected income from milestones
        milestone_income = []
        for ms in milestones:
            amount = float(ms.get('amount', 0) or 0)
            milestone_income.append({
                "type": "milestone",
                "id": ms.get('id'),
                "description": ms.get('name', 'Milestone'),
                "amount": amount,
                "due_date": ms.get('due_date'),
                "status": ms.get('status')
            })
        
        # Calculate expected expenses (project based on last 30 days)
        total_recent_expenses = sum(float(e.get('amount', 0) or 0) for e in expenses)
        daily_avg_expense = total_recent_expenses / 30 if total_recent_expenses > 0 else 0
        projected_expenses = daily_avg_expense * days
        
        # Category breakdown of recent expenses
        expense_by_category = {}
        for e in expenses:
            cat = e.get('category', 'Other')
            expense_by_category[cat] = expense_by_category.get(cat, 0) + float(e.get('amount', 0) or 0)
        
        # Totals
        total_invoice_income = sum(i['amount'] for i in invoice_income)
        total_milestone_income = sum(m['amount'] for m in milestone_income)
        total_expected_income = total_invoice_income + total_milestone_income
        net_projected = total_expected_income - projected_expenses
        
        return {
            "period_days": days,
            "forecast_start": now.isoformat(),
            "forecast_end": forecast_end.isoformat(),
            "expected_income": {
                "invoices": {
                    "total": total_invoice_income,
                    "count": len(invoice_income),
                    "items": invoice_income[:5]  # Top 5
                },
                "milestones": {
                    "total": total_milestone_income,
                    "count": len(milestone_income),
                    "items": milestone_income[:5]
                },
                "total": total_expected_income
            },
            "expected_expenses": {
                "projected_total": round(projected_expenses, 2),
                "daily_average": round(daily_avg_expense, 2),
                "by_category": expense_by_category,
                "note": f"Based on ${total_recent_expenses:,.0f} in expenses over the last 30 days"
            },
            "net_projected": round(net_projected, 2),
            "cash_flow_status": "positive" if net_projected > 0 else "negative" if net_projected < 0 else "neutral"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating cash flow forecast: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reminder-templates")
async def get_reminder_templates():
    """Get available reminder email templates"""
    return {
        "templates": [
            {
                "id": "friendly",
                "name": "Friendly",
                "description": "Casual, warm tone for first reminders",
                "preview": "Hope you're doing well! Just a quick reminder..."
            },
            {
                "id": "standard",
                "name": "Standard",
                "description": "Professional business tone",
                "preview": "This is a reminder that invoice remains unpaid..."
            },
            {
                "id": "firm",
                "name": "Firm",
                "description": "Urgent tone for significantly overdue invoices",
                "preview": "URGENT: Immediate payment required..."
            }
        ]
    }
