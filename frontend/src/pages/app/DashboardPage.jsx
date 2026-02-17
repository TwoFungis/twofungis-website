import React from 'react';
import { 
  TrendingUp, 
  FolderKanban, 
  FileText, 
  AlertTriangle,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const DashboardPage = () => {
  const { profile } = useAuthStore();

  // Mock data for demonstration
  const stats = [
    { 
      label: 'Active Projects', 
      value: '4', 
      change: '+1 this month',
      trend: 'up',
      icon: FolderKanban,
      color: 'text-steel-400'
    },
    { 
      label: 'Total Contract Value', 
      value: '$847,500', 
      change: '+12% vs last month',
      trend: 'up',
      icon: DollarSign,
      color: 'text-success'
    },
    { 
      label: 'Pending Change Orders', 
      value: '7', 
      change: '$34,200 pending',
      trend: 'neutral',
      icon: FileText,
      color: 'text-warning'
    },
    { 
      label: 'Avg. Margin', 
      value: '18.4%', 
      change: '-2.1% vs target',
      trend: 'down',
      icon: TrendingUp,
      color: 'text-risk'
    },
  ];

  const projects = [
    { name: 'Westside Towers - Unit Finishes', client: 'Ledcor Construction', value: '$245,000', margin: '22%', risk: 'green' },
    { name: 'Downtown Medical Centre', client: 'Ellis Don', value: '$312,500', margin: '16%', risk: 'yellow' },
    { name: 'Residential Complex Phase 2', client: 'Bosa Properties', value: '$178,000', margin: '24%', risk: 'green' },
    { name: 'Commercial Retrofit - Main St', client: 'PCL Contractors', value: '$112,000', margin: '11%', risk: 'red' },
  ];

  const pendingCOs = [
    { project: 'Westside Towers', co: 'CO-004', desc: 'Additional trim package', value: '$8,400', days: 5 },
    { project: 'Medical Centre', co: 'CO-012', desc: 'Layout revision - Level 3', value: '$12,800', days: 12 },
    { project: 'Commercial Retrofit', co: 'CO-002', desc: 'Material upgrade request', value: '$4,200', days: 3 },
  ];

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'green': return 'bg-success';
      case 'yellow': return 'bg-warning';
      case 'red': return 'bg-risk';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
          Welcome back, {profile?.name?.split(' ')[0] || 'Builder'}
        </h1>
        <p className="text-gray-400">Here's what's happening with your projects today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-charcoal-800 rounded-xl p-4 lg:p-6 border border-charcoal-700" data-testid={`stat-card-${i}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg bg-charcoal-700 flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              {stat.trend === 'up' && <ArrowUpRight className="w-4 h-4 text-success" />}
              {stat.trend === 'down' && <ArrowDownRight className="w-4 h-4 text-risk" />}
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-xs mt-2 ${stat.trend === 'up' ? 'text-success' : stat.trend === 'down' ? 'text-risk' : 'text-gray-400'}`}>
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Projects */}
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700">
          <div className="p-4 lg:p-6 border-b border-charcoal-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Active Projects</h2>
            <a href="/app/projects" className="text-steel-400 text-sm hover:text-steel-300">View all</a>
          </div>
          <div className="divide-y divide-charcoal-700">
            {projects.map((project, i) => (
              <div key={i} className="p-4 lg:p-6 hover:bg-charcoal-700/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{project.name}</h3>
                    <p className="text-sm text-gray-500">{project.client}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${getRiskColor(project.risk)} ml-3 mt-1.5`} />
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-400">Value: <span className="text-white">{project.value}</span></span>
                  <span className="text-gray-400">Margin: <span className={project.margin >= '15%' ? 'text-success' : 'text-warning'}>{project.margin}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Change Orders */}
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700">
          <div className="p-4 lg:p-6 border-b border-charcoal-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">Pending Change Orders</h2>
              <span className="bg-warning/20 text-warning text-xs px-2 py-0.5 rounded-full">{pendingCOs.length}</span>
            </div>
            <a href="/app/change-orders" className="text-steel-400 text-sm hover:text-steel-300">View all</a>
          </div>
          <div className="divide-y divide-charcoal-700">
            {pendingCOs.map((co, i) => (
              <div key={i} className="p-4 lg:p-6 hover:bg-charcoal-700/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-charcoal-600 text-gray-300 px-2 py-0.5 rounded">{co.co}</span>
                      <span className="text-sm text-gray-500">{co.project}</span>
                    </div>
                    <p className="text-white">{co.desc}</p>
                  </div>
                  <span className="text-lg font-semibold text-white whitespace-nowrap">{co.value}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <AlertTriangle className="w-3 h-3 text-warning" />
                  <span className="text-warning">{co.days} days pending</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-steel-500/10 border border-steel-500/30 rounded-xl p-4 lg:p-6">
        <h3 className="text-steel-400 font-semibold mb-2">Pro Tip</h3>
        <p className="text-gray-300 text-sm">
          Track your change orders within 48 hours of the work being requested. Projects with quick CO documentation have 3x higher approval rates.
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;
