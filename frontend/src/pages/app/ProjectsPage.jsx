import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  FolderKanban,
  TrendingUp,
  X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

const ProjectsPage = () => {
  const [searchParams] = useSearchParams();
  const showNewModal = searchParams.get('new') === 'true';
  const [isModalOpen, setIsModalOpen] = useState(showNewModal);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    client_gc: '',
    region: '',
    contract_value: '',
    notes: ''
  });

  const fetchProjects = React.useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  }, [user]);

  React.useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase.from('projects').insert({
      user_id: user.id,
      name: formData.name,
      client_gc: formData.client_gc,
      region: formData.region,
      contract_value: parseFloat(formData.contract_value) || 0,
      notes: formData.notes,
      approved_cos: 0,
      cost_to_date: 0,
      percent_complete: 0,
      forecast_margin: 20,
      risk_flag: 'green'
    });

    if (error) {
      console.error('Error creating project:', error);
    } else {
      setFormData({ name: '', client_gc: '', region: '', contract_value: '', notes: '' });
      setIsModalOpen(false);
      fetchProjects();
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.client_gc?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'green': return 'bg-success';
      case 'yellow': return 'bg-warning';
      case 'red': return 'bg-risk';
      default: return 'bg-gray-500';
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="space-y-6" data-testid="projects-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Projects</h1>
          <p className="text-gray-400">Manage and track all your active projects</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 w-fit"
          data-testid="new-project-btn"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-charcoal-800 border border-charcoal-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
            data-testid="search-projects-input"
          />
        </div>
        <button className="bg-charcoal-800 border border-charcoal-700 rounded-lg px-4 py-3 text-gray-400 hover:text-white hover:border-charcoal-600 transition-colors">
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-steel-500"></div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-12 text-center">
          <FolderKanban className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No projects yet</h3>
          <p className="text-gray-400 mb-6">Create your first project to start tracking</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              to={`/app/projects/${project.id}`}
              className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-4 lg:p-6 hover:border-charcoal-600 transition-colors block"
              data-testid={`project-card-${project.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white truncate">{project.name}</h3>
                    <div className={`w-3 h-3 rounded-full ${getRiskColor(project.risk_flag)}`} />
                  </div>
                  <p className="text-gray-400 text-sm mb-4">{project.client_gc || 'No client specified'}</p>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Contract Value</p>
                      <p className="text-white font-medium">{formatCurrency(project.contract_value)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Approved COs</p>
                      <p className="text-white font-medium">{formatCurrency(project.approved_cos)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">% Complete</p>
                      <p className="text-white font-medium">{project.percent_complete}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Forecast Margin</p>
                      <p className={`font-medium ${project.forecast_margin >= 15 ? 'text-success' : project.forecast_margin >= 10 ? 'text-warning' : 'text-risk'}`}>
                        {project.forecast_margin}%
                      </p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={(e) => e.preventDefault()}
                  className="text-gray-500 hover:text-white p-2 rounded-lg hover:bg-charcoal-700 transition-colors"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="h-2 bg-charcoal-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-steel-500 rounded-full transition-all"
                    style={{ width: `${project.percent_complete}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* New Project Modal */}
      {isModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsModalOpen(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto bg-charcoal-800 rounded-2xl border border-charcoal-700 p-6 z-50" data-testid="new-project-modal">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">New Project</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Project Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
                  placeholder="e.g., Downtown Office Tower"
                  required
                  data-testid="project-name-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Client / GC</label>
                <input
                  type="text"
                  value={formData.client_gc}
                  onChange={(e) => setFormData({ ...formData, client_gc: e.target.value })}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
                  placeholder="e.g., Ledcor Construction"
                  data-testid="project-client-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Region</label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
                    data-testid="project-region-select"
                  >
                    <option value="">Select region</option>
                    <option value="BC">British Columbia</option>
                    <option value="AB">Alberta</option>
                    <option value="ON">Ontario</option>
                    <option value="QC">Quebec</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Contract Value</label>
                  <input
                    type="number"
                    value={formData.contract_value}
                    onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
                    placeholder="0"
                    data-testid="project-value-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors h-24 resize-none"
                  placeholder="Project notes..."
                  data-testid="project-notes-input"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-charcoal-700 hover:bg-charcoal-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-steel-500 hover:bg-steel-600 text-white py-3 rounded-lg font-medium transition-colors"
                  data-testid="create-project-submit-btn"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectsPage;
