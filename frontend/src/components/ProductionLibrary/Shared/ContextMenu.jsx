/**
 * ContextMenu.jsx - Production Library Context Menu
 * ===================================================
 * 
 * Context menu for tree nodes.
 * Shows relevant actions based on node type:
 * - Domain: Add Category, Rename, Duplicate, Archive, Delete
 * - Category: Add Standard, Rename, Duplicate, Archive, Delete
 * - Standard: View, Edit, Duplicate, Add to Estimate, Archive, Delete
 */

import React, { useEffect, useRef } from 'react';
import {
  Plus,
  Edit3,
  Copy,
  Archive,
  Trash2,
  Eye,
  ShoppingCart,
  FolderPlus,
  FilePlus,
  Layers
} from 'lucide-react';

const ContextMenu = ({
  isOpen,
  position,
  node,
  nodeType,
  onClose,
  onAction
}) => {
  const menuRef = useRef(null);
  
  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);
  
  // Adjust position to stay in viewport
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;
    
    const rect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (rect.right > viewportWidth) {
      menuRef.current.style.left = `${position.x - rect.width}px`;
    }
    
    if (rect.bottom > viewportHeight) {
      menuRef.current.style.top = `${position.y - rect.height}px`;
    }
  }, [isOpen, position]);
  
  if (!isOpen) return null;
  
  const handleAction = (action) => {
    onAction(action, node);
    onClose();
  };
  
  // Menu items based on node type
  const getMenuItems = () => {
    switch (nodeType) {
      case 'domain':
        return [
          { id: 'add-category', label: 'New Category', icon: Layers, color: 'text-purple-400' },
          { id: 'add-standard', label: 'New Standard', icon: FilePlus, color: 'text-emerald-400' },
          { type: 'divider' },
          { id: 'rename', label: 'Rename', icon: Edit3 },
          { id: 'duplicate', label: 'Duplicate', icon: Copy },
          { type: 'divider' },
          { id: 'archive', label: 'Archive', icon: Archive, color: 'text-amber-400' },
          { id: 'delete', label: 'Delete', icon: Trash2, color: 'text-red-400', danger: true },
        ];
        
      case 'category':
        return [
          { id: 'add-standard', label: 'New Standard', icon: FilePlus, color: 'text-emerald-400' },
          { type: 'divider' },
          { id: 'rename', label: 'Rename', icon: Edit3 },
          { id: 'duplicate', label: 'Duplicate', icon: Copy },
          { type: 'divider' },
          { id: 'archive', label: 'Archive', icon: Archive, color: 'text-amber-400' },
          { id: 'delete', label: 'Delete', icon: Trash2, color: 'text-red-400', danger: true },
        ];
        
      case 'standard':
        return [
          { id: 'view', label: 'View Details', icon: Eye },
          { id: 'edit', label: 'Edit', icon: Edit3 },
          { id: 'add-to-estimate', label: 'Add to Estimate', icon: ShoppingCart, color: 'text-emerald-400' },
          { type: 'divider' },
          { id: 'duplicate', label: 'Duplicate', icon: Copy },
          { type: 'divider' },
          { id: 'archive', label: 'Archive', icon: Archive, color: 'text-amber-400' },
          { id: 'delete', label: 'Delete', icon: Trash2, color: 'text-red-400', danger: true },
        ];
        
      default:
        return [];
    }
  };
  
  const menuItems = getMenuItems();
  
  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[200px] bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl py-1 overflow-hidden"
      style={{ top: position.y, left: position.x }}
      data-testid="context-menu"
    >
      {/* Header showing what's selected */}
      <div className="px-3 py-2 border-b border-neutral-800">
        <p className="text-xs text-neutral-500 uppercase tracking-wider">
          {nodeType}
        </p>
        <p className="text-sm text-white font-medium truncate">
          {node?.name || node?.production_name || 'Unknown'}
        </p>
      </div>
      
      {/* Menu Items */}
      <div className="py-1">
        {menuItems.map((item, index) => {
          if (item.type === 'divider') {
            return <div key={index} className="border-t border-neutral-800 my-1" />;
          }
          
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => handleAction(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors min-h-[40px]
                ${item.danger 
                  ? 'text-red-400 hover:bg-red-500/10' 
                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                }
              `}
              data-testid={`context-menu-${item.id}`}
            >
              <Icon className={`w-4 h-4 ${item.color || ''}`} strokeWidth={1.5} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ContextMenu;
