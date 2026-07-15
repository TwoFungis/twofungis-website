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
  Check,
  ChevronUp,
  Building2,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Hash,
  Settings2,
  StickyNote
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// LocalStorage keys
const STORAGE_KEY = 'tradeos_estimates';
const CURRENT_ESTIMATE_KEY = 'tradeos_current_estimate';
const COMPANY_PROFILE_KEY = 'tradeos_company_profile';

// Load company profile from localStorage
const loadCompanyProfile = () => {
  try {
    const stored = localStorage.getItem(COMPANY_PROFILE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error('Failed to load company profile:', e);
    return null;
  }
};

// Default client information structure
const defaultClientInfo = {
  company: '',
  contact_name: '',
  address: '',
  city: '',
  province: '',
  postal_code: '',
  phone: '',
  email: ''
};

// Default project information structure
const defaultProjectInfo = {
  name: '',
  address: '',
  project_id: '',
  revision: 1,
  date: new Date().toISOString().split('T')[0],
  tender_date: '',
  valid_until: '',
  estimator: ''
};

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
  const year = date.getFullYear();
  const unique = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EST-${year}-${unique}`;
};

// Calculate valid until date based on company profile quote validity
const calculateValidUntil = (companyProfile, startDate) => {
  const validityDays = companyProfile?.default_quote_validity || 30;
  const start = new Date(startDate || new Date());
  start.setDate(start.getDate() + validityDays);
  return start.toISOString().split('T')[0];
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
  const [taxRate, setTaxRate] = useState(5); // GST default
  const [markupPercent, setMarkupPercent] = useState(15);
  const [contingencyPercent, setContingencyPercent] = useState(10);
  const [pricingProfile, setPricingProfile] = useState('Standard');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Client & Project Information (Phase 1)
  const [clientInfo, setClientInfo] = useState(defaultClientInfo);
  const [projectInfo, setProjectInfo] = useState(defaultProjectInfo);
  const [companyProfileSnapshot, setCompanyProfileSnapshot] = useState(null);
  const [notes, setNotes] = useState('');
  const [clarifications, setClarifications] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  
  // Header editing state
  const [showHeaderEditor, setShowHeaderEditor] = useState(false);
  
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
      setTaxRate(estimate.tax_rate ?? 5);
      setMarkupPercent(estimate.markup_percent ?? 15);
      setContingencyPercent(estimate.contingency_percent ?? 10);
      setPricingProfile(estimate.pricing_profile || 'Standard');
      setLineItems(estimate.line_items || []);
      
      // Restore Client & Project Info (Phase 1)
      setClientInfo(estimate.client_info || defaultClientInfo);
      setProjectInfo(estimate.project_info || defaultProjectInfo);
      setCompanyProfileSnapshot(estimate.company_profile_snapshot || null);
      setNotes(estimate.notes || '');
      setClarifications(estimate.clarifications || '');
      setInternalNotes(estimate.internal_notes || '');
      
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
      
      // Calculate totals with contingency
      const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const markup = subtotal * (markupPercent / 100);
      const subtotalWithMarkup = subtotal + markup;
      const contingency = subtotalWithMarkup * (contingencyPercent / 100);
      const subtotalBeforeTax = subtotalWithMarkup + contingency;
      const tax = subtotalBeforeTax * (taxRate / 100);
      const total = subtotalBeforeTax + tax;
      
      let estimateId = currentEstimateId;
      let estNumber = estimateNumber;
      
      if (!estimateId) {
        // Create new estimate - preserve user-edited estimate number if provided
        estimateId = uuidv4();
        estNumber = (estimateNumber && estimateNumber.trim()) ? estimateNumber : generateEstimateNumber();
        setCurrentEstimateId(estimateId);
        setEstimateNumber(estNumber);
      }
      
      // Capture current company profile as snapshot
      const currentCompanyProfile = loadCompanyProfile();
      if (!companyProfileSnapshot && currentCompanyProfile) {
        setCompanyProfileSnapshot(currentCompanyProfile);
      }
      
      const estimateData = {
        id: estimateId,
        estimate_number: estNumber,
        name: estimateName,
        // Pricing
        pricing_profile: pricingProfile,
        tax_rate: taxRate,
        markup_percent: markupPercent,
        contingency_percent: contingencyPercent,
        // Line Items
        line_items: lineItems,
        // Calculations
        subtotal,
        markup_amount: markup,
        contingency_amount: contingency,
        tax_amount: tax,
        total,
        item_count: lineItems.length,
        // Client & Project Info (Phase 1)
        client_info: clientInfo,
        project_info: projectInfo,
        company_profile_snapshot: companyProfileSnapshot || currentCompanyProfile,
        // Notes
        notes,
        clarifications,
        internal_notes: internalNotes,
        // Timestamps
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
  }, [currentEstimateId, estimateNumber, estimateName, lineItems, taxRate, markupPercent, contingencyPercent, pricingProfile, clientInfo, projectInfo, companyProfileSnapshot, notes, clarifications, internalNotes, setSearchParams]);
  
  // Create new estimate with company defaults
  const createNewEstimate = useCallback(() => {
    if (hasUnsavedChanges && lineItems.length > 0) {
      if (!confirm('You have unsaved changes. Create a new estimate anyway?')) {
        return;
      }
    }
    
    // Load company profile defaults
    const companyProfile = loadCompanyProfile();
    const today = new Date().toISOString().split('T')[0];
    
    setCurrentEstimateId(null);
    setEstimateNumber(null);
    setEstimateName('New Estimate');
    setLineItems([]);
    
    // Apply company profile defaults
    setTaxRate(companyProfile?.default_gst_rate ?? 5);
    setMarkupPercent(companyProfile?.default_markup ?? 15);
    setContingencyPercent(companyProfile?.default_contingency ?? 10);
    setPricingProfile(companyProfile?.default_pricing_profile || 'Standard');
    
    // Reset client & project info with company defaults
    setClientInfo(defaultClientInfo);
    setProjectInfo({
      ...defaultProjectInfo,
      date: today,
      valid_until: calculateValidUntil(companyProfile, today),
      estimator: companyProfile?.default_estimator || ''
    });
    setCompanyProfileSnapshot(null);
    setNotes('');
    setClarifications(companyProfile?.default_terms || '');
    setInternalNotes('');
    
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
  }, [fetchLibraryData, fetchEstimates, searchParams, loadEstimate]);
  
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
      
      // Get unit from measurement_units relation or fallback
      const unit = standard.measurement_units?.code || standard.unit_of_measure || standard.unit || 'EA';
      
      // Get pricing from Production Library based on selected Pricing Profile
      // Production Library stores: low_labour_rate, standard_rate, premium_labour_rate/premium_rate
      let selectedRate = 0;
      switch (pricingProfile) {
        case 'Low':
          selectedRate = standard.low_labour_rate || standard.standard_rate || 0;
          break;
        case 'Premium':
          selectedRate = standard.premium_labour_rate || standard.premium_rate || standard.standard_rate || 0;
          break;
        case 'Standard':
        default:
          selectedRate = standard.standard_rate || standard.low_labour_rate || 0;
          break;
      }
      
      // Fallback to legacy price fields if no rates set
      if (selectedRate === 0) {
        selectedRate = standard.price_per_unit || standard.labor_price || 0;
      }
      
      const newItem = {
        id: uuidv4(),
        standard_id: standard.id,
        production_code: standard.production_code,
        production_name: standard.production_name,
        description: standard.description,
        scope: '', // User-editable scope description
        notes: '', // User-editable notes
        unit: unit,
        unit_price: selectedRate,
        unit_price_override: null, // Tracks if user manually overrode price
        quantity: 1,
        domain_name: domain?.name || 'Other',
        domain_id: standard.knowledge_domain_id,
        pricing_profile_at_add: pricingProfile, // Track which profile was used
        // Immutable snapshot of all pricing data at time of addition
        snapshot: {
          production_code: standard.production_code,
          production_name: standard.production_name,
          description: standard.description,
          unit: unit,
          // All pricing tiers captured (Production Library is single source of truth)
          low_rate: standard.low_labour_rate || 0,
          standard_rate: standard.standard_rate || 0,
          premium_rate: standard.premium_labour_rate || standard.premium_rate || 0,
          complex_rate: standard.complex_rate || 0,
          // Legacy fields for compatibility
          price_per_unit: standard.price_per_unit || 0,
          material_price: standard.material_price || standard.material_rate || 0,
          labor_price: standard.labor_price || standard.standard_rate || 0,
          // Timestamp for audit trail
          captured_at: new Date().toISOString()
        }
      };
      
      setLineItems(prev => [...prev, newItem]);
      toast.success(`Added ${standard.production_name}`);
    }
    setHasUnsavedChanges(true);
  }, [lineItems, domains, pricingProfile]);
  
  // Update line item (tracks manual price overrides)
  const handleUpdateItem = useCallback((itemId, updates) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      
      // Track if user manually changed the unit_price
      let updatedItem = { ...item, ...updates };
      if (updates.unit_price !== undefined && updates.unit_price !== item.unit_price) {
        updatedItem.unit_price_override = updates.unit_price;
      }
      
      return updatedItem;
    }));
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
  
  // Export PDF with all professional metadata
  const handleExportPDF = useCallback(() => {
    if (lineItems.length === 0) {
      toast.error('Add items to the estimate before exporting');
      return;
    }
    
    try {
      // Use company profile snapshot if saved, otherwise load current profile
      const company = companyProfileSnapshot || loadCompanyProfile() || {};
      
      const fileName = downloadEstimatePDF({
        estimateName,
        estimateNumber,
        lineItems,
        calculations,
        companyProfile: company,
        clientInfo,
        projectInfo,
        pricingProfile,
        taxRate,
        markupPercent,
        contingencyPercent,
        notes,
        clarifications
      });
      
      toast.success(`PDF exported: ${fileName}`);
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
  }, [estimateName, estimateNumber, lineItems, calculations, companyProfileSnapshot, clientInfo, projectInfo, pricingProfile, taxRate, markupPercent, contingencyPercent, notes, clarifications]);
  
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
      <div className="border-b border-neutral-800 bg-neutral-900/50">
        {/* Main Header Row */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            {/* Company Logo or Calculator Icon */}
            {companyProfileSnapshot?.logo || loadCompanyProfile()?.logo ? (
              <img 
                src={companyProfileSnapshot?.logo || loadCompanyProfile()?.logo} 
                alt="Company Logo" 
                className="w-10 h-10 object-contain rounded-lg"
                data-testid="header-company-logo"
              />
            ) : (
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Calculator className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
              </div>
            )}
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
              <div className="flex items-center gap-3 text-xs text-neutral-500">
                <input
                  type="text"
                  value={estimateNumber || ''}
                  onChange={(e) => {
                    setEstimateNumber(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="EST-XXXX-XXXX"
                  className="bg-transparent text-emerald-400 border-none focus:outline-none focus:ring-1 focus:ring-emerald-500/50 rounded w-32 placeholder-neutral-600"
                  data-testid="estimate-number-input"
                />
                <span>•</span>
                <span>{lineItems.length} items</span>
                <span>•</span>
                <span>{formatCurrency(calculations.total)}</span>
                {clientInfo.company && (
                  <>
                    <span>•</span>
                    <span className="text-neutral-400">{clientInfo.company}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Header Editor Toggle */}
            <button
              onClick={() => setShowHeaderEditor(!showHeaderEditor)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                showHeaderEditor 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              data-testid="toggle-header-editor-btn"
            >
              <Settings2 className="w-4 h-4" />
              Details
              {showHeaderEditor ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            
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
        
        {/* Expandable Header Editor - Client & Project Info */}
        {showHeaderEditor && (
          <div className="border-t border-neutral-800 p-4 bg-neutral-950/50">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Client Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  Client Information
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={clientInfo.company}
                      onChange={(e) => {
                        setClientInfo(prev => ({ ...prev, company: e.target.value }));
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Client Company"
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
                      data-testid="client-company-input"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={clientInfo.contact_name}
                      onChange={(e) => {
                        setClientInfo(prev => ({ ...prev, contact_name: e.target.value }));
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Contact Name"
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
                      data-testid="client-contact-input"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={clientInfo.address}
                      onChange={(e) => {
                        setClientInfo(prev => ({ ...prev, address: e.target.value }));
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Address"
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <input
                    type="text"
                    value={clientInfo.city}
                    onChange={(e) => {
                      setClientInfo(prev => ({ ...prev, city: e.target.value }));
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="City"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={clientInfo.province}
                      onChange={(e) => {
                        setClientInfo(prev => ({ ...prev, province: e.target.value }));
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Prov"
                      className="w-16 bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
                    />
                    <input
                      type="text"
                      value={clientInfo.postal_code}
                      onChange={(e) => {
                        setClientInfo(prev => ({ ...prev, postal_code: e.target.value.toUpperCase() }));
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Postal"
                      className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 uppercase"
                    />
                  </div>
                  <input
                    type="tel"
                    value={clientInfo.phone}
                    onChange={(e) => {
                      setClientInfo(prev => ({ ...prev, phone: e.target.value }));
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Phone"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
                  />
                  <input
                    type="email"
                    value={clientInfo.email}
                    onChange={(e) => {
                      setClientInfo(prev => ({ ...prev, email: e.target.value }));
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Email"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
              
              {/* Project Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  Project Information
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={projectInfo.name}
                      onChange={(e) => {
                        setProjectInfo(prev => ({ ...prev, name: e.target.value }));
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Project Name"
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
                      data-testid="project-name-input"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={projectInfo.address}
                      onChange={(e) => {
                        setProjectInfo(prev => ({ ...prev, address: e.target.value }));
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Project Address"
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <input
                    type="text"
                    value={projectInfo.project_id}
                    onChange={(e) => {
                      setProjectInfo(prev => ({ ...prev, project_id: e.target.value }));
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Project ID"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
                  />
                  <input
                    type="number"
                    value={projectInfo.revision}
                    onChange={(e) => {
                      setProjectInfo(prev => ({ ...prev, revision: parseInt(e.target.value) || 1 }));
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Rev"
                    min="1"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
                  />
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Date</label>
                    <input
                      type="date"
                      value={projectInfo.date}
                      onChange={(e) => {
                        setProjectInfo(prev => ({ ...prev, date: e.target.value }));
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Valid Until</label>
                    <input
                      type="date"
                      value={projectInfo.valid_until}
                      onChange={(e) => {
                        setProjectInfo(prev => ({ ...prev, valid_until: e.target.value }));
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Tender Date</label>
                    <input
                      type="date"
                      value={projectInfo.tender_date}
                      onChange={(e) => {
                        setProjectInfo(prev => ({ ...prev, tender_date: e.target.value }));
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <input
                    type="text"
                    value={projectInfo.estimator}
                    onChange={(e) => {
                      setProjectInfo(prev => ({ ...prev, estimator: e.target.value }));
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Estimator"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
              
              {/* Pricing & Notes */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-emerald-400" />
                  Pricing & Notes
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Profile</label>
                    <select
                      value={pricingProfile}
                      onChange={(e) => {
                        setPricingProfile(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                      data-testid="pricing-profile-select"
                    >
                      <option value="Low">Low</option>
                      <option value="Standard">Standard</option>
                      <option value="Premium">Premium</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Markup %</label>
                    <input
                      type="number"
                      value={markupPercent}
                      onChange={(e) => {
                        setMarkupPercent(parseFloat(e.target.value) || 0);
                        setHasUnsavedChanges(true);
                      }}
                      min="0"
                      max="100"
                      step="0.5"
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                      data-testid="markup-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Cont. %</label>
                    <input
                      type="number"
                      value={contingencyPercent}
                      onChange={(e) => {
                        setContingencyPercent(parseFloat(e.target.value) || 0);
                        setHasUnsavedChanges(true);
                      }}
                      min="0"
                      max="50"
                      step="0.5"
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                      data-testid="contingency-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">GST %</label>
                    <input
                      type="number"
                      value={taxRate}
                      onChange={(e) => {
                        setTaxRate(parseFloat(e.target.value) || 0);
                        setHasUnsavedChanges(true);
                      }}
                      min="0"
                      max="15"
                      step="0.5"
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                      data-testid="gst-input"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Notes (Client Visible)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Additional notes for client..."
                    rows={2}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 resize-none"
                    data-testid="notes-textarea"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Clarifications</label>
                  <textarea
                    value={clarifications}
                    onChange={(e) => {
                      setClarifications(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Terms and clarifications..."
                    rows={2}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 resize-none"
                    data-testid="clarifications-textarea"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Internal Notes (Not Visible to Client)</label>
                  <textarea
                    value={internalNotes}
                    onChange={(e) => {
                      setInternalNotes(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Internal notes..."
                    rows={2}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-amber-400/80 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 resize-none"
                    data-testid="internal-notes-textarea"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
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
          pricingProfile={pricingProfile}
          isEditing={true}
        />
        
        {/* Right: Live Summary */}
        <LiveSummary
          lineItems={lineItems}
          taxRate={taxRate}
          markupPercent={markupPercent}
          contingencyPercent={contingencyPercent}
          pricingProfile={pricingProfile}
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
