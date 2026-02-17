import React, { useState } from 'react';
import { 
  X, 
  DollarSign,
  Calendar,
  Building2,
  Tag,
  CreditCard,
  FileText,
  Check
} from 'lucide-react';

const EXPENSE_CATEGORIES = [
  'Materials', 'Labor', 'Equipment', 'Vehicle/Fuel', 'Tools', 
  'Office', 'Subcontractors', 'Insurance', 'Professional Fees',
  'Meals & Entertainment', 'Travel', 'Utilities', 'Rent', 'Other'
];

const TAX_TYPES = ['HST', 'GST', 'PST', 'GST+PST', 'Sales Tax', 'None'];

const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit', 'Check', 'E-Transfer', 'Other'];

const ManualExpenseForm = ({ onSubmit, onClose, projects = [] }) => {
  const [formData, setFormData] = useState({
    vendor_name: '',
    receipt_date: new Date().toISOString().split('T')[0],
    subtotal: '',
    tax_type: 'HST',
    tax_rate: 13,
    tax_amount: '',
    total_amount: '',
    category: 'Materials',
    payment_method: 'Credit Card',
    description: '',
    project_id: '',
    is_deductible: true
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate tax and total
      if (field === 'subtotal' || field === 'tax_rate') {
        const subtotal = parseFloat(field === 'subtotal' ? value : prev.subtotal) || 0;
        const taxRate = parseFloat(field === 'tax_rate' ? value : prev.tax_rate) || 0;
        const taxAmount = subtotal * (taxRate / 100);
        updated.tax_amount = taxAmount.toFixed(2);
        updated.total_amount = (subtotal + taxAmount).toFixed(2);
      }
      
      // Update tax rate when tax type changes
      if (field === 'tax_type') {
        const rates = { 'HST': 13, 'GST': 5, 'PST': 7, 'GST+PST': 12, 'Sales Tax': 8, 'None': 0 };
        updated.tax_rate = rates[value] || 0;
        const subtotal = parseFloat(prev.subtotal) || 0;
        const taxAmount = subtotal * (updated.tax_rate / 100);
        updated.tax_amount = taxAmount.toFixed(2);
        updated.total_amount = (subtotal + taxAmount).toFixed(2);
      }
      
      return updated;
    });
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.vendor_name.trim()) newErrors.vendor_name = 'Vendor name is required';
    if (!formData.receipt_date) newErrors.receipt_date = 'Date is required';
    if (!formData.subtotal || parseFloat(formData.subtotal) <= 0) newErrors.subtotal = 'Valid amount is required';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      ...formData,
      subtotal: parseFloat(formData.subtotal),
      tax_amount: parseFloat(formData.tax_amount) || 0,
      total_amount: parseFloat(formData.total_amount),
      tax_rate: parseFloat(formData.tax_rate),
      ai_extracted: false,
      ai_confidence: 0
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-charcoal-800 rounded-2xl border border-charcoal-700 max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-charcoal-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-steel-500/20 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-steel-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Add Expense Manually</h2>
              <p className="text-sm text-gray-400">Enter expense details</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Vendor & Date Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Vendor Name *</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={formData.vendor_name}
                  onChange={(e) => handleChange('vendor_name', e.target.value)}
                  placeholder="e.g., Home Depot"
                  className={`w-full bg-charcoal-700 border ${errors.vendor_name ? 'border-risk' : 'border-charcoal-600'} rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:border-steel-500`}
                  data-testid="expense-vendor-input"
                />
              </div>
              {errors.vendor_name && <p className="text-risk text-xs mt-1">{errors.vendor_name}</p>}
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Date *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="date"
                  value={formData.receipt_date}
                  onChange={(e) => handleChange('receipt_date', e.target.value)}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-steel-500"
                  data-testid="expense-date-input"
                />
              </div>
            </div>
          </div>

          {/* Amount & Tax Row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Subtotal *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="number"
                  step="0.01"
                  value={formData.subtotal}
                  onChange={(e) => handleChange('subtotal', e.target.value)}
                  placeholder="0.00"
                  className={`w-full bg-charcoal-700 border ${errors.subtotal ? 'border-risk' : 'border-charcoal-600'} rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:border-steel-500`}
                  data-testid="expense-subtotal-input"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Tax Type</label>
              <select
                value={formData.tax_type}
                onChange={(e) => handleChange('tax_type', e.target.value)}
                className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2.5 text-white focus:border-steel-500"
              >
                {TAX_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Tax Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={formData.tax_amount}
                  readOnly
                  className="w-full bg-charcoal-600/50 border border-charcoal-600 rounded-lg pl-10 pr-4 py-2.5 text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Total Display */}
          <div className="bg-charcoal-700/50 rounded-xl p-4 flex items-center justify-between">
            <span className="text-gray-400">Total Amount</span>
            <span className="text-2xl font-bold text-steel-400">
              ${formData.total_amount || '0.00'}
            </span>
          </div>

          {/* Category & Payment Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Category</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-steel-500 appearance-none"
                  data-testid="expense-category-select"
                >
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Payment Method</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <select
                  value={formData.payment_method}
                  onChange={(e) => handleChange('payment_method', e.target.value)}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-steel-500 appearance-none"
                >
                  {PAYMENT_METHODS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Link to Project */}
          {projects.length > 0 && (
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Link to Project (Optional)</label>
              <select
                value={formData.project_id}
                onChange={(e) => handleChange('project_id', e.target.value)}
                className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2.5 text-white focus:border-steel-500"
              >
                <option value="">General Business Expense</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Add notes about this expense..."
              rows={2}
              className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:border-steel-500 resize-none"
            />
          </div>

          {/* Tax Deductible Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div 
              onClick={() => handleChange('is_deductible', !formData.is_deductible)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                formData.is_deductible 
                  ? 'bg-steel-500 border-steel-500' 
                  : 'border-charcoal-500 bg-transparent'
              }`}
            >
              {formData.is_deductible && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="text-gray-300">This expense is tax deductible</span>
          </label>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-charcoal-700 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-charcoal-700 hover:bg-charcoal-600 text-white py-3 rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-steel-500 hover:bg-steel-600 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            data-testid="save-expense-btn"
          >
            <Check className="w-5 h-5" />
            Save Expense
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualExpenseForm;
