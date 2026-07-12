/**
 * RFIsPanel.jsx
 * =============
 * Contextual panel for viewing and managing RFIs.
 */

import React, { useState } from 'react';
import {
  Search,
  Plus,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight
} from 'lucide-react';

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-zinc-500/20 text-zinc-400' },
  submitted: { label: 'Submitted', color: 'bg-amber-500/20 text-amber-400' },
  answered: { label: 'Answered', color: 'bg-emerald-500/20 text-emerald-400' },
  closed: { label: 'Closed', color: 'bg-zinc-600/20 text-zinc-500' }
};

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric'
  });
}

export default function RFIsPanel({ opportunityId, session }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  
  // TODO: Fetch RFIs from API
  const rfis = [];

  return (
    <div className="h-full flex flex-col" data-testid="rfis-panel">
      {/* Search and actions */}
      <div className="px-6 py-4 border-b border-[#262626]">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search RFIs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#111111] border border-[#262626] rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 text-sm"
              data-testid="rfis-search"
            />
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
            data-testid="new-rfi-btn"
          >
            <Plus className="w-4 h-4" />
            New RFI
          </button>
        </div>
        
        {/* Status filter */}
        <div className="flex items-center gap-2 mt-3">
          {['all', 'submitted', 'answered', 'draft'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                filter === f
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* RFIs list */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {rfis.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50 mb-2">No RFIs yet</p>
            <p className="text-white/30 text-sm">Create RFIs to track questions and clarifications</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rfis.map((rfi) => {
              const status = STATUS_CONFIG[rfi.status] || STATUS_CONFIG.draft;
              return (
                <div
                  key={rfi.id}
                  className="p-4 rounded-lg bg-[#111111] border border-[#262626] hover:border-white/20 cursor-pointer transition-colors group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-mono text-white/40">{rfi.rfi_number}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-white/80 mb-2 group-hover:text-white transition-colors">
                    {rfi.subject}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-white/40">
                    {rfi.submitted_date && (
                      <span>Submitted {formatDate(rfi.submitted_date)}</span>
                    )}
                    {rfi.due_date && (
                      <span>Due {formatDate(rfi.due_date)}</span>
                    )}
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
