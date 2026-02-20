import React, { useState, useEffect } from 'react';
import { 
  Flag, Plus, Search, CheckCircle, Clock, Send, Receipt, 
  ChevronRight, MoreVertical, Edit2, Trash2, Lock, X, AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Status colors and labels
const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-500/20 text-gray-400', icon: Edit2 },
  submitted: { label: 'Submitted', color: 'bg-blue-500/20 text-blue-400', icon: Send },
  approved: { label: 'Approved', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  invoiced: { label: 'Invoiced', color: 'bg-purple-500/20 text-purple-400', icon: Receipt },
  paid: { label: 'Paid', color: 'bg-success/20 text-success', icon: CheckCircle }
};

// Valid status transitions
const STATUS_TRANSITIONS = {
  draft: ['submitted'],
  submitted: ['approved', 'draft'],
  approved: ['invoiced'],
  invoiced: ['paid'],
  paid: []
};

const MilestonesPage = () => {
  const { user, markSetupComplete } = useAuthStore();
  const [milestones, setMilestones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending_approval: 0,
    ready_to_invoice: 0,
    total_value: 0
  });

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    };
  };

  useEffect(() => {
    fetchMilestones();
  }, []);

  const fetchMilestones = async () => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/milestones`, { headers });
      if (response.ok) {
        const data = await response.json();
        setMilestones(data.milestones || []);
        setStats(data.stats || {
          total: 0,
          pending_approval: 0,
          ready_to_invoice: 0,
          total_value: 0
        });
      } else {
        setMilestones([]);
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
      setMilestones([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (milestoneId, newStatus) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/milestones/${milestoneId}/status`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast.success(`Milestone ${newStatus === 'approved' ? 'approved' : 'updated'}`);
        fetchMilestones();
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Error updating milestone status');
    }
  };

  const handleCreateInvoice = async (milestone) => {
    // Navigate to invoices page with milestone pre-populated
    // For now, we'll create the invoice directly
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/invoices`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          milestone_id: milestone.id,
          project_id: milestone.project_id,
          client_name: milestone.project_name || 'Client',
          project_name: milestone.project_name,
          line_items: [{
            description: milestone.name,
            quantity: 1,
            unit_price: milestone.amount
          }],
          payment_terms: 'Net 30',
          payment_terms_days: 30,
          tax_rate: 0
        })
      });

      if (response.ok) {
        toast.success('Invoice created from milestone');
        fetchMilestones();
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to create invoice');
      }
    } catch (error) {
      toast.error('Error creating invoice');
    }
  };

  const handleDeleteMilestone = async (milestoneId) => {
    if (!confirm('Are you sure you want to delete this milestone?')) return;

    try {
      const response = await fetch(`${API_URL}/api/milestones/${milestoneId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user?.access_token}` }
      });

      if (response.ok) {
        toast.success('Milestone deleted');
        fetchMilestones();
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to delete milestone');
      }
    } catch (error) {
      toast.error('Error deleting milestone');
    }
  };

  const filteredMilestones = milestones.filter(m => {
    const matchesSearch = m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         m.project_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6" data-testid="milestones-page">
      {/* Header with Shield */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/shield-icon.png" alt="" className="w-8 h-8 opacity-80" />
          <div>
            <h1 className="text-2xl font-bold text-charcoal-800">Milestones</h1>
            <p className="text-charcoal-600 text-sm mt-1">Track project milestones and payment schedules</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          data-testid="new-milestone-btn"
        >
          <Plus className="w-4 h-4" />
          New Milestone
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-4">
          <p className="text-gray-400 text-sm">Total Milestones</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-4">
          <p className="text-gray-400 text-sm">Pending Approval</p>
          <p className="text-2xl font-bold text-blue-400">{stats.pending_approval}</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-4">
          <p className="text-gray-400 text-sm">Ready to Invoice</p>
          <p className="text-2xl font-bold text-green-400">{stats.ready_to_invoice}</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-4">
          <p className="text-gray-400 text-sm">Total Value</p>
          <p className="text-2xl font-bold text-white">${stats.total_value?.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search milestones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-charcoal-800 border border-charcoal-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:border-steel-500 focus:outline-none"
            data-testid="search-milestones"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-charcoal-800 border border-charcoal-700 rounded-lg px-4 py-2 text-white focus:border-steel-500 focus:outline-none"
          data-testid="filter-status"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="invoiced">Invoiced</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      {/* Workflow Guide */}
      <div className="bg-charcoal-800/50 rounded-xl border border-charcoal-700 p-4">
        <p className="text-sm text-gray-400 mb-3">Milestone Workflow:</p>
        <div className="flex items-center gap-2 flex-wrap">
          {['Draft', 'Submitted', 'Approved', 'Invoiced', 'Paid'].map((step, idx, arr) => (
            <React.Fragment key={step}>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                idx === 0 ? 'bg-gray-500/20 text-gray-400' :
                idx === 1 ? 'bg-blue-500/20 text-blue-400' :
                idx === 2 ? 'bg-green-500/20 text-green-400' :
                idx === 3 ? 'bg-purple-500/20 text-purple-400' :
                'bg-success/20 text-success'
              }`}>{step}</span>
              {idx < arr.length - 1 && <ChevronRight className="w-4 h-4 text-gray-600" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Milestones List */}
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-steel-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading milestones...</p>
          </div>
        ) : filteredMilestones.length === 0 ? (
          <div className="p-8 text-center">
            <Flag className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No milestones found</h3>
            <p className="text-gray-400 mb-4">Create your first milestone to track project progress.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Milestone
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-charcoal-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Milestone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase hidden md:table-cell">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase hidden sm:table-cell">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-700">
                {filteredMilestones.map((milestone) => {
                  const config = STATUS_CONFIG[milestone.status] || STATUS_CONFIG.draft;
                  const StatusIcon = config.icon;
                  const isLocked = ['invoiced', 'paid'].includes(milestone.status);
                  const availableTransitions = STATUS_TRANSITIONS[milestone.status] || [];
                  
                  return (
                    <tr key={milestone.id} className="hover:bg-charcoal-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {isLocked && <Lock className="w-4 h-4 text-gray-500" />}
                          <span className="text-white font-medium">{milestone.name}</span>
                        </div>
                        {milestone.description && (
                          <p className="text-gray-500 text-sm mt-1 truncate max-w-xs">{milestone.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-400 hidden md:table-cell">{milestone.project_name || '—'}</td>
                      <td className="px-6 py-4 text-white font-medium">${milestone.amount?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-gray-400 hidden sm:table-cell">
                        {milestone.due_date ? new Date(milestone.due_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Status Actions */}
                          {milestone.status === 'draft' && (
                            <button 
                              onClick={() => handleStatusChange(milestone.id, 'submitted')}
                              className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1 rounded text-sm font-medium"
                              title="Submit for approval"
                              data-testid={`submit-milestone-${milestone.id}`}
                            >
                              Submit
                            </button>
                          )}
                          {milestone.status === 'submitted' && (
                            <button 
                              onClick={() => handleStatusChange(milestone.id, 'approved')}
                              className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-1 rounded text-sm font-medium"
                              title="Approve milestone"
                              data-testid={`approve-milestone-${milestone.id}`}
                            >
                              Approve
                            </button>
                          )}
                          {milestone.status === 'approved' && (
                            <button 
                              onClick={() => handleCreateInvoice(milestone)}
                              className="bg-steel-500 hover:bg-steel-600 text-white px-3 py-1 rounded text-sm font-medium"
                              title="Create invoice from this milestone"
                              data-testid={`invoice-milestone-${milestone.id}`}
                            >
                              Create Invoice
                            </button>
                          )}
                          
                          {/* Edit/Delete for draft milestones */}
                          {milestone.status === 'draft' && (
                            <>
                              <button 
                                onClick={() => { setSelectedMilestone(milestone); setShowEditModal(true); }}
                                className="text-gray-400 hover:text-white p-1"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteMilestone(milestone.id)}
                                className="text-gray-400 hover:text-risk p-1"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Milestone Modal */}
      {showCreateModal && (
        <MilestoneModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => { setShowCreateModal(false); fetchMilestones(); }}
        />
      )}

      {/* Edit Milestone Modal */}
      {showEditModal && selectedMilestone && (
        <MilestoneModal 
          milestone={selectedMilestone}
          onClose={() => { setShowEditModal(false); setSelectedMilestone(null); }}
          onSuccess={() => { setShowEditModal(false); setSelectedMilestone(null); fetchMilestones(); }}
        />
      )}
    </div>
  );
};

// Create/Edit Milestone Modal Component
const MilestoneModal = ({ milestone, onClose, onSuccess }) => {
  const isEdit = !!milestone;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: milestone?.name || '',
    description: milestone?.description || '',
    amount: milestone?.amount || '',
    due_date: milestone?.due_date?.split('T')[0] || '',
    project_name: milestone?.project_name || '',
    notes: milestone?.notes || ''
  });

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = isEdit 
        ? `${API_URL}/api/milestones/${milestone.id}`
        : `${API_URL}/api/milestones`;
      
      const headers = await getAuthHeaders();
      const response = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers,
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      });

      if (response.ok) {
        toast.success(isEdit ? 'Milestone updated' : 'Milestone created');
        onSuccess();
      } else {
        const data = await response.json();
        toast.error(data.detail || `Failed to ${isEdit ? 'update' : 'create'} milestone`);
      }
    } catch (error) {
      toast.error(`Error ${isEdit ? 'updating' : 'creating'} milestone`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="milestone-modal">
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 w-full max-w-lg">
        <div className="p-6 border-b border-charcoal-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {isEdit ? 'Edit Milestone' : 'Create Milestone'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Milestone Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg px-4 py-2 text-white focus:border-steel-500 focus:outline-none"
              placeholder="e.g., Foundation Complete"
              data-testid="input-milestone-name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg px-4 py-2 text-white focus:border-steel-500 focus:outline-none resize-none"
              placeholder="Details about this milestone..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg pl-8 pr-4 py-2 text-white focus:border-steel-500 focus:outline-none"
                  placeholder="0.00"
                  data-testid="input-milestone-amount"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg px-4 py-2 text-white focus:border-steel-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Project Name</label>
            <input
              type="text"
              value={formData.project_name}
              onChange={(e) => setFormData(prev => ({ ...prev, project_name: e.target.value }))}
              className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg px-4 py-2 text-white focus:border-steel-500 focus:outline-none"
              placeholder="Associated project..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg px-4 py-2 text-white focus:border-steel-500 focus:outline-none resize-none"
              placeholder="Internal notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-charcoal-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-steel-500 hover:bg-steel-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              data-testid="submit-milestone"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isEdit ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEdit ? 'Update Milestone' : 'Create Milestone'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MilestonesPage;
