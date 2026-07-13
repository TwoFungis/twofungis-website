/**
 * TenderSection.jsx
 * =================
 * The Tender workspace where estimates are built and proposals created.
 * Contains sub-tabs: Estimate, Proposal, History
 * 
 * VERTICAL SLICE #1: Estimate tab now uses the full EstimateBuilder
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  FileText,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Clock,
  Send,
  History,
  Layers,
  Settings,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useWorkspace } from './WorkspaceShell';
import EstimateBuilder from '../estimate/EstimateBuilder';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ============================================================
// FORMAT HELPERS
// ============================================================

function formatCurrency(value) {
  if (!value && value !== 0) return '$0';
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

// ============================================================
// TENDER SECTION COMPONENT
// ============================================================

export default function TenderSection({ opportunity, workspaceSummary, onRefresh, session }) {
  const { setCurrentFocus, isSectionExpanded, toggleSection } = useWorkspace();
  const [activeSubTab, setActiveSubTab] = useState('estimate');
  const [tender, setTender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Fetch current tender
  useEffect(() => {
    const fetchTender = async () => {
      if (!workspaceSummary?.current_tender?.id || !session?.access_token) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`${API_URL}/api/tenders/${workspaceSummary.current_tender.id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setTender(data);
          setCurrentFocus('estimating', { tenderId: data.tender?.id });
        }
      } catch (err) {
        console.error('Error fetching tender:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTender();
  }, [workspaceSummary?.current_tender?.id, session?.access_token, setCurrentFocus]);
  
  // Create new tender
  const handleCreateTender = async () => {
    if (!session?.access_token || creating) return;
    
    try {
      setCreating(true);
      const response = await fetch(`${API_URL}/api/tenders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ opportunity_id: opportunity.id })
      });
      
      if (response.ok) {
        const data = await response.json();
        setTender({ tender: data.tender, sections: [], unsectioned_items: [] });
        setCurrentFocus('estimating', { tenderId: data.tender.id });
        onRefresh();
      }
    } catch (err) {
      console.error('Error creating tender:', err);
    } finally {
      setCreating(false);
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
      </div>
    );
  }
  
  // VERTICAL SLICE #1: Always show EstimateBuilder (it handles tender creation internally)
  // No need for separate "No Tender" state - EstimateBuilder auto-creates when needed
  
  const currentTender = tender?.tender || workspaceSummary?.current_tender;
  const sections = tender?.sections || [];

  return (
    <div className="space-y-6" data-testid="tender-section">
      {/* Header with sub-tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-[#111111] border border-[#262626] rounded-lg p-1">
          {[
            { id: 'estimate', label: 'Estimate', icon: DollarSign },
            { id: 'proposal', label: 'Proposal', icon: FileText },
            { id: 'history', label: 'History', icon: History }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
                  isActive ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
                }`}
                data-testid={`subtab-${tab.id}`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
        
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 text-xs font-mono bg-purple-500/20 text-purple-400 rounded-full">
            v{currentTender?.version_number || 1}
          </span>
          <span className={`px-3 py-1 text-xs font-mono rounded-full ${
            currentTender?.status === 'draft' 
              ? 'bg-amber-500/20 text-amber-400'
              : currentTender?.status === 'submitted'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-white/10 text-white/60'
          }`}>
            {currentTender?.status || 'draft'}
          </span>
        </div>
      </div>
      
      {/* Estimate View - VERTICAL SLICE #1: Full EstimateBuilder */}
      {activeSubTab === 'estimate' && (
        <div className="h-[calc(100vh-280px)]">
          <EstimateBuilder
            opportunity={opportunity}
            session={session}
            onRefresh={onRefresh}
          />
        </div>
      )}
      
      {/* Proposal View */}
      {activeSubTab === 'proposal' && (
        <div className="bg-[#111111] border border-[#262626] rounded-xl p-8 text-center">
          <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Proposal Preview</h3>
          <p className="text-white/50 mb-6">
            Generate a professional proposal from your estimate to send to the client.
          </p>
          <button className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
            Generate Proposal
          </button>
        </div>
      )}
      
      {/* History View */}
      {activeSubTab === 'history' && (
        <div className="bg-[#111111] border border-[#262626] rounded-xl p-8 text-center">
          <History className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Version History</h3>
          <p className="text-white/50">
            {tender?.versions?.length || 0} submitted versions
          </p>
        </div>
      )}
    </div>
  );
}
