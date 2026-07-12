/**
 * TradeOS AI Chat Hook
 * 
 * React hook for interacting with the AI Chat API.
 */

import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const useAIChat = (options = {}) => {
  const {
    sessionId: initialSessionId = null,
    context = null,
    model = null,
    onError = () => {},
  } = options;

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(initialSessionId);

  /**
   * Send a message and receive a response
   */
  const sendMessage = useCallback(async (message, additionalContext = null) => {
    if (!message.trim()) return null;

    setIsLoading(true);
    setError(null);

    // Add user message to state
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/api/ai/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          session_id: sessionId,
          context: additionalContext || context,
          model,
          stream: false
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to get AI response');
      }

      const data = await response.json();
      
      if (data.session_id && !sessionId) {
        setSessionId(data.session_id);
      }

      // Add assistant message to state
      const assistantMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);

      return data.response;

    } catch (err) {
      setError(err.message);
      onError(err);
      // Remove the user message on error
      setMessages(prev => prev.slice(0, -1));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, context, model, onError]);

  /**
   * Clear chat history
   */
  const clearHistory = useCallback(async () => {
    setMessages([]);
    
    if (sessionId) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (token) {
          await fetch(`${API_URL}/api/ai/chat/history/${sessionId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          });
        }
      } catch (err) {
        console.error('Failed to clear history:', err);
      }
    }
    
    setSessionId(null);
  }, [sessionId]);

  /**
   * Load chat history
   */
  const loadHistory = useCallback(async (sid = sessionId) => {
    if (!sid) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) return;

      const response = await fetch(`${API_URL}/api/ai/chat/history/${sid}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setSessionId(sid);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  }, [sessionId]);

  return {
    messages,
    isLoading,
    error,
    sessionId,
    sendMessage,
    clearHistory,
    loadHistory,
    setMessages
  };
};

export default useAIChat;
