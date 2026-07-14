/**
 * EstimateBuilder.jsx
 * ====================
 * VERTICAL SLICE #1: The First Complete TradeOS Workflow
 * 
 * Workflow:
 * 1. Create/Open Estimate (from Opportunity)
 * 2. Browse Production Standards (Production Library)
 * 3. Select Standards → Add to Estimate
 * 4. Adjust Quantities
 * 5. Automatic Totals
 * 6. Company Brain Review
 * 7. Save Estimate
 * 
 * RULES:
 * - Estimates NEVER exist independently (always tied to Opportunity)
 * - Flat Area structure (Areas only, no Phases/Divisions yet)
 * - Combined Unit Pricing (single unit cost)
 * - Company Brain reviews as Senior Estimator
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Minus,
  Search,
  ChevronRight,
  ChevronDown,
  Layers,
  DollarSign,
  Package,
  Sparkles,
  Save,
  Trash2,
  GripVertical,
  Check,
  AlertTriangle,
  Loader2,
  Calculator,
  Building2,
  X,
  FileText,
  RefreshCw,
  Eye
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Format currency
function formatCurrency(value) {
  if (value === null || value === undefined) return '$0';
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

// Format number
function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('en-CA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Production Standards Browser
 * Browse and select from Production Library
 */
function StandardsBrowser({ session, onAddToEstimate, addedItemIds }) {
  const [standards, setStandards] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(null);

  // Fetch domains and standards
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.access_token) return;
      
      try {
        setLoading(true);
        
        // Fetch domains
        const domainsRes = await fetch(`${API_URL}/api/production-library/domains`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        
        if (domainsRes.ok) {
          const data = await domainsRes.json();
          setDomains(data.domains || []);
        }
        
        // Fetch all standards
        const standardsRes = await fetch(`${API_URL}/api/production-library/items?per_page=100`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        
        if (standardsRes.ok) {
          const data = await standardsRes.json();
          setStandards(data.items || []);
        }
      } catch (err) {
        console.error('Error fetching standards:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [session?.access_token]);

  // Filter standards
  const filteredStandards = useMemo(() => {
    return standards.filter(std => {
      // Domain filter
      if (selectedDomain && std.knowledge_domain_id !== selectedDomain) return false;
      
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          std.production_code?.toLowerCase().includes(searchLower) ||
          std.production_name?.toLowerCase().includes(searchLower) ||
          std.description?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [standards, selectedDomain, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" data-testid="standards-browser">
      {/* Search */}
      <div className="p-4 border-b border-neutral-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Production Standards..."
            className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-emerald-500/50"
            data-testid="standards-search"
          />
        </div>
      </div>

      {/* Domain Filter */}
      <div className="p-3 border-b border-neutral-800 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedDomain(null)}
          className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
            !selectedDomain 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-neutral-800 text-white/60 border border-neutral-700 hover:text-white'
          }`}
        >
          All
        </button>
        {domains.slice(0, 5).map(domain => (
          <button
            key={domain.id}
            onClick={() => setSelectedDomain(domain.id)}
            className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
              selectedDomain === domain.id 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-neutral-800 text-white/60 border border-neutral-700 hover:text-white'
            }`}
          >
            {domain.name}
          </button>
        ))}
      </div>

      {/* Standards List */}
      <div className="flex-1 overflow-y-auto">
        {filteredStandards.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Package className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-white/50 text-sm">No standards found</p>
            <p className="text-white/30 text-xs mt-1">Try a different search or domain</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/50">
            {filteredStandards.map(standard => {
              const isAdded = addedItemIds.has(standard.id);
              return (
                <div
                  key={standard.id}
                  className="px-4 py-3 hover:bg-white/5 transition-colors group"
                  data-testid={`standard-item-${standard.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-emerald-400">
                          {standard.production_code}
                        </span>
                        {standard.is_company_standard && (
                          <span className="px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 rounded">
                            Standard
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/90 font-medium truncate">
                        {standard.production_name}
                      </p>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-white/50">
                        <span>{standard.measurement_units?.code || 'EA'}</span>
                        <span>{formatCurrency(standard.standard_rate || 0)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => !isAdded && onAddToEstimate(standard)}
                      disabled={isAdded}
                      className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                        isAdded
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-white/5 text-white/40 hover:bg-emerald-500/20 hover:text-emerald-400 group-hover:opacity-100 opacity-0'
                      }`}
                      data-testid={`add-standard-${standard.id}`}
                    >
                      {isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
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

/**
 * Estimate Line Item Row
 * Individual line item with quantity editing
 */
function EstimateLineItem({ item, onUpdate, onDelete }) {
  const [quantity, setQuantity] = useState(item.quantity || 1);
  const [editing, setEditing] = useState(false);

  // Sync quantity when item changes
  useEffect(() => {
    setQuantity(item.quantity || 1);
  }, [item.quantity]);

  const handleQuantityChange = (newQty) => {
    const qty = Math.max(0.01, parseFloat(newQty) || 1);
    setQuantity(qty);
    onUpdate(item.id, { quantity: qty });
  };

  // Get the unit price from the item (material_unit_cost for Combined Unit Pricing)
  const unitPrice = item.unit_price || item.material_unit_cost || item.standard_rate || 0;
  // Always calculate line total from current quantity state (not stale item.line_total)
  const lineTotal = unitPrice * quantity;

  return (
    <div 
      className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 border-b border-neutral-800/50 group"
      data-testid={`line-item-${item.id}`}
    >
      {/* Drag Handle */}
      <div className="text-white/20 cursor-grab hover:text-white/40">
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Item Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-emerald-400/80">
            {item.production_code || item.code || '—'}
          </span>
        </div>
        <p className="text-sm text-white/90 truncate">{item.name}</p>
      </div>

      {/* Quantity */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleQuantityChange(quantity - 1)}
          className="p-1 text-white/40 hover:text-white hover:bg-white/10 rounded transition-colors"
          data-testid={`decrease-qty-${item.id}`}
        >
          <Minus className="w-3 h-3" />
        </button>
        <input
          type="number"
          value={quantity}
          onChange={(e) => handleQuantityChange(e.target.value)}
          className="w-16 text-center py-1 bg-neutral-900 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:border-emerald-500/50"
          data-testid={`quantity-input-${item.id}`}
        />
        <button
          onClick={() => handleQuantityChange(quantity + 1)}
          className="p-1 text-white/40 hover:text-white hover:bg-white/10 rounded transition-colors"
          data-testid={`increase-qty-${item.id}`}
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Unit */}
      <div className="w-12 text-center">
        <span className="text-xs text-white/50">{item.unit || 'EA'}</span>
      </div>

      {/* Unit Price */}
      <div className="w-24 text-right">
        <span className="text-sm text-white/60">
          {formatCurrency(unitPrice)}
        </span>
      </div>

      {/* Line Total */}
      <div className="w-28 text-right">
        <span className="text-sm font-mono text-white">
          {formatCurrency(lineTotal)}
        </span>
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(item.id)}
        className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded transition-all opacity-0 group-hover:opacity-100"
        data-testid={`delete-item-${item.id}`}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

/**
 * Area Section
 * Expandable section containing line items
 */
function AreaSection({ area, items, onUpdateItem, onDeleteItem, onDeleteArea }) {
  const [expanded, setExpanded] = useState(true);
  
  // Calculate area total from current item quantities (not stale line_total)
  const areaTotal = items.reduce((sum, item) => {
    const unitPrice = item.unit_price || item.material_unit_cost || item.standard_rate || 0;
    const qty = item.quantity || 1;
    return sum + (unitPrice * qty);
  }, 0);

  return (
    <div className="border border-neutral-800 rounded-lg overflow-hidden mb-4" data-testid={`area-section-${area.id}`}>
      {/* Area Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 bg-neutral-900/50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-white/50" />
          ) : (
            <ChevronRight className="w-4 h-4 text-white/50" />
          )}
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400/70" />
            <span className="text-sm font-medium text-white">{area.name}</span>
            <span className="text-xs text-white/40">({items.length} items)</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm text-emerald-400">
            {formatCurrency(areaTotal)}
          </span>
        </div>
      </div>

      {/* Area Items */}
      {expanded && (
        <div>
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-white/40 text-sm">No items in this area yet</p>
              <p className="text-white/30 text-xs mt-1">Select standards from the library to add</p>
            </div>
          ) : (
            items.map(item => (
              <EstimateLineItem
                key={item.id}
                item={item}
                onUpdate={onUpdateItem}
                onDelete={onDeleteItem}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Company Brain Review Panel
 * AI-powered estimate review and insights
 */
function CompanyBrainReview({ estimate, items }) {
  const [insights, setInsights] = useState([]);
  
  useEffect(() => {
    // Generate mock insights based on estimate data
    const newInsights = [];
    
    if (items.length === 0) {
      newInsights.push({
        type: 'warning',
        title: 'Empty Estimate',
        message: 'Add items from your Production Standards to begin building your estimate.'
      });
    } else {
      // Check for completeness
      if (items.length < 3) {
        newInsights.push({
          type: 'info',
          title: 'Limited Scope',
          message: 'Consider adding more items to ensure complete coverage.'
        });
      }
      
      // Check totals
      const total = items.reduce((sum, item) => {
        const unitPrice = item.unit_price || item.material_unit_cost || item.standard_rate || 0;
        const qty = item.quantity || 1;
        return sum + (unitPrice * qty);
      }, 0);
      
      if (total > 50000) {
        newInsights.push({
          type: 'success',
          title: 'Substantial Project',
          message: `Total of ${formatCurrency(total)} qualifies for priority scheduling.`
        });
      }
      
      // Check for missing common items
      newInsights.push({
        type: 'info',
        title: 'Review Suggestion',
        message: 'Based on similar projects, consider adding site prep and cleanup items.'
      });
    }
    
    setInsights(newInsights);
  }, [items]);

  return (
    <div className="h-full flex flex-col" data-testid="brain-review-panel">
      <div className="p-4 border-b border-neutral-800">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-medium text-white">Company Brain</h3>
        </div>
        <p className="text-xs text-white/50">Senior Estimator Review</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {insights.map((insight, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg border ${
              insight.type === 'warning' 
                ? 'bg-amber-500/10 border-amber-500/20'
                : insight.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20'
                : 'bg-white/5 border-neutral-800'
            }`}
          >
            <div className="flex items-start gap-2">
              {insight.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              ) : insight.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <Eye className="w-4 h-4 text-white/50 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-medium text-white">{insight.title}</p>
                <p className="text-xs text-white/60 mt-1">{insight.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Estimate Summary Footer
 * Totals and actions
 */
function EstimateSummary({ items, onSave, saving }) {
  const calculations = useMemo(() => {
    // Calculate subtotal from current quantities (not stale line_total)
    const subtotal = items.reduce((sum, item) => {
      const unitPrice = item.unit_price || item.material_unit_cost || item.standard_rate || 0;
      const qty = item.quantity || 1;
      return sum + (unitPrice * qty);
    }, 0);
    
    const markup = subtotal * 0.10; // 10% default markup
    const taxRate = 0.12; // 12% BC tax
    const tax = (subtotal + markup) * taxRate;
    const total = subtotal + markup + tax;
    
    return { subtotal, markup, tax, total };
  }, [items]);

  return (
    <div className="border-t border-neutral-800 bg-neutral-900/50 px-6 py-4" data-testid="estimate-summary">
      <div className="flex items-center justify-between">
        {/* Totals */}
        <div className="flex items-center gap-8">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider">Subtotal</p>
            <p className="text-lg font-mono text-white">{formatCurrency(calculations.subtotal)}</p>
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider">Markup (10%)</p>
            <p className="text-lg font-mono text-white/70">{formatCurrency(calculations.markup)}</p>
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider">Tax (12%)</p>
            <p className="text-lg font-mono text-white/70">{formatCurrency(calculations.tax)}</p>
          </div>
          <div className="pl-4 border-l border-neutral-700">
            <p className="text-xs text-emerald-400/70 uppercase tracking-wider">Total</p>
            <p className="text-2xl font-mono text-emerald-400">{formatCurrency(calculations.total)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onSave}
            disabled={saving || items.length === 0}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
            data-testid="save-estimate-btn"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Estimate
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Main EstimateBuilder Component
 */
export default function EstimateBuilder({ opportunity, session, onRefresh }) {
  // State
  const [tender, setTender] = useState(null);
  const [areas, setAreas] = useState([{ id: 'default', name: 'General' }]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Track which standards have been added
  const addedItemIds = useMemo(() => new Set(items.map(i => i.production_item_id)), [items]);

  // Fetch or create tender
  useEffect(() => {
    const initializeEstimate = async () => {
      if (!session?.access_token || !opportunity?.id) return;

      try {
        setLoading(true);

        // First, check if tender exists
        const oppRes = await fetch(`${API_URL}/api/opportunities/${opportunity.id}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });

        if (!oppRes.ok) throw new Error('Failed to fetch opportunity');
        
        const oppData = await oppRes.json();
        const currentTenderId = oppData.workspace_summary?.current_tender?.id;

        if (currentTenderId) {
          // Fetch existing tender
          const tenderRes = await fetch(`${API_URL}/api/tenders/${currentTenderId}`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });

          if (tenderRes.ok) {
            const tenderData = await tenderRes.json();
            setTender(tenderData.tender);
            
            // Load sections as areas
            if (tenderData.sections?.length > 0) {
              setAreas(tenderData.sections.map(s => ({ id: s.id, name: s.name })));
            }
            
            // Load all items
            const allItems = [
              ...(tenderData.unsectioned_items || []),
              ...(tenderData.sections?.flatMap(s => s.items || []) || [])
            ];
            setItems(allItems);
          }
        } else {
          // Create new tender
          const createRes = await fetch(`${API_URL}/api/tenders`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ opportunity_id: opportunity.id })
          });

          if (createRes.ok) {
            const data = await createRes.json();
            setTender(data.tender);
            onRefresh?.();
          }
        }

        setError(null);
      } catch (err) {
        console.error('Error initializing estimate:', err);
        setError('Failed to load estimate');
      } finally {
        setLoading(false);
      }
    };

    initializeEstimate();
  }, [session?.access_token, opportunity?.id, onRefresh]);

  // Add standard to estimate
  const handleAddToEstimate = async (standard) => {
    if (!tender?.id || !session?.access_token) return;

    try {
      // Production Library is the single source of truth
      // Pull ALL available metadata from the standard
      const unitPrice = standard.standard_rate || 0;
      
      const response = await fetch(`${API_URL}/api/tenders/${tender.id}/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Core identification
          name: standard.production_name,
          description: standard.description || '',
          unit: standard.measurement_units?.code || 'EA',
          quantity: 1,
          
          // Pricing from Production Library
          material_quantity: 1,
          material_unit_cost: unitPrice,
          
          // Additional rates (when available)
          low_rate: standard.low_labour_rate || null,
          standard_rate: standard.standard_rate || null,
          premium_rate: standard.premium_labour_rate || standard.premium_rate || null,
          material_rate: standard.material_rate || null,
          equipment_rate: standard.equipment_rate || null,
          
          // Production metrics
          crew_size: standard.crew_size || 1,
          production_per_day: standard.production_per_day || null,
          production_output: standard.production_output || null,
          
          // Classification
          trade_discipline: standard.trade_discipline || null,
          cost_code: standard.cost_code || null,
          
          // Source tracking
          production_item_id: standard.id,
          production_source: 'library'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setItems(prev => [...prev, {
          ...data.item,
          // Preserve Production Library metadata for display
          production_code: standard.production_code,
          standard_rate: unitPrice,
          low_rate: standard.low_labour_rate,
          premium_rate: standard.premium_labour_rate || standard.premium_rate,
          crew_size: standard.crew_size,
          trade_discipline: standard.trade_discipline,
          cost_code: standard.cost_code
        }]);
      }
    } catch (err) {
      console.error('Error adding item:', err);
    }
  };

  // Update item quantity
  const handleUpdateItem = async (itemId, updates) => {
    if (!tender?.id || !session?.access_token) return;

    // Find the item to get its unit price
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // Optimistic update
    setItems(prev => prev.map(i => 
      i.id === itemId ? { ...i, ...updates } : i
    ));

    try {
      // For Combined Unit Pricing: update material_quantity to match quantity
      // This keeps the unit_price calculation correct
      const patchData = {
        ...updates,
        material_quantity: updates.quantity || item.quantity
      };
      
      await fetch(`${API_URL}/api/tenders/${tender.id}/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(patchData)
      });
    } catch (err) {
      console.error('Error updating item:', err);
    }
  };

  // Delete item
  const handleDeleteItem = async (itemId) => {
    if (!tender?.id || !session?.access_token) return;

    // Optimistic update
    setItems(prev => prev.filter(item => item.id !== itemId));

    try {
      await fetch(`${API_URL}/api/tenders/${tender.id}/items/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  // Save estimate
  const handleSave = async () => {
    if (!tender?.id || !session?.access_token) return;

    try {
      setSaving(true);
      
      // Just refresh to get updated totals
      const tenderRes = await fetch(`${API_URL}/api/tenders/${tender.id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (tenderRes.ok) {
        const data = await tenderRes.json();
        setTender(data.tender);
      }

      onRefresh?.();
    } catch (err) {
      console.error('Error saving estimate:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-white/50 text-sm">Loading estimate...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <p className="text-white/70">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-500/10 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]" data-testid="estimate-builder">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Calculator className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Estimate Builder</h2>
            <p className="text-sm text-white/50">
              {opportunity?.name || 'Untitled Opportunity'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full font-mono">
            v{tender?.version_number || 1}
          </span>
          <span className="px-3 py-1 bg-white/10 text-white/60 rounded-full">
            {tender?.status || 'draft'}
          </span>
        </div>
      </div>

      {/* Main Content: 3-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Standards Browser */}
        <div className="w-80 border-r border-neutral-800 flex flex-col bg-[#111111]">
          <div className="p-4 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-medium text-white">Production Standards</h3>
            </div>
            <p className="text-xs text-white/50 mt-1">Select items to add to estimate</p>
          </div>
          <div className="flex-1 overflow-hidden">
            <StandardsBrowser
              session={session}
              onAddToEstimate={handleAddToEstimate}
              addedItemIds={addedItemIds}
            />
          </div>
        </div>

        {/* Center Panel: Estimate */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Items Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-800 bg-[#111111]">
            <div className="flex items-center gap-4">
              <span className="text-sm text-white/70">
                {items.length} item{items.length !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
              data-testid="add-area-btn"
            >
              <Plus className="w-3 h-3" />
              Add Area
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-white/20" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">Start Building Your Estimate</h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    Browse your Production Standards on the left and click the + button to add items to your estimate. Quantities can be adjusted after adding.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                {/* Column Headers */}
                <div className="flex items-center gap-4 px-4 py-2 text-xs text-white/40 uppercase tracking-wider border-b border-neutral-800 mb-2">
                  <div className="w-4" /> {/* Drag handle space */}
                  <div className="flex-1">Item</div>
                  <div className="w-24 text-center">Qty</div>
                  <div className="w-12 text-center">Unit</div>
                  <div className="w-24 text-right">Unit Price</div>
                  <div className="w-28 text-right">Total</div>
                  <div className="w-8" /> {/* Delete button space */}
                </div>

                {/* Area Section (Default for now) */}
                <AreaSection
                  area={areas[0]}
                  items={items}
                  onUpdateItem={handleUpdateItem}
                  onDeleteItem={handleDeleteItem}
                  onDeleteArea={() => {}}
                />
              </div>
            )}
          </div>

          {/* Summary Footer */}
          <EstimateSummary
            items={items}
            onSave={handleSave}
            saving={saving}
          />
        </div>

        {/* Right Panel: Company Brain Review */}
        <div className="w-72 border-l border-neutral-800 bg-[#111111]">
          <CompanyBrainReview estimate={tender} items={items} />
        </div>
      </div>
    </div>
  );
}
