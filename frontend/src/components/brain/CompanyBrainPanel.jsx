/**
 * Company Brain Panel
 * ====================
 * Specification 1.2 - The permanent conversational interface.
 * 
 * This is NOT a chatbot. This is an Operations Partner.
 * Global collapsible side panel accessible from anywhere.
 * 
 * Features:
 * - Context-aware conversations (knows current page/record)
 * - Persistent conversation threads organized by context
 * - Company Brief (placeholder for future AI)
 * - Conversation interface
 * - Suggested Actions
 * - Action History
 * 
 * ONE BRAIN RULE:
 * Every AI interaction routes through ONE Company Brain.
 * Modules never contain their own AI.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Brain,
  Send, 
  Mic, 
  ChevronDown,
  ChevronRight,
  Sparkles,
  History,
  Lightbulb,
  FileText,
  MessageSquare,
  Loader2,
  Plus
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ============================================
// CONTEXT TYPES
// ============================================
const CONTEXT_TYPES = {
  general: { label: 'General', icon: Brain, color: 'text-tradeos-gold' },
  project: { label: 'Project', icon: FileText, color: 'text-blue-400' },
  opportunity: { label: 'Opportunity', icon: Sparkles, color: 'text-purple-400' },
  estimate: { label: 'Estimate', icon: FileText, color: 'text-green-400' },
  financial: { label: 'Financial', icon: FileText, color: 'text-emerald-400' },
  crm: { label: 'CRM', icon: FileText, color: 'text-cyan-400' },
  production: { label: 'Production', icon: FileText, color: 'text-orange-400' },
  documents: { label: 'Documents', icon: FileText, color: 'text-gray-400' },
  reports: { label: 'Reports', icon: FileText, color: 'text-indigo-400' },
  settings: { label: 'Settings', icon: FileText, color: 'text-zinc-400' },
};


// ============================================
// COMPANY BRIEF SECTION
// ============================================
const CompanyBrief = () => {
  return (
    <div className="p-4 border-b border-tradeos-border">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-tradeos-gold" />
        <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500">Company Brief</h3>
      </div>
      <div className="bg-black/50 rounded p-3 text-sm text-zinc-400 font-mono">
        <p>Operational briefing will appear here.</p>
        <p className="text-xs text-zinc-600 mt-2">AI-generated summaries in future specification.</p>
      </div>
    </div>
  );
};


// ============================================
// CONVERSATION SECTION
// ============================================
const ConversationSection = ({ 
  messages, 
  onSendMessage, 
  loading, 
  currentContext,
  threads,
  onSelectThread
}) => {
  const [input, setInput] = useState('');
  const [showThreads, setShowThreads] = useState(false);
  const messagesEndRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSend = () => {
    if (input.trim() && !loading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const contextConfig = CONTEXT_TYPES[currentContext?.type] || CONTEXT_TYPES.general;
  const ContextIcon = contextConfig.icon;
  
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Context Header */}
      <div className="p-3 border-b border-tradeos-border">
        <button 
          onClick={() => setShowThreads(!showThreads)}
          className="w-full flex items-center justify-between text-left hover:bg-tradeos-surface-hover rounded p-2 -m-2 transition-colors"
          data-testid="brain-context-selector"
        >
          <div className="flex items-center gap-2">
            <ContextIcon className={`w-4 h-4 ${contextConfig.color}`} />
            <span className="text-sm text-white font-medium">
              {currentContext?.name || contextConfig.label}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${showThreads ? 'rotate-180' : ''}`} />
        </button>
        
        {/* Thread Selector Dropdown */}
        {showThreads && (
          <div className="mt-2 bg-black/50 rounded border border-tradeos-border max-h-48 overflow-y-auto">
            <button
              onClick={() => { onSelectThread({ type: 'general', name: 'General' }); setShowThreads(false); }}
              className="w-full flex items-center gap-2 p-2 text-left text-sm text-zinc-300 hover:bg-tradeos-surface-hover"
            >
              <Plus className="w-3 h-3" />
              New General Conversation
            </button>
            {threads.map((thread, i) => (
              <button
                key={thread.id || i}
                onClick={() => { onSelectThread(thread); setShowThreads(false); }}
                className="w-full flex items-center gap-2 p-2 text-left text-sm text-zinc-400 hover:bg-tradeos-surface-hover border-t border-tradeos-border/50"
              >
                <MessageSquare className="w-3 h-3" />
                <span className="truncate">{thread.context_name || thread.context_type}</span>
                <span className="text-xs text-zinc-600 ml-auto">{thread.message_count || 0}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="w-10 h-10 text-tradeos-gold/30 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Start a conversation with Company Brain.</p>
            <p className="text-zinc-600 text-xs mt-1">AI capabilities coming in future specification.</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div 
              key={msg.id || i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] rounded-lg p-3 ${
                  msg.role === 'user' 
                    ? 'bg-tradeos-gold/20 text-white' 
                    : msg.role === 'brain'
                      ? 'bg-tradeos-surface border border-tradeos-border text-zinc-300'
                      : 'bg-zinc-800/50 text-zinc-400 italic'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.created_at && (
                  <p className="text-xs text-zinc-600 mt-1 font-mono">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-tradeos-surface border border-tradeos-border rounded-lg p-3">
              <Loader2 className="w-4 h-4 text-tradeos-gold animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-3 border-t border-tradeos-border">
        <div className="flex items-center gap-2 bg-tradeos-surface border border-tradeos-border rounded-lg">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Company Brain..."
            className="flex-1 bg-transparent text-white text-sm px-3 py-2 outline-none placeholder:text-zinc-600"
            disabled={loading}
            data-testid="brain-input"
          />
          <button
            className="p-2 text-zinc-600 hover:text-zinc-400 transition-colors cursor-not-allowed"
            title="Voice input - coming in future specification"
            disabled
          >
            <Mic className="w-4 h-4" />
          </button>
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-2 text-tradeos-gold hover:text-tradeos-gold/80 disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors"
            data-testid="brain-send"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};


// ============================================
// SUGGESTED ACTIONS SECTION
// ============================================
const SuggestedActions = ({ actions, onAction }) => {
  const [expanded, setExpanded] = useState(true);
  
  return (
    <div className="border-t border-tradeos-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-tradeos-surface-hover transition-colors"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-tradeos-gold" />
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Suggested Actions</span>
        </div>
        <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>
      
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {actions.length === 0 ? (
            <p className="text-xs text-zinc-600 text-center py-2">No suggestions for current context.</p>
          ) : (
            actions.map((action, i) => (
              <button
                key={action.id || i}
                onClick={() => onAction(action)}
                className="w-full text-left p-2 bg-tradeos-surface hover:bg-tradeos-surface-hover border border-tradeos-border rounded transition-colors group"
                data-testid={`brain-action-${action.id}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">{action.title}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    action.priority === 'high' ? 'bg-tradeos-red-muted text-tradeos-red' :
                    action.priority === 'medium' ? 'bg-tradeos-gold-muted text-tradeos-gold' :
                    'bg-zinc-800 text-zinc-400'
                  }`}>
                    {action.priority}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-1">{action.description}</p>
              </button>
            ))
          )}
          <p className="text-xs text-zinc-600 text-center pt-2">
            AI will generate context-aware suggestions.
          </p>
        </div>
      )}
    </div>
  );
};


// ============================================
// ACTION HISTORY SECTION
// ============================================
const ActionHistory = ({ actions }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="border-t border-tradeos-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-tradeos-surface-hover transition-colors"
      >
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-zinc-500" />
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Action History</span>
        </div>
        <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>
      
      {expanded && (
        <div className="px-3 pb-3">
          {actions.length === 0 ? (
            <div className="text-center py-4">
              <History className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-600">No actions yet.</p>
              <p className="text-xs text-zinc-700 mt-1">Company Brain actions will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {actions.map((action, i) => (
                <div key={action.id || i} className="p-2 bg-black/30 rounded text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-white">{action.module} → {action.action}</span>
                    <span className={`px-1.5 py-0.5 rounded ${
                      action.state === 'completed' ? 'bg-tradeos-green-muted text-tradeos-green' :
                      action.state === 'failed' ? 'bg-tradeos-red-muted text-tradeos-red' :
                      'bg-zinc-800 text-zinc-400'
                    }`}>
                      {action.state}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};


// ============================================
// MAIN PANEL COMPONENT
// ============================================
const CompanyBrainPanel = ({ isOpen, onClose, pageContext }) => {
  const [messages, setMessages] = useState([]);
  const [threads, setThreads] = useState([]);
  const [suggestedActions, setSuggestedActions] = useState([]);
  const [actionHistory, setActionHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentContext, setCurrentContext] = useState({ type: 'general', name: 'General' });
  
  // Fetch token
  const getToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }, []);
  
  // Update context from page
  useEffect(() => {
    if (pageContext && isOpen) {
      setCurrentContext({
        type: pageContext.type || 'general',
        id: pageContext.id,
        name: pageContext.name || pageContext.type || 'General'
      });
    }
  }, [pageContext, isOpen]);
  
  // Fetch threads
  const fetchThreads = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/api/brain/threads`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setThreads(data.threads || []);
      }
    } catch (e) {
      console.log('Error fetching threads:', e);
    }
  }, [getToken]);
  
  // Fetch suggested actions
  const fetchSuggestions = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    
    try {
      const params = new URLSearchParams();
      if (currentContext.type) params.append('context_type', currentContext.type);
      if (currentContext.id) params.append('context_id', currentContext.id);
      
      const response = await fetch(`${API_URL}/api/brain/suggested-actions?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSuggestedActions(data.suggestions || []);
      }
    } catch (e) {
      console.log('Error fetching suggestions:', e);
    }
  }, [getToken, currentContext]);
  
  // Fetch action history
  const fetchActionHistory = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/api/brain/action-history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setActionHistory(data.actions || []);
      }
    } catch (e) {
      console.log('Error fetching action history:', e);
    }
  }, [getToken]);
  
  // Initial data fetch
  useEffect(() => {
    if (isOpen) {
      fetchThreads();
      fetchSuggestions();
      fetchActionHistory();
    }
  }, [isOpen, fetchThreads, fetchSuggestions, fetchActionHistory]);
  
  // Send message
  const handleSendMessage = async (content) => {
    setLoading(true);
    
    // Add user message optimistically
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(`${API_URL}/api/brain/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          context_type: currentContext.type,
          context_id: currentContext.id,
          context_name: currentContext.name,
          page_context: pageContext
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Add brain response
        if (data.brain_response) {
          setMessages(prev => [...prev, {
            id: Date.now().toString() + '_brain',
            role: 'brain',
            content: data.brain_response.content,
            created_at: new Date().toISOString()
          }]);
        }
      }
    } catch (e) {
      console.error('Error sending message:', e);
      // Add error response
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '_error',
        role: 'system',
        content: 'Unable to process message. Please try again.',
        created_at: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };
  
  // Select thread
  const handleSelectThread = (thread) => {
    setCurrentContext({
      type: thread.context_type || thread.type || 'general',
      id: thread.context_id || thread.id,
      name: thread.context_name || thread.name || 'General'
    });
    // Clear messages for new context (would load from DB in full implementation)
    setMessages([]);
  };
  
  // Handle action click
  const handleAction = (action) => {
    // For now, just show in conversation
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'system',
      content: `Action requested: ${action.title}\nModule: ${action.module}\nAction execution will be implemented in future specification.`,
      created_at: new Date().toISOString()
    }]);
  };
  
  if (!isOpen) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 lg:bg-transparent"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        className="fixed right-0 top-0 h-full w-full max-w-md bg-tradeos-black border-l border-tradeos-gold/30 z-50 flex flex-col shadow-2xl"
        data-testid="company-brain-panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-tradeos-gold/30 bg-tradeos-gold-muted/30">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-tradeos-gold" />
            <div>
              <h2 className="text-lg font-semibold text-white">Company Brain</h2>
              <p className="text-xs text-zinc-500 font-mono">Operations Partner</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
            data-testid="close-brain-panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Company Brief */}
        <CompanyBrief />
        
        {/* Conversation */}
        <ConversationSection
          messages={messages}
          onSendMessage={handleSendMessage}
          loading={loading}
          currentContext={currentContext}
          threads={threads}
          onSelectThread={handleSelectThread}
        />
        
        {/* Suggested Actions */}
        <SuggestedActions 
          actions={suggestedActions}
          onAction={handleAction}
        />
        
        {/* Action History */}
        <ActionHistory actions={actionHistory} />
      </div>
    </>
  );
};

export default CompanyBrainPanel;
