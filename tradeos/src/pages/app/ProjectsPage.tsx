import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

interface Project {
  id: string;
  name: string;
  client_gc: string;
  region: string;
  contract_value: number;
  approved_cos: number;
  cost_to_date: number;
  percent_complete: number;
  forecast_margin: number;
  risk_flag: 'green' | 'yellow' | 'red';
  notes: string;
  created_at: string;
}

const ProjectsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const showNew = searchParams.get('new') === 'true';
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(showNew);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    client_gc: '',
    region: '',
    contract_value: 0,
    percent_complete: 0,
    forecast_margin: 20,
    risk_flag: 'green' as const,
    notes: '',
  });

  useEffect(() => {
    if (user) fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) setProjects(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProject) {
      await supabase
        .from('projects')
        .update(formData)
        .eq('id', editingProject.id);
    } else {
      await supabase
        .from('projects')
        .insert({ ...formData, user_id: user?.id, approved_cos: 0, cost_to_date: 0 });
    }
    
    setShowModal(false);
    setEditingProject(null);
    setFormData({ name: '', client_gc: '', region: '', contract_value: 0, percent_complete: 0, forecast_margin: 20, risk_flag: 'green', notes: '' });
    fetchProjects();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this project?')) {
      await supabase.from('projects').delete().eq('id', id);
      fetchProjects();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(value);
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.client_gc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Projects</h1>
        <button
          onClick={() => { setEditingProject(null); setShowModal(true); }}
          className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-charcoal-800 border border-charcoal-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:border-steel-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-steel-500"></div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-12 text-center">
          <p className="text-gray-400 mb-4">No projects found</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Link to={`/app/projects/${project.id}`} className="text-xl font-semibold text-white hover:text-steel-400">
                    {project.name}
                  </Link>
                  <p className="text-gray-400">{project.client_gc} • {project.region}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${
                    project.risk_flag === 'green' ? 'bg-success' :
                    project.risk_flag === 'yellow' ? 'bg-warning' : 'bg-risk'
                  }`} />
                  <button
                    onClick={() => { setEditingProject(project); setFormData(project); setShowModal(true); }}
                    className="p-2 hover:bg-charcoal-700 rounded-lg text-gray-400 hover:text-white"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-2 hover:bg-charcoal-700 rounded-lg text-gray-400 hover:text-risk"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-gray-500 text-sm">Contract Value</p>
                  <p className="text-white font-semibold">{formatCurrency(project.contract_value)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Progress</p>
                  <p className="text-white font-semibold">{project.percent_complete}%</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Forecast Margin</p>
                  <p className="text-white font-semibold">{project.forecast_margin}%</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Approved COs</p>
                  <p className="text-white font-semibold">{formatCurrency(project.approved_cos || 0)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-charcoal-700">
              <h2 className="text-xl font-semibold text-white">
                {editingProject ? 'Edit Project' : 'New Project'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Project Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Client/GC</label>
                  <input
                    type="text"
                    value={formData.client_gc}
                    onChange={(e) => setFormData({...formData, client_gc: e.target.value})}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Region</label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({...formData, region: e.target.value})}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Contract Value</label>
                  <input
                    type="number"
                    value={formData.contract_value}
                    onChange={(e) => setFormData({...formData, contract_value: parseFloat(e.target.value) || 0})}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Forecast Margin %</label>
                  <input
                    type="number"
                    value={formData.forecast_margin}
                    onChange={(e) => setFormData({...formData, forecast_margin: parseFloat(e.target.value) || 0})}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">% Complete</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.percent_complete}
                    onChange={(e) => setFormData({...formData, percent_complete: parseFloat(e.target.value) || 0})}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Risk Flag</label>
                  <select
                    value={formData.risk_flag}
                    onChange={(e) => setFormData({...formData, risk_flag: e.target.value as any})}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="green">Green - On Track</option>
                    <option value="yellow">Yellow - Needs Attention</option>
                    <option value="red">Red - At Risk</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingProject(null); }}
                  className="flex-1 bg-charcoal-700 hover:bg-charcoal-600 text-white py-2 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-steel-500 hover:bg-steel-600 text-white py-2 rounded-lg font-medium"
                >
                  {editingProject ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
