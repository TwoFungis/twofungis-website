/**
 * WorkspaceHeader.jsx
 * ===================
 * Sticky command center for the Opportunity Workspace.
 * Shows: Name, Client, Stage Badge, Value, Due Date, Team, Actions
 * 
 * Design: Solid dark background, premium feel, clear hierarchy
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  Users,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  Clock,
  Edit3,
  Archive,
  Trash2,
  Copy,
  ChevronDown,
  ExternalLink,
  Send
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Workflow stage configuration
const STAGE_CONFIG = {
  discovered: { label: 'Discovered', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  qualifying: { label: 'Qualifying', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  tendering: { label: 'Tendering', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  submitted: { label: 'Submitted', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  negotiation: { label: 'Negotiation', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  awarded: { label: 'Awarded', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  declined: { label: 'Declined', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
  lost: { label: 'Lost', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  archived: { label: 'Archived', color: 'bg-zinc-600/20 text-zinc-500 border-zinc-600/30' }
};

function formatCurrency(value) {
  if (!value) return '—';
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getDaysUntil(dateString) {
  if (!dateString) return null;
  const target = new Date(dateString);
  const today = new Date();
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function WorkspaceHeader({ opportunity, workspaceSummary, onRefresh, session }) {
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);
  const [showStageMenu, setShowStageMenu] = useState(false);
  const [updating, setUpdating] = useState(false);

  if (!opportunity) return null;

  const stage = STAGE_CONFIG[opportunity.status] || STAGE_CONFIG.discovered;
  const daysUntilDue = getDaysUntil(opportunity.tender_due_date);
  const isUrgent = daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue >= 0;
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;

  // Change workflow stage
  const handleStageChange = async (newStatus) => {
    if (!session?.access_token || updating) return;
    
    try {
      setUpdating(true);
      const response = await fetch(`${API_URL}/api/opportunities/${opportunity.id}/status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdating(false);
      setShowStageMenu(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0a] border-b border-[#262626]" data-testid="workspace-header">
      {/* Top bar - Back button and actions */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-8">
        <div className="h-14 flex items-center justify-between">
          {/* Back navigation */}
          <button
            onClick={() => navigate('/app/opportunities')}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors group"
            data-testid="back-to-list"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Opportunities</span>
          </button>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Quick action: Submit Proposal */}
            {['tendering', 'qualifying'].includes(opportunity.status) && (
              <button
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
                data-testid="submit-proposal-btn"
              >
                <Send className="w-4 h-4" />
                <span>Submit Proposal</span>
              </button>
            )}

            {/* More actions menu */}
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                data-testid="more-actions-btn"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              
              {showActions && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#111111] border border-[#262626] rounded-xl shadow-xl z-20 py-1">
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors" data-testid="edit-opp-btn">
                      <Edit3 className="w-4 h-4" />
                      Edit Details
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors" data-testid="duplicate-opp-btn">
                      <Copy className="w-4 h-4" />
                      Duplicate
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors" data-testid="archive-opp-btn">
                      <Archive className="w-4 h-4" />
                      Archive
                    </button>
                    <hr className="my-1 border-[#262626]" />
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors" data-testid="delete-opp-btn">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main header content */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 pb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Left: Title and meta */}
          <div className="flex-1 min-w-0">
            {/* Reference number */}
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/40 mb-2" data-testid="opp-reference">
              {opportunity.reference_number || 'OPP-DRAFT'}
            </p>
            
            {/* Opportunity name */}
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-3 truncate" data-testid="opp-name">
              {opportunity.name}
            </h1>
            
            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              {/* Client */}
              {(opportunity.client_company || opportunity.client_name) && (
                <div className="flex items-center gap-2 text-white/60">
                  <Building2 className="w-4 h-4 text-white/40" />
                  <span data-testid="opp-client">{opportunity.client_company || opportunity.client_name}</span>
                </div>
              )}
              
              {/* Location */}
              {opportunity.site_city && (
                <div className="flex items-center gap-2 text-white/60">
                  <MapPin className="w-4 h-4 text-white/40" />
                  <span data-testid="opp-location">{opportunity.site_city}, {opportunity.site_province || 'BC'}</span>
                </div>
              )}
              
              {/* Trade */}
              {opportunity.trade_category && (
                <div className="flex items-center gap-2 text-white/60">
                  <span className="text-white/40">•</span>
                  <span data-testid="opp-trade">{opportunity.trade_category}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Key metrics */}
          <div className="flex flex-wrap items-start gap-6 lg:gap-8">
            {/* Stage badge with dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowStageMenu(!showStageMenu)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${stage.color} ${updating ? 'opacity-50' : 'hover:scale-105'}`}
                disabled={updating}
                data-testid="stage-badge"
              >
                <span>{stage.label}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showStageMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowStageMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-[#111111] border border-[#262626] rounded-xl shadow-xl z-20 py-2">
                    <p className="px-4 py-1 text-xs font-mono uppercase tracking-wider text-white/40">Change Stage</p>
                    {Object.entries(STAGE_CONFIG).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => handleStageChange(key)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                          opportunity.status === key 
                            ? 'bg-white/5 text-white' 
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                        data-testid={`stage-option-${key}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${config.color.split(' ')[0].replace('/20', '')}`} />
                        {config.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Estimated value */}
            <div className="text-right">
              <p className="text-xs font-mono uppercase tracking-[0.15em] text-white/40 mb-1">Value</p>
              <p className="text-xl font-mono tracking-tight text-white" data-testid="opp-value">
                {formatCurrency(opportunity.estimated_value)}
              </p>
            </div>

            {/* Due date */}
            <div className="text-right">
              <p className="text-xs font-mono uppercase tracking-[0.15em] text-white/40 mb-1">Due</p>
              <p className={`text-xl font-mono tracking-tight ${
                isOverdue ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-white'
              }`} data-testid="opp-due-date">
                {formatDate(opportunity.tender_due_date)}
              </p>
              {daysUntilDue !== null && (
                <p className={`text-xs font-mono ${
                  isOverdue ? 'text-red-400/70' : isUrgent ? 'text-amber-400/70' : 'text-white/40'
                }`}>
                  {isOverdue ? `${Math.abs(daysUntilDue)}d overdue` : `${daysUntilDue}d remaining`}
                </p>
              )}
            </div>

            {/* Confidence */}
            {opportunity.confidence_percent && (
              <div className="text-right">
                <p className="text-xs font-mono uppercase tracking-[0.15em] text-white/40 mb-1">Confidence</p>
                <p className="text-xl font-mono tracking-tight text-white" data-testid="opp-confidence">
                  {opportunity.confidence_percent}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
