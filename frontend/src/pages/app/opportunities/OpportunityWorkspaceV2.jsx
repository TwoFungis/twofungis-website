/**
 * OpportunityWorkspace.jsx (V2)
 * =============================
 * The reference implementation of the TradeOS Workspace pattern.
 * Panel-first operating system design.
 * 
 * Structure:
 * - 3 Primary Sections: Command Center, Tender, Information
 * - Persistent Timeline (right panel)
 * - Contextual Panel Dock (Documents, RFIs, Communications, Site Notes)
 * - Focus Layer integration
 * - Workspace Memory persistence
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Target,
  FileText,
  Info,
  FolderOpen,
  HelpCircle,
  MessageSquare,
  MapPin,
  ChevronDown,
  MoreHorizontal,
  Edit3,
  Copy,
  Archive,
  Trash2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import WorkspaceShell, { useWorkspace } from '../../../components/workspace/WorkspaceShell';
import CommandCenter from '../../../components/workspace/CommandCenter';
import TimelinePanel from '../../../components/workspace/TimelinePanel';
import TenderSection from '../../../components/workspace/TenderSection';
import InformationSection from '../../../components/workspace/InformationSection';
import DocumentsPanel from '../../../components/workspace/panels/DocumentsPanel';
import RFIsPanel from '../../../components/workspace/panels/RFIsPanel';
import CommunicationsPanel from '../../../components/workspace/panels/CommunicationsPanel';
import SiteNotesPanel from '../../../components/workspace/panels/SiteNotesPanel';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ============================================================
// STAGE CONFIGURATION
// ============================================================

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

// ============================================================
// FORMAT HELPERS
// ============================================================

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
    day: 'numeric'
  });
}

function getDaysUntil(dateString) {
  if (!dateString) return null;
  const target = new Date(dateString);
  const today = new Date();
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

// ============================================================
// WORKSPACE HEADER COMPONENT
// ============================================================

function OpportunityHeader({ opportunity, workspaceSummary, onRefresh, session }) {
  const navigate = useNavigate();
  const [showStageMenu, setShowStageMenu] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  if (!opportunity) return null;
  
  const stage = STAGE_CONFIG[opportunity.status] || STAGE_CONFIG.discovered;
  const daysUntilDue = getDaysUntil(opportunity.tender_due_date);
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
  const isUrgent = daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue >= 0;
  
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
      <div className="max-w-[1600px] mx-auto px-6 lg:px-8">
        {/* Top row */}
        <div className="h-12 flex items-center justify-between">
          <button
            onClick={() => navigate('/app/opportunities')}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors group"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Opportunities</span>
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              data-testid="actions-btn"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            
            {showActions && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-[#111111] border border-[#262626] rounded-xl shadow-xl z-20 py-1">
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5" data-testid="edit-btn">
                    <Edit3 className="w-4 h-4" /> Edit Details
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5" data-testid="duplicate-btn">
                    <Copy className="w-4 h-4" /> Duplicate
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5" data-testid="archive-btn">
                    <Archive className="w-4 h-4" /> Archive
                  </button>
                  <hr className="my-1 border-[#262626]" />
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10" data-testid="delete-btn">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Main header content */}
        <div className="pb-5">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            {/* Left: Identity */}
            <div className="min-w-0">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/40 mb-1" data-testid="opp-ref">
                {opportunity.reference_number || 'OPP-DRAFT'}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-white truncate mb-2" data-testid="opp-name">
                {opportunity.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/50">
                {opportunity.client_company && (
                  <span data-testid="opp-client">{opportunity.client_company}</span>
                )}
                {opportunity.site_city && (
                  <span data-testid="opp-location">{opportunity.site_city}, {opportunity.site_province || 'BC'}</span>
                )}
              </div>
            </div>
            
            {/* Right: Key metrics */}
            <div className="flex flex-wrap items-center gap-6">
              {/* Value */}
              <div className="text-right">
                <p className="text-xs font-mono uppercase tracking-[0.15em] text-white/40">Value</p>
                <p className="text-xl font-mono text-white" data-testid="opp-value">
                  {formatCurrency(opportunity.estimated_value)}
                </p>
              </div>
              
              {/* Due */}
              <div className="text-right">
                <p className="text-xs font-mono uppercase tracking-[0.15em] text-white/40">Due</p>
                <p className={`text-xl font-mono ${isOverdue ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-white'}`} data-testid="opp-due">
                  {formatDate(opportunity.tender_due_date)}
                </p>
                {daysUntilDue !== null && (
                  <p className={`text-xs font-mono ${isOverdue ? 'text-red-400/70' : isUrgent ? 'text-amber-400/70' : 'text-white/40'}`}>
                    {isOverdue ? `${Math.abs(daysUntilDue)}d overdue` : `${daysUntilDue}d`}
                  </p>
                )}
              </div>
              
              {/* Stage badge */}
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
                    <div className="absolute right-0 top-full mt-2 w-52 bg-[#111111] border border-[#262626] rounded-xl shadow-xl z-20 py-2">
                      <p className="px-4 py-1 text-xs font-mono uppercase tracking-wider text-white/40">Change Stage</p>
                      {Object.entries(STAGE_CONFIG).map(([key, config]) => (
                        <button
                          key={key}
                          onClick={() => handleStageChange(key)}
                          className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                            opportunity.status === key ? 'bg-white/5 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
                          }`}
                          data-testid={`stage-${key}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${config.color.split(' ')[0].replace('/20', '')}`} />
                          {config.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// ============================================================
// TAB WRAPPER COMPONENTS
// ============================================================

function CommandCenterWrapper() {
  const { opportunity, workspaceSummary, onRefresh } = useOpportunityData();
  return <CommandCenter opportunity={opportunity} workspaceSummary={workspaceSummary} onRefresh={onRefresh} />;
}

function TenderSectionWrapper() {
  const { opportunity, workspaceSummary, onRefresh, session } = useOpportunityData();
  return <TenderSection opportunity={opportunity} workspaceSummary={workspaceSummary} onRefresh={onRefresh} session={session} />;
}

function InformationSectionWrapper() {
  const { opportunity, workspaceSummary, onRefresh, session } = useOpportunityData();
  return <InformationSection opportunity={opportunity} workspaceSummary={workspaceSummary} onRefresh={onRefresh} session={session} />;
}

// ============================================================
// PANEL WRAPPER COMPONENTS
// ============================================================

function DocumentsPanelWrapper() {
  const { opportunity, session } = useOpportunityData();
  return <DocumentsPanel opportunityId={opportunity?.id} session={session} />;
}

function RFIsPanelWrapper() {
  const { opportunity, session } = useOpportunityData();
  return <RFIsPanel opportunityId={opportunity?.id} session={session} />;
}

function CommunicationsPanelWrapper() {
  const { opportunity, session } = useOpportunityData();
  return <CommunicationsPanel opportunityId={opportunity?.id} session={session} />;
}

function SiteNotesPanelWrapper() {
  const { opportunity, session } = useOpportunityData();
  return <SiteNotesPanel opportunityId={opportunity?.id} session={session} />;
}

// ============================================================
// OPPORTUNITY DATA CONTEXT
// ============================================================

const OpportunityDataContext = React.createContext(null);

function useOpportunityData() {
  const context = React.useContext(OpportunityDataContext);
  if (!context) {
    throw new Error('useOpportunityData must be used within OpportunityWorkspace');
  }
  return context;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function OpportunityWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuthStore();
  
  const [opportunity, setOpportunity] = useState(null);
  const [workspaceSummary, setWorkspaceSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch opportunity data
  const fetchOpportunity = useCallback(async () => {
    if (!session?.access_token || !id) return;
    
    try {
      const response = await fetch(`${API_URL}/api/opportunities/${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Opportunity not found');
        } else {
          throw new Error('Failed to fetch');
        }
        return;
      }
      
      const data = await response.json();
      setOpportunity(data.opportunity);
      setWorkspaceSummary(data.workspace_summary);
      setError(null);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load opportunity');
    } finally {
      setLoading(false);
    }
  }, [id, session?.access_token]);
  
  useEffect(() => {
    fetchOpportunity();
  }, [fetchOpportunity]);
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">{error}</h2>
          <button
            onClick={() => navigate('/app/opportunities')}
            className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            data-testid="back-to-list"
          >
            Back to Opportunities
          </button>
        </div>
      </div>
    );
  }
  
  // Data context
  const dataValue = {
    opportunity,
    workspaceSummary,
    onRefresh: fetchOpportunity,
    session
  };
  
  // Tab configuration
  const tabs = [
    { id: 'command', label: 'Command Center', icon: Target, component: CommandCenterWrapper },
    { id: 'tender', label: 'Tender', icon: FileText, component: TenderSectionWrapper },
    { id: 'info', label: 'Information', icon: Info, component: InformationSectionWrapper }
  ];
  
  // Dock panels configuration
  const dockPanels = [
    { id: 'documents', label: 'Documents', icon: FolderOpen, badge: workspaceSummary?.document_count || null, component: DocumentsPanelWrapper },
    { id: 'rfis', label: 'RFIs', icon: HelpCircle, badge: workspaceSummary?.rfi_count || null, component: RFIsPanelWrapper },
    { id: 'communications', label: 'Communications', icon: MessageSquare, component: CommunicationsPanelWrapper },
    { id: 'site-notes', label: 'Site Notes', icon: MapPin, component: SiteNotesPanelWrapper }
  ];
  
  return (
    <OpportunityDataContext.Provider value={dataValue}>
      <WorkspaceShell
        workspaceId={`opportunity_${id}`}
        workspaceType="opportunity"
        header={
          <OpportunityHeader
            opportunity={opportunity}
            workspaceSummary={workspaceSummary}
            onRefresh={fetchOpportunity}
            session={session}
          />
        }
        tabs={tabs}
        defaultTab="command"
        timeline={
          <TimelinePanel
            opportunityId={id}
            session={session}
          />
        }
        dockPanels={dockPanels}
      />
    </OpportunityDataContext.Provider>
  );
}
