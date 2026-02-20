import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Sparkles, X, Send, ChevronRight, Loader2, 
  MessageSquare, Lightbulb, AlertTriangle, FileText,
  ArrowRight, Bot
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import ReactMarkdown from 'react-markdown';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Copilot context hook
const useCopilotContext = () => {
  const location = useLocation();
  const { profile, user } = useAuthStore();
  
  // Extract project_id from URL pattern: /app/projects/<uuid>
  const extractProjectId = () => {
    const match = location.pathname.match(/\/app\/projects\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    return match ? match[1] : null;
  };
  
  const getContext = () => ({
    page: location.pathname,
    project_id: extractProjectId(),
    region: profile?.region || null,
    trade: profile?.trade || null,
    plan_type: profile?.plan_type || null,
    subscription_tier: profile?.subscription_tier || null
  });
  
  return { getContext, location, projectId: extractProjectId() };
};

const AICopilot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const [projectContext, setProjectContext] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const { getContext, location, projectId } = useCopilotContext();
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  
  // Check if user has Elite access
  const tier = (profile?.subscription_tier || '').toLowerCase();
  const isElite = tier.includes('elite') || tier.includes('lifetime') || tier.includes('founding');
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Fetch suggested prompts when route changes
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/ai/copilot/prompts?route=${encodeURIComponent(location.pathname)}`
        );
        if (response.ok) {
          const data = await response.json();
          setSuggestedPrompts(data.prompts || []);
        }
      } catch (error) {
        console.error('Error fetching prompts:', error);
      }
    };
    
    if (isOpen) {
      fetchPrompts();
    }
  }, [location.pathname, isOpen]);
  
  // Fetch project context banner info if on project page
  useEffect(() => {
    const fetchProjectContext = async () => {
      if (!projectId) {
        setProjectContext(null);
        return;
      }
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(
          `${API_URL}/api/ai/copilot/project-context/${projectId}`,
          {
            headers: {
              'Authorization': `Bearer ${session?.access_token}`
            }
          }
        );
        if (response.ok) {
          const data = await response.json();
          setProjectContext(data);
        }
      } catch (error) {
        console.error('Error fetching project context:', error);
        setProjectContext(null);
      }
    };
    
    if (isOpen && projectId) {
      fetchProjectContext();
    } else if (!projectId) {
      setProjectContext(null);
    }
  }, [projectId, isOpen]);
  
  // Handle opening copilot
  const handleOpen = () => {
    setIsOpen(true);
    // Add welcome message if no messages
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `**Hey there!** 👋\n\nI'm your TradeOS Copilot. I can help you:\n\n• Navigate the app and explain features\n• Generate draft estimates\n• Analyze your project margins\n• Answer questions about your data\n\nWhat would you like help with?`,
        timestamp: new Date()
      }]);
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  };
  
  // Send message to Copilot API
  const sendMessage = async (messageText) => {
    if (!messageText.trim() || isLoading) return;
    
    const userMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const context = getContext();
      
      const response = await fetch(`${API_URL}/api/ai/copilot`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageText,
          context,
          mode: 'chat'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      
      const assistantMessage = {
        role: 'assistant',
        content: data.assistant_message,
        timestamp: new Date(),
        actions: data.action_suggestions,
        structured: data.structured_output,
        mode: data.mode
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Copilot error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle suggested prompt click
  const handlePromptClick = (prompt) => {
    sendMessage(prompt);
  };
  
  // Handle action click
  const handleActionClick = (action) => {
    if (action.action === 'navigate' && action.route) {
      navigate(action.route);
      setIsOpen(false);
    }
  };
  
  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputValue);
  };
  
  // Render estimate output
  const renderEstimateOutput = (structured) => {
    if (!structured || !structured.line_items) return null;
    
    return (
      <div className="mt-4 bg-charcoal-700/50 rounded-lg p-4 border border-charcoal-600">
        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-steel-400" />
          {structured.estimate_title || 'Draft Estimate'}
        </h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {structured.line_items.map((item, i) => (
            <div key={i} className="flex justify-between items-center text-sm py-1 border-b border-charcoal-600 last:border-0">
              <div>
                <span className="text-white">{item.name}</span>
                <span className="text-gray-500 ml-2">{item.qty} {item.unit}</span>
              </div>
              <span className="text-steel-400">${(item.qty * item.unit_cost).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-charcoal-600 flex justify-between text-sm">
          <span className="text-gray-400">Recommended markup: {structured.recommended_markup_pct}%</span>
          <span className="text-gray-400">Contingency: {structured.recommended_contingency_pct}%</span>
        </div>
        {structured.risk_flags?.length > 0 && (
          <div className="mt-3 flex items-start gap-2 text-warning text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{structured.risk_flags.join(', ')}</span>
          </div>
        )}
        <button
          onClick={() => navigate('/app/estimating?new=true')}
          className="mt-4 w-full bg-steel-500 hover:bg-steel-600 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          Use in Estimate Builder
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  };
  
  return (
    <>
      {/* Floating AI Button with Shield Logo */}
      <button
        onClick={handleOpen}
        className={`fixed bottom-20 right-6 z-[100] flex flex-col items-center transition-all duration-300 ${
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        }`}
        data-testid="ai-copilot-btn"
      >
        <div className="w-14 h-14 rounded-full shadow-xl bg-charcoal-800 border-2 border-steel-500 flex items-center justify-center hover:border-steel-400 transition-colors">
          <img src="/shield-icon.png" alt="AI Support" className="w-9 h-9" />
        </div>
        <span className="text-xs font-semibold text-steel-400 mt-1 tracking-wide">AI SUPPORT</span>
      </button>
      
      {/* Copilot Drawer - Mobile optimized with safe area support */}
      <div 
        className={`fixed right-0 z-50 w-full sm:w-96 lg:w-[420px] bg-charcoal-900 border-l border-charcoal-700 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } top-0 bottom-0 sm:inset-y-0`}
        style={{ 
          height: 'calc(100dvh - env(safe-area-inset-bottom, 0px))',
          maxHeight: '-webkit-fill-available'
        }}
        data-testid="ai-copilot-drawer"
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-charcoal-700 bg-charcoal-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-steel-500 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">TradeOS Copilot</h3>
              <p className="text-gray-500 text-xs">Powered by GPT-5.2</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Context Mode Indicator */}
        <div className="flex-shrink-0 px-4 py-1.5 bg-charcoal-800/50 border-b border-charcoal-700/50">
          <p className="text-[10px] text-gray-500 tracking-wide">
            {projectId && projectContext 
              ? "Using: Project Context" 
              : "General Mode"
            }
          </p>
        </div>
        
        {/* Messages - flexible height with proper mobile scrolling */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 overscroll-contain">
          {messages.map((msg, i) => (
            <div 
              key={i} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === 'user' 
                  ? 'bg-steel-500 text-white rounded-br-md' 
                  : 'bg-charcoal-800 text-gray-200 rounded-bl-md border border-charcoal-700'
              } ${msg.isError ? 'border-risk/50' : ''}`}>
                {msg.role === 'assistant' ? (
                  <>
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    
                    {/* Structured estimate output */}
                    {msg.structured && renderEstimateOutput(msg.structured)}
                    
                    {/* Action suggestions */}
                    {msg.actions?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.actions.map((action, j) => (
                          <button
                            key={j}
                            onClick={() => handleActionClick(action)}
                            className="text-xs bg-charcoal-700 hover:bg-charcoal-600 text-gray-300 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                          >
                            {action.label}
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-charcoal-800 rounded-2xl rounded-bl-md px-4 py-3 border border-charcoal-700">
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Suggested Prompts */}
        {messages.length <= 1 && suggestedPrompts.length > 0 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <Lightbulb className="w-3 h-3" />
              Suggested prompts
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.slice(0, 4).map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handlePromptClick(prompt)}
                  className="text-xs bg-charcoal-800 hover:bg-charcoal-700 text-gray-300 px-3 py-2 rounded-lg border border-charcoal-700 transition-colors text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Input - fixed at bottom with iOS safe area */}
        <form 
          onSubmit={handleSubmit} 
          className="flex-shrink-0 p-3 sm:p-4 border-t border-charcoal-700 bg-charcoal-800"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
        >
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isElite ? "Ask anything..." : "Ask about the app..."}
              className="flex-1 bg-charcoal-700 border border-charcoal-600 rounded-xl px-4 py-2.5 sm:py-3 text-white placeholder-gray-500 focus:outline-none focus:border-steel-500 text-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="bg-steel-500 hover:bg-steel-600 disabled:bg-charcoal-600 disabled:cursor-not-allowed text-white p-2.5 sm:p-3 rounded-xl transition-colors flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          {!isElite && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              <span className="text-warning">Pro Plan:</span> Upgrade to Elite for AI estimates & risk analysis
            </p>
          )}
        </form>
      </div>
      
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default AICopilot;
