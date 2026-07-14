/**
 * CreateStandardModal.jsx
 * =======================
 * Modal for creating new Production Items (Production Standards).
 * Provides a clean form interface with validation and persistence.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Loader2,
  Hash,
  FileText,
  DollarSign,
  Users,
  Clock,
  Tags,
  FolderTree,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function CreateStandardModal({ isOpen, onClose, session, domains, units, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    production_code: '',
    production_name: '',
    description: '',
    knowledge_domain_id: '',
    measurement_unit_id: '',
    crew_size: 1,
    production_per_day: '',
    standard_rate: '',
    low_labour_rate: '',
    premium_labour_rate: '',
    material_rate: '',
    equipment_rate: '',
    trade_discipline: '',
    cost_code: '',
    notes: '',
    tags: '',
    is_company_standard: true
  });
  const [errors, setErrors] = useState({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        production_code: '',
        production_name: '',
        description: '',
        knowledge_domain_id: domains[0]?.id || '',
        measurement_unit_id: units.find(u => u.code === 'EA')?.id || units[0]?.id || '',
        crew_size: 1,
        production_per_day: '',
        standard_rate: '',
        low_labour_rate: '',
        premium_labour_rate: '',
        material_rate: '',
        equipment_rate: '',
        trade_discipline: '',
        cost_code: '',
        notes: '',
        tags: '',
        is_company_standard: true
      });
      setErrors({});
    }
  }, [isOpen, domains, units]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.production_code.trim()) {
      newErrors.production_code = 'Production code is required';
    }
    if (!formData.production_name.trim()) {
      newErrors.production_name = 'Name is required';
    }
    if (!formData.knowledge_domain_id) {
      newErrors.knowledge_domain_id = 'Knowledge domain is required';
    }
    if (!formData.measurement_unit_id) {
      newErrors.measurement_unit_id = 'Unit is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        production_code: formData.production_code.trim(),
        production_name: formData.production_name.trim(),
        description: formData.description.trim() || null,
        knowledge_domain_id: formData.knowledge_domain_id,
        measurement_unit_id: formData.measurement_unit_id,
        crew_size: parseFloat(formData.crew_size) || 1,
        production_per_day: formData.production_per_day ? parseFloat(formData.production_per_day) : null,
        standard_rate: formData.standard_rate ? parseFloat(formData.standard_rate) : null,
        low_labour_rate: formData.low_labour_rate ? parseFloat(formData.low_labour_rate) : null,
        premium_labour_rate: formData.premium_labour_rate ? parseFloat(formData.premium_labour_rate) : null,
        premium_rate: formData.premium_labour_rate ? parseFloat(formData.premium_labour_rate) : null,
        material_rate: formData.material_rate ? parseFloat(formData.material_rate) : null,
        equipment_rate: formData.equipment_rate ? parseFloat(formData.equipment_rate) : null,
        trade_discipline: formData.trade_discipline.trim() || null,
        cost_code: formData.cost_code.trim() || null,
        notes: formData.notes.trim() || null,
        is_company_standard: formData.is_company_standard,
        service_category_ids: []
      };

      const response = await fetch(`${API_URL}/api/production-library/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Created "${formData.production_name}"`);
        onCreated?.(data.item);
        onClose();
      } else {
        const error = await response.json();
        if (error.detail?.includes('duplicate') || error.detail?.includes('already exists')) {
          setErrors({ production_code: 'This code already exists' });
          toast.error('Production code already exists');
        } else {
          toast.error(error.detail || 'Failed to create standard');
        }
      }
    } catch (error) {
      console.error('Create error:', error);
      toast.error('Failed to create standard');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#111] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Create Company Standard</h2>
              <p className="text-xs text-neutral-500">Add to Production Library</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          {/* Identity Section */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <Hash className="w-4 h-4 text-emerald-400" />
              Identity
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">
                  Production Code <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.production_code}
                  onChange={(e) => updateField('production_code', e.target.value.toUpperCase())}
                  placeholder="e.g., FC-DR-001"
                  className={`w-full px-3 py-2 bg-neutral-900 border rounded-lg text-white text-sm font-mono focus:outline-none focus:border-emerald-500/50 ${
                    errors.production_code ? 'border-red-500' : 'border-neutral-700'
                  }`}
                />
                {errors.production_code && (
                  <p className="text-red-400 text-xs mt-1">{errors.production_code}</p>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-neutral-400 mb-1.5">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.production_name}
                  onChange={(e) => updateField('production_name', e.target.value)}
                  placeholder="e.g., Interior Door - Standard Slab Install"
                  className={`w-full px-3 py-2 bg-neutral-900 border rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 ${
                    errors.production_name ? 'border-red-500' : 'border-neutral-700'
                  }`}
                />
                {errors.production_name && (
                  <p className="text-red-400 text-xs mt-1">{errors.production_name}</p>
                )}
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs text-neutral-400 mb-1.5">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Detailed description of this production item..."
                rows={2}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 resize-none"
              />
            </div>
          </div>

          {/* Classification Section */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-emerald-400" />
              Classification
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">
                  Knowledge Domain <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.knowledge_domain_id}
                  onChange={(e) => updateField('knowledge_domain_id', e.target.value)}
                  className={`w-full px-3 py-2 bg-neutral-900 border rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 ${
                    errors.knowledge_domain_id ? 'border-red-500' : 'border-neutral-700'
                  }`}
                >
                  <option value="">Select domain...</option>
                  {domains.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">
                  Unit <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.measurement_unit_id}
                  onChange={(e) => updateField('measurement_unit_id', e.target.value)}
                  className={`w-full px-3 py-2 bg-neutral-900 border rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 ${
                    errors.measurement_unit_id ? 'border-red-500' : 'border-neutral-700'
                  }`}
                >
                  <option value="">Select unit...</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>{u.code} - {u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Trade Discipline</label>
                <input
                  type="text"
                  value={formData.trade_discipline}
                  onChange={(e) => updateField('trade_discipline', e.target.value)}
                  placeholder="e.g., Finish Carpentry"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Cost Code</label>
                <input
                  type="text"
                  value={formData.cost_code}
                  onChange={(e) => updateField('cost_code', e.target.value)}
                  placeholder="e.g., 06-2000"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>
          </div>

          {/* Production Metrics Section */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Production Metrics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Crew Size</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={formData.crew_size}
                  onChange={(e) => updateField('crew_size', e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Production/Day</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.production_per_day}
                  onChange={(e) => updateField('production_per_day', e.target.value)}
                  placeholder="Units per day"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Pricing (per unit)
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                <label className="block text-xs text-blue-400 mb-1.5">Low Rate</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.low_labour_rate}
                    onChange={(e) => updateField('low_labour_rate', e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                <label className="block text-xs text-emerald-400 mb-1.5">Standard Rate</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.standard_rate}
                    onChange={(e) => updateField('standard_rate', e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
              <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                <label className="block text-xs text-amber-400 mb-1.5">Premium Rate</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.premium_labour_rate}
                    onChange={(e) => updateField('premium_labour_rate', e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Material Rate</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.material_rate}
                    onChange={(e) => updateField('material_rate', e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Equipment Rate</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.equipment_rate}
                    onChange={(e) => updateField('equipment_rate', e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="mb-6">
            <label className="block text-xs text-neutral-400 mb-1.5">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Internal notes, tips, or special instructions..."
              rows={2}
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 resize-none"
            />
          </div>

          {/* Company Standard Toggle */}
          <div className="flex items-center gap-3 mb-6">
            <button
              type="button"
              onClick={() => updateField('is_company_standard', !formData.is_company_standard)}
              className={`w-11 h-6 rounded-full transition-colors ${
                formData.is_company_standard ? 'bg-emerald-500' : 'bg-neutral-700'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                formData.is_company_standard ? 'translate-x-[22px]' : 'translate-x-[2px]'
              }`} />
            </button>
            <span className="text-sm text-white">Mark as Company Standard</span>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-800 bg-neutral-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-neutral-400 hover:text-white transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Create Standard
          </button>
        </div>
      </div>
    </div>
  );
}
