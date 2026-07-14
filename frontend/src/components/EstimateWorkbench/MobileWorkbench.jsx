/**
 * MobileWorkbench.jsx - Mobile Estimate Workbench
 * =================================================
 * 
 * Mobile-specific layout for the Estimate Workbench.
 * Uses a full-screen approach with sliding panels.
 * 
 * - Estimate list is primary view
 * - Library opens as full-screen modal
 * - Summary slides up from bottom
 */

import React, { useState } from 'react';
import {
  Library,
  Calculator,
  ChevronUp,
  ChevronDown,
  X,
  ArrowLeft,
  Plus,
  FileText
} from 'lucide-react';
import LibraryBrowser from './LibraryBrowser';
import EstimateBuilder from './EstimateBuilder';

const MobileWorkbench = ({
  lineItems = [],
  domains = [],
  categories = [],
  standards = [],
  isLoadingLibrary = false,
  calculations = {},
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onExportPDF
}) => {
  const [showLibrary, setShowLibrary] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };
  
  return (
    <div className="h-full flex flex-col bg-black overflow-hidden" data-testid="mobile-workbench">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/50">
        <div>
          <h1 className="text-lg font-semibold text-white">Estimate Builder</h1>
          <p className="text-xs text-neutral-500">{lineItems.length} items</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLibrary(true)}
            className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg"
            data-testid="mobile-open-library-btn"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Main Content - Estimate Items */}
      <div className="flex-1 overflow-y-auto">
        <EstimateBuilder
          lineItems={lineItems}
          onUpdateItem={onUpdateItem}
          onRemoveItem={onRemoveItem}
          isEditing={true}
        />
      </div>
      
      {/* Bottom Summary Bar */}
      <div className="border-t border-neutral-800 bg-neutral-900">
        <button
          onClick={() => setShowSummary(!showSummary)}
          className="w-full flex items-center justify-between p-4 min-h-[64px]"
        >
          <div className="flex items-center gap-3">
            <Calculator className="w-5 h-5 text-emerald-400" />
            <div className="text-left">
              <p className="text-xs text-neutral-500">Total</p>
              <p className="text-lg font-bold text-emerald-400">
                {formatCurrency(calculations.total)}
              </p>
            </div>
          </div>
          {showSummary ? (
            <ChevronDown className="w-5 h-5 text-neutral-500" />
          ) : (
            <ChevronUp className="w-5 h-5 text-neutral-500" />
          )}
        </button>
        
        {/* Expanded Summary */}
        {showSummary && (
          <div className="p-4 pt-0 space-y-3 border-t border-neutral-800">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Subtotal</span>
              <span className="text-white">{formatCurrency(calculations.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Tax (13%)</span>
              <span className="text-white">{formatCurrency(calculations.tax)}</span>
            </div>
            <div className="border-t border-neutral-800 pt-3">
              <button
                onClick={onExportPDF}
                disabled={lineItems.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-medium rounded-xl transition-colors min-h-[48px]"
              >
                <FileText className="w-5 h-5" />
                Export PDF
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Full-Screen Library Modal */}
      {showLibrary && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Library Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900 safe-area-inset-top">
            <button
              onClick={() => setShowLibrary(false)}
              className="flex items-center gap-2 text-neutral-400 hover:text-white min-h-[44px]"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <h2 className="text-lg font-semibold text-white">Add Items</h2>
            <div className="w-16" />
          </div>
          
          {/* Library Content */}
          <div className="flex-1 overflow-hidden">
            <LibraryBrowser
              domains={domains}
              categories={categories}
              standards={standards}
              isLoading={isLoadingLibrary}
              onAddToEstimate={(standard) => {
                onAddItem(standard);
                // Don't close - let user add multiple items
              }}
              isCollapsed={false}
            />
          </div>
          
          {/* Done Button */}
          <div className="p-4 border-t border-neutral-800 bg-neutral-900 safe-area-inset-bottom">
            <button
              onClick={() => setShowLibrary(false)}
              className="w-full px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-medium rounded-xl transition-colors min-h-[48px]"
            >
              Done Adding ({lineItems.length} items)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileWorkbench;
