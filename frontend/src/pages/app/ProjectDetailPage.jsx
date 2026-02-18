import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, TrendingUp, DollarSign, FileText, ClipboardList,
  Save, X, Trash2, AlertCircle, Calendar, MapPin, Building, Plus,
  Activity, Target, Receipt, Wallet, Flag, FolderOpen, Clock, Package
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import MaterialsTab from '../../components/project/MaterialsTab';

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
  
  // Related data
  const [changeOrders, setChangeOrders] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [productionLogs, setProductionLogs] = useState([]);
  
  const [activeTab, setActiveTab] = useState('overview');
  
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
      const [coRes, msRes, invRes, expRes, logRes] = await Promise.all([
        supabase.from('change_orders').select('*').eq('project_id', id).eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('project_milestones').select('*').eq('project_id', id).eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('invoices').select('*').eq('project_id', id).eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').eq('project_id', id).eq('user_id', user.id).order('expense_date', { ascending: false }),
        supabase.from('production_logs').select('*').eq('project_id', id).eq('user_id', user.id).order('log_date', { ascending: false }).limit(10)
      ]);
      
      setChangeOrders(coRes.data || []);
      setMilestones(msRes.data || []);
      setInvoices(invRes.data || []);
      setExpenses(expRes.data || []);
      setProductionLogs(logRes.data || []);
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

      if (updateError) throw updateError;
      
      setIsEditing(false);
      fetchProject();
    } catch (err) {
      console.error('Error updating project:', err);
      setError('Failed to update project');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !id) return;
    
    try {
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;
      navigate('/app/projects');
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project');
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

  // Financial calculations
  const originalContract = parseFloat(project?.contract_value) || 0;
  const approvedCOsTotal = changeOrders.filter(co => co.status === 'approved').reduce((sum, co) => sum + (parseFloat(co.total_value) || 0), 0);
  const totalRevenue = originalContract + approvedCOsTotal;
  const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const totalLabor = expenses.filter(e => e.category === 'labor').reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const forecastProfit = totalRevenue - totalExpenses;
  const forecastMargin = totalRevenue > 0 ? (forecastProfit / totalRevenue) * 100 : 0;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ClipboardList },
    { id: 'materials', label: 'Materials', icon: Package },
    { id: 'milestones', label: 'Milestones', icon: Flag, count: milestones.length },
    { id: 'invoices', label: 'Invoices', icon: Receipt, count: invoices.length },
    { id: 'change-orders', label: 'Change Orders', icon: FileText, count: changeOrders.length },
    { id: 'expenses', label: 'Expenses', icon: Wallet, count: expenses.length },
    { id: 'documents', label: 'Documents', icon: FolderOpen },
    { id: 'activity', label: 'Activity', icon: Activity }
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-steel-500"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-risk mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-charcoal-800 mb-2">Error</h2>
        <p className="text-charcoal-500">{error || 'Project not found'}</p>
        <Link to="/app/projects" className="mt-4 inline-block text-steel-400 hover:text-steel-300">
          ← Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="project-detail-page">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/app/projects" className="text-charcoal-500 hover:text-charcoal-800 text-sm flex items-center gap-1 mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </Link>
          <h1 className="text-2xl font-bold text-charcoal-800">{project.name}</h1>
          <p className="text-charcoal-500">{project.client_gc || 'No client'}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm border ${
            project.status === 'active' ? 'bg-success/20 text-success border-success/30' :
            project.status === 'completed' ? 'bg-steel-500/20 text-steel-400 border-steel-500/30' :
            'bg-warning/20 text-warning border-warning/30'
          }`}>
            {project.status}
          </span>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-cloud-200 hover:bg-cloud-100 text-charcoal-800 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"
            >
              <Edit className="w-4 h-4" /> Edit
            </button>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* FINANCIAL HEALTH PANEL */}
      {/* ============================================ */}
      <div className="bg-white rounded-xl border border-cloud-300 p-6" data-testid="financial-health-panel">
        <h2 className="text-sm font-semibold text-charcoal-500 uppercase tracking-wider mb-4">Financial Health</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div>
            <p className="text-xs text-charcoal-400 mb-1">Original Contract</p>
            <p className="text-xl font-bold text-charcoal-800">{formatCurrency(originalContract)}</p>
          </div>
          <div>
            <p className="text-xs text-charcoal-400 mb-1">Approved COs</p>
            <p className="text-xl font-bold text-warning">{formatCurrency(approvedCOsTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-charcoal-400 mb-1">Total Revenue</p>
            <p className="text-xl font-bold text-steel-400">{formatCurrency(totalRevenue)}</p>
          </div>
          <div>
            <p className="text-xs text-charcoal-400 mb-1">Total Expenses</p>
            <p className="text-xl font-bold text-risk">{formatCurrency(totalExpenses)}</p>
          </div>
          <div>
            <p className="text-xs text-charcoal-400 mb-1">Total Labor</p>
            <p className="text-xl font-bold text-gray-300">{formatCurrency(totalLabor)}</p>
          </div>
          <div>
            <p className="text-xs text-charcoal-400 mb-1">Gross Profit</p>
            <p className={`text-xl font-bold ${forecastProfit >= 0 ? 'text-success' : 'text-risk'}`}>
              {formatCurrency(forecastProfit)}
            </p>
          </div>
          <div>
            <p className="text-xs text-charcoal-400 mb-1">Margin</p>
            <p className={`text-xl font-bold ${forecastMargin >= 15 ? 'text-success' : forecastMargin >= 10 ? 'text-warning' : 'text-risk'}`}>
              {forecastMargin.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-charcoal-400 mb-1">
            <span>Completion: {project.percent_complete || 0}%</span>
            <span>{formatCurrency(totalRevenue)} total</span>
          </div>
          <div className="h-2 bg-cloud-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-steel-500 rounded-full transition-all"
              style={{ width: `${project.percent_complete || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* TABS NAVIGATION */}
      {/* ============================================ */}
      <div className="border-b border-cloud-300">
        <nav className="flex gap-1 overflow-x-auto pb-px">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-steel-500 text-steel-400'
                  : 'border-transparent text-charcoal-500 hover:text-charcoal-800 hover:border-gray-600'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="bg-cloud-200 text-charcoal-500 text-xs px-1.5 py-0.5 rounded">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* ============================================ */}
      {/* TAB CONTENT */}
      {/* ============================================ */}
      <div className="min-h-[400px]">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Project Details */}
            <div className="bg-white rounded-xl border border-cloud-300 p-6">
              <h3 className="font-semibold text-charcoal-800 mb-4">Project Details</h3>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-charcoal-500 mb-1">Project Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-cloud-200 border border-charcoal-600 rounded-lg px-3 py-2 text-charcoal-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-charcoal-500 mb-1">Client/GC</label>
                    <input
                      type="text"
                      value={formData.client_gc}
                      onChange={(e) => setFormData({ ...formData, client_gc: e.target.value })}
                      className="w-full bg-cloud-200 border border-charcoal-600 rounded-lg px-3 py-2 text-charcoal-800"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-charcoal-500 mb-1">Contract Value</label>
                      <input
                        type="number"
                        value={formData.contract_value}
                        onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
                        className="w-full bg-cloud-200 border border-charcoal-600 rounded-lg px-3 py-2 text-charcoal-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-charcoal-500 mb-1">Forecast Margin %</label>
                      <input
                        type="number"
                        value={formData.forecast_margin}
                        onChange={(e) => setFormData({ ...formData, forecast_margin: e.target.value })}
                        className="w-full bg-cloud-200 border border-charcoal-600 rounded-lg px-3 py-2 text-charcoal-800"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-charcoal-500 mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full bg-cloud-200 border border-charcoal-600 rounded-lg px-3 py-2 text-charcoal-800"
                      >
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="on_hold">On Hold</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-charcoal-500 mb-1">Risk Level</label>
                      <select
                        value={formData.risk_flag}
                        onChange={(e) => setFormData({ ...formData, risk_flag: e.target.value })}
                        className="w-full bg-cloud-200 border border-charcoal-600 rounded-lg px-3 py-2 text-charcoal-800"
                      >
                        <option value="green">Low Risk</option>
                        <option value="yellow">Medium Risk</option>
                        <option value="red">High Risk</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-charcoal-500 mb-1">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full bg-cloud-200 border border-charcoal-600 rounded-lg px-3 py-2 text-charcoal-800 resize-none"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-steel-500 hover:bg-steel-600 text-charcoal-800 px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                    >
                      {isSaving ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-charcoal-500 hover:text-charcoal-800 px-4 py-2"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="ml-auto text-risk hover:text-risk/80 px-4 py-2 flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-charcoal-400">Client/GC</p>
                      <p className="text-charcoal-800">{project.client_gc || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-charcoal-400">Region</p>
                      <p className="text-charcoal-800">{project.region || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-charcoal-400">Created</p>
                      <p className="text-charcoal-800">{formatDate(project.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-charcoal-400">Completion</p>
                      <p className="text-charcoal-800">{project.percent_complete || 0}%</p>
                    </div>
                  </div>
                  {project.notes && (
                    <div>
                      <p className="text-xs text-charcoal-400">Notes</p>
                      <p className="text-charcoal-800 text-sm mt-1">{project.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-cloud-300 p-6">
              <h3 className="font-semibold text-charcoal-800 mb-4">Recent Activity</h3>
              {productionLogs.length === 0 ? (
                <p className="text-charcoal-400 text-sm text-center py-8">No activity recorded</p>
              ) : (
                <div className="space-y-3">
                  {productionLogs.slice(0, 5).map(log => (
                    <div key={log.id} className="flex items-start gap-3 p-3 bg-cloud-100 rounded-lg">
                      <div className="w-8 h-8 bg-cloud-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <Activity className="w-4 h-4 text-charcoal-500" />
                      </div>
                      <div>
                        <p className="text-sm text-charcoal-800">{log.notes || 'Activity recorded'}</p>
                        <p className="text-xs text-charcoal-400">{formatDate(log.log_date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Milestones Tab */}
        {activeTab === 'milestones' && (
          <div className="bg-white rounded-xl border border-cloud-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-charcoal-800">Milestones</h3>
              <Link to="/app/milestones" className="text-sm text-steel-400 hover:text-steel-300">
                Manage Milestones →
              </Link>
            </div>
            {milestones.length === 0 ? (
              <p className="text-charcoal-400 text-center py-8">No milestones for this project</p>
            ) : (
              <div className="space-y-3">
                {milestones.map(ms => (
                  <div key={ms.id} className="flex items-center justify-between p-4 bg-cloud-100 rounded-lg">
                    <div>
                      <p className="text-charcoal-800 font-medium">{ms.name}</p>
                      <p className="text-xs text-charcoal-400">{ms.due_date ? formatDate(ms.due_date) : 'No due date'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-charcoal-800 font-semibold">{formatCurrency(ms.amount)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        ms.status === 'paid' ? 'bg-success/20 text-success' :
                        ms.status === 'invoiced' ? 'bg-purple-500/20 text-purple-400' :
                        ms.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        'bg-gray-500/20 text-charcoal-500'
                      }`}>{ms.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="bg-white rounded-xl border border-cloud-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-charcoal-800">Invoices</h3>
              <Link to="/app/invoices" className="text-sm text-steel-400 hover:text-steel-300">
                Manage Invoices →
              </Link>
            </div>
            {invoices.length === 0 ? (
              <p className="text-charcoal-400 text-center py-8">No invoices for this project</p>
            ) : (
              <div className="space-y-3">
                {invoices.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between p-4 bg-cloud-100 rounded-lg">
                    <div>
                      <p className="text-charcoal-800 font-medium font-mono">{inv.invoice_number}</p>
                      <p className="text-xs text-charcoal-400">{inv.client_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-charcoal-800 font-semibold">{formatCurrency(inv.total)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        inv.status === 'paid' ? 'bg-success/20 text-success' :
                        inv.status === 'sent' ? 'bg-blue-500/20 text-blue-400' :
                        inv.status === 'overdue' ? 'bg-risk/20 text-risk' :
                        'bg-gray-500/20 text-charcoal-500'
                      }`}>{inv.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Change Orders Tab */}
        {activeTab === 'change-orders' && (
          <div className="bg-white rounded-xl border border-cloud-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-charcoal-800">Change Orders</h3>
              <Link to="/app/change-orders" className="text-sm text-steel-400 hover:text-steel-300">
                Manage COs →
              </Link>
            </div>
            {changeOrders.length === 0 ? (
              <p className="text-charcoal-400 text-center py-8">No change orders for this project</p>
            ) : (
              <div className="space-y-3">
                {changeOrders.map(co => (
                  <div key={co.id} className="flex items-center justify-between p-4 bg-cloud-100 rounded-lg">
                    <div>
                      <p className="text-charcoal-800 font-medium">{co.title || `CO-${co.co_number}`}</p>
                      <p className="text-xs text-charcoal-400">{formatDate(co.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-warning font-semibold">{formatCurrency(co.total_value)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        co.status === 'approved' ? 'bg-success/20 text-success' :
                        co.status === 'pending' ? 'bg-warning/20 text-warning' :
                        'bg-gray-500/20 text-charcoal-500'
                      }`}>{co.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <div className="bg-white rounded-xl border border-cloud-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-charcoal-800">Expenses</h3>
              <Link to="/app/expenses" className="text-sm text-steel-400 hover:text-steel-300">
                Manage Expenses →
              </Link>
            </div>
            {expenses.length === 0 ? (
              <p className="text-charcoal-400 text-center py-8">No expenses for this project</p>
            ) : (
              <div className="space-y-3">
                {expenses.map(exp => (
                  <div key={exp.id} className="flex items-center justify-between p-4 bg-cloud-100 rounded-lg">
                    <div>
                      <p className="text-charcoal-800 font-medium">{exp.description}</p>
                      <p className="text-xs text-charcoal-400">{exp.category} • {formatDate(exp.expense_date)}</p>
                    </div>
                    <p className="text-risk font-semibold">{formatCurrency(exp.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-xl border border-cloud-300 p-6">
            <h3 className="font-semibold text-charcoal-800 mb-4">Documents</h3>
            <p className="text-charcoal-400 text-center py-8">
              Document management coming soon.
              <br />
              <Link to="/app/documents" className="text-steel-400 hover:text-steel-300">
                Go to Document Vault →
              </Link>
            </p>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="bg-white rounded-xl border border-cloud-300 p-6">
            <h3 className="font-semibold text-charcoal-800 mb-4">Activity Log</h3>
            {productionLogs.length === 0 ? (
              <p className="text-charcoal-400 text-center py-8">No activity recorded for this project</p>
            ) : (
              <div className="space-y-3">
                {productionLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-3 p-4 bg-cloud-100 rounded-lg">
                    <div className="w-10 h-10 bg-cloud-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <Activity className="w-5 h-5 text-charcoal-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-charcoal-800">{log.notes || 'Activity recorded'}</p>
                      <p className="text-xs text-charcoal-400 mt-1">{formatDate(log.log_date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-cloud-300 p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-charcoal-800 mb-2">Delete Project?</h3>
            <p className="text-charcoal-500 mb-6">
              This will permanently delete "{project.name}" and all associated data. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 text-charcoal-500 hover:text-charcoal-800 border border-charcoal-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-risk hover:bg-risk/80 text-charcoal-800 px-4 py-2 rounded-lg font-medium"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPage;
