import React, { useState, useEffect } from 'react';
import { 
  Wallet, Plus, Search, Filter, Upload, Receipt, Tag, Calendar,
  TrendingUp, TrendingDown, Calculator, FileText, Camera, MoreVertical,
  Info, DollarSign, Briefcase, User
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
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
  const { user } = useAuthStore();
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateRange, setDateRange] = useState('month');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showTaxSummary, setShowTaxSummary] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/expenses`, {
        headers: { 'Authorization': `Bearer ${user?.access_token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setExpenses(data.expenses || []);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      // Demo data
      setExpenses([
        { id: '1', description: 'Lumber for framing', category: 'materials', amount: 2450, project_name: 'Smith Residence', date: '2026-02-15', has_receipt: true },
        { id: '2', description: 'Electrical supplies', category: 'materials', amount: 890, project_name: 'Johnson Reno', date: '2026-02-14', has_receipt: true },
        { id: '3', description: 'Fuel for trucks', category: 'fuel', amount: 320, project_name: null, date: '2026-02-13', has_receipt: true },
        { id: '4', description: 'Plumbing subcontract', category: 'subcontractor', amount: 4500, project_name: 'Commercial Build', date: '2026-02-12', has_receipt: false },
        { id: '5', description: 'Building permit', category: 'permits', amount: 850, project_name: 'Smith Residence', date: '2026-02-10', has_receipt: true },
      ]);
    } finally {
      setIsLoading(false);
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-800 flex items-center gap-3">
            <Wallet className="w-7 h-7 text-steel-400" />
            Expenses
          </h1>
          <p className="text-charcoal-500 text-sm mt-1">Track expenses and manage tax-ready bookkeeping</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTaxSummary(!showTaxSummary)}
            className="bg-cloud-200 hover:bg-cloud-100 text-charcoal-800 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            Tax Summary
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="bg-steel-500 hover:bg-steel-600 text-charcoal-800 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            data-testid="new-expense-btn"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-cloud-300 p-4">
          <p className="text-charcoal-500 text-sm">This Month</p>
          <p className="text-2xl font-bold text-charcoal-800">${totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-cloud-300 p-4">
          <p className="text-charcoal-500 text-sm">Missing Receipts</p>
          <p className="text-2xl font-bold text-warning">{expenses.filter(e => !e.has_receipt).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-cloud-300 p-4">
          <p className="text-charcoal-500 text-sm">Top Category</p>
          <p className="text-lg font-bold text-charcoal-800">{expensesByCategory[0]?.label || 'N/A'}</p>
        </div>
        <div className="bg-white rounded-xl border border-cloud-300 p-4">
          <p className="text-charcoal-500 text-sm">Est. Tax Credit</p>
          <p className="text-2xl font-bold text-success">${estimatedTax.toLocaleString()}</p>
        </div>
      </div>

      {/* Tax Summary Panel */}
      {showTaxSummary && (
        <div className="bg-white rounded-xl border border-steel-500/30 p-6">
          <h2 className="text-lg font-semibold text-charcoal-800 mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-steel-400" />
            Tax Summary & Projections
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-charcoal-500 mb-3">Monthly Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Total Expenses:</span>
                  <span className="text-charcoal-800 font-medium">${totalExpenses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-500">HST (13%):</span>
                  <span className="text-success font-medium">${estimatedTax.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-charcoal-500 mb-3">Quarterly Projection</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Est. Expenses:</span>
                  <span className="text-charcoal-800 font-medium">${(totalExpenses * 3).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Est. Tax Credit:</span>
                  <span className="text-success font-medium">${(estimatedTax * 3).toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-charcoal-500 mb-3">By Category</h3>
              <div className="space-y-1">
                {expensesByCategory.slice(0, 4).map(cat => (
                  <div key={cat.category} className="flex justify-between text-sm">
                    <span className={`px-2 py-0.5 rounded ${cat.color}`}>{cat.label}</span>
                    <span className="text-charcoal-800">${cat.amount.toLocaleString()}</span>
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-500" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-cloud-300 rounded-lg pl-10 pr-4 py-2 text-charcoal-800 placeholder-gray-400"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-white border border-cloud-300 rounded-lg px-4 py-2 text-charcoal-800"
        >
          <option value="all">All Categories</option>
          {Object.entries(CATEGORIES).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="bg-white border border-cloud-300 rounded-lg px-4 py-2 text-charcoal-800"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-xl border border-cloud-300 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-steel-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-charcoal-500">Loading expenses...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-8 text-center">
            <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-charcoal-800 mb-2">No expenses found</h3>
            <p className="text-charcoal-500">Add your first expense to start tracking.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-cloud-200/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-500 uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-500 uppercase">Receipt</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-charcoal-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-700">
              {filteredExpenses.map((expense) => {
                const catConfig = CATEGORIES[expense.category] || CATEGORIES.other;
                
                return (
                  <tr key={expense.id} className="hover:bg-cloud-200/30 transition-colors">
                    <td className="px-6 py-4 text-charcoal-800">{expense.description}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${catConfig.color}`}>
                        {catConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-charcoal-500">{expense.project_name || '—'}</td>
                    <td className="px-6 py-4 text-charcoal-800 font-medium">${expense.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-charcoal-500">
                      {expense.date ? new Date(expense.date).toLocaleDateString() : '—'}
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
                    <td className="px-6 py-4 text-right">
                      <button className="text-charcoal-500 hover:text-charcoal-800 p-1">
                        <MoreVertical className="w-4 h-4" />
                      </button>
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
          onSuccess={() => { setShowNewModal(false); fetchExpenses(); }}
          user={user}
        />
      )}
    </div>
  );
};

// New Expense Modal Component
const NewExpenseModal = ({ onClose, onSuccess, user }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    category: 'materials',
    amount: '',
    project_name: '',
    expense_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) {
      alert('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/expenses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      });

      if (response.ok) {
        onSuccess();
      } else {
        alert('Failed to create expense');
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      alert('Error creating expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="new-expense-modal">
      <div className="bg-white rounded-xl border border-cloud-300 w-full max-w-lg">
        <div className="p-6 border-b border-cloud-300 flex items-center justify-between">
          <h2 className="text-xl font-bold text-charcoal-800">Add Expense</h2>
          <button onClick={onClose} className="text-charcoal-500 hover:text-charcoal-800">
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal-500 mb-1">Description *</label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full bg-charcoal-900 border border-cloud-300 rounded-lg px-4 py-2 text-charcoal-800 focus:border-steel-500 focus:outline-none"
              placeholder="e.g., Lumber for framing"
              data-testid="input-expense-description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal-500 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full bg-charcoal-900 border border-cloud-300 rounded-lg px-4 py-2 text-charcoal-800 focus:border-steel-500 focus:outline-none"
              >
                {Object.entries(CATEGORIES).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-500 mb-1">Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-500">$</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full bg-charcoal-900 border border-cloud-300 rounded-lg pl-8 pr-4 py-2 text-charcoal-800 focus:border-steel-500 focus:outline-none"
                  placeholder="0.00"
                  data-testid="input-expense-amount"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal-500 mb-1">Project (optional)</label>
              <input
                type="text"
                value={formData.project_name}
                onChange={(e) => setFormData(prev => ({ ...prev, project_name: e.target.value }))}
                className="w-full bg-charcoal-900 border border-cloud-300 rounded-lg px-4 py-2 text-charcoal-800 focus:border-steel-500 focus:outline-none"
                placeholder="Project name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-500 mb-1">Date</label>
              <input
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expense_date: e.target.value }))}
                className="w-full bg-charcoal-900 border border-cloud-300 rounded-lg px-4 py-2 text-charcoal-800 focus:border-steel-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal-500 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              className="w-full bg-charcoal-900 border border-cloud-300 rounded-lg px-4 py-2 text-charcoal-800 focus:border-steel-500 focus:outline-none resize-none"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-cloud-300">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-charcoal-500 hover:text-charcoal-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-steel-500 hover:bg-steel-600 text-charcoal-800 px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
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

export default ExpensesPage;
