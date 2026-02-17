from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List
import os
import base64
import logging
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

# Import LLM chat for receipt scanning
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bookkeeping", tags=["Bookkeeping"])

# Get the Emergent LLM key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Storage limits by subscription tier (in bytes)
STORAGE_LIMITS = {
    "trial": 100 * 1024 * 1024,   # 100MB
    "pro": 500 * 1024 * 1024,     # 500MB
    "elite": 2 * 1024 * 1024 * 1024  # 2GB
}

# Expense categories
EXPENSE_CATEGORIES = [
    "Materials",
    "Labor", 
    "Equipment",
    "Vehicle/Fuel",
    "Tools",
    "Office",
    "Subcontractors",
    "Insurance",
    "Professional Fees",
    "Meals & Entertainment",
    "Travel",
    "Utilities",
    "Rent",
    "Other"
]

# Tax types by region
TAX_TYPES = {
    "CA": ["HST", "GST", "PST", "GST+PST", "QST"],
    "US": ["Sales Tax", "State Tax", "None"]
}

# Response models
class ExtractedExpense(BaseModel):
    vendor_name: Optional[str] = None
    vendor_address: Optional[str] = None
    receipt_date: Optional[str] = None
    subtotal: Optional[float] = None
    tax_amount: Optional[float] = None
    tax_type: Optional[str] = None
    tax_rate: Optional[float] = None
    total_amount: Optional[float] = None
    currency: Optional[str] = "CAD"
    category: Optional[str] = "Other"
    description: Optional[str] = None
    line_items: Optional[List[dict]] = []
    payment_method: Optional[str] = None
    confidence: Optional[float] = 0
    raw_text: Optional[str] = None

class ReceiptScanResponse(BaseModel):
    success: bool
    expense: Optional[ExtractedExpense] = None
    error: Optional[str] = None

class ExpenseCategory(BaseModel):
    name: str
    description: str

class StorageLimitResponse(BaseModel):
    tier: str
    limit_bytes: int
    limit_display: str
    used_bytes: int
    used_display: str
    remaining_bytes: int
    percent_used: float


# Receipt scanning prompt
RECEIPT_SCAN_PROMPT = """Analyze this receipt/invoice image and extract the following information in JSON format:

{
  "vendor_name": "Business name on the receipt",
  "vendor_address": "Full address if visible",
  "receipt_date": "Date in YYYY-MM-DD format",
  "subtotal": numeric value before tax,
  "tax_amount": numeric tax amount,
  "tax_type": "HST", "GST", "PST", "Sales Tax", or "None",
  "tax_rate": numeric percentage (e.g., 13 for 13%),
  "total_amount": numeric final total,
  "currency": "CAD" or "USD",
  "category": one of ["Materials", "Labor", "Equipment", "Vehicle/Fuel", "Tools", "Office", "Subcontractors", "Insurance", "Professional Fees", "Meals & Entertainment", "Travel", "Utilities", "Rent", "Other"],
  "description": "Brief description of the purchase",
  "line_items": [{"item": "name", "qty": number, "price": number}],
  "payment_method": "Cash", "Credit Card", "Debit", "Check", "E-Transfer", or "Other",
  "confidence": 0-100 how confident you are in the extraction
}

Important:
- Return ONLY valid JSON, no markdown formatting
- Use null for any fields you cannot determine
- For Canadian receipts, identify HST (13% in Ontario), GST (5%), PST (varies by province)
- For US receipts, identify Sales Tax rates
- Categorize based on the items purchased (e.g., lumber = Materials, gas = Vehicle/Fuel)
- If the image is unclear or not a receipt, set confidence to 0"""


@router.get("/categories")
async def get_expense_categories():
    """Get list of expense categories"""
    return {
        "categories": EXPENSE_CATEGORIES,
        "tax_types": TAX_TYPES
    }


@router.get("/storage-limit/{tier}")
async def get_storage_limit(tier: str):
    """Get storage limit for a subscription tier"""
    tier_lower = tier.lower()
    if tier_lower not in STORAGE_LIMITS:
        tier_lower = "trial"
    
    limit = STORAGE_LIMITS[tier_lower]
    
    def format_bytes(b):
        if b >= 1024 * 1024 * 1024:
            return f"{b / (1024*1024*1024):.1f} GB"
        return f"{b / (1024*1024):.0f} MB"
    
    return StorageLimitResponse(
        tier=tier_lower,
        limit_bytes=limit,
        limit_display=format_bytes(limit),
        used_bytes=0,  # Would be fetched from database
        used_display="0 MB",
        remaining_bytes=limit,
        percent_used=0
    )


@router.post("/scan-receipt", response_model=ReceiptScanResponse)
async def scan_receipt(
    file: UploadFile = File(...),
    region: str = Form(default="CA")
):
    """
    Scan a receipt image using AI and extract expense data.
    Supports JPEG, PNG, WEBP images.
    """
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: JPEG, PNG, WEBP. Got: {file.content_type}"
        )
    
    # Check file size (max 10MB)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")
    
    # Check if LLM key is available
    if not EMERGENT_LLM_KEY:
        raise HTTPException(
            status_code=500, 
            detail="Receipt scanning is not configured. Please contact support."
        )
    
    try:
        # Convert image to base64
        image_base64 = base64.b64encode(contents).decode('utf-8')
        
        # Initialize chat with GPT-4 Vision
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"receipt_scan_{datetime.now(timezone.utc).timestamp()}",
            system_message="You are an expert at reading receipts and invoices. Extract information accurately and return valid JSON only."
        ).with_model("openai", "gpt-4o")
        
        # Create image content
        image_content = ImageContent(image_base64=image_base64)
        
        # Create message with image
        user_message = UserMessage(
            text=RECEIPT_SCAN_PROMPT,
            file_contents=[image_content]
        )
        
        # Send to AI and get response
        response = await chat.send_message(user_message)
        
        # Parse the JSON response
        import json
        
        # Clean up response (remove markdown code blocks if present)
        response_text = response.strip()
        if response_text.startswith("```"):
            # Remove markdown code block
            lines = response_text.split('\n')
            response_text = '\n'.join(lines[1:-1] if lines[-1] == '```' else lines[1:])
        
        try:
            extracted_data = json.loads(response_text)
        except json.JSONDecodeError:
            # Try to find JSON in the response
            import re
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                extracted_data = json.loads(json_match.group())
            else:
                logger.error(f"Failed to parse AI response: {response_text}")
                return ReceiptScanResponse(
                    success=False,
                    error="Could not parse receipt data. Please try again or enter manually."
                )
        
        # Build expense object
        expense = ExtractedExpense(
            vendor_name=extracted_data.get("vendor_name"),
            vendor_address=extracted_data.get("vendor_address"),
            receipt_date=extracted_data.get("receipt_date"),
            subtotal=extracted_data.get("subtotal"),
            tax_amount=extracted_data.get("tax_amount"),
            tax_type=extracted_data.get("tax_type"),
            tax_rate=extracted_data.get("tax_rate"),
            total_amount=extracted_data.get("total_amount"),
            currency=extracted_data.get("currency", "CAD" if region == "CA" else "USD"),
            category=extracted_data.get("category", "Other"),
            description=extracted_data.get("description"),
            line_items=extracted_data.get("line_items", []),
            payment_method=extracted_data.get("payment_method"),
            confidence=extracted_data.get("confidence", 50),
            raw_text=response_text[:500] if len(response_text) > 500 else response_text
        )
        
        return ReceiptScanResponse(
            success=True,
            expense=expense
        )
        
    except Exception as e:
        logger.error(f"Error scanning receipt: {str(e)}")
        return ReceiptScanResponse(
            success=False,
            error=f"Failed to scan receipt: {str(e)}"
        )


@router.post("/test-scan")
async def test_scan():
    """Test endpoint to verify receipt scanning is configured"""
    if not EMERGENT_LLM_KEY:
        return {
            "configured": False,
            "message": "EMERGENT_LLM_KEY not found in environment"
        }
    
    return {
        "configured": True,
        "message": "Receipt scanning is ready",
        "model": "gpt-4o",
        "categories": EXPENSE_CATEGORIES
    }
