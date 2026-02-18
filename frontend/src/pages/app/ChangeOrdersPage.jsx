import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  Check, 
  Clock, 
  AlertTriangle, 
  X,
  Search,
  DollarSign,
  Trash2,
  Edit2,
  Save
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

const ChangeOrdersPage = () => {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const showNewModal = searchParams.get('new') === 'true';
  
  const [changeOrders, setChangeOrders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(showNewModal);
  const [editingCO, setEditingCO] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    project_id: '',
    co_number: '',
    description: '',
    total_value: '',
    labor_cost: '',
    material_cost: '',
    status: 'pending',
    notes: ''
  });

  const fetchChangeOrders = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('change_orders')
        .select('*, projects(name, client_gc)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        if (fetchError.code === '42P01') {
          setError('Database tables not yet created.');
        } else {
          throw fetchError;
        }
      } else {
        setChangeOrders(data || []);
      }
    } catch (err) {
      console.error('Error fetching change orders:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('projects')
        .select('id, name, contract_value, forecast_margin')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('name');
      
      setProjects(data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchChangeOrders();
    fetchProjects();
  }, [fetchChangeOrders, fetchProjects]);

  const generateCONumber = () => {
    const count = changeOrders.length + 1;
    return `CO-${String(count).padStart(3, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setError(null);

    try {
      const coData = {
        user_id: user.id,
        project_id: formData.project_id || null,
        co_number: formData.co_number || generateCONumber(),
        description: formData.description,
        total_value: parseFloat(formData.total_value) || 0,
        labor_cost: parseFloat(formData.labor_cost) || 0,
        material_cost: parseFloat(formData.material_cost) || 0,
        status: formData.status,
        notes: formData.notes
      };

      if (editingCO) {
        const { error: updateError } = await supabase
          .from('change_orders')
          .update(coData)
          .eq('id', editingCO.id)
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('change_orders')
          .insert(coData);

        if (insertError) throw insertError;
      }

      resetForm();
      fetchChangeOrders();
    } catch (err) {
      console.error('Error saving change order:', err);
      setError(err.message || 'Failed to save change order');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this change order?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('change_orders')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;
      fetchChangeOrders();
    } catch (err) {
      console.error('Error deleting change order:', err);
      setError('Failed to delete change order');
    }
  };

  const handleStatusChange = async (co, newStatus) => {
    try {
      const updateData = { status: newStatus };
      if (newStatus === 'approved') {
        updateData.approved_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('change_orders')
        .update(updateData)
        .eq('id', co.id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;
      fetchChangeOrders();
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status');
    }
  };

  const openEditModal = (co) => {
    setEditingCO(co);
    setFormData({
      project_id: co.project_id || '',
      co_number: co.co_number || '',
      description: co.description || '',
      total_value: co.total_value?.toString() || '',
      labor_cost: co.labor_cost?.toString() || '',
      material_cost: co.material_cost?.toString() || '',
      status: co.status || 'pending',
      notes: co.notes || ''
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      project_id: '',
      co_number: '',
      description: '',
      total_value: '',
      labor_cost: '',
      material_cost: '',
      status: 'pending',
      notes: ''
    });
    setEditingCO(null);
    setIsModalOpen(false);
    setError(null);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
      case 'submitted':
        return <span className="bg-warning/20 text-warning text-xs px-2 py-1 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
      case 'approved':
        return <span className="bg-success/20 text-success text-xs px-2 py-1 rounded-full flex items-center gap-1"><Check className="w-3 h-3" /> Approved</span>;
      case 'invoiced':
      case 'paid':
        return <span className="bg-steel-500/20 text-steel-400 text-xs px-2 py-1 rounded-full flex items-center gap-1"><FileText className="w-3 h-3" /> {status === 'paid' ? 'Paid' : 'Invoiced'}</span>;
      case 'rejected':
        return <span className="bg-risk/20 text-risk text-xs px-2 py-1 rounded-full flex items-center gap-1"><X className="w-3 h-3" /> Rejected</span>;
      default:
        return null;
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(value || 0);
  };

  const filteredCOs = changeOrders.filter(co => 
    co.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    co.co_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    co.projects?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingTotal = changeOrders.filter(co => co.status === 'pending' || co.status === 'submitted').reduce((sum, co) => sum + (parseFloat(co.total_value) || 0), 0);
  const approvedTotal = changeOrders.filter(co => co.status === 'approved').reduce((sum, co) => sum + (parseFloat(co.total_value) || 0), 0);

  return (
    <div className="space-y-6" data-testid="change-orders-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img src="/shield-icon.png" alt="" className="w-10 h-10 opacity-30 hidden lg:block" />
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-charcoal-800">Change Orders</h1>
            <p className="text-charcoal-600">Track and manage all change orders across projects</p>
          </div>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 w-fit"
          data-testid="new-co-btn"
        >
          <Plus className="w-5 h-5" />
          New Change Order
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-risk/20 border border-risk/50 text-risk p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-charcoal-800 rounded-xl p-4 border border-charcoal-700">
          <p className="text-gray-500 text-sm mb-1">Pending Value</p>
          <p className="text-2xl font-bold text-warning">{formatCurrency(pendingTotal)}</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl p-4 border border-charcoal-700">
          <p className="text-gray-500 text-sm mb-1">Pending COs</p>
          <p className="text-2xl font-bold text-white">{changeOrders.filter(co => co.status === 'pending' || co.status === 'submitted').length}</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl p-4 border border-charcoal-700">
          <p className="text-gray-500 text-sm mb-1">Approved Value</p>
          <p className="text-2xl font-bold text-success">{formatCurrency(approvedTotal)}</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl p-4 border border-charcoal-700">
          <p className="text-gray-500 text-sm mb-1">Total COs</p>
          <p className="text-2xl font-bold text-white">{changeOrders.length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search change orders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-charcoal-800 border border-charcoal-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
        />
      </div>

      {/* Change Orders List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-steel-500"></div>
        </div>
      ) : filteredCOs.length === 0 ? (
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Change Orders Yet</h3>
          <p className="text-gray-400 mb-6">Start tracking change orders to manage project scope changes</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Change Order
          </button>
        </div>
      ) : (
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700">
          <div className="p-4 lg:p-6 border-b border-charcoal-700">
            <h2 className="text-lg font-semibold text-white">All Change Orders</h2>
          </div>
          <div className="divide-y divide-charcoal-700">
            {filteredCOs.map((co) => {
              const daysPending = Math.floor((new Date() - new Date(co.created_at)) / (1000 * 60 * 60 * 24));
              // Calculate margin impact
              const projectData = projects.find(p => p.id === co.project_id);
              const coValue = parseFloat(co.total_value) || 0;
              const coCost = (parseFloat(co.labor_cost) || 0) + (parseFloat(co.material_cost) || 0);
              const coProfit = coValue - coCost;
              const coMargin = coValue > 0 ? ((coProfit / coValue) * 100).toFixed(1) : 0;
              
              return (
                <div key={co.id} className="p-4 lg:p-6 hover:bg-charcoal-700/50 transition-colors" data-testid={`co-row-${co.id}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="text-sm bg-charcoal-600 text-gray-300 px-2 py-0.5 rounded font-mono">{co.co_number}</span>
                        <span className="text-gray-500 text-sm">{co.projects?.name || 'No Project'}</span>
                        {getStatusBadge(co.status)}
                      </div>
                      <p className="text-white font-medium mb-2">{co.description}</p>
                      {/* Margin Impact Badge */}
                      {coValue > 0 && (
                        <div className="flex items-center gap-3 text-xs mb-2">
                          <span className={`px-2 py-0.5 rounded ${
                            parseFloat(coMargin) >= 15 ? 'bg-success/20 text-success' :
                            parseFloat(coMargin) >= 0 ? 'bg-warning/20 text-warning' : 'bg-risk/20 text-risk'
                          }`}>
                            {parseFloat(coMargin) >= 0 ? '+' : ''}{coMargin}% margin
                          </span>
                          <span className="text-gray-500">
                            Profit: <span className={coProfit >= 0 ? 'text-success' : 'text-risk'}>{formatCurrency(coProfit)}</span>
                          </span>
                        </div>
                      )}
                      {(co.status === 'pending' || co.status === 'submitted') && daysPending > 7 && (
                        <div className="flex items-center gap-2 text-xs text-warning">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{daysPending} days pending - follow up recommended</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <p className="text-xl font-bold text-white">{formatCurrency(co.total_value)}</p>
                      <div className="flex items-center gap-1">
                        {co.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(co, 'approved')}
                            className="p-2 text-success hover:bg-success/20 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(co)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-charcoal-600 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(co.id)}
                          className="p-2 text-gray-400 hover:text-risk hover:bg-risk/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={resetForm} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto bg-charcoal-800 rounded-2xl border border-charcoal-700 p-6 z-50 max-h-[90vh] overflow-y-auto" data-testid="co-modal">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingCO ? 'Edit Change Order' : 'New Change Order'}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">CO Number</label>
                  <input
                    type="text"
                    value={formData.co_number}
                    onChange={(e) => setFormData({ ...formData, co_number: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                    placeholder={generateCONumber()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="invoiced">Invoiced</option>
                    <option value="paid">Paid</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 h-20 resize-none"
                  placeholder="Describe the change order scope..."
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Total Value ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.total_value}
                    onChange={(e) => setFormData({ ...formData, total_value: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Labor Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.labor_cost}
                    onChange={(e) => setFormData({ ...formData, labor_cost: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Material Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.material_cost}
                    onChange={(e) => setFormData({ ...formData, material_cost: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 h-16 resize-none"
                  placeholder="Additional notes..."
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
                  data-testid="save-co-btn"
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {editingCO ? 'Update' : 'Create'} CO
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

export default ChangeOrdersPage;
