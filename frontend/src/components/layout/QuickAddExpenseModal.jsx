import React, { useState } from 'react';
import { X, Wallet, Briefcase, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Enhanced contractor expense categories with deductibility
const CATEGORIES = {
  'Materials': { label: 'Materials (COGS)', deductibility: 100 },
  'Consumables': { label: 'Consumables', deductibility: 100 },
  'Tools': { label: 'Tools (<$500)', deductibility: 100 },
  'Equipment': { label: 'Equipment (Capital)', deductibility: 100 },
  'Vehicle & Fuel': { label: 'Vehicle & Fuel', deductibility: 100 },
  'Meals & Entertainment': { label: 'Meals & Entertainment', deductibility: 50 },
  'Subcontractors': { label: 'Subcontractors', deductibility: 100 },
  'Insurance': { label: 'Insurance', deductibility: 100 },
  'Office/Admin': { label: 'Office/Admin', deductibility: 100 },
  'Phone/Internet': { label: 'Phone/Internet', deductibility: 100 },
  'Travel/Lodging': { label: 'Travel/Lodging', deductibility: 100 },
  'Training/Certifications': { label: 'Training/Certs', deductibility: 100 },
  'Rent/Shop': { label: 'Rent/Shop', deductibility: 100 },
  'Other': { label: 'Other', deductibility: 100 }
};

const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'E-Transfer', 'Cheque', 'Other'];

const QuickAddExpenseModal = ({ onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    category: 'Materials',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    business_personal: 'Business',
    deductibility_pct: 100,
    payment_method: 'Cash'
  });

  // Auto-update deductibility when category changes
  const handleCategoryChange = (category) => {
    const defaultDeductibility = CATEGORIES[category]?.deductibility || 100;
    setFormData(prev => ({ 
      ...prev, 
      category,
      deductibility_pct: defaultDeductibility
    }));
  };

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/expenses`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          deductibility_pct: formData.business_personal === 'Personal' ? 0 : formData.deductibility_pct
        })
      });

      if (response.ok) {
        toast.success('Expense added!');
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to create expense');
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      toast.error('Error creating expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="quick-expense-modal">
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 w-full max-w-md">
        <div className="p-4 border-b border-charcoal-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-steel-400" />
            <h2 className="text-lg font-bold text-white">Quick Add Expense</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Business / Personal Toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, business_personal: 'Business' }))}
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm ${
                formData.business_personal === 'Business'
                  ? 'bg-steel-500 text-white'
                  : 'bg-charcoal-700 text-gray-400 hover:text-white'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Business
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, business_personal: 'Personal' }))}
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm ${
                formData.business_personal === 'Personal'
                  ? 'bg-purple-500 text-white'
                  : 'bg-charcoal-700 text-gray-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              Personal
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg px-4 py-2 text-white focus:border-steel-500 focus:outline-none"
                placeholder="What did you buy?"
                data-testid="quick-expense-description"
              />
            </div>
            <div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg pl-8 pr-4 py-2 text-white focus:border-steel-500 focus:outline-none"
                  placeholder="0.00"
                  data-testid="quick-expense-amount"
                />
              </div>
            </div>
            <div>
              <select
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg px-3 py-2 text-white focus:border-steel-500 focus:outline-none text-sm"
              >
                {Object.entries(CATEGORIES).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg px-3 py-2 text-white focus:border-steel-500 focus:outline-none text-sm"
              >
                {PAYMENT_METHODS.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
            <div>
              <input
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expense_date: e.target.value }))}
                className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg px-3 py-2 text-white focus:border-steel-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          {formData.business_personal === 'Business' && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Deductibility:</span>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.deductibility_pct}
                onChange={(e) => setFormData(prev => ({ ...prev, deductibility_pct: parseInt(e.target.value) || 0 }))}
                className="w-16 bg-charcoal-900 border border-charcoal-700 rounded px-2 py-1 text-white text-center focus:border-steel-500 focus:outline-none"
              />
              <span className="text-gray-400">%</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-400 hover:text-white transition-colors border border-charcoal-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              data-testid="quick-expense-submit"
            >
              {isSubmitting ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickAddExpenseModal;
