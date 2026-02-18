import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  FolderKanban, 
  FileText, 
  AlertTriangle,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  CheckCircle2,
  Clock,
  Wallet,
  Plus,
  Receipt,
  CalendarClock,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

const DashboardPage = () => {
  const { profile, user } = useAuthStore();
  const [milestoneStats, setMilestoneStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    paid: 0
  });
  const [projects, setProjects] = useState([]);
  const [changeOrders, setChangeOrders] = useState([]);
  const [allMilestones, setAllMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      setLoading(true);
      
      // Fetch all milestones for receivables calculation
      try {
        const { data, error } = await supabase
          .from('project_milestones')
          .select('*, projects(name)')
          .eq('user_id', user.id);

        if (!error && data) {
          setAllMilestones(data);
          const stats = data.reduce((acc, m) => ({
            total: acc.total + (parseFloat(m.milestone_value) || 0),
            pending: acc.pending + (m.status === 'submitted' ? parseFloat(m.milestone_value) || 0 : 0),
            approved: acc.approved + (m.status === 'approved' ? parseFloat(m.milestone_value) || 0 : 0),
            paid: acc.paid + (m.status === 'paid' ? parseFloat(m.milestone_value) || 0 : 0)
          }), { total: 0, pending: 0, approved: 0, paid: 0 });
          setMilestoneStats(stats);
        }
      } catch (err) {
        console.error('Error fetching milestone stats:', err);
      }
      
      // Fetch real projects
      try {
        const { data: projectsData } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(4);
        
        if (projectsData) {
          setProjects(projectsData);
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
      }

      // Fetch all change orders (for receivables calculation)
      try {
        const { data: coData } = await supabase
          .from('change_orders')
          .select('*, projects(name)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (coData) {
          setChangeOrders(coData);
        }
      } catch (err) {
        console.error('Error fetching change orders:', err);
      }
      
      setLoading(false);
    };

    fetchDashboardData();
  }, [user]);

  // Calculate real stats from data
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const totalContractValue = projects.reduce((sum, p) => sum + (parseFloat(p.contract_value) || 0), 0);
  const pendingCOs = changeOrders.filter(co => co.status === 'pending' || co.status === 'submitted');
  const pendingCOValue = pendingCOs.reduce((sum, co) => sum + (parseFloat(co.total_value) || 0), 0);
  const avgMargin = projects.length > 0 
    ? projects.reduce((sum, p) => sum + (parseFloat(p.forecast_margin) || 0), 0) / projects.length 
    : 0;

  // Calculate receivables (approved milestones + approved COs not yet paid)
  const approvedMilestones = allMilestones.filter(m => m.status === 'approved');
  const approvedCOs = changeOrders.filter(co => co.status === 'approved');
  const totalReceivables = 
    approvedMilestones.reduce((sum, m) => sum + (parseFloat(m.milestone_value) || 0), 0) +
    approvedCOs.reduce((sum, co) => sum + (parseFloat(co.total_value) || 0), 0);

  // Calculate this month's revenue (paid milestones this month)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthPaid = allMilestones
    .filter(m => m.status === 'paid' && m.paid_at && new Date(m.paid_at) >= startOfMonth)
    .reduce((sum, m) => sum + (parseFloat(m.milestone_value) || 0), 0);

  // Calculate aging buckets for outstanding payments
  const getAgingDays = (date) => {
    if (!date) return 0;
    return Math.floor((now - new Date(date)) / (1000 * 60 * 60 * 24));
  };

  const aging0to30 = approvedMilestones
    .filter(m => getAgingDays(m.approved_at) <= 30)
    .reduce((sum, m) => sum + (parseFloat(m.milestone_value) || 0), 0);
  const aging31to60 = approvedMilestones
    .filter(m => getAgingDays(m.approved_at) > 30 && getAgingDays(m.approved_at) <= 60)
    .reduce((sum, m) => sum + (parseFloat(m.milestone_value) || 0), 0);
  const aging60plus = approvedMilestones
    .filter(m => getAgingDays(m.approved_at) > 60)
    .reduce((sum, m) => sum + (parseFloat(m.milestone_value) || 0), 0);

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'green': return 'bg-success';
      case 'yellow': return 'bg-warning';
      case 'red': return 'bg-risk';
      default: return 'bg-gray-500';
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-CA', { 
      style: 'currency', 
      currency: 'CAD', 
      maximumFractionDigits: 0 
    }).format(value || 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-steel-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      {/* Welcome */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
          Welcome back, {profile?.name?.split(' ')[0] || 'Builder'}
        </h1>
        <p className="text-gray-400 text-sm">Here's your financial pulse for today.</p>
      </div>

      {/* QUICK STATS BAR - Financial Pulse */}
      <div className="bg-gradient-to-r from-charcoal-800 to-charcoal-900 rounded-2xl border border-charcoal-700 p-4 lg:p-6 animate-fade-in-up animation-delay-100" data-testid="quick-stats-bar">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
          {/* Total Receivables */}
          <div className="flex items-center gap-3 hover-lift">
            <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
              <Receipt className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Receivables</p>
              <p className="text-xl lg:text-2xl font-bold text-success">{formatCurrency(totalReceivables)}</p>
            </div>
          </div>

          {/* This Month Revenue */}
          <div className="flex items-center gap-3 hover-lift">
            <div className="w-12 h-12 rounded-xl bg-steel-500/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-steel-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">This Month</p>
              <p className="text-xl lg:text-2xl font-bold text-white">{formatCurrency(thisMonthPaid)}</p>
            </div>
          </div>

          {/* Outstanding COs */}
          <div className="flex items-center gap-3 hover-lift">
            <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Pending COs</p>
              <p className="text-xl lg:text-2xl font-bold text-warning">{formatCurrency(pendingCOValue)}</p>
            </div>
          </div>

          {/* Overdue Amount */}
          <div className="flex items-center gap-3 hover-lift">
            <div className={`w-12 h-12 rounded-xl ${aging60plus > 0 ? 'bg-risk/20' : 'bg-charcoal-700'} flex items-center justify-center`}>
              <AlertCircle className={`w-6 h-6 ${aging60plus > 0 ? 'text-risk animate-pulse-subtle' : 'text-gray-500'}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Overdue (60+)</p>
              <p className={`text-xl lg:text-2xl font-bold ${aging60plus > 0 ? 'text-risk' : 'text-gray-500'}`}>
                {formatCurrency(aging60plus)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-charcoal-800 rounded-xl p-4 lg:p-5 border border-charcoal-700 card-glow animate-fade-in-up animation-delay-200" data-testid="stat-card-projects">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-charcoal-700 flex items-center justify-center text-steel-400">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mb-0.5">{activeProjects}</p>
          <p className="text-xs text-gray-500">Active Projects</p>
        </div>

        <div className="bg-charcoal-800 rounded-xl p-4 lg:p-5 border border-charcoal-700 card-glow animate-fade-in-up animation-delay-300" data-testid="stat-card-value">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-charcoal-700 flex items-center justify-center text-success">
              <DollarSign className="w-4 h-4" />
            </div>
            {totalContractValue > 0 && <ArrowUpRight className="w-4 h-4 text-success" />}
          </div>
          <p className="text-2xl font-bold text-white mb-0.5">{formatCurrency(totalContractValue)}</p>
          <p className="text-xs text-gray-500">Contract Value</p>
        </div>

        <div className="bg-charcoal-800 rounded-xl p-4 lg:p-5 border border-charcoal-700 card-glow animate-fade-in-up animation-delay-400" data-testid="stat-card-cos">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-charcoal-700 flex items-center justify-center text-warning">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mb-0.5">{pendingCOs.length}</p>
          <p className="text-xs text-gray-500">Pending COs</p>
        </div>

        <div className="bg-charcoal-800 rounded-xl p-4 lg:p-5 border border-charcoal-700 card-glow animate-fade-in-up animation-delay-500" data-testid="stat-card-margin">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-charcoal-700 flex items-center justify-center text-steel-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            {avgMargin >= 15 ? <ArrowUpRight className="w-4 h-4 text-success" /> : <ArrowDownRight className="w-4 h-4 text-risk" />}
          </div>
          <p className={`text-2xl font-bold mb-0.5 ${avgMargin >= 15 ? 'text-success' : avgMargin >= 10 ? 'text-warning' : 'text-risk'}`}>
            {avgMargin.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500">Avg. Margin</p>
        </div>
      </div>

      {/* Outstanding Payments Widget + Active Projects */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Outstanding Payments - Aging Breakdown */}
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 card-glow animate-fade-in-up animation-delay-200" data-testid="outstanding-payments-widget">
          <div className="p-4 lg:p-5 border-b border-charcoal-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-steel-400" />
              <h2 className="text-base font-semibold text-white">Outstanding Payments</h2>
            </div>
            <span className="text-lg font-bold text-white">{formatCurrency(totalReceivables)}</span>
          </div>
          <div className="p-4 lg:p-5">
            {totalReceivables === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-2" />
                <p className="text-gray-400">All caught up! No outstanding payments.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* 0-30 days */}
                <div className="flex items-center justify-between hover-lift p-2 rounded-lg transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 rounded-full bg-success" />
                    <div>
                      <p className="text-sm font-medium text-white">0-30 days</p>
                      <p className="text-xs text-gray-500">Current</p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-success">{formatCurrency(aging0to30)}</p>
                </div>
                {/* 31-60 days */}
                <div className="flex items-center justify-between hover-lift p-2 rounded-lg transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 rounded-full bg-warning" />
                    <div>
                      <p className="text-sm font-medium text-white">31-60 days</p>
                      <p className="text-xs text-gray-500">Follow up</p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-warning">{formatCurrency(aging31to60)}</p>
                </div>
                {/* 60+ days */}
                <div className="flex items-center justify-between hover-lift p-2 rounded-lg transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 rounded-full bg-risk" />
                    <div>
                      <p className="text-sm font-medium text-white">60+ days</p>
                      <p className="text-xs text-gray-500">At risk</p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-risk">{formatCurrency(aging60plus)}</p>
                </div>
                {/* Progress bar */}
                <div className="mt-4 h-2 bg-charcoal-700 rounded-full overflow-hidden flex">
                  {totalReceivables > 0 && (
                    <>
                      <div 
                        className="h-full bg-success animate-progress-grow" 
                        style={{ width: `${(aging0to30 / totalReceivables) * 100}%` }}
                      />
                      <div 
                        className="h-full bg-warning animate-progress-grow animation-delay-200" 
                        style={{ width: `${(aging31to60 / totalReceivables) * 100}%` }}
                      />
                      <div 
                        className="h-full bg-risk animate-progress-grow animation-delay-300" 
                        style={{ width: `${(aging60plus / totalReceivables) * 100}%` }}
                      />
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 card-glow animate-fade-in-up animation-delay-300">
          <div className="p-4 lg:p-5 border-b border-charcoal-700 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Active Projects</h2>
            <Link to="/app/projects" className="text-steel-400 text-sm hover:text-steel-300 transition-colors">View all</Link>
          </div>
          {projects.length === 0 ? (
            <div className="p-8 text-center">
              <FolderKanban className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">No projects yet</p>
              <Link 
                to="/app/projects?new=true"
                className="inline-flex items-center gap-2 text-steel-400 hover:text-steel-300 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Create your first project
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-charcoal-700">
              {projects.slice(0, 3).map((project) => (
                <Link 
                  key={project.id} 
                  to={`/app/projects/${project.id}`}
                  className="p-4 lg:p-5 hover:bg-charcoal-700/50 transition-colors block"
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate text-sm">{project.name}</h3>
                      <p className="text-xs text-gray-500">{project.client_gc || 'No client'}</p>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full ${getRiskColor(project.risk_flag)} ml-3 mt-1`} />
                  </div>
                  <div className="flex items-center gap-3 text-xs mt-2">
                    <span className="text-gray-400">{formatCurrency(project.contract_value)}</span>
                    <span className={parseFloat(project.forecast_margin) >= 15 ? 'text-success' : 'text-warning'}>{project.forecast_margin || 0}% margin</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Change Orders */}
      {pendingCOs.length > 0 && (
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700">
          <div className="p-4 lg:p-5 border-b border-charcoal-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">Pending Change Orders</h2>
              <span className="bg-warning/20 text-warning text-xs px-2 py-0.5 rounded-full">{pendingCOs.length}</span>
            </div>
            <Link to="/app/change-orders" className="text-steel-400 text-sm hover:text-steel-300">View all</Link>
          </div>
          <div className="divide-y divide-charcoal-700">
            {pendingCOs.slice(0, 3).map((co) => {
              const daysPending = Math.floor((new Date() - new Date(co.created_at)) / (1000 * 60 * 60 * 24));
              return (
                <div key={co.id} className="p-4 lg:p-5 hover:bg-charcoal-700/50 transition-colors">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs bg-charcoal-600 text-gray-300 px-2 py-0.5 rounded font-mono">{co.co_number}</span>
                        <span className="text-xs text-gray-500">{co.projects?.name || 'Unknown Project'}</span>
                      </div>
                      <p className="text-sm text-white">{co.description}</p>
                    </div>
                    <span className="text-base font-semibold text-white whitespace-nowrap">{formatCurrency(co.total_value)}</span>
                  </div>
                  {daysPending > 7 && (
                    <div className="flex items-center gap-2 text-xs mt-2">
                      <AlertTriangle className="w-3 h-3 text-warning" />
                      <span className="text-warning">{daysPending} days pending - follow up recommended</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Milestone Summary Widget */}
      {milestoneStats.total > 0 && (
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700">
          <div className="p-4 lg:p-5 border-b border-charcoal-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-steel-400" />
              <h2 className="text-base font-semibold text-white">Milestone Progress</h2>
            </div>
            <Link to="/app/projects" className="text-steel-400 text-sm hover:text-steel-300">View projects</Link>
          </div>
          <div className="p-4 lg:p-5">
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <p className="text-lg font-bold text-white">{formatCurrency(milestoneStats.total)}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-steel-400">{formatCurrency(milestoneStats.pending)}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-success">{formatCurrency(milestoneStats.approved)}</p>
                <p className="text-xs text-gray-500">Approved</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-400">{formatCurrency(milestoneStats.paid)}</p>
                <p className="text-xs text-gray-500">Paid</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
