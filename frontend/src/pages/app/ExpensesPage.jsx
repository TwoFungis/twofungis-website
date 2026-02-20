import React, { useState, useEffect } from 'react';
import { 
  Wallet, Plus, Search, Filter, Upload, Receipt, Tag, Calendar,
  TrendingUp, TrendingDown, Calculator, FileText, Camera, MoreVertical,
  Info, DollarSign, Briefcase, User, X, Trash2, Edit2
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Enhanced contractor expense categories with deductibility
const CATEGORIES = {
  'Materials': { label: 'Materials (COGS)', color: 'bg-blue-500/20 text-blue-600', deductibility: 100 },
  'Consumables': { label: 'Consumables', color: 'bg-cyan-500/20 text-cyan-600', deductibility: 100 },
  'Tools': { label: 'Tools (<$500)', color: 'bg-indigo-500/20 text-indigo-600', deductibility: 100 },
  'Equipment': { label: 'Equipment (Capital)', color: 'bg-purple-500/20 text-purple-600', deductibility: 100 },
  'Vehicle & Fuel': { label: 'Vehicle & Fuel', color: 'bg-yellow-500/20 text-yellow-700', deductibility: 100 },
  'Meals & Entertainment': { label: 'Meals & Entertainment', color: 'bg-orange-500/20 text-orange-600', deductibility: 50 },
  'Subcontractors': { label: 'Subcontractors', color: 'bg-teal-500/20 text-teal-600', deductibility: 100 },
  'Insurance': { label: 'Insurance', color: 'bg-green-500/20 text-green-600', deductibility: 100 },
  'Office/Admin': { label: 'Office/Admin', color: 'bg-gray-500/20 text-gray-600', deductibility: 100 },
  'Phone/Internet': { label: 'Phone/Internet', color: 'bg-sky-500/20 text-sky-600', deductibility: 100 },
  'Travel/Lodging': { label: 'Travel/Lodging', color: 'bg-rose-500/20 text-rose-600', deductibility: 100 },
  'Training/Certifications': { label: 'Training/Certs', color: 'bg-emerald-500/20 text-emerald-600', deductibility: 100 },
  'Rent/Shop': { label: 'Rent/Shop', color: 'bg-amber-500/20 text-amber-700', deductibility: 100 },
  'Other': { label: 'Other', color: 'bg-slate-500/20 text-slate-600', deductibility: 100 }
};

const ExpensesPage = () => {
  const { user, markSetupComplete } = useAuthStore();
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateRange, setDateRange] = useState('month');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showTaxSummary, setShowTaxSummary] = useState(false);
  const [activeActionMenu, setActiveActionMenu] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/expenses`, { headers });
      if (response.ok) {
        const data = await response.json();
        setExpenses(data.expenses || []);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/expenses/${expenseId}`, {
        method: 'DELETE',
        headers
      });
      
      if (response.ok) {
        toast.success('Expense deleted');
        fetchExpenses();
      } else {
        toast.error('Failed to delete expense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
    setActiveActionMenu(null);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setActiveActionMenu(null);
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exp.project_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Calculate stats
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const expensesByCategory = Object.keys(CATEGORIES).map(cat => ({
    category: cat,
    ...CATEGORIES[cat],
    amount: expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
  })).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

  // Tax estimation (simplified)
  const estimatedTax = totalExpenses * 0.13; // 13% HST as example

  return (
    <div className="space-y-6" data-testid="expenses-page">
      {/* Header with Shield */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/shield-icon.png" alt="" className="w-8 h-8 opacity-80" />
          <div>
            <h1 className="text-2xl font-bold text-charcoal-800">Expenses</h1>
            <p className="text-charcoal-600 text-sm mt-1">Track expenses and manage tax-ready bookkeeping</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTaxSummary(!showTaxSummary)}
            className="bg-charcoal-700 hover:bg-charcoal-700/50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            Tax Summary
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            data-testid="new-expense-btn"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-4">
          <p className="text-gray-400 text-sm">This Month</p>
          <p className="text-2xl font-bold text-white">${totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-4">
          <p className="text-gray-400 text-sm">Missing Receipts</p>
          <p className="text-2xl font-bold text-warning">{expenses.filter(e => !e.has_receipt).length}</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-4">
          <p className="text-gray-400 text-sm">Top Category</p>
          <p className="text-lg font-bold text-white">{expensesByCategory[0]?.label || 'N/A'}</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-4">
          <p className="text-gray-400 text-sm">Est. Tax Credit</p>
          <p className="text-2xl font-bold text-success">${estimatedTax.toLocaleString()}</p>
        </div>
      </div>

      {/* Tax Summary Panel */}
      {showTaxSummary && (
        <div className="bg-charcoal-800 rounded-xl border border-steel-500/30 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-steel-400" />
            Tax Summary & Projections
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Monthly Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Expenses:</span>
                  <span className="text-white font-medium">${totalExpenses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">HST (13%):</span>
                  <span className="text-success font-medium">${estimatedTax.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Quarterly Projection</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Est. Expenses:</span>
                  <span className="text-white font-medium">${(totalExpenses * 3).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Est. Tax Credit:</span>
                  <span className="text-success font-medium">${(estimatedTax * 3).toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">By Category</h3>
              <div className="space-y-1">
                {expensesByCategory.slice(0, 4).map(cat => (
                  <div key={cat.category} className="flex justify-between text-sm">
                    <span className={`px-2 py-0.5 rounded ${cat.color}`}>{cat.label}</span>
                    <span className="text-white">${cat.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-charcoal-800 border border-charcoal-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-charcoal-800 border border-charcoal-700 rounded-lg px-4 py-2 text-white"
        >
          <option value="all">All Categories</option>
          {Object.entries(CATEGORIES).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="bg-charcoal-800 border border-charcoal-700 rounded-lg px-4 py-2 text-white"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Expenses List */}
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-steel-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading expenses...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-8 text-center">
            <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No expenses found</h3>
            <p className="text-gray-400">Add your first expense to start tracking.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-charcoal-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Receipt</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-700 overflow-visible">
              {filteredExpenses.map((expense) => {
                const catConfig = CATEGORIES[expense.category] || CATEGORIES['Other'];
                
                return (
                  <tr key={expense.id} className="hover:bg-charcoal-700/30 transition-colors">
                    <td className="px-6 py-4 text-white">{expense.description}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${catConfig.color}`}>
                        {catConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{expense.project_name || '—'}</td>
                    <td className="px-6 py-4 text-white font-medium">${expense.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-400">
                      {expense.expense_date ? new Date(expense.expense_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4">
                      {expense.has_receipt ? (
                        <span className="text-success flex items-center gap-1">
                          <Receipt className="w-4 h-4" /> Yes
                        </span>
                      ) : (
                        <button className="text-warning flex items-center gap-1 hover:underline">
                          <Upload className="w-4 h-4" /> Upload
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <button 
                        onClick={() => setActiveActionMenu(activeActionMenu === expense.id ? null : expense.id)}
                        className="text-gray-400 hover:text-white p-1"
                        data-testid={`expense-actions-${expense.id}`}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {activeActionMenu === expense.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setActiveActionMenu(null)} />
                          <div className="absolute right-0 top-full mt-1 w-36 bg-charcoal-700 rounded-lg shadow-xl border border-charcoal-600 py-1 z-[100]">
                            <button
                              onClick={() => handleEditExpense(expense)}
                              className="w-full px-4 py-2 text-left text-sm text-white hover:bg-charcoal-600 flex items-center gap-2"
                            >
                              <Edit2 className="w-4 h-4" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="w-full px-4 py-2 text-left text-sm text-risk hover:bg-charcoal-600 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* New Expense Modal */}
      {showNewModal && (
        <NewExpenseModal 
          onClose={() => setShowNewModal(false)}
          onSuccess={() => { setShowNewModal(false); fetchExpenses(); markSetupComplete('has_expense'); }}
        />
      )}

      {/* Edit Expense Modal */}
      {editingExpense && (
        <EditExpenseModal 
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSuccess={() => { setEditingExpense(null); fetchExpenses(); }}
        />
      )}
    </div>
  );
};

// New Expense Modal Component
const NewExpenseModal = ({ onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    category: 'Materials',
    amount: '',
    project_name: '',
    expense_date: new Date().toISOString().split('T')[0],
    vendor: '',
    notes: '',
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
        toast.success('Expense added successfully');
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

  const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'E-Transfer', 'Cheque', 'Other'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="new-expense-modal">
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-charcoal-700 flex items-center justify-between sticky top-0 bg-charcoal-800">
          <h2 className="text-xl font-bold text-white">Add Expense</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Business / Personal Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Expense Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, business_personal: 'Business' }))}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  formData.business_personal === 'Business'
                    ? 'bg-steel-500 text-white'
                    : 'bg-charcoal-700 text-gray-400 hover:text-white'
                }`}
                data-testid="expense-type-business"
              >
                <Briefcase className="w-4 h-4" />
                Business
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, business_personal: 'Personal' }))}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  formData.business_personal === 'Personal'
                    ? 'bg-purple-500 text-white'
                    : 'bg-charcoal-700 text-gray-400 hover:text-white'
                }`}
                data-testid="expense-type-personal"
              >
                <User className="w-4 h-4" />
                Personal
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Description *</label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg px-4 py-2 text-white focus:border-steel-500 focus:outline-none"
              placeholder="e.g., Lumber for framing"
              data-testid="input-expense-description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg px-4 py-2 text-white focus:border-steel-500 focus:outline-none"
              >
                {Object.entries(CATEGORIES).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Amount *</label>
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
                  data-testid="input-expense-amount"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Payment Method</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg px-4 py-2 text-white focus:border-steel-500 focus:outline-none"
                data-testid="expense-payment-method"
              >
                {PAYMENT_METHODS.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Deductibility %
                {formData.business_personal === 'Personal' && (
                  <span className="text-gray-500 text-xs ml-1">(N/A for personal)</span>
                )}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.business_personal === 'Personal' ? 0 : formData.deductibility_pct}
                  onChange={(e) => setFormData(prev => ({ ...prev, deductibility_pct: parseInt(e.target.value) || 0 }))}
                  disabled={formData.business_personal === 'Personal'}
                  className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg px-4 py-2 text-white focus:border-steel-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="expense-deductibility"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Project (optional)</label>
              <input
                type="text"
                value={formData.project_name}
                onChange={(e) => setFormData(prev => ({ ...prev, project_name: e.target.value }))}
                className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg px-4 py-2 text-white focus:border-steel-500 focus:outline-none"
                placeholder="Project name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
              <input
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expense_date: e.target.value }))}
                className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg px-4 py-2 text-white focus:border-steel-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Vendor (optional)</label>
            <input
              type="text"
              value={formData.vendor}
              onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
              className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg px-4 py-2 text-white focus:border-steel-500 focus:outline-none"
              placeholder="e.g., Home Depot"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg px-4 py-2 text-white focus:border-steel-500 focus:outline-none resize-none"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-charcoal-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-steel-500 hover:bg-steel-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              data-testid="submit-expense"
            >
              {isSubmitting ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Expense Modal Component
const EditExpenseModal = ({ expense, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: expense.description || '',
    category: expense.category || 'Materials',
    amount: expense.amount?.toString() || '',
    project_name: expense.project_name || '',
    expense_date: expense.expense_date ? new Date(expense.expense_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    vendor: expense.vendor || '',
    notes: expense.notes || '',
    business_personal: expense.business_personal || 'Business',
    deductibility_pct: expense.deductibility_pct || 100,
    payment_method: expense.payment_method || 'Cash'
  });

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
      const response = await fetch(`${API_URL}/api/expenses/${expense.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          deductibility_pct: formData.business_personal === 'Personal' ? 0 : formData.deductibility_pct
        })
      });

      if (response.ok) {
        toast.success('Expense updated');
        onSuccess();
      } else {
        toast.error('Failed to update expense');
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Failed to update expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-charcoal-700 flex items-center justify-between sticky top-0 bg-charcoal-800">
          <h2 className="text-xl font-bold text-white">Edit Expense</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Description *</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white"
              placeholder="What was this expense for?"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Amount *</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white"
              >
                {Object.entries(CATEGORIES).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
            <input
              type="date"
              value={formData.expense_date}
              onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
              className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-steel-500 hover:bg-steel-600 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpensesPage;
