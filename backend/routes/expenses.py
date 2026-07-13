"""
TradeOS Expenses API Routes
Handles expense CRUD operations
"""
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import httpx
from config import config
import os
import logging
import json

router = APIRouter(prefix="/api/expenses", tags=["expenses"])
logger = logging.getLogger(__name__)


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
    if not config.SUPABASE_URL or not config.SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    headers = {
        "apikey": config.SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {config.SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    url = f"{config.SUPABASE_URL}/rest/v1/{endpoint}"
    
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



@router.get("/categories/list")
async def get_expense_categories():
    """Get list of expense categories with deductibility info"""
    return {
        "categories": [
            {
                "value": key,
                "label": val["label"],
                "deductibility": val["deductibility"]
            }
            for key, val in CATEGORIES.items()
        ],
        "disclaimer": "Estimates only — confirm with your accountant."
    }


@router.get("/summary/monthly")
async def get_monthly_summary(
    authorization: str = Header(None),
    year: Optional[int] = None,
    month: Optional[int] = None
):
    """Get monthly expense summary with deductibility breakdown"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        now = datetime.now()
        target_year = year or now.year
        target_month = month or now.month
        
        # Get expenses for the month
        params = {
            "user_id": f"eq.{user_id}",
            "expense_date": f"gte.{target_year}-{target_month:02d}-01",
            "select": "*",
            "order": "expense_date.desc"
        }
        
        # Add end of month filter
        if target_month == 12:
            next_month_start = f"{target_year + 1}-01-01"
        else:
            next_month_start = f"{target_year}-{target_month + 1:02d}-01"
        
        expenses = await supabase_request("GET", "expenses", params=params)
        
        if not isinstance(expenses, list):
            expenses = []
        
        # Filter to only this month
        month_expenses = [
            e for e in expenses 
            if e.get('expense_date', '') < next_month_start
        ]
        
        # Calculate summaries
        total_expenses = sum(e.get('amount', 0) for e in month_expenses)
        total_tax_paid = sum(e.get('tax_amount', 0) for e in month_expenses)
        
        # Calculate deductible amounts
        total_deductible = 0
        for e in month_expenses:
            deduct_pct = e.get('deductibility_pct', 100) or 100
            if e.get('business_personal') == 'Personal':
                deduct_pct = 0
            total_deductible += e.get('amount', 0) * (deduct_pct / 100)
        
        # By category breakdown
        by_category = {}
        for e in month_expenses:
            cat = e.get('category', 'Other')
            if cat not in by_category:
                by_category[cat] = {"total": 0, "deductible": 0, "count": 0}
            by_category[cat]["total"] += e.get('amount', 0)
            by_category[cat]["count"] += 1
            deduct_pct = e.get('deductibility_pct', 100) or 100
            if e.get('business_personal') == 'Personal':
                deduct_pct = 0
            by_category[cat]["deductible"] += e.get('amount', 0) * (deduct_pct / 100)
        
        return {
            "year": target_year,
            "month": target_month,
            "total_expenses": round(total_expenses, 2),
            "total_deductible": round(total_deductible, 2),
            "total_tax_paid": round(total_tax_paid, 2),
            "expense_count": len(month_expenses),
            "by_category": by_category,
            "disclaimer": "Estimates only — confirm with your accountant."
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting monthly summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary/quarterly")
async def get_quarterly_summary(
    authorization: str = Header(None),
    year: Optional[int] = None,
    quarter: Optional[int] = None
):
    """Get quarterly expense summary with tax projection"""
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        now = datetime.now()
        target_year = year or now.year
        target_quarter = quarter or ((now.month - 1) // 3 + 1)
        
        # Calculate quarter date range
        quarter_starts = {1: "01-01", 2: "04-01", 3: "07-01", 4: "10-01"}
        quarter_ends = {1: "04-01", 2: "07-01", 3: "10-01", 4: f"{target_year + 1}-01-01"}
        
        start_date = f"{target_year}-{quarter_starts[target_quarter]}"
        end_date = quarter_ends[target_quarter] if target_quarter < 4 else f"{target_year + 1}-01-01"
        if target_quarter < 4:
            end_date = f"{target_year}-{end_date}"
        
        params = {
            "user_id": f"eq.{user_id}",
            "expense_date": f"gte.{start_date}",
            "select": "*"
        }
        
        expenses = await supabase_request("GET", "expenses", params=params)
        
        if not isinstance(expenses, list):
            expenses = []
        
        # Filter to only this quarter
        quarter_expenses = [
            e for e in expenses 
            if e.get('expense_date', '') < end_date
        ]
        
        total_expenses = sum(e.get('amount', 0) for e in quarter_expenses)
        total_tax_paid = sum(e.get('tax_amount', 0) for e in quarter_expenses)
        
        total_deductible = 0
        for e in quarter_expenses:
            deduct_pct = e.get('deductibility_pct', 100) or 100
            if e.get('business_personal') == 'Personal':
                deduct_pct = 0
            total_deductible += e.get('amount', 0) * (deduct_pct / 100)
        
        return {
            "year": target_year,
            "quarter": target_quarter,
            "quarter_label": f"Q{target_quarter} {target_year}",
            "start_date": start_date,
            "end_date": end_date,
            "total_expenses": round(total_expenses, 2),
            "total_deductible": round(total_deductible, 2),
            "total_tax_paid": round(total_tax_paid, 2),
            "expense_count": len(quarter_expenses),
            "disclaimer": "Estimates only — confirm with your accountant."
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting quarterly summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))
