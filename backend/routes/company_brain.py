"""
Company Brain - Foundation Architecture
========================================
Specification 1.2 - The permanent architecture for Company Brain.

This is NOT a GPT implementation.
This is NOT a chatbot implementation.
This is the foundation that every future intelligent feature will use.

ONE BRAIN RULE:
- There is only ONE Company Brain per company
- Projects, CRM, Financial, etc. NEVER contain their own AI
- Every AI interaction routes through ONE Company Brain
- Company Brain calls modules; modules NEVER call Company Brain

ACTION PIPELINE:
Intent → Plan → Permission Check → Execute → Activity Log → Result → Undo Window
"""

from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from enum import Enum
from datetime import datetime, timezone
import os
import logging
import httpx
import json

router = APIRouter(prefix="/api/brain", tags=["company-brain"])
logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')


# =====================================================
# ENUMS - Context Types & Action States
# =====================================================

class ContextType(str, Enum):
    """
    Context types for conversation threads.
    The Company Brain maintains one continuous company conversation
    while automatically creating context threads.
    """
    GENERAL = "general"           # General company conversation
    PROJECT = "project"           # Project-specific context
    OPPORTUNITY = "opportunity"   # Opportunity/Tender context
    ESTIMATE = "estimate"         # Estimate context
    FINANCIAL = "financial"       # Financial/Invoices context
    CRM = "crm"                   # Client/Contact context
    PRODUCTION = "production"     # Production Library context
    DOCUMENTS = "documents"       # Document Vault context
    REPORTS = "reports"           # Reports context
    SETTINGS = "settings"         # Settings context


class ActionState(str, Enum):
    """
    Action pipeline states.
    Every Company Brain action follows this lifecycle.
    """
    INTENT = "intent"             # User expressed intent
    PLANNING = "planning"         # Brain is planning action
    PENDING_PERMISSION = "pending_permission"  # Awaiting user approval
    EXECUTING = "executing"       # Action in progress
    COMPLETED = "completed"       # Action finished successfully
    FAILED = "failed"             # Action failed
    CANCELLED = "cancelled"       # User cancelled
    UNDONE = "undone"             # Action was undone


class ActionCategory(str, Enum):
    """Categories of actions the Company Brain can perform."""
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    ASSIGN = "assign"
    ARCHIVE = "archive"
    SEND = "send"
    APPROVE = "approve"
    GENERATE = "generate"
    SEARCH = "search"
    SUMMARIZE = "summarize"


# =====================================================
# MODULE CONTRACTS
# =====================================================
# Every department exposes capabilities to Company Brain.
# Company Brain calls modules; modules NEVER call Company Brain.

MODULE_CONTRACTS = {
    "projects": {
        "name": "Projects",
        "description": "Project management capabilities",
        "capabilities": [
            {"action": "create", "description": "Create a new project"},
            {"action": "update", "description": "Update project details"},
            {"action": "assign", "description": "Assign team members to project"},
            {"action": "archive", "description": "Archive a completed project"},
            {"action": "search", "description": "Search projects"},
        ],
        "required_role": "employee",
    },
    "opportunities": {
        "name": "Opportunities",
        "description": "Opportunity and tender management",
        "capabilities": [
            {"action": "create", "description": "Create a new opportunity"},
            {"action": "update", "description": "Update opportunity status"},
            {"action": "submit", "description": "Submit tender/bid"},
            {"action": "search", "description": "Search opportunities"},
        ],
        "required_role": "employee",
    },
    "financial": {
        "name": "Financial",
        "description": "Invoice and payment management",
        "capabilities": [
            {"action": "create_invoice", "description": "Create a new invoice"},
            {"action": "record_payment", "description": "Record a payment received"},
            {"action": "send_reminder", "description": "Send payment reminder"},
            {"action": "generate_report", "description": "Generate financial report"},
        ],
        "required_role": "manager",
    },
    "expenses": {
        "name": "Expenses",
        "description": "Expense tracking and GST management",
        "capabilities": [
            {"action": "create", "description": "Record a new expense"},
            {"action": "categorize", "description": "Categorize expense"},
            {"action": "gst_summary", "description": "Generate GST summary"},
        ],
        "required_role": "employee",
    },
    "crm": {
        "name": "CRM",
        "description": "Client and contact management",
        "capabilities": [
            {"action": "create_client", "description": "Add a new client"},
            {"action": "create_contact", "description": "Add a new contact"},
            {"action": "update", "description": "Update client/contact info"},
            {"action": "search", "description": "Search clients and contacts"},
        ],
        "required_role": "employee",
    },
    "production_library": {
        "name": "Production Library",
        "description": "Production rates and estimating data",
        "capabilities": [
            {"action": "search", "description": "Search production items"},
            {"action": "create", "description": "Add production item"},
            {"action": "update", "description": "Update production rate"},
        ],
        "required_role": "manager",
    },
    "documents": {
        "name": "Documents",
        "description": "Document storage and retrieval",
        "capabilities": [
            {"action": "search", "description": "Search documents"},
            {"action": "store", "description": "Store a document"},
            {"action": "summarize", "description": "Summarize document contents"},
        ],
        "required_role": "employee",
    },
    "reports": {
        "name": "Reports",
        "description": "Report generation and export",
        "capabilities": [
            {"action": "generate", "description": "Generate a report"},
            {"action": "export", "description": "Export report to PDF/Excel"},
        ],
        "required_role": "manager",
    },
    "settings": {
        "name": "Settings",
        "description": "Application settings",
        "capabilities": [
            {"action": "read", "description": "Read current settings"},
            {"action": "update", "description": "Update settings"},
        ],
        "required_role": "owner",
    },
}


# =====================================================
# PROACTIVE INTELLIGENCE CATEGORIES
# =====================================================
# Architecture for future proactive detection.
# NOT implemented yet - only structure defined.

PROACTIVE_CATEGORIES = {
    "deadlines": {
        "name": "Upcoming Deadlines",
        "description": "Detect approaching deadlines",
        "triggers": ["tender_close", "project_milestone", "invoice_due"],
    },
    "late_tenders": {
        "name": "Late Tenders",
        "description": "Detect overdue tender submissions",
        "triggers": ["tender_overdue", "bid_not_submitted"],
    },
    "outstanding_invoices": {
        "name": "Outstanding Invoices",
        "description": "Detect unpaid invoices",
        "triggers": ["invoice_overdue", "payment_late"],
    },
    "production_inconsistencies": {
        "name": "Production Inconsistencies",
        "description": "Detect unusual production rates",
        "triggers": ["rate_variance", "missing_data"],
    },
    "cash_flow": {
        "name": "Cash Flow Concerns",
        "description": "Detect cash flow issues",
        "triggers": ["negative_forecast", "large_expense"],
    },
    "scheduling_conflicts": {
        "name": "Scheduling Conflicts",
        "description": "Detect overlapping assignments",
        "triggers": ["double_booking", "resource_conflict"],
    },
    "missing_documents": {
        "name": "Missing Documents",
        "description": "Detect required but missing documents",
        "triggers": ["contract_missing", "permit_missing"],
    },
    "follow_ups": {
        "name": "Follow-up Reminders",
        "description": "Suggest follow-up actions",
        "triggers": ["no_response", "awaiting_decision"],
    },
}


# =====================================================
# PYDANTIC MODELS
# =====================================================

class ConversationThread(BaseModel):
    """A conversation thread with context."""
    id: Optional[str] = None
    user_id: str
    context_type: ContextType
    context_id: Optional[str] = None  # e.g., project_id, client_id
    context_name: Optional[str] = None  # Human-readable name
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    message_count: int = 0


class Message(BaseModel):
    """A message in a conversation thread."""
    id: Optional[str] = None
    thread_id: str
    role: Literal["user", "brain", "system"]
    content: str
    context_snapshot: Optional[Dict[str, Any]] = None  # Page context at time of message
    created_at: Optional[datetime] = None


class SendMessageRequest(BaseModel):
    """Request to send a message to Company Brain."""
    content: str
    context_type: ContextType = ContextType.GENERAL
    context_id: Optional[str] = None
    context_name: Optional[str] = None
    page_context: Optional[Dict[str, Any]] = None  # Current page state


class ActionRequest(BaseModel):
    """A requested action from Company Brain."""
    id: Optional[str] = None
    thread_id: Optional[str] = None
    module: str  # Which module to call
    action: str  # What action to perform
    parameters: Dict[str, Any] = {}
    state: ActionState = ActionState.INTENT
    requires_permission: bool = True
    created_at: Optional[datetime] = None
    executed_at: Optional[datetime] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    can_undo: bool = False
    undo_window_seconds: int = 300  # 5 minute undo window


class SuggestedAction(BaseModel):
    """A suggested action for the user."""
    id: str
    title: str
    description: str
    module: str
    action: str
    priority: Literal["high", "medium", "low"] = "medium"
    context_type: Optional[ContextType] = None
    context_id: Optional[str] = None


class CompanyBrief(BaseModel):
    """Operational briefing - future AI generated."""
    summary: str
    highlights: List[str] = []
    warnings: List[str] = []
    generated_at: Optional[datetime] = None


# =====================================================
# HELPER FUNCTIONS
# =====================================================

async def get_service_headers():
    """Get Supabase service headers."""
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }


async def get_user_from_token(authorization: str) -> Optional[Dict]:
    """Extract user info from JWT token."""
    if not authorization or not authorization.startswith('Bearer '):
        return None
    try:
        token = authorization.replace('Bearer ', '')
        # Decode without verification for user extraction
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
        return {
            "user_id": data.get('sub'),
            "email": data.get('email'),
        }
    except Exception as e:
        logger.error(f"Token decode error: {e}")
        return None


async def get_user_tfcs_role(user_id: str) -> Optional[str]:
    """Get user's TFCS role for permission checks."""
    try:
        headers = await get_service_headers()
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/tfcs_user_roles",
                headers=headers,
                params={"user_id": f"eq.{user_id}", "select": "role"}
            )
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    return data[0].get('role')
        return None
    except Exception as e:
        logger.error(f"Error fetching TFCS role: {e}")
        return None


# =====================================================
# API ENDPOINTS
# =====================================================

@router.get("/health")
async def brain_health():
    """Health check for Company Brain service."""
    return {
        "status": "healthy",
        "service": "company-brain",
        "version": "1.2.0",
        "capabilities": list(MODULE_CONTRACTS.keys()),
        "proactive_categories": list(PROACTIVE_CATEGORIES.keys()),
    }


@router.get("/contracts")
async def get_module_contracts(
    authorization: str = Header(None)
):
    """
    Get all module contracts - capabilities exposed to Company Brain.
    Company Brain calls modules; modules NEVER call Company Brain.
    """
    user = await get_user_from_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    return {
        "contracts": MODULE_CONTRACTS,
        "action_categories": [e.value for e in ActionCategory],
        "context_types": [e.value for e in ContextType],
    }


@router.get("/threads")
async def get_conversation_threads(
    authorization: str = Header(None),
    limit: int = 20
):
    """
    Get user's conversation threads.
    Returns threads organized by context type.
    """
    user = await get_user_from_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        headers = await get_service_headers()
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/company_brain_threads",
                headers=headers,
                params={
                    "user_id": f"eq.{user['user_id']}",
                    "order": "updated_at.desc",
                    "limit": limit,
                    "select": "*"
                }
            )
            
            if response.status_code == 200:
                threads = response.json()
                return {
                    "threads": threads,
                    "count": len(threads)
                }
            else:
                # Table may not exist yet - return empty
                return {"threads": [], "count": 0}
                
    except Exception as e:
        logger.error(f"Error fetching threads: {e}")
        return {"threads": [], "count": 0}


@router.get("/threads/{context_type}")
async def get_or_create_thread(
    context_type: ContextType,
    context_id: Optional[str] = None,
    context_name: Optional[str] = None,
    authorization: str = Header(None)
):
    """
    Get or create a conversation thread for a specific context.
    When Brain is opened from a Project, it continues that Project's conversation.
    """
    user = await get_user_from_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        headers = await get_service_headers()
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Try to find existing thread
            params = {
                "user_id": f"eq.{user['user_id']}",
                "context_type": f"eq.{context_type.value}",
                "select": "*"
            }
            if context_id:
                params["context_id"] = f"eq.{context_id}"
            else:
                params["context_id"] = "is.null"
            
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/company_brain_threads",
                headers=headers,
                params=params
            )
            
            if response.status_code == 200:
                threads = response.json()
                if threads and len(threads) > 0:
                    return {"thread": threads[0], "created": False}
            
            # Create new thread
            new_thread = {
                "user_id": user['user_id'],
                "context_type": context_type.value,
                "context_id": context_id,
                "context_name": context_name or context_type.value.title(),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "message_count": 0
            }
            
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/company_brain_threads",
                headers=headers,
                json=new_thread
            )
            
            if response.status_code in [200, 201]:
                created = response.json()
                return {"thread": created[0] if created else new_thread, "created": True}
            else:
                # Return mock thread if table doesn't exist
                return {"thread": new_thread, "created": True, "mock": True}
                
    except Exception as e:
        logger.error(f"Error with thread: {e}")
        # Return architecture-ready response
        return {
            "thread": {
                "id": "pending",
                "user_id": user['user_id'],
                "context_type": context_type.value,
                "context_id": context_id,
                "context_name": context_name or context_type.value.title(),
                "message_count": 0
            },
            "created": True,
            "mock": True
        }


@router.get("/messages/{thread_id}")
async def get_thread_messages(
    thread_id: str,
    authorization: str = Header(None),
    limit: int = 50
):
    """Get messages for a conversation thread."""
    user = await get_user_from_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        headers = await get_service_headers()
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/company_brain_messages",
                headers=headers,
                params={
                    "thread_id": f"eq.{thread_id}",
                    "order": "created_at.asc",
                    "limit": limit,
                    "select": "*"
                }
            )
            
            if response.status_code == 200:
                messages = response.json()
                return {"messages": messages, "count": len(messages)}
            else:
                return {"messages": [], "count": 0}
                
    except Exception as e:
        logger.error(f"Error fetching messages: {e}")
        return {"messages": [], "count": 0}


@router.post("/messages")
async def send_message(
    request: SendMessageRequest,
    authorization: str = Header(None)
):
    """
    Send a message to Company Brain.
    Architecture only - no AI processing yet.
    Stores message and returns acknowledgment.
    """
    user = await get_user_from_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        headers = await get_service_headers()
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Get or create thread
            thread_response = await get_or_create_thread(
                context_type=request.context_type,
                context_id=request.context_id,
                context_name=request.context_name,
                authorization=authorization
            )
            thread = thread_response.get("thread", {})
            thread_id = thread.get("id", "pending")
            
            # Store user message
            user_message = {
                "thread_id": thread_id,
                "role": "user",
                "content": request.content,
                "context_snapshot": request.page_context,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            # Try to store in database
            try:
                response = await client.post(
                    f"{SUPABASE_URL}/rest/v1/company_brain_messages",
                    headers=headers,
                    json=user_message
                )
            except Exception:
                pass  # Table may not exist yet
            
            # Return architecture response (no AI yet)
            return {
                "status": "received",
                "message": user_message,
                "thread_id": thread_id,
                "brain_response": {
                    "role": "brain",
                    "content": "Company Brain is listening. AI capabilities will be added in a future specification.",
                    "architecture_note": "This is the permanent conversation interface. AI processing will be integrated here."
                }
            }
            
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        return {
            "status": "received",
            "message": {"content": request.content, "role": "user"},
            "brain_response": {
                "role": "brain",
                "content": "Message received. Company Brain foundation is active.",
            }
        }


@router.get("/suggested-actions")
async def get_suggested_actions(
    context_type: Optional[ContextType] = None,
    context_id: Optional[str] = None,
    authorization: str = Header(None)
):
    """
    Get suggested actions for current context.
    Architecture only - returns placeholder suggestions.
    Future: AI will generate context-aware suggestions.
    """
    user = await get_user_from_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Placeholder suggestions based on context
    suggestions = []
    
    if context_type == ContextType.PROJECT or context_type is None:
        suggestions.extend([
            SuggestedAction(
                id="sa_1",
                title="Create Invoice",
                description="Generate invoice for project milestones",
                module="financial",
                action="create_invoice",
                priority="high",
                context_type=ContextType.PROJECT
            ),
            SuggestedAction(
                id="sa_2",
                title="Update Project Status",
                description="Mark project progress or completion",
                module="projects",
                action="update",
                priority="medium",
                context_type=ContextType.PROJECT
            ),
        ])
    
    if context_type == ContextType.OPPORTUNITY or context_type is None:
        suggestions.extend([
            SuggestedAction(
                id="sa_3",
                title="Review Tender",
                description="Analyze tender requirements and timeline",
                module="opportunities",
                action="search",
                priority="high",
                context_type=ContextType.OPPORTUNITY
            ),
            SuggestedAction(
                id="sa_4",
                title="Create Estimate",
                description="Draft estimate for opportunity",
                module="opportunities",
                action="create",
                priority="medium",
                context_type=ContextType.OPPORTUNITY
            ),
        ])
    
    if context_type == ContextType.FINANCIAL or context_type is None:
        suggestions.append(
            SuggestedAction(
                id="sa_5",
                title="Send Payment Reminder",
                description="Follow up on outstanding invoices",
                module="financial",
                action="send_reminder",
                priority="medium",
                context_type=ContextType.FINANCIAL
            )
        )
    
    if context_type == ContextType.CRM or context_type is None:
        suggestions.append(
            SuggestedAction(
                id="sa_6",
                title="Draft Follow-up Email",
                description="Compose follow-up to recent contact",
                module="crm",
                action="update",
                priority="low",
                context_type=ContextType.CRM
            )
        )
    
    if context_type == ContextType.PRODUCTION or context_type is None:
        suggestions.append(
            SuggestedAction(
                id="sa_7",
                title="Approve Production Rate",
                description="Review and approve updated rates",
                module="production_library",
                action="update",
                priority="medium",
                context_type=ContextType.PRODUCTION
            )
        )
    
    return {
        "suggestions": [s.dict() for s in suggestions[:5]],  # Max 5 suggestions
        "context_type": context_type.value if context_type else "general",
        "architecture_note": "Suggestions are placeholder. Future AI will generate context-aware recommendations."
    }


@router.get("/action-history")
async def get_action_history(
    authorization: str = Header(None),
    limit: int = 20
):
    """
    Get history of Company Brain actions.
    Every action follows: Intent → Plan → Permission → Execute → Log → Result → Undo
    """
    user = await get_user_from_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        headers = await get_service_headers()
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/company_brain_actions",
                headers=headers,
                params={
                    "user_id": f"eq.{user['user_id']}",
                    "order": "created_at.desc",
                    "limit": limit,
                    "select": "*"
                }
            )
            
            if response.status_code == 200:
                actions = response.json()
                return {"actions": actions, "count": len(actions)}
            else:
                return {"actions": [], "count": 0}
                
    except Exception as e:
        logger.error(f"Error fetching action history: {e}")
        return {"actions": [], "count": 0}


@router.post("/actions/queue")
async def queue_action(
    request: ActionRequest,
    authorization: str = Header(None)
):
    """
    Queue an action for Company Brain to execute.
    Architecture only - actions are logged but not executed yet.
    
    ACTION PIPELINE:
    Intent → Plan → Permission Check → Execute → Activity Log → Result → Undo Window
    """
    user = await get_user_from_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Validate module exists
    if request.module not in MODULE_CONTRACTS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown module: {request.module}. Available: {list(MODULE_CONTRACTS.keys())}"
        )
    
    # Check role permission
    user_role = await get_user_tfcs_role(user['user_id'])
    required_role = MODULE_CONTRACTS[request.module].get('required_role', 'owner')
    
    role_hierarchy = {'employee': 1, 'manager': 2, 'owner': 3}
    if role_hierarchy.get(user_role, 0) < role_hierarchy.get(required_role, 3):
        raise HTTPException(
            status_code=403,
            detail=f"Insufficient permissions. Required: {required_role}, You have: {user_role or 'none'}"
        )
    
    # Create action record
    action_record = {
        "user_id": user['user_id'],
        "thread_id": request.thread_id,
        "module": request.module,
        "action": request.action,
        "parameters": request.parameters,
        "state": ActionState.PENDING_PERMISSION.value if request.requires_permission else ActionState.INTENT.value,
        "requires_permission": request.requires_permission,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "can_undo": request.can_undo,
        "undo_window_seconds": request.undo_window_seconds
    }
    
    try:
        headers = await get_service_headers()
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/company_brain_actions",
                headers=headers,
                json=action_record
            )
    except Exception:
        pass  # Table may not exist yet
    
    return {
        "status": "queued",
        "action": action_record,
        "pipeline": {
            "current_state": action_record['state'],
            "next_state": "executing" if not request.requires_permission else "awaiting_approval",
            "pipeline_stages": ["intent", "planning", "pending_permission", "executing", "completed"]
        },
        "architecture_note": "Action queued. Execution engine will be added in future specification."
    }


@router.get("/brief")
async def get_company_brief(
    authorization: str = Header(None)
):
    """
    Get operational briefing for dashboard.
    Architecture only - returns placeholder.
    Future: AI will generate daily operational summary.
    """
    user = await get_user_from_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    return {
        "brief": {
            "summary": "Operational briefing will appear here.",
            "highlights": [],
            "warnings": [],
            "generated_at": None
        },
        "architecture_note": "Company Brain will generate operational summaries in a future specification."
    }


@router.get("/proactive")
async def get_proactive_alerts(
    authorization: str = Header(None)
):
    """
    Get proactive intelligence alerts.
    Architecture only - returns structure for future AI detection.
    """
    user = await get_user_from_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    return {
        "alerts": [],
        "categories": PROACTIVE_CATEGORIES,
        "architecture_note": "Proactive detection will be implemented in a future specification."
    }
