import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, FolderKanban, FileText, AlertTriangle, DollarSign,
  ArrowUpRight, ArrowDownRight, Target, CheckCircle2, Clock,
  Receipt, AlertCircle, Bell, Calendar, ChevronRight, Settings,
  Percent, Wallet, Flag
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import SetupProgressChecklist from '../../components/trial/SetupProgressChecklist';

const DashboardPage = () => {
  const { profile, user } = useAuthStore();
  const [projects, setProjects] = useState([]);
  const [changeOrders, setChangeOrders] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // User preferences (stored in localStorage)
  const [marginThreshold, setMarginThreshold] = useState(() => 
    parseInt(localStorage.getItem('tradeos_margin_threshold') || '15')
  );
  const [taxRate, setTaxRate] = useState(() => 
    parseInt(localStorage.getItem('tradeos_tax_rate') || '25')
  );

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [projectsRes, cosRes, milestonesRes, invoicesRes, expensesRes] = await Promise.all([
        supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('change_orders').select('*, projects(name)').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('project_milestones').select('*').eq('user_id', user.id).order('due_date', { ascending: true }),
        supabase.from('invoices').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').eq('user_id', user.id).order('expense_date', { ascending: false })
      ]);

      setProjects(projectsRes.data || []);
      setChangeOrders(cosRes.data || []);
      setMilestones(milestonesRes.data || []);
      setInvoices(invoicesRes.data || []);
      setExpenses(expensesRes.data || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Save preferences
  const handleMarginChange = (val) => {
    setMarginThreshold(val);
    localStorage.setItem('tradeos_margin_threshold', val.toString());
  };

  const handleTaxRateChange = (val) => {
    setTaxRate(val);
    localStorage.setItem('tradeos_tax_rate', val.toString());
  };

  // Calculations
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const activeProjects = projects.filter(p => p.status === 'active');
  const totalContractValue = projects.reduce((sum, p) => sum + (parseFloat(p.contract_value) || 0), 0);
  const approvedCOsTotal = changeOrders.filter(co => co.status === 'approved').reduce((sum, co) => sum + (parseFloat(co.total_value) || 0), 0);
  const totalRevenue = totalContractValue + approvedCOsTotal;
  
  const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const forecastProfit = totalRevenue - totalExpenses;
  const forecastMargin = totalRevenue > 0 ? (forecastProfit / totalRevenue) * 100 : 0;

  // Receivables
  const outstandingInvoices = invoices.filter(inv => ['sent', 'viewed', 'overdue'].includes(inv.status));
  const totalReceivables = outstandingInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
  
  // Overdue invoices
  const overdueInvoices = invoices.filter(inv => {
    if (inv.status === 'paid') return false;
    if (!inv.due_date) return false;
    return new Date(inv.due_date) < now;
  });
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

  // Pending items
  const pendingCOs = changeOrders.filter(co => co.status === 'pending' || co.status === 'submitted');
  const upcomingMilestones = milestones.filter(m => 
    m.status !== 'paid' && m.due_date && new Date(m.due_date) >= now
  ).slice(0, 5);

  // Low margin projects
  const lowMarginProjects = projects.filter(p => (parseFloat(p.forecast_margin) || 0) < marginThreshold);

  // Trial expiring check
  const trialEndsAt = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const daysUntilTrialExpires = trialEndsAt ? Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24)) : null;
  const trialExpiring = profile?.subscription_tier === 'trial' && daysUntilTrialExpires !== null && daysUntilTrialExpires <= 7;

  // This month stats
  const thisMonthExpenses = expenses
    .filter(e => e.expense_date && new Date(e.expense_date) >= startOfMonth)
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  
  const thisMonthRevenue = invoices
    .filter(inv => inv.status === 'paid' && inv.paid_at && new Date(inv.paid_at) >= startOfMonth)
    .reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

  const estimatedTax = thisMonthRevenue > thisMonthExpenses 
    ? (thisMonthRevenue - thisMonthExpenses) * (taxRate / 100) 
    : 0;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-CA', { 
      style: 'currency', 
      currency: 'CAD', 
      maximumFractionDigits: 0 
    }).format(value || 0);
  };

  // Alert count
  const alertCount = overdueInvoices.length + (trialExpiring ? 1 : 0) + lowMarginProjects.length;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-steel-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      {/* Setup Progress Checklist - Show for trial users */}
      <SetupProgressChecklist />

      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          Welcome back, {profile?.full_name?.split(' ')[0] || profile?.name?.split(' ')[0] || 'Builder'}
        </h1>
        <p className="text-gray-500 mt-1">Your business at a glance</p>
      </div>

      {/* ============================================ */}
      {/* ZONE A: EXECUTION */}
      {/* ============================================ */}
      <section data-testid="execution-zone">
        <h2 className="text-sm font-semibold text-charcoal-700 uppercase tracking-wider mb-4">Execution</h2>
        
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Active Projects */}
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700">
            <div className="p-5 border-b border-charcoal-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-steel-400" />
                <h3 className="font-semibold text-white">Active Projects</h3>
              </div>
              <span className="text-2xl font-bold text-white">{activeProjects.length}</span>
            </div>
            <div className="p-5">
              {activeProjects.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No active projects</p>
              ) : (
                <div className="space-y-3">
                  {activeProjects.slice(0, 4).map(project => (
                    <Link 
                      key={project.id}
                      to={`/app/projects/${project.id}`}
                      className="flex items-center justify-between p-3 bg-charcoal-700/50 rounded-lg hover:bg-charcoal-700 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{project.name}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(project.contract_value)}</p>
                      </div>
                      <div className={`text-sm font-semibold ${
                        (parseFloat(project.forecast_margin) || 0) >= marginThreshold ? 'text-success' : 'text-warning'
                      }`}>
                        {project.forecast_margin || 0}%
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              <Link 
                to="/app/projects"
                className="mt-4 flex items-center justify-center gap-1 text-sm text-steel-400 hover:text-steel-300"
              >
                View all projects <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Upcoming Milestones */}
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700">
            <div className="p-5 border-b border-charcoal-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-steel-400" />
                <h3 className="font-semibold text-white">Upcoming Milestones</h3>
              </div>
              <span className="text-2xl font-bold text-white">{upcomingMilestones.length}</span>
            </div>
            <div className="p-5">
              {upcomingMilestones.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No upcoming milestones</p>
              ) : (
                <div className="space-y-3">
                  {upcomingMilestones.map(milestone => (
                    <div 
                      key={milestone.id}
                      className="flex items-center justify-between p-3 bg-charcoal-700/50 rounded-lg"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{milestone.name}</p>
                        <p className="text-xs text-gray-500">
                          {milestone.due_date ? new Date(milestone.due_date).toLocaleDateString() : 'No due date'}
                        </p>
                      </div>
                      <div className="text-sm font-semibold text-steel-400">
                        {formatCurrency(milestone.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Link 
                to="/app/milestones"
                className="mt-4 flex items-center justify-center gap-1 text-sm text-steel-400 hover:text-steel-300"
              >
                View all milestones <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Pending Change Orders */}
          <div className="bg-charcoal-700/50 rounded-xl border border-charcoal-700">
            <div className="p-5 border-b border-charcoal-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-warning" />
                <h3 className="font-semibold text-white">Pending COs</h3>
              </div>
              <span className="text-2xl font-bold text-warning">{pendingCOs.length}</span>
            </div>
            <div className="p-5">
              {pendingCOs.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No pending change orders</p>
              ) : (
                <div className="space-y-3">
                  {pendingCOs.slice(0, 4).map(co => (
                    <div 
                      key={co.id}
                      className="flex items-center justify-between p-3 bg-charcoal-700 rounded-lg"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{co.title || `CO-${co.co_number}`}</p>
                        <p className="text-xs text-gray-500">{co.projects?.name || 'No project'}</p>
                      </div>
                      <div className="text-sm font-semibold text-warning">
                        {formatCurrency(co.total_value)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Link 
                to="/app/change-orders"
                className="mt-4 flex items-center justify-center gap-1 text-sm text-steel-400 hover:text-steel-300"
              >
                View all COs <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* ZONE B: FINANCIAL CONTROL */}
      {/* ============================================ */}
      <section data-testid="financial-zone">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Financial Control</h2>
        
        {/* Main Financial Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Total Contract Value</p>
            <p className="text-2xl lg:text-3xl font-bold text-white">{formatCurrency(totalContractValue)}</p>
            {approvedCOsTotal > 0 && (
              <p className="text-xs text-gray-500 mt-1">+{formatCurrency(approvedCOsTotal)} approved COs</p>
            )}
          </div>

          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Forecast Profit</p>
            <p className={`text-2xl lg:text-3xl font-bold ${forecastProfit >= 0 ? 'text-success' : 'text-risk'}`}>
              {formatCurrency(forecastProfit)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{formatCurrency(totalExpenses)} in expenses</p>
          </div>

          <div className={`rounded-xl border p-5 ${
            totalReceivables > 0 
              ? 'bg-charcoal-700/50 border-charcoal-700' 
              : 'bg-charcoal-800 border-charcoal-700'
          }`}>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Outstanding Receivables</p>
            <p className={`text-2xl lg:text-3xl font-bold ${totalReceivables > 0 ? 'text-steel-400' : 'text-gray-500'}`}>
              {formatCurrency(totalReceivables)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{outstandingInvoices.length} invoice{outstandingInvoices.length !== 1 ? 's' : ''}</p>
          </div>

          <div className={`bg-charcoal-800 rounded-xl border ${overdueAmount > 0 ? 'border-risk/50' : 'border-charcoal-700'} p-5`}>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Overdue Invoices</p>
            <p className={`text-2xl lg:text-3xl font-bold ${overdueAmount > 0 ? 'text-risk' : 'text-gray-500'}`}>
              {formatCurrency(overdueAmount)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{overdueInvoices.length} overdue</p>
          </div>
        </div>

        {/* Forecast Margin with Threshold Selector */}
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-steel-400" />
              <h3 className="font-semibold text-white">Forecast Margin</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Target:</span>
              <select
                value={marginThreshold}
                onChange={(e) => handleMarginChange(parseInt(e.target.value))}
                className="bg-charcoal-700 border border-charcoal-600 rounded px-2 py-1 text-sm text-white"
                data-testid="margin-threshold-select"
              >
                <option value="10">10%</option>
                <option value="15">15%</option>
                <option value="20">20%</option>
                <option value="25">25%</option>
                <option value="30">30%</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-end gap-4">
            <div>
              <p className={`text-4xl font-bold ${
                forecastMargin >= marginThreshold ? 'text-success' : 
                forecastMargin >= marginThreshold - 5 ? 'text-warning' : 'text-risk'
              }`}>
                {forecastMargin.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {forecastMargin >= marginThreshold ? 'On target' : `${(marginThreshold - forecastMargin).toFixed(1)}% below target`}
              </p>
            </div>
            
            {/* Visual indicator */}
            <div className="flex-1 max-w-xs">
              <div className="h-3 bg-charcoal-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    forecastMargin >= marginThreshold ? 'bg-success' : 
                    forecastMargin >= marginThreshold - 5 ? 'bg-warning' : 'bg-risk'
                  }`}
                  style={{ width: `${Math.min(forecastMargin / 40 * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>0%</span>
                <span className="text-steel-400">{marginThreshold}% target</span>
                <span>40%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* ZONE C: ALERTS */}
      {/* ============================================ */}
      <section data-testid="alerts-zone">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Alerts</h2>
          {alertCount > 0 && (
            <span className="bg-risk/20 text-risk text-xs px-2 py-0.5 rounded-full">{alertCount}</span>
          )}
        </div>
        
        {alertCount === 0 ? (
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
            <p className="text-gray-400">All clear! No alerts at this time.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Past Due Invoices */}
            {overdueInvoices.length > 0 && (
              <div className="bg-charcoal-800 rounded-xl border border-risk/30 p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-risk/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-risk" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Past Due Invoices</p>
                  <p className="text-sm text-gray-400">{overdueInvoices.length} invoice{overdueInvoices.length !== 1 ? 's' : ''} totaling {formatCurrency(overdueAmount)}</p>
                </div>
                <Link 
                  to="/app/invoices?status=overdue"
                  className="text-sm text-risk hover:text-risk/80 font-medium"
                >
                  View →
                </Link>
              </div>
            )}

            {/* Trial Expiring */}
            {trialExpiring && (
              <div className="bg-charcoal-700/50 rounded-xl border border-charcoal-700 p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-warning/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Trial Expiring Soon</p>
                  <p className="text-sm text-gray-400">{daysUntilTrialExpires} day{daysUntilTrialExpires !== 1 ? 's' : ''} remaining</p>
                </div>
                <Link 
                  to="/app/settings"
                  className="bg-steel-500 hover:bg-steel-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Upgrade →
                </Link>
              </div>
            )}

            {/* Low Margin Warning */}
            {lowMarginProjects.length > 0 && (
              <div className="bg-charcoal-800 rounded-xl border border-warning/30 p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-warning/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Low Margin Warning</p>
                  <p className="text-sm text-gray-400">{lowMarginProjects.length} project{lowMarginProjects.length !== 1 ? 's' : ''} below {marginThreshold}% margin</p>
                </div>
                <Link 
                  to="/app/projects"
                  className="text-sm text-warning hover:text-warning/80 font-medium"
                >
                  Review →
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ============================================ */}
      {/* MONTHLY TAX PANEL */}
      {/* ============================================ */}
      <section data-testid="tax-panel">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">This Month Summary</h2>
        
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400">{now.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Tax Rate:</span>
              <select
                value={taxRate}
                onChange={(e) => handleTaxRateChange(parseInt(e.target.value))}
                className="bg-charcoal-700 border border-charcoal-600 rounded px-2 py-1 text-sm text-white"
                data-testid="tax-rate-select"
              >
                <option value="15">15%</option>
                <option value="20">20%</option>
                <option value="25">25%</option>
                <option value="30">30%</option>
                <option value="35">35%</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Revenue</p>
              <p className="text-xl font-bold text-success">{formatCurrency(thisMonthRevenue)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Expenses</p>
              <p className="text-xl font-bold text-risk">{formatCurrency(thisMonthExpenses)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Est. Tax Owing</p>
              <p className="text-xl font-bold text-warning">{formatCurrency(estimatedTax)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Recommended Set-Aside</p>
              <p className="text-xl font-bold text-steel-400">{taxRate}%</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
