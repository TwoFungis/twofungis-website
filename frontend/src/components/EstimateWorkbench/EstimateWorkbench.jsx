/**
 * EstimateWorkbench.jsx - Main Estimate Workbench Component
 * ==========================================================
 * 
 * Phase 2 of the Estimate Workbench Architecture.
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
import { downloadEstimatePDF, previewEstimatePDF } from '../../utils/estimatePdfGenerator';

// Header
import { Calculator, Save, RotateCcw } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const EstimateWorkbench = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Data state
  const [domains, setDomains] = useState([]);
  const [categories, setCategories] = useState([]);
  const [standards, setStandards] = useState([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);
  
  // Estimate state
  const [estimateName, setEstimateName] = useState('New Estimate');
  const [lineItems, setLineItems] = useState([]);
  const [taxRate, setTaxRate] = useState(13); // Ontario HST
  const [markupPercent, setMarkupPercent] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  // UI state
  const [isLibraryCollapsed, setIsLibraryCollapsed] = useState(false);
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  
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
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
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
  }, []);
  
  useEffect(() => {
    fetchLibraryData();
  }, [fetchLibraryData]);
  
  // Add item to estimate
  const handleAddItem = useCallback((standard) => {
    // Check if already exists
    const existingIndex = lineItems.findIndex(item => item.standard_id === standard.id);
    
    if (existingIndex >= 0) {
      // Increment quantity
      setLineItems(prev => prev.map((item, idx) => 
        idx === existingIndex 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
      toast.success(`Added another ${standard.production_name}`);
    } else {
      // Find domain name for grouping
      const domain = domains.find(d => d.id === standard.knowledge_domain_id);
      
      // Add new line item with snapshot of current pricing
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
        // Snapshot data for historical preservation (Phase 4)
        snapshot: {
          price_per_unit: standard.price_per_unit || standard.labor_price || 0,
          material_price: standard.material_price || 0,
          labor_price: standard.labor_price || 0,
          captured_at: new Date().toISOString()
        }
      };
      
      setLineItems(prev => [...prev, newItem]);
      toast.success(`Added ${standard.production_name}`);
    }
  }, [lineItems, domains]);
  
  // Update line item
  const handleUpdateItem = useCallback((itemId, updates) => {
    setLineItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
    toast.success('Item updated');
  }, []);
  
  // Remove line item
  const handleRemoveItem = useCallback((itemId) => {
    setLineItems(prev => prev.filter(item => item.id !== itemId));
    toast.success('Item removed');
  }, []);
  
  // Reorder items
  const handleReorderItems = useCallback((reorderedItems) => {
    setLineItems(reorderedItems);
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
  
  // Export PDF (Phase 3 - jsPDF implementation)
  const handleExportPDF = useCallback(() => {
    if (lineItems.length === 0) {
      toast.error('Add items to the estimate before exporting');
      return;
    }
    
    try {
      const fileName = downloadEstimatePDF({
        estimateName,
        lineItems,
        calculations,
        taxRate,
        markupPercent,
        company: {
          name: 'Two Fungis Finishing', // TODO: Get from organization settings
          address: '',
          phone: '',
          email: ''
        },
        client: null, // TODO: Link to opportunity/client
        notes: ''
      });
      
      toast.success(`PDF exported: ${fileName}`);
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
  }, [estimateName, lineItems, calculations, taxRate, markupPercent]);
  
  // Send to client
  const handleSendToClient = useCallback(() => {
    toast.info('Send to client coming soon');
  }, []);
  
  // Clear estimate
  const handleClearEstimate = useCallback(() => {
    if (lineItems.length > 0 && !confirm('Clear all items from this estimate?')) {
      return;
    }
    setLineItems([]);
    setEstimateName('New Estimate');
    toast.success('Estimate cleared');
  }, [lineItems.length]);
  
  // Mobile view
  if (isMobile) {
    return (
      <MobileWorkbench
        lineItems={lineItems}
        domains={domains}
        categories={categories}
        standards={standards}
        isLoadingLibrary={isLoadingLibrary}
        calculations={calculations}
        onAddItem={handleAddItem}
        onUpdateItem={handleUpdateItem}
        onRemoveItem={handleRemoveItem}
        onExportPDF={handleExportPDF}
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
            <input
              type="text"
              value={estimateName}
              onChange={(e) => setEstimateName(e.target.value)}
              className="bg-transparent text-lg font-semibold text-white border-none focus:outline-none focus:ring-1 focus:ring-emerald-500/50 rounded px-1 -ml-1"
              placeholder="Estimate Name"
              data-testid="estimate-name-input"
            />
            <p className="text-xs text-neutral-500">
              {lineItems.length} items • {formatCurrency(calculations.total)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearEstimate}
            className="flex items-center gap-2 px-3 py-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            data-testid="clear-estimate-btn"
          >
            <RotateCcw className="w-4 h-4" />
            Clear
          </button>
          <button
            onClick={() => toast.info('Save functionality coming soon')}
            disabled={lineItems.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-medium rounded-lg transition-colors"
            data-testid="save-estimate-btn"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>
      
      {/* 3-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
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
