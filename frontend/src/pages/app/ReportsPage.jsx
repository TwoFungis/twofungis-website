import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Crown, TrendingUp, DollarSign, AlertTriangle, Target, Calendar, 
  ArrowUpRight, ArrowDownRight, Percent, Download, FileText, PieChart,
  Wallet, Receipt, Filter
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const ReportsPage = () => {
  const { profile, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [changeOrders, setChangeOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('ytd');
  // Check for any elite tier variation (elite, lifetime, lifetime_elite, founding_lifetime, etc.)
  const tier = profile?.subscription_tier?.toLowerCase() || '';
  const isElite = tier === 'elite' || tier.includes('lifetime') || tier.includes('founding');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const [projectsRes, milestonesRes, cosRes, expensesRes] = await Promise.all([
          supabase.from('projects').select('*').eq('user_id', user.id),
          supabase.from('project_milestones').select('*').eq('user_id', user.id),
          supabase.from('change_orders').select('*').eq('user_id', user.id),
          supabase.from('expenses').select('*').eq('user_id', user.id)
        ]);

        setProjects(projectsRes.data || []);
        setMilestones(milestonesRes.data || []);
        setChangeOrders(cosRes.data || []);
        setExpenses(expensesRes.data || []);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Date range filter
  const getDateRange = () => {
    const now = new Date();
    let startDate;
    
    switch (dateRange) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all':
      default:
        startDate = new Date(2020, 0, 1);
    }
    
    return { startDate, endDate: now };
  };

  const { startDate, endDate } = getDateRange();

  // Filter data by date range
  const filteredExpenses = expenses.filter(e => {
    const date = new Date(e.expense_date || e.created_at);
    return date >= startDate && date <= endDate;
  });

  const filteredMilestones = milestones.filter(m => {
    if (!m.paid_at) return false;
    const date = new Date(m.paid_at);
    return date >= startDate && date <= endDate;
  });

  // Calculate KPIs
  const now = new Date();
  
  const avgMargin = projects.length > 0 
    ? projects.reduce((sum, p) => sum + (parseFloat(p.forecast_margin) || 0), 0) / projects.length 
    : 0;
  
  const totalRevenue = filteredMilestones.reduce((sum, m) => sum + (parseFloat(m.milestone_value) || 0), 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const totalApprovedCOs = changeOrders.filter(co => co.status === 'approved').length;
  const totalCOs = changeOrders.length;
  const coApprovalRate = totalCOs > 0 ? Math.round((totalApprovedCOs / totalCOs) * 100) : 0;

  const atRiskProjects = projects.filter(p => p.risk_flag === 'red' || (parseFloat(p.forecast_margin) || 0) < 10).length;

  // Expense breakdown by category
  const expensesByCategory = filteredExpenses.reduce((acc, e) => {
    const cat = e.category || 'Other';
    acc[cat] = (acc[cat] || 0) + (parseFloat(e.amount) || 0);
    return acc;
  }, {});

  const expenseCategoryData = Object.entries(expensesByCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const maxExpenseCategory = Math.max(...expenseCategoryData.map(c => c.value), 1);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-CA', { 
      style: 'currency', 
      currency: 'CAD', 
      maximumFractionDigits: 0 
    }).format(value || 0);
  };

  // Generate monthly data for charts
  const generateMonthlyData = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      
      const monthRevenue = milestones
        .filter(m => {
          if (m.status !== 'paid' || !m.paid_at) return false;
          const paidDate = new Date(m.paid_at);
          return paidDate >= monthStart && paidDate <= monthEnd;
        })
        .reduce((sum, m) => sum + (parseFloat(m.milestone_value) || 0), 0);

      const monthExpenses = expenses
        .filter(e => {
          const expDate = new Date(e.expense_date || e.created_at);
          return expDate >= monthStart && expDate <= monthEnd;
        })
        .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
      
      months.push({
        label: date.toLocaleString('default', { month: 'short' }),
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit: monthRevenue - monthExpenses
      });
    }
    return months;
  };

  const monthlyData = generateMonthlyData();
  const maxMonthlyValue = Math.max(...monthlyData.map(m => Math.max(m.revenue, m.expenses)), 1);

  // PDF Export function
  const exportToPDF = (reportType) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(52, 73, 94);
    doc.text('TradeOS', 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(127, 140, 141);
    doc.text(`${reportType} Report`, 14, 28);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 35);
    doc.text(`Period: ${dateRange === 'month' ? 'This Month' : dateRange === 'quarter' ? 'This Quarter' : dateRange === 'ytd' ? 'Year to Date' : 'All Time'}`, 14, 42);
    
    // Line
    doc.setDrawColor(189, 195, 199);
    doc.line(14, 48, pageWidth - 14, 48);

    let yPos = 58;

    if (reportType === 'Profit & Loss') {
      // Summary
      doc.setFontSize(14);
      doc.setTextColor(52, 73, 94);
      doc.text('Summary', 14, yPos);
      yPos += 10;

      doc.autoTable({
        startY: yPos,
        head: [['Metric', 'Amount']],
        body: [
          ['Total Revenue', formatCurrency(totalRevenue)],
          ['Total Expenses', formatCurrency(totalExpenses)],
          ['Net Profit', formatCurrency(netProfit)],
          ['Profit Margin', `${profitMargin.toFixed(1)}%`]
        ],
        theme: 'striped',
        headStyles: { fillColor: [74, 144, 226] }
      });

      yPos = doc.lastAutoTable.finalY + 15;

      // Expense breakdown
      doc.setFontSize(14);
      doc.text('Expense Breakdown', 14, yPos);
      yPos += 10;

      doc.autoTable({
        startY: yPos,
        head: [['Category', 'Amount', '% of Total']],
        body: expenseCategoryData.map(cat => [
          cat.name,
          formatCurrency(cat.value),
          `${((cat.value / totalExpenses) * 100).toFixed(1)}%`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [74, 144, 226] }
      });
    } else if (reportType === 'Revenue') {
      doc.setFontSize(14);
      doc.text('Monthly Revenue', 14, yPos);
      yPos += 10;

      doc.autoTable({
        startY: yPos,
        head: [['Month', 'Revenue', 'Expenses', 'Net']],
        body: monthlyData.map(m => [
          m.label,
          formatCurrency(m.revenue),
          formatCurrency(m.expenses),
          formatCurrency(m.profit)
        ]),
        theme: 'striped',
        headStyles: { fillColor: [74, 144, 226] }
      });
    } else if (reportType === 'Projects') {
      doc.setFontSize(14);
      doc.text('Project Performance', 14, yPos);
      yPos += 10;

      doc.autoTable({
        startY: yPos,
        head: [['Project', 'Contract', 'COs', 'Margin', 'Status']],
        body: projects.map(p => [
          p.name,
          formatCurrency(p.contract_value),
          formatCurrency(p.approved_cos),
          `${p.forecast_margin || 0}%`,
          p.status
        ]),
        theme: 'striped',
        headStyles: { fillColor: [74, 144, 226] }
      });
    }

    doc.save(`TradeOS_${reportType.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (!isElite) {
    return (
      <div className="space-y-6" data-testid="reports-page-locked">
        <div className="flex items-center gap-3">
          <img src="/shield-icon.png" alt="" className="w-10 h-10 opacity-30 hidden lg:block" />
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">Reports</h1>
            <p className="text-gray-400">Advanced analytics and KPI tracking</p>
          </div>
        </div>

        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-12 text-center">
          <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="w-8 h-8 text-warning" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Elite Feature</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Upgrade to Elite to unlock advanced reports, KPI dashboards, expense analytics, and PDF export functionality.
          </p>
          <a 
            href="/app/settings" 
            className="inline-block bg-steel-500 hover:bg-steel-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            data-testid="upgrade-to-elite-btn"
          >
            Upgrade to Elite - $59/mo
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-steel-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="reports-page">
      {/* Header with Shield */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/shield-icon.png" alt="" className="w-10 h-10 opacity-30 hidden lg:block" />
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">Reports</h1>
            <p className="text-gray-400">Advanced analytics and KPI tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-charcoal-800 border border-charcoal-700 rounded-lg px-4 py-2 text-white"
            data-testid="date-range-select"
          >
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="ytd">Year to Date</option>
            <option value="all">All Time</option>
          </select>
          <div className="relative group">
            <button className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export PDF
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-charcoal-800 rounded-lg border border-charcoal-700 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button 
                onClick={() => exportToPDF('Profit & Loss')}
                className="w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-charcoal-700 rounded-t-lg"
                data-testid="export-pl-btn"
              >
                Profit & Loss
              </button>
              <button 
                onClick={() => exportToPDF('Revenue')}
                className="w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-charcoal-700"
                data-testid="export-revenue-btn"
              >
                Revenue Report
              </button>
              <button 
                onClick={() => exportToPDF('Projects')}
                className="w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-charcoal-700 rounded-b-lg"
                data-testid="export-projects-btn"
              >
                Project Summary
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-charcoal-700 pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'revenue', label: 'Revenue', icon: DollarSign },
          { id: 'expenses', label: 'Expenses', icon: Wallet },
          { id: 'projects', label: 'Projects', icon: Target }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id 
                ? 'bg-steel-500/20 text-steel-400' 
                : 'text-gray-400 hover:text-white hover:bg-charcoal-700'
            }`}
            data-testid={`tab-${tab.id}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-charcoal-800 rounded-xl p-4 lg:p-6 border border-charcoal-700">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-6 h-6 text-success" />
                {totalRevenue > 0 && <ArrowUpRight className="w-4 h-4 text-success" />}
              </div>
              <p className="text-2xl font-bold text-success">{formatCurrency(totalRevenue)}</p>
              <p className="text-sm text-gray-500">Total Revenue</p>
            </div>
            <div className="bg-charcoal-800 rounded-xl p-4 lg:p-6 border border-charcoal-700">
              <Wallet className="w-6 h-6 text-risk mb-2" />
              <p className="text-2xl font-bold text-risk">{formatCurrency(totalExpenses)}</p>
              <p className="text-sm text-gray-500">Total Expenses</p>
            </div>
            <div className="bg-charcoal-800 rounded-xl p-4 lg:p-6 border border-charcoal-700">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-6 h-6 text-steel-400" />
                {netProfit > 0 ? <ArrowUpRight className="w-4 h-4 text-success" /> : <ArrowDownRight className="w-4 h-4 text-risk" />}
              </div>
              <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-success' : 'text-risk'}`}>
                {formatCurrency(netProfit)}
              </p>
              <p className="text-sm text-gray-500">Net Profit</p>
            </div>
            <div className="bg-charcoal-800 rounded-xl p-4 lg:p-6 border border-charcoal-700">
              <Percent className="w-6 h-6 text-steel-400 mb-2" />
              <p className={`text-2xl font-bold ${profitMargin >= 15 ? 'text-success' : profitMargin >= 0 ? 'text-warning' : 'text-risk'}`}>
                {profitMargin.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500">Profit Margin</p>
            </div>
          </div>

          {/* P&L Chart */}
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Profit & Loss Trend (6 Months)</h2>
            <div className="h-64">
              {monthlyData.every(m => m.revenue === 0 && m.expenses === 0) ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No data yet</p>
                    <p className="text-xs">Complete milestones and log expenses to see trends</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-end justify-between gap-4">
                  {monthlyData.map((month, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex gap-1 justify-center items-end h-44">
                        {/* Revenue bar */}
                        <div className="flex flex-col items-center w-6">
                          <span className="text-xs text-success mb-1">{month.revenue > 0 ? `$${Math.round(month.revenue/1000)}k` : ''}</span>
                          <div 
                            className="w-full bg-success rounded-t transition-all"
                            style={{ height: `${Math.max((month.revenue / maxMonthlyValue) * 100, 2)}%` }}
                          />
                        </div>
                        {/* Expense bar */}
                        <div className="flex flex-col items-center w-6">
                          <span className="text-xs text-risk mb-1">{month.expenses > 0 ? `$${Math.round(month.expenses/1000)}k` : ''}</span>
                          <div 
                            className="w-full bg-risk rounded-t transition-all"
                            style={{ height: `${Math.max((month.expenses / maxMonthlyValue) * 100, 2)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 mt-2">{month.label}</span>
                      <span className={`text-xs font-medium ${month.profit >= 0 ? 'text-success' : 'text-risk'}`}>
                        {month.profit >= 0 ? '+' : ''}{formatCurrency(month.profit)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-success rounded" />
                <span className="text-gray-400">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-risk rounded" />
                <span className="text-gray-400">Expenses</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Revenue by Month</h2>
            <div className="space-y-3">
              {monthlyData.map((month, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 w-12">{month.label}</span>
                  <div className="flex-1 h-6 bg-charcoal-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-steel-600 to-steel-400 rounded-full transition-all"
                      style={{ width: `${(month.revenue / maxMonthlyValue) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-white w-20 text-right">{formatCurrency(month.revenue)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Revenue Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-charcoal-700">
                <span className="text-gray-400">Total Revenue</span>
                <span className="text-xl font-bold text-success">{formatCurrency(totalRevenue)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-charcoal-700">
                <span className="text-gray-400">Milestones Paid</span>
                <span className="text-white">{filteredMilestones.length}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-charcoal-700">
                <span className="text-gray-400">Approved Change Orders</span>
                <span className="text-warning">{formatCurrency(changeOrders.filter(co => co.status === 'approved').reduce((sum, co) => sum + (parseFloat(co.total_value) || 0), 0))}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-400">Average per Month</span>
                <span className="text-white">{formatCurrency(totalRevenue / 6)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Expense Breakdown by Category</h2>
            {expenseCategoryData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Wallet className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No expenses recorded</p>
              </div>
            ) : (
              <div className="space-y-3">
                {expenseCategoryData.map((cat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm text-gray-400 w-24 truncate">{cat.name}</span>
                    <div className="flex-1 h-6 bg-charcoal-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-risk to-orange-500 rounded-full transition-all"
                        style={{ width: `${(cat.value / maxExpenseCategory) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-white w-20 text-right">{formatCurrency(cat.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Expense Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-charcoal-700">
                <span className="text-gray-400">Total Expenses</span>
                <span className="text-xl font-bold text-risk">{formatCurrency(totalExpenses)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-charcoal-700">
                <span className="text-gray-400">Number of Expenses</span>
                <span className="text-white">{filteredExpenses.length}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-charcoal-700">
                <span className="text-gray-400">Average per Expense</span>
                <span className="text-white">{formatCurrency(filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-charcoal-700">
                <span className="text-gray-400">Largest Category</span>
                <span className="text-white">{expenseCategoryData[0]?.name || '—'}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-400">Tax Deductible (Est.)</span>
                <span className="text-success">{formatCurrency(totalExpenses * 0.85)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <>
          {/* Project KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-charcoal-800 rounded-xl p-4 border border-charcoal-700">
              <p className={`text-2xl font-bold ${avgMargin >= 15 ? 'text-success' : avgMargin >= 10 ? 'text-warning' : 'text-risk'}`}>
                {avgMargin.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500">Avg. Margin</p>
            </div>
            <div className="bg-charcoal-800 rounded-xl p-4 border border-charcoal-700">
              <p className={`text-2xl font-bold ${coApprovalRate >= 80 ? 'text-success' : 'text-warning'}`}>
                {coApprovalRate}%
              </p>
              <p className="text-sm text-gray-500">CO Approval Rate</p>
            </div>
            <div className="bg-charcoal-800 rounded-xl p-4 border border-charcoal-700">
              <p className={`text-2xl font-bold ${atRiskProjects > 0 ? 'text-warning' : 'text-success'}`}>
                {atRiskProjects}
              </p>
              <p className="text-sm text-gray-500">At-Risk Projects</p>
            </div>
            <div className="bg-charcoal-800 rounded-xl p-4 border border-charcoal-700">
              <p className="text-2xl font-bold text-white">{projects.filter(p => p.status === 'active').length}</p>
              <p className="text-sm text-gray-500">Active Projects</p>
            </div>
          </div>

          {/* Project Table */}
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 overflow-hidden">
            <div className="p-6 border-b border-charcoal-700">
              <h2 className="text-lg font-semibold text-white">Project Performance Summary</h2>
            </div>
            {projects.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No projects yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-charcoal-700/50">
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-6 py-3">Project</th>
                      <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide px-6 py-3">Contract</th>
                      <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide px-6 py-3">Approved COs</th>
                      <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide px-6 py-3">Total Revenue</th>
                      <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide px-6 py-3">Margin</th>
                      <th className="text-center text-xs font-medium text-gray-400 uppercase tracking-wide px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-charcoal-700">
                    {projects.map((project) => {
                      const margin = parseFloat(project.forecast_margin) || 0;
                      const contractVal = parseFloat(project.contract_value) || 0;
                      const cosVal = parseFloat(project.approved_cos) || 0;
                      return (
                        <tr key={project.id} className="hover:bg-charcoal-700/30">
                          <td className="px-6 py-4">
                            <p className="text-white font-medium">{project.name}</p>
                            <p className="text-xs text-gray-500">{project.client_gc || 'No client'}</p>
                          </td>
                          <td className="px-6 py-4 text-right text-white">{formatCurrency(contractVal)}</td>
                          <td className="px-6 py-4 text-right text-warning">{formatCurrency(cosVal)}</td>
                          <td className="px-6 py-4 text-right text-steel-400 font-medium">{formatCurrency(contractVal + cosVal)}</td>
                          <td className={`px-6 py-4 text-right font-semibold ${
                            margin >= 15 ? 'text-success' : margin >= 10 ? 'text-warning' : 'text-risk'
                          }`}>{margin}%</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              project.status === 'active' ? 'bg-success/20 text-success' :
                              project.status === 'completed' ? 'bg-steel-500/20 text-steel-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {project.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
