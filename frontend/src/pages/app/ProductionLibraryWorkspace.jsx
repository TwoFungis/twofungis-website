/**
 * Production Library Workspace v2.0
 * ==================================
 * 
 * THE COMPANY KNOWLEDGE ENGINE
 * 
 * This is not another database. This is where company knowledge lives.
 * Every interaction should feel: Fast, Professional, Organized, Searchable, Intelligent, Beautiful.
 * 
 * Design inspiration: Notion, Linear, Figma, Stripe Dashboard
 * 
 * Architecture:
 * - Left Navigation (w-64) - Knowledge hierarchy
 * - Main Content Area - Production Grid / List view
 * - Right Detail Panel (w-96) - Item details, sliding drawer
 * - Command Palette (Cmd+K) - Global search
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  AlertCircle,
  CheckCircle2,
  Command,
  ArrowRight,
  Loader2,
  Settings2,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ============================================
// NAVIGATION ITEMS
// ============================================
const NAV_SECTIONS = [
  {
    id: 'knowledge',
    label: 'Knowledge',
    items: [
      { id: 'domains', label: 'Knowledge Domains', icon: FolderTree, count: null },
      { id: 'items', label: 'Production Items', icon: Library, count: null, primary: true },
      { id: 'assemblies', label: 'Assemblies', icon: Layers, count: null },
    ]
  },
  {
    id: 'organization',
    label: 'Organization',
    items: [
      { id: 'categories', label: 'Service Categories', icon: Tags, count: null },
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
// LEFT NAVIGATION
// ============================================
const LeftNavigation = ({ activeView, onViewChange, counts, collapsed, onToggleCollapse }) => {
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
              <p className="text-[11px] text-neutral-500">Knowledge Engine</p>
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
          className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-medium px-4 py-2.5 rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)]"
          data-testid="new-item-btn"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          <span>New Item</span>
        </button>
      </div>
    </div>
  );
};

// ============================================
// COMMAND PALETTE (Global Search)
// ============================================
const CommandPalette = ({ isOpen, onClose, items, domains, categories, onSelectItem }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
    }
  }, [isOpen]);
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);
  
  const filteredResults = useMemo(() => {
    if (!query.trim()) return { items: [], domains: [], categories: [] };
    
    const q = query.toLowerCase();
    return {
      items: items.filter(item => 
        item.production_code?.toLowerCase().includes(q) ||
        item.production_name?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
      ).slice(0, 5),
      domains: domains.filter(d => d.name?.toLowerCase().includes(q)).slice(0, 3),
      categories: categories.filter(c => c.name?.toLowerCase().includes(q)).slice(0, 3)
    };
  }, [query, items, domains, categories]);
  
  const hasResults = filteredResults.items.length > 0 || 
                     filteredResults.domains.length > 0 || 
                     filteredResults.categories.length > 0;
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" data-testid="command-palette">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[#0A0A0A]/95 border border-neutral-800 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800">
          <Search className="w-5 h-5 text-neutral-500" strokeWidth={1.5} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search production items, domains, categories..."
            className="flex-1 bg-transparent text-white placeholder-neutral-500 text-sm focus:outline-none"
            data-testid="command-palette-input"
          />
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-[10px] text-neutral-500 font-mono">
            ESC
          </kbd>
        </div>
        
        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {!query.trim() ? (
            <div className="p-6 text-center">
              <p className="text-neutral-500 text-sm">Start typing to search...</p>
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-neutral-600">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded font-mono">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded font-mono">Enter</kbd>
                  Select
                </span>
              </div>
            </div>
          ) : !hasResults ? (
            <div className="p-6 text-center">
              <p className="text-neutral-500 text-sm">No results found for &quot;{query}&quot;</p>
            </div>
          ) : (
            <div className="py-2">
              {/* Production Items */}
              {filteredResults.items.length > 0 && (
                <div className="px-2">
                  <div className="px-2 py-1.5 text-[11px] uppercase tracking-widest font-medium text-neutral-500">
                    Production Items
                  </div>
                  {filteredResults.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { onSelectItem(item); onClose(); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-900 transition-colors text-left"
                      data-testid={`search-result-${item.id}`}
                    >
                      <Library className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-emerald-400">{item.production_code}</span>
                          <span className="text-sm text-white truncate">{item.production_name}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-600" />
                    </button>
                  ))}
                </div>
              )}
              
              {/* Domains */}
              {filteredResults.domains.length > 0 && (
                <div className="px-2 mt-2">
                  <div className="px-2 py-1.5 text-[11px] uppercase tracking-widest font-medium text-neutral-500">
                    Knowledge Domains
                  </div>
                  {filteredResults.domains.map((domain) => (
                    <button
                      key={domain.id}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-900 transition-colors text-left"
                    >
                      <FolderTree className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
                      <span className="text-sm text-white">{domain.name}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Categories */}
              {filteredResults.categories.length > 0 && (
                <div className="px-2 mt-2">
                  <div className="px-2 py-1.5 text-[11px] uppercase tracking-widest font-medium text-neutral-500">
                    Service Categories
                  </div>
                  {filteredResults.categories.map((cat) => (
                    <button
                      key={cat.id}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-900 transition-colors text-left"
                    >
                      <Tags className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
                      <span className="text-sm text-white">{cat.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// PRODUCTION GRID HEADER
// ============================================
const GridHeader = ({ 
  searchQuery, 
  onSearchChange, 
  viewMode, 
  onViewModeChange,
  selectedCount,
  onBulkAction,
  filters,
  onFilterChange,
  sortConfig,
  onSortChange,
  domains,
  categories
}) => {
  const [showFilters, setShowFilters] = useState(false);
  
  return (
    <div className="space-y-3">
      {/* Main Header Row */}
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
            showFilters || Object.values(filters).some(v => v && v !== 'all')
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
        
        {/* Add Item Button */}
        <button
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-medium px-4 py-2.5 rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)]"
          data-testid="add-production-item-btn"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          <span>Add Item</span>
        </button>
      </div>
      
      {/* Filter Row */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-neutral-900/50 border border-neutral-800 rounded-lg" data-testid="filter-panel">
          {/* Domain Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-neutral-500 uppercase tracking-wider">Domain</label>
            <select
              value={filters.domain || 'all'}
              onChange={(e) => onFilterChange('domain', e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
              data-testid="filter-domain"
            >
              <option value="all">All Domains</option>
              {domains.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-neutral-500 uppercase tracking-wider">Category</label>
            <select
              value={filters.category || 'all'}
              onChange={(e) => onFilterChange('category', e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
              data-testid="filter-category"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-neutral-500 uppercase tracking-wider">Status</label>
            <select
              value={filters.status || 'active'}
              onChange={(e) => onFilterChange('status', e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
              data-testid="filter-status"
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="all">All</option>
            </select>
          </div>
          
          {/* Company Standard Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.companyStandard || false}
              onChange={(e) => onFilterChange('companyStandard', e.target.checked)}
              className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-emerald-500 focus:ring-emerald-500/20"
              data-testid="filter-company-standard"
            />
            <span className="text-sm text-neutral-300">Company Standards Only</span>
          </label>
          
          {/* Clear Filters */}
          <button
            onClick={() => onFilterChange('clear', null)}
            className="ml-auto text-sm text-neutral-500 hover:text-white transition-colors"
            data-testid="clear-filters-btn"
          >
            Clear all
          </button>
        </div>
      )}
      
      {/* Bulk Actions Row */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg" data-testid="bulk-actions-bar">
          <span className="text-sm text-emerald-400 font-medium">{selectedCount} selected</span>
          <div className="h-4 w-px bg-emerald-500/30" />
          <button
            onClick={() => onBulkAction('edit')}
            className="flex items-center gap-1.5 text-sm text-neutral-300 hover:text-white transition-colors"
          >
            <Edit3 className="w-4 h-4" strokeWidth={1.5} />
            Edit
          </button>
          <button
            onClick={() => onBulkAction('duplicate')}
            className="flex items-center gap-1.5 text-sm text-neutral-300 hover:text-white transition-colors"
          >
            <Copy className="w-4 h-4" strokeWidth={1.5} />
            Duplicate
          </button>
          <button
            onClick={() => onBulkAction('archive')}
            className="flex items-center gap-1.5 text-sm text-neutral-300 hover:text-white transition-colors"
          >
            <Archive className="w-4 h-4" strokeWidth={1.5} />
            Archive
          </button>
          <button
            onClick={() => onBulkAction('export')}
            className="flex items-center gap-1.5 text-sm text-neutral-300 hover:text-white transition-colors"
          >
            <Download className="w-4 h-4" strokeWidth={1.5} />
            Export
          </button>
          <button
            onClick={() => onBulkAction('clear')}
            className="ml-auto text-sm text-neutral-500 hover:text-white transition-colors"
          >
            Clear selection
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================
// PRODUCTION ITEM ROW (List View)
// ============================================
const ProductionItemRow = ({ item, isSelected, onSelect, onOpen, isFirst }) => {
  return (
    <div
      className={`group flex items-center gap-4 px-4 py-3.5 border-b border-neutral-800/50 hover:bg-neutral-900/50 transition-colors cursor-pointer ${
        isSelected ? 'bg-emerald-500/5' : ''
      } ${isFirst ? '' : ''}`}
      onClick={() => onOpen(item)}
      data-testid={`production-item-row-${item.id}`}
    >
      {/* Checkbox */}
      <div onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(item.id)}
          className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
          data-testid={`select-item-${item.id}`}
        />
      </div>
      
      {/* Code */}
      <div className="w-28 flex-shrink-0">
        <span className="font-mono text-[13px] text-emerald-400">{item.production_code}</span>
      </div>
      
      {/* Name & Description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">{item.production_name}</span>
          {item.is_company_standard && (
            <span className="flex-shrink-0 px-1.5 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-medium uppercase tracking-wider rounded">
              Standard
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-neutral-500 truncate mt-0.5">{item.description}</p>
        )}
      </div>
      
      {/* Domain */}
      <div className="w-36 flex-shrink-0">
        <span className="text-sm text-neutral-400">{item.knowledge_domains?.name || '-'}</span>
      </div>
      
      {/* Unit */}
      <div className="w-16 flex-shrink-0 text-center">
        <span className="font-mono text-xs bg-neutral-800 text-neutral-300 px-2 py-1 rounded">
          {item.measurement_units?.code || 'EA'}
        </span>
      </div>
      
      {/* Rate */}
      <div className="w-24 flex-shrink-0 text-right">
        {item.standard_rate ? (
          <span className="font-mono text-sm text-white">${item.standard_rate.toFixed(2)}</span>
        ) : (
          <span className="text-sm text-neutral-600">-</span>
        )}
      </div>
      
      {/* Production */}
      <div className="w-20 flex-shrink-0 text-right">
        {item.production_per_day ? (
          <span className="text-sm text-neutral-400">{item.production_per_day}/day</span>
        ) : (
          <span className="text-sm text-neutral-600">-</span>
        )}
      </div>
      
      {/* Brain Insight Indicator */}
      {item.brain_insight && (
        <div className="w-8 flex-shrink-0 flex justify-center">
          <Sparkles className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
        </div>
      )}
      
      {/* Actions */}
      <div className="w-8 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <button className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded transition-colors">
          <MoreHorizontal className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
};

// ============================================
// PRODUCTION ITEM CARD (Grid View)
// ============================================
const ProductionItemCard = ({ item, isSelected, onSelect, onOpen }) => {
  return (
    <div
      className={`group relative bg-[#111111] border rounded-xl p-4 hover:border-neutral-700 transition-all cursor-pointer ${
        isSelected ? 'border-emerald-500/50 ring-1 ring-emerald-500/20' : 'border-neutral-800'
      }`}
      onClick={() => onOpen(item)}
      data-testid={`production-item-card-${item.id}`}
    >
      {/* Checkbox */}
      <div 
        className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(item.id)}
          className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
        />
      </div>
      
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <span className="font-mono text-xs text-emerald-400">{item.production_code}</span>
        {item.is_company_standard && (
          <Sparkles className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
        )}
      </div>
      
      {/* Content */}
      <h4 className="text-sm font-medium text-white mb-1 line-clamp-2">{item.production_name}</h4>
      {item.description && (
        <p className="text-xs text-neutral-500 line-clamp-2 mb-3">{item.description}</p>
      )}
      
      {/* Domain Badge */}
      {item.knowledge_domains?.name && (
        <div className="mb-3">
          <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-1 rounded">
            {item.knowledge_domains.name}
          </span>
        </div>
      )}
      
      {/* Footer Stats */}
      <div className="flex items-center gap-3 pt-3 border-t border-neutral-800/50">
        <span className="font-mono text-xs bg-neutral-800 text-neutral-300 px-2 py-1 rounded">
          {item.measurement_units?.code || 'EA'}
        </span>
        {item.standard_rate && (
          <span className="font-mono text-xs text-white">${item.standard_rate.toFixed(2)}</span>
        )}
        {item.production_per_day && (
          <span className="text-xs text-neutral-500 ml-auto">{item.production_per_day}/day</span>
        )}
      </div>
    </div>
  );
};

// ============================================
// LIST VIEW HEADER
// ============================================
const ListViewHeader = ({ sortConfig, onSort }) => {
  const SortIcon = sortConfig.direction === 'asc' ? SortAsc : SortDesc;
  
  const handleSort = (field) => {
    onSort({
      field,
      direction: sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };
  
  return (
    <div className="flex items-center gap-4 px-4 py-2.5 bg-neutral-900/50 border-b border-neutral-800 text-xs uppercase tracking-wider font-medium text-neutral-500">
      <div className="w-4" />
      <button 
        onClick={() => handleSort('production_code')}
        className="w-28 flex items-center gap-1 hover:text-neutral-300 transition-colors"
      >
        Code
        {sortConfig.field === 'production_code' && <SortIcon className="w-3 h-3" />}
      </button>
      <button 
        onClick={() => handleSort('production_name')}
        className="flex-1 flex items-center gap-1 hover:text-neutral-300 transition-colors text-left"
      >
        Name
        {sortConfig.field === 'production_name' && <SortIcon className="w-3 h-3" />}
      </button>
      <button 
        onClick={() => handleSort('domain')}
        className="w-36 flex items-center gap-1 hover:text-neutral-300 transition-colors"
      >
        Domain
        {sortConfig.field === 'domain' && <SortIcon className="w-3 h-3" />}
      </button>
      <div className="w-16 text-center">Unit</div>
      <button 
        onClick={() => handleSort('standard_rate')}
        className="w-24 flex items-center gap-1 justify-end hover:text-neutral-300 transition-colors"
      >
        Rate
        {sortConfig.field === 'standard_rate' && <SortIcon className="w-3 h-3" />}
      </button>
      <button 
        onClick={() => handleSort('production_per_day')}
        className="w-20 flex items-center gap-1 justify-end hover:text-neutral-300 transition-colors"
      >
        Output
        {sortConfig.field === 'production_per_day' && <SortIcon className="w-3 h-3" />}
      </button>
      <div className="w-8" />
      <div className="w-8" />
    </div>
  );
};

// ============================================
// DETAIL PANEL
// ============================================
const DetailPanel = ({ item, onClose, domains, categories }) => {
  if (!item) return null;
  
  return (
    <div 
      className="w-[420px] flex-shrink-0 bg-[#0A0A0A] border-l border-neutral-800 flex flex-col animate-in slide-in-from-right duration-300"
      data-testid="detail-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
        <div>
          <span className="font-mono text-sm text-emerald-400">{item.production_code}</span>
          <h2 className="text-lg font-medium text-white mt-1">{item.production_name}</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          data-testid="close-detail-panel"
        >
          <X className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 p-6 border-b border-neutral-800">
          <div className="bg-neutral-900 rounded-lg p-3 text-center">
            <div className="font-mono text-lg text-white">
              {item.standard_rate ? `$${item.standard_rate.toFixed(2)}` : '-'}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 mt-1">Std Rate</div>
          </div>
          <div className="bg-neutral-900 rounded-lg p-3 text-center">
            <div className="font-mono text-lg text-white">
              {item.production_per_day || '-'}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 mt-1">Per Day</div>
          </div>
          <div className="bg-neutral-900 rounded-lg p-3 text-center">
            <div className="font-mono text-lg text-white">
              {item.measurement_units?.code || 'EA'}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 mt-1">Unit</div>
          </div>
        </div>
        
        {/* General Info */}
        <div className="p-6 border-b border-neutral-800">
          <h3 className="text-sm font-medium text-neutral-200 mb-4">General Information</h3>
          
          {item.description && (
            <div className="mb-4">
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
          
          {item.is_company_standard && (
            <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <Sparkles className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
              <span className="text-sm text-amber-400">Company Standard</span>
            </div>
          )}
        </div>
        
        {/* Pricing */}
        <div className="p-6 border-b border-neutral-800">
          <h3 className="text-sm font-medium text-neutral-200 mb-4">Pricing</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Standard Rate</span>
              <span className="font-mono text-sm text-white">
                {item.standard_rate ? `$${item.standard_rate.toFixed(2)}` : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Premium Rate</span>
              <span className="font-mono text-sm text-white">
                {item.premium_rate ? `$${item.premium_rate.toFixed(2)}` : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Complex Rate</span>
              <span className="font-mono text-sm text-white">
                {item.complex_rate ? `$${item.complex_rate.toFixed(2)}` : '-'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Production Standards */}
        <div className="p-6 border-b border-neutral-800">
          <h3 className="text-sm font-medium text-neutral-200 mb-4">Production Standards</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Output Per Day</span>
              <span className="font-mono text-sm text-white">
                {item.production_per_day || '-'} {item.measurement_units?.code || 'units'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Crew Size</span>
              <span className="font-mono text-sm text-white">{item.crew_size || 1}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Labour Hours</span>
              <span className="font-mono text-sm text-white">
                {item.labour_hours ? `${item.labour_hours.toFixed(2)} hrs` : '-'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Company Brain Insights */}
        <div className="p-6 border-b border-neutral-800">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
            <h3 className="text-sm font-medium text-neutral-200">Company Brain Insights</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
              <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <p className="text-sm text-neutral-300">
                This item is frequently used with <span className="text-emerald-400">Base Trim Installation</span> and <span className="text-emerald-400">Crown Moulding</span>.
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-neutral-900 rounded-lg">
              <TrendingUp className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <p className="text-sm text-neutral-400">
                Labour productivity has improved by <span className="text-white">8%</span> over the last 6 months.
              </p>
            </div>
          </div>
        </div>
        
        {/* Notes */}
        {item.notes && (
          <div className="p-6">
            <h3 className="text-sm font-medium text-neutral-200 mb-4">Notes</h3>
            <p className="text-sm text-neutral-400">{item.notes}</p>
          </div>
        )}
      </div>
      
      {/* Footer Actions */}
      <div className="flex items-center gap-2 p-4 border-t border-neutral-800">
        <button className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-medium px-4 py-2.5 rounded-lg transition-all">
          <Edit3 className="w-4 h-4" strokeWidth={2} />
          Edit Item
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
// EMPTY STATE
// ============================================
const EmptyState = ({ onImport }) => {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Library className="w-10 h-10 text-neutral-600" strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-medium text-white mb-2">Build Your Production Library</h3>
        <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
          Import your company&apos;s production knowledge to get started. Every item you add becomes part of your operational intelligence.
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
          <button className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-800 px-6 py-3 rounded-lg transition-colors">
            <Plus className="w-4 h-4" strokeWidth={2} />
            Add Manually
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// LOADING STATE
// ============================================
const LoadingState = () => {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" strokeWidth={1.5} />
        <p className="text-sm text-neutral-500">Loading Production Library...</p>
      </div>
    </div>
  );
};

// ============================================
// MAIN WORKSPACE COMPONENT
// ============================================
const ProductionLibraryWorkspace = () => {
  const navigate = useNavigate();
  
  // State
  const [activeView, setActiveView] = useState('items');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectedItem, setSelectedItem] = useState(null);
  const [sortConfig, setSortConfig] = useState({ field: 'production_code', direction: 'asc' });
  const [filters, setFilters] = useState({ domain: 'all', category: 'all', status: 'active', companyStandard: false });
  
  // Data
  const [items, setItems] = useState([]);
  const [domains, setDomains] = useState([]);
  const [categories, setCategories] = useState([]);
  const [assemblies, setAssemblies] = useState([]);
  const [counts, setCounts] = useState({});
  
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const headers = { 'Authorization': `Bearer ${session.access_token}` };
      
      // Fetch all data in parallel
      const [itemsRes, domainsRes, catsRes, assembliesRes] = await Promise.all([
        fetch(`${API_URL}/api/production-library/items?limit=500`, { headers }),
        fetch(`${API_URL}/api/production-library/domains`, { headers }),
        fetch(`${API_URL}/api/production-library/service-categories`, { headers }),
        fetch(`${API_URL}/api/production-library/assemblies`, { headers })
      ]);
      
      if (itemsRes.ok) {
        const data = await itemsRes.json();
        setItems(data.items || []);
      }
      if (domainsRes.ok) {
        const data = await domainsRes.json();
        setDomains(data.domains || []);
      }
      if (catsRes.ok) {
        const data = await catsRes.json();
        setCategories(data.categories || []);
      }
      if (assembliesRes.ok) {
        const data = await assembliesRes.json();
        setAssemblies(data.assemblies || []);
      }
      
      // Update counts
      setCounts({
        items: items.length,
        domains: domains.length,
        categories: categories.length,
        assemblies: assemblies.length
      });
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = [...items];
    
    // Apply search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.production_code?.toLowerCase().includes(q) ||
        item.production_name?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
      );
    }
    
    // Apply filters
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
    
    // Apply sort
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
  
  // Handlers
  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };
  
  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(i => i.id)));
    }
  };
  
  const handleBulkAction = (action) => {
    if (action === 'clear') {
      setSelectedItems(new Set());
    } else {
      toast.info(`${action} ${selectedItems.size} items - coming soon`);
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
    setSelectedItem(item);
  };
  
  const handleImport = () => {
    navigate('/app/production-library?tab=import');
  };
  
  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] overflow-hidden" data-testid="production-library-workspace">
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
          
          {/* View Tabs */}
          <div className="hidden md:flex items-center gap-1 ml-6 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
            {[
              { id: 'items', label: 'Items', icon: Library },
              { id: 'domains', label: 'Domains', icon: FolderTree },
              { id: 'assemblies', label: 'Assemblies', icon: Layers },
              { id: 'categories', label: 'Categories', icon: Tags },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
                    isActive
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-500 hover:text-white'
                  }`}
                  data-testid={`view-tab-${tab.id}`}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Command Palette Trigger */}
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
          
          <button className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
          </button>
          
          <button className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors">
            <Settings2 className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState onImport={handleImport} />
        ) : (
          <div className="flex-1 flex flex-col min-w-0 p-6">
            {/* Grid Header */}
            <GridHeader
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              selectedCount={selectedItems.size}
              onBulkAction={handleBulkAction}
              filters={filters}
              onFilterChange={handleFilterChange}
              sortConfig={sortConfig}
              onSortChange={setSortConfig}
              domains={domains}
              categories={categories}
            />
            
            {/* Items List/Grid */}
            <div className="flex-1 overflow-auto mt-4 bg-[#111111] border border-neutral-800 rounded-xl">
              {viewMode === 'list' ? (
                <div>
                  <ListViewHeader sortConfig={sortConfig} onSort={setSortConfig} />
                  <div>
                    {filteredItems.map((item, index) => (
                      <ProductionItemRow
                        key={item.id}
                        item={item}
                        isSelected={selectedItems.has(item.id)}
                        onSelect={handleSelectItem}
                        onOpen={handleOpenItem}
                        isFirst={index === 0}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                  {filteredItems.map((item) => (
                    <ProductionItemCard
                      key={item.id}
                      item={item}
                      isSelected={selectedItems.has(item.id)}
                      onSelect={handleSelectItem}
                      onOpen={handleOpenItem}
                    />
                  ))}
                </div>
              )}
              
              {filteredItems.length === 0 && (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <Search className="w-8 h-8 text-neutral-600 mx-auto mb-3" strokeWidth={1.5} />
                    <p className="text-neutral-400">No items match your filters</p>
                    <button
                      onClick={() => handleFilterChange('clear', null)}
                      className="mt-3 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      Clear filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Detail Panel */}
        {selectedItem && (
          <DetailPanel
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            domains={domains}
            categories={categories}
          />
        )}
      </div>
      
      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        items={items}
        domains={domains}
        categories={categories}
        onSelectItem={handleOpenItem}
      />
    </div>
  );
};

export default ProductionLibraryWorkspace;
