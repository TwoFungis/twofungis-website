/**
 * LiveSummary.jsx - Estimate Workbench Summary Panel
 * ====================================================
 * 
 * Right panel of the 3-panel Estimate Workbench layout.
 * Shows live calculation of estimate totals.
 * 
 * Features:
 * - Subtotal calculation
 * - Tax calculation (configurable rate)
 * - Total
 * - Profit margin
 * - Export actions
 */

import React, { useMemo } from 'react';
import {
  Calculator,
  Download,
  Send,
  FileText,
  TrendingUp,
  DollarSign,
  Percent,
  X
} from 'lucide-react';

const LiveSummary = ({
  lineItems = [],
  taxRate = 5, // GST default
  markupPercent = 15,
  contingencyPercent = 10,
  pricingProfile = 'Standard',
  onExportPDF,
  onSendToClient,
  isCollapsed = false,
  onToggleCollapse
}) => {
  // Calculate totals
  const calculations = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);
    
    const markup = subtotal * (markupPercent / 100);
    const subtotalWithMarkup = subtotal + markup;
    const contingency = subtotalWithMarkup * (contingencyPercent / 100);
    const subtotalBeforeTax = subtotalWithMarkup + contingency;
    const tax = subtotalBeforeTax * (taxRate / 100);
    const total = subtotalBeforeTax + tax;
    
    return {
      subtotal,
      markup,
      subtotalWithMarkup,
      contingency,
      subtotalBeforeTax,
      tax,
      total,
      itemCount: lineItems.length
    };
  }, [lineItems, taxRate, markupPercent, contingencyPercent]);
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };
  
  if (isCollapsed) {
    return (
      <div className="w-12 border-l border-neutral-800 bg-neutral-900/50 flex flex-col items-center py-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          title="Expand Summary"
        >
          <Calculator className="w-5 h-5" />
        </button>
        <div className="mt-4 text-center">
          <p className="text-emerald-400 font-bold text-xs" style={{ writingMode: 'vertical-rl' }}>
            {formatCurrency(calculations.total)}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-72 xl:w-80 border-l border-neutral-800 bg-neutral-900/30 flex flex-col" data-testid="live-summary">
      {/* Header */}
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-white">Summary</span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Calculations */}
      <div className="flex-1 p-4 space-y-4">
        {/* Pricing Profile Badge */}
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-neutral-400">Pricing Profile</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            pricingProfile === 'Premium' ? 'bg-purple-500/10 text-purple-400' :
            pricingProfile === 'Low' ? 'bg-blue-500/10 text-blue-400' :
            'bg-emerald-500/10 text-emerald-400'
          }`}>
            {pricingProfile}
          </span>
        </div>
        
        {/* Item Count */}
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-neutral-400">Items</span>
          <span className="text-sm font-medium text-white">{calculations.itemCount}</span>
        </div>
        
        <div className="border-t border-neutral-800" />
        
        {/* Subtotal */}
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-neutral-400">Subtotal</span>
          <span className="text-sm font-medium text-white">{formatCurrency(calculations.subtotal)}</span>
        </div>
        
        {/* Markup */}
        {markupPercent > 0 && (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-sm text-neutral-400">Markup ({markupPercent}%)</span>
            </div>
            <span className="text-sm font-medium text-amber-400">+{formatCurrency(calculations.markup)}</span>
          </div>
        )}
        
        {/* Contingency */}
        {contingencyPercent > 0 && (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-sm text-neutral-400">Contingency ({contingencyPercent}%)</span>
            </div>
            <span className="text-sm font-medium text-blue-400">+{formatCurrency(calculations.contingency)}</span>
          </div>
        )}
        
        {/* Tax */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Percent className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-sm text-neutral-400">Tax ({taxRate}%)</span>
          </div>
          <span className="text-sm font-medium text-neutral-300">{formatCurrency(calculations.tax)}</span>
        </div>
        
        <div className="border-t border-neutral-800" />
        
        {/* Total */}
        <div className="flex items-center justify-between py-3 bg-emerald-500/5 -mx-4 px-4 rounded-lg">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-base font-medium text-white">Total</span>
          </div>
          <span className="text-xl font-bold text-emerald-400">{formatCurrency(calculations.total)}</span>
        </div>
      </div>
      
      {/* Actions */}
      <div className="p-4 border-t border-neutral-800 space-y-2">
        <button
          onClick={onExportPDF}
          disabled={calculations.itemCount === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-medium rounded-lg transition-colors"
          data-testid="export-pdf-btn"
        >
          <FileText className="w-4 h-4" />
          Export PDF
        </button>
        
        <button
          onClick={onSendToClient}
          disabled={calculations.itemCount === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          data-testid="send-to-client-btn"
        >
          <Send className="w-4 h-4" />
          Send to Client
        </button>
      </div>
    </div>
  );
};

export default LiveSummary;
