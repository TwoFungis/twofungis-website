import React, { useState, useEffect } from 'react';
import { 
  Receipt, Plus, Search, Filter, Send, CheckCircle, Clock, AlertCircle,
  Eye, Download, MoreVertical, DollarSign, Calendar, Building2
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Invoice status configuration
const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-500/20 text-gray-400' },
  sent: { label: 'Sent', color: 'bg-blue-500/20 text-blue-400' },
  viewed: { label: 'Viewed', color: 'bg-purple-500/20 text-purple-400' },
  paid: { label: 'Paid', color: 'bg-success/20 text-success' },
  overdue: { label: 'Overdue', color: 'bg-risk/20 text-risk' }
};

const InvoicesPage = () => {
  const { user } = useAuthStore();
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/invoices`, {
        headers: { 'Authorization': `Bearer ${user?.access_token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      // Demo data
      setInvoices([
        { id: '1', invoice_number: 'INV-001', client_name: 'Smith Construction', project_name: 'Smith Residence', amount: 25000, status: 'paid', due_date: '2026-02-15', paid_date: '2026-02-10' },
        { id: '2', invoice_number: 'INV-002', client_name: 'Johnson Holdings', project_name: 'Johnson Reno', amount: 18500, status: 'sent', due_date: '2026-03-01' },
        { id: '3', invoice_number: 'INV-003', client_name: 'ABC Corp', project_name: 'Commercial Build', amount: 45000, status: 'overdue', due_date: '2026-02-01' },
        { id: '4', invoice_number: 'INV-004', client_name: 'Smith Construction', project_name: 'Smith Residence', amount: 12000, status: 'draft', due_date: '2026-03-15' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inv.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inv.project_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalReceivables: invoices.filter(i => ['sent', 'viewed', 'overdue'].includes(i.status)).reduce((sum, i) => sum + i.amount, 0),
    overdue: invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0),
    paidThisMonth: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0),
    drafts: invoices.filter(i => i.status === 'draft').length
  };

  return (
    <div className="space-y-6" data-testid="invoices-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Receipt className="w-7 h-7 text-steel-400" />
            Invoices
          </h1>
          <p className="text-gray-400 text-sm mt-1">Create, send, and track invoices</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewModal(true)}
            className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            data-testid="new-invoice-btn"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </button>
        </div>
      </div>

      {/* Receivables Dashboard Widget */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-steel-400" />
            <p className="text-gray-400 text-sm">Outstanding</p>
          </div>
          <p className="text-2xl font-bold text-white">${stats.totalReceivables.toLocaleString()}</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl border border-risk/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-risk" />
            <p className="text-gray-400 text-sm">Overdue</p>
          </div>
          <p className="text-2xl font-bold text-risk">${stats.overdue.toLocaleString()}</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl border border-success/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-success" />
            <p className="text-gray-400 text-sm">Paid (This Month)</p>
          </div>
          <p className="text-2xl font-bold text-success">${stats.paidThisMonth.toLocaleString()}</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-gray-400" />
            <p className="text-gray-400 text-sm">Drafts</p>
          </div>
          <p className="text-2xl font-bold text-white">{stats.drafts}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoices..."
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
          <option value="sent">Sent</option>
          <option value="viewed">Viewed</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Invoices List */}
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-steel-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-8 text-center">
            <Receipt className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No invoices found</h3>
            <p className="text-gray-400">Create your first invoice to start tracking payments.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-charcoal-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-700">
              {filteredInvoices.map((invoice) => {
                const config = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.draft;
                
                return (
                  <tr key={invoice.id} className="hover:bg-charcoal-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-white font-mono font-medium">{invoice.invoice_number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-500" />
                        <span className="text-white">{invoice.client_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{invoice.project_name}</td>
                    <td className="px-6 py-4 text-white font-medium">${invoice.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-400">
                      {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                        {config.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="text-gray-400 hover:text-white p-1" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-white p-1" title="Download PDF">
                          <Download className="w-4 h-4" />
                        </button>
                        {invoice.status === 'draft' && (
                          <button className="bg-steel-500 hover:bg-steel-600 text-white px-3 py-1 rounded text-sm font-medium">
                            Send
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

export default InvoicesPage;
