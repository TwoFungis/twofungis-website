"""
TradeOS Configuration Module
============================
Centralized configuration access for all backend modules.

IMPORTANT: This module provides LAZY access to environment variables.
Values are read when first accessed, not at module import time.
This prevents issues where routes are imported before load_dotenv() runs.

Usage:
    from config import config
    
    # In your function (not at module level):
    url = config.SUPABASE_URL
    key = config.SUPABASE_SERVICE_KEY
"""

import os
from functools import cached_property


class Config:
    """
    Lazy configuration loader.
    
    All properties are loaded on first access, ensuring load_dotenv()
    has already been called by server.py before any values are read.
    """
    
    # Supabase
    @cached_property
    def SUPABASE_URL(self) -> str:
        return os.environ.get('SUPABASE_URL', '')
    
    @cached_property
    def SUPABASE_SERVICE_KEY(self) -> str:
        return os.environ.get('SUPABASE_SERVICE_KEY', '')
    
    @cached_property
    def SUPABASE_ANON_KEY(self) -> str:
        return os.environ.get('SUPABASE_ANON_KEY', '')
    
    # LLM / AI
    @cached_property
    def EMERGENT_LLM_KEY(self) -> str:
        return os.environ.get('EMERGENT_LLM_KEY', '')
    
    # Stripe
    @cached_property
    def STRIPE_SECRET_KEY(self) -> str:
        return os.environ.get('STRIPE_SECRET_KEY', '')
    
    @cached_property
    def STRIPE_WEBHOOK_SECRET(self) -> str:
        return os.environ.get('STRIPE_WEBHOOK_SECRET', '')
    
    # Email
    @cached_property
    def RESEND_API_KEY(self) -> str:
        return os.environ.get('RESEND_API_KEY', '')
    
    @cached_property
    def SENDER_EMAIL(self) -> str:
        return os.environ.get('SENDER_EMAIL', 'contact@tradeos.ca')
    
    # URLs
    @cached_property
    def FRONTEND_URL(self) -> str:
        return os.environ.get('FRONTEND_URL', '')
    
    @cached_property
    def APP_URL(self) -> str:
        return os.environ.get('REACT_APP_BACKEND_URL', 'https://tradeos.com')
    
    # Helper methods
    def get_supabase_headers(self, token: str = None) -> dict:
        """Get headers for Supabase REST API calls."""
        headers = {
            'apikey': self.SUPABASE_SERVICE_KEY,
            'Content-Type': 'application/json'
        }
        if token:
            headers['Authorization'] = f'Bearer {token}'
        else:
            headers['Authorization'] = f'Bearer {self.SUPABASE_SERVICE_KEY}'
        return headers
    
    def get_service_headers(self) -> dict:
        """Get headers for service-to-service Supabase calls."""
        return {
            'apikey': self.SUPABASE_SERVICE_KEY,
            'Authorization': f'Bearer {self.SUPABASE_SERVICE_KEY}',
            'Content-Type': 'application/json'
        }


# Singleton instance - import this in route modules
config = Config()
