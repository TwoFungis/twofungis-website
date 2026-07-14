/**
 * EstimateWorkbench.jsx - Main Estimate Workbench Component
 * ==========================================================
 * 
 * Phase 2-4 of the Estimate Workbench Architecture.
 * Persistence: Uses localStorage for estimates (backend tables not yet provisioned).
 * 
 * Desktop: 3-panel layout
 * - Left: Library Browser
 * - Center: Estimate Builder
 * - Right: Live Summary
 * 
 * Mobile: Full-screen approach
 * - Primary: Estimate list
 * - Library: Full-screen modal
 * - Summary: Bottom drawer
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

// Desktop components
import LibraryBrowser from './LibraryBrowser';
import EstimateBuilder from './EstimateBuilder';
import LiveSummary from './LiveSummary';
import MobileWorkbench from './MobileWorkbench';

// PDF Export (Phase 3)
import { downloadEstimatePDF } from '../../utils/estimatePdfGenerator';

// Icons
import { 
  Calculator, 
  Save, 
  RotateCcw, 
  FolderOpen, 
  Plus, 
  ChevronDown,
  Loader2,
  FileText,
  Check
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// LocalStorage keys
const STORAGE_KEY = 'tradeos_estimates';
const CURRENT_ESTIMATE_KEY = 'tradeos_current_estimate';

// LocalStorage helpers for estimate persistence
const loadEstimatesFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to load estimates from storage', e);
    return [];
  }
};

const saveEstimatesToStorage = (estimates) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estimates));
  } catch (e) {
    console.error('Failed to save estimates to storage', e);
  }
};

const generateEstimateNumber = () => {
  const date = new Date();
  const timestamp = date.toISOString().slice(2, 10).replace(/-/g, '');
  const unique = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EST-${timestamp}-${unique}`;
};

const EstimateWorkbench = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Data state
  const [domains, setDomains] = useState([]);
  const [categories, setCategories] = useState([]);
  const [standards, setStandards] = useState([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);
  
  // Estimate persistence state
  const [currentEstimateId, setCurrentEstimateId] = useState(null);
  const [estimateNumber, setEstimateNumber] = useState(null);
  const [savedEstimates, setSavedEstimates] = useState([]);
  const [isLoadingEstimates, setIsLoadingEstimates] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Estimate state
  const [estimateName, setEstimateName] = useState('New Estimate');
  const [lineItems, setLineItems] = useState([]);
  const [taxRate, setTaxRate] = useState(13); // Ontario HST
  const [markupPercent, setMarkupPercent] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // UI state
  const [isLibraryCollapsed, setIsLibraryCollapsed] = useState(false);
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showEstimateSelector, setShowEstimateSelector] = useState(false);
  
  // Get auth token helper
  const getAuthToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }, []);
  
  // Handle responsive
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Fetch library data
  const fetchLibraryData = useCallback(async () => {
    setIsLoadingLibrary(true);
    try {
      const token = await getAuthToken();
      
      if (!token) {
        toast.error('Please log in to continue');
        return;
      }
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const [domainsRes, categoriesRes, itemsRes] = await Promise.all([
        fetch(`${API_URL}/api/production-library/domains`, { headers }),
        fetch(`${API_URL}/api/production-library/service-categories`, { headers }),
        fetch(`${API_URL}/api/production-library/items?limit=1000`, { headers })
      ]);
      
      if (domainsRes.ok) {
        const data = await domainsRes.json();
        setDomains(data.domains || []);
      }
      
      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data.categories || []);
      }
      
      if (itemsRes.ok) {
        const data = await itemsRes.json();
        setStandards(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching library:', error);
      toast.error('Failed to load library');
    } finally {
      setIsLoadingLibrary(false);
    }
  }, [getAuthToken]);
  
  // Fetch saved estimates list from localStorage
  const fetchEstimates = useCallback(() => {
    setIsLoadingEstimates(true);
    const estimates = loadEstimatesFromStorage();
    setSavedEstimates(estimates);
    setIsLoadingEstimates(false);
  }, []);
  
  // Load a specific estimate from localStorage
  const loadEstimate = useCallback((estimateId) => {
    setIsLoading(true);
    try {
      const estimates = loadEstimatesFromStorage();
      const estimate = estimates.find(e => e.id === estimateId);
      
      if (!estimate) {
        toast.error('Estimate not found');
        setIsLoading(false);
        return;
      }
      
      // Set estimate metadata
      setCurrentEstimateId(estimate.id);
      setEstimateNumber(estimate.estimate_number);
      setEstimateName(estimate.name);
      setTaxRate(estimate.tax_rate || 13);
      setMarkupPercent(estimate.markup_percent || 0);
      setLineItems(estimate.line_items || []);
      setHasUnsavedChanges(false);
      setShowEstimateSelector(false);
      
      // Update URL
      setSearchParams({ id: estimateId });
      
      toast.success(`Loaded: ${estimate.name}`);
    } catch (error) {
      console.error('Error loading estimate:', error);
      toast.error('Failed to load estimate');
    } finally {
      setIsLoading(false);
    }
  }, [setSearchParams]);
  
  // Save estimate to localStorage
  const saveEstimate = useCallback(() => {
    if (lineItems.length === 0) {
      toast.error('Add items before saving');
      return;
    }
    
    setIsSaving(true);
    try {
      const estimates = loadEstimatesFromStorage();
      
      // Calculate totals
      const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const markup = subtotal * (markupPercent / 100);
      const subtotalWithMarkup = subtotal + markup;
      const tax = subtotalWithMarkup * (taxRate / 100);
      const total = subtotalWithMarkup + tax;
      
      let estimateId = currentEstimateId;
      let estNumber = estimateNumber;
      
      if (!estimateId) {
        // Create new estimate
        estimateId = uuidv4();
        estNumber = generateEstimateNumber();
        setCurrentEstimateId(estimateId);
        setEstimateNumber(estNumber);
      }
      
      const estimateData = {
        id: estimateId,
        estimate_number: estNumber,
        name: estimateName,
        tax_rate: taxRate,
        markup_percent: markupPercent,
        line_items: lineItems,
        subtotal,
        markup_amount: markup,
        tax_amount: tax,
        total,
        item_count: lineItems.length,
        created_at: estimates.find(e => e.id === estimateId)?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Update or add to list
      const existingIndex = estimates.findIndex(e => e.id === estimateId);
      if (existingIndex >= 0) {
        estimates[existingIndex] = estimateData;
      } else {
        estimates.unshift(estimateData);
      }
      
      // Save to localStorage
      saveEstimatesToStorage(estimates);
      setSavedEstimates(estimates);
      setHasUnsavedChanges(false);
      
      // Update URL
      setSearchParams({ id: estimateId });
      
      toast.success('Estimate saved!');
    } catch (error) {
      console.error('Error saving estimate:', error);
      toast.error('Failed to save estimate');
    } finally {
      setIsSaving(false);
    }
  }, [currentEstimateId, estimateNumber, estimateName, lineItems, taxRate, markupPercent, setSearchParams]);
  
  // Create new estimate
  const createNewEstimate = useCallback(() => {
    if (hasUnsavedChanges && lineItems.length > 0) {
      if (!confirm('You have unsaved changes. Create a new estimate anyway?')) {
        return;
      }
    }
    
    setCurrentEstimateId(null);
    setEstimateNumber(null);
    setEstimateName('New Estimate');
    setLineItems([]);
    setTaxRate(13);
    setMarkupPercent(0);
    setHasUnsavedChanges(false);
    setSearchParams({});
    setShowEstimateSelector(false);
    
    toast.success('New estimate created');
  }, [hasUnsavedChanges, lineItems.length, setSearchParams]);
  
  // Load from URL on mount
  useEffect(() => {
    fetchLibraryData();
    fetchEstimates();
    
    const estimateIdFromUrl = searchParams.get('id');
    if (estimateIdFromUrl) {
      loadEstimate(estimateIdFromUrl);
    }
  }, []);
  
  // Track unsaved changes - use a ref to track initial load state
  const isInitialLoad = React.useRef(true);
  
  useEffect(() => {
    // Skip tracking during initial mount
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    // Only mark as unsaved if we have items
    if (lineItems.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [lineItems.length, estimateName, taxRate, markupPercent]);
  
  // Add item to estimate
  const handleAddItem = useCallback((standard) => {
    const existingIndex = lineItems.findIndex(item => item.standard_id === standard.id);
    
    if (existingIndex >= 0) {
      setLineItems(prev => prev.map((item, idx) => 
        idx === existingIndex 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
      toast.success(`Added another ${standard.production_name}`);
    } else {
      const domain = domains.find(d => d.id === standard.knowledge_domain_id);
      
      const newItem = {
        id: uuidv4(),
        standard_id: standard.id,
        production_code: standard.production_code,
        production_name: standard.production_name,
        description: standard.description,
        unit: standard.unit_of_measure || standard.unit || 'ea',
        unit_price: standard.price_per_unit || standard.labor_price || 0,
        quantity: 1,
        domain_name: domain?.name || 'Other',
        domain_id: standard.knowledge_domain_id,
        snapshot: {
          production_code: standard.production_code,
          production_name: standard.production_name,
          description: standard.description,
          unit_of_measure: standard.unit_of_measure || 'ea',
          price_per_unit: standard.price_per_unit || standard.labor_price || 0,
          material_price: standard.material_price || 0,
          labor_price: standard.labor_price || 0,
          captured_at: new Date().toISOString()
        }
      };
      
      setLineItems(prev => [...prev, newItem]);
      toast.success(`Added ${standard.production_name}`);
    }
    setHasUnsavedChanges(true);
  }, [lineItems, domains]);
  
  // Update line item
  const handleUpdateItem = useCallback((itemId, updates) => {
    setLineItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
    setHasUnsavedChanges(true);
    toast.success('Item updated');
  }, []);
  
  // Remove line item
  const handleRemoveItem = useCallback((itemId) => {
    setLineItems(prev => prev.filter(item => item.id !== itemId));
    setHasUnsavedChanges(true);
    toast.success('Item removed');
  }, []);
  
  // Reorder items
  const handleReorderItems = useCallback((reorderedItems) => {
    setLineItems(reorderedItems);
    setHasUnsavedChanges(true);
  }, []);
  
  // Calculate totals
  const calculations = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price), 0
    );
    const markup = subtotal * (markupPercent / 100);
    const subtotalWithMarkup = subtotal + markup;
    const tax = subtotalWithMarkup * (taxRate / 100);
    const total = subtotalWithMarkup + tax;
    
    return {
      subtotal,
      markup,
      subtotalWithMarkup,
      tax,
      total,
      itemCount: lineItems.length
    };
  }, [lineItems, taxRate, markupPercent]);
  
  // Export PDF
  const handleExportPDF = useCallback(() => {
    if (lineItems.length === 0) {
      toast.error('Add items to the estimate before exporting');
      return;
    }
    
    try {
      const fileName = downloadEstimatePDF({
        estimateName,
        estimateNumber,
        lineItems,
        calculations,
        taxRate,
        markupPercent,
        company: {
          name: 'Two Fungis Finishing',
          address: '',
          phone: '',
          email: ''
        },
        client: null,
        notes: ''
      });
      
      toast.success(`PDF exported: ${fileName}`);
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
  }, [estimateName, estimateNumber, lineItems, calculations, taxRate, markupPercent]);
  
  // Send to client (placeholder)
  const handleSendToClient = useCallback(() => {
    toast.info('Send to client coming soon');
  }, []);
  
  // Clear estimate
  const handleClearEstimate = useCallback(() => {
    if (lineItems.length > 0 && !confirm('Clear all items from this estimate?')) {
      return;
    }
    setLineItems([]);
    setHasUnsavedChanges(true);
    toast.success('Items cleared');
  }, [lineItems.length]);
  
  // Mobile view
  if (isMobile) {
    return (
      <MobileWorkbench
        estimateName={estimateName}
        setEstimateName={(name) => {
          setEstimateName(name);
          setHasUnsavedChanges(true);
        }}
        lineItems={lineItems}
        domains={domains}
        categories={categories}
        standards={standards}
        isLoadingLibrary={isLoadingLibrary}
        calculations={calculations}
        taxRate={taxRate}
        onAddItem={handleAddItem}
        onUpdateItem={handleUpdateItem}
        onRemoveItem={handleRemoveItem}
        onExportPDF={handleExportPDF}
        onSave={saveEstimate}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        currentEstimateId={currentEstimateId}
        estimateNumber={estimateNumber}
        savedEstimates={savedEstimates}
        onLoadEstimate={loadEstimate}
        onNewEstimate={createNewEstimate}
      />
    );
  }
  
  // Desktop 3-panel layout
  return (
    <div className="h-full flex flex-col bg-black overflow-hidden" data-testid="estimate-workbench">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <Calculator className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={estimateName}
                onChange={(e) => {
                  setEstimateName(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                className="bg-transparent text-lg font-semibold text-white border-none focus:outline-none focus:ring-1 focus:ring-emerald-500/50 rounded px-1 -ml-1"
                placeholder="Estimate Name"
                data-testid="estimate-name-input"
              />
              {hasUnsavedChanges && (
                <span className="text-xs text-amber-400">• unsaved</span>
              )}
            </div>
            <p className="text-xs text-neutral-500">
              {estimateNumber && <span className="text-emerald-400 mr-2">{estimateNumber}</span>}
              {lineItems.length} items • {formatCurrency(calculations.total)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Estimate Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowEstimateSelector(!showEstimateSelector)}
              className="flex items-center gap-2 px-3 py-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
              data-testid="open-estimate-btn"
            >
              <FolderOpen className="w-4 h-4" />
              Open
              <ChevronDown className="w-3 h-3" />
            </button>
            
            {showEstimateSelector && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-3 border-b border-neutral-800">
                  <button
                    onClick={createNewEstimate}
                    className="w-full flex items-center gap-2 px-3 py-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                    data-testid="new-estimate-btn"
                  >
                    <Plus className="w-4 h-4" />
                    New Estimate
                  </button>
                </div>
                
                <div className="max-h-64 overflow-y-auto">
                  {isLoadingEstimates ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 text-neutral-500 animate-spin" />
                    </div>
                  ) : savedEstimates.length === 0 ? (
                    <div className="py-6 text-center text-sm text-neutral-500">
                      No saved estimates
                    </div>
                  ) : (
                    savedEstimates.map(est => (
                      <button
                        key={est.id}
                        onClick={() => loadEstimate(est.id)}
                        className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-neutral-800 transition-colors text-left ${
                          currentEstimateId === est.id ? 'bg-emerald-500/10' : ''
                        }`}
                        data-testid={`estimate-option-${est.id}`}
                      >
                        <FileText className="w-4 h-4 text-neutral-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white truncate">
                              {est.name}
                            </span>
                            {currentEstimateId === est.id && (
                              <Check className="w-3 h-3 text-emerald-400" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-neutral-500">
                            <span className="text-emerald-400">{est.estimate_number}</span>
                            <span>•</span>
                            <span>{est.item_count || 0} items</span>
                            <span>•</span>
                            <span>{formatCurrency(est.total || 0)}</span>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={handleClearEstimate}
            className="flex items-center gap-2 px-3 py-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            data-testid="clear-estimate-btn"
          >
            <RotateCcw className="w-4 h-4" />
            Clear
          </button>
          
          <button
            onClick={saveEstimate}
            disabled={lineItems.length === 0 || isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-medium rounded-lg transition-colors min-w-[90px] justify-center"
            data-testid="save-estimate-btn"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 z-40 flex items-center justify-center">
          <div className="flex items-center gap-3 bg-neutral-900 px-6 py-4 rounded-xl">
            <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
            <span className="text-white">Loading estimate...</span>
          </div>
        </div>
      )}
      
      {/* 3-Panel Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Library Browser */}
        <LibraryBrowser
          domains={domains}
          categories={categories}
          standards={standards}
          isLoading={isLoadingLibrary}
          onAddToEstimate={handleAddItem}
          isCollapsed={isLibraryCollapsed}
          onToggleCollapse={() => setIsLibraryCollapsed(!isLibraryCollapsed)}
        />
        
        {/* Center: Estimate Builder */}
        <EstimateBuilder
          lineItems={lineItems}
          onUpdateItem={handleUpdateItem}
          onRemoveItem={handleRemoveItem}
          onReorderItems={handleReorderItems}
          isEditing={true}
        />
        
        {/* Right: Live Summary */}
        <LiveSummary
          lineItems={lineItems}
          taxRate={taxRate}
          markupPercent={markupPercent}
          onExportPDF={handleExportPDF}
          onSendToClient={handleSendToClient}
          isCollapsed={isSummaryCollapsed}
          onToggleCollapse={() => setIsSummaryCollapsed(!isSummaryCollapsed)}
        />
      </div>
      
      {/* Click outside to close dropdown */}
      {showEstimateSelector && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowEstimateSelector(false)} 
        />
      )}
    </div>
  );
};

// Helper function
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2
  }).format(amount || 0);
};

export default EstimateWorkbench;
