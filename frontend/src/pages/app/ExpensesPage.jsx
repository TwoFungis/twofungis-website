import React, { useState, useEffect } from 'react';
import { 
  Wallet, Plus, Search, Filter, Upload, Receipt, Tag, Calendar,
  TrendingUp, TrendingDown, Calculator, FileText, Camera, MoreVertical
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Expense categories with colors
const CATEGORIES = {
  materials: { label: 'Materials', color: 'bg-blue-500/20 text-blue-400' },
  labor: { label: 'Labor', color: 'bg-purple-500/20 text-purple-400' },
  equipment: { label: 'Equipment', color: 'bg-teal-500/20 text-teal-400' },
  subcontractor: { label: 'Subcontractor', color: 'bg-orange-500/20 text-orange-400' },
  fuel: { label: 'Fuel & Transport', color: 'bg-yellow-500/20 text-yellow-400' },
  permits: { label: 'Permits & Fees', color: 'bg-green-500/20 text-green-400' },
  tools: { label: 'Tools', color: 'bg-indigo-500/20 text-indigo-400' },
  office: { label: 'Office & Admin', color: 'bg-gray-500/20 text-gray-400' },
  other: { label: 'Other', color: 'bg-charcoal-600 text-gray-300' }
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
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Wallet className="w-7 h-7 text-steel-400" />
            Expenses
          </h1>
          <p className="text-gray-400 text-sm mt-1">Track expenses and manage tax-ready bookkeeping</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTaxSummary(!showTaxSummary)}
            className="bg-charcoal-700 hover:bg-charcoal-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
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
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 overflow-hidden">
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
            <tbody className="divide-y divide-charcoal-700">
              {filteredExpenses.map((expense) => {
                const catConfig = CATEGORIES[expense.category] || CATEGORIES.other;
                
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
                      <button className="text-gray-400 hover:text-white p-1">
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
    </div>
  );
};

export default ExpensesPage;
