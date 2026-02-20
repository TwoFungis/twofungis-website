"""
TradeOS AI Copilot Routes
Context-aware AI assistant for contractors
With Trial/Locked mode enforcement
"""

from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging
import json
import uuid
import base64
from datetime import datetime, timezone
import os
import httpx
from emergentintegrations.llm.chat import LlmChat, UserMessage

from routes.access_control import (
    compute_access_state,
    check_ai_daily_limit
)

router = APIRouter(prefix="/api/ai", tags=["ai-copilot"])
logger = logging.getLogger(__name__)

EMERGENT_LLM_KEY = "sk-emergent-0813c02F97f4c435dF"
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

# Context models
class CopilotContext(BaseModel):
    page: str
    project_id: Optional[str] = None
    region: Optional[str] = None
    trade: Optional[str] = None
    plan_type: Optional[str] = None
    subscription_tier: Optional[str] = None

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
        "Walk me through the app features.",
        "How do I bid on a job competitively?"
    ],
    "/app/projects": [
        "How do I create a profitable project?",
        "What makes a good project setup?",
        "Explain the project workflow.",
        "Help me understand change orders.",
        "What's the typical markup for residential work?"
    ],
    "/app/estimating": [
        "Generate a draft estimate for a kitchen renovation.",
        "What markup should I use for custom work?",
        "How do I add contingency properly?",
        "Explain the estimate builder features.",
        "What's a fair price per square foot for flooring?"
    ],
    "/app/expenses": [
        "What am I missing for writeoffs this month?",
        "How should I categorize materials vs labor?",
        "Explain the tax deduction categories.",
        "Help me track business vs personal expenses.",
        "What can I write off as a contractor?"
    ],
    "/app/invoices": [
        "How do I get paid faster?",
        "What's the best payment terms to use?",
        "Help me create a professional invoice.",
        "Explain the invoice workflow.",
        "How do I handle a client who won't pay?"
    ],
    "/app/milestones": [
        "How do milestone payments work?",
        "When should I invoice a milestone?",
        "Explain milestone approval process.",
        "What's a typical payment schedule for a renovation?"
    ]
}

def get_route_prompts(route: str) -> List[str]:
    """Get suggested prompts for a route"""
    # Match partial routes
    for key, prompts in ROUTE_PROMPTS.items():
        if route.startswith(key):
            return prompts
    return ROUTE_PROMPTS.get("/app/dashboard", [])


def get_user_id_from_token(authorization: str) -> Optional[str]:
    """Extract user_id from JWT token"""
    if not authorization or not authorization.startswith('Bearer '):
        return None
    try:
        token = authorization.replace('Bearer ', '')
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


async def get_user_profile_for_ai(user_id: str) -> Optional[Dict[str, Any]]:
    """Fetch user profile for AI access control"""
    try:
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/users_profile?user_id=eq.{user_id}&select=subscription_tier,grandfathered_active,trial_started_at,trial_ends_at,ai_daily_usage,ai_usage_reset_at",
                headers=headers
            )
            
            if response.status_code == 200:
                profiles = response.json()
                return profiles[0] if profiles else None
    except Exception as e:
        logger.warning(f"Failed to fetch profile for AI access: {e}")
    return None


async def update_ai_usage(user_id: str, needs_reset: bool):
    """Update AI usage counter for locked users"""
    try:
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
        
        now = datetime.now(timezone.utc).isoformat()
        
        if needs_reset:
            # Reset counter and set new reset time
            update_data = {
                "ai_daily_usage": 1,
                "ai_usage_reset_at": now
            }
        else:
            # Use RPC for atomic increment
            async with httpx.AsyncClient(timeout=5.0) as client:
                # Simple approach: fetch, increment, update
                response = await client.get(
                    f"{SUPABASE_URL}/rest/v1/users_profile?user_id=eq.{user_id}&select=ai_daily_usage",
                    headers=headers
                )
                if response.status_code == 200:
                    profiles = response.json()
                    current = profiles[0].get('ai_daily_usage', 0) or 0 if profiles else 0
                    update_data = {"ai_daily_usage": current + 1}
                else:
                    update_data = {"ai_daily_usage": 1}
        
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.patch(
                f"{SUPABASE_URL}/rest/v1/users_profile?user_id=eq.{user_id}",
                headers=headers,
                json=update_data
            )
            logger.info(f"Updated AI usage for user {user_id}: {update_data}")
    except Exception as e:
        logger.error(f"Failed to update AI usage for user {user_id}: {e}")


async def fetch_project_context_pack(project_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetch a lightweight project context pack for the AI.
    Single query, minimal data, fail-fast with timeout.
    Returns None on any failure - copilot continues in General Mode.
    """
    import httpx
    
    # Field size caps
    MAX_NOTES_LENGTH = 1500
    MAX_FIELD_LENGTH = 500
    TIMEOUT_SECONDS = 3.0  # Fail fast - don't block AI reply
    
    def truncate(value: Any, max_len: int) -> Optional[str]:
        """Safely truncate a field value"""
        if value is None:
            return None
        s = str(value)
        if len(s) > max_len:
            return s[:max_len] + "..."
        return s
    
    try:
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/projects?id=eq.{project_id}&select=name,client_gc,status,notes,contract_value,region",
                headers=headers
            )
            
            if response.status_code != 200:
                logger.warning(f"Copilot context fetch failed for project_id={project_id} reason=HTTP {response.status_code}")
                return None
            
            data = response.json()
            if not data:
                logger.warning(f"Copilot context fetch failed for project_id={project_id} reason=Project not found")
                return None
            
            project = data[0]
            
            # Return context with capped field sizes
            return {
                "project_name": truncate(project.get("name"), MAX_FIELD_LENGTH),
                "client_name": truncate(project.get("client_gc"), MAX_FIELD_LENGTH),
                "status": truncate(project.get("status"), MAX_FIELD_LENGTH),
                "notes": truncate(project.get("notes"), MAX_NOTES_LENGTH),
                "contract_value": project.get("contract_value"),  # Numeric, no truncation
                "region": truncate(project.get("region"), MAX_FIELD_LENGTH)
            }
            
    except httpx.TimeoutException:
        logger.warning(f"Copilot context fetch failed for project_id={project_id} reason=Timeout after {TIMEOUT_SECONDS}s")
        return None
    except httpx.ConnectError as e:
        logger.warning(f"Copilot context fetch failed for project_id={project_id} reason=Connection error: {e}")
        return None
    except Exception as e:
        logger.warning(f"Copilot context fetch failed for project_id={project_id} reason={type(e).__name__}: {e}")
        return None

def build_system_prompt(context: CopilotContext, mode: str, project_context: Optional[Dict[str, Any]] = None) -> str:
    """Build context-aware system prompt"""
    
    base_prompt = """You are the TradeOS AI Copilot powered by GPT-5.2.

You are both:
1) A general-purpose assistant capable of answering any reasonable user question (construction, business, writing, planning, life admin, troubleshooting, learning, etc.)
2) A TradeOS-aware assistant that helps users navigate invoices, estimates, projects, milestones, expenses, and settings within the app.

You are NOT restricted to only app-related questions.

BEHAVIOR RULES:
- If the user asks about TradeOS features or their business data, assist using available context.
- If the user asks general questions unrelated to the app, respond normally like a capable GPT assistant.
- Never claim to access data you do not have.
- If specific invoice/project/client details are required and not provided, ask for clarification.
- Keep responses practical and field-friendly.
- Default to concise answers unless the user requests deeper detail.
- For high-risk medical or legal topics, provide informational guidance and recommend consulting a qualified professional.
- Never fabricate TradeOS features that do not exist.
- Use bullet points for steps and lists.
- Add disclaimers for financial/tax advice: "Estimates only. Confirm with your accountant."

Your goal is to increase user productivity and keep them operating efficiently in the field.

USER CONTEXT:
"""
    
    # Add user context
    if context.trade:
        base_prompt += f"- Trade: {context.trade}\n"
    if context.region:
        base_prompt += f"- Region: {context.region}\n"
    if context.subscription_tier:
        base_prompt += f"- Plan: {context.subscription_tier}\n"
    base_prompt += f"- Current Page: {context.page}\n"
    
    # Add project context if available (TRADEOS_CONTEXT block)
    if project_context:
        base_prompt += """
TRADEOS_CONTEXT (READ-ONLY - Use these exact values when answering about this project):
"""
        if project_context.get("project_name"):
            base_prompt += f"- Project Name: {project_context['project_name']}\n"
        if project_context.get("client_name"):
            base_prompt += f"- Client: {project_context['client_name']}\n"
        if project_context.get("status"):
            base_prompt += f"- Status: {project_context['status']}\n"
        if project_context.get("contract_value"):
            base_prompt += f"- Contract Value: ${float(project_context['contract_value']):,.2f}\n"
        if project_context.get("region"):
            base_prompt += f"- Project Region: {project_context['region']}\n"
        if project_context.get("notes"):
            base_prompt += f"- Notes: {project_context['notes'][:200]}...\n" if len(project_context.get("notes", "")) > 200 else f"- Notes: {project_context['notes']}\n"
        base_prompt += "\nUse this project data when the user asks about 'this project' or references the current project.\n"
    
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
async def copilot_chat(request: CopilotRequest, authorization: str = Header(None)):
    """
    Main Copilot endpoint - context-aware AI assistant
    With Trial/Locked mode enforcement
    """
    try:
        # Get user_id for access control (optional - falls back to tier check)
        user_id = get_user_id_from_token(authorization) if authorization else None
        profile = None
        access_state = "ACTIVE"  # Default for unauthenticated/missing profile
        is_locked = False
        ai_needs_reset = False
        
        # Check access control if we have a user
        if user_id:
            profile = await get_user_profile_for_ai(user_id)
            if profile:
                access_info = compute_access_state(profile)
                access_state = access_info.state
                is_locked = access_state == "LOCKED"
                
                # Check AI daily limit for locked users
                if is_locked:
                    can_use, error_msg, ai_needs_reset = check_ai_daily_limit(profile)
                    if not can_use:
                        return CopilotResponse(
                            assistant_message=f"**{error_msg}**\n\nYou've reached your daily AI limit. Upgrade to PRO or Elite for unlimited AI assistance.\n\nGo to **Settings > Subscription** to upgrade.",
                            action_suggestions=[
                                ActionSuggestion(label="Upgrade Now", action="navigate", route="/app/settings")
                            ],
                            mode="restricted"
                        )
        
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
        
        # Fetch project context if project_id is provided (fail-safe: never blocks AI reply)
        # LOCKED mode: No project context injection (General Mode only)
        project_context = None
        if request.context.project_id and not is_locked:
            try:
                project_context = await fetch_project_context_pack(request.context.project_id)
                if project_context:
                    logger.info(f"Copilot context attached: project_id={request.context.project_id}")
            except Exception as e:
                # Extra safety net - should never reach here but ensures AI always replies
                logger.error(f"Copilot context fetch unexpected error for project_id={request.context.project_id} reason={e}")
                project_context = None
        elif is_locked and request.context.project_id:
            logger.info(f"Copilot skipping project context for LOCKED user: project_id={request.context.project_id}")
        
        # Build system prompt with context (or None for General Mode)
        system_prompt = build_system_prompt(request.context, mode, project_context)
        
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
        
        # Update AI usage for locked users after successful response
        if is_locked and user_id:
            await update_ai_usage(user_id, ai_needs_reset)
        
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
    
    if mode == "estimate" and context.page.startswith("/app/estimating"):
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
            "route": request.context.page,
            "project_id": request.context.project_id,
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
