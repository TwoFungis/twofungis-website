import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  Send, 
  Clock, 
  DollarSign,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  X,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Calendar,
  Percent,
  FileText,
  Download
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { jsPDF } from 'jspdf';

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-500', textColor: 'text-gray-400', bgLight: 'bg-gray-500/20' },
  submitted: { label: 'Submitted', color: 'bg-steel-500', textColor: 'text-steel-400', bgLight: 'bg-steel-500/20' },
  approved: { label: 'Approved', color: 'bg-success', textColor: 'text-success', bgLight: 'bg-success/20' },
  paid: { label: 'Paid', color: 'bg-emerald-700', textColor: 'text-emerald-400', bgLight: 'bg-emerald-700/20' }
};

const ProjectMilestones = ({ project, onMilestoneChange }) => {
  const { user, profile } = useAuthStore();
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [shareLink, setShareLink] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    percentage_of_contract: '',
    milestone_value: '',
    target_date: '',
    internal_notes: ''
  });

  const contractValue = parseFloat(project?.contract_value) || 0;

  const fetchMilestones = useCallback(async () => {
    if (!user || !project?.id) return;
    
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', project.id)
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;
      setMilestones(data || []);
    } catch (err) {
      console.error('Error fetching milestones:', err);
      if (err.code !== '42P01') {
        setError('Failed to load milestones');
      }
    } finally {
      setLoading(false);
    }
  }, [user, project?.id]);

  const fetchShareLink = useCallback(async () => {
    if (!user || !project?.id) return;
    
    try {
      const { data, error: fetchError } = await supabase
        .from('client_approval_tokens')
        .select('token')
        .eq('project_id', project.id)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (data?.token) {
        setShareLink(`${window.location.origin}/client/review/${data.token}`);
      }
    } catch (err) {
      // No existing token, that's fine
    }
  }, [user, project?.id]);

  useEffect(() => {
    fetchMilestones();
    fetchShareLink();
  }, [fetchMilestones, fetchShareLink]);

  const handlePercentageChange = (value) => {
    const percentage = parseFloat(value) || 0;
    const calculatedValue = (contractValue * percentage) / 100;
    setFormData({
      ...formData,
      percentage_of_contract: value,
      milestone_value: calculatedValue.toFixed(2)
    });
  };

  const handleValueChange = (value) => {
    const milestoneVal = parseFloat(value) || 0;
    const percentage = contractValue > 0 ? (milestoneVal / contractValue) * 100 : 0;
    setFormData({
      ...formData,
      milestone_value: value,
      percentage_of_contract: percentage.toFixed(1)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !project?.id) return;

    setIsSaving(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) throw new Error('Session expired. Please refresh the page.');
      }

      const milestoneData = {
        user_id: user.id,
        project_id: project.id,
        name: formData.name,
        description: formData.description,
        percentage_of_contract: parseFloat(formData.percentage_of_contract) || 0,
        milestone_value: parseFloat(formData.milestone_value) || 0,
        target_date: formData.target_date || null,
        internal_notes: formData.internal_notes,
        sort_order: editingMilestone ? editingMilestone.sort_order : milestones.length
      };

      if (editingMilestone) {
        const { error: updateError } = await supabase
          .from('project_milestones')
          .update(milestoneData)
          .eq('id', editingMilestone.id)
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('project_milestones')
          .insert(milestoneData);

        if (insertError) throw insertError;
      }

      resetForm();
      fetchMilestones();
      onMilestoneChange?.();
    } catch (err) {
      console.error('Error saving milestone:', err);
      setError(err.message || 'Failed to save milestone');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (milestoneId) => {
    if (!confirm('Are you sure you want to delete this milestone?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('project_milestones')
        .delete()
        .eq('id', milestoneId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;
      fetchMilestones();
      onMilestoneChange?.();
    } catch (err) {
      console.error('Error deleting milestone:', err);
      setError('Failed to delete milestone');
    }
  };

  const handleStatusChange = async (milestone, newStatus) => {
    try {
      const updateData = { status: newStatus };
      if (newStatus === 'submitted') {
        updateData.submitted_at = new Date().toISOString();
      } else if (newStatus === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('project_milestones')
        .update(updateData)
        .eq('id', milestone.id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;
      fetchMilestones();
      onMilestoneChange?.();
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status');
    }
  };

  const generateShareLink = async () => {
    if (!user || !project?.id) return;

    try {
      // Generate a unique token
      const token = crypto.randomUUID();

      const { error: insertError } = await supabase
        .from('client_approval_tokens')
        .insert({
          project_id: project.id,
          user_id: user.id,
          token: token,
          client_name: project.client_gc || 'Client'
        });

      if (insertError) throw insertError;

      const newLink = `${window.location.origin}/client/review/${token}`;
      setShareLink(newLink);
      setShowShareModal(true);
    } catch (err) {
      console.error('Error generating link:', err);
      setError('Failed to generate client link');
    }
  };

  const copyToClipboard = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Generate Invoice PDF for a milestone
  const generateInvoice = async (milestone) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Generate invoice number if not exists
    const invoiceNumber = milestone.invoice_number || `INV-${Date.now().toString(36).toUpperCase()}`;
    const invoiceDate = new Date().toISOString();
    const defaultPaymentDays = profile?.default_payment_days || 30;
    const dueDate = new Date(Date.now() + defaultPaymentDays * 24 * 60 * 60 * 1000);

    // Update milestone with invoice details
    try {
      await supabase
        .from('project_milestones')
        .update({
          invoice_number: invoiceNumber,
          invoice_date: invoiceDate,
          due_date: dueDate.toISOString(),
          payment_status: 'invoiced'
        })
        .eq('id', milestone.id)
        .eq('user_id', user.id);

      // Log activity
      await supabase.from('activity_log').insert({
        user_id: user.id,
        project_id: project.id,
        action_type: 'invoice_generated',
        entity_type: 'milestone',
        entity_id: milestone.id,
        description: `Invoice ${invoiceNumber} generated for milestone "${milestone.name}"`,
        metadata: { invoice_number: invoiceNumber, amount: milestone.milestone_value }
      });
    } catch (err) {
      console.error('Error updating invoice details:', err);
    }

    // Header
    doc.setFillColor(26, 26, 26);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 20, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(invoiceNumber, 20, 35);

    // Company info (right side)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(profile?.company_name || 'TradeOS', pageWidth - 20, 20, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(user?.email || '', pageWidth - 20, 28, { align: 'right' });
    doc.text(profile?.phone || '', pageWidth - 20, 35, { align: 'right' });

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Bill To / Invoice Details
    let y = 60;
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('BILL TO', 20, y);
    doc.text('INVOICE DETAILS', pageWidth / 2 + 20, y);
    
    y += 8;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(project?.client_gc || 'Client', 20, y);
    doc.text(`Date: ${new Date(invoiceDate).toLocaleDateString()}`, pageWidth / 2 + 20, y);
    
    y += 6;
    doc.text(`Due: ${dueDate.toLocaleDateString()}`, pageWidth / 2 + 20, y);
    
    y += 6;
    doc.text(`Terms: Net ${defaultPaymentDays}`, pageWidth / 2 + 20, y);

    // Project info
    y += 15;
    doc.setFillColor(245, 245, 245);
    doc.rect(20, y - 5, pageWidth - 40, 12, 'F');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Project: ${project?.name || 'N/A'}`, 25, y + 2);

    // Line items header
    y += 25;
    doc.setFillColor(90, 143, 184); // steel blue
    doc.rect(20, y - 5, pageWidth - 40, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('DESCRIPTION', 25, y + 1);
    doc.text('AMOUNT', pageWidth - 45, y + 1, { align: 'right' });

    // Line item
    y += 15;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(milestone.name, 25, y);
    doc.text(`$${parseFloat(milestone.milestone_value || 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}`, pageWidth - 45, y, { align: 'right' });
    
    if (milestone.description) {
      y += 6;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(milestone.description.substring(0, 80), 25, y);
    }

    // Total
    y += 20;
    doc.setDrawColor(200, 200, 200);
    doc.line(pageWidth - 100, y, pageWidth - 25, y);
    
    y += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('TOTAL DUE:', pageWidth - 100, y);
    doc.setTextColor(90, 143, 184);
    doc.text(`$${parseFloat(milestone.milestone_value || 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}`, pageWidth - 25, y, { align: 'right' });

    // Footer
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for your business!', pageWidth / 2, 270, { align: 'center' });
    doc.text(`Generated by TradeOS - ${new Date().toLocaleDateString()}`, pageWidth / 2, 278, { align: 'center' });

    // Save
    doc.save(`Invoice_${invoiceNumber}_${milestone.name.replace(/\s+/g, '_')}.pdf`);
    
    // Send email notification (non-blocking)
    try {
      const API_URL = process.env.REACT_APP_BACKEND_URL;
      await fetch(`${API_URL}/api/email/send-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_email: project?.client_email || user?.email,
          recipient_name: project?.client_gc || 'Client',
          invoice_number: invoiceNumber,
          project_name: project?.name || 'Project',
          milestone_name: milestone.name,
          amount: parseFloat(milestone.milestone_value) || 0,
          due_date: dueDate.toLocaleDateString(),
          company_name: profile?.company_name || 'TradeOS',
          payment_terms: defaultPaymentDays
        })
      });
    } catch (emailErr) {
      console.log('Email notification skipped:', emailErr.message);
      // Don't block on email failure
    }
    
    // Refresh milestones
    fetchMilestones();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      percentage_of_contract: '',
      milestone_value: '',
      target_date: '',
      internal_notes: ''
    });
    setEditingMilestone(null);
    setIsModalOpen(false);
  };

  const openEditModal = (milestone) => {
    setEditingMilestone(milestone);
    setFormData({
      name: milestone.name || '',
      description: milestone.description || '',
      percentage_of_contract: milestone.percentage_of_contract?.toString() || '',
      milestone_value: milestone.milestone_value?.toString() || '',
      target_date: milestone.target_date || '',
      internal_notes: milestone.internal_notes || ''
    });
    setIsModalOpen(true);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-CA', { 
      style: 'currency', 
      currency: 'CAD', 
      maximumFractionDigits: 0 
    }).format(value || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-CA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate totals
  const totals = milestones.reduce((acc, m) => ({
    total: acc.total + (parseFloat(m.milestone_value) || 0),
    pending: acc.pending + (m.status === 'submitted' ? parseFloat(m.milestone_value) || 0 : 0),
    approved: acc.approved + (m.status === 'approved' ? parseFloat(m.milestone_value) || 0 : 0),
    paid: acc.paid + (m.status === 'paid' ? parseFloat(m.milestone_value) || 0 : 0)
  }), { total: 0, pending: 0, approved: 0, paid: 0 });

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-steel-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="project-milestones">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Project Milestones</h3>
          <p className="text-sm text-gray-400">Track progress and client approvals</p>
        </div>
        <div className="flex gap-2">
          {shareLink ? (
            <button
              onClick={() => setShowShareModal(true)}
              className="bg-charcoal-700 hover:bg-charcoal-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
              data-testid="view-share-link-btn"
            >
              <LinkIcon className="w-4 h-4" />
              Client Link
            </button>
          ) : (
            <button
              onClick={generateShareLink}
              className="bg-charcoal-700 hover:bg-charcoal-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
              data-testid="generate-link-btn"
            >
              <LinkIcon className="w-4 h-4" />
              Generate Link
            </button>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
            data-testid="add-milestone-btn"
          >
            <Plus className="w-4 h-4" />
            Add Milestone
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-risk/20 border border-risk/50 text-risk p-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Summary Stats */}
      {milestones.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-charcoal-700/50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Total Value</p>
            <p className="text-lg font-bold text-white">{formatCurrency(totals.total)}</p>
          </div>
          <div className="bg-steel-500/10 rounded-lg p-3 border border-steel-500/30">
            <p className="text-xs text-steel-400 mb-1">Pending Approval</p>
            <p className="text-lg font-bold text-steel-400">{formatCurrency(totals.pending)}</p>
          </div>
          <div className="bg-success/10 rounded-lg p-3 border border-success/30">
            <p className="text-xs text-success mb-1">Approved</p>
            <p className="text-lg font-bold text-success">{formatCurrency(totals.approved)}</p>
          </div>
          <div className="bg-emerald-700/10 rounded-lg p-3 border border-emerald-700/30">
            <p className="text-xs text-emerald-400 mb-1">Paid</p>
            <p className="text-lg font-bold text-emerald-400">{formatCurrency(totals.paid)}</p>
          </div>
        </div>
      )}

      {/* Milestone Timeline */}
      {milestones.length === 0 ? (
        <div className="text-center py-12 bg-charcoal-700/30 rounded-xl border border-charcoal-700 border-dashed">
          <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-white mb-2">No Milestones Yet</h4>
          <p className="text-gray-400 text-sm mb-4">Create milestones to track project progress and enable client approvals.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add First Milestone
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map((milestone, index) => {
            const status = statusConfig[milestone.status] || statusConfig.draft;
            const isLocked = milestone.status === 'approved' || milestone.status === 'paid';

            return (
              <div 
                key={milestone.id} 
                className={`bg-charcoal-800 rounded-xl border transition-all ${
                  milestone.status === 'approved' ? 'border-success/30' :
                  milestone.status === 'submitted' ? 'border-steel-500/30' :
                  milestone.status === 'paid' ? 'border-emerald-700/30' :
                  'border-charcoal-700'
                }`}
                data-testid={`milestone-${index}`}
              >
                {/* Timeline indicator */}
                <div className="flex items-stretch">
                  {/* Status indicator bar */}
                  <div className={`w-1 rounded-l-xl ${status.color}`} />
                  
                  <div className="flex-1 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-semibold text-white">{milestone.name}</h4>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.bgLight} ${status.textColor}`}>
                            {status.label}
                          </span>
                        </div>
                        {milestone.description && (
                          <p className="text-sm text-gray-400 mb-2 line-clamp-2">{milestone.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Percent className="w-3 h-3" />
                            {milestone.percentage_of_contract || 0}% of contract
                          </span>
                          {milestone.target_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Target: {formatDate(milestone.target_date)}
                            </span>
                          )}
                          {milestone.approved_at && (
                            <span className="flex items-center gap-1 text-success">
                              <CheckCircle2 className="w-3 h-3" />
                              Approved: {formatDate(milestone.approved_at)}
                            </span>
                          )}
                        </div>
                        {milestone.client_comment && (
                          <div className="mt-2 bg-charcoal-700/50 rounded-lg p-2 flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-steel-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-300 italic">"{milestone.client_comment}"</p>
                          </div>
                        )}
                      </div>

                      {/* Value and actions */}
                      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                        <p className="text-xl font-bold text-white">{formatCurrency(milestone.milestone_value)}</p>
                        {/* Invoice badge if generated */}
                        {milestone.invoice_number && (
                          <span className="text-xs text-steel-400 bg-steel-500/20 px-2 py-0.5 rounded">
                            {milestone.invoice_number}
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          {milestone.status === 'draft' && (
                            <button
                              onClick={() => handleStatusChange(milestone, 'submitted')}
                              className="p-2 text-steel-400 hover:text-steel-300 hover:bg-steel-500/20 rounded-lg transition-colors"
                              title="Submit for approval"
                              data-testid={`submit-milestone-${index}`}
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          {milestone.status === 'approved' && !milestone.invoice_number && (
                            <button
                              onClick={() => generateInvoice(milestone)}
                              className="p-2 text-steel-400 hover:text-steel-300 hover:bg-steel-500/20 rounded-lg transition-colors flex items-center gap-1"
                              title="Generate Invoice"
                              data-testid={`generate-invoice-${index}`}
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                          {milestone.status === 'approved' && milestone.invoice_number && (
                            <button
                              onClick={() => generateInvoice(milestone)}
                              className="p-2 text-gray-400 hover:text-white hover:bg-charcoal-600 rounded-lg transition-colors"
                              title="Download Invoice"
                              data-testid={`download-invoice-${index}`}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          {milestone.status === 'approved' && (
                            <button
                              onClick={() => handleStatusChange(milestone, 'paid')}
                              className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 rounded-lg transition-colors"
                              title="Mark as paid"
                              data-testid={`mark-paid-${index}`}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {!isLocked && (
                            <>
                              <button
                                onClick={() => openEditModal(milestone)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-charcoal-600 rounded-lg transition-colors"
                                title="Edit"
                                data-testid={`edit-milestone-${index}`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(milestone.id)}
                                className="p-2 text-gray-400 hover:text-risk hover:bg-risk/20 rounded-lg transition-colors"
                                title="Delete"
                                data-testid={`delete-milestone-${index}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={resetForm} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto bg-charcoal-800 rounded-2xl border border-charcoal-700 p-6 z-50 max-h-[90vh] overflow-y-auto" data-testid="milestone-modal">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingMilestone ? 'Edit Milestone' : 'Add Milestone'}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Milestone Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
                  placeholder="e.g., Rough-in Complete"
                  required
                  data-testid="milestone-name-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors h-20 resize-none"
                  placeholder="Describe what this milestone includes..."
                  data-testid="milestone-description-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">% of Contract</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.percentage_of_contract}
                    onChange={(e) => handlePercentageChange(e.target.value)}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
                    placeholder="25"
                    data-testid="milestone-percentage-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Value ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.milestone_value}
                    onChange={(e) => handleValueChange(e.target.value)}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
                    placeholder="50000"
                    data-testid="milestone-value-input"
                  />
                </div>
              </div>

              {contractValue > 0 && (
                <p className="text-xs text-gray-500">
                  Contract value: {formatCurrency(contractValue)}
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Target Completion Date</label>
                <input
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
                  data-testid="milestone-date-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Internal Notes</label>
                <textarea
                  value={formData.internal_notes}
                  onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors h-16 resize-none"
                  placeholder="Notes visible only to you..."
                  data-testid="milestone-notes-input"
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
                  data-testid="save-milestone-btn"
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    editingMilestone ? 'Update Milestone' : 'Add Milestone'
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Share Link Modal */}
      {showShareModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowShareModal(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-charcoal-800 rounded-2xl border border-charcoal-700 p-6 z-50" data-testid="share-modal">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Client Review Link</h2>
              <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-4">
              Share this link with your client to allow them to view and approve milestones.
            </p>

            <div className="bg-charcoal-700 rounded-lg p-3 flex items-center gap-2 mb-4">
              <input
                type="text"
                value={shareLink || ''}
                readOnly
                className="flex-1 bg-transparent text-white text-sm outline-none"
              />
              <button
                onClick={copyToClipboard}
                className={`p-2 rounded-lg transition-colors ${copiedLink ? 'bg-success/20 text-success' : 'hover:bg-charcoal-600 text-gray-400'}`}
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 bg-charcoal-700 hover:bg-charcoal-600 text-white py-2.5 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
              <a
                href={shareLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-steel-500 hover:bg-steel-600 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Preview
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectMilestones;
