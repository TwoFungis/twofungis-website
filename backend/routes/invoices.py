"""
TradeOS Invoicing API Routes
Handles invoice creation, management, and tracking
"""
from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, timezone, date, timedelta
import httpx
import os
import logging
import json

router = APIRouter(prefix="/api/invoices", tags=["invoices"])
logger = logging.getLogger(__name__)

# Environment variables
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

# Pydantic Models
class InvoiceLineItem(BaseModel):
    description: str
    quantity: float = 1.0
    unit_price: float
    amount: Optional[float] = None

class InvoiceCreate(BaseModel):
    project_id: Optional[str] = None
    milestone_id: Optional[str] = None
    client_name: str
    client_email: Optional[str] = None
    client_address: Optional[str] = None
    client_phone: Optional[str] = None
    project_name: Optional[str] = None
    line_items: List[InvoiceLineItem] = []
    tax_rate: float = 0.0
    payment_terms: str = "Net 30"
    payment_terms_days: int = 30
    due_date: Optional[str] = None
    notes: Optional[str] = None
    internal_notes: Optional[str] = None

class InvoiceUpdate(BaseModel):
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    client_address: Optional[str] = None
    client_phone: Optional[str] = None
    project_name: Optional[str] = None
    line_items: Optional[List[InvoiceLineItem]] = None
    tax_rate: Optional[float] = None
    payment_terms: Optional[str] = None
    payment_terms_days: Optional[int] = None
    due_date: Optional[str] = None
    notes: Optional[str] = None
    internal_notes: Optional[str] = None

class InvoiceStatusUpdate(BaseModel):
    status: str  # 'draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'
    paid_amount: Optional[float] = None
    payment_method: Optional[str] = None

class InvoiceResponse(BaseModel):
    id: str
    invoice_number: str
    client_name: str
    client_email: Optional[str] = None
    client_address: Optional[str] = None
    client_phone: Optional[str] = None
    project_name: Optional[str] = None
    project_id: Optional[str] = None
    milestone_id: Optional[str] = None
    subtotal: float
    tax_rate: float
    tax_amount: float
    total: float
    status: str
    issue_date: str
    due_date: Optional[str] = None
    payment_terms: str
    payment_terms_days: int
    notes: Optional[str] = None
    internal_notes: Optional[str] = None
    sent_at: Optional[str] = None
    viewed_at: Optional[str] = None
    paid_at: Optional[str] = None
    paid_amount: Optional[float] = None
    payment_method: Optional[str] = None
    line_items: List[Dict] = []
    created_at: str
    updated_at: str


def get_user_id_from_token(authorization: str) -> Optional[str]:
    """Extract user_id from JWT token"""
    if not authorization or not authorization.startswith('Bearer '):
        return None
    try:
        token = authorization.replace('Bearer ', '')
        import base64
        # Decode JWT payload (second part)
        parts = token.split('.')
        if len(parts) != 3:
            return None
        payload = parts[1]
        # Add padding if needed
        padding = 4 - len(payload) % 4
        if padding != 4:
            payload += '=' * padding
        decoded = base64.urlsafe_b64decode(payload)
        data = json.loads(decoded)
        return data.get('sub')
    except Exception as e:
        logger.error(f"Token decode error: {e}")
        return None


async def supabase_request(method: str, endpoint: str, data: Optional[Dict] = None, params: Optional[Dict] = None) -> Dict:
    """Make authenticated request to Supabase REST API"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
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
        elif method == "DELETE":
            response = await client.delete(url, headers=headers, params=params)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        if response.status_code >= 400:
            logger.error(f"Supabase error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=response.status_code, detail=response.text)
        
        if response.text:
            return response.json()
        return {}


async def get_next_invoice_number(user_id: str) -> str:
    """Get the next invoice number for a user using RPC"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/rpc/get_next_invoice_number",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                    "Content-Type": "application/json"
                },
                json={"p_user_id": user_id, "p_prefix": "INV-"}
            )
            if response.status_code == 200:
                return response.json()
    except Exception as e:
        logger.warning(f"RPC failed, using fallback: {e}")
    
    # Fallback: generate based on timestamp
    from datetime import datetime
    timestamp = datetime.now().strftime("%y%m%d%H%M")
    return f"INV-{timestamp}"


@router.get("")
async def list_invoices(
    authorization: str = Header(None),
    status: Optional[str] = None,
    search: Optional[str] = None
):
    """List all invoices for the authenticated user"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Build query params
        params = {
            "user_id": f"eq.{user_id}",
            "order": "created_at.desc",
            "select": "*"
        }
        
        if status and status != 'all':
            params["status"] = f"eq.{status}"
        
        # Get invoices
        invoices = await supabase_request("GET", "invoices", params=params)
        
        if not isinstance(invoices, list):
            invoices = []
        
        # Get line items for each invoice
        for invoice in invoices:
            try:
                line_items = await supabase_request(
                    "GET", 
                    "invoice_line_items",
                    params={"invoice_id": f"eq.{invoice['id']}", "order": "sort_order.asc"}
                )
                invoice['line_items'] = line_items if isinstance(line_items, list) else []
            except:
                invoice['line_items'] = []
        
        # Calculate stats
        stats = {
            "total_outstanding": sum(i.get('total', 0) for i in invoices if i.get('status') in ['sent', 'viewed', 'overdue']),
            "total_overdue": sum(i.get('total', 0) for i in invoices if i.get('status') == 'overdue'),
            "total_paid_this_month": sum(i.get('paid_amount', 0) or 0 for i in invoices if i.get('status') == 'paid'),
            "draft_count": len([i for i in invoices if i.get('status') == 'draft'])
        }
        
        return {"invoices": invoices, "stats": stats}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing invoices: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{invoice_id}")
async def get_invoice(
    invoice_id: str,
    authorization: str = Header(None)
):
    """Get a specific invoice with line items"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Get invoice
        invoices = await supabase_request(
            "GET",
            "invoices",
            params={"id": f"eq.{invoice_id}", "user_id": f"eq.{user_id}"}
        )
        
        if not invoices or len(invoices) == 0:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        invoice = invoices[0]
        
        # Get line items
        line_items = await supabase_request(
            "GET",
            "invoice_line_items",
            params={"invoice_id": f"eq.{invoice_id}", "order": "sort_order.asc"}
        )
        invoice['line_items'] = line_items if isinstance(line_items, list) else []
        
        # Get activity log
        activity = await supabase_request(
            "GET",
            "invoice_activity_log",
            params={"invoice_id": f"eq.{invoice_id}", "order": "created_at.desc"}
        )
        invoice['activity'] = activity if isinstance(activity, list) else []
        
        return invoice
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting invoice: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def create_invoice(
    data: InvoiceCreate,
    authorization: str = Header(None)
):
    """Create a new invoice"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Get next invoice number
        invoice_number = await get_next_invoice_number(user_id)
        
        # Calculate totals
        subtotal = sum(
            (item.quantity or 1) * (item.unit_price or 0)
            for item in data.line_items
        )
        tax_amount = subtotal * (data.tax_rate / 100) if data.tax_rate else 0
        total = subtotal + tax_amount
        
        # Calculate due date
        if data.due_date:
            due_date = data.due_date
        else:
            due_date = (date.today() + timedelta(days=data.payment_terms_days)).isoformat()
        
        # Create invoice
        invoice_data = {
            "user_id": user_id,
            "invoice_number": invoice_number,
            "project_id": data.project_id,
            "milestone_id": data.milestone_id,
            "client_name": data.client_name,
            "client_email": data.client_email,
            "client_address": data.client_address,
            "client_phone": data.client_phone,
            "project_name": data.project_name,
            "subtotal": subtotal,
            "tax_rate": data.tax_rate,
            "tax_amount": tax_amount,
            "total": total,
            "status": "draft",
            "issue_date": date.today().isoformat(),
            "due_date": due_date,
            "payment_terms": data.payment_terms,
            "payment_terms_days": data.payment_terms_days,
            "notes": data.notes,
            "internal_notes": data.internal_notes
        }
        
        result = await supabase_request("POST", "invoices", data=invoice_data)
        
        if not result or len(result) == 0:
            raise HTTPException(status_code=500, detail="Failed to create invoice")
        
        invoice = result[0]
        
        # Create line items
        line_items = []
        for idx, item in enumerate(data.line_items):
            item_amount = (item.quantity or 1) * (item.unit_price or 0)
            line_item_data = {
                "invoice_id": invoice['id'],
                "description": item.description,
                "quantity": item.quantity or 1,
                "unit_price": item.unit_price,
                "amount": item_amount,
                "sort_order": idx
            }
            item_result = await supabase_request("POST", "invoice_line_items", data=line_item_data)
            if item_result:
                line_items.append(item_result[0])
        
        invoice['line_items'] = line_items
        
        # Log activity
        await supabase_request("POST", "invoice_activity_log", data={
            "invoice_id": invoice['id'],
            "action": "created",
            "actor": user_id,
            "details": {"total": total}
        })
        
        # If milestone_id provided, update milestone status to 'invoiced'
        if data.milestone_id:
            try:
                await supabase_request(
                    "PATCH",
                    "project_milestones",
                    data={
                        "status": "invoiced",
                        "invoiced_at": datetime.now(timezone.utc).isoformat()
                    },
                    params={"id": f"eq.{data.milestone_id}"}
                )
            except Exception as e:
                logger.warning(f"Failed to update milestone status: {e}")
        
        return invoice
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating invoice: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{invoice_id}")
async def update_invoice(
    invoice_id: str,
    data: InvoiceUpdate,
    authorization: str = Header(None)
):
    """Update an existing invoice (only if draft)"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Check if invoice exists and is draft
        invoices = await supabase_request(
            "GET",
            "invoices",
            params={"id": f"eq.{invoice_id}", "user_id": f"eq.{user_id}"}
        )
        
        if not invoices or len(invoices) == 0:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        invoice = invoices[0]
        if invoice['status'] != 'draft':
            raise HTTPException(status_code=400, detail="Can only edit draft invoices")
        
        # Build update data
        update_data = {k: v for k, v in data.model_dump().items() if v is not None and k != 'line_items'}
        
        # Recalculate totals if line items provided
        if data.line_items is not None:
            subtotal = sum(
                (item.quantity or 1) * (item.unit_price or 0)
                for item in data.line_items
            )
            tax_rate = data.tax_rate if data.tax_rate is not None else invoice['tax_rate']
            tax_amount = subtotal * (tax_rate / 100)
            
            update_data['subtotal'] = subtotal
            update_data['tax_amount'] = tax_amount
            update_data['total'] = subtotal + tax_amount
            
            # Delete existing line items and recreate
            await supabase_request(
                "DELETE",
                "invoice_line_items",
                params={"invoice_id": f"eq.{invoice_id}"}
            )
            
            # Create new line items
            for idx, item in enumerate(data.line_items):
                item_amount = (item.quantity or 1) * (item.unit_price or 0)
                await supabase_request("POST", "invoice_line_items", data={
                    "invoice_id": invoice_id,
                    "description": item.description,
                    "quantity": item.quantity or 1,
                    "unit_price": item.unit_price,
                    "amount": item_amount,
                    "sort_order": idx
                })
        
        update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        # Update invoice
        result = await supabase_request(
            "PATCH",
            "invoices",
            data=update_data,
            params={"id": f"eq.{invoice_id}"}
        )
        
        # Log activity
        await supabase_request("POST", "invoice_activity_log", data={
            "invoice_id": invoice_id,
            "action": "updated",
            "actor": user_id,
            "details": {"fields_updated": list(update_data.keys())}
        })
        
        return result[0] if result else {"status": "updated"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating invoice: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{invoice_id}/send")
async def send_invoice(
    invoice_id: str,
    authorization: str = Header(None)
):
    """Mark invoice as sent and send email notification to client"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Get invoice with line items
        invoices = await supabase_request(
            "GET",
            "invoices",
            params={"id": f"eq.{invoice_id}", "user_id": f"eq.{user_id}"}
        )
        
        if not invoices or len(invoices) == 0:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        invoice = invoices[0]
        if invoice['status'] not in ['draft', 'sent']:
            raise HTTPException(status_code=400, detail="Cannot send this invoice")
        
        now = datetime.now(timezone.utc).isoformat()
        
        # Update status
        await supabase_request(
            "PATCH",
            "invoices",
            data={
                "status": "sent",
                "sent_at": now,
                "updated_at": now
            },
            params={"id": f"eq.{invoice_id}"}
        )
        
        # Log activity
        await supabase_request("POST", "invoice_activity_log", data={
            "invoice_id": invoice_id,
            "action": "sent",
            "actor": user_id,
            "details": {"sent_to": invoice.get('client_email')}
        })
        
        email_sent = False
        email_error = None
        
        # Send email if client email is present
        if invoice.get('client_email'):
            try:
                # Get user profile for company name
                profiles = await supabase_request(
                    "GET",
                    "users_profile",
                    params={"id": f"eq.{user_id}"}
                )
                company_name = profiles[0].get('company_name', 'Your Contractor') if profiles else 'Your Contractor'
                
                # Call the email endpoint internally
                email_url = f"{os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')}/api/email/send-invoice"
                
                async with httpx.AsyncClient() as client:
                    email_response = await client.post(
                        email_url,
                        json={
                            "recipient_email": invoice['client_email'],
                            "recipient_name": invoice['client_name'],
                            "invoice_number": invoice['invoice_number'],
                            "project_name": invoice.get('project_name', 'Project'),
                            "milestone_name": "Invoice",
                            "amount": invoice['total'],
                            "due_date": invoice.get('due_date', ''),
                            "company_name": company_name,
                            "payment_terms": invoice.get('payment_terms_days', 30)
                        },
                        timeout=10.0
                    )
                    
                    if email_response.status_code == 200:
                        result = email_response.json()
                        email_sent = result.get('status') == 'success'
                        if not email_sent:
                            email_error = result.get('message')
                    else:
                        email_error = f"Email API returned {email_response.status_code}"
                        
            except Exception as e:
                logger.warning(f"Failed to send invoice email: {e}")
                email_error = str(e)
        
        return {
            "status": "sent", 
            "message": "Invoice marked as sent",
            "email_sent": email_sent,
            "email_error": email_error
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending invoice: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{invoice_id}/mark-paid")
async def mark_invoice_paid(
    invoice_id: str,
    data: InvoiceStatusUpdate,
    authorization: str = Header(None)
):
    """Mark an invoice as paid"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Get invoice
        invoices = await supabase_request(
            "GET",
            "invoices",
            params={"id": f"eq.{invoice_id}", "user_id": f"eq.{user_id}"}
        )
        
        if not invoices or len(invoices) == 0:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        invoice = invoices[0]
        now = datetime.now(timezone.utc).isoformat()
        
        # Update status
        update_data = {
            "status": "paid",
            "paid_at": now,
            "paid_amount": data.paid_amount or invoice['total'],
            "payment_method": data.payment_method,
            "updated_at": now
        }
        
        await supabase_request(
            "PATCH",
            "invoices",
            data=update_data,
            params={"id": f"eq.{invoice_id}"}
        )
        
        # Update linked milestone if exists
        if invoice.get('milestone_id'):
            try:
                await supabase_request(
                    "PATCH",
                    "project_milestones",
                    data={
                        "status": "paid",
                        "paid_at": now
                    },
                    params={"id": f"eq.{invoice['milestone_id']}"}
                )
            except Exception as e:
                logger.warning(f"Failed to update milestone: {e}")
        
        # Log activity
        await supabase_request("POST", "invoice_activity_log", data={
            "invoice_id": invoice_id,
            "action": "paid",
            "actor": user_id,
            "details": {
                "amount": data.paid_amount or invoice['total'],
                "method": data.payment_method
            }
        })
        
        return {"status": "paid", "message": "Invoice marked as paid"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking invoice paid: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{invoice_id}")
async def delete_invoice(
    invoice_id: str,
    authorization: str = Header(None)
):
    """Delete an invoice (only if draft)"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Check if invoice exists and is draft
        invoices = await supabase_request(
            "GET",
            "invoices",
            params={"id": f"eq.{invoice_id}", "user_id": f"eq.{user_id}"}
        )
        
        if not invoices or len(invoices) == 0:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        if invoices[0]['status'] != 'draft':
            raise HTTPException(status_code=400, detail="Can only delete draft invoices")
        
        # Delete line items first (cascade should handle this, but be explicit)
        await supabase_request(
            "DELETE",
            "invoice_line_items",
            params={"invoice_id": f"eq.{invoice_id}"}
        )
        
        # Delete invoice
        await supabase_request(
            "DELETE",
            "invoices",
            params={"id": f"eq.{invoice_id}"}
        )
        
        return {"status": "deleted", "message": "Invoice deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting invoice: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/receivables")
async def get_receivables_stats(
    authorization: str = Header(None)
):
    """Get receivables statistics for dashboard"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Get all non-paid invoices
        invoices = await supabase_request(
            "GET",
            "invoices",
            params={
                "user_id": f"eq.{user_id}",
                "status": "not.eq.draft"
            }
        )
        
        if not isinstance(invoices, list):
            invoices = []
        
        today = date.today()
        
        # Calculate aging buckets
        current = 0  # Not yet due
        days_30 = 0  # 1-30 days overdue
        days_60 = 0  # 31-60 days overdue
        days_90_plus = 0  # 60+ days overdue
        
        for inv in invoices:
            if inv['status'] == 'paid':
                continue
            
            total = inv.get('total', 0)
            due_date_str = inv.get('due_date')
            
            if not due_date_str:
                current += total
                continue
            
            due_date = date.fromisoformat(due_date_str)
            days_overdue = (today - due_date).days
            
            if days_overdue <= 0:
                current += total
            elif days_overdue <= 30:
                days_30 += total
            elif days_overdue <= 60:
                days_60 += total
            else:
                days_90_plus += total
        
        return {
            "total_outstanding": current + days_30 + days_60 + days_90_plus,
            "current": current,
            "overdue_30": days_30,
            "overdue_60": days_60,
            "overdue_90_plus": days_90_plus,
            "total_overdue": days_30 + days_60 + days_90_plus
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting receivables stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
