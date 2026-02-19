import React, { useState, useEffect } from 'react';
import { 
  Receipt, Send, Clock, AlertCircle, CheckCircle, DollarSign,
  ChevronRight, Mail, Calendar, Building2, Search, Filter, X
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ReceivablesPage = () => {
  const { user } = useAuthStore();
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [selectedTone, setSelectedTone] = useState('standard');

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    };
  };

  useEffect(() => {
    fetchOutstandingInvoices();
  }, [user]);

  const fetchOutstandingInvoices = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/receivables/outstanding`, { headers });
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
        setSummary(data.summary || {});
      }
    } catch (err) {
      console.error('Error fetching receivables:', err);
      toast.error('Failed to load receivables');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async () => {
    if (!selectedInvoice) return;
    
    setSendingReminder(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/receivables/send-reminder`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          invoice_id: selectedInvoice.id,
          tone: selectedTone
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Reminder sent successfully');
        setShowReminderModal(false);
        setSelectedInvoice(null);
        fetchOutstandingInvoices();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to send reminder');
      }
    } catch (err) {
      console.error('Error sending reminder:', err);
      toast.error('Failed to send reminder');
    } finally {
      setSendingReminder(false);
    }
  };

  const openReminderModal = (invoice) => {
    setSelectedInvoice(invoice);
    // Set default tone based on days overdue
    if (invoice.days_overdue > 30) {
      setSelectedTone('firm');
    } else if (invoice.days_overdue > 14) {
      setSelectedTone('standard');
    } else {
      setSelectedTone('friendly');
    }
    setShowReminderModal(true);
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-CA', { 
      style: 'currency', 
      currency: 'CAD', 
      maximumFractionDigits: 0 
    }).format(value || 0);
  };

  return (
    <div className="space-y-6" data-testid="receivables-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/shield-icon.png" alt="" className="w-8 h-8 opacity-80" />
          <div>
            <h1 className="text-2xl font-bold text-charcoal-800">Receivables</h1>
            <p className="text-charcoal-600 text-sm mt-1">Track outstanding invoices and send payment reminders</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-steel-400" />
            <span className="text-sm text-gray-400">Total Outstanding</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(summary.total_outstanding)}</p>
          <p className="text-xs text-gray-500 mt-1">{summary.count || 0} invoices</p>
        </div>

        <div className="bg-charcoal-800 rounded-xl border border-risk/30 p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-risk" />
            <span className="text-sm text-gray-400">Overdue</span>
          </div>
          <p className="text-2xl font-bold text-risk">{formatCurrency(summary.total_overdue)}</p>
          <p className="text-xs text-gray-500 mt-1">{summary.overdue_count || 0} overdue</p>
        </div>

        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-warning" />
            <span className="text-sm text-gray-400">Due This Week</span>
          </div>
          <p className="text-2xl font-bold text-warning">
            {formatCurrency(invoices
              .filter(i => {
                if (!i.due_date) return false;
                const due = new Date(i.due_date);
                const now = new Date();
                const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                return due >= now && due <= week;
              })
              .reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0)
            )}
          </p>
        </div>

        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-5 h-5 text-steel-400" />
            <span className="text-sm text-gray-400">Reminders Sent</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {invoices.filter(i => i.reminder_count > 0).length}
          </p>
          <p className="text-xs text-gray-500 mt-1">this month</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by client or invoice #..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-charcoal-800 border border-charcoal-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:border-steel-500 focus:outline-none"
          data-testid="search-receivables"
        />
      </div>

      {/* Invoices List */}
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-steel-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading receivables...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">All caught up!</h3>
            <p className="text-gray-400">No outstanding invoices at the moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-charcoal-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-700">
                {filteredInvoices.map((invoice) => (
                  <tr 
                    key={invoice.id} 
                    className={`hover:bg-charcoal-700/30 transition-colors ${
                      invoice.is_overdue ? 'bg-risk/5' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <span className="text-white font-mono font-medium">{invoice.invoice_number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-500" />
                        <div>
                          <span className="text-white">{invoice.client_name}</span>
                          {invoice.client_email && (
                            <p className="text-xs text-gray-500">{invoice.client_email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${invoice.is_overdue ? 'text-risk' : 'text-white'}`}>
                        {formatCurrency(invoice.total)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-400">
                          {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {invoice.is_overdue ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-risk/20 text-risk">
                          <AlertCircle className="w-3 h-3" />
                          {invoice.days_overdue}d overdue
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-steel-500/20 text-steel-400">
                          {invoice.status}
                        </span>
                      )}
                      {invoice.last_reminder_sent && (
                        <p className="text-xs text-gray-500 mt-1">
                          Last reminder: {new Date(invoice.last_reminder_sent).toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {invoice.client_email ? (
                        <button
                          onClick={() => openReminderModal(invoice)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-steel-500 hover:bg-steel-600 text-white text-sm font-medium rounded-lg transition-colors"
                          data-testid={`send-reminder-${invoice.id}`}
                        >
                          <Send className="w-3.5 h-3.5" />
                          Send Reminder
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500">No email</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Send Reminder Modal */}
      {showReminderModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 w-full max-w-lg" data-testid="reminder-modal">
            <div className="p-6 border-b border-charcoal-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Send Payment Reminder</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Invoice {selectedInvoice.invoice_number} • {formatCurrency(selectedInvoice.total)}
                </p>
              </div>
              <button onClick={() => setShowReminderModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Client Info */}
              <div className="bg-charcoal-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-400">Sending to:</p>
                <p className="text-white font-medium">{selectedInvoice.client_name}</p>
                <p className="text-sm text-steel-400">{selectedInvoice.client_email}</p>
              </div>

              {/* Tone Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">Select Tone</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'friendly', name: 'Friendly', desc: 'Warm, casual', color: 'success' },
                    { id: 'standard', name: 'Standard', desc: 'Professional', color: 'steel-400' },
                    { id: 'firm', name: 'Firm', desc: 'Urgent', color: 'warning' }
                  ].map((tone) => (
                    <button
                      key={tone.id}
                      onClick={() => setSelectedTone(tone.id)}
                      className={`p-3 rounded-lg border transition-all text-left ${
                        selectedTone === tone.id 
                          ? 'border-steel-500 bg-steel-500/10' 
                          : 'border-charcoal-700 hover:border-charcoal-600'
                      }`}
                      data-testid={`tone-${tone.id}`}
                    >
                      <p className="text-white font-medium">{tone.name}</p>
                      <p className="text-xs text-gray-500">{tone.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview hint */}
              <div className="text-xs text-gray-500 bg-charcoal-900 rounded-lg p-3">
                {selectedTone === 'friendly' && "💬 \"Hope you're doing well! Just a quick reminder...\""}
                {selectedTone === 'standard' && "📄 \"This is a reminder that invoice remains unpaid...\""}
                {selectedTone === 'firm' && "⚠️ \"URGENT: Immediate payment required...\""}
              </div>
            </div>

            <div className="p-6 border-t border-charcoal-700 flex justify-end gap-3">
              <button
                onClick={() => setShowReminderModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendReminder}
                disabled={sendingReminder}
                className="inline-flex items-center gap-2 px-4 py-2 bg-steel-500 hover:bg-steel-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                data-testid="confirm-send-reminder"
              >
                {sendingReminder ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Reminder
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceivablesPage;
