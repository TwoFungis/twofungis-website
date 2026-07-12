/**
 * TimelinePanel.jsx
 * =================
 * The persistent activity timeline for workspaces.
 * Always visible. Records everything. Filterable.
 * 
 * This is the wall beside you — not a destination.
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  HelpCircle,
  MessageSquare,
  MapPin,
  Target,
  CheckCircle2,
  Send,
  Upload,
  Edit3,
  DollarSign,
  Filter,
  ChevronDown
} from 'lucide-react';
import { useWorkspace } from './WorkspaceShell';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ============================================================
// EVENT CONFIGURATION
// ============================================================

const EVENT_CONFIG = {
  created: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Created' },
  updated: { icon: Edit3, color: 'text-blue-400', label: 'Updated' },
  status_changed: { icon: Target, color: 'text-purple-400', label: 'Status' },
  tender_created: { icon: FileText, color: 'text-purple-400', label: 'Tender' },
  tender_updated: { icon: Edit3, color: 'text-blue-400', label: 'Tender' },
  tender_submitted: { icon: Send, color: 'text-emerald-400', label: 'Submitted' },
  document_added: { icon: Upload, color: 'text-cyan-400', label: 'Document' },
  rfi_submitted: { icon: HelpCircle, color: 'text-amber-400', label: 'RFI' },
  rfi_answered: { icon: HelpCircle, color: 'text-emerald-400', label: 'RFI' },
  communication_logged: { icon: MessageSquare, color: 'text-blue-400', label: 'Communication' },
  site_visit: { icon: MapPin, color: 'text-orange-400', label: 'Site Visit' },
  note_added: { icon: FileText, color: 'text-white/50', label: 'Note' }
};

// ============================================================
// FILTER OPTIONS
// ============================================================

const FILTERS = [
  { id: 'all', label: 'All Activity' },
  { id: 'documents', label: 'Documents' },
  { id: 'rfis', label: 'RFIs' },
  { id: 'estimates', label: 'Estimates' },
  { id: 'communications', label: 'Communications' }
];

// ============================================================
// FORMAT HELPERS
// ============================================================

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  
  return date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

function formatTime(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString('en-CA', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function getDateGroup(dateString) {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  if (date >= today) return 'Today';
  if (date >= yesterday) return 'Yesterday';
  if (date >= lastWeek) return 'This Week';
  return 'Earlier';
}

// ============================================================
// TIMELINE ITEM COMPONENT
// ============================================================

function TimelineItem({ event, isLast, onClick }) {
  const config = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.updated;
  const Icon = config.icon;
  
  return (
    <div 
      className="flex gap-3 group cursor-pointer"
      onClick={() => onClick?.(event)}
    >
      {/* Icon and connector line */}
      <div className="flex flex-col items-center">
        <div className={`
          w-7 h-7 rounded-full bg-[#1a1a1a] border border-[#262626] 
          flex items-center justify-center flex-shrink-0
          group-hover:border-white/30 transition-colors
        `}>
          <Icon className={`w-3 h-3 ${config.color}`} />
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-[#262626] my-1 min-h-[12px]" />
        )}
      </div>
      
      {/* Content */}
      <div className={`flex-1 pb-4 ${isLast ? '' : ''}`}>
        <p className="text-sm text-white/80 leading-snug group-hover:text-white transition-colors">
          {event.event_title}
        </p>
        <p className="text-xs font-mono text-white/40 mt-1">
          {formatRelativeTime(event.created_at)}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// TIMELINE PANEL COMPONENT
// ============================================================

export default function TimelinePanel({ opportunityId, session, onItemClick }) {
  const { timelineFilter, setTimelineFilter } = useWorkspace();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  
  // Fetch activities
  useEffect(() => {
    const fetchActivities = async () => {
      if (!opportunityId || !session?.access_token) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(
          `${API_URL}/api/opportunities/${opportunityId}/activity?limit=50`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          setActivities(data.activities || []);
        }
      } catch (err) {
        console.error('Error fetching timeline:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivities();
  }, [opportunityId, session?.access_token]);
  
  // Filter activities
  const filteredActivities = activities.filter(activity => {
    if (timelineFilter === 'all') return true;
    
    const typeMap = {
      documents: ['document_added'],
      rfis: ['rfi_submitted', 'rfi_answered'],
      estimates: ['tender_created', 'tender_updated', 'tender_submitted'],
      communications: ['communication_logged', 'site_visit']
    };
    
    return typeMap[timelineFilter]?.includes(activity.event_type);
  });
  
  // Group by date
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const group = getDateGroup(activity.created_at);
    if (!groups[group]) groups[group] = [];
    groups[group].push(activity);
    return groups;
  }, {});
  
  const groupOrder = ['Today', 'Yesterday', 'This Week', 'Earlier'];

  return (
    <div className="h-full flex flex-col" data-testid="timeline-panel">
      {/* Filter */}
      <div className="px-4 py-2 border-b border-[#262626]">
        <div className="relative">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-2 px-3 py-1.5 w-full text-sm text-white/60 hover:text-white bg-[#111111] border border-[#262626] rounded-lg transition-colors"
            data-testid="timeline-filter-btn"
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="flex-1 text-left">
              {FILTERS.find(f => f.id === timelineFilter)?.label || 'All Activity'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilter ? 'rotate-180' : ''}`} />
          </button>
          
          {showFilter && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowFilter(false)} />
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#111111] border border-[#262626] rounded-lg shadow-xl z-20 py-1">
                {FILTERS.map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => {
                      setTimelineFilter(filter.id);
                      setShowFilter(false);
                    }}
                    className={`
                      w-full px-3 py-2 text-sm text-left transition-colors
                      ${timelineFilter === filter.id 
                        ? 'text-white bg-white/5' 
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                      }
                    `}
                    data-testid={`filter-${filter.id}`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Timeline content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : filteredActivities.length === 0 ? (
          <p className="text-sm text-white/40 text-center py-8 italic">
            {timelineFilter === 'all' ? 'No activity yet' : 'No matching activity'}
          </p>
        ) : (
          <div className="space-y-6">
            {groupOrder.map(group => {
              const items = groupedActivities[group];
              if (!items?.length) return null;
              
              return (
                <div key={group}>
                  <p className="text-xs font-mono uppercase tracking-[0.15em] text-white/30 mb-3">
                    {group}
                  </p>
                  <div>
                    {items.map((activity, index) => (
                      <TimelineItem
                        key={activity.id || index}
                        event={activity}
                        isLast={index === items.length - 1}
                        onClick={onItemClick}
                      />
                    ))}
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
