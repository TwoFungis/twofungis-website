import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  TrendingUp, 
  DollarSign, 
  FileText, 
  ClipboardList,
  Save,
  X,
  Trash2,
  AlertCircle,
  Calendar,
  MapPin,
  Building,
  Plus,
  Activity,
  Target
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import ProjectMilestones from '../../components/milestones/ProjectMilestones';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [changeOrders, setChangeOrders] = useState([]);
  const [productionLogs, setProductionLogs] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    client_gc: '',
    region: '',
    contract_value: '',
    approved_cos: '',
    cost_to_date: '',
    percent_complete: '',
    forecast_margin: '',
    risk_flag: 'green',
    status: 'active',
    notes: ''
  });

  const [activeTab, setActiveTab] = useState('overview');

  const fetchProject = useCallback(async () => {
    if (!user || !id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;
      
      setProject(data);
      setFormData({
        name: data.name || '',
        client_gc: data.client_gc || '',
        region: data.region || '',
        contract_value: data.contract_value || '',
        approved_cos: data.approved_cos || '',
        cost_to_date: data.cost_to_date || '',
        percent_complete: data.percent_complete || '',
        forecast_margin: data.forecast_margin || '',
        risk_flag: data.risk_flag || 'green',
        status: data.status || 'active',
        notes: data.notes || ''
      });
    } catch (err) {
      console.error('Error fetching project:', err);
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [user, id]);

  const fetchRelatedData = useCallback(async () => {
    if (!user || !id) return;
    
    try {
      // Fetch change orders
      const { data: coData } = await supabase
        .from('change_orders')
        .select('*')
        .eq('project_id', id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      setChangeOrders(coData || []);
      
      // Fetch production logs
      const { data: logData } = await supabase
        .from('production_logs')
        .select('*')
        .eq('project_id', id)
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })
        .limit(5);
      
      setProductionLogs(logData || []);
    } catch (err) {
      console.error('Error fetching related data:', err);
    }
  }, [user, id]);

  useEffect(() => {
    fetchProject();
    fetchRelatedData();
  }, [fetchProject, fetchRelatedData]);

  const handleSave = async () => {
    if (!user || !id) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Ensure we have a valid session before saving
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          throw new Error('Session expired. Please refresh the page and try again.');
        }
      }

      const { error: updateError } = await supabase
        .from('projects')
        .update({
          name: formData.name,
          client_gc: formData.client_gc,
          region: formData.region,
          contract_value: parseFloat(formData.contract_value) || 0,
          approved_cos: parseFloat(formData.approved_cos) || 0,
          cost_to_date: parseFloat(formData.cost_to_date) || 0,
          percent_complete: parseInt(formData.percent_complete) || 0,
          forecast_margin: parseFloat(formData.forecast_margin) || 0,
          risk_flag: formData.risk_flag,
          status: formData.status,
          notes: formData.notes
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) {
        if (updateError.message?.includes('JWT') || updateError.code === 'PGRST301') {
          throw new Error('Session expired. Please refresh the page and try again.');
        }
        throw updateError;
      }
      
      setIsEditing(false);
      fetchProject();
    } catch (err) {
      console.error('Error updating project:', err);
      const errorMessage = err.name === 'AbortError'
        ? 'Request was interrupted. Please try again.'
        : err.message || 'Failed to update project';
      setError('Failed to update project: ' + errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !id) return;
    
    try {
      // Ensure we have a valid session before deleting
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          throw new Error('Session expired. Please refresh the page and try again.');
        }
      }

      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) {
        if (deleteError.message?.includes('JWT') || deleteError.code === 'PGRST301') {
          throw new Error('Session expired. Please refresh the page and try again.');
        }
        throw deleteError;
      }
      
      navigate('/app/projects');
    } catch (err) {
      console.error('Error deleting project:', err);
      const errorMessage = err.name === 'AbortError'
        ? 'Request was interrupted. Please try again.'
        : err.message || 'Failed to delete project';
      setError('Failed to delete project: ' + errorMessage);
      setShowDeleteConfirm(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-CA', { 
      style: 'currency', 
      currency: 'CAD', 
      maximumFractionDigits: 0 
    }).format(value || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-CA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'green': return 'bg-success text-success';
      case 'yellow': return 'bg-warning text-warning';
      case 'red': return 'bg-risk text-risk';
      default: return 'bg-gray-500 text-gray-500';
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-success/20 text-success border-success/30',
      completed: 'bg-steel-500/20 text-steel-400 border-steel-500/30',
      on_hold: 'bg-warning/20 text-warning border-warning/30',
      cancelled: 'bg-risk/20 text-risk border-risk/30'
    };
    return colors[status] || colors.active;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-steel-500"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Project Not Found</h2>
        <p className="text-gray-400 mb-6">This project doesn't exist or you don't have access.</p>
        <Link 
          to="/app/projects" 
          className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="project-detail-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link 
          to="/app/projects" 
          className="text-gray-400 hover:text-white transition-colors w-fit"
          data-testid="back-to-projects"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl lg:text-3xl font-bold text-white truncate">{project.name}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(project.status)}`}>
              {project.status?.replace('_', ' ') || 'Active'}
            </span>
            <div className={`w-3 h-3 rounded-full ${getRiskColor(project.risk_flag).split(' ')[0]}`} title={`Risk: ${project.risk_flag}`} />
          </div>
          <div className="flex items-center gap-4 text-gray-400 text-sm mt-1 flex-wrap">
            {project.client_gc && (
              <span className="flex items-center gap-1">
                <Building className="w-4 h-4" />
                {project.client_gc}
              </span>
            )}
            {project.region && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {project.region}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Created {formatDate(project.created_at)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsEditing(true)}
            className="bg-charcoal-700 hover:bg-charcoal-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            data-testid="edit-project-btn"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-risk/20 hover:bg-risk/30 text-risk px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            data-testid="delete-project-btn"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-risk/20 border border-risk/50 text-risk p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-charcoal-800 rounded-xl p-4 lg:p-6 border border-charcoal-700">
          <DollarSign className="w-6 h-6 text-steel-400 mb-2" />
          <p className="text-2xl font-bold text-white" data-testid="contract-value">
            {formatCurrency(project.contract_value)}
          </p>
          <p className="text-sm text-gray-500">Contract Value</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl p-4 lg:p-6 border border-charcoal-700">
          <FileText className="w-6 h-6 text-warning mb-2" />
          <p className="text-2xl font-bold text-white" data-testid="approved-cos">
            {formatCurrency(project.approved_cos)}
          </p>
          <p className="text-sm text-gray-500">Approved COs</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl p-4 lg:p-6 border border-charcoal-700">
          <ClipboardList className="w-6 h-6 text-steel-400 mb-2" />
          <p className="text-2xl font-bold text-white" data-testid="percent-complete">
            {project.percent_complete || 0}%
          </p>
          <p className="text-sm text-gray-500">Complete</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl p-4 lg:p-6 border border-charcoal-700">
          <TrendingUp className="w-6 h-6 text-success mb-2" />
          <p className={`text-2xl font-bold ${(project.forecast_margin || 0) >= 15 ? 'text-success' : (project.forecast_margin || 0) >= 10 ? 'text-warning' : 'text-risk'}`} data-testid="forecast-margin">
            {project.forecast_margin || 0}%
          </p>
          <p className="text-sm text-gray-500">Forecast Margin</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">Project Progress</h3>
          <span className="text-steel-400 font-medium">{project.percent_complete || 0}%</span>
        </div>
        <div className="h-3 bg-charcoal-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-steel-600 to-steel-400 rounded-full transition-all"
            style={{ width: `${project.percent_complete || 0}%` }}
          />
        </div>
        <div className="flex justify-between mt-3 text-sm text-gray-500">
          <span>Cost to Date: {formatCurrency(project.cost_to_date)}</span>
          <span>Total Value: {formatCurrency((project.contract_value || 0) + (project.approved_cos || 0))}</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-charcoal-800 p-1 rounded-xl border border-charcoal-700">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'overview' 
              ? 'bg-steel-500 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-charcoal-700'
          }`}
          data-testid="tab-overview"
        >
          <ClipboardList className="w-4 h-4" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('milestones')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'milestones' 
              ? 'bg-steel-500 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-charcoal-700'
          }`}
          data-testid="tab-milestones"
        >
          <Target className="w-4 h-4" />
          Milestones
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'activity' 
              ? 'bg-steel-500 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-charcoal-700'
          }`}
          data-testid="tab-activity"
        >
          <Activity className="w-4 h-4" />
          Activity
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'milestones' && (
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
          <ProjectMilestones project={project} onMilestoneChange={fetchProject} />
        </div>
      )}

      {activeTab === 'overview' && (
        <>
          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-2 gap-6">
        {/* Change Orders */}
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-steel-400" />
              Recent Change Orders
            </h3>
            <Link 
              to={`/app/change-orders?project=${id}`}
              className="text-steel-400 hover:text-steel-300 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          {changeOrders.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm mb-3">No change orders yet</p>
              <Link 
                to={`/app/change-orders?new=true&project=${id}`}
                className="inline-flex items-center gap-2 text-steel-400 hover:text-steel-300 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Create Change Order
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {changeOrders.map((co) => (
                <div key={co.id} className="flex items-center justify-between p-3 bg-charcoal-700/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{co.co_number}</p>
                    <p className="text-gray-400 text-sm truncate max-w-[200px]">{co.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">{formatCurrency(co.total_value)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      co.status === 'approved' ? 'bg-success/20 text-success' :
                      co.status === 'paid' ? 'bg-steel-500/20 text-steel-400' :
                      co.status === 'rejected' ? 'bg-risk/20 text-risk' :
                      'bg-warning/20 text-warning'
                    }`}>
                      {co.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Production Logs */}
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-steel-400" />
              Recent Production Logs
            </h3>
            <Link 
              to={`/app/production?project=${id}`}
              className="text-steel-400 hover:text-steel-300 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          {productionLogs.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm mb-3">No production logs yet</p>
              <Link 
                to={`/app/production?new=true&project=${id}`}
                className="inline-flex items-center gap-2 text-steel-400 hover:text-steel-300 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Production Log
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {productionLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-charcoal-700/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{formatDate(log.log_date)}</p>
                    <p className="text-gray-400 text-sm">{log.crew_count} crew • {log.hours_worked}h</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">{log.units_installed} {log.unit_type}</p>
                    <p className="text-gray-400 text-sm truncate max-w-[150px]">{log.scope_completed}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {activeTab === 'overview' && project.notes && (
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
          <h3 className="font-semibold text-white mb-3">Notes</h3>
          <p className="text-gray-400 whitespace-pre-wrap">{project.notes}</p>
        </div>
      )}
        </>
      )}

      {activeTab === 'activity' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Change Orders */}
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-steel-400" />
                Recent Change Orders
              </h3>
              <Link 
                to={`/app/change-orders?project=${id}`}
                className="text-steel-400 hover:text-steel-300 text-sm font-medium"
              >
                View All
              </Link>
            </div>
            {changeOrders.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm mb-3">No change orders yet</p>
                <Link 
                  to={`/app/change-orders?new=true&project=${id}`}
                  className="inline-flex items-center gap-2 text-steel-400 hover:text-steel-300 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Create Change Order
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {changeOrders.map((co) => (
                  <div key={co.id} className="flex items-center justify-between p-3 bg-charcoal-700/50 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{co.co_number}</p>
                      <p className="text-gray-400 text-sm truncate max-w-[200px]">{co.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{formatCurrency(co.total_value)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        co.status === 'approved' ? 'bg-success/20 text-success' :
                        co.status === 'paid' ? 'bg-steel-500/20 text-steel-400' :
                        co.status === 'rejected' ? 'bg-risk/20 text-risk' :
                        'bg-warning/20 text-warning'
                      }`}>
                        {co.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Production Logs */}
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-steel-400" />
                Recent Production Logs
              </h3>
              <Link 
                to={`/app/production?project=${id}`}
                className="text-steel-400 hover:text-steel-300 text-sm font-medium"
              >
                View All
              </Link>
            </div>
            {productionLogs.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm mb-3">No production logs yet</p>
                <Link 
                  to={`/app/production?new=true&project=${id}`}
                  className="inline-flex items-center gap-2 text-steel-400 hover:text-steel-300 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Production Log
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {productionLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-charcoal-700/50 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{formatDate(log.log_date)}</p>
                      <p className="text-gray-400 text-sm">{log.crew_count} crew • {log.hours_worked}h</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{log.units_installed} {log.unit_type}</p>
                      <p className="text-gray-400 text-sm truncate max-w-[150px]">{log.scope_completed}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsEditing(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-2xl mx-auto bg-charcoal-800 rounded-2xl border border-charcoal-700 p-6 z-50 max-h-[90vh] overflow-y-auto" data-testid="edit-project-modal">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Edit Project</h2>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Project Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
                  required
                  data-testid="edit-project-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Client / GC</label>
                  <input
                    type="text"
                    value={formData.client_gc}
                    onChange={(e) => setFormData({ ...formData, client_gc: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Region</label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
                  >
                    <option value="">Select region</option>
                    <option value="BC">British Columbia</option>
                    <option value="AB">Alberta</option>
                    <option value="ON">Ontario</option>
                    <option value="QC">Quebec</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Contract Value</label>
                  <input
                    type="number"
                    value={formData.contract_value}
                    onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Approved COs</label>
                  <input
                    type="number"
                    value={formData.approved_cos}
                    onChange={(e) => setFormData({ ...formData, approved_cos: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Cost to Date</label>
                  <input
                    type="number"
                    value={formData.cost_to_date}
                    onChange={(e) => setFormData({ ...formData, cost_to_date: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">% Complete</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.percent_complete}
                    onChange={(e) => setFormData({ ...formData, percent_complete: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Forecast Margin %</label>
                  <input
                    type="number"
                    value={formData.forecast_margin}
                    onChange={(e) => setFormData({ ...formData, forecast_margin: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Risk Flag</label>
                  <select
                    value={formData.risk_flag}
                    onChange={(e) => setFormData({ ...formData, risk_flag: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
                  >
                    <option value="green">Green - On Track</option>
                    <option value="yellow">Yellow - Attention Needed</option>
                    <option value="red">Red - At Risk</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors h-24 resize-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-charcoal-700 hover:bg-charcoal-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-steel-500 hover:bg-steel-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  data-testid="save-project-btn"
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowDeleteConfirm(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-charcoal-800 rounded-2xl border border-charcoal-700 p-6 z-50" data-testid="delete-confirm-modal">
            <div className="text-center">
              <div className="w-12 h-12 bg-risk/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-risk" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Project?</h3>
              <p className="text-gray-400 mb-6">
                Are you sure you want to delete "{project.name}"? This will also delete all related change orders and production logs. This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-charcoal-700 hover:bg-charcoal-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-risk hover:bg-risk/80 text-white py-3 rounded-lg font-medium transition-colors"
                  data-testid="confirm-delete-btn"
                >
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectDetailPage;
