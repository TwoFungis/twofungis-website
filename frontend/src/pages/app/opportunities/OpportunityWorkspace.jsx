/**
 * OpportunityWorkspace.jsx
 * ========================
 * The single most important UI in TradeOS.
 * This is the "home" for a piece of work from discovery to project.
 * 
 * Design Principles:
 * - Calm, premium, focused
 * - User immediately knows: where they are, what stage, what needs attention
 * - Each tab feels like entering another room in the same workspace
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  FileText,
  MessageSquare,
  HelpCircle,
  ClipboardList,
  CalendarDays,
  Activity,
  Sparkles,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Edit3,
  Archive,
  Trash2,
  Copy
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import WorkspaceHeader from '../../../components/workspace/WorkspaceHeader';
import WorkspaceNav from '../../../components/workspace/WorkspaceNav';
import {
  OverviewTab,
  TenderWorkspaceTab,
  EstimateTab,
  ProposalTab,
  DocumentsTab,
  CommunicationsTab,
  RFIsTab,
  SiteNotesTab,
  ScheduleTab,
  ActivityTimelineTab,
  CompanyBrainTab
} from '../../../components/workspace/tabs';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Workspace tabs configuration
const WORKSPACE_TABS = [
  { id: 'overview', label: 'Overview', icon: ClipboardList },
  { id: 'tender', label: 'Tender Workspace', icon: FileText },
  { id: 'estimate', label: 'Estimate', icon: DollarSign },
  { id: 'proposal', label: 'Proposal', icon: FileText },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'communications', label: 'Communications', icon: MessageSquare },
  { id: 'rfis', label: 'RFIs', icon: HelpCircle },
  { id: 'site-notes', label: 'Site Notes', icon: MapPin },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'brain', label: 'Company Brain', icon: Sparkles },
];

export default function OpportunityWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { session } = useAuthStore();
  
  // State
  const [opportunity, setOpportunity] = useState(null);
  const [workspaceSummary, setWorkspaceSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Active tab from URL or default to overview
  const activeTab = searchParams.get('tab') || 'overview';
  
  const setActiveTab = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  // Fetch opportunity data
  const fetchOpportunity = useCallback(async () => {
    if (!session?.access_token || !id) return;
    
    try {
      setLoading(true);
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
          throw new Error('Failed to fetch opportunity');
        }
        return;
      }
      
      const data = await response.json();
      setOpportunity(data.opportunity);
      setWorkspaceSummary(data.workspace_summary);
      setError(null);
    } catch (err) {
      console.error('Error fetching opportunity:', err);
      setError('Failed to load opportunity');
    } finally {
      setLoading(false);
    }
  }, [id, session?.access_token]);

  useEffect(() => {
    fetchOpportunity();
  }, [fetchOpportunity]);

  // Refresh data after updates
  const handleRefresh = () => {
    fetchOpportunity();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-white/50 font-mono text-sm">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-white">{error}</h2>
          <p className="text-white/50">The opportunity you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.</p>
          <button 
            onClick={() => navigate('/app/opportunities')}
            className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            data-testid="back-to-opportunities"
          >
            Back to Opportunities
          </button>
        </div>
      </div>
    );
  }

  // Render active tab content
  const renderTabContent = () => {
    const tabProps = {
      opportunity,
      workspaceSummary,
      onRefresh: handleRefresh,
      session
    };

    switch (activeTab) {
      case 'overview':
        return <OverviewTab {...tabProps} />;
      case 'tender':
        return <TenderWorkspaceTab {...tabProps} />;
      case 'estimate':
        return <EstimateTab {...tabProps} />;
      case 'proposal':
        return <ProposalTab {...tabProps} />;
      case 'documents':
        return <DocumentsTab {...tabProps} />;
      case 'communications':
        return <CommunicationsTab {...tabProps} />;
      case 'rfis':
        return <RFIsTab {...tabProps} />;
      case 'site-notes':
        return <SiteNotesTab {...tabProps} />;
      case 'schedule':
        return <ScheduleTab {...tabProps} />;
      case 'activity':
        return <ActivityTimelineTab {...tabProps} />;
      case 'brain':
        return <CompanyBrainTab {...tabProps} />;
      default:
        return <OverviewTab {...tabProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]" data-testid="opportunity-workspace">
      {/* Workspace Header - Sticky */}
      <WorkspaceHeader 
        opportunity={opportunity}
        workspaceSummary={workspaceSummary}
        onRefresh={handleRefresh}
        session={session}
      />
      
      {/* Workspace Navigation - Sticky below header */}
      <WorkspaceNav 
        tabs={WORKSPACE_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        workspaceSummary={workspaceSummary}
      />
      
      {/* Tab Content */}
      <main className="max-w-[1600px] mx-auto px-6 lg:px-8 py-8">
        {renderTabContent()}
      </main>
    </div>
  );
}
