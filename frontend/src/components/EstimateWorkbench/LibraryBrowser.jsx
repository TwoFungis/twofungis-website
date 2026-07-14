/**
 * LibraryBrowser.jsx - Estimate Workbench Library Browser Panel
 * ==============================================================
 * 
 * Left panel of the 3-panel Estimate Workbench layout.
 * Allows browsing the Production Library to add items to an estimate.
 * 
 * Features:
 * - Collapsible tree navigation
 * - Search/filter
 * - Click to add to estimate
 * - Drag-and-drop to estimate builder
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Library,
  Search,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  File,
  Plus,
  X
} from 'lucide-react';

const LibraryBrowser = ({
  domains = [],
  categories = [],
  standards = [],
  isLoading = false,
  onAddToEstimate,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDomains, setExpandedDomains] = useState(new Set());
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  
  // Build hierarchical structure
  const treeData = useMemo(() => {
    const categoriesByDomain = {};
    categories.forEach(cat => {
      const domainId = cat.knowledge_domain_id || cat.domain_id;
      if (domainId) {
        if (!categoriesByDomain[domainId]) {
          categoriesByDomain[domainId] = [];
        }
        categoriesByDomain[domainId].push(cat);
      }
    });
    
    const standardsByCategory = {};
    const standardsByDomain = {};
    
    standards.forEach(std => {
      const domainId = std.knowledge_domain_id;
      if (domainId) {
        if (!standardsByDomain[domainId]) {
          standardsByDomain[domainId] = [];
        }
        standardsByDomain[domainId].push(std);
      }
      
      const categoryIds = std.service_category_ids || [];
      categoryIds.forEach(catId => {
        if (!standardsByCategory[catId]) {
          standardsByCategory[catId] = [];
        }
        standardsByCategory[catId].push(std);
      });
    });
    
    return domains.map(domain => ({
      ...domain,
      categories: (categoriesByDomain[domain.id] || []).map(cat => ({
        ...cat,
        standards: standardsByCategory[cat.id] || []
      })),
      directStandards: (standardsByDomain[domain.id] || []).filter(std => 
        !std.service_category_ids || std.service_category_ids.length === 0
      )
    }));
  }, [domains, categories, standards]);
  
  // Filter based on search
  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return treeData;
    
    const query = searchQuery.toLowerCase();
    
    return treeData.map(domain => {
      const domainMatches = domain.name?.toLowerCase().includes(query);
      
      const filteredCategories = domain.categories.map(cat => {
        const catMatches = cat.name?.toLowerCase().includes(query);
        const filteredStandards = cat.standards.filter(std =>
          std.production_code?.toLowerCase().includes(query) ||
          std.production_name?.toLowerCase().includes(query)
        );
        
        if (catMatches || filteredStandards.length > 0) {
          return { ...cat, standards: filteredStandards };
        }
        return null;
      }).filter(Boolean);
      
      const filteredDirectStandards = domain.directStandards.filter(std =>
        std.production_code?.toLowerCase().includes(query) ||
        std.production_name?.toLowerCase().includes(query)
      );
      
      if (domainMatches || filteredCategories.length > 0 || filteredDirectStandards.length > 0) {
        return { ...domain, categories: filteredCategories, directStandards: filteredDirectStandards };
      }
      return null;
    }).filter(Boolean);
  }, [treeData, searchQuery]);
  
  const toggleDomain = (domainId) => {
    setExpandedDomains(prev => {
      const next = new Set(prev);
      if (next.has(domainId)) {
        next.delete(domainId);
      } else {
        next.add(domainId);
      }
      return next;
    });
  };
  
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };
  
  const handleAddStandard = (standard) => {
    onAddToEstimate?.(standard);
  };
  
  if (isCollapsed) {
    return (
      <div className="w-12 border-r border-neutral-800 bg-neutral-900/50 flex flex-col items-center py-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          title="Expand Library"
        >
          <Library className="w-5 h-5" />
        </button>
      </div>
    );
  }
  
  return (
    <div className="w-72 xl:w-80 border-r border-neutral-800 bg-neutral-900/30 flex flex-col" data-testid="library-browser">
      {/* Header */}
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Library className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-white">Library</span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Search */}
      <div className="p-3 border-b border-neutral-800">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search standards..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
            data-testid="library-browser-search"
          />
        </div>
      </div>
      
      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredTree.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-neutral-500">
              {searchQuery ? 'No matches found' : 'No items in library'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredTree.map(domain => {
              const isDomainExpanded = expandedDomains.has(domain.id);
              
              return (
                <div key={domain.id}>
                  {/* Domain */}
                  <button
                    onClick={() => toggleDomain(domain.id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-neutral-800/50 transition-colors group"
                  >
                    {isDomainExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                    )}
                    {isDomainExpanded ? (
                      <FolderOpen className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Folder className="w-4 h-4 text-amber-400" />
                    )}
                    <span className="flex-1 text-sm text-neutral-300 truncate">
                      {domain.name}
                    </span>
                  </button>
                  
                  {/* Domain Children */}
                  {isDomainExpanded && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {/* Categories */}
                      {domain.categories.map(category => {
                        const isCategoryExpanded = expandedCategories.has(category.id);
                        
                        return (
                          <div key={category.id}>
                            <button
                              onClick={() => toggleCategory(category.id)}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-neutral-800/50 transition-colors"
                            >
                              {isCategoryExpanded ? (
                                <ChevronDown className="w-3 h-3 text-neutral-600" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-neutral-600" />
                              )}
                              <Folder className="w-3.5 h-3.5 text-purple-400" />
                              <span className="flex-1 text-xs text-neutral-400 truncate">
                                {category.name}
                              </span>
                            </button>
                            
                            {/* Standards in Category */}
                            {isCategoryExpanded && (
                              <div className="ml-5 space-y-0.5">
                                {category.standards.map(standard => (
                                  <div
                                    key={standard.id}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-neutral-800/50 transition-colors group cursor-pointer"
                                    onClick={() => handleAddStandard(standard)}
                                    data-testid={`library-item-${standard.id}`}
                                  >
                                    <File className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="flex-1 text-xs text-neutral-300 truncate">
                                      {standard.production_name}
                                    </span>
                                    <span className="font-mono text-[10px] text-emerald-400/70">
                                      {standard.production_code}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddStandard(standard);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 p-0.5 text-emerald-400 hover:bg-emerald-500/20 rounded transition-all"
                                      title="Add to estimate"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {/* Direct Standards */}
                      {domain.directStandards.map(standard => (
                        <div
                          key={standard.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-neutral-800/50 transition-colors group cursor-pointer"
                          onClick={() => handleAddStandard(standard)}
                        >
                          <File className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="flex-1 text-xs text-neutral-300 truncate">
                            {standard.production_name}
                          </span>
                          <span className="font-mono text-[10px] text-emerald-400/70">
                            {standard.production_code}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddStandard(standard);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-emerald-400 hover:bg-emerald-500/20 rounded transition-all"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryBrowser;
