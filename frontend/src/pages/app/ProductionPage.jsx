import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  ClipboardList, 
  Plus, 
  Calendar, 
  Users, 
  CheckSquare, 
  X,
  Search,
  Trash2,
  Edit2,
  Save,
  Clock,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

const ProductionPage = () => {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const showNewModal = searchParams.get('new') === 'true';
  
  const [logs, setLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(showNewModal);
  const [editingLog, setEditingLog] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    project_id: '',
    log_date: new Date().toISOString().split('T')[0],
    crew_count: '',
    hours_worked: '',
    scope_completed: '',
    units_installed: '',
    unit_type: 'SF',
    issues_notes: ''
  });

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('production_logs')
        .select('*, projects(name)')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false });

      if (fetchError) {
        if (fetchError.code === '42P01') {
          setError('Database tables not yet created.');
        } else {
          throw fetchError;
        }
      } else {
        setLogs(data || []);
      }
    } catch (err) {
      console.error('Error fetching production logs:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('projects')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('name');
      
      setProjects(data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchLogs();
    fetchProjects();
  }, [fetchLogs, fetchProjects]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setError(null);

    try {
      const logData = {
        user_id: user.id,
        project_id: formData.project_id || null,
        log_date: formData.log_date,
        crew_count: parseInt(formData.crew_count) || 0,
        hours_worked: parseFloat(formData.hours_worked) || 0,
        scope_completed: formData.scope_completed,
        units_installed: parseFloat(formData.units_installed) || 0,
        unit_type: formData.unit_type,
        issues_notes: formData.issues_notes
      };

      if (editingLog) {
        const { error: updateError } = await supabase
          .from('production_logs')
          .update(logData)
          .eq('id', editingLog.id)
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('production_logs')
          .insert(logData);

        if (insertError) throw insertError;
      }

      resetForm();
      fetchLogs();
    } catch (err) {
      console.error('Error saving production log:', err);
      setError(err.message || 'Failed to save production log');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this production log?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('production_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;
      fetchLogs();
    } catch (err) {
      console.error('Error deleting production log:', err);
      setError('Failed to delete production log');
    }
  };

  const openEditModal = (log) => {
    setEditingLog(log);
    setFormData({
      project_id: log.project_id || '',
      log_date: log.log_date || new Date().toISOString().split('T')[0],
      crew_count: log.crew_count?.toString() || '',
      hours_worked: log.hours_worked?.toString() || '',
      scope_completed: log.scope_completed || '',
      units_installed: log.units_installed?.toString() || '',
      unit_type: log.unit_type || 'SF',
      issues_notes: log.issues_notes || ''
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      project_id: '',
      log_date: new Date().toISOString().split('T')[0],
      crew_count: '',
      hours_worked: '',
      scope_completed: '',
      units_installed: '',
      unit_type: 'SF',
      issues_notes: ''
    });
    setEditingLog(null);
    setIsModalOpen(false);
    setError(null);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-CA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredLogs = logs.filter(log => 
    log.scope_completed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.projects?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate today's stats
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(log => log.log_date === today);
  const todayHours = todayLogs.reduce((sum, log) => sum + (parseFloat(log.hours_worked) || 0), 0);
  const todayUnits = todayLogs.reduce((sum, log) => sum + (parseFloat(log.units_installed) || 0), 0);
  const todayIssues = todayLogs.filter(log => log.issues_notes && log.issues_notes.trim()).length;

  return (
    <div className="space-y-6" data-testid="production-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Production Logs</h1>
          <p className="text-gray-400">Track daily crew production and progress</p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 w-fit"
          data-testid="new-log-btn"
        >
          <Plus className="w-5 h-5" />
          New Daily Log
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-risk/20 border border-risk/50 text-risk p-4 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-charcoal-800 rounded-xl p-4 border border-charcoal-700">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Today</span>
          </div>
          <p className="text-2xl font-bold text-charcoal-800">{todayLogs.length}</p>
          <p className="text-sm text-gray-400">Logs entered</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl p-4 border border-charcoal-700">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">Crew Hours</span>
          </div>
          <p className="text-2xl font-bold text-charcoal-800">{todayHours}</p>
          <p className="text-sm text-gray-400">Today</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl p-4 border border-charcoal-700">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <CheckSquare className="w-4 h-4" />
            <span className="text-sm">Units</span>
          </div>
          <p className="text-2xl font-bold text-charcoal-800">{todayUnits.toLocaleString()}</p>
          <p className="text-sm text-gray-400">Installed today</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl p-4 border border-charcoal-700">
          <div className="flex items-center gap-2 text-warning mb-2">
            <ClipboardList className="w-4 h-4" />
            <span className="text-sm">Issues</span>
          </div>
          <p className="text-2xl font-bold text-warning">{todayIssues}</p>
          <p className="text-sm text-gray-400">Reported</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search production logs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-charcoal-800 border border-charcoal-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
        />
      </div>

      {/* Logs List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-steel-500"></div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-12 text-center">
          <ClipboardList className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Production Logs Yet</h3>
          <p className="text-gray-400 mb-6">Track your daily crew production and progress</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Daily Log
          </button>
        </div>
      ) : (
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700">
          <div className="p-4 lg:p-6 border-b border-charcoal-700">
            <h2 className="text-lg font-semibold text-white">Recent Logs</h2>
          </div>
          <div className="divide-y divide-charcoal-700">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 lg:p-6 hover:bg-charcoal-700/50 transition-colors" data-testid={`log-row-${log.id}`}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm text-gray-500">{formatDate(log.log_date)}</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-sm text-gray-400">{log.projects?.name || 'No Project'}</span>
                    </div>
                    <p className="text-white font-medium mb-2">{log.scope_completed || 'No scope specified'}</p>
                    {log.issues_notes && (
                      <p className="text-warning text-sm">Issue: {log.issues_notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <p className="text-gray-500">Crew</p>
                      <p className="text-white font-medium">{log.crew_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Hours</p>
                      <p className="text-white font-medium">{log.hours_worked || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Units</p>
                      <p className="text-white font-medium">{log.units_installed || 0} {log.unit_type}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(log)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-charcoal-600 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="p-2 text-gray-400 hover:text-risk hover:bg-risk/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={resetForm} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto bg-charcoal-800 rounded-2xl border border-charcoal-700 p-6 z-50 max-h-[90vh] overflow-y-auto" data-testid="log-modal">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingLog ? 'Edit Production Log' : 'New Daily Log'}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Project</label>
                  <select
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                  >
                    <option value="">Select project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.log_date}
                    onChange={(e) => setFormData({ ...formData, log_date: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Scope Completed *</label>
                <textarea
                  value={formData.scope_completed}
                  onChange={(e) => setFormData({ ...formData, scope_completed: e.target.value })}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 h-20 resize-none"
                  placeholder="Describe work completed..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Crew Count</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.crew_count}
                    onChange={(e) => setFormData({ ...formData, crew_count: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Hours Worked</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.hours_worked}
                    onChange={(e) => setFormData({ ...formData, hours_worked: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Units Installed</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.units_installed}
                    onChange={(e) => setFormData({ ...formData, units_installed: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Unit Type</label>
                  <select
                    value={formData.unit_type}
                    onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                  >
                    <option value="SF">SF (Square Feet)</option>
                    <option value="LF">LF (Linear Feet)</option>
                    <option value="EA">EA (Each)</option>
                    <option value="HR">HR (Hours)</option>
                    <option value="M2">M² (Square Meters)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Issues / Notes</label>
                <textarea
                  value={formData.issues_notes}
                  onChange={(e) => setFormData({ ...formData, issues_notes: e.target.value })}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 h-16 resize-none"
                  placeholder="Any issues encountered..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-charcoal-700 hover:bg-charcoal-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-steel-500 hover:bg-steel-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  data-testid="save-log-btn"
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {editingLog ? 'Update' : 'Create'} Log
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductionPage;
