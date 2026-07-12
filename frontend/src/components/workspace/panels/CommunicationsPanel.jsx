/**
 * CommunicationsPanel.jsx
 * =======================
 * Contextual panel for viewing and logging communications.
 */

import React, { useState } from 'react';
import {
  Search,
  Plus,
  MessageSquare,
  Mail,
  Phone,
  Users,
  Calendar
} from 'lucide-react';

const COMM_ICONS = {
  email: Mail,
  phone: Phone,
  meeting: Users,
  site_visit: Calendar,
  text: MessageSquare,
  note: MessageSquare
};

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric'
  });
}

export default function CommunicationsPanel({ opportunityId, session }) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // TODO: Fetch communications from API
  const communications = [];

  return (
    <div className="h-full flex flex-col" data-testid="communications-panel">
      {/* Search and actions */}
      <div className="px-6 py-4 border-b border-[#262626]">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search communications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#111111] border border-[#262626] rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 text-sm"
              data-testid="comms-search"
            />
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
            data-testid="log-comm-btn"
          >
            <Plus className="w-4 h-4" />
            Log
          </button>
        </div>
      </div>
      
      {/* Communications list */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {communications.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50 mb-2">No communications logged</p>
            <p className="text-white/30 text-sm">Log emails, calls, and meetings to keep a record</p>
          </div>
        ) : (
          <div className="space-y-2">
            {communications.map((comm) => {
              const Icon = COMM_ICONS[comm.comm_type] || MessageSquare;
              return (
                <div
                  key={comm.id}
                  className="p-4 rounded-lg bg-[#111111] border border-[#262626] hover:border-white/20 cursor-pointer transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-white/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-white/80 group-hover:text-white transition-colors">
                          {comm.subject || comm.comm_type}
                        </span>
                        <span className="text-xs text-white/40">{formatDate(comm.comm_date)}</span>
                      </div>
                      {comm.summary && (
                        <p className="text-xs text-white/50 line-clamp-2">{comm.summary}</p>
                      )}
                      {comm.from_name && (
                        <p className="text-xs text-white/40 mt-1">From: {comm.from_name}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
