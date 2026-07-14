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
  FileText,
  Save,
  FolderOpen,
  Loader2,
  Check
} from 'lucide-react';
import LibraryBrowser from './LibraryBrowser';
import EstimateBuilder from './EstimateBuilder';

const MobileWorkbench = ({
  estimateName = 'New Estimate',
  setEstimateName,
  lineItems = [],
  domains = [],
  categories = [],
  standards = [],
  isLoadingLibrary = false,
  calculations = {},
  taxRate = 13,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onExportPDF,
  onSave,
  isSaving = false,
  hasUnsavedChanges = false,
  currentEstimateId = null,
  estimateNumber = null,
  savedEstimates = [],
  onLoadEstimate,
  onNewEstimate
}) => {
  const [showLibrary, setShowLibrary] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showEstimateList, setShowEstimateList] = useState(false);
  
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
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={estimateName}
              onChange={(e) => setEstimateName(e.target.value)}
              className="bg-transparent text-lg font-semibold text-white border-none focus:outline-none focus:ring-1 focus:ring-emerald-500/50 rounded px-1 -ml-1 max-w-[160px]"
              placeholder="Estimate Name"
              data-testid="mobile-estimate-name-input"
            />
            {hasUnsavedChanges && (
              <span className="text-[10px] text-amber-400 flex-shrink-0">•</span>
            )}
          </div>
          <p className="text-xs text-neutral-500">
            {estimateNumber && <span className="text-emerald-400 mr-1">{estimateNumber}</span>}
            {lineItems.length} items
          </p>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowEstimateList(true)}
            className="p-2.5 text-neutral-400 hover:text-white rounded-lg"
            data-testid="mobile-open-estimates-btn"
          >
            <FolderOpen className="w-5 h-5" />
          </button>
          <button
            onClick={onSave}
            disabled={lineItems.length === 0 || isSaving}
            className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg disabled:opacity-50"
            data-testid="mobile-save-btn"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => setShowLibrary(true)}
            className="p-2.5 bg-emerald-500 text-black rounded-lg"
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
              <span className="text-neutral-400">Tax ({taxRate}%)</span>
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
      
      {/* Full-Screen Estimate List Modal */}
      {showEstimateList && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900 safe-area-inset-top">
            <button
              onClick={() => setShowEstimateList(false)}
              className="flex items-center gap-2 text-neutral-400 hover:text-white min-h-[44px]"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <h2 className="text-lg font-semibold text-white">Estimates</h2>
            <div className="w-16" />
          </div>
          
          {/* New Estimate Button */}
          <div className="p-4 border-b border-neutral-800">
            <button
              onClick={() => {
                onNewEstimate?.();
                setShowEstimateList(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/10 text-emerald-400 rounded-xl transition-colors min-h-[48px]"
              data-testid="mobile-new-estimate-btn"
            >
              <Plus className="w-5 h-5" />
              New Estimate
            </button>
          </div>
          
          {/* Saved Estimates List */}
          <div className="flex-1 overflow-y-auto">
            {savedEstimates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="w-12 h-12 text-neutral-700 mb-3" />
                <p className="text-sm text-neutral-500">No saved estimates</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-800">
                {savedEstimates.map(est => (
                  <button
                    key={est.id}
                    onClick={() => {
                      onLoadEstimate?.(est.id);
                      setShowEstimateList(false);
                    }}
                    className={`w-full flex items-start gap-4 p-4 hover:bg-neutral-900 transition-colors text-left min-h-[72px] ${
                      currentEstimateId === est.id ? 'bg-emerald-500/5' : ''
                    }`}
                  >
                    <div className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-neutral-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-medium text-white truncate">
                          {est.name}
                        </span>
                        {currentEstimateId === est.id && (
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <span className="text-emerald-400">{est.estimate_number}</span>
                        <span>•</span>
                        <span>{est.item_count || 0} items</span>
                      </div>
                      <div className="text-sm font-medium text-emerald-400 mt-1">
                        {formatCurrency(est.total || 0)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileWorkbench;
