import React, { useState, useEffect } from 'react';
import { 
  Flag, Plus, Search, Filter, CheckCircle, Clock, Send, Receipt, 
  AlertCircle, ChevronRight, MoreVertical, Edit2, Trash2, Lock
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Status colors and labels
const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-500/20 text-gray-400', icon: Edit2 },
  submitted: { label: 'Submitted', color: 'bg-blue-500/20 text-blue-400', icon: Send },
  approved: { label: 'Approved', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  invoiced: { label: 'Invoiced', color: 'bg-purple-500/20 text-purple-400', icon: Receipt },
  paid: { label: 'Paid', color: 'bg-success/20 text-success', icon: CheckCircle }
};

const MilestonesPage = () => {
  const { user } = useAuthStore();
  const [milestones, setMilestones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    fetchMilestones();
  }, []);

  const fetchMilestones = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/milestones`, {
        headers: { 'Authorization': `Bearer ${user?.access_token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMilestones(data.milestones || []);
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
      // Demo data
      setMilestones([
        { id: '1', name: 'Foundation Complete', project_name: 'Smith Residence', amount: 25000, status: 'approved', due_date: '2026-03-01' },
        { id: '2', name: 'Framing Complete', project_name: 'Smith Residence', amount: 45000, status: 'submitted', due_date: '2026-03-15' },
        { id: '3', name: 'Electrical Rough-In', project_name: 'Commercial Build', amount: 18000, status: 'draft', due_date: '2026-04-01' },
        { id: '4', name: 'Final Inspection', project_name: 'Johnson Reno', amount: 12000, status: 'invoiced', due_date: '2026-02-20' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMilestones = milestones.filter(m => {
    const matchesSearch = m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         m.project_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: milestones.length,
    pending: milestones.filter(m => m.status === 'submitted').length,
    approved: milestones.filter(m => m.status === 'approved').length,
    totalValue: milestones.reduce((sum, m) => sum + (m.amount || 0), 0)
  };

  return (
    <div className="space-y-6" data-testid="milestones-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Flag className="w-7 h-7 text-steel-400" />
            Milestones
          </h1>
          <p className="text-gray-400 text-sm mt-1">Track project milestones and payment schedules</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
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
          <p className="text-2xl font-bold text-blue-400">{stats.pending}</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-4">
          <p className="text-gray-400 text-sm">Ready to Invoice</p>
          <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-4">
          <p className="text-gray-400 text-sm">Total Value</p>
          <p className="text-2xl font-bold text-white">${stats.totalValue.toLocaleString()}</p>
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
            className="w-full bg-charcoal-800 border border-charcoal-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-charcoal-800 border border-charcoal-700 rounded-lg px-4 py-2 text-white"
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
            <p className="text-gray-400">Create your first milestone to track project progress.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-charcoal-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Milestone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-700">
              {filteredMilestones.map((milestone) => {
                const config = STATUS_CONFIG[milestone.status] || STATUS_CONFIG.draft;
                const StatusIcon = config.icon;
                const isLocked = ['invoiced', 'paid'].includes(milestone.status);
                
                return (
                  <tr key={milestone.id} className="hover:bg-charcoal-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {isLocked && <Lock className="w-4 h-4 text-gray-500" />}
                        <span className="text-white font-medium">{milestone.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{milestone.project_name}</td>
                    <td className="px-6 py-4 text-white font-medium">${milestone.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-400">
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
                        {milestone.status === 'approved' && (
                          <button className="bg-steel-500 hover:bg-steel-600 text-white px-3 py-1 rounded text-sm font-medium">
                            Create Invoice
                          </button>
                        )}
                        <button className="text-gray-400 hover:text-white p-1">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MilestonesPage;
