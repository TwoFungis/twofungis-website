/**
 * EstimateBuilder.jsx - Estimate Workbench Builder Panel
 * =======================================================
 * 
 * Center panel of the 3-panel Estimate Workbench layout.
 * Contains the estimate line items with inline editing.
 * 
 * Features:
 * - Line item table/list
 * - Inline quantity, price override editing
 * - Drag-and-drop reordering
 * - Add/remove items
 * - Group by domain/category
 */

import React, { useState, useCallback } from 'react';
import {
  GripVertical,
  Trash2,
  Edit3,
  Plus,
  ChevronDown,
  ChevronUp,
  Package,
  Calculator
} from 'lucide-react';

const EstimateBuilder = ({
  lineItems = [],
  onUpdateItem,
  onRemoveItem,
  onReorderItems,
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
      groups[groupKey].push({ ...item, originalIndex: index });
    });
    return groups;
  }, [lineItems]);
  
  const startEditing = (item) => {
    setEditingItemId(item.id);
    setEditValues({
      quantity: item.quantity,
      unit_price: item.unit_price,
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
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-medium text-white">Estimate Items</h2>
          <span className="text-sm text-neutral-500">({lineItems.length} items)</span>
        </div>
      </div>
      
      {/* Line Items */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedItems).map(([groupKey, items]) => {
          const isExpanded = expandedGroups.has(groupKey) || expandedGroups.has('all');
          const groupTotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
          
          return (
            <div key={groupKey} className="border-b border-neutral-800/50">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(groupKey)}
                className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900/50 hover:bg-neutral-900 transition-colors"
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
                <div className="divide-y divide-neutral-800/50">
                  {items.map((item) => {
                    const isItemEditing = editingItemId === item.id;
                    const itemTotal = item.quantity * item.unit_price;
                    
                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-neutral-900/30 transition-colors group"
                        data-testid={`line-item-${item.id}`}
                      >
                        {/* Drag Handle */}
                        {isEditing && (
                          <div className="mt-1 cursor-grab opacity-0 group-hover:opacity-50 hover:!opacity-100">
                            <GripVertical className="w-4 h-4 text-neutral-500" />
                          </div>
                        )}
                        
                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {item.production_name}
                              </p>
                              <p className="text-xs text-neutral-500 mt-0.5">
                                {item.production_code} • {item.unit || 'ea'}
                              </p>
                            </div>
                            
                            {/* Item Actions */}
                            {isEditing && !isItemEditing && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => startEditing(item)}
                                  className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onRemoveItem?.(item.id)}
                                  className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                  title="Remove"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {/* Quantity & Price */}
                          {isItemEditing ? (
                            <div className="flex items-center gap-3 mt-2">
                              <div>
                                <label className="text-[10px] text-neutral-500 uppercase">Qty</label>
                                <input
                                  type="number"
                                  value={editValues.quantity}
                                  onChange={(e) => setEditValues({ ...editValues, quantity: parseFloat(e.target.value) || 0 })}
                                  className="w-20 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-emerald-500"
                                  data-testid="edit-quantity-input"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-neutral-500 uppercase">Price</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editValues.unit_price}
                                  onChange={(e) => setEditValues({ ...editValues, unit_price: parseFloat(e.target.value) || 0 })}
                                  className="w-24 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-emerald-500"
                                  data-testid="edit-price-input"
                                />
                              </div>
                              <div className="flex items-center gap-2 mt-4">
                                <button
                                  onClick={() => saveEditing(item)}
                                  className="px-3 py-1 bg-emerald-500 text-black text-xs font-medium rounded hover:bg-emerald-400 transition-colors"
                                  data-testid="inline-edit-save-btn"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="px-3 py-1 text-neutral-400 text-xs hover:text-white transition-colors"
                                  data-testid="inline-edit-cancel-btn"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-4 mt-2 text-xs">
                              <span className="text-neutral-400">
                                {item.quantity} × {formatCurrency(item.unit_price)}
                              </span>
                              <span className="font-medium text-emerald-400">
                                = {formatCurrency(itemTotal)}
                              </span>
                            </div>
                          )}
                          
                          {/* Notes */}
                          {item.notes && !isItemEditing && (
                            <p className="text-xs text-neutral-500 mt-1 italic">
                              {item.notes}
                            </p>
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
