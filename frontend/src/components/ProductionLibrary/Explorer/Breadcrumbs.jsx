/**
 * Breadcrumbs.jsx - Production Library Explorer Breadcrumbs
 * ==========================================================
 * 
 * Shows the current navigation path in the tree.
 * Clickable segments to navigate back up the hierarchy.
 */

import React from 'react';
import { ChevronRight, Home, FolderTree } from 'lucide-react';

const Breadcrumbs = ({
  path = [], // Array of { id, name, type }
  onNavigate
}) => {
  if (path.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 border-b border-neutral-800 text-sm">
        <FolderTree className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
        <span className="text-white font-medium">Production Library</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-neutral-800 text-sm overflow-x-auto">
      {/* Root */}
      <button
        onClick={() => onNavigate(null)}
        className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors whitespace-nowrap min-h-[32px]"
        data-testid="breadcrumb-root"
      >
        <FolderTree className="w-4 h-4" strokeWidth={1.5} />
        <span>Library</span>
      </button>
      
      {/* Path segments */}
      {path.map((segment, index) => {
        const isLast = index === path.length - 1;
        
        return (
          <React.Fragment key={segment.id}>
            <ChevronRight className="w-4 h-4 text-neutral-600 flex-shrink-0" strokeWidth={1.5} />
            
            <button
              onClick={() => !isLast && onNavigate(segment)}
              disabled={isLast}
              className={`flex items-center gap-1.5 px-2 py-1 rounded whitespace-nowrap min-h-[32px] ${
                isLast 
                  ? 'text-white font-medium cursor-default' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors'
              }`}
              data-testid={`breadcrumb-${segment.id}`}
            >
              <span className={`
                ${segment.type === 'domain' ? 'text-blue-400' : ''}
                ${segment.type === 'category' ? 'text-purple-400' : ''}
                ${segment.type === 'standard' ? 'text-emerald-400' : ''}
              `}>
                {segment.name}
              </span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Breadcrumbs;
