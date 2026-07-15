/**
 * MobileWorkbench.jsx - Mobile Estimate Workbench
 * =================================================
 * 
 * TRADEOS v1.1.2 - Platform Parity Release
 * 
 * Mobile-specific layout for the Estimate Workbench.
 * Uses a full-screen approach with sliding panels.
 * 
 * PARITY REQUIREMENTS:
 * - Same features as Desktop
 * - Same data as Desktop  
 * - Same workflow as Desktop
 * - Only layout differs (responsive)
 * 
 * Features:
 * - Company Logo display
 * - Client & Project Information editing
 * - Full estimate header with all metadata
 * - Pricing Profile with Markup/Contingency
 * - Clarifications & Internal Notes
 * - Production Library Explorer
 * - Full scrolling support
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
  Check,
  Building2,
  MapPin,
  Settings2,
  StickyNote,
  TrendingUp,
  Percent,
  Cloud,
  CloudOff
} from 'lucide-react';
import LibraryBrowser from './LibraryBrowser';
import EstimateBuilder from './EstimateBuilder';

const MobileWorkbench = ({
  // Estimate Identity
  estimateName = 'New Estimate',
  setEstimateName,
  estimateNumber = null,
  setEstimateNumber,
  currentEstimateId = null,
  
  // Line Items & Library
  lineItems = [],
  domains = [],
  categories = [],
  standards = [],
  isLoadingLibrary = false,
  
  // Calculations
  calculations = {},
  
  // Pricing Configuration
  taxRate = 5,
  setTaxRate,
  markupPercent = 15,
  setMarkupPercent,
  contingencyPercent = 10,
  setContingencyPercent,
  pricingProfile = 'Standard',
  setPricingProfile,
  
  // Client & Project Info (PARITY)
  clientInfo = {},
  setClientInfo,
  projectInfo = {},
  setProjectInfo,
  
  // Company Profile (PARITY)
  companyProfileSnapshot = null,
  
  // Notes (PARITY)
  notes = '',
  setNotes,
  clarifications = '',
  setClarifications,
  internalNotes = '',
  setInternalNotes,
  
  // Actions
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onExportPDF,
  onSave,
  
  // State
  isSaving = false,
  hasUnsavedChanges = false,
  savedEstimates = [],
  onLoadEstimate,
  onNewEstimate,
  
  // Sync Status (PARITY)
  syncStatus = 'synced',
  
  // Track changes
  onMarkUnsaved
}) => {
  const [showLibrary, setShowLibrary] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showEstimateList, setShowEstimateList] = useState(false);
  const [showDetailsEditor, setShowDetailsEditor] = useState(false);
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };
  
  // Helper to mark changes
  const markChanged = () => {
    onMarkUnsaved?.();
  };
  
  // Helper to update client info with change tracking
  const updateClientInfo = (field, value) => {
    setClientInfo?.(prev => ({ ...prev, [field]: value }));
    markChanged();
  };
  
  // Helper to update project info with change tracking
  const updateProjectInfo = (field, value) => {
    setProjectInfo?.(prev => ({ ...prev, [field]: value }));
    markChanged();
  };
  
  return (
    <div className="h-full flex flex-col bg-black overflow-hidden" data-testid="mobile-workbench">
      {/* Header - Company Logo + Estimate Info */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/50">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Company Logo (PARITY) */}
          {companyProfileSnapshot?.logo ? (
            <img 
              src={companyProfileSnapshot.logo} 
              alt="Company Logo" 
              className="w-10 h-10 object-contain rounded-lg flex-shrink-0"
              data-testid="mobile-company-logo"
            />
          ) : (
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calculator className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={estimateName}
                onChange={(e) => {
                  setEstimateName(e.target.value);
                  markChanged();
                }}
                className="bg-transparent text-lg font-semibold text-white border-none focus:outline-none focus:ring-1 focus:ring-emerald-500/50 rounded px-1 -ml-1 max-w-[140px]"
                placeholder="Estimate Name"
                data-testid="mobile-estimate-name-input"
              />
              {hasUnsavedChanges && (
                <span className="text-[10px] text-amber-400 flex-shrink-0">•</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <input
                type="text"
                value={estimateNumber || ''}
                onChange={(e) => {
                  setEstimateNumber?.(e.target.value);
                  markChanged();
                }}
                placeholder="EST-XXXX"
                className="bg-transparent text-emerald-400 border-none focus:outline-none w-20 placeholder-neutral-600"
                data-testid="mobile-estimate-number-input"
              />
              <span>•</span>
              <span>{lineItems.length} items</span>
              {/* Sync Status (Compact) */}
              {syncStatus === 'synced' && (
                <Cloud className="w-3 h-3 text-emerald-400" />
              )}
              {syncStatus === 'syncing' && (
                <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
              )}
              {syncStatus === 'offline' && (
                <CloudOff className="w-3 h-3 text-amber-400" />
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Details Editor Toggle (PARITY) */}
          <button
            onClick={() => setShowDetailsEditor(true)}
            className="p-2.5 text-neutral-400 hover:text-white rounded-lg"
            data-testid="mobile-details-btn"
          >
            <Settings2 className="w-5 h-5" />
          </button>
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
      <div className="flex-1 overflow-y-auto overscroll-contain -webkit-overflow-scrolling-touch">
        <EstimateBuilder
          lineItems={lineItems}
          onUpdateItem={onUpdateItem}
          onRemoveItem={onRemoveItem}
          pricingProfile={pricingProfile}
          isEditing={true}
        />
      </div>
      
      {/* Bottom Summary Bar - Full PARITY */}
      <div className="border-t border-neutral-800 bg-neutral-900">
        <button
          onClick={() => setShowSummary(!showSummary)}
          className="w-full flex items-center justify-between p-4 min-h-[64px]"
          data-testid="mobile-summary-toggle"
        >
          <div className="flex items-center gap-3">
            <Calculator className="w-5 h-5 text-emerald-400" />
            <div className="text-left">
              <p className="text-xs text-neutral-500">Total ({pricingProfile})</p>
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
        
        {/* Expanded Summary - Full PARITY with Desktop LiveSummary */}
        {showSummary && (
          <div className="p-4 pt-0 space-y-3 border-t border-neutral-800">
            {/* Pricing Profile Badge */}
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Pricing Profile</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                pricingProfile === 'Premium' ? 'bg-purple-500/10 text-purple-400' :
                pricingProfile === 'Low' ? 'bg-blue-500/10 text-blue-400' :
                'bg-emerald-500/10 text-emerald-400'
              }`}>
                {pricingProfile}
              </span>
            </div>
            
            {/* Subtotal */}
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Subtotal</span>
              <span className="text-white">{formatCurrency(calculations.subtotal)}</span>
            </div>
            
            {/* Markup (PARITY) */}
            {markupPercent > 0 && (
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-neutral-400">Markup ({markupPercent}%)</span>
                </div>
                <span className="text-amber-400">+{formatCurrency(calculations.markup)}</span>
              </div>
            )}
            
            {/* Contingency (PARITY) */}
            {contingencyPercent > 0 && (
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-neutral-400">Contingency ({contingencyPercent}%)</span>
                </div>
                <span className="text-blue-400">+{formatCurrency(calculations.contingency)}</span>
              </div>
            )}
            
            {/* Tax */}
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-2">
                <Percent className="w-3.5 h-3.5 text-neutral-500" />
                <span className="text-neutral-400">Tax ({taxRate}%)</span>
              </div>
              <span className="text-white">{formatCurrency(calculations.tax)}</span>
            </div>
            
            <div className="border-t border-neutral-800 pt-3">
              <button
                onClick={onExportPDF}
                disabled={lineItems.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-medium rounded-xl transition-colors min-h-[48px]"
                data-testid="mobile-export-pdf-btn"
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
          <div className="flex-1 overflow-y-auto overscroll-contain">
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
      
      {/* Full-Screen Details Editor Modal (PARITY) */}
      {showDetailsEditor && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900 safe-area-inset-top">
            <button
              onClick={() => setShowDetailsEditor(false)}
              className="flex items-center gap-2 text-neutral-400 hover:text-white min-h-[44px]"
              data-testid="mobile-details-close"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <h2 className="text-lg font-semibold text-white">Estimate Details</h2>
            <div className="w-16" />
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-6">
            {/* Client Information Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                Client Information
              </h3>
              <div className="space-y-2">
                <input
                  type="text"
                  value={clientInfo?.company || ''}
                  onChange={(e) => updateClientInfo('company', e.target.value)}
                  placeholder="Client Company"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
                  data-testid="mobile-client-company"
                />
                <input
                  type="text"
                  value={clientInfo?.contact_name || ''}
                  onChange={(e) => updateClientInfo('contact_name', e.target.value)}
                  placeholder="Contact Name"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
                  data-testid="mobile-client-contact"
                />
                <input
                  type="text"
                  value={clientInfo?.address || ''}
                  onChange={(e) => updateClientInfo('address', e.target.value)}
                  placeholder="Address"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={clientInfo?.city || ''}
                    onChange={(e) => updateClientInfo('city', e.target.value)}
                    placeholder="City"
                    className="col-span-2 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
                  />
                  <input
                    type="text"
                    value={clientInfo?.province || ''}
                    onChange={(e) => updateClientInfo('province', e.target.value)}
                    placeholder="Prov"
                    className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="tel"
                    value={clientInfo?.phone || ''}
                    onChange={(e) => updateClientInfo('phone', e.target.value)}
                    placeholder="Phone"
                    className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
                  />
                  <input
                    type="email"
                    value={clientInfo?.email || ''}
                    onChange={(e) => updateClientInfo('email', e.target.value)}
                    placeholder="Email"
                    className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
            </div>
            
            {/* Project Information Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Project Information
              </h3>
              <div className="space-y-2">
                <input
                  type="text"
                  value={projectInfo?.name || ''}
                  onChange={(e) => updateProjectInfo('name', e.target.value)}
                  placeholder="Project Name"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
                  data-testid="mobile-project-name"
                />
                <input
                  type="text"
                  value={projectInfo?.address || ''}
                  onChange={(e) => updateProjectInfo('address', e.target.value)}
                  placeholder="Project Address"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={projectInfo?.project_id || ''}
                    onChange={(e) => updateProjectInfo('project_id', e.target.value)}
                    placeholder="Project ID"
                    className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
                  />
                  <input
                    type="text"
                    value={projectInfo?.estimator || ''}
                    onChange={(e) => updateProjectInfo('estimator', e.target.value)}
                    placeholder="Estimator"
                    className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Date</label>
                    <input
                      type="date"
                      value={projectInfo?.date || ''}
                      onChange={(e) => updateProjectInfo('date', e.target.value)}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Valid Until</label>
                    <input
                      type="date"
                      value={projectInfo?.valid_until || ''}
                      onChange={(e) => updateProjectInfo('valid_until', e.target.value)}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Pricing Configuration Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                Pricing Configuration
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Pricing Profile</label>
                  <select
                    value={pricingProfile}
                    onChange={(e) => {
                      setPricingProfile?.(e.target.value);
                      markChanged();
                    }}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    data-testid="mobile-pricing-profile"
                  >
                    <option value="Low">Low</option>
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">GST %</label>
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => {
                      setTaxRate?.(parseFloat(e.target.value) || 0);
                      markChanged();
                    }}
                    min="0"
                    max="15"
                    step="0.5"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    data-testid="mobile-tax-rate"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Markup %</label>
                  <input
                    type="number"
                    value={markupPercent}
                    onChange={(e) => {
                      setMarkupPercent?.(parseFloat(e.target.value) || 0);
                      markChanged();
                    }}
                    min="0"
                    max="100"
                    step="0.5"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    data-testid="mobile-markup"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Contingency %</label>
                  <input
                    type="number"
                    value={contingencyPercent}
                    onChange={(e) => {
                      setContingencyPercent?.(parseFloat(e.target.value) || 0);
                      markChanged();
                    }}
                    min="0"
                    max="50"
                    step="0.5"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    data-testid="mobile-contingency"
                  />
                </div>
              </div>
            </div>
            
            {/* Notes Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-emerald-400" />
                Notes & Clarifications
              </h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Notes (Client Visible)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => {
                      setNotes?.(e.target.value);
                      markChanged();
                    }}
                    placeholder="Additional notes for client..."
                    rows={3}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 resize-none"
                    data-testid="mobile-notes"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Clarifications</label>
                  <textarea
                    value={clarifications}
                    onChange={(e) => {
                      setClarifications?.(e.target.value);
                      markChanged();
                    }}
                    placeholder="Terms and clarifications..."
                    rows={3}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 resize-none"
                    data-testid="mobile-clarifications"
                  />
                </div>
                <div>
                  <label className="block text-xs text-amber-400/80 mb-1">Internal Notes (Not Visible to Client)</label>
                  <textarea
                    value={internalNotes}
                    onChange={(e) => {
                      setInternalNotes?.(e.target.value);
                      markChanged();
                    }}
                    placeholder="Internal notes..."
                    rows={3}
                    className="w-full bg-neutral-800 border border-amber-700/50 rounded-lg px-3 py-2 text-sm text-amber-400/80 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 resize-none"
                    data-testid="mobile-internal-notes"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Done Button */}
          <div className="p-4 border-t border-neutral-800 bg-neutral-900 safe-area-inset-bottom">
            <button
              onClick={() => setShowDetailsEditor(false)}
              className="w-full px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-medium rounded-xl transition-colors min-h-[48px]"
              data-testid="mobile-details-done"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileWorkbench;
