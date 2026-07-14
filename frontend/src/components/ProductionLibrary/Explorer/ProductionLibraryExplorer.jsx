/**
 * ProductionLibraryExplorer.jsx - Windows Explorer-Style Library Browser
 * =======================================================================
 * 
 * Phase 1 of the Estimate Workbench Architecture.
 * 
 * A hierarchical folder-tree browser for the Production Library.
 * Think: Windows Explorer or macOS Finder for production standards.
 * 
 * Features:
 * - Domain -> Category -> Standard hierarchy
 * - Context-aware add buttons at each level
 * - Right-click (desktop) / long-press (mobile) context menus
 * - Lazy loading for performance
 * - Mobile: Full-screen browser modal (like iOS Files app)
 * - Desktop: Resizable sidebar tree + detail panel
 * 
 * Consumes data from:
 * - /api/production-library/domains
 * - /api/production-library/service-categories
 * - /api/production-library/items
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Library,
  ChevronLeft,
  Plus,
  Search,
  Filter,
  Loader2,
  X,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

// Import modular components
import { 
  TreeView, 
  ExplorerToolbar, 
  Breadcrumbs,
  DomainDialog,
  CategoryDialog,
  ContextMenu
} from '../index';

// Import existing components
import CreateStandardModal from '../../production/CreateStandardModal';
import ImportWizard from '../../production/ImportWizard';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ProductionLibraryExplorer = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Data state
  const [domains, setDomains] = useState([]);
  const [categories, setCategories] = useState([]);
  const [standards, setStandards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingNodes, setLoadingNodes] = useState(new Set());
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedNode, setSelectedNode] = useState(null);
  const [breadcrumbPath, setBreadcrumbPath] = useState([]);
  
  // Modal state
  const [showDomainDialog, setShowDomainDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showStandardModal, setShowStandardModal] = useState(false);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [editingDomain, setEditingDomain] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [parentForNew, setParentForNew] = useState(null);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    node: null,
    nodeType: null
  });
  
  // Mobile state
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Check for import tab in URL
  useEffect(() => {
    if (searchParams.get('tab') === 'import') {
      setShowImportWizard(true);
    }
  }, [searchParams]);
  
  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
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
      
      // Fetch all data in parallel
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
      console.error('Error fetching library data:', error);
      toast.error('Failed to load library');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Toggle node expansion
  const handleToggleExpand = useCallback((node) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(node.id)) {
        next.delete(node.id);
      } else {
        next.add(node.id);
      }
      return next;
    });
  }, []);
  
  // Select a node
  const handleSelectNode = useCallback((node, type) => {
    setSelectedNode({ ...node, type });
    
    // Update breadcrumb path
    if (type === 'standard') {
      // Navigate to detail page
      navigate(`/app/production-library/items/${node.id}`);
    }
  }, [navigate]);
  
  // Context menu handler
  const handleContextMenu = useCallback((e, node, type) => {
    e.preventDefault();
    const rect = e.target.getBoundingClientRect();
    
    setContextMenu({
      isOpen: true,
      position: { 
        x: e.clientX || rect.left, 
        y: e.clientY || rect.bottom 
      },
      node,
      nodeType: type
    });
  }, []);
  
  // Context menu action handler
  const handleContextAction = useCallback(async (action, node) => {
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
    
    switch (action) {
      case 'add-category':
        setParentForNew(node);
        setShowCategoryDialog(true);
        break;
        
      case 'add-standard':
        setParentForNew(node);
        setShowStandardModal(true);
        break;
        
      case 'view':
        if (contextMenu.nodeType === 'standard') {
          navigate(`/app/production-library/items/${node.id}`);
        }
        break;
        
      case 'edit':
        if (contextMenu.nodeType === 'domain') {
          setEditingDomain(node);
          setShowDomainDialog(true);
        } else if (contextMenu.nodeType === 'category') {
          setEditingCategory(node);
          setShowCategoryDialog(true);
        } else if (contextMenu.nodeType === 'standard') {
          navigate(`/app/production-library/items/${node.id}?edit=true`);
        }
        break;
        
      case 'rename':
        if (contextMenu.nodeType === 'domain') {
          setEditingDomain(node);
          setShowDomainDialog(true);
        } else if (contextMenu.nodeType === 'category') {
          setEditingCategory(node);
          setShowCategoryDialog(true);
        }
        break;
        
      case 'duplicate':
        try {
          if (contextMenu.nodeType === 'standard') {
            const res = await fetch(
              `${API_URL}/api/production-library/items/${node.id}/duplicate`,
              { method: 'POST', headers }
            );
            if (res.ok) {
              toast.success('Standard duplicated');
              fetchData();
            } else {
              throw new Error('Failed to duplicate');
            }
          } else {
            toast.info('Duplicate coming soon');
          }
        } catch (error) {
          toast.error('Failed to duplicate');
        }
        break;
        
      case 'archive':
        try {
          if (contextMenu.nodeType === 'standard') {
            const res = await fetch(
              `${API_URL}/api/production-library/items/${node.id}`,
              { method: 'DELETE', headers }
            );
            if (res.ok) {
              toast.success('Standard archived');
              fetchData();
            }
          } else if (contextMenu.nodeType === 'domain') {
            const res = await fetch(
              `${API_URL}/api/production-library/domains/${node.id}`,
              { method: 'DELETE', headers }
            );
            if (res.ok) {
              toast.success('Domain archived');
              fetchData();
            }
          } else if (contextMenu.nodeType === 'category') {
            const res = await fetch(
              `${API_URL}/api/production-library/service-categories/${node.id}`,
              { method: 'DELETE', headers }
            );
            if (res.ok) {
              toast.success('Category archived');
              fetchData();
            }
          }
        } catch (error) {
          toast.error('Failed to archive');
        }
        break;
        
      case 'delete':
        if (contextMenu.nodeType === 'standard') {
          if (confirm('Permanently delete this standard? This cannot be undone.')) {
            try {
              const res = await fetch(
                `${API_URL}/api/production-library/items/${node.id}/permanent`,
                { method: 'DELETE', headers }
              );
              if (res.ok) {
                toast.success('Standard deleted');
                fetchData();
              } else {
                const data = await res.json();
                toast.error(data.detail || 'Failed to delete');
              }
            } catch (error) {
              toast.error('Failed to delete');
            }
          }
        } else {
          toast.info('Archive instead of delete to preserve history');
        }
        break;
        
      case 'add-to-estimate':
        toast.info('Select an estimate to add this standard');
        break;
        
      default:
        console.log('Unknown action:', action);
    }
  }, [contextMenu.nodeType, fetchData, navigate]);
  
  // Add child handler (from quick add button)
  const handleAddChild = useCallback((node, type) => {
    if (type === 'domain') {
      setParentForNew(node);
      setShowCategoryDialog(true);
    } else if (type === 'category') {
      setParentForNew(node);
      setShowStandardModal(true);
    }
  }, []);
  
  // Save domain
  const handleSaveDomain = useCallback(async (data) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    if (editingDomain) {
      // Update existing
      const res = await fetch(
        `${API_URL}/api/production-library/domains/${editingDomain.id}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(data)
        }
      );
      if (!res.ok) throw new Error('Failed to update domain');
      toast.success('Domain updated');
    } else {
      // Create new
      const res = await fetch(
        `${API_URL}/api/production-library/domains`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(data)
        }
      );
      if (!res.ok) throw new Error('Failed to create domain');
      toast.success('Domain created');
    }
    
    setEditingDomain(null);
    fetchData();
  }, [editingDomain, fetchData]);
  
  // Save category
  const handleSaveCategory = useCallback(async (data) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    if (editingCategory) {
      // Update existing - note: PUT endpoint may need to be added
      toast.info('Category editing coming soon');
    } else {
      // Create new
      const res = await fetch(
        `${API_URL}/api/production-library/service-categories`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(data)
        }
      );
      if (!res.ok) throw new Error('Failed to create category');
      toast.success('Category created');
    }
    
    setEditingCategory(null);
    setParentForNew(null);
    fetchData();
  }, [editingCategory, fetchData]);
  
  // Navigate breadcrumb
  const handleBreadcrumbNavigate = useCallback((segment) => {
    if (!segment) {
      // Navigate to root
      setBreadcrumbPath([]);
      setSelectedNode(null);
    } else {
      // Navigate to segment
      const index = breadcrumbPath.findIndex(s => s.id === segment.id);
      if (index >= 0) {
        setBreadcrumbPath(breadcrumbPath.slice(0, index + 1));
        setSelectedNode({ ...segment });
      }
    }
  }, [breadcrumbPath]);
  
  // Handle standard creation
  const handleStandardCreated = useCallback(() => {
    setShowStandardModal(false);
    setParentForNew(null);
    fetchData();
  }, [fetchData]);
  
  // Handle import complete
  const handleImportComplete = useCallback(() => {
    setShowImportWizard(false);
    setSearchParams({});
    fetchData();
  }, [fetchData, setSearchParams]);
  
  // Stats
  const stats = useMemo(() => ({
    domains: domains.length,
    categories: categories.length,
    standards: standards.length
  }), [domains, categories, standards]);
  
  // If showing import wizard
  if (showImportWizard) {
    return (
      <div className="h-full bg-black">
        <div className="p-4 border-b border-neutral-800">
          <button
            onClick={() => {
              setShowImportWizard(false);
              setSearchParams({});
            }}
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Library
          </button>
        </div>
        <ImportWizard
          onImportComplete={handleImportComplete}
          onClose={() => {
            setShowImportWizard(false);
            setSearchParams({});
          }}
        />
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col bg-black overflow-hidden" data-testid="production-library-explorer">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <Library className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Production Library</h1>
            <p className="text-xs text-neutral-500">
              {stats.standards} standards across {stats.domains} domains
            </p>
          </div>
        </div>
        
        {/* Quick Actions (Desktop) */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={() => setShowStandardModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-medium rounded-lg transition-colors"
            data-testid="new-standard-header-btn"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            New Standard
          </button>
        </div>
        
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>
      
      {/* Main Content - Desktop Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Tree View (Desktop) */}
        <div className="hidden lg:flex lg:flex-col lg:w-80 xl:w-96 border-r border-neutral-800 bg-neutral-900/30">
          {/* Toolbar */}
          <ExplorerToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAddDomain={() => {
              setEditingDomain(null);
              setShowDomainDialog(true);
            }}
            onAddCategory={() => {
              setShowCategoryDialog(true);
            }}
            onAddStandard={() => {
              setShowStandardModal(true);
            }}
            onImport={() => setShowImportWizard(true)}
            onExport={() => toast.info('Export coming soon')}
            onRefresh={fetchData}
            isLoading={isLoading}
            selectedDomain={selectedNode?.type === 'domain' ? selectedNode : null}
          />
          
          {/* Tree */}
          <div className="flex-1 overflow-y-auto">
            <TreeView
              domains={domains}
              categories={categories}
              standards={standards}
              isLoading={isLoading}
              searchQuery={searchQuery}
              expandedNodes={expandedNodes}
              selectedNode={selectedNode}
              loadingNodes={loadingNodes}
              onToggleExpand={handleToggleExpand}
              onSelectNode={handleSelectNode}
              onContextMenu={handleContextMenu}
              onAddChild={handleAddChild}
            />
          </div>
        </div>
        
        {/* Right Panel: Detail View / Welcome */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Breadcrumbs */}
          <Breadcrumbs
            path={breadcrumbPath}
            onNavigate={handleBreadcrumbNavigate}
          />
          
          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            {selectedNode ? (
              <div className="space-y-4">
                {/* Selected node info */}
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs uppercase tracking-wider font-medium ${
                      selectedNode.type === 'domain' ? 'text-blue-400' :
                      selectedNode.type === 'category' ? 'text-purple-400' :
                      'text-emerald-400'
                    }`}>
                      {selectedNode.type}
                    </span>
                    {selectedNode.code && (
                      <span className="font-mono text-xs text-neutral-500">
                        {selectedNode.code}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold text-white">
                    {selectedNode.name || selectedNode.production_name}
                  </h2>
                  {selectedNode.description && (
                    <p className="text-sm text-neutral-400 mt-2">
                      {selectedNode.description}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* Welcome / Getting Started */
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <Library className="w-10 h-10 text-emerald-400" strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  Production Library Explorer
                </h2>
                <p className="text-sm text-neutral-400 max-w-md mb-6">
                  Browse your production standards organized by domain and category.
                  Click items in the tree to view details.
                </p>
                
                {/* Quick Stats */}
                <div className="flex items-center gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{stats.domains}</div>
                    <div className="text-xs text-neutral-500 uppercase tracking-wider">Domains</div>
                  </div>
                  <div className="w-px h-8 bg-neutral-800" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{stats.categories}</div>
                    <div className="text-xs text-neutral-500 uppercase tracking-wider">Categories</div>
                  </div>
                  <div className="w-px h-8 bg-neutral-800" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-400">{stats.standards}</div>
                    <div className="text-xs text-neutral-500 uppercase tracking-wider">Standards</div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {/* Browse Library Button (Mobile only) */}
                  <button
                    onClick={() => setIsMobileOpen(true)}
                    className="lg:hidden flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-medium rounded-lg transition-all shadow-lg shadow-emerald-500/20 min-h-[48px]"
                    data-testid="browse-library-btn"
                  >
                    <Search className="w-4 h-4" />
                    Browse Library
                  </button>
                  <button
                    onClick={() => setShowImportWizard(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-500 lg:bg-emerald-500 hover:bg-emerald-400 text-black font-medium rounded-lg transition-all shadow-lg shadow-emerald-500/20 max-lg:hidden"
                    data-testid="import-library-btn"
                  >
                    Import Library
                  </button>
                  <button
                    onClick={() => setShowStandardModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg transition-colors min-h-[48px]"
                    data-testid="add-manually-btn"
                  >
                    <Plus className="w-4 h-4" />
                    Add Standard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Full-Screen Browser */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 bg-black lg:hidden flex flex-col">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900 safe-area-inset-top">
            <button
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors min-h-[44px]"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <h2 className="text-lg font-semibold text-white">Production Library</h2>
            <div className="w-16" />
          </div>
          
          {/* Mobile Search */}
          <div className="p-3 border-b border-neutral-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search library..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-emerald-500/50 min-h-[48px]"
                data-testid="mobile-search-input"
              />
            </div>
          </div>
          
          {/* Mobile Tree */}
          <div className="flex-1 overflow-y-auto overscroll-contain safe-area-inset-bottom">
            <TreeView
              domains={domains}
              categories={categories}
              standards={standards}
              isLoading={isLoading}
              searchQuery={searchQuery}
              expandedNodes={expandedNodes}
              selectedNode={selectedNode}
              loadingNodes={loadingNodes}
              onToggleExpand={handleToggleExpand}
              onSelectNode={(node, type) => {
                handleSelectNode(node, type);
                if (type === 'standard') {
                  setIsMobileOpen(false);
                }
              }}
              onContextMenu={handleContextMenu}
              onAddChild={handleAddChild}
            />
          </div>
          
          {/* Mobile Actions */}
          <div className="p-4 border-t border-neutral-800 bg-neutral-900 safe-area-inset-bottom">
            <button
              onClick={() => {
                setIsMobileOpen(false);
                setShowStandardModal(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-medium rounded-xl transition-colors min-h-[48px]"
            >
              <Plus className="w-5 h-5" />
              New Standard
            </button>
          </div>
        </div>
      )}
      
      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        node={contextMenu.node}
        nodeType={contextMenu.nodeType}
        onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
        onAction={handleContextAction}
      />
      
      {/* Modals */}
      <DomainDialog
        isOpen={showDomainDialog}
        onClose={() => {
          setShowDomainDialog(false);
          setEditingDomain(null);
        }}
        onSave={handleSaveDomain}
        domain={editingDomain}
      />
      
      <CategoryDialog
        isOpen={showCategoryDialog}
        onClose={() => {
          setShowCategoryDialog(false);
          setEditingCategory(null);
          setParentForNew(null);
        }}
        onSave={handleSaveCategory}
        category={editingCategory}
        parentDomain={parentForNew}
      />
      
      {showStandardModal && (
        <CreateStandardModal
          onClose={() => {
            setShowStandardModal(false);
            setParentForNew(null);
          }}
          onCreated={handleStandardCreated}
          preSelectedDomain={parentForNew?.type === 'domain' ? parentForNew : null}
          preSelectedCategory={parentForNew?.type === 'category' ? parentForNew : null}
        />
      )}
    </div>
  );
};

export default ProductionLibraryExplorer;
