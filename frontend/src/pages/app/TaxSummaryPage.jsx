import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calculator, TrendingUp, TrendingDown, DollarSign, Calendar, 
  Filter, Download, FileText, Info, ChevronDown, PieChart,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount || 0);
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const TaxSummaryPage = () => {
  const { user, profile } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('monthly'); // monthly, quarterly, yearly
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedQuarter, setSelectedQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));
  
  const [monthlyData, setMonthlyData] = useState(null);
  const [quarterlyData, setQuarterlyData] = useState(null);
  const [yearlyData, setYearlyData] = useState(null);
  const [invoiceRevenue, setInvoiceRevenue] = useState(0);
  
  const [taxRate, setTaxRate] = useState(() => {
    const saved = localStorage.getItem('tradeos_tax_rate');
    return saved ? parseInt(saved) : 25;
  });

  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    };
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      
      // Fetch based on view mode
      if (viewMode === 'monthly') {
        const res = await fetch(
          `${API_URL}/api/expenses/summary/monthly?year=${selectedYear}&month=${selectedMonth}`,
          { headers }
        );
        if (res.ok) {
          const data = await res.json();
          setMonthlyData(data);
        }
      } else if (viewMode === 'quarterly') {
        const res = await fetch(
          `${API_URL}/api/expenses/summary/quarterly?year=${selectedYear}&quarter=${selectedQuarter}`,
          { headers }
        );
        if (res.ok) {
          const data = await res.json();
          setQuarterlyData(data);
        }
      } else {
        const res = await fetch(
          `${API_URL}/api/expenses/summary/tax?year=${selectedYear}`,
          { headers }
        );
        if (res.ok) {
          const data = await res.json();
          setYearlyData(data);
        }
      }
      
      // Fetch invoice revenue
      const invoiceRes = await fetch(`${API_URL}/api/invoices`, { headers });
      if (invoiceRes.ok) {
        const invoiceData = await invoiceRes.json();
        const paidInvoices = (invoiceData.invoices || []).filter(inv => inv.status === 'paid');
        const total = paidInvoices.reduce((sum, inv) => sum + (inv.amount_due || 0), 0);
        setInvoiceRevenue(total);
      }
    } catch (err) {
      console.error('Error fetching tax data:', err);
    } finally {
      setLoading(false);
    }
  }, [viewMode, selectedYear, selectedMonth, selectedQuarter, getAuthHeaders]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const handleTaxRateChange = (rate) => {
    setTaxRate(rate);
    localStorage.setItem('tradeos_tax_rate', rate.toString());
  };

  const exportToCSV = () => {
    const data = viewMode === 'monthly' ? monthlyData : viewMode === 'quarterly' ? quarterlyData : yearlyData;
    if (!data) return;

    let csvContent = "Category,Total,Deductible,Count\n";
    
    if (data.by_category) {
      Object.entries(data.by_category).forEach(([cat, vals]) => {
        const total = typeof vals === 'object' ? vals.total : vals;
        const deductible = typeof vals === 'object' ? vals.deductible : vals;
        const count = typeof vals === 'object' ? vals.count : 1;
        csvContent += `"${cat}",${total},${deductible || total},${count}\n`;
      });
    }
    
    csvContent += `\nTotal,${data.total_expenses || 0},${data.total_deductible || data.tax_deductible || 0},${data.expense_count || 0}\n`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax-summary-${viewMode}-${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export downloaded');
  };

  const getCurrentData = () => {
    if (viewMode === 'monthly') return monthlyData;
    if (viewMode === 'quarterly') return quarterlyData;
    return yearlyData;
  };

  const data = getCurrentData();
  const totalExpenses = data?.total_expenses || 0;
  const totalDeductible = data?.total_deductible || data?.tax_deductible || 0;
  const totalTaxPaid = data?.total_tax_paid || 0;
  const estimatedTaxOwing = invoiceRevenue * (taxRate / 100);
  const recommendedSetAside = Math.max(0, estimatedTaxOwing - totalDeductible * 0.3);

  return (
    <div className="space-y-6" data-testid="tax-summary-page">
      {/* Header with Shield */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/shield-icon.png" alt="" className="w-8 h-8 opacity-80" />
          <div>
            <h1 className="text-2xl font-bold text-charcoal-800">Tax Summary</h1>
            <p className="text-charcoal-600 text-sm mt-1">Track expenses, deductions, and tax obligations</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            className="bg-charcoal-700 hover:bg-charcoal-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* View Mode & Filters */}
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex bg-charcoal-700 rounded-lg p-1">
            {['monthly', 'quarterly', 'yearly'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-steel-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white"
          >
            {[2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          {/* Month Selector (if monthly) */}
          {viewMode === 'monthly' && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white"
            >
              {MONTHS.map((month, idx) => (
                <option key={idx} value={idx + 1}>{month}</option>
              ))}
            </select>
          )}

          {/* Quarter Selector (if quarterly) */}
          {viewMode === 'quarterly' && (
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
              className="bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white"
            >
              {[1, 2, 3, 4].map(q => (
                <option key={q} value={q}>Q{q}</option>
              ))}
            </select>
          )}

          {/* Tax Rate Selector */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-gray-400 text-sm">Tax Rate:</span>
            <select
              value={taxRate}
              onChange={(e) => handleTaxRateChange(parseInt(e.target.value))}
              className="bg-charcoal-700 border border-charcoal-600 rounded-lg px-3 py-2 text-white"
            >
              {[15, 20, 25, 30, 35, 40].map(rate => (
                <option key={rate} value={rate}>{rate}%</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-steel-500"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-steel-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-steel-400" />
                </div>
                <span className="text-gray-400 text-sm">Revenue (Paid Invoices)</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatCurrency(invoiceRevenue)}</p>
            </div>

            <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-risk/20 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-risk" />
                </div>
                <span className="text-gray-400 text-sm">Total Expenses</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalExpenses)}</p>
              <p className="text-xs text-gray-500 mt-1">{data?.expense_count || 0} expenses</p>
            </div>

            <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-success" />
                </div>
                <span className="text-gray-400 text-sm">Total Deductible</span>
              </div>
              <p className="text-2xl font-bold text-success">{formatCurrency(totalDeductible)}</p>
            </div>

            <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-warning/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-warning" />
                </div>
                <span className="text-gray-400 text-sm">Tax Paid (GST/HST/PST)</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalTaxPaid)}</p>
            </div>
          </div>

          {/* Tax Projection Panel */}
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-warning" />
              <h3 className="text-lg font-semibold text-white">Tax Projection</h3>
              <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded ml-auto">Estimate</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Estimated Tax Owing ({taxRate}%)</p>
                <p className="text-3xl font-bold text-warning">{formatCurrency(estimatedTaxOwing)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Net Income (Revenue - Expenses)</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(invoiceRevenue - totalExpenses)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Recommended Set-Aside</p>
                <p className="text-3xl font-bold text-steel-400">{formatCurrency(recommendedSetAside)}</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-charcoal-700/50 rounded-lg flex items-start gap-2">
              <Info className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500">
                Estimates only — confirm with your accountant. Tax rates vary by province/state. 
                Deductions reduce taxable income, not taxes owed directly.
              </p>
            </div>
          </div>

          {/* Expenses by Category */}
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Expenses by Category</h3>
            
            {data?.by_category && Object.keys(data.by_category).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(data.by_category).map(([category, values]) => {
                  const total = typeof values === 'object' ? values.total : values;
                  const deductible = typeof values === 'object' ? values.deductible : values;
                  const percentage = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;
                  
                  return (
                    <div key={category} className="flex items-center gap-4">
                      <div className="w-32 text-sm text-gray-300 truncate">{category}</div>
                      <div className="flex-1 bg-charcoal-700 rounded-full h-3">
                        <div 
                          className="bg-steel-500 h-3 rounded-full transition-all"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <div className="w-24 text-right text-white font-medium">
                        {formatCurrency(total)}
                      </div>
                      <div className="w-16 text-right text-xs text-gray-500">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No expense data for this period</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TaxSummaryPage;
