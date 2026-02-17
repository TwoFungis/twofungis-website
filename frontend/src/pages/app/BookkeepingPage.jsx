import React, { useState, useEffect, useCallback } from 'react';
import { 
  Receipt, 
  Upload, 
  Download, 
  Filter,
  Search,
  Plus,
  FileText,
  FolderOpen,
  Calendar,
  DollarSign,
  TrendingUp,
  Tag,
  MoreVertical,
  Trash2,
  Edit2,
  Eye,
  Sparkles,
  HardDrive,
  AlertCircle,
  Files
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import ReceiptScanner from '../../components/bookkeeping/ReceiptScanner';
import ManualExpenseForm from '../../components/bookkeeping/ManualExpenseForm';
import BulkReceiptUpload from '../../components/bookkeeping/BulkReceiptUpload';
import DocumentVault from '../../components/bookkeeping/DocumentVault';
import { generateExpenseReportPDF } from '../../utils/expenseReportGenerator';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const EXPENSE_CATEGORIES = [
  { name: 'Materials', color: 'bg-blue-500' },
  { name: 'Labor', color: 'bg-purple-500' },
  { name: 'Equipment', color: 'bg-orange-500' },
  { name: 'Vehicle/Fuel', color: 'bg-yellow-500' },
  { name: 'Tools', color: 'bg-red-500' },
  { name: 'Office', color: 'bg-green-500' },
  { name: 'Subcontractors', color: 'bg-pink-500' },
  { name: 'Insurance', color: 'bg-indigo-500' },
  { name: 'Professional Fees', color: 'bg-teal-500' },
  { name: 'Meals & Entertainment', color: 'bg-amber-500' },
  { name: 'Travel', color: 'bg-cyan-500' },
  { name: 'Utilities', color: 'bg-lime-500' },
  { name: 'Rent', color: 'bg-rose-500' },
  { name: 'Other', color: 'bg-gray-500' }
];

const BookkeepingPage = () => {
  const { user, profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' or 'documents'
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [storageInfo, setStorageInfo] = useState(null);

  // Calculate summary stats
  const stats = {
    totalExpenses: expenses.reduce((sum, e) => sum + (e.total_amount || 0), 0),
    totalTax: expenses.reduce((sum, e) => sum + (e.tax_amount || 0), 0),
    expenseCount: expenses.length,
    deductible: expenses.filter(e => e.is_deductible).reduce((sum, e) => sum + (e.total_amount || 0), 0)
  };

  // Fetch expenses (mock data for now since we haven't applied the schema)
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      // Try to fetch from Supabase
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user?.id)
        .eq('fiscal_year', selectedYear)
        .order('receipt_date', { ascending: false });

      if (error) {
        console.log('Expenses table may not exist yet:', error.message);
        // Use mock data for demo
        setExpenses([]);
      } else {
        setExpenses(data || []);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [user, selectedYear]);

  // Fetch storage info
  const fetchStorageInfo = async () => {
    try {
      const tier = profile?.subscription_tier || 'trial';
      const response = await fetch(`${API_URL}/api/bookkeeping/storage-limit/${tier}`);
      const data = await response.json();
      setStorageInfo(data);
    } catch (err) {
      console.error('Error fetching storage info:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchExpenses();
      fetchStorageInfo();
    }
  }, [user, fetchExpenses]);

  const handleExpenseExtracted = async (expenseData) => {
    setShowScanner(false);
    
    // Add the expense to the database
    try {
      const newExpense = {
        user_id: user.id,
        vendor_name: expenseData.vendor_name,
        vendor_address: expenseData.vendor_address,
        subtotal: expenseData.subtotal || 0,
        tax_amount: expenseData.tax_amount || 0,
        tax_type: expenseData.tax_type,
        tax_rate: expenseData.tax_rate,
        total_amount: expenseData.total_amount || 0,
        currency: expenseData.currency || 'CAD',
        category: expenseData.category || 'Other',
        description: expenseData.description,
        receipt_date: expenseData.receipt_date,
        payment_method: expenseData.payment_method,
        line_items: expenseData.line_items || [],
        ai_extracted: true,
        ai_confidence: expenseData.confidence || 0,
        is_deductible: true,
        fiscal_year: selectedYear,
        fiscal_quarter: Math.ceil((new Date(expenseData.receipt_date || Date.now()).getMonth() + 1) / 3),
        status: 'pending'
      };

      const { error } = await supabase
        .from('expenses')
        .insert(newExpense);

      if (error) {
        console.log('Could not save expense (table may not exist):', error.message);
        // Add to local state for demo
        setExpenses(prev => [{ ...newExpense, id: Date.now() }, ...prev]);
      } else {
        fetchExpenses();
      }
    } catch (err) {
      console.error('Error saving expense:', err);
      // Still add to local state for demo
      setExpenses(prev => [{ ...expenseData, id: Date.now() }, ...prev]);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-CA', { 
      style: 'currency', 
      currency: 'CAD' 
    }).format(value || 0);
  };

  const filteredExpenses = expenses.filter(expense => {
    if (selectedCategory !== 'all' && expense.category !== selectedCategory) return false;
    if (searchQuery && !expense.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getCategoryColor = (category) => {
    const cat = EXPENSE_CATEGORIES.find(c => c.name === category);
    return cat?.color || 'bg-gray-500';
  };

  return (
    <div className="space-y-6" data-testid="bookkeeping-page">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Bookkeeping</h1>
          <p className="text-gray-400">Track expenses, scan receipts, and prepare for tax season</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowScanner(true)}
            className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            data-testid="scan-receipt-btn"
          >
            <Sparkles className="w-5 h-5" />
            Scan Receipt
          </button>
          <button
            onClick={() => setShowAddExpense(true)}
            className="bg-charcoal-700 hover:bg-charcoal-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Manual
          </button>
        </div>
      </div>

      {/* Storage Info */}
      {storageInfo && (
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <HardDrive className="w-4 h-4" />
              <span>Storage: {storageInfo.used_display} / {storageInfo.limit_display}</span>
            </div>
            <span className="text-xs text-gray-500 capitalize">{storageInfo.tier} Plan</span>
          </div>
          <div className="h-2 bg-charcoal-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-steel-500 rounded-full transition-all"
              style={{ width: `${Math.min(storageInfo.percent_used, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-steel-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-steel-400" />
            </div>
            <span className="text-gray-400 text-sm">Total Expenses</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalExpenses)}</p>
        </div>

        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-warning/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-warning" />
            </div>
            <span className="text-gray-400 text-sm">Tax Paid</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalTax)}</p>
        </div>

        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
              <Receipt className="w-5 h-5 text-success" />
            </div>
            <span className="text-gray-400 text-sm">Receipts</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.expenseCount}</p>
        </div>

        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Tag className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-gray-400 text-sm">Deductible</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats.deductible)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-charcoal-800 border border-charcoal-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
          />
        </div>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="bg-charcoal-800 border border-charcoal-700 rounded-lg px-4 py-2.5 text-white focus:border-steel-500"
        >
          {[2026, 2025, 2024].map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-charcoal-800 border border-charcoal-700 rounded-lg px-4 py-2.5 text-white focus:border-steel-500"
        >
          <option value="all">All Categories</option>
          {EXPENSE_CATEGORIES.map(cat => (
            <option key={cat.name} value={cat.name}>{cat.name}</option>
          ))}
        </select>

        <button className="bg-charcoal-700 hover:bg-charcoal-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export
        </button>
      </div>

      {/* Expenses List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-steel-500"></div>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-12 text-center">
          <Receipt className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Expenses Yet</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Start tracking your business expenses by scanning receipts or adding them manually.
          </p>
          <button 
            onClick={() => setShowScanner(true)}
            className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Scan Your First Receipt
          </button>
        </div>
      ) : (
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-charcoal-700">
                <th className="text-left text-gray-400 text-xs uppercase px-4 py-3">Date</th>
                <th className="text-left text-gray-400 text-xs uppercase px-4 py-3">Vendor</th>
                <th className="text-left text-gray-400 text-xs uppercase px-4 py-3">Category</th>
                <th className="text-right text-gray-400 text-xs uppercase px-4 py-3">Amount</th>
                <th className="text-right text-gray-400 text-xs uppercase px-4 py-3">Tax</th>
                <th className="text-center text-gray-400 text-xs uppercase px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="border-b border-charcoal-700/50 hover:bg-charcoal-700/30">
                  <td className="px-4 py-3 text-gray-300 text-sm">
                    {expense.receipt_date ? new Date(expense.receipt_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{expense.vendor_name || 'Unknown'}</p>
                    {expense.description && (
                      <p className="text-gray-500 text-xs truncate max-w-xs">{expense.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(expense.category)} bg-opacity-20 text-white`}>
                      <span className={`w-2 h-2 rounded-full ${getCategoryColor(expense.category)}`}></span>
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-white font-medium">
                    {formatCurrency(expense.total_amount)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400 text-sm">
                    {expense.tax_type && `${expense.tax_type}: `}{formatCurrency(expense.tax_amount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {expense.ai_extracted && (
                      <span className="inline-flex items-center gap-1 text-xs text-steel-400">
                        <Sparkles className="w-3 h-3" />
                        AI
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-gray-400 hover:text-white p-1">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tax Summary Card */}
      {expenses.length > 0 && (
        <div className="bg-gradient-to-br from-steel-500/10 to-steel-500/5 rounded-xl border border-steel-500/30 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Tax Summary - {selectedYear}</h3>
              <p className="text-gray-400 text-sm">Ready for your accountant</p>
            </div>
            <button className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download Report
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Expenses</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalExpenses)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">HST/GST Paid</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalTax)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Deductible Amount</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(stats.deductible)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Receipt Count</p>
              <p className="text-2xl font-bold text-white">{stats.expenseCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Scanner Modal */}
      {showScanner && (
        <ReceiptScanner 
          onExpenseExtracted={handleExpenseExtracted}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default BookkeepingPage;
