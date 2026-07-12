/**
 * TenderWorkspaceTab.jsx
 * ======================
 * The active workspace for building estimates and preparing tenders.
 * This is where the real work happens during the TENDERING stage.
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  FileText,
  DollarSign,
  Clock,
  Users,
  Layers,
  ChevronRight,
  Settings,
  Loader2,
  AlertCircle
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function formatCurrency(value) {
  if (!value && value !== 0) return '—';
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

export default function TenderWorkspaceTab({ opportunity, workspaceSummary, onRefresh, session }) {
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
        }
      } catch (err) {
        console.error('Error fetching tender:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTender();
  }, [workspaceSummary?.current_tender?.id, session?.access_token]);

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
        body: JSON.stringify({
          opportunity_id: opportunity.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTender({ tender: data.tender, sections: [], unsectioned_items: [] });
        onRefresh();
      }
    } catch (err) {
      console.error('Error creating tender:', err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
      </div>
    );
  }

  // No tender yet - show create state
  if (!tender && !workspaceSummary?.current_tender) {
    return (
      <div className="max-w-md mx-auto py-20 text-center" data-testid="no-tender-state">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#111111] border border-[#262626] flex items-center justify-center">
          <FileText className="w-8 h-8 text-white/40" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-3">No Tender Started</h2>
        <p className="text-white/50 mb-8 leading-relaxed">
          Create a tender to begin estimating this opportunity. 
          You can add line items, sections, and build your complete proposal.
        </p>
        <button
          onClick={handleCreateTender}
          disabled={creating}
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
          data-testid="create-tender-btn"
        >
          {creating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Create Tender
        </button>
      </div>
    );
  }

  const currentTender = tender?.tender || workspaceSummary?.current_tender;
  const sections = tender?.sections || [];
  const unsectionedItems = tender?.unsectioned_items || [];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="tender-workspace-tab">
      {/* Tender Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-semibold text-white">
              Tender v{currentTender?.version_number || 1}
            </h2>
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
          <p className="text-white/50 text-sm">
            {currentTender?.version_label || `Version ${currentTender?.version_number || 1}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="px-4 py-2 text-sm text-white/70 hover:text-white border border-[#262626] hover:border-white/30 rounded-lg transition-colors"
            data-testid="tender-settings-btn"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111111] border border-[#262626] rounded-xl p-5">
          <p className="text-xs font-mono uppercase tracking-[0.15em] text-white/40 mb-2">Subtotal</p>
          <p className="text-2xl font-mono text-white">{formatCurrency(currentTender?.subtotal || 0)}</p>
        </div>
        <div className="bg-[#111111] border border-[#262626] rounded-xl p-5">
          <p className="text-xs font-mono uppercase tracking-[0.15em] text-white/40 mb-2">Markup</p>
          <p className="text-2xl font-mono text-white">{formatCurrency(currentTender?.markup_amount || 0)}</p>
        </div>
        <div className="bg-[#111111] border border-[#262626] rounded-xl p-5">
          <p className="text-xs font-mono uppercase tracking-[0.15em] text-white/40 mb-2">Tax</p>
          <p className="text-2xl font-mono text-white">{formatCurrency(currentTender?.tax_amount || 0)}</p>
        </div>
        <div className="bg-[#111111] border border-emerald-500/30 rounded-xl p-5">
          <p className="text-xs font-mono uppercase tracking-[0.15em] text-emerald-400/70 mb-2">Total</p>
          <p className="text-2xl font-mono text-emerald-400">{formatCurrency(currentTender?.total || 0)}</p>
        </div>
      </div>

      {/* Sections & Line Items */}
      <div className="bg-[#111111] border border-[#262626] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#262626]">
          <h3 className="text-sm font-medium text-white/80">Line Items</h3>
          <button
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
            data-testid="add-section-btn"
          >
            <Plus className="w-4 h-4" />
            Add Section
          </button>
        </div>

        {sections.length === 0 && unsectionedItems.length === 0 ? (
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
              <div key={section.id} className="bg-[#0d0d0d]">
                <div className="flex items-center justify-between px-5 py-3 bg-[#151515]">
                  <span className="text-sm font-medium text-white/70">{section.name}</span>
                  <span className="font-mono text-sm text-white/50">{formatCurrency(section.subtotal)}</span>
                </div>
                {section.items?.map((item) => (
                  <div key={item.id} className="flex items-center px-5 py-3 hover:bg-white/5 cursor-pointer">
                    <div className="flex-1">
                      <p className="text-sm text-white/80">{item.name}</p>
                      <p className="text-xs text-white/40">{item.description}</p>
                    </div>
                    <span className="font-mono text-sm text-white/60">{formatCurrency(item.line_total)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Valid Until */}
      {currentTender?.valid_until && (
        <p className="text-center text-sm text-white/40">
          This tender is valid until {formatDate(currentTender.valid_until)}
        </p>
      )}
    </div>
  );
}
