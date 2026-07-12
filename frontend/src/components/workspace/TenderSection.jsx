/**
 * TenderSection.jsx
 * =================
 * The Tender workspace where estimates are built and proposals created.
 * Contains sub-tabs: Estimate, Proposal, History
 * 
 * Progressive disclosure: Basic view by default, advanced features on demand
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
  
  // No tender state
  if (!tender && !workspaceSummary?.current_tender) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center" data-testid="no-tender">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#111111] border border-[#262626] flex items-center justify-center">
          <FileText className="w-8 h-8 text-white/30" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-3">No Tender Started</h2>
        <p className="text-white/50 mb-8 leading-relaxed">
          Create a tender to begin building your estimate. Add line items, sections, 
          and generate proposals for your client.
        </p>
        <button
          onClick={handleCreateTender}
          disabled={creating}
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
          data-testid="create-tender-btn"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Create Tender
        </button>
      </div>
    );
  }
  
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
      
      {/* Estimate View */}
      {activeSubTab === 'estimate' && (
        <div className="space-y-6">
          {/* Totals Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#111111] border border-[#262626] rounded-xl p-4">
              <p className="text-xs font-mono uppercase tracking-[0.15em] text-white/40 mb-1">Subtotal</p>
              <p className="text-xl font-mono text-white">{formatCurrency(currentTender?.subtotal)}</p>
            </div>
            <div className="bg-[#111111] border border-[#262626] rounded-xl p-4">
              <p className="text-xs font-mono uppercase tracking-[0.15em] text-white/40 mb-1">Markup</p>
              <p className="text-xl font-mono text-white">{formatCurrency(currentTender?.markup_amount)}</p>
            </div>
            <div className="bg-[#111111] border border-[#262626] rounded-xl p-4">
              <p className="text-xs font-mono uppercase tracking-[0.15em] text-white/40 mb-1">Tax</p>
              <p className="text-xl font-mono text-white">{formatCurrency(currentTender?.tax_amount)}</p>
            </div>
            <div className="bg-[#111111] border border-emerald-500/30 rounded-xl p-4">
              <p className="text-xs font-mono uppercase tracking-[0.15em] text-emerald-400/70 mb-1">Total</p>
              <p className="text-xl font-mono text-emerald-400">{formatCurrency(currentTender?.total)}</p>
            </div>
          </div>
          
          {/* Line Items */}
          <div className="bg-[#111111] border border-[#262626] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#262626]">
              <h3 className="text-sm font-medium text-white/80">Line Items</h3>
              <div className="flex items-center gap-2">
                <button
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                  data-testid="add-section-btn"
                >
                  <Plus className="w-4 h-4" />
                  Add Section
                </button>
              </div>
            </div>
            
            {sections.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Layers className="w-8 h-8 text-white/20 mx-auto mb-3" />
                <p className="text-white/50 mb-4">No line items yet</p>
                <button
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                  data-testid="add-first-item-btn"
                >
                  <Plus className="w-4 h-4" />
                  Add Line Item
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#262626]">
                {sections.map((section) => (
                  <div key={section.id}>
                    {/* Section header */}
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between px-5 py-3 bg-[#0d0d0d] hover:bg-[#151515] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isSectionExpanded(section.id) ? (
                          <ChevronDown className="w-4 h-4 text-white/40" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-white/40" />
                        )}
                        <span className="text-sm font-medium text-white/80">{section.name}</span>
                        <span className="text-xs text-white/40">{section.items?.length || 0} items</span>
                      </div>
                      <span className="font-mono text-sm text-white/60">{formatCurrency(section.subtotal)}</span>
                    </button>
                    
                    {/* Section items */}
                    {isSectionExpanded(section.id) && section.items?.map((item) => (
                      <div 
                        key={item.id}
                        className="flex items-center px-5 py-3 pl-12 hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white/80">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-white/40 truncate">{item.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-6">
                          <span className="text-xs font-mono text-white/40">
                            {item.quantity} {item.unit}
                          </span>
                          <span className="font-mono text-sm text-white/60 w-24 text-right">
                            {formatCurrency(item.line_total)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Submit Actions */}
          {currentTender?.status === 'draft' && (
            <div className="flex items-center justify-end gap-3">
              <button
                className="px-4 py-2 text-sm text-white/70 hover:text-white border border-[#262626] hover:border-white/30 rounded-lg transition-colors"
                data-testid="preview-btn"
              >
                Preview Proposal
              </button>
              <button
                className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
                data-testid="submit-tender-btn"
              >
                <Send className="w-4 h-4" />
                Submit Tender
              </button>
            </div>
          )}
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
