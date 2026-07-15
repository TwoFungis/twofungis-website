/**
 * EstimateBuilder.jsx - Estimate Workbench Builder Panel
 * =======================================================
 * 
 * Center panel of the 3-panel Estimate Workbench layout.
 * Contains the estimate line items with inline editing.
 * 
 * Features:
 * - Line item table with columns: Line, Production Item, Scope, Notes, Qty, Unit, Unit Price, Line Total
 * - Inline editing for all editable fields
 * - Price override tracking (doesn't affect Production Library)
 * - Group by domain
 * - Drag-and-drop reordering
 */

import React, { useState } from 'react';
import {
  GripVertical,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  Package,
  Calculator,
  Check,
  X,
  AlertCircle
} from 'lucide-react';

const EstimateBuilder = ({
  lineItems = [],
  onUpdateItem,
  onRemoveItem,
  onReorderItems,
  pricingProfile = 'Standard',
  isEditing = true
}) => {
  const [editingItemId, setEditingItemId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [expandedGroups, setExpandedGroups] = useState(new Set(['all']));
  
  // Group line items by domain
  const groupedItems = React.useMemo(() => {
    const groups = {};
    lineItems.forEach((item, index) => {
      const groupKey = item.domain_name || 'Other';
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push({ ...item, lineNumber: index + 1 });
    });
    return groups;
  }, [lineItems]);
  
  const startEditing = (item) => {
    setEditingItemId(item.id);
    setEditValues({
      quantity: item.quantity,
      unit_price: item.unit_price,
      scope: item.scope || '',
      notes: item.notes || ''
    });
  };
  
  const saveEditing = (item) => {
    onUpdateItem?.(item.id, editValues);
    setEditingItemId(null);
    setEditValues({});
  };
  
  const cancelEditing = () => {
    setEditingItemId(null);
    setEditValues({});
  };
  
  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };
  
  if (lineItems.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center" data-testid="estimate-builder-empty">
        <div className="w-16 h-16 bg-neutral-800/50 rounded-2xl flex items-center justify-center mb-4">
          <Calculator className="w-8 h-8 text-neutral-500" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Start Building Your Estimate</h3>
        <p className="text-sm text-neutral-400 max-w-sm">
          Browse the Production Library on the left and click items to add them to your estimate.
        </p>
      </div>
    );
  }
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden" data-testid="estimate-builder">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/30">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-medium text-white">Estimate Items</h2>
          <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded-full">{lineItems.length} items</span>
          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{pricingProfile} Rates</span>
        </div>
      </div>
      
      {/* Table Header */}
      <div className="hidden md:grid grid-cols-[40px_1fr_120px_120px_60px_70px_90px_100px_40px] gap-2 px-4 py-2 border-b border-neutral-800 bg-neutral-900/50 text-[10px] uppercase tracking-wider text-neutral-500 font-medium">
        <div>#</div>
        <div>Production Item</div>
        <div>Scope</div>
        <div>Notes</div>
        <div className="text-right">Qty</div>
        <div>Unit</div>
        <div className="text-right">Unit Price</div>
        <div className="text-right">Line Total</div>
        <div></div>
      </div>
      
      {/* Line Items - Independent scrolling container */}
      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ scrollbarGutter: 'stable' }}>
        {Object.entries(groupedItems).map(([groupKey, items]) => {
          const isExpanded = expandedGroups.has(groupKey) || expandedGroups.has('all');
          const groupTotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
          
          return (
            <div key={groupKey} className="border-b border-neutral-800/50">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(groupKey)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-neutral-900/50 hover:bg-neutral-900 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-neutral-500" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-neutral-500" />
                  )}
                  <span className="text-sm font-medium text-neutral-300">{groupKey}</span>
                  <span className="text-xs text-neutral-500">({items.length})</span>
                </div>
                <span className="text-sm font-medium text-emerald-400">
                  {formatCurrency(groupTotal)}
                </span>
              </button>
              
              {/* Group Items */}
              {isExpanded && (
                <div className="divide-y divide-neutral-800/30">
                  {items.map((item) => {
                    const isItemEditing = editingItemId === item.id;
                    const itemTotal = item.quantity * item.unit_price;
                    const hasOverride = item.unit_price_override !== null && item.unit_price_override !== undefined;
                    
                    return (
                      <div
                        key={item.id}
                        className={`group transition-colors ${
                          isItemEditing ? 'bg-neutral-900/50' : 'hover:bg-neutral-900/30'
                        }`}
                        data-testid={`line-item-${item.id}`}
                      >
                        {/* Desktop Row */}
                        <div className="hidden md:grid grid-cols-[40px_1fr_120px_120px_60px_70px_90px_100px_40px] gap-2 px-4 py-2.5 items-center">
                          {/* Line # */}
                          <div className="text-xs text-neutral-500 font-mono">{item.lineNumber}</div>
                          
                          {/* Production Item */}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{item.production_name}</p>
                            <p className="text-[10px] text-neutral-500 font-mono">{item.production_code}</p>
                          </div>
                          
                          {/* Scope */}
                          {isItemEditing ? (
                            <input
                              type="text"
                              value={editValues.scope}
                              onChange={(e) => setEditValues({ ...editValues, scope: e.target.value })}
                              placeholder="Scope..."
                              className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
                              data-testid="edit-scope-input"
                            />
                          ) : (
                            <span className="text-xs text-neutral-400 truncate">{item.scope || '-'}</span>
                          )}
                          
                          {/* Notes */}
                          {isItemEditing ? (
                            <input
                              type="text"
                              value={editValues.notes}
                              onChange={(e) => setEditValues({ ...editValues, notes: e.target.value })}
                              placeholder="Notes..."
                              className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
                              data-testid="edit-notes-input"
                            />
                          ) : (
                            <span className="text-xs text-neutral-400 truncate">{item.notes || '-'}</span>
                          )}
                          
                          {/* Quantity */}
                          {isItemEditing ? (
                            <input
                              type="number"
                              value={editValues.quantity}
                              onChange={(e) => setEditValues({ ...editValues, quantity: parseFloat(e.target.value) || 0 })}
                              className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-white text-right focus:outline-none focus:border-emerald-500"
                              data-testid="edit-quantity-input"
                            />
                          ) : (
                            <span className="text-xs text-white text-right font-medium">{item.quantity}</span>
                          )}
                          
                          {/* Unit */}
                          <span className="text-xs text-neutral-400 font-mono">{item.unit}</span>
                          
                          {/* Unit Price */}
                          {isItemEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editValues.unit_price}
                              onChange={(e) => setEditValues({ ...editValues, unit_price: parseFloat(e.target.value) || 0 })}
                              className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-white text-right focus:outline-none focus:border-emerald-500"
                              data-testid="edit-price-input"
                            />
                          ) : (
                            <div className="text-right">
                              <span className={`text-xs font-medium ${hasOverride ? 'text-amber-400' : 'text-white'}`}>
                                {formatCurrency(item.unit_price)}
                              </span>
                              {hasOverride && (
                                <AlertCircle className="inline-block w-3 h-3 ml-1 text-amber-400" title="Manual override" />
                              )}
                            </div>
                          )}
                          
                          {/* Line Total */}
                          <span className="text-xs font-medium text-emerald-400 text-right">{formatCurrency(itemTotal)}</span>
                          
                          {/* Actions */}
                          <div className="flex items-center justify-end gap-0.5">
                            {isItemEditing ? (
                              <>
                                <button
                                  onClick={() => saveEditing(item)}
                                  className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded transition-colors"
                                  data-testid="inline-edit-save-btn"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="p-1 text-neutral-400 hover:bg-neutral-800 rounded transition-colors"
                                  data-testid="inline-edit-cancel-btn"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : isEditing && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                                <button
                                  onClick={() => startEditing(item)}
                                  className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
                                  title="Edit"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onRemoveItem?.(item.id)}
                                  className="p-1 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                  title="Remove"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Mobile Layout */}
                        <div className="md:hidden px-4 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-neutral-500 font-mono">#{item.lineNumber}</span>
                                <span className="text-sm font-medium text-white truncate">{item.production_name}</span>
                              </div>
                              <p className="text-xs text-neutral-500 mt-0.5">{item.production_code} • {item.unit}</p>
                              {item.scope && <p className="text-xs text-neutral-400 mt-1">{item.scope}</p>}
                            </div>
                            {isEditing && !isItemEditing && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => startEditing(item)}
                                  className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => onRemoveItem?.(item.id)}
                                  className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {isItemEditing ? (
                            <div className="mt-3 space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] text-neutral-500 uppercase">Qty</label>
                                  <input
                                    type="number"
                                    value={editValues.quantity}
                                    onChange={(e) => setEditValues({ ...editValues, quantity: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm text-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-neutral-500 uppercase">Unit Price</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editValues.unit_price}
                                    onChange={(e) => setEditValues({ ...editValues, unit_price: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm text-white"
                                  />
                                </div>
                              </div>
                              <input
                                type="text"
                                value={editValues.scope}
                                onChange={(e) => setEditValues({ ...editValues, scope: e.target.value })}
                                placeholder="Scope..."
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm text-white placeholder-neutral-600"
                              />
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => saveEditing(item)}
                                  className="flex-1 px-3 py-1.5 bg-emerald-500 text-black text-sm font-medium rounded"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="px-3 py-1.5 text-neutral-400 text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between mt-2 text-sm">
                              <span className="text-neutral-400">
                                {item.quantity} × {formatCurrency(item.unit_price)}
                              </span>
                              <span className="font-medium text-emerald-400">{formatCurrency(itemTotal)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EstimateBuilder;
