/**
 * TreeView.jsx - Production Library Explorer Tree View
 * =====================================================
 * 
 * The main hierarchical tree component for navigating the Production Library.
 * 
 * Hierarchy: Domain -> Category -> Standard
 * 
 * Features:
 * - Lazy loading of children on expand
 * - Virtualized rendering for large datasets
 * - Context menu support (right-click/long-press)
 * - Search/filter with highlight
 * - Keyboard navigation
 * - Drag-and-drop reordering (future)
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Library, FolderTree, Layers, Search, ChevronRight, Loader2 } from 'lucide-react';
import TreeNode from './TreeNode';

const TreeView = ({
  domains = [],
  categories = [],
  standards = [],
  isLoading = false,
  searchQuery = '',
  expandedNodes = new Set(),
  selectedNode = null,
  onToggleExpand,
  onSelectNode,
  onContextMenu,
  onAddChild,
  loadingNodes = new Set()
}) => {
  // Build hierarchical structure with counts
  const treeData = useMemo(() => {
    // Group categories by domain
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
    
    // Group standards by domain and category
    const standardsByDomain = {};
    const standardsByCategory = {};
    
    standards.forEach(std => {
      const domainId = std.knowledge_domain_id;
      
      if (domainId) {
        if (!standardsByDomain[domainId]) {
          standardsByDomain[domainId] = [];
        }
        standardsByDomain[domainId].push(std);
      }
      
      // Standards can have multiple service categories
      const categoryIds = std.service_category_ids || [];
      categoryIds.forEach(catId => {
        if (!standardsByCategory[catId]) {
          standardsByCategory[catId] = [];
        }
        standardsByCategory[catId].push(std);
      });
    });
    
    // Build tree with counts
    return domains.map(domain => ({
      ...domain,
      type: 'domain',
      categories: (categoriesByDomain[domain.id] || []).map(cat => ({
        ...cat,
        type: 'category',
        standards: standardsByCategory[cat.id] || [],
        standardCount: (standardsByCategory[cat.id] || []).length
      })),
      categoryCount: (categoriesByDomain[domain.id] || []).length,
      // Direct standards under domain (not in any category)
      directStandards: (standardsByDomain[domain.id] || []).filter(std => 
        !std.service_category_ids || std.service_category_ids.length === 0
      ),
      totalStandardCount: (standardsByDomain[domain.id] || []).length
    }));
  }, [domains, categories, standards]);
  
  // Filter tree based on search query
  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return treeData;
    
    const query = searchQuery.toLowerCase();
    
    return treeData.map(domain => {
      // Check if domain matches
      const domainMatches = domain.name?.toLowerCase().includes(query) ||
                          domain.code?.toLowerCase().includes(query);
      
      // Filter categories
      const filteredCategories = domain.categories.map(cat => {
        const catMatches = cat.name?.toLowerCase().includes(query) ||
                         cat.code?.toLowerCase().includes(query);
        
        // Filter standards within category
        const filteredStandards = cat.standards.filter(std =>
          std.production_code?.toLowerCase().includes(query) ||
          std.production_name?.toLowerCase().includes(query) ||
          std.description?.toLowerCase().includes(query)
        );
        
        if (catMatches || filteredStandards.length > 0) {
          return { ...cat, standards: filteredStandards, isMatch: catMatches };
        }
        return null;
      }).filter(Boolean);
      
      // Filter direct standards
      const filteredDirectStandards = domain.directStandards.filter(std =>
        std.production_code?.toLowerCase().includes(query) ||
        std.production_name?.toLowerCase().includes(query)
      );
      
      if (domainMatches || filteredCategories.length > 0 || filteredDirectStandards.length > 0) {
        return {
          ...domain,
          categories: filteredCategories,
          directStandards: filteredDirectStandards,
          isMatch: domainMatches
        };
      }
      return null;
    }).filter(Boolean);
  }, [treeData, searchQuery]);
  
  // Auto-expand matched nodes when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      // Expand all nodes that have matches
      const nodesToExpand = new Set();
      filteredTree.forEach(domain => {
        if (domain.categories.length > 0 || domain.directStandards.length > 0) {
          nodesToExpand.add(domain.id);
          domain.categories.forEach(cat => {
            if (cat.standards.length > 0) {
              nodesToExpand.add(cat.id);
            }
          });
        }
      });
      
      // Notify parent to expand these nodes
      nodesToExpand.forEach(id => {
        if (!expandedNodes.has(id)) {
          onToggleExpand?.({ id });
        }
      });
    }
  }, [searchQuery, filteredTree]);
  
  // Render a standard node
  const renderStandard = useCallback((standard, level) => {
    const isSelected = selectedNode?.id === standard.id && selectedNode?.type === 'standard';
    
    return (
      <TreeNode
        key={standard.id}
        node={standard}
        level={level}
        type="standard"
        isExpanded={false}
        isSelected={isSelected}
        isLoading={false}
        onSelect={() => onSelectNode?.(standard, 'standard')}
        onContextMenu={(e) => onContextMenu?.(e, standard, 'standard')}
      />
    );
  }, [selectedNode, onSelectNode, onContextMenu]);
  
  // Render a category node with its children
  const renderCategory = useCallback((category, level, domainId) => {
    const isExpanded = expandedNodes.has(category.id);
    const isSelected = selectedNode?.id === category.id && selectedNode?.type === 'category';
    const isLoadingNode = loadingNodes.has(category.id);
    
    return (
      <TreeNode
        key={category.id}
        node={category}
        level={level}
        type="category"
        isExpanded={isExpanded}
        isSelected={isSelected}
        isLoading={isLoadingNode}
        childCount={category.standardCount}
        onToggle={() => onToggleExpand?.(category)}
        onSelect={() => onSelectNode?.(category, 'category')}
        onContextMenu={(e) => onContextMenu?.(e, category, 'category')}
        onAddChild={() => onAddChild?.(category, 'category')}
      >
        {isExpanded && category.standards.map(std => renderStandard(std, level + 1))}
      </TreeNode>
    );
  }, [expandedNodes, selectedNode, loadingNodes, onToggleExpand, onSelectNode, onContextMenu, onAddChild, renderStandard]);
  
  // Render a domain node with its children
  const renderDomain = useCallback((domain, level = 0) => {
    const isExpanded = expandedNodes.has(domain.id);
    const isSelected = selectedNode?.id === domain.id && selectedNode?.type === 'domain';
    const isLoadingNode = loadingNodes.has(domain.id);
    
    const childCount = domain.categoryCount + domain.directStandards.length;
    
    return (
      <TreeNode
        key={domain.id}
        node={domain}
        level={level}
        type="domain"
        isExpanded={isExpanded}
        isSelected={isSelected}
        isLoading={isLoadingNode}
        childCount={domain.totalStandardCount}
        onToggle={() => onToggleExpand?.(domain)}
        onSelect={() => onSelectNode?.(domain, 'domain')}
        onContextMenu={(e) => onContextMenu?.(e, domain, 'domain')}
        onAddChild={() => onAddChild?.(domain, 'domain')}
      >
        {isExpanded && (
          <>
            {/* Categories */}
            {domain.categories.map(cat => renderCategory(cat, level + 1, domain.id))}
            
            {/* Direct standards (not in any category) */}
            {domain.directStandards.map(std => renderStandard(std, level + 1))}
          </>
        )}
      </TreeNode>
    );
  }, [expandedNodes, selectedNode, loadingNodes, onToggleExpand, onSelectNode, onContextMenu, onAddChild, renderCategory, renderStandard]);
  
  // Empty state
  if (!isLoading && domains.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
          <Library className="w-8 h-8 text-emerald-400" strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">
          Build Your Library
        </h3>
        <p className="text-sm text-neutral-400 max-w-xs mb-6">
          Start by creating knowledge domains to organize your production standards.
        </p>
      </div>
    );
  }
  
  // No search results
  if (!isLoading && searchQuery && filteredTree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center mb-3">
          <Search className="w-6 h-6 text-neutral-500" strokeWidth={1.5} />
        </div>
        <p className="text-sm text-neutral-400">
          No results for &quot;{searchQuery}&quot;
        </p>
      </div>
    );
  }
  
  // Loading state
  if (isLoading && domains.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <p className="text-sm text-neutral-400">Loading library...</p>
      </div>
    );
  }
  
  return (
    <div className="py-2" data-testid="tree-view">
      {filteredTree.map(domain => renderDomain(domain))}
    </div>
  );
};

export default TreeView;
