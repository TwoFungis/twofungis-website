/**
 * Production Library Workspace
 * =============================
 * 
 * The Company Knowledge Engine.
 * This is not another module. This is the company's operational memory.
 * 
 * Every future estimate, labour rate, production assembly, historical price,
 * productivity improvement, and Company Brain recommendation originates from this system.
 * 
 * Workflow:
 * Production Library → Production Assemblies → Estimate → Quote → Completed Project
 *                                                         ↓
 *                                               Production Library becomes smarter
 * 
 * "Every project makes the next project smarter."
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Library, 
  Plus, 
  Search,
  Filter,
  ChevronRight,
  Layers,
  BookOpen,
  Clock,
  Users,
  DollarSign,
  Package,
  FileText,
  Upload,
  Download,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  TrendingUp,
  Brain,
  Zap,
  FolderOpen,
  Tag,
  Sparkles,
  X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ============================================
// WORKSPACE TABS - Knowledge-First Architecture
// ============================================
const WORKSPACE_TABS = [
  { id: 'library', label: 'Production Library', icon: Library, description: 'Core production items' },
  { id: 'assemblies', label: 'Assemblies', icon: Layers, description: 'Production assemblies' },
  { id: 'scopes', label: 'Scope Library', icon: BookOpen, description: 'Reusable scope items' },
  { id: 'labour', label: 'Labour Standards', icon: Clock, description: 'Labour rates & crews' },
  { id: 'pricing', label: 'Pricing', icon: DollarSign, description: 'Historical pricing' },
  { id: 'templates', label: 'Templates', icon: FileText, description: 'Estimate templates' },
  { id: 'imports', label: 'Imports', icon: Upload, description: 'Import data' },
  { id: 'builder', label: 'Estimate Builder', icon: Package, description: 'Create estimates', comingSoon: true },
];

// ============================================
// TAB NAVIGATION
// ============================================
const TabNavigation = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
      {WORKSPACE_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => !tab.comingSoon && onTabChange(tab.id)}
            disabled={tab.comingSoon}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
              isActive
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : tab.comingSoon
                  ? 'text-zinc-600 cursor-not-allowed'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
            data-testid={`tab-${tab.id}`}
            title={tab.description}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.comingSoon && (
              <span className="text-[10px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">Soon</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ============================================
// EMPTY STATE
// ============================================
const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-zinc-800 rounded-xl flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-zinc-600" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-zinc-500 text-sm text-center max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-emerald-500 hover:bg-emerald-600 text-black font-medium px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
          data-testid="empty-state-action"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

// ============================================
// PRODUCTION LIBRARY TAB
// ============================================
const ProductionLibraryTab = ({ items, loading, onAddItem, onEditItem }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const categories = [...new Set(items.map(i => i.category).filter(Boolean))];
  
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery || 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }
  
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Library}
        title="Build Your Production Library"
        description="Start adding production items that your company uses. Every item you add becomes part of your company's operational intelligence."
        actionLabel="Add First Production Item"
        onAction={onAddItem}
      />
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search production items..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
            data-testid="search-input"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
          data-testid="category-filter"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button
          onClick={onAddItem}
          className="bg-emerald-500 hover:bg-emerald-600 text-black font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2"
          data-testid="add-item-btn"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Item</span>
        </button>
      </div>
      
      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors group cursor-pointer"
            onClick={() => onEditItem(item)}
            data-testid={`production-item-${item.id}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {item.category && (
                  <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); }}
                className="text-zinc-600 hover:text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
            <h4 className="font-medium text-white mb-1">{item.name}</h4>
            <p className="text-sm text-zinc-500 line-clamp-2 mb-3">{item.description}</p>
            <div className="flex items-center gap-4 text-xs text-zinc-600">
              <span className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                {item.unit || 'EA'}
              </span>
              {item.labour_rate && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  ${item.labour_rate}/hr
                </span>
              )}
              {item.avg_price && (
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  ${item.avg_price}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// ASSEMBLIES TAB
// ============================================
const AssembliesTab = ({ assemblies, loading, onAddAssembly }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }
  
  if (assemblies.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="Create Production Assemblies"
        description="Assemblies combine multiple production items into reusable groups. Build once, use everywhere."
        actionLabel="Create First Assembly"
        onAction={onAddAssembly}
      />
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {assemblies.map((assembly) => (
        <div
          key={assembly.id}
          className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
          data-testid={`assembly-${assembly.id}`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="font-medium text-white">{assembly.name}</h4>
              <p className="text-xs text-zinc-500">{assembly.item_count || 0} items</p>
            </div>
          </div>
          <p className="text-sm text-zinc-500 mb-3">{assembly.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-emerald-400 font-medium">${assembly.total_cost || 0}</span>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================
// SCOPE LIBRARY TAB
// ============================================
const ScopeLibraryTab = ({ scopes, loading, onAddScope }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }
  
  if (scopes.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Build Your Scope Library"
        description="Save commonly used scope items with descriptions and pricing. Pull them into any estimate instantly."
        actionLabel="Add Scope Item"
        onAction={onAddScope}
      />
    );
  }
  
  return (
    <div className="space-y-2">
      {scopes.map((scope) => (
        <div
          key={scope.id}
          className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors flex items-center justify-between"
          data-testid={`scope-${scope.id}`}
        >
          <div className="flex-1">
            <h4 className="font-medium text-white">{scope.name}</h4>
            <p className="text-sm text-zinc-500">{scope.description}</p>
          </div>
          <div className="text-right">
            <span className="text-white font-medium">${scope.default_price || 0}</span>
            <span className="text-zinc-500 text-sm ml-1">/{scope.unit || 'EA'}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================
// LABOUR STANDARDS TAB
// ============================================
const LabourStandardsTab = ({ labourRates, loading, onAddRate }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }
  
  if (labourRates.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Define Labour Standards"
        description="Set up labour rates, crew configurations, and productivity standards. These power your estimates."
        actionLabel="Add Labour Rate"
        onAction={onAddRate}
      />
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Crew Rates
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {labourRates.map((rate) => (
            <div
              key={rate.id}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-3"
              data-testid={`labour-rate-${rate.id}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-white">{rate.role}</span>
                <span className="text-emerald-400 font-bold">${rate.hourly_rate}/hr</span>
              </div>
              {rate.crew_size && (
                <p className="text-xs text-zinc-500">Typical crew: {rate.crew_size} workers</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// PRICING TAB
// ============================================
const PricingTab = ({ pricingData, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-emerald-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-white mb-1">Historical Pricing Intelligence</h4>
            <p className="text-sm text-zinc-400">
              As you complete projects and close estimates, pricing data will automatically feed back into your Production Library.
              Company Brain will learn from this data to improve future estimates.
            </p>
          </div>
        </div>
      </div>
      
      <EmptyState
        icon={DollarSign}
        title="No Pricing History Yet"
        description="Complete projects and estimates to build your pricing intelligence. Every closed job makes your estimates more accurate."
        actionLabel={null}
        onAction={null}
      />
    </div>
  );
};

// ============================================
// TEMPLATES TAB
// ============================================
const TemplatesTab = ({ templates, loading, onAddTemplate }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }
  
  if (templates.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Create Estimate Templates"
        description="Build reusable templates for common project types. Start new estimates in seconds with pre-populated items."
        actionLabel="Create Template"
        onAction={onAddTemplate}
      />
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {templates.map((template) => (
        <div
          key={template.id}
          className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
          data-testid={`template-${template.id}`}
        >
          <h4 className="font-medium text-white mb-1">{template.name}</h4>
          <p className="text-sm text-zinc-500 mb-3">{template.description}</p>
          <div className="flex items-center gap-4 text-xs text-zinc-600">
            <span>{template.item_count || 0} items</span>
            <span>Used {template.use_count || 0} times</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================
// IMPORTS TAB
// ============================================
const ImportsTab = ({ onImport }) => {
  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h4 className="text-lg font-medium text-white mb-2">Import Production Data</h4>
        <p className="text-zinc-500 text-sm mb-6">
          Upload CSV files to quickly populate your Production Library with existing data.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => onImport('production_items')}
            className="flex items-center gap-4 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors text-left"
            data-testid="import-production-items"
          >
            <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <Library className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h5 className="font-medium text-white">Production Items</h5>
              <p className="text-xs text-zinc-500">Items, categories, units, rates</p>
            </div>
          </button>
          
          <button
            onClick={() => onImport('labour_rates')}
            className="flex items-center gap-4 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors text-left"
            data-testid="import-labour-rates"
          >
            <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h5 className="font-medium text-white">Labour Rates</h5>
              <p className="text-xs text-zinc-500">Roles, hourly rates, crews</p>
            </div>
          </button>
          
          <button
            onClick={() => onImport('scope_library')}
            className="flex items-center gap-4 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors text-left"
            data-testid="import-scope-library"
          >
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h5 className="font-medium text-white">Scope Library</h5>
              <p className="text-xs text-zinc-500">Scope items and descriptions</p>
            </div>
          </button>
          
          <button
            onClick={() => onImport('historical_pricing')}
            className="flex items-center gap-4 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors text-left"
            data-testid="import-historical-pricing"
          >
            <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h5 className="font-medium text-white">Historical Pricing</h5>
              <p className="text-xs text-zinc-500">Past project pricing data</p>
            </div>
          </button>
        </div>
      </div>
      
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Download className="w-5 h-5 text-zinc-500 mt-0.5" />
          <div>
            <h5 className="font-medium text-white mb-1">Download Templates</h5>
            <p className="text-sm text-zinc-500 mb-3">
              Download CSV templates to see the expected format for each import type.
            </p>
            <div className="flex flex-wrap gap-2">
              <button className="text-xs text-emerald-400 hover:text-emerald-300 underline">
                production_items_template.csv
              </button>
              <button className="text-xs text-emerald-400 hover:text-emerald-300 underline">
                labour_rates_template.csv
              </button>
              <button className="text-xs text-emerald-400 hover:text-emerald-300 underline">
                scope_library_template.csv
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN PAGE COMPONENT
// ============================================
const ProductionLibraryPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('library');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [productionItems, setProductionItems] = useState([]);
  const [assemblies, setAssemblies] = useState([]);
  const [scopes, setScopes] = useState([]);
  const [labourRates, setLabourRates] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [pricingData, setPricingData] = useState([]);
  
  // Modal states
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // For now, use localStorage as placeholder until backend is built
      // This will be replaced with actual Supabase queries
      
      const storedItems = localStorage.getItem('tradeos_production_items');
      const storedAssemblies = localStorage.getItem('tradeos_assemblies');
      const storedScopes = localStorage.getItem('tradeos_scopes');
      const storedLabour = localStorage.getItem('tradeos_labour_rates');
      const storedTemplates = localStorage.getItem('tradeos_templates');
      
      setProductionItems(storedItems ? JSON.parse(storedItems) : []);
      setAssemblies(storedAssemblies ? JSON.parse(storedAssemblies) : []);
      setScopes(storedScopes ? JSON.parse(storedScopes) : []);
      setLabourRates(storedLabour ? JSON.parse(storedLabour) : []);
      setTemplates(storedTemplates ? JSON.parse(storedTemplates) : []);
      
    } catch (error) {
      console.error('Error fetching production data:', error);
      toast.error('Failed to load production library');
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Handlers
  const handleAddItem = () => {
    setEditingItem(null);
    setShowItemModal(true);
  };
  
  const handleEditItem = (item) => {
    setEditingItem(item);
    setShowItemModal(true);
  };
  
  const handleAddAssembly = () => {
    toast.info('Assembly creation coming soon');
  };
  
  const handleAddScope = () => {
    toast.info('Scope item creation coming soon');
  };
  
  const handleAddRate = () => {
    toast.info('Labour rate creation coming soon');
  };
  
  const handleAddTemplate = () => {
    toast.info('Template creation coming soon');
  };
  
  const handleImport = (type) => {
    toast.info(`${type} import coming soon`);
  };
  
  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'library':
        return (
          <ProductionLibraryTab
            items={productionItems}
            loading={loading}
            onAddItem={handleAddItem}
            onEditItem={handleEditItem}
          />
        );
      case 'assemblies':
        return (
          <AssembliesTab
            assemblies={assemblies}
            loading={loading}
            onAddAssembly={handleAddAssembly}
          />
        );
      case 'scopes':
        return (
          <ScopeLibraryTab
            scopes={scopes}
            loading={loading}
            onAddScope={handleAddScope}
          />
        );
      case 'labour':
        return (
          <LabourStandardsTab
            labourRates={labourRates}
            loading={loading}
            onAddRate={handleAddRate}
          />
        );
      case 'pricing':
        return (
          <PricingTab
            pricingData={pricingData}
            loading={loading}
          />
        );
      case 'templates':
        return (
          <TemplatesTab
            templates={templates}
            loading={loading}
            onAddTemplate={handleAddTemplate}
          />
        );
      case 'imports':
        return (
          <ImportsTab onImport={handleImport} />
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6" data-testid="production-library-page">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <Library className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Production Library</h1>
              <p className="text-sm text-zinc-500">Company Knowledge Engine</p>
            </div>
          </div>
        </div>
        
        {/* AI Insight Banner */}
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2">
          <Brain className="w-5 h-5 text-emerald-400" />
          <span className="text-sm text-emerald-400">
            Company Brain learns from your Production Library
          </span>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="border-b border-zinc-800 -mx-4 lg:-mx-8 px-4 lg:px-8">
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      
      {/* Tab Content */}
      <div className="min-h-[400px]">
        {renderTabContent()}
      </div>
      
      {/* Production Item Modal (placeholder) */}
      {showItemModal && (
        <ProductionItemModal
          item={editingItem}
          onClose={() => setShowItemModal(false)}
          onSave={(item) => {
            if (editingItem) {
              setProductionItems(prev => prev.map(i => i.id === item.id ? item : i));
            } else {
              setProductionItems(prev => [...prev, { ...item, id: Date.now().toString() }]);
            }
            localStorage.setItem('tradeos_production_items', JSON.stringify(productionItems));
            setShowItemModal(false);
            toast.success(editingItem ? 'Item updated' : 'Item added to Production Library');
          }}
        />
      )}
    </div>
  );
};

// ============================================
// PRODUCTION ITEM MODAL
// ============================================
const ProductionItemModal = ({ item, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: item?.name || '',
    description: item?.description || '',
    category: item?.category || '',
    subcategory: item?.subcategory || '',
    unit: item?.unit || 'EA',
    labour_rate: item?.labour_rate || '',
    avg_price: item?.avg_price || '',
    notes: item?.notes || '',
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    onSave({ ...item, ...form });
  };
  
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-4 lg:inset-y-8 lg:left-1/2 lg:-translate-x-1/2 lg:w-full lg:max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl z-50 flex flex-col overflow-hidden" data-testid="production-item-modal">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">
            {item ? 'Edit Production Item' : 'Add Production Item'}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
              placeholder="e.g., Standard Drywall Install"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50 h-20 resize-none"
              placeholder="Describe this production item..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
                placeholder="e.g., Drywall"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Subcategory</label>
              <input
                type="text"
                value={form.subcategory}
                onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
                placeholder="e.g., Installation"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Unit</label>
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
              >
                <option value="EA">EA (Each)</option>
                <option value="SF">SF (Sq Ft)</option>
                <option value="LF">LF (Lin Ft)</option>
                <option value="HR">HR (Hour)</option>
                <option value="LS">LS (Lump Sum)</option>
                <option value="CY">CY (Cubic Yard)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Labour Rate ($/hr)</label>
              <input
                type="number"
                value={form.labour_rate}
                onChange={(e) => setForm({ ...form, labour_rate: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
                placeholder="0.00"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Avg Price</label>
              <input
                type="number"
                value={form.avg_price}
                onChange={(e) => setForm({ ...form, avg_price: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50 h-20 resize-none"
              placeholder="Additional notes, specifications, or considerations..."
            />
          </div>
        </form>
        
        <div className="flex gap-3 p-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black py-2.5 rounded-lg font-medium transition-colors"
            data-testid="save-item-btn"
          >
            {item ? 'Update Item' : 'Add to Library'}
          </button>
        </div>
      </div>
    </>
  );
};

export default ProductionLibraryPage;
