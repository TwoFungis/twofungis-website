import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderKanban, 
  DollarSign, 
  TrendingUp, 
  FileText, 
  AlertTriangle,
  Plus,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

interface DashboardStats {
  activeProjects: number;
  totalContractValue: number;
  forecastProfit: number;
  openCOValue: number;
  riskProjects: number;
}

const DashboardPage: React.FC = () => {
  const { user, profile } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    activeProjects: 0,
    totalContractValue: 0,
    forecastProfit: 0,
    openCOValue: 0,
    riskProjects: 0,
  });
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch projects
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      // Fetch open change orders
      const { data: changeOrders } = await supabase
        .from('change_orders')
        .select('*')
        .eq('user_id', user?.id)
        .eq('approved_status', false);

      if (projects) {
        const activeProjects = projects.filter(p => p.percent_complete < 100);
        const totalContract = activeProjects.reduce((sum, p) => sum + (p.contract_value || 0), 0);
        const forecastProfit = activeProjects.reduce((sum, p) => {
          const profit = (p.contract_value || 0) * ((p.forecast_margin || 0) / 100);
          return sum + profit;
        }, 0);
        const riskCount = projects.filter(p => p.risk_flag === 'yellow' || p.risk_flag === 'red').length;

        setStats({
          activeProjects: activeProjects.length,
          totalContractValue: totalContract,
          forecastProfit: forecastProfit,
          openCOValue: changeOrders?.reduce((sum, co) => sum + (co.total_value || 0), 0) || 0,
          riskProjects: riskCount,
        });

        setRecentProjects(projects.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const statCards = [
    { label: 'Active Projects', value: stats.activeProjects, icon: FolderKanban, color: 'steel' },
    { label: 'Total Contract Value', value: formatCurrency(stats.totalContractValue), icon: DollarSign, color: 'steel' },
    { label: 'Forecast Profit', value: formatCurrency(stats.forecastProfit), icon: TrendingUp, color: 'success' },
    { label: 'Open Change Orders', value: formatCurrency(stats.openCOValue), icon: FileText, color: 'warning' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-steel-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
          Welcome back, {profile?.company_name || 'Contractor'}
        </h1>
        <p className="text-gray-400">Here's what's happening with your projects today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={`w-6 h-6 ${
                stat.color === 'success' ? 'text-success' :
                stat.color === 'warning' ? 'text-warning' :
                'text-steel-400'
              }`} />
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-gray-400 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Risk Alert */}
      {stats.riskProjects > 0 && (
        <div className="bg-risk/10 border border-risk/30 rounded-xl p-4 flex items-center gap-4">
          <AlertTriangle className="w-6 h-6 text-risk flex-shrink-0" />
          <div>
            <p className="text-white font-medium">
              {stats.riskProjects} project{stats.riskProjects > 1 ? 's' : ''} flagged for attention
            </p>
            <p className="text-gray-400 text-sm">Review projects marked yellow or red</p>
          </div>
          <Link 
            to="/app/projects" 
            className="ml-auto text-risk hover:text-risk/80 font-medium text-sm flex items-center gap-1"
          >
            View <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'New Quote', path: '/app/estimating?new=true', icon: FileText },
            { label: 'New Project', path: '/app/projects?new=true', icon: FolderKanban },
            { label: 'New Change Order', path: '/app/change-orders?new=true', icon: FileText },
            { label: 'New Daily Log', path: '/app/production?new=true', icon: FileText },
          ].map((action, i) => (
            <Link
              key={i}
              to={action.path}
              className="flex items-center gap-3 bg-charcoal-800 hover:bg-charcoal-700 border border-charcoal-700 rounded-xl p-4 transition-colors"
            >
              <div className="w-10 h-10 bg-steel-500/20 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-steel-400" />
              </div>
              <span className="font-medium text-white">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Projects</h2>
          <Link to="/app/projects" className="text-steel-400 hover:text-steel-300 text-sm font-medium">
            View All
          </Link>
        </div>
        
        {recentProjects.length === 0 ? (
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-8 text-center">
            <FolderKanban className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No projects yet</p>
            <Link
              to="/app/projects?new=true"
              className="inline-flex items-center gap-2 bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create First Project
            </Link>
          </div>
        ) : (
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-charcoal-700">
                  <tr>
                    <th className="text-left text-sm font-medium text-gray-400 px-6 py-3">Project</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-6 py-3">Client/GC</th>
                    <th className="text-right text-sm font-medium text-gray-400 px-6 py-3">Contract</th>
                    <th className="text-right text-sm font-medium text-gray-400 px-6 py-3">Progress</th>
                    <th className="text-center text-sm font-medium text-gray-400 px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-700">
                  {recentProjects.map((project) => (
                    <tr key={project.id} className="hover:bg-charcoal-700/50">
                      <td className="px-6 py-4">
                        <Link to={`/app/projects/${project.id}`} className="text-white hover:text-steel-400 font-medium">
                          {project.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{project.client_gc}</td>
                      <td className="px-6 py-4 text-right text-white">{formatCurrency(project.contract_value || 0)}</td>
                      <td className="px-6 py-4 text-right text-gray-400">{project.percent_complete || 0}%</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block w-3 h-3 rounded-full ${
                          project.risk_flag === 'green' ? 'bg-success' :
                          project.risk_flag === 'yellow' ? 'bg-warning' :
                          project.risk_flag === 'red' ? 'bg-risk' :
                          'bg-gray-500'
                        }`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
