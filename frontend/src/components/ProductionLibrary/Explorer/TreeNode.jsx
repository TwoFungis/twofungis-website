/**
 * TreeNode.jsx - Production Library Explorer Tree Node
 * =====================================================
 * 
 * A single node in the hierarchy tree (Domain, Category, or Standard).
 * Supports:
 * - Expand/collapse for containers (domains, categories)
 * - Context menu trigger (right-click desktop, long-press mobile)
 * - Drag source/target for reordering
 * - Lazy loading children on expand
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  File,
  MoreHorizontal,
  Plus,
  GripVertical
} from 'lucide-react';

const TreeNode = ({
  node,
  level = 0,
  type, // 'domain' | 'category' | 'standard'
  isExpanded,
  isSelected,
  isLoading,
  childCount,
  onToggle,
  onSelect,
  onContextMenu,
  onAddChild,
  isDragging,
  dragHandleProps,
  children
}) => {
  const nodeRef = useRef(null);
  const longPressTimer = useRef(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  
  const paddingLeft = level * 16 + 8;
  
  const isContainer = type === 'domain' || type === 'category';
  
  // Long press for mobile context menu
  const handleTouchStart = useCallback((e) => {
    longPressTimer.current = setTimeout(() => {
      onContextMenu?.(e, node);
    }, 500);
  }, [node, onContextMenu]);
  
  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);
  
  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (isContainer) {
      onToggle?.(node);
    } else {
      onSelect?.(node);
    }
  }, [isContainer, node, onToggle, onSelect]);
  
  const handleRightClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu?.(e, node);
  }, [node, onContextMenu]);
  
  const handleQuickAdd = useCallback((e) => {
    e.stopPropagation();
    onAddChild?.(node);
  }, [node, onAddChild]);

  // Get icon based on type and state
  const getIcon = () => {
    if (type === 'standard') {
      return <File className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />;
    }
    if (isExpanded) {
      return <FolderOpen className="w-4 h-4 text-amber-400" strokeWidth={1.5} />;
    }
    return <Folder className="w-4 h-4 text-amber-400" strokeWidth={1.5} />;
  };

  // Get type color
  const getTypeColor = () => {
    switch (type) {
      case 'domain':
        return 'text-blue-400';
      case 'category':
        return 'text-purple-400';
      case 'standard':
        return 'text-emerald-400';
      default:
        return 'text-neutral-400';
    }
  };

  return (
    <div data-testid={`tree-node-${node.id}`}>
      <div
        ref={nodeRef}
        className={`
          group flex items-center gap-2 py-2 px-2 rounded-lg cursor-pointer transition-all
          ${isSelected ? 'bg-emerald-500/10 text-white' : 'hover:bg-neutral-800/50 text-neutral-300'}
          ${isDragging ? 'opacity-50' : ''}
        `}
        style={{ paddingLeft }}
        onClick={handleClick}
        onContextMenu={handleRightClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseEnter={() => setShowQuickActions(true)}
        onMouseLeave={() => setShowQuickActions(false)}
      >
        {/* Drag Handle (desktop only) */}
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="hidden lg:flex items-center opacity-0 group-hover:opacity-50 hover:!opacity-100 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-3 h-3 text-neutral-500" strokeWidth={1.5} />
          </div>
        )}
        
        {/* Expand/Collapse Arrow */}
        {isContainer && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle?.(node);
            }}
            className="w-4 h-4 flex items-center justify-center flex-shrink-0"
            data-testid={`toggle-${node.id}`}
          >
            {isLoading ? (
              <div className="w-3 h-3 border border-neutral-500 border-t-transparent rounded-full animate-spin" />
            ) : isExpanded ? (
              <ChevronDown className="w-3 h-3 text-neutral-500" strokeWidth={2} />
            ) : (
              <ChevronRight className="w-3 h-3 text-neutral-500" strokeWidth={2} />
            )}
          </button>
        )}
        
        {/* Spacer for non-container nodes */}
        {!isContainer && <div className="w-4" />}
        
        {/* Icon */}
        {getIcon()}
        
        {/* Label */}
        <span className="flex-1 text-sm truncate">
          {node.name || node.production_name}
        </span>
        
        {/* Item count badge (for containers) */}
        {isContainer && childCount !== undefined && childCount > 0 && (
          <span className="text-[10px] bg-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded">
            {childCount}
          </span>
        )}
        
        {/* Code badge (for standards) */}
        {type === 'standard' && node.production_code && (
          <span className="font-mono text-[10px] text-emerald-400/70">
            {node.production_code}
          </span>
        )}
        
        {/* Quick Actions (desktop hover) */}
        {showQuickActions && (
          <div className="hidden lg:flex items-center gap-1">
            {isContainer && (
              <button
                onClick={handleQuickAdd}
                className="p-1 rounded hover:bg-neutral-700 text-neutral-500 hover:text-white transition-colors"
                title={`Add ${type === 'domain' ? 'Category' : 'Standard'}`}
                data-testid={`quick-add-${node.id}`}
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            )}
            <button
              onClick={handleRightClick}
              className="p-1 rounded hover:bg-neutral-700 text-neutral-500 hover:text-white transition-colors"
              title="More actions"
              data-testid={`more-actions-${node.id}`}
            >
              <MoreHorizontal className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>
        )}
      </div>
      
      {/* Children (when expanded) */}
      {isExpanded && children && (
        <div className="relative">
          {/* Vertical guide line */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-px bg-neutral-800"
            style={{ left: paddingLeft + 7 }}
          />
          {children}
        </div>
      )}
    </div>
  );
};

export default TreeNode;
