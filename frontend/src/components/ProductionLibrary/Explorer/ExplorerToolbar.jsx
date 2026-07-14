/**
 * ExplorerToolbar.jsx - Production Library Explorer Toolbar
 * ==========================================================
 * 
 * Top toolbar for the Production Library Explorer.
 * Contains:
 * - Domain, Category, Standard creation buttons
 * - Import/Export buttons
 * - Search input
 * - View options
 */

import React from 'react';
import {
  Plus,
  Upload,
  Download,
  Search,
  FolderPlus,
  FilePlus,
  Layers,
  LayoutGrid,
  LayoutList,
  RefreshCw
} from 'lucide-react';

const ExplorerToolbar = ({
  searchQuery,
  onSearchChange,
  onAddDomain,
  onAddCategory,
  onAddStandard,
  onImport,
  onExport,
  onRefresh,
  viewMode,
  onViewModeChange,
  isLoading,
  selectedDomain,
  selectedCategory
}) => {
  return (
    <div className="flex flex-col gap-3 p-3 border-b border-neutral-800 bg-neutral-900/50">
      {/* Top Row: Search */}
      <div className="relative">
        <Search 
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" 
          strokeWidth={1.5} 
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search library..."
          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors min-h-[44px]"
          data-testid="explorer-search-input"
        />
      </div>
      
      {/* Bottom Row: Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Add Buttons with Dropdown */}
        <div className="flex items-center bg-neutral-800 rounded-lg p-1 gap-1">
          <button
            onClick={onAddDomain}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors min-h-[36px]"
            title="Add Domain"
            data-testid="add-domain-btn"
          >
            <FolderPlus className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
            <span className="hidden sm:inline">Domain</span>
          </button>
          
          <div className="w-px h-5 bg-neutral-700" />
          
          <button
            onClick={onAddCategory}
            disabled={!selectedDomain}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm transition-colors min-h-[36px] ${
              selectedDomain 
                ? 'text-neutral-300 hover:text-white hover:bg-neutral-700' 
                : 'text-neutral-600 cursor-not-allowed'
            }`}
            title={selectedDomain ? "Add Category" : "Select a domain first"}
            data-testid="add-category-btn"
          >
            <Layers className="w-4 h-4 text-purple-400" strokeWidth={1.5} />
            <span className="hidden sm:inline">Category</span>
          </button>
          
          <div className="w-px h-5 bg-neutral-700" />
          
          <button
            onClick={onAddStandard}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors min-h-[36px]"
            title="Add Standard"
            data-testid="add-standard-btn"
          >
            <FilePlus className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
            <span className="hidden sm:inline">Standard</span>
          </button>
        </div>
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Import/Export */}
        <div className="flex items-center gap-1">
          <button
            onClick={onImport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors min-h-[36px]"
            title="Import Library"
            data-testid="import-btn"
          >
            <Upload className="w-4 h-4" strokeWidth={1.5} />
            <span className="hidden sm:inline">Import</span>
          </button>
          
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors min-h-[36px]"
            title="Export Library"
            data-testid="export-btn"
          >
            <Download className="w-4 h-4" strokeWidth={1.5} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
        
        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
          title="Refresh"
          data-testid="refresh-btn"
        >
          <RefreshCw 
            className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} 
            strokeWidth={1.5} 
          />
        </button>
      </div>
    </div>
  );
};

export default ExplorerToolbar;
