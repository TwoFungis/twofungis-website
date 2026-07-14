/**
 * Production Library Workspace v3.0
 * ==================================
 * 
 * THE COMPANY KNOWLEDGE ENGINE
 * 
 * This is not another database. This is where company knowledge lives.
 * Every interaction should feel: Fast, Professional, Organized, Searchable, Intelligent, Beautiful.
 * 
 * Design inspiration: Notion, Linear, Figma, Stripe Dashboard, Raycast
 * 
 * Architecture:
 * - Left Navigation (w-64) - Knowledge hierarchy
 * - Main Content Area - View-specific workspaces
 * - Right Detail Panel (w-[480px]) - Complete knowledge workspace
 * - Command Palette (Cmd+K) - Global operating tool
 * 
 * Language:
 * - Internal: production_item, production_code
 * - External: Company Standard, Standard Code
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Library,
  Layers,
  FolderTree,
  Tags,
  FileText,
  History,
  Archive,
  Search,
  Plus,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Filter,
  SortAsc,
  SortDesc,
  LayoutGrid,
  LayoutList,
  MoreHorizontal,
  Edit3,
  Copy,
  Trash2,
  Download,
  Upload,
  X,
  Check,
  Clock,
  DollarSign,
  Users,
  Package,
  Sparkles,
  Brain,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Command,
  ArrowRight,
  ArrowUpRight,
  Loader2,
  Settings2,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  Zap,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Link2,
  ExternalLink,
  Star,
  Bookmark,
  Share2,
  MessageSquare,
  Lightbulb,
  Info,
  Calendar,
  Hash,
  Ruler,
  Timer,
  Wrench,
  Hammer,
  Building2,
  Home,
  Factory,
  ShoppingCart
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import ImportWizard from '../../components/production/ImportWizard';
import ProductionHierarchyManager from '../../components/production/ProductionHierarchyManager';
import CreateStandardModal from '../../components/production/CreateStandardModal';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ============================================
// NAVIGATION CONFIGURATION
// ============================================
const NAV_SECTIONS = [
  {
    id: 'knowledge',
    label: 'Knowledge',
    items: [
      { id: 'standards', label: 'Company Standards', icon: Library, count: null, primary: true },
      { id: 'domains', label: 'Knowledge Domains', icon: FolderTree, count: null },
      { id: 'assemblies', label: 'Assemblies', icon: Layers, count: null },
    ]
  },
  {
    id: 'organization',
    label: 'Organization',
    items: [
      { id: 'categories', label: 'Service Categories', icon: Tags, count: null },
      { id: 'hierarchy', label: 'Hierarchy Settings', icon: Settings2, count: null },
      { id: 'templates', label: 'Templates', icon: FileText, count: null },
    ]
  },
  {
    id: 'history',
    label: 'History',
    items: [
      { id: 'historical', label: 'Production History', icon: History, count: null },
      { id: 'archives', label: 'Archives', icon: Archive, count: null },
    ]
  }
];

// ============================================
// MOCK DATA FOR COMPANY BRAIN INSIGHTS
// ============================================
const generateMockInsights = (item) => {
  const insights = [
    {
      type: 'pricing',
      icon: DollarSign,
      color: 'amber',
      message: 'Pricing has not been reviewed in 14 months.',
      action: 'Review pricing'
    },
    {
      type: 'usage',
      icon: TrendingUp,
      color: 'emerald',
      message: 'This standard appears in 73% of Multifamily estimates.',
      action: null
    },
    {
      type: 'relationship',
      icon: Link2,
      color: 'blue',
      message: 'Commonly used with MDF Baseboard and Crown Moulding.',
      action: 'View related'
    },
    {
      type: 'productivity',
      icon: Zap,
      color: 'purple',
      message: 'Production rate is 11% higher than similar standards.',
      action: null
    },
    {
      type: 'suggestion',
      icon: Lightbulb,
      color: 'cyan',
      message: 'Consider converting this into an Assembly with related items.',
      action: 'Create Assembly'
    }
  ];
  
  // Return 2-3 random insights
  const shuffled = insights.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.floor(Math.random() * 2) + 2);
};

const generateMockRelationships = () => ({
  assemblies: Math.floor(Math.random() * 15) + 1,
  estimates: Math.floor(Math.random() * 100) + 10,
  relatedStandards: [
    { code: 'FC-002', name: 'Base Trim Installation' },
    { code: 'FC-003', name: 'Crown Moulding Installation' },
    { code: 'DH-001', name: 'Door Hardware' }
  ],
  frequentlyUsedWith: ['MDF Baseboard', 'Colonial Casing', 'Door Stop'],
  lastUsedInEstimate: '3 days ago',
  averageQuantityPerProject: 120
});

// ============================================
// LEFT NAVIGATION
// ============================================
const LeftNavigation = ({ activeView, onViewChange, counts, collapsed, onToggleCollapse, onNewStandard }) => {
  const [expandedSections, setExpandedSections] = useState(['knowledge', 'organization']);
  
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  if (collapsed) {
    return (
      <div className="w-16 bg-[#0A0A0A] border-r border-neutral-800 flex flex-col py-4">
        <button
          onClick={onToggleCollapse}
          className="mx-auto mb-4 p-2 text-neutral-500 hover:text-white hover:bg-neutral-900 rounded-lg transition-colors"
          data-testid="expand-nav-btn"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        {NAV_SECTIONS.map(section => 
          section.items.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`mx-auto mb-1 p-2.5 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : 'text-neutral-500 hover:text-white hover:bg-neutral-900'
                }`}
                title={item.label}
                data-testid={`nav-${item.id}-collapsed`}
              >
                <Icon className="w-5 h-5" strokeWidth={1.5} />
              </button>
            );
          })
        )}
      </div>
    );
  }
  
  return (
    <div className="w-64 bg-[#0A0A0A] border-r border-neutral-800 flex flex-col" data-testid="left-navigation">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <Library className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-sm font-medium text-white">Production Library</h2>
              <p className="text-[11px] text-neutral-500">Company Knowledge Engine</p>
            </div>
          </div>
          <button
            onClick={onToggleCollapse}
            className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-900 rounded transition-colors"
            data-testid="collapse-nav-btn"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </div>
      
      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-2">
        {NAV_SECTIONS.map((section) => {
          const isExpanded = expandedSections.includes(section.id);
          
          return (
            <div key={section.id} className="mb-1">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-4 py-2 text-[11px] uppercase tracking-widest font-medium text-neutral-500 hover:text-neutral-300 transition-colors"
                data-testid={`nav-section-${section.id}`}
              >
                <span>{section.label}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
              </button>
              
              {isExpanded && (
                <div className="mt-1 space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    const count = counts?.[item.id] ?? null;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => onViewChange(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all ${
                          isActive
                            ? 'bg-emerald-500/10 text-white border-l-2 border-emerald-500'
                            : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50 border-l-2 border-transparent'
                        }`}
                        data-testid={`nav-${item.id}`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : ''}`} strokeWidth={1.5} />
                        <span className="flex-1 text-left">{item.label}</span>
                        {count !== null && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-500'
                          }`}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Quick Actions */}
      <div className="p-3 border-t border-neutral-800">
        <button
          onClick={onNewStandard}
          className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-medium px-4 py-2.5 rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)]"
          data-testid="new-standard-btn"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          <span>New Standard</span>
        </button>
      </div>
    </div>
  );
};

// ============================================
// COMMAND PALETTE (Global Search)
// ============================================
const CommandPalette = ({ isOpen, onClose, items, domains, categories, assemblies, onSelectItem, onAction }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  
  const recentItems = useMemo(() => items.slice(0, 5), [items]);
  
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);
  
  const filteredResults = useMemo(() => {
    if (!query.trim()) {
      return {
        actions: [
          { id: 'create-standard', label: 'Create Company Standard', icon: Plus, shortcut: 'N' },
          { id: 'create-assembly', label: 'Create Assembly', icon: Layers, shortcut: 'A' },
          { id: 'import', label: 'Import Knowledge', icon: Upload, shortcut: 'I' },
        ],
        recent: recentItems,
        items: [],
        domains: [],
        assemblies: []
      };
    }
    
    const q = query.toLowerCase();
    return {
      actions: [],
      recent: [],
      items: items.filter(item => 
        item.production_code?.toLowerCase().includes(q) ||
        item.production_name?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
      ).slice(0, 5),
      domains: domains.filter(d => d.name?.toLowerCase().includes(q)).slice(0, 3),
      assemblies: assemblies.filter(a => a.name?.toLowerCase().includes(q)).slice(0, 3)
    };
  }, [query, items, domains, assemblies, recentItems]);
  
  const allResults = useMemo(() => {
    const results = [];
    filteredResults.actions.forEach(a => results.push({ type: 'action', ...a }));
    filteredResults.recent.forEach(r => results.push({ type: 'recent', ...r }));
    filteredResults.items.forEach(i => results.push({ type: 'item', ...i }));
    filteredResults.domains.forEach(d => results.push({ type: 'domain', ...d }));
    filteredResults.assemblies.forEach(a => results.push({ type: 'assembly', ...a }));
    return results;
  }, [filteredResults]);
  
  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && allResults[selectedIndex]) {
        e.preventDefault();
        const selected = allResults[selectedIndex];
        if (selected.type === 'action') {
          onAction(selected.id);
        } else if (selected.type === 'item' || selected.type === 'recent') {
          onSelectItem(selected);
        }
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, allResults, selectedIndex, onAction, onSelectItem]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]" data-testid="command-palette">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#111111] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-800">
          <Search className="w-5 h-5 text-neutral-500" strokeWidth={1.5} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Search standards, assemblies, domains..."
            className="flex-1 bg-transparent text-white placeholder-neutral-500 text-base focus:outline-none"
            data-testid="command-palette-input"
          />
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-[10px] text-neutral-500 font-mono">
            ESC
          </kbd>
        </div>
        
        {/* Results */}
        <div className="max-h-[450px] overflow-y-auto">
          {!query.trim() ? (
            <div className="py-2">
              {/* Quick Actions */}
              <div className="px-3 py-2">
                <div className="px-2 py-1.5 text-[11px] uppercase tracking-widest font-medium text-neutral-500">
                  Quick Actions
                </div>
                {filteredResults.actions.map((action, i) => {
                  const Icon = action.icon;
                  const isSelected = selectedIndex === i;
                  return (
                    <button
                      key={action.id}
                      onClick={() => { onAction(action.id); onClose(); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                        isSelected ? 'bg-emerald-500/10 text-white' : 'hover:bg-neutral-900 text-neutral-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-emerald-500/20' : 'bg-neutral-800'
                      }`}>
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-neutral-400'}`} strokeWidth={1.5} />
                      </div>
                      <span className="flex-1">{action.label}</span>
                      <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-[10px] font-mono text-neutral-500">
                        {action.shortcut}
                      </kbd>
                    </button>
                  );
                })}
              </div>
              
              {/* Recent Standards */}
              {filteredResults.recent.length > 0 && (
                <div className="px-3 py-2 border-t border-neutral-800/50 mt-2">
                  <div className="px-2 py-1.5 text-[11px] uppercase tracking-widest font-medium text-neutral-500">
                    Recent Standards
                  </div>
                  {filteredResults.recent.map((item, i) => {
                    const isSelected = selectedIndex === filteredResults.actions.length + i;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { onSelectItem(item); onClose(); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                          isSelected ? 'bg-emerald-500/10' : 'hover:bg-neutral-900'
                        }`}
                      >
                        <Library className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-neutral-500'}`} strokeWidth={1.5} />
                        <span className="font-mono text-xs text-emerald-400">{item.production_code}</span>
                        <span className={`flex-1 text-sm truncate ${isSelected ? 'text-white' : 'text-neutral-300'}`}>
                          {item.production_name}
                        </span>
                        <Clock className="w-3 h-3 text-neutral-600" strokeWidth={1.5} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : allResults.length === 0 ? (
            <div className="p-8 text-center">
              <Search className="w-10 h-10 text-neutral-700 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-neutral-400">No results found for &quot;{query}&quot;</p>
              <p className="text-sm text-neutral-600 mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="py-2">
              {/* Search Results */}
              {filteredResults.items.length > 0 && (
                <div className="px-3 py-2">
                  <div className="px-2 py-1.5 text-[11px] uppercase tracking-widest font-medium text-neutral-500">
                    Company Standards
                  </div>
                  {filteredResults.items.map((item, i) => {
                    const isSelected = selectedIndex === i;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { onSelectItem(item); onClose(); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                          isSelected ? 'bg-emerald-500/10' : 'hover:bg-neutral-900'
                        }`}
                      >
                        <Library className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-neutral-500'}`} strokeWidth={1.5} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-emerald-400">{item.production_code}</span>
                            <span className={`text-sm truncate ${isSelected ? 'text-white' : 'text-neutral-300'}`}>
                              {item.production_name}
                            </span>
                          </div>
                          {item.knowledge_domains?.name && (
                            <span className="text-xs text-neutral-600">{item.knowledge_domains.name}</span>
                          )}
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-600" strokeWidth={1.5} />
                      </button>
                    );
                  })}
                </div>
              )}
              
              {/* Domains */}
              {filteredResults.domains.length > 0 && (
                <div className="px-3 py-2 border-t border-neutral-800/50">
                  <div className="px-2 py-1.5 text-[11px] uppercase tracking-widest font-medium text-neutral-500">
                    Knowledge Domains
                  </div>
                  {filteredResults.domains.map((domain) => (
                    <button
                      key={domain.id}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-900 transition-colors text-left"
                    >
                      <FolderTree className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
                      <span className="text-sm text-neutral-300">{domain.name}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Assemblies */}
              {filteredResults.assemblies.length > 0 && (
                <div className="px-3 py-2 border-t border-neutral-800/50">
                  <div className="px-2 py-1.5 text-[11px] uppercase tracking-widest font-medium text-neutral-500">
                    Assemblies
                  </div>
                  {filteredResults.assemblies.map((assembly) => (
                    <button
                      key={assembly.id}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-900 transition-colors text-left"
                    >
                      <Layers className="w-4 h-4 text-purple-400" strokeWidth={1.5} />
                      <span className="text-sm text-neutral-300">{assembly.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-neutral-800 bg-neutral-900/50">
          <div className="flex items-center gap-4 text-[11px] text-neutral-600">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded font-mono">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded font-mono">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded font-mono">Esc</kbd>
              Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPANY STANDARDS VIEW (Main View)
// ============================================
const CompanyStandardsView = ({ 
  items, 
  domains, 
  categories,
  loading,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  filters,
  onFilterChange,
  sortConfig,
  onSortChange,
  selectedItems,
  onSelectItem,
  onSelectAll,
  onBulkAction,
  onOpenItem,
  onImport,
  onNewStandard
}) => {
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = [...items];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.production_code?.toLowerCase().includes(q) ||
        item.production_name?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
      );
    }
    
    if (filters.domain && filters.domain !== 'all') {
      result = result.filter(item => item.knowledge_domain_id === filters.domain);
    }
    if (filters.companyStandard) {
      result = result.filter(item => item.is_company_standard);
    }
    if (filters.status === 'active') {
      result = result.filter(item => !item.is_archived);
    } else if (filters.status === 'archived') {
      result = result.filter(item => item.is_archived);
    }
    
    result.sort((a, b) => {
      let aVal = a[sortConfig.field];
      let bVal = b[sortConfig.field];
      
      if (sortConfig.field === 'domain') {
        aVal = a.knowledge_domains?.name || '';
        bVal = b.knowledge_domains?.name || '';
      }
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal?.toLowerCase() || '';
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [items, searchQuery, filters, sortConfig]);
  
  if (items.length === 0 && !loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Library className="w-10 h-10 text-emerald-400" strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">Build Your Company Standards</h3>
          <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
            Import your company&apos;s production knowledge to get started. Every standard you add becomes part of your operational intelligence.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onImport}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-medium px-6 py-3 rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)]"
              data-testid="import-knowledge-btn"
            >
              <Upload className="w-4 h-4" strokeWidth={2} />
              Import Knowledge
            </button>
            <button 
              onClick={onNewStandard}
              className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-800 px-6 py-3 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
              Add Manually
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 flex flex-col min-w-0 p-6">
      {/* Header */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" strokeWidth={1.5} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by code, name, or description..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
              data-testid="grid-search-input"
            />
          </div>
          
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-colors ${
              showFilters || Object.values(filters).some(v => v && v !== 'all' && v !== 'active')
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
            data-testid="filter-toggle-btn"
          >
            <Filter className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-sm">Filters</span>
          </button>
          
          {/* View Mode Toggle */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'
              }`}
              data-testid="view-mode-list"
            >
              <LayoutList className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'
              }`}
              data-testid="view-mode-grid"
            >
              <LayoutGrid className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
          
          {/* Add Standard Button */}
          <button
            onClick={onNewStandard}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-medium px-4 py-2.5 rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)]"
            data-testid="add-standard-btn"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            <span>Add Standard</span>
          </button>
        </div>
        
        {/* Filter Row */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-neutral-900/50 border border-neutral-800 rounded-lg" data-testid="filter-panel">
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-500 uppercase tracking-wider">Domain</label>
              <select
                value={filters.domain || 'all'}
                onChange={(e) => onFilterChange('domain', e.target.value)}
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
              >
                <option value="all">All Domains</option>
                {domains.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-500 uppercase tracking-wider">Category</label>
              <select
                value={filters.category || 'all'}
                onChange={(e) => onFilterChange('category', e.target.value)}
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-500 uppercase tracking-wider">Status</label>
              <select
                value={filters.status || 'active'}
                onChange={(e) => onFilterChange('status', e.target.value)}
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
                <option value="all">All</option>
              </select>
            </div>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.companyStandard || false}
                onChange={(e) => onFilterChange('companyStandard', e.target.checked)}
                className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-emerald-500 focus:ring-emerald-500/20"
              />
              <span className="text-sm text-neutral-300">Company Standards Only</span>
            </label>
            
            <button
              onClick={() => onFilterChange('clear', null)}
              className="ml-auto text-sm text-neutral-500 hover:text-white transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
        
        {/* Bulk Actions */}
        {selectedItems.size > 0 && (
          <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <span className="text-sm text-emerald-400 font-medium">{selectedItems.size} selected</span>
            <div className="h-4 w-px bg-emerald-500/30" />
            <button onClick={() => onBulkAction('edit')} className="flex items-center gap-1.5 text-sm text-neutral-300 hover:text-white transition-colors">
              <Edit3 className="w-4 h-4" strokeWidth={1.5} />Edit
            </button>
            <button onClick={() => onBulkAction('duplicate')} className="flex items-center gap-1.5 text-sm text-neutral-300 hover:text-white transition-colors">
              <Copy className="w-4 h-4" strokeWidth={1.5} />Duplicate
            </button>
            <button onClick={() => onBulkAction('addToEstimate')} className="flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
              <ShoppingCart className="w-4 h-4" strokeWidth={1.5} />Add to Estimate
            </button>
            <button onClick={() => onBulkAction('archive')} className="flex items-center gap-1.5 text-sm text-neutral-300 hover:text-white transition-colors">
              <Archive className="w-4 h-4" strokeWidth={1.5} />Archive
            </button>
            <button onClick={() => onBulkAction('clear')} className="ml-auto text-sm text-neutral-500 hover:text-white transition-colors">
              Clear selection
            </button>
          </div>
        )}
      </div>
      
      {/* Items */}
      <div className="flex-1 overflow-auto bg-[#111111] border border-neutral-800 rounded-xl">
        {viewMode === 'list' ? (
          <div>
            {/* List Header */}
            <div className="flex items-center gap-4 px-4 py-2.5 bg-neutral-900/50 border-b border-neutral-800 text-xs uppercase tracking-wider font-medium text-neutral-500 sticky top-0">
              <div className="w-4">
                <input
                  type="checkbox"
                  checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                  onChange={onSelectAll}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
                />
              </div>
              <button onClick={() => onSortChange({ field: 'production_code', direction: sortConfig.field === 'production_code' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })} className="w-28 flex items-center gap-1 hover:text-neutral-300 transition-colors">
                Code {sortConfig.field === 'production_code' && (sortConfig.direction === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />)}
              </button>
              <button onClick={() => onSortChange({ field: 'production_name', direction: sortConfig.field === 'production_name' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })} className="flex-1 flex items-center gap-1 hover:text-neutral-300 transition-colors text-left">
                Standard Name {sortConfig.field === 'production_name' && (sortConfig.direction === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />)}
              </button>
              <div className="w-36">Domain</div>
              <div className="w-16 text-center">Unit</div>
              <div className="w-24 text-right">Rate</div>
              <div className="w-20 text-right">Output</div>
              <div className="w-24 text-center">Usage</div>
              <div className="w-8" />
            </div>
            
            {/* List Items */}
            {filteredItems.map((item) => {
              const mockRelations = generateMockRelationships();
              return (
                <div
                  key={item.id}
                  className={`group flex items-center gap-4 px-4 py-3.5 border-b border-neutral-800/50 hover:bg-neutral-900/50 transition-colors cursor-pointer ${
                    selectedItems.has(item.id) ? 'bg-emerald-500/5' : ''
                  }`}
                  onClick={() => onOpenItem(item)}
                  data-testid={`standard-row-${item.id}`}
                >
                  <div onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => onSelectItem(item.id)}
                      className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
                    />
                  </div>
                  
                  <div className="w-28 flex-shrink-0">
                    <span className="font-mono text-[13px] text-emerald-400">{item.production_code}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{item.production_name}</span>
                      {item.is_company_standard && (
                        <span className="flex-shrink-0 px-1.5 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-medium uppercase tracking-wider rounded flex items-center gap-1">
                          <Star className="w-3 h-3" strokeWidth={2} />
                          Standard
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-36 flex-shrink-0">
                    <span className="text-sm text-neutral-400">{item.knowledge_domains?.name || '-'}</span>
                  </div>
                  
                  <div className="w-16 flex-shrink-0 text-center">
                    <span className="font-mono text-xs bg-neutral-800 text-neutral-300 px-2 py-1 rounded">
                      {item.measurement_units?.code || 'EA'}
                    </span>
                  </div>
                  
                  <div className="w-24 flex-shrink-0 text-right">
                    {item.standard_rate ? (
                      <span className="font-mono text-sm text-white">${item.standard_rate.toFixed(2)}</span>
                    ) : (
                      <span className="text-sm text-neutral-600">-</span>
                    )}
                  </div>
                  
                  <div className="w-20 flex-shrink-0 text-right">
                    {item.production_per_day ? (
                      <span className="text-sm text-neutral-400">{item.production_per_day}/day</span>
                    ) : (
                      <span className="text-sm text-neutral-600">-</span>
                    )}
                  </div>
                  
                  {/* Usage indicator */}
                  <div className="w-24 flex-shrink-0 flex items-center justify-center gap-1">
                    <span className="text-xs text-neutral-500">{mockRelations.assemblies} assemblies</span>
                  </div>
                  
                  <div className="w-8 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded transition-colors">
                      <MoreHorizontal className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {filteredItems.map((item) => {
              const mockRelations = generateMockRelationships();
              return (
                <div
                  key={item.id}
                  className={`group relative bg-[#0A0A0A] border rounded-xl p-4 hover:border-neutral-700 transition-all cursor-pointer ${
                    selectedItems.has(item.id) ? 'border-emerald-500/50 ring-1 ring-emerald-500/20' : 'border-neutral-800'
                  }`}
                  onClick={() => onOpenItem(item)}
                  data-testid={`standard-card-${item.id}`}
                >
                  <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => onSelectItem(item.id)}
                      className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
                    />
                  </div>
                  
                  <div className="flex items-start justify-between mb-3">
                    <span className="font-mono text-xs text-emerald-400">{item.production_code}</span>
                    {item.is_company_standard && (
                      <Star className="w-4 h-4 text-amber-400" strokeWidth={2} fill="currentColor" />
                    )}
                  </div>
                  
                  <h4 className="text-sm font-medium text-white mb-1 line-clamp-2">{item.production_name}</h4>
                  
                  {item.knowledge_domains?.name && (
                    <div className="mb-3">
                      <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-1 rounded">
                        {item.knowledge_domains.name}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 pt-3 border-t border-neutral-800/50">
                    <span className="font-mono text-xs bg-neutral-800 text-neutral-300 px-2 py-1 rounded">
                      {item.measurement_units?.code || 'EA'}
                    </span>
                    {item.standard_rate && (
                      <span className="font-mono text-xs text-white">${item.standard_rate.toFixed(2)}</span>
                    )}
                    <span className="text-[10px] text-neutral-600 ml-auto">{mockRelations.assemblies} assemblies</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {filteredItems.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Search className="w-8 h-8 text-neutral-600 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-neutral-400">No standards match your filters</p>
              <button onClick={() => onFilterChange('clear', null)} className="mt-3 text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                Clear filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// KNOWLEDGE DOMAINS VIEW
// ============================================
const DomainsView = ({ domains, items, onSelectDomain, onImport }) => {
  // Calculate item counts per domain
  const domainStats = useMemo(() => {
    const stats = {};
    domains.forEach(d => {
      const domainItems = items.filter(i => i.knowledge_domain_id === d.id);
      stats[d.id] = {
        itemCount: domainItems.length,
        standardCount: domainItems.filter(i => i.is_company_standard).length,
        avgRate: domainItems.reduce((sum, i) => sum + (i.standard_rate || 0), 0) / (domainItems.length || 1)
      };
    });
    return stats;
  }, [domains, items]);
  
  const domainIcons = {
    'FC': Hammer,
    'DH': Home,
    'ML': Factory,
    'default': FolderTree
  };
  
  if (domains.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FolderTree className="w-10 h-10 text-blue-400" strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">Knowledge Domains</h3>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Domains organize your company standards into logical categories like Finish Carpentry, Doors &amp; Hardware, and more.
          </p>
          <button
            onClick={onImport}
            className="flex items-center gap-2 mx-auto bg-blue-500 hover:bg-blue-400 text-white font-medium px-6 py-3 rounded-lg transition-all"
          >
            <Upload className="w-4 h-4" strokeWidth={2} />
            Initialize Production Library
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="mb-6">
        <h2 className="text-xl font-medium text-white mb-1">Knowledge Domains</h2>
        <p className="text-sm text-neutral-500">Organize your company standards by trade specialty</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {domains.map((domain) => {
          const stats = domainStats[domain.id] || { itemCount: 0, standardCount: 0, avgRate: 0 };
          const IconComponent = domainIcons[domain.code] || domainIcons.default;
          
          return (
            <div
              key={domain.id}
              onClick={() => onSelectDomain(domain)}
              className="group bg-[#111111] border border-neutral-800 rounded-xl p-5 hover:border-blue-500/50 transition-all cursor-pointer"
              data-testid={`domain-card-${domain.id}`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <IconComponent className="w-6 h-6 text-blue-400" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-medium text-white mb-1">{domain.name}</h3>
                  {domain.code && (
                    <span className="font-mono text-xs text-neutral-500">{domain.code}</span>
                  )}
                </div>
              </div>
              
              {domain.description && (
                <p className="text-sm text-neutral-400 mb-4 line-clamp-2">{domain.description}</p>
              )}
              
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-neutral-800">
                <div className="text-center">
                  <div className="text-lg font-semibold text-white">{stats.itemCount}</div>
                  <div className="text-[10px] uppercase tracking-wider text-neutral-500">Standards</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-amber-400">{stats.standardCount}</div>
                  <div className="text-[10px] uppercase tracking-wider text-neutral-500">Core</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-emerald-400">
                    {stats.avgRate > 0 ? `$${stats.avgRate.toFixed(0)}` : '-'}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-neutral-500">Avg Rate</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// ASSEMBLIES VIEW
// ============================================
const AssembliesView = ({ assemblies, items, onSelectAssembly, onCreateAssembly }) => {
  // Show coming soon state regardless of assemblies count
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Layers className="w-10 h-10 text-purple-400" strokeWidth={1.5} />
        </div>
        <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-medium uppercase tracking-wider rounded-full mb-4">
          Coming Soon
        </span>
        <h3 className="text-xl font-medium text-white mb-2">Production Assemblies</h3>
        <p className="text-neutral-400 text-sm mb-4 leading-relaxed">
          Assemblies group related standards together. Build a door installation assembly with all hardware, trim, and finishing components.
        </p>
        <p className="text-neutral-500 text-xs">
          This feature is part of Phase 3 - Company Standards expansion.
        </p>
      </div>
    </div>
  );
};

// ============================================
// SERVICE CATEGORIES VIEW
// ============================================
const CategoriesView = ({ categories, items, onSelectCategory }) => {
  const categoryStats = useMemo(() => {
    const stats = {};
    categories.forEach(c => {
      stats[c.id] = {
        itemCount: items.filter(i => i.service_category_ids?.includes(c.id)).length
      };
    });
    return stats;
  }, [categories, items]);
  
  const categoryIcons = {
    'RES': Home,
    'COM': Building2,
    'IND': Factory,
    'MF': Building2,
    'default': Tags
  };
  
  if (categories.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Tags className="w-10 h-10 text-amber-400" strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">Service Categories</h3>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Categories define which project types your standards apply to - Residential, Commercial, Industrial, and more.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="mb-6">
        <h2 className="text-xl font-medium text-white mb-1">Service Categories</h2>
        <p className="text-sm text-neutral-500">Define which project types your standards apply to</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((category) => {
          const stats = categoryStats[category.id] || { itemCount: 0 };
          const IconComponent = categoryIcons[category.code] || categoryIcons.default;
          
          return (
            <div
              key={category.id}
              onClick={() => onSelectCategory(category)}
              className="group bg-[#111111] border border-neutral-800 rounded-xl p-4 hover:border-amber-500/50 transition-all cursor-pointer"
              data-testid={`category-card-${category.id}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                  <IconComponent className="w-5 h-5 text-amber-400" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">{category.name}</h3>
                  {category.code && (
                    <span className="font-mono text-[10px] text-neutral-500">{category.code}</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
                <span className="text-xs text-neutral-500">{stats.itemCount} standards</span>
                <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-amber-400 transition-colors" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// TEMPLATES VIEW
// ============================================
const TemplatesView = () => {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileText className="w-10 h-10 text-cyan-400" strokeWidth={1.5} />
        </div>
        <span className="inline-block px-3 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-medium uppercase tracking-wider rounded-full mb-4">
          Coming Soon
        </span>
        <h3 className="text-xl font-medium text-white mb-2">Estimate Templates</h3>
        <p className="text-neutral-400 text-sm mb-4 leading-relaxed">
          Save time by creating templates for common project types. Templates pre-populate estimates with your most-used standards and assemblies.
        </p>
        <p className="text-neutral-500 text-xs">
          This feature is part of Phase 3 - Company Standards expansion.
        </p>
      </div>
    </div>
  );
};

// ============================================
// ENHANCED DETAIL PANEL
// ============================================
const DetailPanel = ({ item, onClose, domains, categories, onAddToEstimate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const mockInsights = useMemo(() => item ? generateMockInsights(item) : [], [item]);
  const mockRelations = useMemo(() => generateMockRelationships(), []);
  
  if (!item) return null;
  
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'productivity', label: 'Productivity' },
    { id: 'usage', label: 'Usage' },
    { id: 'history', label: 'History' },
  ];
  
  return (
    <div 
      className="w-[480px] flex-shrink-0 bg-[#0A0A0A] border-l border-neutral-800 flex flex-col"
      data-testid="detail-panel"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-neutral-800">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm text-emerald-400">{item.production_code}</span>
              {item.is_company_standard && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-medium uppercase tracking-wider rounded">
                  <Star className="w-3 h-3" strokeWidth={2} fill="currentColor" />
                  Core Standard
                </span>
              )}
            </div>
            <h2 className="text-lg font-medium text-white">{item.production_name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            data-testid="close-detail-panel"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
        
        {/* Relationship Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 px-2 py-1 bg-purple-500/10 text-purple-400 text-xs rounded">
            <Layers className="w-3 h-3" strokeWidth={1.5} />
            {mockRelations.assemblies} Assemblies
          </span>
          <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded">
            <FileText className="w-3 h-3" strokeWidth={1.5} />
            {mockRelations.estimates} Estimates
          </span>
          <span className="flex items-center gap-1 px-2 py-1 bg-neutral-800 text-neutral-400 text-xs rounded">
            <Clock className="w-3 h-3" strokeWidth={1.5} />
            Last used {mockRelations.lastUsedInEstimate}
          </span>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-neutral-800 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-500 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-neutral-900 rounded-lg p-3 text-center">
                <div className="font-mono text-xl text-white">
                  {item.standard_rate ? `$${item.standard_rate.toFixed(2)}` : '-'}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-neutral-500 mt-1">Std Rate</div>
              </div>
              <div className="bg-neutral-900 rounded-lg p-3 text-center">
                <div className="font-mono text-xl text-white">
                  {item.production_per_day || '-'}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-neutral-500 mt-1">Per Day</div>
              </div>
              <div className="bg-neutral-900 rounded-lg p-3 text-center">
                <div className="font-mono text-xl text-white">
                  {item.measurement_units?.code || 'EA'}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-neutral-500 mt-1">Unit</div>
              </div>
            </div>
            
            {/* General Info */}
            <div>
              <h3 className="text-sm font-medium text-neutral-200 mb-3">General Information</h3>
              
              {item.description && (
                <div className="mb-3">
                  <label className="text-[11px] uppercase tracking-wider text-neutral-500 block mb-1">Description</label>
                  <p className="text-sm text-neutral-300">{item.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-neutral-500 block mb-1">Domain</label>
                  <span className="text-sm text-neutral-300">{item.knowledge_domains?.name || '-'}</span>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-neutral-500 block mb-1">Status</label>
                  <span className={`text-sm ${item.is_archived ? 'text-neutral-500' : 'text-emerald-400'}`}>
                    {item.is_archived ? 'Archived' : 'Active'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Frequently Used With */}
            <div>
              <h3 className="text-sm font-medium text-neutral-200 mb-3">Frequently Used With</h3>
              <div className="flex flex-wrap gap-2">
                {mockRelations.frequentlyUsedWith.map((name, i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-1 bg-neutral-800 text-neutral-300 text-xs rounded">
                    <Link2 className="w-3 h-3 text-neutral-500" strokeWidth={1.5} />
                    {name}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Company Brain Insights */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
                <h3 className="text-sm font-medium text-neutral-200">Company Brain</h3>
              </div>
              <div className="space-y-2">
                {mockInsights.map((insight, i) => {
                  const Icon = insight.icon;
                  const colorClasses = {
                    amber: 'bg-amber-500/5 border-amber-500/10 text-amber-400',
                    emerald: 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400',
                    blue: 'bg-blue-500/5 border-blue-500/10 text-blue-400',
                    purple: 'bg-purple-500/5 border-purple-500/10 text-purple-400',
                    cyan: 'bg-cyan-500/5 border-cyan-500/10 text-cyan-400',
                  };
                  
                  return (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${colorClasses[insight.color]}`}>
                      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                      <div className="flex-1">
                        <p className="text-sm text-neutral-300">{insight.message}</p>
                        {insight.action && (
                          <button className="text-xs text-emerald-400 hover:text-emerald-300 mt-1 transition-colors">
                            {insight.action} →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Related Standards */}
            <div>
              <h3 className="text-sm font-medium text-neutral-200 mb-3">Related Standards</h3>
              <div className="space-y-2">
                {mockRelations.relatedStandards.map((related, i) => (
                  <button key={i} className="w-full flex items-center gap-3 p-2 bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors text-left">
                    <Library className="w-4 h-4 text-neutral-500" strokeWidth={1.5} />
                    <span className="font-mono text-xs text-emerald-400">{related.code}</span>
                    <span className="text-sm text-neutral-300 flex-1 truncate">{related.name}</span>
                    <ChevronRight className="w-4 h-4 text-neutral-600" strokeWidth={1.5} />
                  </button>
                ))}
              </div>
            </div>
            
            {item.notes && (
              <div>
                <h3 className="text-sm font-medium text-neutral-200 mb-3">Notes</h3>
                <p className="text-sm text-neutral-400">{item.notes}</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'pricing' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-neutral-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-neutral-400">Standard Rate</span>
                  <span className="font-mono text-lg text-white">
                    {item.standard_rate ? `$${item.standard_rate.toFixed(2)}` : '-'}
                  </span>
                </div>
                <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: '60%' }} />
                </div>
                <span className="text-[10px] text-neutral-600 mt-1">Base pricing for normal conditions</span>
              </div>
              
              <div className="bg-neutral-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-neutral-400">Premium Rate</span>
                  <span className="font-mono text-lg text-amber-400">
                    {item.premium_rate ? `$${item.premium_rate.toFixed(2)}` : '-'}
                  </span>
                </div>
                <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: '75%' }} />
                </div>
                <span className="text-[10px] text-neutral-600 mt-1">Rush or overtime work</span>
              </div>
              
              <div className="bg-neutral-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-neutral-400">Complex Rate</span>
                  <span className="font-mono text-lg text-red-400">
                    {item.complex_rate ? `$${item.complex_rate.toFixed(2)}` : '-'}
                  </span>
                </div>
                <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: '90%' }} />
                </div>
                <span className="text-[10px] text-neutral-600 mt-1">Difficult access or conditions</span>
              </div>
            </div>
            
            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <div>
                  <p className="text-sm text-neutral-300">Pricing has not been reviewed in 14 months.</p>
                  <button className="text-xs text-amber-400 hover:text-amber-300 mt-1 transition-colors">
                    Review pricing →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'productivity' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-900 rounded-lg p-4 text-center">
                <div className="font-mono text-2xl text-white mb-1">
                  {item.production_per_day || '-'}
                </div>
                <div className="text-xs text-neutral-500">Units Per Day</div>
              </div>
              <div className="bg-neutral-900 rounded-lg p-4 text-center">
                <div className="font-mono text-2xl text-white mb-1">
                  {item.crew_size || 1}
                </div>
                <div className="text-xs text-neutral-500">Crew Size</div>
              </div>
            </div>
            
            <div className="bg-neutral-900 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-neutral-400">Labour Hours per Unit</span>
                <span className="font-mono text-lg text-white">
                  {item.labour_hours ? `${item.labour_hours.toFixed(2)} hrs` : '-'}
                </span>
              </div>
              <div className="text-xs text-neutral-600">
                Estimated time to complete one {item.measurement_units?.code || 'unit'}
              </div>
            </div>
            
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <div>
                  <p className="text-sm text-neutral-300">
                    Production rate is <span className="text-emerald-400 font-medium">11% higher</span> than similar standards.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'usage' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 text-center">
                <div className="font-mono text-2xl text-purple-400 mb-1">
                  {mockRelations.assemblies}
                </div>
                <div className="text-xs text-neutral-500">Assemblies</div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
                <div className="font-mono text-2xl text-blue-400 mb-1">
                  {mockRelations.estimates}
                </div>
                <div className="text-xs text-neutral-500">Estimates</div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-neutral-300 mb-3">Average per Project</h4>
              <div className="bg-neutral-900 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Typical Quantity</span>
                  <span className="font-mono text-white">{mockRelations.averageQuantityPerProject} {item.measurement_units?.code || 'EA'}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-neutral-300 mb-3">Used in Assemblies</h4>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 p-3 bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors text-left">
                  <Layers className="w-4 h-4 text-purple-400" strokeWidth={1.5} />
                  <span className="text-sm text-neutral-300 flex-1">Interior Door Complete</span>
                  <ChevronRight className="w-4 h-4 text-neutral-600" strokeWidth={1.5} />
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors text-left">
                  <Layers className="w-4 h-4 text-purple-400" strokeWidth={1.5} />
                  <span className="text-sm text-neutral-300 flex-1">Bedroom Trim Package</span>
                  <ChevronRight className="w-4 h-4 text-neutral-600" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'history' && (
          <div className="p-6 space-y-4">
            <h4 className="text-sm font-medium text-neutral-300 mb-3">Revision History</h4>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <div className="w-0.5 h-full bg-neutral-800" />
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">Created</span>
                    <span className="text-xs text-neutral-500">v1.0</span>
                  </div>
                  <p className="text-xs text-neutral-500 mb-1">Imported from CSV</p>
                  <span className="text-[10px] text-neutral-600">3 months ago</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <div className="w-0.5 h-full bg-neutral-800" />
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">Rate Updated</span>
                    <span className="text-xs text-neutral-500">v1.1</span>
                  </div>
                  <p className="text-xs text-neutral-500 mb-1">Standard rate: $7.50 → $8.50</p>
                  <span className="text-[10px] text-neutral-600">2 months ago</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 bg-amber-500 rounded-full" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">Marked as Standard</span>
                    <span className="text-xs text-neutral-500">v1.2</span>
                  </div>
                  <p className="text-xs text-neutral-500 mb-1">Designated as company standard</p>
                  <span className="text-[10px] text-neutral-600">1 month ago</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer Actions */}
      <div className="flex items-center gap-2 p-4 border-t border-neutral-800">
        <button 
          onClick={() => onAddToEstimate(item)}
          className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-medium px-4 py-2.5 rounded-lg transition-all"
        >
          <ShoppingCart className="w-4 h-4" strokeWidth={2} />
          Add to Estimate
        </button>
        <button className="p-2.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors">
          <Edit3 className="w-4 h-4" strokeWidth={1.5} />
        </button>
        <button className="p-2.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors">
          <Copy className="w-4 h-4" strokeWidth={1.5} />
        </button>
        <button className="p-2.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
};

// ============================================
// LOADING STATE
// ============================================
const LoadingState = () => (
  <div className="flex-1 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" strokeWidth={1.5} />
      <p className="text-sm text-neutral-500">Loading Company Knowledge...</p>
    </div>
  </div>
);

// ============================================
// MAIN WORKSPACE COMPONENT
// ============================================
const ProductionLibraryWorkspace = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const showImportWizard = searchParams.get('tab') === 'import';
  
  // State
  const [activeView, setActiveView] = useState('standards');
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectedItem, setSelectedItem] = useState(null);
  const [sortConfig, setSortConfig] = useState({ field: 'production_code', direction: 'asc' });
  const [filters, setFilters] = useState({ domain: 'all', category: 'all', status: 'active', companyStandard: false });
  const [session, setSession] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [units, setUnits] = useState([]);
  
  // Data
  const [items, setItems] = useState([]);
  const [domains, setDomains] = useState([]);
  const [categories, setCategories] = useState([]);
  const [assemblies, setAssemblies] = useState([]);
  
  const counts = useMemo(() => ({
    standards: items.length,
    domains: domains.length,
    categories: categories.length,
    assemblies: assemblies.length
  }), [items, domains, categories, assemblies]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setApiError(null);
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) return;
      setSession(currentSession);
      
      const headers = { 'Authorization': `Bearer ${currentSession.access_token}` };
      
      const [itemsRes, domainsRes, catsRes, assembliesRes, unitsRes] = await Promise.all([
        fetch(`${API_URL}/api/production-library/items?limit=500`, { headers }),
        fetch(`${API_URL}/api/production-library/domains`, { headers }),
        fetch(`${API_URL}/api/production-library/service-categories`, { headers }),
        fetch(`${API_URL}/api/production-library/assemblies`, { headers }),
        fetch(`${API_URL}/api/production-library/units`, { headers })
      ]);
      
      const anyFailed = [itemsRes, domainsRes, catsRes, assembliesRes].some(r => !r.ok);
      
      if (anyFailed) {
        const firstFail = [itemsRes, domainsRes, catsRes, assembliesRes].find(r => !r.ok);
        if (firstFail.status === 404 || firstFail.status === 500) {
          const errorData = await firstFail.json().catch(() => ({}));
          if (errorData.detail?.includes('migration') || errorData.detail?.includes('not exist') || errorData.detail?.includes('schema') || errorData.code === 'PGRST205') {
            setApiError('schema');
            toast.error('Database setup required. Please run the migration.', { duration: 5000 });
          } else {
            setApiError('api');
            toast.error('Failed to load Production Library. Please try again.', { duration: 4000 });
          }
        }
      }
      
      if (itemsRes.ok) setItems((await itemsRes.json()).items || []);
      if (domainsRes.ok) setDomains((await domainsRes.json()).domains || []);
      if (catsRes.ok) setCategories((await catsRes.json()).categories || []);
      if (assembliesRes.ok) setAssemblies((await assembliesRes.json()).assemblies || []);
      if (unitsRes.ok) setUnits((await unitsRes.json()).units || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setApiError('api');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Handlers
  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      newSet.has(itemId) ? newSet.delete(itemId) : newSet.add(itemId);
      return newSet;
    });
  };
  
  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(i => i.id)));
    }
  };
  
  const handleFilterChange = (key, value) => {
    if (key === 'clear') {
      setFilters({ domain: 'all', category: 'all', status: 'active', companyStandard: false });
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };
  
  const handleOpenItem = (item) => {
    // Navigate to the detail page instead of opening a panel
    navigate(`/app/production-library/items/${item.id}`);
  };
  const handleImport = () => setSearchParams({ tab: 'import' });
  const handleCloseImport = () => { setSearchParams({}); fetchData(); };
  const handleNewStandard = () => setShowCreateModal(true);
  const handleCreateAssembly = () => {
    // Assemblies feature shows Coming Soon state in the view
    // No action needed - the view already shows the Coming Soon message
  };
  const handleAddToEstimate = (item) => toast.info(`"${item.production_name}" ready for Estimate Builder`);
  
  // Handle standard created
  const handleStandardCreated = (newItem) => {
    setItems(prev => [newItem, ...prev]);
    setShowCreateModal(false);
  };

  // Bulk actions
  const handleBulkAction = async (action) => {
    if (selectedItems.size === 0) return;
    
    const selectedIds = Array.from(selectedItems);
    const selectedItemsList = items.filter(i => selectedIds.includes(i.id));
    
    switch (action) {
      case 'clear':
        setSelectedItems(new Set());
        break;
        
      case 'archive':
        if (!session?.access_token) return;
        try {
          // Archive all selected items
          const results = await Promise.all(
            selectedIds.map(id => 
              fetch(`${API_URL}/api/production-library/items/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
              })
            )
          );
          const successCount = results.filter(r => r.ok).length;
          if (successCount > 0) {
            toast.success(`Archived ${successCount} item${successCount > 1 ? 's' : ''}`);
            setItems(prev => prev.filter(i => !selectedIds.includes(i.id)));
            setSelectedItems(new Set());
          }
        } catch (error) {
          console.error('Archive error:', error);
          toast.error('Failed to archive items');
        }
        break;
        
      case 'duplicate':
        if (!session?.access_token) return;
        try {
          let duplicatedCount = 0;
          for (const item of selectedItemsList) {
            const newCode = `${item.production_code}-COPY`;
            const response = await fetch(`${API_URL}/api/production-library/items`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                ...item,
                id: undefined,
                production_code: newCode,
                production_name: `${item.production_name} (Copy)`,
                created_at: undefined,
                updated_at: undefined
              })
            });
            if (response.ok) {
              const data = await response.json();
              setItems(prev => [data.item, ...prev]);
              duplicatedCount++;
            }
          }
          if (duplicatedCount > 0) {
            toast.success(`Duplicated ${duplicatedCount} item${duplicatedCount > 1 ? 's' : ''}`);
            setSelectedItems(new Set());
          }
        } catch (error) {
          console.error('Duplicate error:', error);
          toast.error('Failed to duplicate items');
        }
        break;
        
      case 'edit':
        if (selectedItems.size === 1) {
          const item = items.find(i => i.id === selectedIds[0]);
          if (item) handleOpenItem(item);
        } else {
          toast.info('Select a single item to edit');
        }
        break;
        
      case 'addToEstimate':
        toast.info(`${selectedItems.size} item${selectedItems.size > 1 ? 's' : ''} ready for Estimate Builder`);
        break;
        
      default:
        break;
    }
  };

  const handleCommandAction = (actionId) => {
    if (actionId === 'create-standard') handleNewStandard();
    else if (actionId === 'create-assembly') handleCreateAssembly();
    else if (actionId === 'import') handleImport();
  };
  
  // Import Wizard view
  if (showImportWizard) {
    return (
      <div className="h-full flex flex-col bg-[#0A0A0A] overflow-hidden" data-testid="production-library-workspace">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#0A0A0A]/95 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={handleCloseImport} className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors">
              <ArrowRight className="w-5 h-5 rotate-180" strokeWidth={1.5} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <Upload className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-lg font-medium text-white tracking-tight">Import Company Knowledge</h1>
                <p className="text-xs text-neutral-500">Company Knowledge Engine</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <ImportWizard onComplete={handleCloseImport} onClose={handleCloseImport} />
        </div>
      </div>
    );
  }
  
  // Render view content
  const renderViewContent = () => {
    if (loading) return <LoadingState />;
    
    if (apiError === 'schema') {
      return (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-amber-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">Database Setup Required</h3>
            <p className="text-neutral-400 text-sm mb-6">
              The Production Library tables need to be created. Run the migration in your Supabase dashboard.
            </p>
            <button onClick={handleImport} className="flex items-center gap-2 mx-auto bg-emerald-500 hover:bg-emerald-400 text-black font-medium px-6 py-3 rounded-lg transition-all">
              <Upload className="w-4 h-4" strokeWidth={2} />
              Go to Import Wizard
            </button>
          </div>
        </div>
      );
    }
    
    switch (activeView) {
      case 'standards':
        return (
          <CompanyStandardsView
            items={items}
            domains={domains}
            categories={categories}
            loading={loading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filters={filters}
            onFilterChange={handleFilterChange}
            sortConfig={sortConfig}
            onSortChange={setSortConfig}
            selectedItems={selectedItems}
            onSelectItem={handleSelectItem}
            onSelectAll={handleSelectAll}
            onBulkAction={handleBulkAction}
            onOpenItem={handleOpenItem}
            onImport={handleImport}
            onNewStandard={handleNewStandard}
          />
        );
      case 'domains':
        return <DomainsView domains={domains} items={items} onSelectDomain={(d) => { setFilters(f => ({ ...f, domain: d.id })); setActiveView('standards'); }} onImport={handleImport} />;
      case 'assemblies':
        return <AssembliesView assemblies={assemblies} items={items} onSelectAssembly={() => {}} onCreateAssembly={handleCreateAssembly} />;
      case 'categories':
        return <CategoriesView categories={categories} items={items} onSelectCategory={(c) => { setFilters(f => ({ ...f, category: c.id })); setActiveView('standards'); }} />;
      case 'hierarchy':
        return <ProductionHierarchyManager session={session} />;
      case 'templates':
        return <TemplatesView />;
      case 'historical':
      case 'archives':
        return (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-neutral-800/50 border border-neutral-700/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Archive className="w-10 h-10 text-neutral-500" strokeWidth={1.5} />
              </div>
              <span className="inline-block px-3 py-1 bg-neutral-800/50 text-neutral-500 text-xs font-medium uppercase tracking-wider rounded-full mb-4">
                Coming Soon
              </span>
              <h3 className="text-xl font-medium text-white mb-2">
                {activeView === 'historical' ? 'Production History' : 'Archives'}
              </h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                {activeView === 'historical' 
                  ? 'Track production performance over time. Compare estimated vs actual productivity across projects.'
                  : 'View archived standards and restore them when needed.'}
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="h-full flex bg-[#0A0A0A] overflow-hidden" data-testid="production-library-workspace">
      <LeftNavigation
        activeView={activeView}
        onViewChange={setActiveView}
        counts={counts}
        collapsed={navCollapsed}
        onToggleCollapse={() => setNavCollapsed(!navCollapsed)}
        onNewStandard={handleNewStandard}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#0A0A0A]/95 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <Library className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-lg font-medium text-white tracking-tight">Production Library</h1>
                <p className="text-xs text-neutral-500">Company Knowledge Engine</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
              data-testid="open-command-palette"
            >
              <Search className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-sm hidden sm:inline">Search...</span>
              <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-[10px] font-mono text-neutral-500">
                <Command className="w-3 h-3" />K
              </kbd>
            </button>
            <button onClick={fetchData} className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors">
              <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <button className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors">
              <Settings2 className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {renderViewContent()}
          
          {selectedItem && (
            <DetailPanel
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
              domains={domains}
              categories={categories}
              onAddToEstimate={handleAddToEstimate}
            />
          )}
        </div>
      </div>
      
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        items={items}
        domains={domains}
        categories={categories}
        assemblies={assemblies}
        onSelectItem={handleOpenItem}
        onAction={handleCommandAction}
      />
      
      <CreateStandardModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        session={session}
        domains={domains}
        units={units}
        onCreated={handleStandardCreated}
      />
    </div>
  );
};

export default ProductionLibraryWorkspace;
