/**
 * DomainDialog.jsx - Create/Edit Domain Dialog
 * ==============================================
 * 
 * Modal for creating and editing Knowledge Domains.
 */

import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Loader2 } from 'lucide-react';

const DomainDialog = ({
  isOpen,
  onClose,
  onSave,
  domain = null, // null for create, object for edit
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    color: '#3b82f6' // Default blue
  });
  const [error, setError] = useState('');
  
  const isEditing = !!domain;
  
  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (domain) {
        setFormData({
          name: domain.name || '',
          code: domain.code || '',
          description: domain.description || '',
          color: domain.color || '#3b82f6'
        });
      } else {
        setFormData({
          name: '',
          code: '',
          description: '',
          color: '#3b82f6'
        });
      }
      setError('');
    }
  }, [isOpen, domain]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    
    try {
      await onSave({
        ...formData,
        name: formData.name.trim(),
        code: formData.code.trim() || null,
        description: formData.description.trim() || null
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save domain');
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      {/* Dialog */}
      <div 
        className="relative w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl"
        data-testid="domain-dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <FolderPlus className="w-5 h-5 text-blue-400" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {isEditing ? 'Edit Domain' : 'New Domain'}
              </h2>
              <p className="text-xs text-neutral-500">
                Knowledge domains organize your production standards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            data-testid="close-domain-dialog"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Finish Carpentry"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
              autoFocus
              data-testid="domain-name-input"
            />
          </div>
          
          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Code <span className="text-neutral-500">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g., FC"
              maxLength={10}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors font-mono uppercase"
              data-testid="domain-code-input"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Short code for quick reference
            </p>
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Description <span className="text-neutral-500">(optional)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this domain..."
              rows={3}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
              data-testid="domain-description-input"
            />
          </div>
          
          {/* Error */}
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          
          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-700 disabled:text-neutral-500 text-black font-medium rounded-lg transition-colors min-h-[40px]"
              data-testid="save-domain-btn"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Domain'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DomainDialog;
