import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Loader2, Trash2, Sparkles, User } from 'lucide-react';
import useAIChat from '../../hooks/useAIChat';

/**
 * AI Chat Component
 * 
 * A reusable chat interface for AI conversations.
 */
const AIChatComponent = ({
  isOpen,
  onClose,
  title = "Company Brain",
  subtitle = "Your AI Operations Partner",
  context = null,
  sessionId = null,
  placeholder = "Ask anything about your business...",
  className = ""
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearHistory
  } = useAIChat({
    sessionId,
    context,
    onError: (err) => console.error('AI Chat error:', err)
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`flex flex-col h-full bg-zinc-900 ${className}`} data-testid="ai-chat">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{title}</h3>
            <p className="text-xs text-zinc-500">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              title="Clear conversation"
              data-testid="clear-chat-btn"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            data-testid="close-chat-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-emerald-400" />
            </div>
            <h4 className="text-lg font-medium text-white mb-2">How can I help?</h4>
            <p className="text-zinc-500 text-sm max-w-xs">
              Ask me about your projects, estimates, clients, or anything else about your business.
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-zinc-800 text-zinc-100'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-zinc-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-zinc-400" />
                </div>
              )}
            </div>
          ))
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="bg-zinc-800 rounded-2xl px-4 py-3">
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
            </div>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-800">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors outline-none disabled:opacity-50"
            data-testid="chat-input"
          />
          {isLoading ? (
            <button
              type="button"
              disabled
              className="bg-zinc-700 text-zinc-400 px-4 rounded-xl cursor-not-allowed flex items-center gap-2"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 rounded-xl transition-colors flex items-center gap-2"
              data-testid="send-message-btn"
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default AIChatComponent;
