import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Calendar,
  Building,
  User,
  MessageSquare,
  AlertCircle,
  Check,
  Send,
  Shield
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const statusConfig = {
  submitted: { label: 'Awaiting Approval', color: 'bg-steel-500', textColor: 'text-steel-400', bgLight: 'bg-steel-500/20' },
  approved: { label: 'Approved', color: 'bg-success', textColor: 'text-success', bgLight: 'bg-success/20' },
  paid: { label: 'Paid', color: 'bg-emerald-700', textColor: 'text-emerald-400', bgLight: 'bg-emerald-700/20' }
};

const ClientReviewPage = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [projectInfo, setProjectInfo] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [commentModal, setCommentModal] = useState(null);
  const [comment, setComment] = useState('');
  const [clientName, setClientName] = useState('');
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchMilestones = useCallback(async () => {
    if (!token) {
      setError('Invalid link');
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .rpc('get_milestones_by_token', { approval_token: token });

      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        setError('This link is invalid or has expired.');
        setLoading(false);
        return;
      }

      // Extract project info from first milestone
      const firstMilestone = data[0];
      setProjectInfo({
        name: firstMilestone.project_name,
        contractor_name: firstMilestone.contractor_name,
        contractor_company: firstMilestone.contractor_company
      });

      setMilestones(data);
    } catch (err) {
      console.error('Error fetching milestones:', err);
      setError('Unable to load milestones. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const handleApprove = async () => {
    if (!commentModal) return;
    
    setApprovingId(commentModal);
    
    try {
      const { data, error: approveError } = await supabase
        .rpc('approve_milestone_by_token', {
          approval_token: token,
          milestone_uuid: commentModal,
          client_comment_text: comment || null,
          client_name_input: clientName || 'Client'
        });

      if (approveError) throw approveError;

      if (data?.success) {
        setSuccessMessage('Milestone approved successfully!');
        setCommentModal(null);
        setComment('');
        setClientName('');
        fetchMilestones();
        
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(data?.error || 'Failed to approve milestone');
      }
    } catch (err) {
      console.error('Error approving milestone:', err);
      setError(err.message || 'Failed to approve milestone');
    } finally {
      setApprovingId(null);
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
    if (!date) return null;
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
    approved: acc.approved + (['approved', 'paid'].includes(m.status) ? parseFloat(m.milestone_value) || 0 : 0)
  }), { total: 0, pending: 0, approved: 0 });

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-steel-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading milestones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-charcoal-900 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-risk/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-risk" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Unable to Load</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact your contractor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal-900" data-testid="client-review-page">
      {/* Header */}
      <header className="bg-charcoal-800 border-b border-charcoal-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-steel-500/20 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-steel-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Secure Client Portal</p>
              <p className="text-xs text-gray-500">Powered by TradeOS</p>
            </div>
          </div>
          
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
            {projectInfo?.name || 'Project Milestones'}
          </h1>
          
          <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
            {projectInfo?.contractor_company && (
              <span className="flex items-center gap-1">
                <Building className="w-4 h-4" />
                {projectInfo.contractor_company}
              </span>
            )}
            {projectInfo?.contractor_name && (
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {projectInfo.contractor_name}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Success Message */}
      {successMessage && (
        <div className="max-w-4xl mx-auto px-4 mt-4">
          <div className="bg-success/20 border border-success/50 text-success p-4 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            {successMessage}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-charcoal-800 rounded-xl p-4 border border-charcoal-700">
            <p className="text-xs text-gray-400 mb-1">Total Value</p>
            <p className="text-xl lg:text-2xl font-bold text-white">{formatCurrency(totals.total)}</p>
          </div>
          <div className="bg-steel-500/10 rounded-xl p-4 border border-steel-500/30">
            <p className="text-xs text-steel-400 mb-1">Pending Approval</p>
            <p className="text-xl lg:text-2xl font-bold text-steel-400">{formatCurrency(totals.pending)}</p>
          </div>
          <div className="bg-success/10 rounded-xl p-4 border border-success/30">
            <p className="text-xs text-success mb-1">Approved</p>
            <p className="text-xl lg:text-2xl font-bold text-success">{formatCurrency(totals.approved)}</p>
          </div>
        </div>

        {/* Milestones List */}
        <h2 className="text-lg font-semibold text-white mb-4">Project Milestones</h2>
        
        <div className="space-y-4">
          {milestones.map((milestone, index) => {
            const status = statusConfig[milestone.status] || statusConfig.submitted;
            const canApprove = milestone.status === 'submitted';

            return (
              <div 
                key={milestone.id}
                className={`bg-charcoal-800 rounded-xl border transition-all ${
                  milestone.status === 'approved' || milestone.status === 'paid' ? 'border-success/30' : 'border-charcoal-700'
                }`}
                data-testid={`client-milestone-${index}`}
              >
                <div className="flex items-stretch">
                  <div className={`w-1.5 rounded-l-xl ${status.color}`} />
                  
                  <div className="flex-1 p-4 lg:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h3 className="text-lg font-semibold text-white">{milestone.name}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.bgLight} ${status.textColor}`}>
                            {status.label}
                          </span>
                        </div>
                        
                        {milestone.description && (
                          <p className="text-gray-400 mb-3">{milestone.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {milestone.percentage_of_contract || 0}% of contract
                          </span>
                          {milestone.target_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Target: {formatDate(milestone.target_date)}
                            </span>
                          )}
                        </div>

                        {milestone.approved_at && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-success">
                            <CheckCircle2 className="w-4 h-4" />
                            Approved on {formatDate(milestone.approved_at)}
                          </div>
                        )}

                        {milestone.client_comment && (
                          <div className="mt-3 bg-charcoal-700/50 rounded-lg p-3 flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-steel-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-300">"{milestone.client_comment}"</p>
                          </div>
                        )}
                      </div>

                      {/* Value and Action */}
                      <div className="flex flex-col items-end gap-3">
                        <p className="text-2xl font-bold text-white">{formatCurrency(milestone.milestone_value)}</p>
                        
                        {canApprove && (
                          <button
                            onClick={() => setCommentModal(milestone.id)}
                            disabled={approvingId === milestone.id}
                            className="bg-success hover:bg-success/80 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
                            data-testid={`approve-btn-${index}`}
                          >
                            {approvingId === milestone.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                            ) : (
                              <>
                                <Check className="w-4 h-4" />
                                Approve
                              </>
                            )}
                          </button>
                        )}

                        {milestone.status === 'approved' && (
                          <span className="flex items-center gap-1 text-success text-sm">
                            <CheckCircle2 className="w-4 h-4" />
                            Approved
                          </span>
                        )}

                        {milestone.status === 'paid' && (
                          <span className="flex items-center gap-1 text-emerald-400 text-sm">
                            <CheckCircle2 className="w-4 h-4" />
                            Paid
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-8 bg-charcoal-800/50 border border-charcoal-700 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-400">
            Questions about this project? Contact your contractor directly.
          </p>
        </div>
      </div>

      {/* Approval Modal */}
      {commentModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setCommentModal(null)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-charcoal-800 rounded-2xl border border-charcoal-700 p-6 z-50" data-testid="approval-modal">
            <h2 className="text-xl font-bold text-white mb-2">Approve Milestone</h2>
            <p className="text-gray-400 text-sm mb-6">
              Confirm your approval for this milestone. You can optionally leave a comment.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Your Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
                  placeholder="Enter your name"
                  data-testid="client-name-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Comment (optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors h-24 resize-none"
                  placeholder="Add any notes or comments..."
                  data-testid="client-comment-input"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => setCommentModal(null)}
                  className="flex-1 bg-charcoal-700 hover:bg-charcoal-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={approvingId}
                  className="flex-1 bg-success hover:bg-success/80 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  data-testid="confirm-approve-btn"
                >
                  {approvingId ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Confirm Approval
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ClientReviewPage;
