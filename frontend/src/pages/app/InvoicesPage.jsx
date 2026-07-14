import React, { useState, useEffect, useCallback } from 'react';
import { 
  Receipt, Plus, Search, Send, CheckCircle, Clock, AlertCircle,
  Eye, Download, MoreVertical, DollarSign, Building2, X, Trash2, Calendar
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Invoice status configuration
const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-500/20 text-gray-400' },
  sent: { label: 'Sent', color: 'bg-blue-500/20 text-blue-400' },
  viewed: { label: 'Viewed', color: 'bg-purple-500/20 text-purple-400' },
  paid: { label: 'Paid', color: 'bg-success/20 text-success' },
  overdue: { label: 'Overdue', color: 'bg-risk/20 text-risk' }
};

const PAYMENT_TERMS_OPTIONS = [
  { label: 'Net 7', days: 7 },
  { label: 'Net 14', days: 14 },
  { label: 'Net 30', days: 30 },
  { label: 'Net 45', days: 45 },
  { label: 'Net 60', days: 60 },
];

const InvoicesPage = () => {
  const { user, markSetupComplete } = useAuthStore();
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [stats, setStats] = useState({
    totalReceivables: 0,
    overdue: 0,
    paidThisMonth: 0,
    drafts: 0
  });

  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    };
  }, []);

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/invoices`, { headers });
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
        setStats(data.stats || {
          total_outstanding: 0,
          total_overdue: 0,
          total_paid_this_month: 0,
          draft_count: 0
        });
      } else {
        // Use empty state if API fails
        setInvoices([]);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleSendInvoice = async (invoiceId) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers
      });
      if (response.ok) {
        toast.success('Invoice sent successfully');
        fetchInvoices();
      } else {
        toast.error('Failed to send invoice');
      }
    } catch (error) {
      toast.error('Error sending invoice');
    }
  };

  const handleMarkPaid = async (invoiceId) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/invoices/${invoiceId}/mark-paid`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ status: 'paid' })
      });
      if (response.ok) {
        toast.success('Invoice marked as paid');
        fetchInvoices();
      } else {
        toast.error('Failed to update invoice');
      }
    } catch (error) {
      toast.error('Error updating invoice');
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers
      });
      if (response.ok) {
        toast.success('Invoice deleted');
        fetchInvoices();
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to delete invoice');
      }
    } catch (error) {
      toast.error('Error deleting invoice');
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inv.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inv.project_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6" data-testid="invoices-page">
      {/* Header with Shield */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/shield-icon.png" alt="" className="w-8 h-8 opacity-80" />
          <div>
            <h1 className="text-2xl font-bold text-charcoal-800">Invoices</h1>
            <p className="text-charcoal-600 text-sm mt-1">Create, send, and track invoices</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          data-testid="new-invoice-btn"
        >
          <Plus className="w-4 h-4" />
          New Invoice
        </button>
      </div>

      {/* Receivables Dashboard Widget */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-steel-400" />
            <p className="text-gray-400 text-sm">Outstanding</p>
          </div>
          <p className="text-2xl font-bold text-white">${(stats.total_outstanding || 0).toLocaleString()}</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl border border-risk/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-risk" />
            <p className="text-gray-400 text-sm">Overdue</p>
          </div>
          <p className="text-2xl font-bold text-risk">${(stats.total_overdue || 0).toLocaleString()}</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl border border-success/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-success" />
            <p className="text-gray-400 text-sm">Paid (This Month)</p>
          </div>
          <p className="text-2xl font-bold text-success">${(stats.total_paid_this_month || 0).toLocaleString()}</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-gray-400" />
            <p className="text-gray-400 text-sm">Drafts</p>
          </div>
          <p className="text-2xl font-bold text-white">{stats.draft_count || 0}</p>
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
            className="w-full bg-charcoal-800 border border-charcoal-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:border-steel-500 focus:outline-none"
            data-testid="search-invoices"
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
            <p className="text-gray-400 mb-4">Create your first invoice to start tracking payments.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Invoice
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden p-3 space-y-3">
              {filteredInvoices.map((invoice) => {
                const config = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.draft;
                return (
                  <div 
                    key={invoice.id} 
                    className="bg-charcoal-700/50 border border-charcoal-600 rounded-xl p-4 space-y-3"
                    data-testid={`invoice-mobile-card-${invoice.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <span className="text-white font-mono font-medium block">{invoice.invoice_number}</span>
                        <span className="text-gray-400 text-sm truncate block">{invoice.client_name}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500 text-xs block">Amount</span>
                        <span className="text-white font-medium">${invoice.total?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs block">Due Date</span>
                        <span className="text-gray-300">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—'}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-3 border-t border-charcoal-600">
                      <button 
                        onClick={() => { setSelectedInvoice(invoice); setShowViewModal(true); }}
                        className="flex-1 flex items-center justify-center gap-2 text-gray-400 hover:text-white py-2 rounded-lg hover:bg-charcoal-600 transition-colors min-h-[44px]"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      {invoice.status === 'draft' && (
                        <button 
                          onClick={() => handleSendInvoice(invoice.id)}
                          className="flex-1 bg-steel-500 hover:bg-steel-600 text-white py-2 rounded-lg font-medium min-h-[44px]"
                        >
                          Send
                        </button>
                      )}
                      {['sent', 'viewed', 'overdue'].includes(invoice.status) && (
                        <button 
                          onClick={() => handleMarkPaid(invoice.id)}
                          className="flex-1 bg-success/20 hover:bg-success/30 text-success py-2 rounded-lg font-medium min-h-[44px]"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-charcoal-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Invoice #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase hidden lg:table-cell">Project</th>
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
                        <td className="px-6 py-4 text-gray-400 hidden lg:table-cell">{invoice.project_name || '—'}</td>
                        <td className="px-6 py-4 text-white font-medium">${invoice.total?.toLocaleString()}</td>
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
                            <button 
                              onClick={() => { setSelectedInvoice(invoice); setShowViewModal(true); }}
                              className="text-gray-400 hover:text-white p-1" 
                              title="View"
                              data-testid={`view-invoice-${invoice.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {invoice.status === 'draft' && (
                              <>
                                <button 
                                  onClick={() => handleSendInvoice(invoice.id)}
                                  className="bg-steel-500 hover:bg-steel-600 text-white px-3 py-1 rounded text-sm font-medium"
                                  data-testid={`send-invoice-${invoice.id}`}
                                >
                                  Send
                                </button>
                                <button 
                                  onClick={() => handleDeleteInvoice(invoice.id)}
                                  className="text-gray-400 hover:text-risk p-1" 
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {['sent', 'viewed', 'overdue'].includes(invoice.status) && (
                              <button 
                                onClick={() => handleMarkPaid(invoice.id)}
                                className="bg-success/20 hover:bg-success/30 text-success px-3 py-1 rounded text-sm font-medium"
                                data-testid={`mark-paid-${invoice.id}`}
                              >
                                Mark Paid
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <CreateInvoiceModal 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={() => { setShowCreateModal(false); fetchInvoices(); markSetupComplete('has_invoice'); }}
          user={user}
        />
      )}

      {/* View Invoice Modal */}
      {showViewModal && selectedInvoice && (
        <ViewInvoiceModal 
          invoice={selectedInvoice}
          onClose={() => { setShowViewModal(false); setSelectedInvoice(null); }}
        />
      )}
    </div>
  );
};

// Create Invoice Modal Component
const CreateInvoiceModal = ({ onClose, onSuccess, user }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_address: '',
    client_phone: '',
    project_name: '',
    payment_terms: 'Net 30',
    payment_terms_days: 30,
    tax_rate: 0,
    notes: '',
    line_items: [{ description: '', quantity: 1, unit_price: 0 }]
  });

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      line_items: [...prev.line_items, { description: '', quantity: 1, unit_price: 0 }]
    }));
  };

  const removeLineItem = (index) => {
    if (formData.line_items.length > 1) {
      setFormData(prev => ({
        ...prev,
        line_items: prev.line_items.filter((_, i) => i !== index)
      }));
    }
  };

  const updateLineItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      line_items: prev.line_items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateSubtotal = () => {
    return formData.line_items.reduce((sum, item) => 
      sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0), 0
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.client_name || formData.line_items.every(i => !i.description)) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${API_URL}/api/invoices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          line_items: formData.line_items.filter(i => i.description)
        })
      });

      if (response.ok) {
        toast.success('Invoice created successfully');
        onSuccess();
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to create invoice');
      }
    } catch (error) {
      toast.error('Error creating invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const subtotal = calculateSubtotal();
  const taxAmount = subtotal * (formData.tax_rate / 100);
  const total = subtotal + taxAmount;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="create-invoice-modal">
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-charcoal-700 flex items-center justify-between sticky top-0 bg-charcoal-800">
          <h2 className="text-xl font-bold text-white">Create Invoice</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Client Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Client Name *</label>
              <input
                type="text"
                required
                value={formData.client_name}
                onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg px-4 py-2 text-white focus:border-steel-500 focus:outline-none"
                placeholder="Company or client name"
                data-testid="input-client-name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Client Email</label>
              <input
                type="email"
                value={formData.client_email}
                onChange={(e) => setFormData(prev => ({ ...prev, client_email: e.target.value }))}
                className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg px-4 py-2 text-white focus:border-steel-500 focus:outline-none"
                placeholder="client@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Project Name</label>
              <input
                type="text"
                value={formData.project_name}
                onChange={(e) => setFormData(prev => ({ ...prev, project_name: e.target.value }))}
                className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg px-4 py-2 text-white focus:border-steel-500 focus:outline-none"
                placeholder="Project or job name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Payment Terms</label>
              <select
                value={formData.payment_terms}
                onChange={(e) => {
                  const term = PAYMENT_TERMS_OPTIONS.find(t => t.label === e.target.value);
                  setFormData(prev => ({ 
                    ...prev, 
                    payment_terms: e.target.value,
                    payment_terms_days: term?.days || 30
                  }));
                }}
                className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg px-4 py-2 text-white focus:border-steel-500 focus:outline-none"
              >
                {PAYMENT_TERMS_OPTIONS.map(opt => (
                  <option key={opt.label} value={opt.label}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">Line Items</label>
            <div className="space-y-3">
              {formData.line_items.map((item, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                    className="flex-1 bg-charcoal-900 border border-charcoal-700 rounded-lg px-4 py-2 text-white focus:border-steel-500 focus:outline-none"
                    data-testid={`line-item-desc-${index}`}
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                    className="w-20 bg-charcoal-900 border border-charcoal-700 rounded-lg px-3 py-2 text-white focus:border-steel-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Unit Price"
                    min="0"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateLineItem(index, 'unit_price', e.target.value)}
                    className="w-32 bg-charcoal-900 border border-charcoal-700 rounded-lg px-3 py-2 text-white focus:border-steel-500 focus:outline-none"
                    data-testid={`line-item-price-${index}`}
                  />
                  <div className="w-24 text-right py-2 text-white font-medium">
                    ${((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toLocaleString()}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLineItem(index)}
                    className="text-gray-400 hover:text-risk p-2"
                    disabled={formData.line_items.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addLineItem}
              className="mt-3 text-steel-400 hover:text-steel-300 text-sm font-medium flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Line Item
            </button>
          </div>

          {/* Tax & Totals */}
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span className="text-white">${subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Tax Rate (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
                  className="w-20 bg-charcoal-900 border border-charcoal-700 rounded px-2 py-1 text-white text-right focus:border-steel-500 focus:outline-none"
                />
              </div>
              {taxAmount > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span>Tax</span>
                  <span className="text-white">${taxAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-charcoal-700 text-lg font-bold">
                <span className="text-white">Total</span>
                <span className="text-steel-400">${total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Notes (visible on invoice)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg px-4 py-2 text-white focus:border-steel-500 focus:outline-none resize-none"
              placeholder="Payment instructions, thank you message, etc."
            />
          </div>

          {/* Actions */}
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
              data-testid="submit-invoice"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Invoice'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// View Invoice Modal Component
const ViewInvoiceModal = ({ invoice, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-charcoal-700 flex items-center justify-between sticky top-0 bg-charcoal-800">
          <div>
            <h2 className="text-xl font-bold text-white">{invoice.invoice_number}</h2>
            <p className="text-gray-400 text-sm">Created {new Date(invoice.created_at).toLocaleDateString()}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Client & Project Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-gray-400 text-sm">Client</p>
              <p className="text-white font-medium">{invoice.client_name}</p>
              {invoice.client_email && <p className="text-gray-400 text-sm">{invoice.client_email}</p>}
            </div>
            <div>
              <p className="text-gray-400 text-sm">Project</p>
              <p className="text-white font-medium">{invoice.project_name || '—'}</p>
            </div>
          </div>

          {/* Status & Dates */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-charcoal-900 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Status</p>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[invoice.status]?.color}`}>
                {STATUS_CONFIG[invoice.status]?.label}
              </span>
            </div>
            <div className="bg-charcoal-900 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Issue Date</p>
              <p className="text-white">{new Date(invoice.issue_date).toLocaleDateString()}</p>
            </div>
            <div className="bg-charcoal-900 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Due Date</p>
              <p className="text-white">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—'}</p>
            </div>
          </div>

          {/* Line Items */}
          {invoice.line_items && invoice.line_items.length > 0 && (
            <div>
              <p className="text-gray-400 text-sm mb-2">Line Items</p>
              <div className="bg-charcoal-900 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-charcoal-700/50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Description</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-400">Qty</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-400">Price</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-400">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-charcoal-700">
                    {invoice.line_items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-white">{item.description}</td>
                        <td className="px-4 py-3 text-gray-400 text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-gray-400 text-right">${item.unit_price?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-white text-right">${item.amount?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span className="text-white">${invoice.subtotal?.toLocaleString()}</span>
              </div>
              {invoice.tax_amount > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span>Tax ({invoice.tax_rate}%)</span>
                  <span className="text-white">${invoice.tax_amount?.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-charcoal-700 text-lg font-bold">
                <span className="text-white">Total</span>
                <span className="text-steel-400">${invoice.total?.toLocaleString()}</span>
              </div>
              {invoice.paid_amount && (
                <div className="flex justify-between text-success">
                  <span>Paid</span>
                  <span>${invoice.paid_amount?.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-charcoal-900 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Notes</p>
              <p className="text-white">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoicesPage;
