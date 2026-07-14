/**
 * ProductionItemDetail.jsx
 * ========================
 * 
 * Full-page detail view for a Production Item.
 * Displays all metadata and provides editing capabilities.
 * Designed for extensibility: future sections for photos, documents,
 * SOPs, quality checklists can be added without redesign.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Trash2,
  Archive,
  RotateCcw,
  Edit3,
  Check,
  X,
  Loader2,
  FolderTree,
  Tags,
  Building2,
  Layers,
  Hammer,
  DollarSign,
  Users,
  Clock,
  Hash,
  FileText,
  Star,
  StarOff,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Plus,
  Camera,
  File,
  ClipboardList,
  BookOpen,
  Settings,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ============================================
// SECTION COMPONENT
// ============================================
function DetailSection({ title, icon: Icon, children, defaultOpen = true, badge, actions }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-neutral-800 rounded-xl overflow-hidden mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900/50 hover:bg-neutral-900 transition-colors"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-4 h-4 text-emerald-400" />}
          <span className="text-sm font-medium text-white">{title}</span>
          {badge && (
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded-full">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-white/40" />
          ) : (
            <ChevronRight className="w-4 h-4 text-white/40" />
          )}
        </div>
      </button>
      {isOpen && (
        <div className="p-4 bg-neutral-950/30">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================
// FIELD COMPONENT
// ============================================
function Field({ label, value, suffix, editable, editing, onChange, type = 'text', options, placeholder, className = '' }) {
  if (editing && editable) {
    if (type === 'select') {
      return (
        <div className={className}>
          <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1">{label}</label>
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50"
          >
            <option value="">Select...</option>
            {options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      );
    }
    if (type === 'textarea') {
      return (
        <div className={className}>
          <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1">{label}</label>
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 resize-none"
          />
        </div>
      );
    }
    return (
      <div className={className}>
        <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1">{label}</label>
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50"
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-sm text-white">
        {value !== null && value !== undefined && value !== '' ? (
          <>
            {type === 'number' && typeof value === 'number' ? value.toLocaleString() : value}
            {suffix && <span className="text-white/50 ml-1">{suffix}</span>}
          </>
        ) : (
          <span className="text-white/30">—</span>
        )}
      </div>
    </div>
  );
}

// ============================================
// FUTURE SECTION PLACEHOLDER
// ============================================
function FutureSection({ title, icon: Icon, description }) {
  return (
    <div className="border border-dashed border-neutral-700 rounded-xl p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="p-3 bg-neutral-800/50 rounded-full">
          <Icon className="w-5 h-5 text-white/30" />
        </div>
        <div>
          <h4 className="text-sm font-medium text-white/50">{title}</h4>
          <p className="text-xs text-white/30 mt-1">{description}</p>
        </div>
        <span className="px-3 py-1 bg-neutral-800/50 text-white/40 text-[10px] rounded-full uppercase tracking-wider">
          Coming Soon
        </span>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function ProductionItemDetail() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  
  const [item, setItem] = useState(null);
  const [editedItem, setEditedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [session, setSession] = useState(null);
  
  // Reference data
  const [domains, setDomains] = useState([]);
  const [units, setUnits] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [areas, setAreas] = useState([]);
  const [phases, setPhases] = useState([]);

  // Fetch item and reference data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        navigate('/login');
        return;
      }
      setSession(currentSession);
      
      const headers = { 'Authorization': `Bearer ${currentSession.access_token}` };

      // Fetch item
      const itemRes = await fetch(`${API_URL}/api/production-library/items/${itemId}`, { headers });
      if (itemRes.ok) {
        const data = await itemRes.json();
        setItem(data.item);
        setEditedItem(data.item);
      } else {
        toast.error('Item not found');
        navigate('/app/production-library');
        return;
      }

      // Fetch reference data in parallel
      const [domainsRes, unitsRes, divisionsRes, disciplinesRes, areasRes, phasesRes] = await Promise.all([
        fetch(`${API_URL}/api/production-library/domains`, { headers }),
        fetch(`${API_URL}/api/production-library/units`, { headers }),
        fetch(`${API_URL}/api/production-library/divisions`, { headers }),
        fetch(`${API_URL}/api/production-library/trade-disciplines`, { headers }),
        fetch(`${API_URL}/api/production-library/areas`, { headers }),
        fetch(`${API_URL}/api/production-library/phases`, { headers })
      ]);

      if (domainsRes.ok) setDomains((await domainsRes.json()).domains || []);
      if (unitsRes.ok) setUnits((await unitsRes.json()).units || []);
      if (divisionsRes.ok) setDivisions((await divisionsRes.json()).divisions || []);
      if (disciplinesRes.ok) setDisciplines((await disciplinesRes.json()).disciplines || []);
      if (areasRes.ok) setAreas((await areasRes.json()).areas || []);
      if (phasesRes.ok) setPhases((await phasesRes.json()).phases || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load production item');
    } finally {
      setLoading(false);
    }
  }, [itemId, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Save changes
  const handleSave = async () => {
    if (!session || !editedItem) return;

    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/api/production-library/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editedItem)
      });

      if (response.ok) {
        const data = await response.json();
        setItem(data.item);
        setEditedItem(data.item);
        setEditing(false);
        toast.success('Production item saved');
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Toggle company standard
  const toggleCompanyStandard = async () => {
    if (!session || !item) return;

    try {
      const newValue = !item.is_company_standard;
      const response = await fetch(`${API_URL}/api/production-library/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...item, is_company_standard: newValue })
      });

      if (response.ok) {
        const data = await response.json();
        setItem(data.item);
        setEditedItem(data.item);
        toast.success(newValue ? 'Added to Production Standards' : 'Removed from Production Standards');
      }
    } catch (error) {
      console.error('Toggle error:', error);
      toast.error('Failed to update');
    }
  };

  // Archive/Restore
  const handleArchive = async () => {
    if (!session || !item) return;

    try {
      const response = await fetch(`${API_URL}/api/production-library/items/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        toast.success('Production item archived');
        navigate('/app/production-library');
      }
    } catch (error) {
      console.error('Archive error:', error);
      toast.error('Failed to archive');
    }
  };

  // Restore archived item
  const handleRestore = async () => {
    if (!session || !item) return;

    try {
      const response = await fetch(`${API_URL}/api/production-library/items/${itemId}/restore`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        toast.success('Production item restored');
        fetchData(); // Refresh the item
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to restore');
      }
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Failed to restore');
    }
  };

  // Duplicate item
  const handleDuplicate = async () => {
    if (!session || !item) return;

    try {
      const response = await fetch(`${API_URL}/api/production-library/items/${itemId}/duplicate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Item duplicated');
        // Navigate to the new item
        navigate(`/app/production-library/items/${data.item.id}`);
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to duplicate');
      }
    } catch (error) {
      console.error('Duplicate error:', error);
      toast.error('Failed to duplicate');
    }
  };

  // Permanent delete (with confirmation)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const handlePermanentDelete = async () => {
    if (!session || !item) return;

    try {
      const response = await fetch(`${API_URL}/api/production-library/items/${itemId}/permanent`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        toast.success('Production item permanently deleted');
        navigate('/app/production-library');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Cannot delete this item');
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete');
      setShowDeleteConfirm(false);
    }
  };

  // Copy production code
  const copyProductionCode = () => {
    if (item?.production_code) {
      navigator.clipboard.writeText(item.production_code);
      toast.success('Production code copied');
    }
  };

  // Update edited item field
  const updateField = (field, value) => {
    setEditedItem(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-white">Item Not Found</h2>
          <button
            onClick={() => navigate('/app/production-library')}
            className="mt-4 px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  const currentItem = editing ? editedItem : item;
  const domainName = domains.find(d => d.id === currentItem?.knowledge_domain_id)?.name || '—';
  const unitCode = units.find(u => u.id === currentItem?.measurement_unit_id)?.code || '—';

  return (
    <div className="min-h-screen bg-[#0a0a0a]" data-testid="production-item-detail">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Back + Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/app/production-library')}
                className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold text-white">{currentItem.production_name}</h1>
                  {item.is_company_standard && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" /> Production Standard
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <button
                    onClick={copyProductionCode}
                    className="flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <Hash className="w-3.5 h-3.5" />
                    {currentItem.production_code}
                    <Copy className="w-3 h-3 opacity-50" />
                  </button>
                  <span className="text-white/30">•</span>
                  <span className="text-sm text-white/50">{domainName}</span>
                  <span className="text-white/30">•</span>
                  <span className="px-2 py-0.5 bg-neutral-800 text-white/60 text-xs rounded">{unitCode}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <button
                    onClick={() => { setEditing(false); setEditedItem(item); }}
                    className="px-4 py-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </button>
                </>
              ) : item?.is_active === false ? (
                // Archived item actions
                <>
                  <button
                    onClick={handleRestore}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition-colors text-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Restore
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Permanently
                  </button>
                </>
              ) : (
                // Active item actions
                <>
                  <button
                    onClick={toggleCompanyStandard}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                      item.is_company_standard
                        ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                        : 'text-white/50 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {item.is_company_standard ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                    {item.is_company_standard ? 'Remove Standard' : 'Make Standard'}
                  </button>
                  <button
                    onClick={handleDuplicate}
                    className="flex items-center gap-2 px-3 py-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={handleArchive}
                    className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Archive"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-6">
          {/* Main Content - 2 columns */}
          <div className="col-span-2 space-y-4">
            {/* Description */}
            <DetailSection title="Description" icon={FileText}>
              <Field
                label="Description"
                value={currentItem.description}
                editable
                editing={editing}
                onChange={(v) => updateField('description', v)}
                type="textarea"
                placeholder="Detailed description of this production item..."
              />
              <div className="mt-4">
                <Field
                  label="Notes"
                  value={currentItem.notes}
                  editable
                  editing={editing}
                  onChange={(v) => updateField('notes', v)}
                  type="textarea"
                  placeholder="Internal notes, tips, or special instructions..."
                />
              </div>
            </DetailSection>

            {/* Production Metrics */}
            <DetailSection title="Production Metrics" icon={Clock}>
              <div className="grid grid-cols-4 gap-4">
                <Field
                  label="Crew Size"
                  value={currentItem.crew_size}
                  editable
                  editing={editing}
                  onChange={(v) => updateField('crew_size', v)}
                  type="number"
                  suffix="workers"
                />
                <Field
                  label="Production/Day"
                  value={currentItem.production_per_day}
                  editable
                  editing={editing}
                  onChange={(v) => updateField('production_per_day', v)}
                  type="number"
                  suffix={unitCode}
                />
                <Field
                  label="Output/Hour"
                  value={currentItem.production_output}
                  editable
                  editing={editing}
                  onChange={(v) => updateField('production_output', v)}
                  type="number"
                  suffix={unitCode}
                />
                <Field
                  label="Labour Hours"
                  value={currentItem.labour_hours}
                  editable
                  editing={editing}
                  onChange={(v) => updateField('labour_hours', v)}
                  type="number"
                  suffix="hrs"
                />
              </div>
            </DetailSection>

            {/* Pricing */}
            <DetailSection title="Pricing" icon={DollarSign}>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-medium text-white/60 mb-3">Labour Rates (per {unitCode})</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <Field
                        label="Low Rate"
                        value={currentItem.low_labour_rate}
                        editable
                        editing={editing}
                        onChange={(v) => updateField('low_labour_rate', v)}
                        type="number"
                        suffix="$"
                      />
                    </div>
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      <Field
                        label="Standard Rate"
                        value={currentItem.standard_rate}
                        editable
                        editing={editing}
                        onChange={(v) => updateField('standard_rate', v)}
                        type="number"
                        suffix="$"
                      />
                    </div>
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <Field
                        label="Premium Rate"
                        value={currentItem.premium_labour_rate || currentItem.premium_rate}
                        editable
                        editing={editing}
                        onChange={(v) => updateField('premium_labour_rate', v)}
                        type="number"
                        suffix="$"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-white/60 mb-3">Additional Rates</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <Field
                      label="Material Rate"
                      value={currentItem.material_rate}
                      editable
                      editing={editing}
                      onChange={(v) => updateField('material_rate', v)}
                      type="number"
                      suffix="$"
                    />
                    <Field
                      label="Equipment Rate"
                      value={currentItem.equipment_rate}
                      editable
                      editing={editing}
                      onChange={(v) => updateField('equipment_rate', v)}
                      type="number"
                      suffix="$"
                    />
                    <Field
                      label="Complex Rate"
                      value={currentItem.complex_rate}
                      editable
                      editing={editing}
                      onChange={(v) => updateField('complex_rate', v)}
                      type="number"
                      suffix="$"
                    />
                  </div>
                </div>
              </div>
            </DetailSection>

            {/* Future Sections */}
            <DetailSection title="Attachments" icon={Camera} defaultOpen={false}>
              <FutureSection
                title="Photos & Documents"
                icon={Camera}
                description="Add photos, specifications, installation guides, and reference documents"
              />
            </DetailSection>

            <DetailSection title="Quality & Standards" icon={ClipboardList} defaultOpen={false}>
              <FutureSection
                title="Quality Checklists"
                icon={ClipboardList}
                description="Define quality control checkpoints and acceptance criteria"
              />
            </DetailSection>

            <DetailSection title="SOPs & Instructions" icon={BookOpen} defaultOpen={false}>
              <FutureSection
                title="Standard Operating Procedures"
                icon={BookOpen}
                description="Document installation methods, safety requirements, and best practices"
              />
            </DetailSection>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-4">
            {/* Classification */}
            <DetailSection title="Classification" icon={FolderTree}>
              <div className="space-y-4">
                {editing ? (
                  <Field
                    label="Knowledge Domain"
                    value={currentItem.knowledge_domain_id}
                    editable
                    editing={editing}
                    onChange={(v) => updateField('knowledge_domain_id', v)}
                    type="select"
                    options={domains.map(d => ({ value: d.id, label: d.name }))}
                  />
                ) : (
                  <Field
                    label="Knowledge Domain"
                    value={currentItem.knowledge_domains?.name || domainName}
                  />
                )}
                {editing ? (
                  <Field
                    label="Measurement Unit"
                    value={currentItem.measurement_unit_id}
                    editable
                    editing={editing}
                    onChange={(v) => updateField('measurement_unit_id', v)}
                    type="select"
                    options={units.map(u => ({ value: u.id, label: `${u.code} - ${u.name}` }))}
                  />
                ) : (
                  <Field
                    label="Measurement Unit"
                    value={currentItem.measurement_units?.code ? `${currentItem.measurement_units.code} - ${currentItem.measurement_units.name}` : unitCode}
                  />
                )}
                {editing ? (
                  <Field
                    label="Trade Discipline"
                    value={currentItem.trade_discipline}
                    editable
                    editing={editing}
                    onChange={(v) => updateField('trade_discipline', v)}
                    type="select"
                    options={disciplines.map(d => ({ value: d.name, label: d.name }))}
                  />
                ) : (
                  <Field
                    label="Trade Discipline"
                    value={currentItem.trade_discipline}
                  />
                )}
                {editing ? (
                  <Field
                    label="CSI Division"
                    value={currentItem.division_id}
                    editable
                    editing={editing}
                    onChange={(v) => updateField('division_id', v)}
                    type="select"
                    options={divisions.map(d => ({ value: d.id, label: `${d.code} - ${d.name}` }))}
                  />
                ) : (
                  <Field
                    label="CSI Division"
                    value={divisions.find(d => d.id === currentItem.division_id)?.name ? 
                      `${divisions.find(d => d.id === currentItem.division_id).code} - ${divisions.find(d => d.id === currentItem.division_id).name}` : 
                      '—'}
                  />
                )}
                <Field
                  label="Cost Code"
                  value={currentItem.cost_code}
                  editable
                  editing={editing}
                  onChange={(v) => updateField('cost_code', v)}
                  placeholder="e.g., 06-2000"
                />
              </div>
            </DetailSection>

            {/* Tags */}
            <DetailSection title="Tags" icon={Tags}>
              {editing ? (
                <div>
                  <input
                    type="text"
                    value={currentItem.tags?.join(', ') || ''}
                    onChange={(e) => updateField('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                    placeholder="doors, interior, standard"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50"
                  />
                  <p className="text-[10px] text-white/40 mt-1">Separate tags with commas</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {currentItem.tags?.length > 0 ? (
                    currentItem.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-neutral-800 text-white/70 text-xs rounded">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-white/30 text-sm">No tags</span>
                  )}
                </div>
              )}
            </DetailSection>

            {/* Status */}
            <DetailSection title="Status" icon={Settings}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Active</span>
                  <span className={`px-2 py-0.5 text-xs rounded ${item.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {item.is_active ? 'Yes' : 'Archived'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Production Standard</span>
                  <span className={`px-2 py-0.5 text-xs rounded ${item.is_company_standard ? 'bg-amber-500/20 text-amber-400' : 'bg-neutral-700 text-white/50'}`}>
                    {item.is_company_standard ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </DetailSection>

            {/* Metadata */}
            <DetailSection title="Metadata" icon={Hash} defaultOpen={false}>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/40">Created</span>
                  <span className="text-white/60">{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                {item.updated_at && (
                  <div className="flex justify-between">
                    <span className="text-white/40">Updated</span>
                    <span className="text-white/60">{new Date(item.updated_at).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-white/40">ID</span>
                  <span className="text-white/40 font-mono text-[10px]">{item.id?.slice(0, 8)}...</span>
                </div>
              </div>
            </DetailSection>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Permanently Delete Item</h3>
            </div>
            <p className="text-neutral-400 mb-4">
              Are you sure you want to permanently delete <span className="text-white font-medium">{item?.production_name}</span>?
              This action cannot be undone.
            </p>
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
              Note: Items that have been used in estimates, projects, or assemblies cannot be permanently deleted. They must remain archived for historical reference.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePermanentDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
