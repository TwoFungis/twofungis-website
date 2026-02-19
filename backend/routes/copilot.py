"""
TradeOS AI Copilot Routes
Context-aware AI assistant for contractors
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging
import json
import uuid
from datetime import datetime, timezone
import os
from emergentintegrations.llm.chat import LlmChat, UserMessage

router = APIRouter(prefix="/api/ai", tags=["ai-copilot"])
logger = logging.getLogger(__name__)

EMERGENT_LLM_KEY = "sk-emergent-0813c02F97f4c435dF"
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

# Context models
class CopilotContext(BaseModel):
    route: str
    project_id: Optional[str] = None
    quote_id: Optional[str] = None
    region: Optional[str] = None
    trade: Optional[str] = None
    plan_type: Optional[str] = None
    subscription_tier: Optional[str] = None
    computed: Optional[Dict[str, Any]] = None

class CopilotRequest(BaseModel):
    message: str
    context: CopilotContext
    mode: Optional[str] = "chat"  # chat, estimate, risk

class ActionSuggestion(BaseModel):
    label: str
    action: str
    route: Optional[str] = None

class EstimateLineItem(BaseModel):
    name: str
    unit: str
    qty: float
    unit_cost: float
    labor_hours: Optional[float] = 0
    notes: Optional[str] = ""

class StructuredEstimate(BaseModel):
    estimate_title: str
    line_items: List[EstimateLineItem]
    recommended_markup_pct: int
    recommended_contingency_pct: int
    risk_flags: List[str]

class CopilotResponse(BaseModel):
    assistant_message: str
    action_suggestions: List[ActionSuggestion]
    structured_output: Optional[Dict[str, Any]] = None
    mode: str

# Suggested prompts based on route
ROUTE_PROMPTS = {
    "/app/dashboard": [
        "What should I do next to get paid faster?",
        "Show me projects with margin concerns.",
        "How do I improve my average margin?",
        "What expenses am I missing for tax writeoffs?",
        "Walk me through the app features."
    ],
    "/app/projects": [
        "How do I create a profitable project?",
        "What makes a good project setup?",
        "Explain the project workflow.",
        "Help me understand change orders."
    ],
    "/app/estimating": [
        "Generate a draft estimate for a kitchen renovation.",
        "What markup should I use for custom work?",
        "How do I add contingency properly?",
        "Explain the estimate builder features."
    ],
    "/app/expenses": [
        "What am I missing for writeoffs this month?",
        "How should I categorize materials vs labor?",
        "Explain the tax deduction categories.",
        "Help me track business vs personal expenses."
    ],
    "/app/invoices": [
        "How do I get paid faster?",
        "What's the best payment terms to use?",
        "Help me create a professional invoice.",
        "Explain the invoice workflow."
    ],
    "/app/milestones": [
        "How do milestone payments work?",
        "When should I invoice a milestone?",
        "Explain milestone approval process."
    ]
}

def get_route_prompts(route: str) -> List[str]:
    """Get suggested prompts for a route"""
    # Match partial routes
    for key, prompts in ROUTE_PROMPTS.items():
        if route.startswith(key):
            return prompts
    return ROUTE_PROMPTS.get("/app/dashboard", [])

def build_system_prompt(context: CopilotContext, mode: str) -> str:
    """Build context-aware system prompt"""
    
    base_prompt = """You are TradeOS Copilot, an AI assistant built specifically for contractors and tradespeople. 
You help users navigate the TradeOS app, understand their financials, and make better business decisions.

CRITICAL RULES:
1. NEVER invent or hallucinate numbers. Only use data provided in the context.
2. If you don't have data, say "I don't have enough data yet—add [specific data] and I'll calculate it."
3. Keep responses concise and actionable.
4. Use bullet points for steps and lists.
5. Reference specific TradeOS features by name.
6. Add disclaimers for financial/tax advice: "Estimates only. Confirm with your accountant."

USER CONTEXT:
"""
    
    # Add user context
    if context.trade:
        base_prompt += f"- Trade: {context.trade}\n"
    if context.region:
        base_prompt += f"- Region: {context.region}\n"
    if context.subscription_tier:
        base_prompt += f"- Plan: {context.subscription_tier}\n"
    base_prompt += f"- Current Page: {context.route}\n"
    
    # Add computed data if available
    if context.computed:
        base_prompt += "\nFINANCIAL DATA (USE THESE EXACT NUMBERS):\n"
        for key, value in context.computed.items():
            if value is not None:
                base_prompt += f"- {key}: {value}\n"
    
    # Mode-specific instructions
    if mode == "estimate":
        base_prompt += """
MODE: ESTIMATE GENERATION
You must return a structured estimate in STRICT JSON format:
{
  "estimate_title": "Project name estimate",
  "line_items": [
    { "name": "scope item", "unit": "SF/EA/LF/HR/LS", "qty": number, "unit_cost": number, "labor_hours": number, "notes": "brief note" }
  ],
  "recommended_markup_pct": number (15-25 typical),
  "recommended_contingency_pct": number (5-15 typical),
  "risk_flags": ["potential risks or concerns"]
}
Generate 8-15 realistic line items. Use industry-standard pricing for the region and finish level specified.
"""
    elif mode == "risk":
        base_prompt += """
MODE: RISK EXPLANATION
Explain margin warnings and risk factors clearly. For each issue:
1. What triggered the warning
2. Why it matters for profitability
3. Specific actions to fix it (increase X, add Y, adjust Z)
Use the exact numbers from the context.
"""
    else:
        base_prompt += """
MODE: APP GUIDE / GENERAL HELP
Help users navigate TradeOS and understand features. When giving instructions:
1. Be specific about where to click
2. Use numbered steps
3. Reference actual TradeOS page names
4. Don't make up features that don't exist
"""
    
    return base_prompt

@router.post("/copilot", response_model=CopilotResponse)
async def copilot_chat(request: CopilotRequest):
    """
    Main Copilot endpoint - context-aware AI assistant
    """
    try:
        # Determine mode from message content or explicit mode
        mode = request.mode
        message_lower = request.message.lower()
        
        if "estimate" in message_lower and ("generate" in message_lower or "draft" in message_lower or "create" in message_lower):
            mode = "estimate"
        elif any(word in message_lower for word in ["warning", "risk", "margin", "why is", "what's causing"]):
            mode = "risk"
        
        # Check plan restrictions
        tier = (request.context.subscription_tier or "").lower()
        is_elite = tier in ["elite", "lifetime", "founding_lifetime", "lifetime_elite"]
        
        if mode in ["estimate", "risk"] and not is_elite:
            return CopilotResponse(
                assistant_message="**Upgrade Required**\n\nAI Estimate Generation and Risk Analysis are Elite features. Upgrade to Elite to unlock:\n- Draft estimate generation\n- Detailed risk explanations\n- Advanced margin insights\n\nGo to **Settings > Subscription** to upgrade.",
                action_suggestions=[
                    ActionSuggestion(label="View Plans", action="navigate", route="/app/settings")
                ],
                mode="restricted"
            )
        
        # Build system prompt with context
        system_prompt = build_system_prompt(request.context, mode)
        
        # Create LLM chat instance
        session_id = str(uuid.uuid4())
        llm = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=system_prompt
        ).with_model("openai", "gpt-5.2")
        
        # Send message
        user_msg = UserMessage(text=request.message)
        response_text = await llm.send_message(user_msg)
        
        # Parse structured output for estimate mode
        structured_output = None
        if mode == "estimate":
            try:
                # Try to extract JSON from response
                json_start = response_text.find('{')
                json_end = response_text.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    json_str = response_text[json_start:json_end]
                    structured_output = json.loads(json_str)
                    # Clean response to just acknowledgment
                    response_text = "I've generated a draft estimate based on your specifications. Review the line items below and adjust as needed.\n\n**Disclaimer:** These are estimates only. Confirm pricing with your suppliers and adjust for your specific market conditions."
            except json.JSONDecodeError:
                logger.warning("Could not parse estimate JSON from response")
        
        # Generate action suggestions based on mode and context
        action_suggestions = generate_action_suggestions(request.context, mode, response_text)
        
        # Log interaction (async would be better in production)
        await log_copilot_interaction(request, response_text, mode)
        
        return CopilotResponse(
            assistant_message=response_text,
            action_suggestions=action_suggestions,
            structured_output=structured_output,
            mode=mode
        )
        
    except Exception as e:
        logger.error(f"Copilot error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/copilot/prompts")
async def get_suggested_prompts(route: str):
    """Get suggested prompts for a specific route"""
    prompts = get_route_prompts(route)
    return {"prompts": prompts, "route": route}

def generate_action_suggestions(context: CopilotContext, mode: str, response: str) -> List[ActionSuggestion]:
    """Generate contextual action suggestions"""
    suggestions = []
    
    if mode == "estimate" and context.route.startswith("/app/estimating"):
        suggestions.append(ActionSuggestion(
            label="Open Estimate Builder",
            action="navigate",
            route="/app/estimating?new=true"
        ))
    
    if "project" in response.lower() and not context.project_id:
        suggestions.append(ActionSuggestion(
            label="View Projects",
            action="navigate",
            route="/app/projects"
        ))
    
    if "expense" in response.lower():
        suggestions.append(ActionSuggestion(
            label="Add Expense",
            action="navigate",
            route="/app/expenses"
        ))
    
    if "invoice" in response.lower():
        suggestions.append(ActionSuggestion(
            label="Create Invoice",
            action="navigate",
            route="/app/invoices?new=true"
        ))
    
    # Default suggestions if none generated
    if not suggestions:
        suggestions.append(ActionSuggestion(
            label="Go to Dashboard",
            action="navigate",
            route="/app/dashboard"
        ))
    
    return suggestions[:3]  # Limit to 3 suggestions

async def log_copilot_interaction(request: CopilotRequest, response: str, mode: str):
    """Log Copilot interaction for analytics"""
    try:
        import httpx
        
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
        
        log_data = {
            "route": request.context.route,
            "project_id": request.context.project_id,
            "quote_id": request.context.quote_id,
            "user_message": request.message[:500],  # Truncate long messages
            "ai_response": response[:1000],  # Truncate long responses
            "mode": mode,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{SUPABASE_URL}/rest/v1/ai_logs",
                headers=headers,
                json=log_data,
                timeout=5.0
            )
    except Exception as e:
        # Don't fail the request if logging fails
        logger.warning(f"Failed to log Copilot interaction: {e}")

# Project context endpoint for fetching computed data
@router.get("/copilot/project-context/{project_id}")
async def get_project_context(project_id: str, request: Request):
    """Fetch computed project context for Copilot"""
    try:
        import httpx
        
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            # Fetch project
            proj_resp = await client.get(
                f"{SUPABASE_URL}/rest/v1/projects?id=eq.{project_id}&select=*",
                headers=headers
            )
            
            if proj_resp.status_code != 200 or not proj_resp.json():
                raise HTTPException(status_code=404, detail="Project not found")
            
            project = proj_resp.json()[0]
            
            # Fetch change orders
            co_resp = await client.get(
                f"{SUPABASE_URL}/rest/v1/change_orders?project_id=eq.{project_id}&select=*",
                headers=headers
            )
            change_orders = co_resp.json() if co_resp.status_code == 200 else []
            
            # Fetch expenses
            exp_resp = await client.get(
                f"{SUPABASE_URL}/rest/v1/expenses?project_name=eq.{project.get('name', '')}&select=*",
                headers=headers
            )
            expenses = exp_resp.json() if exp_resp.status_code == 200 else []
            
            # Compute totals
            original_contract = float(project.get('contract_value') or 0)
            approved_cos = sum(float(co.get('total_value') or 0) for co in change_orders if co.get('status') == 'approved')
            total_revenue = original_contract + approved_cos
            total_expenses = sum(float(e.get('amount') or 0) for e in expenses)
            labor_expenses = sum(float(e.get('amount') or 0) for e in expenses if e.get('category') in ['labor', 'Subcontractors'])
            
            percent_complete = float(project.get('percent_complete') or 0)
            forecast_cost = (total_expenses / (percent_complete / 100)) if percent_complete > 0 else total_expenses
            projected_profit = total_revenue - forecast_cost
            projected_margin = (projected_profit / total_revenue * 100) if total_revenue > 0 else 0
            
            return {
                "project_name": project.get('name'),
                "original_contract": f"${original_contract:,.2f}",
                "approved_co_total": f"${approved_cos:,.2f}",
                "total_revenue": f"${total_revenue:,.2f}",
                "total_expenses": f"${total_expenses:,.2f}",
                "labor_total": f"${labor_expenses:,.2f}",
                "percent_complete": f"{percent_complete}%",
                "forecast_cost": f"${forecast_cost:,.2f}",
                "projected_profit": f"${projected_profit:,.2f}",
                "projected_margin": f"{projected_margin:.1f}%",
                "change_order_count": len(change_orders),
                "expense_count": len(expenses)
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching project context: {e}")
        raise HTTPException(status_code=500, detail=str(e))
