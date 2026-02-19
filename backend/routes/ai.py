"""
TradeOS AI Routes
Handles AI-powered features like estimate generation
"""

from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from typing import Optional, List
import logging
import json
from emergentintegrations.llm.chat import chat, Message

router = APIRouter(prefix="/api/ai", tags=["ai"])
logger = logging.getLogger(__name__)

EMERGENT_LLM_KEY = "sk-emergent-0813c02F97f4c435dF"

class EstimateRequest(BaseModel):
    project_type: str
    approx_size: str
    finish_level: str = "Custom"
    region: Optional[str] = ""

class LineItem(BaseModel):
    scope_item: str
    description: str
    qty: float
    unit: str
    unit_price: float

class EstimateResponse(BaseModel):
    line_items: List[LineItem]
    suggested_markup: int
    suggested_contingency: int
    notes: Optional[str] = None

@router.post("/generate-estimate", response_model=EstimateResponse)
async def generate_estimate(request: EstimateRequest):
    """
    Generate a draft estimate using AI based on project parameters.
    Uses GPT-5.2 to create structured line items.
    """
    try:
        # Build the prompt for construction estimate generation
        prompt = f"""You are a construction estimating expert. Generate a detailed line-item estimate for the following project:

Project Type: {request.project_type}
Approximate Size: {request.approx_size} square feet
Finish Level: {request.finish_level}
Region: {request.region or "North America"}

Generate a realistic estimate with the following JSON structure:
{{
    "line_items": [
        {{
            "scope_item": "Category name (e.g., 'Demolition', 'Framing', 'Electrical')",
            "description": "Brief description of the work",
            "qty": numeric_quantity,
            "unit": "Unit type (SF, EA, LF, HR, LS)",
            "unit_price": numeric_price_in_dollars
        }}
    ],
    "suggested_markup": percentage_number_only (e.g., 20 for 20%),
    "suggested_contingency": percentage_number_only (e.g., 10 for 10%),
    "notes": "Optional notes about the estimate"
}}

Guidelines:
- Include 8-15 line items covering major scopes of work
- Use realistic pricing for the {request.finish_level} finish level
- Include labor and materials where appropriate
- Consider regional pricing adjustments for {request.region or "average North American"} markets
- For {request.finish_level} finish: {"budget-friendly materials" if request.finish_level == "Spec" else "mid-range quality materials and finishes" if request.finish_level == "Custom" else "premium materials and custom work"}

Return ONLY valid JSON, no additional text."""

        # Call GPT-5.2 via emergentintegrations
        messages = [
            Message(role="system", content="You are a professional construction estimator. Always respond with valid JSON only."),
            Message(role="user", content=prompt)
        ]
        
        response = await chat(
            api_key=EMERGENT_LLM_KEY,
            model="gpt-5.2",
            messages=messages
        )
        
        # Parse the response
        response_text = response.content.strip()
        
        # Clean up response if it has markdown code blocks
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
            response_text = response_text.strip()
        
        estimate_data = json.loads(response_text)
        
        return EstimateResponse(
            line_items=[LineItem(**item) for item in estimate_data.get("line_items", [])],
            suggested_markup=estimate_data.get("suggested_markup", 20),
            suggested_contingency=estimate_data.get("suggested_contingency", 10),
            notes=estimate_data.get("notes")
        )
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI response: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")
    except Exception as e:
        logger.error(f"Error generating estimate: {e}")
        raise HTTPException(status_code=500, detail=str(e))
