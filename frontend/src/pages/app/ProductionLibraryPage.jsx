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
  const [domainFilter, setDomainFilter] = useState('all');
  
  const domains = [...new Set(items.map(i => i.knowledge_domains?.name).filter(Boolean))];
  
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery || 
      item.production_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.production_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDomain = domainFilter === 'all' || item.knowledge_domains?.name === domainFilter;
    return matchesSearch && matchesDomain;
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
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
          data-testid="domain-filter"
        >
          <option value="all">All Domains</option>
          {domains.map(d => (
            <option key={d} value={d}>{d}</option>
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
                <span className="text-xs font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                  {item.production_code}
                </span>
                {item.knowledge_domains?.name && (
                  <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                    {item.knowledge_domains.name}
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
            <h4 className="font-medium text-white mb-1">{item.production_name}</h4>
            <p className="text-sm text-zinc-500 line-clamp-2 mb-3">{item.description}</p>
            <div className="flex items-center gap-4 text-xs text-zinc-600">
              <span className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                {item.measurement_units?.code || 'EA'}
              </span>
              {item.production_per_day && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {item.production_per_day}/day
                </span>
              )}
              {item.standard_rate && (
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  ${item.standard_rate}
                </span>
              )}
            </div>
            {item.is_company_standard && (
              <div className="mt-2">
                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded uppercase font-mono">
                  Company Standard
                </span>
              </div>
            )}
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
  
  // Reference data
  const [knowledgeDomains, setKnowledgeDomains] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [measurementUnits, setMeasurementUnits] = useState([]);
  const [stats, setStats] = useState(null);
  
  // Get auth token
  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    };
  }, []);
  
  // Fetch reference data (domains, categories, units)
  const fetchReferenceData = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      
      const [domainsRes, categoriesRes, unitsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/production-library/domains`, { headers }),
        fetch(`${API_URL}/api/production-library/service-categories`, { headers }),
        fetch(`${API_URL}/api/production-library/units`, { headers }),
        fetch(`${API_URL}/api/production-library/stats`, { headers })
      ]);
      
      if (domainsRes.ok) {
        const data = await domainsRes.json();
        setKnowledgeDomains(data.domains || []);
      }
      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setServiceCategories(data.categories || []);
      }
      if (unitsRes.ok) {
        const data = await unitsRes.json();
        setMeasurementUnits(data.units || []);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Error fetching reference data:', error);
    }
  }, [getAuthHeaders]);
  
  // Fetch production items
  const fetchProductionItems = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/production-library/items?per_page=100`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        setProductionItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching production items:', error);
    }
  }, [getAuthHeaders]);
  
  // Fetch assemblies
  const fetchAssemblies = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/production-library/assemblies`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        setAssemblies(data.assemblies || []);
      }
    } catch (error) {
      console.error('Error fetching assemblies:', error);
    }
  }, [getAuthHeaders]);
  
  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      await Promise.all([
        fetchReferenceData(),
        fetchProductionItems(),
        fetchAssemblies()
      ]);
    } catch (error) {
      console.error('Error fetching production data:', error);
      toast.error('Failed to load production library');
    } finally {
      setLoading(false);
    }
  }, [user, fetchReferenceData, fetchProductionItems, fetchAssemblies]);
  
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
      
      {/* Production Item Modal */}
      {showItemModal && (
        <ProductionItemModal
          item={editingItem}
          knowledgeDomains={knowledgeDomains}
          measurementUnits={measurementUnits}
          serviceCategories={serviceCategories}
          onClose={() => setShowItemModal(false)}
          onSave={async (itemData) => {
            try {
              const headers = await getAuthHeaders();
              
              if (editingItem) {
                // Update existing item
                const response = await fetch(`${API_URL}/api/production-library/items/${editingItem.id}`, {
                  method: 'PUT',
                  headers,
                  body: JSON.stringify(itemData)
                });
                
                if (response.ok) {
                  toast.success('Item updated');
                  fetchProductionItems();
                } else {
                  toast.error('Failed to update item');
                }
              } else {
                // Create new item
                const response = await fetch(`${API_URL}/api/production-library/items`, {
                  method: 'POST',
                  headers,
                  body: JSON.stringify(itemData)
                });
                
                if (response.ok) {
                  toast.success('Item added to Production Library');
                  fetchProductionItems();
                } else {
                  const error = await response.json();
                  toast.error(error.detail || 'Failed to create item');
                }
              }
              
              setShowItemModal(false);
            } catch (error) {
              console.error('Error saving item:', error);
              toast.error('Failed to save item');
            }
          }}
        />
      )}
    </div>
  );
};

// ============================================
// PRODUCTION ITEM MODAL
// ============================================
const ProductionItemModal = ({ item, knowledgeDomains, measurementUnits, serviceCategories, onClose, onSave }) => {
  const [form, setForm] = useState({
    production_code: item?.production_code || '',
    production_name: item?.production_name || '',
    description: item?.description || '',
    knowledge_domain_id: item?.knowledge_domain_id || '',
    measurement_unit_id: item?.measurement_unit_id || '',
    production_per_day: item?.production_per_day || '',
    crew_size: item?.crew_size || '1',
    labour_hours: item?.labour_hours || '',
    standard_rate: item?.standard_rate || '',
    premium_rate: item?.premium_rate || '',
    complex_rate: item?.complex_rate || '',
    is_company_standard: item?.is_company_standard || false,
    notes: item?.notes || '',
    service_category_ids: item?.service_categories?.map(sc => sc.id) || []
  });
  const [saving, setSaving] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.production_code.trim()) {
      toast.error('Production Code is required');
      return;
    }
    if (!form.production_name.trim()) {
      toast.error('Production Name is required');
      return;
    }
    if (!form.knowledge_domain_id) {
      toast.error('Knowledge Domain is required');
      return;
    }
    if (!form.measurement_unit_id) {
      toast.error('Measurement Unit is required');
      return;
    }
    
    setSaving(true);
    try {
      await onSave({
        production_code: form.production_code.trim(),
        production_name: form.production_name.trim(),
        description: form.description.trim() || null,
        knowledge_domain_id: form.knowledge_domain_id,
        measurement_unit_id: form.measurement_unit_id,
        production_per_day: form.production_per_day ? parseFloat(form.production_per_day) : null,
        crew_size: form.crew_size ? parseFloat(form.crew_size) : 1,
        labour_hours: form.labour_hours ? parseFloat(form.labour_hours) : null,
        standard_rate: form.standard_rate ? parseFloat(form.standard_rate) : null,
        premium_rate: form.premium_rate ? parseFloat(form.premium_rate) : null,
        complex_rate: form.complex_rate ? parseFloat(form.complex_rate) : null,
        is_company_standard: form.is_company_standard,
        notes: form.notes.trim() || null,
        service_category_ids: form.service_category_ids
      });
    } finally {
      setSaving(false);
    }
  };
  
  const toggleServiceCategory = (catId) => {
    setForm(prev => ({
      ...prev,
      service_category_ids: prev.service_category_ids.includes(catId)
        ? prev.service_category_ids.filter(id => id !== catId)
        : [...prev.service_category_ids, catId]
    }));
  };
  
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-4 lg:inset-y-8 lg:left-1/2 lg:-translate-x-1/2 lg:w-full lg:max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl z-50 flex flex-col overflow-hidden" data-testid="production-item-modal">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">
            {item ? 'Edit Production Item' : 'Add Production Item'}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Code and Name */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Production Code *</label>
              <input
                type="text"
                value={form.production_code}
                onChange={(e) => setForm({ ...form, production_code: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
                placeholder="e.g., FC-001"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Production Name *</label>
              <input
                type="text"
                value={form.production_name}
                onChange={(e) => setForm({ ...form, production_name: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
                placeholder="e.g., Door Casing Installation"
                required
              />
            </div>
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50 h-16 resize-none"
              placeholder="Describe this production item..."
            />
          </div>
          
          {/* Knowledge Domain and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Knowledge Domain *</label>
              <select
                value={form.knowledge_domain_id}
                onChange={(e) => setForm({ ...form, knowledge_domain_id: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
                required
              >
                <option value="">Select domain...</option>
                {knowledgeDomains.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Measurement Unit *</label>
              <select
                value={form.measurement_unit_id}
                onChange={(e) => setForm({ ...form, measurement_unit_id: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
                required
              >
                <option value="">Select unit...</option>
                {measurementUnits.map(u => (
                  <option key={u.id} value={u.id}>{u.code} - {u.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Production Standards */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Production/Day</label>
              <input
                type="number"
                value={form.production_per_day}
                onChange={(e) => setForm({ ...form, production_per_day: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
                placeholder="Units/day"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Crew Size</label>
              <input
                type="number"
                value={form.crew_size}
                onChange={(e) => setForm({ ...form, crew_size: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
                placeholder="1"
                step="0.5"
                min="0.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Labour Hours/Unit</label>
              <input
                type="number"
                value={form.labour_hours}
                onChange={(e) => setForm({ ...form, labour_hours: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
                placeholder="0.00"
                step="0.0001"
              />
            </div>
          </div>
          
          {/* Pricing Tiers */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Standard Rate ($)</label>
              <input
                type="number"
                value={form.standard_rate}
                onChange={(e) => setForm({ ...form, standard_rate: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
                placeholder="0.00"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Premium Rate ($)</label>
              <input
                type="number"
                value={form.premium_rate}
                onChange={(e) => setForm({ ...form, premium_rate: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
                placeholder="0.00"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Complex Rate ($)</label>
              <input
                type="number"
                value={form.complex_rate}
                onChange={(e) => setForm({ ...form, complex_rate: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>
          
          {/* Service Categories */}
          {serviceCategories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Service Categories</label>
              <div className="flex flex-wrap gap-2">
                {serviceCategories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleServiceCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      form.service_category_ids.includes(cat.id)
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50 h-16 resize-none"
              placeholder="Additional notes..."
            />
          </div>
          
          {/* Company Standard Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, is_company_standard: !form.is_company_standard })}
              className={`w-10 h-6 rounded-full transition-colors relative ${
                form.is_company_standard ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                form.is_company_standard ? 'left-5' : 'left-1'
              }`} />
            </button>
            <span className="text-sm text-zinc-400">Mark as Company Standard</span>
          </div>
        </form>
        
        <div className="flex gap-3 p-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-lg font-medium transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            data-testid="save-item-btn"
          >
            {saving ? 'Saving...' : (item ? 'Update Item' : 'Add to Library')}
          </button>
        </div>
      </div>
    </>
  );
};

export default ProductionLibraryPage;
