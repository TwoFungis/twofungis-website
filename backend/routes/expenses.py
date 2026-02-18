"""
TradeOS Expenses API Routes
Handles expense CRUD operations
"""
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import httpx
import os
import logging
import json

router = APIRouter(prefix="/api/expenses", tags=["expenses"])
logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

# Enhanced contractor expense categories with default deductibility
CATEGORIES = {
    "Materials": {"deductibility": 100, "label": "Materials (COGS)"},
    "Consumables": {"deductibility": 100, "label": "Consumables"},
    "Tools": {"deductibility": 100, "label": "Tools (<$500)"},
    "Equipment": {"deductibility": 100, "label": "Equipment (Capital)"},
    "Vehicle & Fuel": {"deductibility": 100, "label": "Vehicle & Fuel"},
    "Meals & Entertainment": {"deductibility": 50, "label": "Meals & Entertainment"},
    "Subcontractors": {"deductibility": 100, "label": "Subcontractors"},
    "Insurance": {"deductibility": 100, "label": "Insurance"},
    "Office/Admin": {"deductibility": 100, "label": "Office/Admin"},
    "Phone/Internet": {"deductibility": 100, "label": "Phone/Internet"},
    "Travel/Lodging": {"deductibility": 100, "label": "Travel/Lodging"},
    "Training/Certifications": {"deductibility": 100, "label": "Training/Certifications"},
    "Rent/Shop": {"deductibility": 100, "label": "Rent/Shop"},
    "Other": {"deductibility": 100, "label": "Other"}
}

class ExpenseCreate(BaseModel):
    description: str
    category: str = "Other"
    amount: float
    project_name: Optional[str] = None
    project_id: Optional[str] = None
    expense_date: Optional[str] = None
    notes: Optional[str] = None
    vendor: Optional[str] = None
    receipt_url: Optional[str] = None
    tax_amount: Optional[float] = 0
    is_tax_deductible: bool = True
    # New fields for enhanced tracking
    deductibility_pct: Optional[float] = None  # Auto-set based on category if not provided
    business_personal: str = "Business"  # Business or Personal
    payment_method: Optional[str] = None

class ExpenseUpdate(BaseModel):
    description: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    project_name: Optional[str] = None
    expense_date: Optional[str] = None
    notes: Optional[str] = None
    vendor: Optional[str] = None
    receipt_url: Optional[str] = None
    tax_amount: Optional[float] = None
    is_tax_deductible: Optional[bool] = None
    deductibility_pct: Optional[float] = None
    business_personal: Optional[str] = None
    payment_method: Optional[str] = None


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


@router.get("")
async def list_expenses(
    authorization: str = Header(None),
    category: Optional[str] = None,
    project_id: Optional[str] = None
):
    """List all expenses for the authenticated user"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        params = {
            "user_id": f"eq.{user_id}",
            "order": "expense_date.desc,created_at.desc",
            "select": "*"
        }
        
        if category and category != 'all':
            params["category"] = f"eq.{category}"
        
        if project_id:
            params["project_id"] = f"eq.{project_id}"
        
        expenses = await supabase_request("GET", "expenses", params=params)
        
        if not isinstance(expenses, list):
            expenses = []
        
        # Calculate stats
        total = sum(e.get('amount', 0) for e in expenses)
        missing_receipts = len([e for e in expenses if not e.get('receipt_url')])
        tax_deductible = sum(e.get('amount', 0) for e in expenses if e.get('is_tax_deductible', True))
        
        return {
            "expenses": expenses,
            "stats": {
                "total": total,
                "count": len(expenses),
                "missing_receipts": missing_receipts,
                "tax_deductible": tax_deductible
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing expenses: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{expense_id}")
async def get_expense(
    expense_id: str,
    authorization: str = Header(None)
):
    """Get a specific expense"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        expenses = await supabase_request(
            "GET",
            "expenses",
            params={"id": f"eq.{expense_id}", "user_id": f"eq.{user_id}"}
        )
        
        if not expenses or len(expenses) == 0:
            raise HTTPException(status_code=404, detail="Expense not found")
        
        return expenses[0]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting expense: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def create_expense(
    data: ExpenseCreate,
    authorization: str = Header(None)
):
    """Create a new expense"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Get default deductibility based on category
        category = data.category if data.category in CATEGORIES else "Other"
        default_deductibility = CATEGORIES.get(category, {}).get("deductibility", 100)
        
        # If personal expense, set deductibility to 0
        deductibility = 0 if data.business_personal == "Personal" else (data.deductibility_pct or default_deductibility)
        deductible_amount = data.amount * (deductibility / 100) if deductibility else 0
        
        expense_data = {
            "user_id": user_id,
            "description": data.description,
            "category": category,
            "amount": data.amount,
            "project_name": data.project_name,
            "project_id": data.project_id,
            "expense_date": data.expense_date or datetime.now(timezone.utc).date().isoformat(),
            "notes": data.notes,
            "vendor": data.vendor,
            "receipt_url": data.receipt_url,
            "has_receipt": bool(data.receipt_url),
            "tax_amount": data.tax_amount or 0,
            "is_tax_deductible": data.is_tax_deductible,
            "deductibility_pct": deductibility,
            "deductible_amount": deductible_amount,
            "business_personal": data.business_personal,
            "payment_method": data.payment_method
        }
        
        result = await supabase_request("POST", "expenses", data=expense_data)
        
        if not result or len(result) == 0:
            raise HTTPException(status_code=500, detail="Failed to create expense")
        
        return result[0]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating expense: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{expense_id}")
async def update_expense(
    expense_id: str,
    data: ExpenseUpdate,
    authorization: str = Header(None)
):
    """Update an expense"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Verify ownership
        expenses = await supabase_request(
            "GET",
            "expenses",
            params={"id": f"eq.{expense_id}", "user_id": f"eq.{user_id}"}
        )
        
        if not expenses or len(expenses) == 0:
            raise HTTPException(status_code=404, detail="Expense not found")
        
        update_data = {k: v for k, v in data.model_dump().items() if v is not None}
        update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        if 'receipt_url' in update_data:
            update_data['has_receipt'] = bool(update_data['receipt_url'])
        
        result = await supabase_request(
            "PATCH",
            "expenses",
            data=update_data,
            params={"id": f"eq.{expense_id}"}
        )
        
        return result[0] if result else {"status": "updated"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating expense: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{expense_id}")
async def delete_expense(
    expense_id: str,
    authorization: str = Header(None)
):
    """Delete an expense"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Verify ownership
        expenses = await supabase_request(
            "GET",
            "expenses",
            params={"id": f"eq.{expense_id}", "user_id": f"eq.{user_id}"}
        )
        
        if not expenses or len(expenses) == 0:
            raise HTTPException(status_code=404, detail="Expense not found")
        
        await supabase_request(
            "DELETE",
            "expenses",
            params={"id": f"eq.{expense_id}"}
        )
        
        return {"status": "deleted", "message": "Expense deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting expense: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary/tax")
async def get_tax_summary(
    authorization: str = Header(None),
    year: Optional[int] = None
):
    """Get tax summary for expenses"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        params = {
            "user_id": f"eq.{user_id}",
            "select": "*"
        }
        
        expenses = await supabase_request("GET", "expenses", params=params)
        
        if not isinstance(expenses, list):
            expenses = []
        
        # Filter by year if specified
        current_year = year or datetime.now().year
        year_expenses = [
            e for e in expenses 
            if e.get('expense_date', '').startswith(str(current_year))
        ]
        
        # Calculate by category
        by_category = {}
        for e in year_expenses:
            cat = e.get('category', 'other')
            if cat not in by_category:
                by_category[cat] = 0
            by_category[cat] += e.get('amount', 0)
        
        total = sum(e.get('amount', 0) for e in year_expenses)
        tax_deductible = sum(e.get('amount', 0) for e in year_expenses if e.get('is_tax_deductible', True))
        total_tax = sum(e.get('tax_amount', 0) for e in year_expenses)
        
        return {
            "year": current_year,
            "total_expenses": total,
            "tax_deductible": tax_deductible,
            "total_tax_paid": total_tax,
            "by_category": by_category,
            "expense_count": len(year_expenses)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting tax summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))
