import React from 'react';
import { BarChart3, Crown, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const ReportsPage = () => {
  const { profile } = useAuthStore();
  const isElite = profile?.subscription_tier === 'elite';

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

  return (
    <div className="space-y-6" data-testid="reports-page">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Reports</h1>
        <p className="text-gray-400">Advanced analytics and KPI tracking</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-charcoal-800 rounded-xl p-4 lg:p-6 border border-charcoal-700">
          <TrendingUp className="w-6 h-6 text-success mb-2" />
          <p className="text-2xl font-bold text-white">18.4%</p>
          <p className="text-sm text-gray-500">Avg. Margin (MTD)</p>
          <p className="text-xs text-success mt-2">+2.1% vs last month</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl p-4 lg:p-6 border border-charcoal-700">
          <DollarSign className="w-6 h-6 text-steel-400 mb-2" />
          <p className="text-2xl font-bold text-white">$127K</p>
          <p className="text-sm text-gray-500">Revenue (MTD)</p>
          <p className="text-xs text-gray-400 mt-2">73% of target</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl p-4 lg:p-6 border border-charcoal-700">
          <BarChart3 className="w-6 h-6 text-steel-400 mb-2" />
          <p className="text-2xl font-bold text-white">94%</p>
          <p className="text-sm text-gray-500">CO Approval Rate</p>
          <p className="text-xs text-success mt-2">Above benchmark</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl p-4 lg:p-6 border border-charcoal-700">
          <AlertTriangle className="w-6 h-6 text-warning mb-2" />
          <p className="text-2xl font-bold text-warning">1</p>
          <p className="text-sm text-gray-500">At-Risk Projects</p>
          <p className="text-xs text-warning mt-2">Review recommended</p>
        </div>
      </div>

      {/* Placeholder for charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Monthly Revenue Trend</h2>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Chart visualization would go here
          </div>
        </div>
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Margin by Project</h2>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Chart visualization would go here
          </div>
        </div>
      </div>

      {/* Summary Report */}
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Monthly Performance Summary</h2>
        <div className="prose prose-invert max-w-none text-gray-400">
          <p>Your January 2026 performance summary will be generated at month-end with detailed insights on profitability, production efficiency, and recommendations for improvement.</p>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
