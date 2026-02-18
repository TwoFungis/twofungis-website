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
  Plus
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      setLoading(true);
      
      // Fetch milestone stats
      try {
        const { data, error } = await supabase
          .from('project_milestones')
          .select('milestone_value, status')
          .eq('user_id', user.id);

        if (!error && data) {
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

      // Fetch real change orders
      try {
        const { data: coData } = await supabase
          .from('change_orders')
          .select('*, projects(name)')
          .eq('user_id', user.id)
          .in('status', ['pending', 'submitted'])
          .order('created_at', { ascending: false })
          .limit(5);
        
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
  const pendingCOValue = changeOrders.reduce((sum, co) => sum + (parseFloat(co.total_value) || 0), 0);
  const avgMargin = projects.length > 0 
    ? projects.reduce((sum, p) => sum + (parseFloat(p.forecast_margin) || 0), 0) / projects.length 
    : 0;

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
    <div className="space-y-8" data-testid="dashboard-page">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
          Welcome back, {profile?.name?.split(' ')[0] || 'Builder'}
        </h1>
        <p className="text-gray-400">Here's what's happening with your projects today.</p>
      </div>

      {/* Stats Grid - REAL DATA */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-charcoal-800 rounded-xl p-4 lg:p-6 border border-charcoal-700" data-testid="stat-card-projects">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-charcoal-700 flex items-center justify-center text-steel-400">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-white mb-1">{activeProjects}</p>
          <p className="text-sm text-gray-500">Active Projects</p>
          <p className="text-xs mt-2 text-gray-400">{projects.length} total</p>
        </div>

        <div className="bg-charcoal-800 rounded-xl p-4 lg:p-6 border border-charcoal-700" data-testid="stat-card-value">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-charcoal-700 flex items-center justify-center text-success">
              <DollarSign className="w-5 h-5" />
            </div>
            {totalContractValue > 0 && <ArrowUpRight className="w-4 h-4 text-success" />}
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-white mb-1">{formatCurrency(totalContractValue)}</p>
          <p className="text-sm text-gray-500">Total Contract Value</p>
        </div>

        <div className="bg-charcoal-800 rounded-xl p-4 lg:p-6 border border-charcoal-700" data-testid="stat-card-cos">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-charcoal-700 flex items-center justify-center text-warning">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-white mb-1">{changeOrders.length}</p>
          <p className="text-sm text-gray-500">Pending Change Orders</p>
          <p className="text-xs mt-2 text-warning">{formatCurrency(pendingCOValue)} pending</p>
        </div>

        <div className="bg-charcoal-800 rounded-xl p-4 lg:p-6 border border-charcoal-700" data-testid="stat-card-margin">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-charcoal-700 flex items-center justify-center text-steel-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            {avgMargin >= 15 ? <ArrowUpRight className="w-4 h-4 text-success" /> : <ArrowDownRight className="w-4 h-4 text-risk" />}
          </div>
          <p className={`text-2xl lg:text-3xl font-bold mb-1 ${avgMargin >= 15 ? 'text-success' : avgMargin >= 10 ? 'text-warning' : 'text-risk'}`}>
            {avgMargin.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-500">Avg. Margin</p>
          <p className={`text-xs mt-2 ${avgMargin >= 15 ? 'text-success' : 'text-warning'}`}>
            {avgMargin >= 15 ? 'On target' : 'Below target'}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Projects - REAL DATA */}
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700">
          <div className="p-4 lg:p-6 border-b border-charcoal-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Active Projects</h2>
            <Link to="/app/projects" className="text-steel-400 text-sm hover:text-steel-300">View all</Link>
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
              {projects.map((project) => (
                <Link 
                  key={project.id} 
                  to={`/app/projects/${project.id}`}
                  className="p-4 lg:p-6 hover:bg-charcoal-700/50 transition-colors block"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate">{project.name}</h3>
                      <p className="text-sm text-gray-500">{project.client_gc || 'No client'}</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${getRiskColor(project.risk_flag)} ml-3 mt-1.5`} />
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-400">Value: <span className="text-white">{formatCurrency(project.contract_value)}</span></span>
                    <span className="text-gray-400">Margin: <span className={parseFloat(project.forecast_margin) >= 15 ? 'text-success' : 'text-warning'}>{project.forecast_margin || 0}%</span></span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pending Change Orders - REAL DATA */}
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700">
          <div className="p-4 lg:p-6 border-b border-charcoal-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">Pending Change Orders</h2>
              {changeOrders.length > 0 && (
                <span className="bg-warning/20 text-warning text-xs px-2 py-0.5 rounded-full">{changeOrders.length}</span>
              )}
            </div>
            <Link to="/app/change-orders" className="text-steel-400 text-sm hover:text-steel-300">View all</Link>
          </div>
          {changeOrders.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">No pending change orders</p>
              <Link 
                to="/app/change-orders?new=true"
                className="inline-flex items-center gap-2 text-steel-400 hover:text-steel-300 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Create change order
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-charcoal-700">
              {changeOrders.map((co) => {
                const daysPending = Math.floor((new Date() - new Date(co.created_at)) / (1000 * 60 * 60 * 24));
                return (
                  <div key={co.id} className="p-4 lg:p-6 hover:bg-charcoal-700/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs bg-charcoal-600 text-gray-300 px-2 py-0.5 rounded">{co.co_number}</span>
                          <span className="text-sm text-gray-500">{co.projects?.name || 'Unknown Project'}</span>
                        </div>
                        <p className="text-white">{co.description}</p>
                      </div>
                      <span className="text-lg font-semibold text-white whitespace-nowrap">{formatCurrency(co.total_value)}</span>
                    </div>
                    {daysPending > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <AlertTriangle className="w-3 h-3 text-warning" />
                        <span className="text-warning">{daysPending} days pending</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-steel-500/10 border border-steel-500/30 rounded-xl p-4 lg:p-6">
        <h3 className="text-steel-400 font-semibold mb-2">Pro Tip</h3>
        <p className="text-gray-300 text-sm">
          Track your change orders within 48 hours of the work being requested. Projects with quick CO documentation have 3x higher approval rates.
        </p>
      </div>

      {/* Milestone Summary Widget */}
      {(milestoneStats.total > 0 || milestoneStats.pending > 0) && (
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700">
          <div className="p-4 lg:p-6 border-b border-charcoal-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-steel-400" />
              <h2 className="text-lg font-semibold text-white">Milestone Summary</h2>
            </div>
            <Link to="/app/projects" className="text-steel-400 text-sm hover:text-steel-300">View projects</Link>
          </div>
          <div className="p-4 lg:p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-charcoal-700/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Wallet className="w-4 h-4" />
                  <span className="text-xs">Total Value</span>
                </div>
                <p className="text-xl font-bold text-white">
                  {new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(milestoneStats.total)}
                </p>
              </div>
              <div className="bg-steel-500/10 rounded-lg p-4 border border-steel-500/30">
                <div className="flex items-center gap-2 text-steel-400 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs">Pending Approval</span>
                </div>
                <p className="text-xl font-bold text-steel-400">
                  {new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(milestoneStats.pending)}
                </p>
              </div>
              <div className="bg-success/10 rounded-lg p-4 border border-success/30">
                <div className="flex items-center gap-2 text-success mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs">Approved</span>
                </div>
                <p className="text-xl font-bold text-success">
                  {new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(milestoneStats.approved)}
                </p>
              </div>
              <div className="bg-emerald-700/10 rounded-lg p-4 border border-emerald-700/30">
                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs">Paid</span>
                </div>
                <p className="text-xl font-bold text-emerald-400">
                  {new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(milestoneStats.paid)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
