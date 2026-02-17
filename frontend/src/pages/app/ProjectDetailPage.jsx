import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, TrendingUp, DollarSign, FileText, ClipboardList } from 'lucide-react';

const ProjectDetailPage = () => {
  const { id } = useParams();

  // Placeholder - would fetch from Supabase
  const project = {
    id,
    name: 'Sample Project',
    client_gc: 'Sample Client',
    contract_value: 250000,
    approved_cos: 15000,
    cost_to_date: 125000,
    percent_complete: 45,
    forecast_margin: 18,
    risk_flag: 'green',
    notes: 'Project notes would appear here'
  };

  return (
    <div className="space-y-6" data-testid="project-detail-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          to="/app/projects" 
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-white">{project.name}</h1>
          <p className="text-gray-400">{project.client_gc}</p>
        </div>
        <button className="bg-charcoal-700 hover:bg-charcoal-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
          <Edit className="w-4 h-4" />
          Edit
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-charcoal-800 rounded-xl p-4 lg:p-6 border border-charcoal-700">
          <DollarSign className="w-6 h-6 text-steel-400 mb-2" />
          <p className="text-2xl font-bold text-white">${(project.contract_value / 1000).toFixed(0)}K</p>
          <p className="text-sm text-gray-500">Contract Value</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl p-4 lg:p-6 border border-charcoal-700">
          <FileText className="w-6 h-6 text-warning mb-2" />
          <p className="text-2xl font-bold text-white">${(project.approved_cos / 1000).toFixed(0)}K</p>
          <p className="text-sm text-gray-500">Approved COs</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl p-4 lg:p-6 border border-charcoal-700">
          <ClipboardList className="w-6 h-6 text-steel-400 mb-2" />
          <p className="text-2xl font-bold text-white">{project.percent_complete}%</p>
          <p className="text-sm text-gray-500">Complete</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl p-4 lg:p-6 border border-charcoal-700">
          <TrendingUp className="w-6 h-6 text-success mb-2" />
          <p className="text-2xl font-bold text-success">{project.forecast_margin}%</p>
          <p className="text-sm text-gray-500">Forecast Margin</p>
        </div>
      </div>

      {/* Placeholder content */}
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Project Details</h2>
        <p className="text-gray-400">Full project management features coming soon. This will include change orders, production logs, and financial tracking specific to this project.</p>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
