/**
 * ProductionHierarchyManager.jsx
 * ==============================
 * 
 * Management interface for the 6-level Production Library hierarchy:
 * 1. Knowledge Domains
 * 2. Service Categories  
 * 3. Areas (Lobby, Corridors, Suites)
 * 4. Phases (Framing, Rough-In, Finishing)
 * 5. Divisions (CSI MasterFormat)
 * 6. Trade Disciplines
 * 
 * This component provides CRUD operations for all hierarchy levels,
 * enabling administrators to customize the Production Library structure.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderTree,
  Tags,
  Layers,
  Building2,
  Hammer,
  Users,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  Loader2,
  ChevronRight,
  ChevronDown,
  Save,
  AlertCircle,
  RefreshCw,
  Settings2,
  Database
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ============================================
// HIERARCHY LEVEL CONFIGURATION
// ============================================
const HIERARCHY_LEVELS = [
  {
    id: 'domains',
    name: 'Knowledge Domains',
    icon: FolderTree,
    description: 'Primary classification of work types',
    examples: 'Finish Carpentry, Doors & Hardware, Flooring',
    color: 'emerald',
    endpoint: '/api/production-library/domains',
    fields: ['code', 'name', 'description']
  },
  {
    id: 'categories',
    name: 'Service Categories',
    icon: Tags,
    description: 'Project type classifications',
    examples: 'Residential, Commercial, Multifamily',
    color: 'blue',
    endpoint: '/api/production-library/service-categories',
    fields: ['code', 'name', 'description']
  },
  {
    id: 'areas',
    name: 'Areas',
    icon: Building2,
    description: 'Physical/logical project sections',
    examples: 'Lobby, Corridors, Suites, Parking',
    color: 'purple',
    endpoint: '/api/production-library/areas',
    fields: ['code', 'name', 'description']
  },
  {
    id: 'phases',
    name: 'Phases',
    icon: Layers,
    description: 'Stages of construction work',
    examples: 'Framing, Rough-In, Finishing, Punchlist',
    color: 'amber',
    endpoint: '/api/production-library/phases',
    fields: ['code', 'name', 'description']
  },
  {
    id: 'divisions',
    name: 'Divisions',
    icon: Database,
    description: 'CSI MasterFormat divisions',
    examples: '06-Wood & Plastics, 09-Finishes',
    color: 'rose',
    endpoint: '/api/production-library/divisions',
    fields: ['code', 'name', 'description']
  },
  {
    id: 'disciplines',
    name: 'Trade Disciplines',
    icon: Hammer,
    description: 'Trade classifications for crews',
    examples: 'Carpentry, Millwork, Painting',
    color: 'cyan',
    endpoint: '/api/production-library/trade-disciplines',
    fields: ['code', 'name', 'description']
  }
];

// ============================================
// HIERARCHY ITEM ROW COMPONENT
// ============================================
function HierarchyItemRow({ item, level, session, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editData, setEditData] = useState({ ...item });

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_URL}${level.endpoint}/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editData)
      });

      if (response.ok) {
        toast.success(`${level.name.slice(0, -1)} updated`);
        onUpdate();
        setEditing(false);
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update');
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const response = await fetch(`${API_URL}${level.endpoint}/${item.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        toast.success(`${level.name.slice(0, -1)} archived`);
        onDelete();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to archive');
    } finally {
      setDeleting(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-neutral-900/50 border-b border-neutral-800">
        <input
          type="text"
          value={editData.code || ''}
          onChange={(e) => setEditData({ ...editData, code: e.target.value })}
          placeholder="Code"
          className="w-20 px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-white text-sm font-mono focus:outline-none focus:border-emerald-500/50"
        />
        <input
          type="text"
          value={editData.name || ''}
          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
          placeholder="Name"
          className="flex-1 px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:border-emerald-500/50"
        />
        <input
          type="text"
          value={editData.description || ''}
          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
          placeholder="Description"
          className="flex-1 px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:border-emerald-500/50"
        />
        <button
          onClick={handleSave}
          className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={() => setEditing(false)}
          className="p-1.5 text-white/50 hover:bg-white/10 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 border-b border-neutral-800/50 group transition-colors">
      {/* Code */}
      <div className="w-20">
        {item.code && (
          <span className="px-2 py-0.5 bg-neutral-800 text-white/60 text-xs font-mono rounded">
            {item.code}
          </span>
        )}
      </div>
      
      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">{item.name}</p>
      </div>
      
      {/* Description */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/40 truncate">{item.description || '—'}</p>
      </div>
      
      {/* System Badge */}
      {item.is_system && (
        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded">
          System
        </span>
      )}
      
      {/* Item Count */}
      {item.item_count !== undefined && (
        <span className="text-xs text-white/40">{item.item_count} items</span>
      )}
      
      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded transition-colors"
          title="Edit"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        {!item.is_system && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
            title="Archive"
          >
            {deleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// HIERARCHY LEVEL SECTION COMPONENT
// ============================================
function HierarchyLevelSection({ level, session, expanded, onToggle }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ code: '', name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const Icon = level.icon;

  const fetchItems = useCallback(async () => {
    if (!session?.access_token) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}${level.endpoint}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Handle different response shapes
        const itemsArray = data.domains || data.categories || data.areas || 
                          data.phases || data.divisions || data.disciplines || [];
        setItems(itemsArray);
      }
    } catch (error) {
      console.error(`Error fetching ${level.id}:`, error);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, level]);

  useEffect(() => {
    if (expanded) {
      fetchItems();
    }
  }, [expanded, fetchItems]);

  const handleCreate = async () => {
    if (!newItem.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`${API_URL}${level.endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newItem)
      });

      if (response.ok) {
        toast.success(`${level.name.slice(0, -1)} created`);
        setNewItem({ code: '', name: '', description: '' });
        setAdding(false);
        fetchItems();
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Creation failed');
      }
    } catch (error) {
      console.error('Create error:', error);
      toast.error(error.message || 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-neutral-800 rounded-xl overflow-hidden mb-4">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900/50 hover:bg-neutral-900 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-${level.color}-500/10`}>
            <Icon className={`w-4 h-4 text-${level.color}-400`} />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-medium text-white">{level.name}</h3>
            <p className="text-xs text-white/40">{level.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-white/40" />
          ) : (
            <ChevronRight className="w-4 h-4 text-white/40" />
          )}
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div>
          {/* Column Headers */}
          <div className="flex items-center gap-3 px-4 py-2 bg-neutral-950/50 border-y border-neutral-800 text-[10px] text-white/30 uppercase tracking-wider">
            <div className="w-20">Code</div>
            <div className="flex-1">Name</div>
            <div className="flex-1">Description</div>
            <div className="w-24"></div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
            </div>
          )}

          {/* Items */}
          {!loading && items.length === 0 && !adding && (
            <div className="px-4 py-8 text-center">
              <p className="text-white/40 text-sm">No {level.name.toLowerCase()} defined yet</p>
              <p className="text-white/30 text-xs mt-1">Examples: {level.examples}</p>
            </div>
          )}

          {!loading && items.map(item => (
            <HierarchyItemRow
              key={item.id}
              item={item}
              level={level}
              session={session}
              onUpdate={fetchItems}
              onDelete={fetchItems}
            />
          ))}

          {/* Add New Form */}
          {adding && (
            <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/5 border-b border-emerald-500/20">
              <input
                type="text"
                value={newItem.code}
                onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
                placeholder="Code"
                className="w-20 px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-white text-sm font-mono focus:outline-none focus:border-emerald-500/50"
                autoFocus
              />
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Name (required)"
                className="flex-1 px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:border-emerald-500/50"
              />
              <input
                type="text"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Description"
                className="flex-1 px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:border-emerald-500/50"
              />
              <button
                onClick={handleCreate}
                disabled={saving}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
              </button>
              <button
                onClick={() => {
                  setAdding(false);
                  setNewItem({ code: '', name: '', description: '' });
                }}
                className="p-1.5 text-white/50 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Add Button */}
          {!adding && (
            <button
              onClick={() => setAdding(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-emerald-400 hover:bg-emerald-500/10 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Add {level.name.slice(0, -1)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function ProductionHierarchyManager({ session }) {
  const [expandedLevels, setExpandedLevels] = useState(['domains']);
  const [seeding, setSeeding] = useState(false);
  const [hierarchyStats, setHierarchyStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch hierarchy statistics
  const fetchHierarchyStats = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      setLoadingStats(true);
      const response = await fetch(`${API_URL}/api/production-library/hierarchy`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setHierarchyStats(data.counts);
      }
    } catch (error) {
      console.error('Error fetching hierarchy:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchHierarchyStats();
  }, [fetchHierarchyStats]);

  // Seed v2 hierarchy
  const handleSeedV2 = async () => {
    try {
      setSeeding(true);
      const response = await fetch(`${API_URL}/api/production-library/seed/v2`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Hierarchy seeded successfully!');
        fetchHierarchyStats();
        // Expand all levels to show seeded data
        setExpandedLevels(HIERARCHY_LEVELS.map(l => l.id));
      } else {
        throw new Error('Seeding failed');
      }
    } catch (error) {
      console.error('Seed error:', error);
      toast.error('Failed to seed hierarchy');
    } finally {
      setSeeding(false);
    }
  };

  const toggleLevel = (levelId) => {
    setExpandedLevels(prev => 
      prev.includes(levelId)
        ? prev.filter(id => id !== levelId)
        : [...prev, levelId]
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]" data-testid="hierarchy-manager">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Settings2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Production Library Hierarchy</h2>
            <p className="text-sm text-white/50">Configure the structure of your Company Knowledge Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchHierarchyStats}
            className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleSeedV2}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {seeding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            Initialize Defaults
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      {hierarchyStats && (
        <div className="px-6 py-3 border-b border-neutral-800 bg-neutral-900/30">
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <FolderTree className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-white/50">Domains:</span>
              <span className="text-white font-medium">{hierarchyStats.knowledge_domains || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Tags className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-white/50">Categories:</span>
              <span className="text-white font-medium">{hierarchyStats.service_categories || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-white/50">Areas:</span>
              <span className="text-white font-medium">{hierarchyStats.areas || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-white/50">Phases:</span>
              <span className="text-white font-medium">{hierarchyStats.phases || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-white/50">Divisions:</span>
              <span className="text-white font-medium">{hierarchyStats.divisions || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Hammer className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-white/50">Disciplines:</span>
              <span className="text-white font-medium">{hierarchyStats.trade_disciplines || 0}</span>
            </div>
            <div className="ml-auto flex items-center gap-2 text-emerald-400">
              <span className="text-white/50">Production Items:</span>
              <span className="font-semibold">{hierarchyStats.production_items || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Hierarchy Info */}
      <div className="px-6 py-4 border-b border-neutral-800 bg-gradient-to-r from-emerald-500/5 to-transparent">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-white/80">
              <strong>Six-Level Hierarchy:</strong> Knowledge Domain → Service Category → Area → Phase → Division → Production Item
            </p>
            <p className="text-xs text-white/50 mt-1">
              This structure organizes all Production Standards and enables precise filtering in estimates and reports.
            </p>
          </div>
        </div>
      </div>

      {/* Hierarchy Levels */}
      <div className="flex-1 overflow-y-auto p-6">
        {HIERARCHY_LEVELS.map(level => (
          <HierarchyLevelSection
            key={level.id}
            level={level}
            session={session}
            expanded={expandedLevels.includes(level.id)}
            onToggle={() => toggleLevel(level.id)}
          />
        ))}
      </div>
    </div>
  );
}
