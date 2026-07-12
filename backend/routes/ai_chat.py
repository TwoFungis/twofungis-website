"""
TradeOS AI Chat Service
========================
OpenAI GPT integration for Company Brain and AI-powered features.

Uses Emergent LLM integration library.

Features:
- Multi-turn conversations with session management
- Multiple model support (GPT-5.4, GPT-4o, etc.)
- Context-aware system prompts for construction domain
- Chat history persistence via Supabase
"""

from fastapi import APIRouter, HTTPException, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import os
import logging
import uuid
import json
import httpx
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from emergentintegrations.llm.chat import LlmChat, UserMessage

router = APIRouter(prefix="/api/ai/chat", tags=["ai-chat"])
logger = logging.getLogger(__name__)

# Configuration
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

# Default model configuration
DEFAULT_PROVIDER = "openai"
DEFAULT_MODEL = "gpt-5.4"

# TradeOS Company Brain system prompt
COMPANY_BRAIN_SYSTEM_PROMPT = """You are Company Brain, the AI operations partner for TradeOS - an operating system for Canadian construction contractors.

Your role is to:
1. Help contractors manage projects, estimates, and business operations
2. Provide insights based on company data and industry knowledge
3. Assist with document analysis, tender review, and estimate creation
4. Offer proactive recommendations to improve efficiency
5. Answer questions about construction best practices, pricing, and scheduling

Guidelines:
- Be concise and actionable in your responses
- Use construction industry terminology appropriately
- When discussing costs, use CAD currency unless specified otherwise
- Reference relevant company data when available
- Proactively suggest improvements and flag potential issues
- Maintain a professional but approachable tone

You have access to the company's historical data, including past projects, estimates, and client information. Use this context to provide personalized recommendations."""

# Simple chat system prompt
SIMPLE_CHAT_SYSTEM_PROMPT = """You are a helpful AI assistant for TradeOS, a construction management platform. 
Be concise, helpful, and professional in your responses."""


# Pydantic models
class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    context: Optional[str] = None  # Additional context (e.g., current page, selected project)
    model: Optional[str] = None  # Override default model
    system_prompt: Optional[str] = None  # Override system prompt
    stream: bool = False  # Streaming not yet supported in this version


class ChatResponse(BaseModel):
    response: str
    session_id: str
    model: str
    tokens_used: Optional[int] = None


class ChatHistoryResponse(BaseModel):
    session_id: str
    messages: List[ChatMessage]
    created_at: str
    updated_at: str


async def get_supabase_headers():
    """Get headers for Supabase service role requests."""
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }


async def save_message_to_db(session_id: str, role: str, content: str, user_id: Optional[str] = None):
    """Save a chat message to Supabase."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = await get_supabase_headers()
            
            message_data = {
                "id": str(uuid.uuid4()),
                "session_id": session_id,
                "role": role,
                "content": content,
                "user_id": user_id,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await client.post(
                f"{SUPABASE_URL}/rest/v1/chat_messages",
                headers=headers,
                json=message_data
            )
    except Exception as e:
        logger.warning(f"Could not save message to DB: {e}")


async def get_chat_history(session_id: str, limit: int = 20) -> List[dict]:
    """Get chat history for a session from Supabase."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = await get_supabase_headers()
            
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/chat_messages?"
                f"session_id=eq.{session_id}&"
                f"order=created_at.asc&"
                f"limit={limit}&"
                f"select=role,content,created_at",
                headers=headers
            )
            
            if response.status_code == 200:
                return response.json()
            return []
    except Exception as e:
        logger.warning(f"Could not get chat history: {e}")
        return []


# API Endpoints

@router.get("/health")
async def chat_health():
    """Check AI chat service health."""
    return {
        "status": "healthy" if EMERGENT_LLM_KEY else "unhealthy",
        "service": "ai-chat",
        "default_model": f"{DEFAULT_PROVIDER}/{DEFAULT_MODEL}",
        "key_configured": bool(EMERGENT_LLM_KEY)
    }


@router.post("/completions")
async def chat_completion(
    request: ChatRequest,
    authorization: str = Header(...)
):
    """
    Send a message and get an AI response.
    """
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    # Generate or use provided session ID
    session_id = request.session_id or str(uuid.uuid4())
    
    # Determine model
    model = request.model or DEFAULT_MODEL
    
    # Build system prompt
    system_prompt = request.system_prompt or COMPANY_BRAIN_SYSTEM_PROMPT
    if request.context:
        system_prompt += f"\n\nCurrent context: {request.context}"
    
    try:
        # Initialize chat
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=system_prompt
        ).with_model(DEFAULT_PROVIDER, model)
        
        # Create user message
        user_message = UserMessage(text=request.message)
        
        # Save user message to DB
        await save_message_to_db(session_id, "user", request.message)
        
        # Get response
        response = chat.send_message(user_message)
        
        # Extract text from response
        assistant_response = ""
        if response and response.choices:
            choice = response.choices[0]
            if hasattr(choice, 'message') and hasattr(choice.message, 'content'):
                assistant_response = choice.message.content or ""
            elif hasattr(choice, 'delta') and hasattr(choice.delta, 'content'):
                assistant_response = choice.delta.content or ""
        
        # Save assistant response to DB
        await save_message_to_db(session_id, "assistant", assistant_response)
        
        return {
            "response": assistant_response,
            "session_id": session_id,
            "model": f"{DEFAULT_PROVIDER}/{model}",
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Chat completion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{session_id}")
async def get_session_history(
    session_id: str,
    limit: int = 50,
    authorization: str = Header(...)
):
    """Get chat history for a session."""
    messages = await get_chat_history(session_id, limit)
    
    return {
        "session_id": session_id,
        "messages": messages,
        "count": len(messages)
    }


@router.delete("/history/{session_id}")
async def clear_session_history(
    session_id: str,
    authorization: str = Header(...)
):
    """Clear chat history for a session."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = await get_supabase_headers()
            
            response = await client.delete(
                f"{SUPABASE_URL}/rest/v1/chat_messages?session_id=eq.{session_id}",
                headers=headers
            )
            
            return {"success": True, "message": "Chat history cleared"}
    except Exception as e:
        logger.error(f"Error clearing history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/company-brain")
async def company_brain_chat(
    request: ChatRequest,
    authorization: str = Header(...)
):
    """
    Company Brain endpoint - AI assistant with construction context.
    
    Uses the Company Brain system prompt.
    """
    # Force Company Brain settings
    request.system_prompt = COMPANY_BRAIN_SYSTEM_PROMPT
    
    return await chat_completion(request, authorization)


@router.post("/quick-assist")
async def quick_assist(
    request: ChatRequest,
    authorization: str = Header(...)
):
    """
    Quick assist endpoint for simple, fast AI responses.
    
    Uses a lighter system prompt.
    """
    request.system_prompt = SIMPLE_CHAT_SYSTEM_PROMPT
    
    return await chat_completion(request, authorization)


@router.get("/models")
async def list_available_models():
    """List available AI models."""
    return {
        "default": f"{DEFAULT_PROVIDER}/{DEFAULT_MODEL}",
        "available": {
            "openai": [
                "gpt-5.4",
                "gpt-5.4-mini", 
                "gpt-5.2",
                "gpt-4o",
                "gpt-4.1",
                "gpt-4.1-mini"
            ],
            "anthropic": [
                "claude-sonnet-4-6",
                "claude-opus-4-7",
                "claude-haiku-4-5-20251001"
            ],
            "gemini": [
                "gemini-3.5-flash",
                "gemini-3.1-pro-preview",
                "gemini-3-flash-preview"
            ]
        }
    }
