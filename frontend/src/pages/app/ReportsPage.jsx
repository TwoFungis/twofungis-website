import React, { useState, useEffect } from 'react';
import { BarChart3, Crown, TrendingUp, DollarSign, AlertTriangle, Target, Calendar, ArrowUpRight, ArrowDownRight, Percent } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

const ReportsPage = () => {
  const { profile, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [changeOrders, setChangeOrders] = useState([]);
  const isElite = profile?.subscription_tier === 'elite';

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Fetch projects
        const { data: projectsData } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id);
        setProjects(projectsData || []);

        // Fetch milestones
        const { data: milestonesData } = await supabase
          .from('project_milestones')
          .select('*')
          .eq('user_id', user.id);
        setMilestones(milestonesData || []);

        // Fetch change orders
        const { data: cosData } = await supabase
          .from('change_orders')
          .select('*')
          .eq('user_id', user.id);
        setChangeOrders(cosData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Calculate KPIs
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const avgMargin = projects.length > 0 
    ? projects.reduce((sum, p) => sum + (parseFloat(p.forecast_margin) || 0), 0) / projects.length 
    : 0;
  
  const thisMonthPaid = milestones
    .filter(m => m.status === 'paid' && m.paid_at && new Date(m.paid_at) >= startOfMonth)
    .reduce((sum, m) => sum + (parseFloat(m.milestone_value) || 0), 0);

  const totalApprovedCOs = changeOrders.filter(co => co.status === 'approved').length;
  const totalCOs = changeOrders.length;
  const coApprovalRate = totalCOs > 0 ? Math.round((totalApprovedCOs / totalCOs) * 100) : 0;

  const atRiskProjects = projects.filter(p => p.risk_flag === 'red' || (parseFloat(p.forecast_margin) || 0) < 10).length;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-CA', { 
      style: 'currency', 
      currency: 'CAD', 
      maximumFractionDigits: 0 
    }).format(value || 0);
  };

  // Generate last 6 months for revenue chart
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
      
      months.push({
        label: date.toLocaleString('default', { month: 'short' }),
        value: monthRevenue
      });
    }
    return months;
  };

  const monthlyData = generateMonthlyData();
  const maxRevenue = Math.max(...monthlyData.map(m => m.value), 1);

  if (!isElite) {
    return (
      <div className="space-y-6" data-testid="reports-page-locked">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Reports</h1>
          <p className="text-gray-400">Advanced analytics and KPI tracking</p>
        </div>

        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-12 text-center">
          <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="w-8 h-8 text-warning" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Elite Feature</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Upgrade to Elite to unlock advanced reports, KPI dashboards, production analytics, and monthly performance summaries.
          </p>
          <button className="bg-steel-500 hover:bg-steel-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Upgrade to Elite - $59/mo
          </button>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Reports</h1>
          <p className="text-gray-400">Advanced analytics and KPI tracking</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>{now.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-charcoal-800 rounded-xl p-4 lg:p-6 border border-charcoal-700">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-6 h-6 text-success" />
            {avgMargin >= 15 ? <ArrowUpRight className="w-4 h-4 text-success" /> : <ArrowDownRight className="w-4 h-4 text-risk" />}
          </div>
          <p className={`text-2xl font-bold ${avgMargin >= 15 ? 'text-success' : avgMargin >= 10 ? 'text-warning' : 'text-risk'}`}>
            {avgMargin.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-500">Avg. Margin</p>
          <p className={`text-xs mt-2 ${avgMargin >= 15 ? 'text-success' : 'text-warning'}`}>
            {avgMargin >= 15 ? 'On target' : 'Below 15% target'}
          </p>
        </div>
        <div className="bg-charcoal-800 rounded-xl p-4 lg:p-6 border border-charcoal-700">
          <DollarSign className="w-6 h-6 text-steel-400 mb-2" />
          <p className="text-2xl font-bold text-white">{formatCurrency(thisMonthPaid)}</p>
          <p className="text-sm text-gray-500">Revenue (MTD)</p>
          <p className="text-xs text-gray-400 mt-2">{milestones.filter(m => m.status === 'paid').length} milestones paid</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl p-4 lg:p-6 border border-charcoal-700">
          <Percent className="w-6 h-6 text-steel-400 mb-2" />
          <p className={`text-2xl font-bold ${coApprovalRate >= 80 ? 'text-success' : 'text-warning'}`}>{coApprovalRate}%</p>
          <p className="text-sm text-gray-500">CO Approval Rate</p>
          <p className="text-xs text-gray-400 mt-2">{totalApprovedCOs} of {totalCOs} approved</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl p-4 lg:p-6 border border-charcoal-700">
          <AlertTriangle className={`w-6 h-6 ${atRiskProjects > 0 ? 'text-warning' : 'text-success'} mb-2`} />
          <p className={`text-2xl font-bold ${atRiskProjects > 0 ? 'text-warning' : 'text-success'}`}>{atRiskProjects}</p>
          <p className="text-sm text-gray-500">At-Risk Projects</p>
          <p className={`text-xs mt-2 ${atRiskProjects > 0 ? 'text-warning' : 'text-success'}`}>
            {atRiskProjects > 0 ? 'Review recommended' : 'All healthy'}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Revenue Trend (6 Months)</h2>
          <div className="h-64">
            {monthlyData.every(m => m.value === 0) ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No revenue data yet</p>
                  <p className="text-xs">Complete milestones to see trends</p>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-end justify-between gap-2">
                {monthlyData.map((month, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col items-center justify-end h-48">
                      <span className="text-xs text-gray-400 mb-1">{formatCurrency(month.value)}</span>
                      <div 
                        className="w-full bg-gradient-to-t from-steel-600 to-steel-400 rounded-t transition-all"
                        style={{ height: `${Math.max((month.value / maxRevenue) * 100, 4)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 mt-2">{month.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Margin by Project */}
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Margin by Project</h2>
          <div className="h-64 overflow-y-auto">
            {projects.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Target className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No projects yet</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 8).map((project) => {
                  const margin = parseFloat(project.forecast_margin) || 0;
                  return (
                    <div key={project.id} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{project.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-2 bg-charcoal-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                margin >= 20 ? 'bg-success' : margin >= 15 ? 'bg-steel-400' : margin >= 10 ? 'bg-warning' : 'bg-risk'
                              }`}
                              style={{ width: `${Math.min(margin * 3, 100)}%` }}
                            />
                          </div>
                          <span className={`text-sm font-medium w-12 text-right ${
                            margin >= 15 ? 'text-success' : margin >= 10 ? 'text-warning' : 'text-risk'
                          }`}>
                            {margin}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Performance Table */}
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 overflow-hidden">
        <div className="p-6 border-b border-charcoal-700">
          <h2 className="text-lg font-semibold text-white">Project Performance Summary</h2>
        </div>
        {projects.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Create projects to see performance data</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-charcoal-700/50">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-6 py-3">Project</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide px-6 py-3">Contract</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide px-6 py-3">Approved COs</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide px-6 py-3">Complete</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide px-6 py-3">Margin</th>
                  <th className="text-center text-xs font-medium text-gray-400 uppercase tracking-wide px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-700">
                {projects.map((project) => {
                  const margin = parseFloat(project.forecast_margin) || 0;
                  return (
                    <tr key={project.id} className="hover:bg-charcoal-700/30">
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">{project.name}</p>
                        <p className="text-xs text-gray-500">{project.client_gc || 'No client'}</p>
                      </td>
                      <td className="px-6 py-4 text-right text-white">{formatCurrency(project.contract_value)}</td>
                      <td className="px-6 py-4 text-right text-warning">{formatCurrency(project.approved_cos)}</td>
                      <td className="px-6 py-4 text-right text-gray-400">{project.percent_complete || 0}%</td>
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
    </div>
  );
};

export default ReportsPage;
