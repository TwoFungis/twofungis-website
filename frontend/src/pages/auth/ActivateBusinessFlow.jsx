import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Check, DollarSign, FolderKanban, Flag, Receipt, 
  Camera, Upload, X, Sparkles, TrendingUp, Wallet, Clock,
  ChevronRight, AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const STEPS = [
  { id: 'labor', title: 'Set Labor Rate', icon: DollarSign, description: 'Your hourly rate for billing' },
  { id: 'project', title: 'First Project', icon: FolderKanban, description: 'Create your first job' },
  { id: 'milestone', title: 'Add Milestone', icon: Flag, description: 'Set a payment milestone' },
  { id: 'invoice', title: 'Generate Invoice', icon: Receipt, description: 'Bill for the milestone' },
  { id: 'receipt', title: 'Upload Receipt', icon: Camera, description: 'Track an expense' }
];

const ActivateBusinessFlow = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile, fetchProfile } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdData, setCreatedData] = useState({
    project: null,
    milestone: null,
    invoice: null,
    expense: null
  });
  
  // Financial metrics for success screen
  const [metrics, setMetrics] = useState({
    projectedProfit: 0,
    margin: 0,
    outstandingReceivables: 0,
    cashFlowForecast: 0
  });

  // Form data for each step
  const [laborRate, setLaborRate] = useState(profile?.labor_rate || '');
  const [projectData, setProjectData] = useState({ name: '', client_gc: '', contract_value: '' });
  const [milestoneData, setMilestoneData] = useState({ name: 'Initial Payment', amount: '', due_date: '' });
  const [receiptData, setReceiptData] = useState({ description: '', amount: '', category: 'Materials' });
  const [receiptFile, setReceiptFile] = useState(null);

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    };
  };

  // Step 1: Set Labor Rate
  const handleLaborRate = async () => {
    if (!laborRate || parseFloat(laborRate) <= 0) {
      toast.error('Please enter a valid labor rate');
      return false;
    }
    
    setIsSubmitting(true);
    try {
      // Try to save to DB first (source of truth)
      const result = await updateProfile({ labor_rate: parseFloat(laborRate) });
      const dbSaveSuccess = !result?.error;
      
      if (dbSaveSuccess) {
        // Clear localStorage since DB is authoritative
        localStorage.removeItem('tradeos_labor_rate');
        if (process.env.NODE_ENV === 'development') {
          console.log('[Activation] Labor rate saved to DB');
        }
      } else {
        // Use localStorage only as fallback if DB save failed
        localStorage.setItem('tradeos_labor_rate', laborRate);
        if (process.env.NODE_ENV === 'development') {
          console.log('[Activation] Labor rate saved to localStorage (fallback)');
        }
      }
      
      toast.success('Labor rate saved!');
      return true;
    } catch (err) {
      console.warn('Labor rate save error:', err);
      // Save to localStorage as fallback
      localStorage.setItem('tradeos_labor_rate', laborRate);
      toast.success('Labor rate saved!');
      return true;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Create Project
  const handleCreateProject = async () => {
    if (!projectData.name) {
      toast.error('Please enter a project name');
      return false;
    }
    
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.from('projects').insert({
        user_id: user.id,
        name: projectData.name,
        client_gc: projectData.client_gc || 'My Client',
        contract_value: parseFloat(projectData.contract_value) || 0,
        status: 'active',
        approved_cos: 0,
        cost_to_date: 0,
        percent_complete: 0,
        forecast_margin: 20,
        risk_flag: 'green'
      }).select().single();

      if (error) throw error;
      
      setCreatedData(prev => ({ ...prev, project: data }));
      
      // Pre-fill milestone with 50% of contract
      if (data.contract_value > 0) {
        setMilestoneData(prev => ({
          ...prev,
          amount: (data.contract_value * 0.5).toString(),
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }));
      }
      
      toast.success('Project created!');
      return true;
    } catch (err) {
      console.error('Error creating project:', err);
      toast.error('Failed to create project');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Add Milestone
  const handleAddMilestone = async () => {
    if (!milestoneData.name || !milestoneData.amount) {
      toast.error('Please enter milestone details');
      return false;
    }
    
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.from('project_milestones').insert({
        user_id: user.id,
        project_id: createdData.project?.id,
        name: milestoneData.name,
        amount: parseFloat(milestoneData.amount),
        due_date: milestoneData.due_date || null,
        status: 'pending'
      }).select().single();

      if (error) throw error;
      
      setCreatedData(prev => ({ ...prev, milestone: data }));
      toast.success('Milestone added!');
      return true;
    } catch (err) {
      console.error('Error creating milestone:', err);
      toast.error('Failed to add milestone');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 4: Generate Invoice
  const handleGenerateInvoice = async () => {
    setIsSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/invoices`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          client_name: createdData.project?.client_gc || 'Client',
          client_email: '',
          project_name: createdData.project?.name,
          payment_terms: 'Net 30',
          payment_terms_days: 30,
          tax_rate: 0,
          line_items: [{
            description: createdData.milestone?.name || 'Initial Payment',
            quantity: 1,
            unit_price: parseFloat(createdData.milestone?.amount) || 0
          }]
        })
      });

      if (!response.ok) throw new Error('Failed to create invoice');
      
      const data = await response.json();
      setCreatedData(prev => ({ ...prev, invoice: data }));
      toast.success('Invoice generated!');
      return true;
    } catch (err) {
      console.error('Error creating invoice:', err);
      toast.error('Failed to generate invoice');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 5: Upload Receipt / Add Expense
  const handleAddExpense = async () => {
    if (!receiptData.description || !receiptData.amount) {
      toast.error('Please enter expense details');
      return false;
    }
    
    setIsSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/expenses`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          description: receiptData.description,
          amount: parseFloat(receiptData.amount),
          category: receiptData.category,
          project_id: createdData.project?.id,
          project_name: createdData.project?.name,
          expense_date: new Date().toISOString(),
          business_personal: 'Business',
          deductibility_pct: 100,
          payment_method: 'Cash'
        })
      });

      if (!response.ok) throw new Error('Failed to create expense');
      
      const data = await response.json();
      setCreatedData(prev => ({ ...prev, expense: data }));
      toast.success('Expense recorded!');
      return true;
    } catch (err) {
      console.error('Error creating expense:', err);
      toast.error('Failed to record expense');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate metrics for success screen
  const calculateMetrics = () => {
    const contractValue = parseFloat(createdData.project?.contract_value) || 0;
    const expenseAmount = parseFloat(receiptData.amount) || 0;
    const milestoneAmount = parseFloat(createdData.milestone?.amount) || 0;
    
    const projectedProfit = contractValue - expenseAmount;
    const margin = contractValue > 0 ? ((projectedProfit / contractValue) * 100) : 0;
    
    setMetrics({
      projectedProfit,
      margin: Math.round(margin * 10) / 10,
      outstandingReceivables: milestoneAmount,
      cashFlowForecast: milestoneAmount - expenseAmount
    });
  };

  // Handle step completion
  const handleNextStep = async () => {
    let success = false;
    
    switch (currentStep) {
      case 0:
        success = await handleLaborRate();
        break;
      case 1:
        success = await handleCreateProject();
        break;
      case 2:
        success = await handleAddMilestone();
        break;
      case 3:
        success = await handleGenerateInvoice();
        break;
      case 4:
        success = await handleAddExpense();
        break;
      default:
        success = true;
    }
    
    if (success) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        // Complete activation
        calculateMetrics();
        
        // Try to save to DB first (source of truth)
        let dbSaveSuccess = false;
        try {
          const result = await updateProfile({ business_activated: true });
          dbSaveSuccess = !result?.error;
          if (dbSaveSuccess && process.env.NODE_ENV === 'development') {
            console.log('[Activation] Saved to DB successfully');
          }
        } catch (err) {
          console.warn('Activation DB save failed:', err);
        }
        
        // Use localStorage only as fallback if DB save failed
        if (!dbSaveSuccess) {
          localStorage.setItem('tradeos_activation_completed', 'true');
          if (process.env.NODE_ENV === 'development') {
            console.log('[Activation] Fallback to localStorage');
          }
        } else {
          // Clear any stale localStorage since DB is now authoritative
          localStorage.removeItem('tradeos_activation_completed');
        }
        localStorage.removeItem('tradeos_activation_skipped');
        
        setShowSuccess(true);
      }
    }
  };

  // Skip activation flow
  const handleSkip = async () => {
    // Try to save to DB first (source of truth)
    let dbSaveSuccess = false;
    try {
      const result = await updateProfile({ business_activation_skipped: true });
      dbSaveSuccess = !result?.error;
    } catch (err) {
      console.warn('Skip flag DB save failed:', err);
    }
    
    // Use localStorage only as fallback if DB save failed
    if (!dbSaveSuccess) {
      localStorage.setItem('tradeos_activation_skipped', 'true');
      if (process.env.NODE_ENV === 'development') {
        console.log('[Activation] Skip state saved to localStorage (fallback)');
      }
    } else {
      localStorage.removeItem('tradeos_activation_skipped');
      if (process.env.NODE_ENV === 'development') {
        console.log('[Activation] Skip state saved to DB');
      }
    }
    
    // Navigate to /app - Command Center is the universal entry point
    navigate('/app');
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-CA', { 
      style: 'currency', 
      currency: 'CAD', 
      maximumFractionDigits: 0 
    }).format(value || 0);
  };

  // Progress percentage
  const progressPercent = ((currentStep + 1) / STEPS.length) * 100;

  // Success Screen
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-charcoal-900 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <Sparkles className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Your Business is Activated!</h1>
            <p className="text-gray-400">You're ready to track margins, receivables, and tax-ready expenses.</p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6 text-center">
              <TrendingUp className="w-8 h-8 text-success mx-auto mb-3" />
              <p className="text-gray-400 text-sm mb-1">Projected Profit</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(metrics.projectedProfit)}</p>
            </div>
            
            <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6 text-center">
              <div className="w-8 h-8 bg-steel-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-steel-400 font-bold">%</span>
              </div>
              <p className="text-gray-400 text-sm mb-1">Margin</p>
              <p className={`text-2xl font-bold ${metrics.margin >= 15 ? 'text-success' : metrics.margin >= 10 ? 'text-warning' : 'text-risk'}`}>
                {metrics.margin}%
              </p>
            </div>
            
            <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6 text-center">
              <Wallet className="w-8 h-8 text-steel-400 mx-auto mb-3" />
              <p className="text-gray-400 text-sm mb-1">Outstanding Receivables</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(metrics.outstandingReceivables)}</p>
            </div>
            
            <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6 text-center">
              <Clock className="w-8 h-8 text-steel-400 mx-auto mb-3" />
              <p className="text-gray-400 text-sm mb-1">30-Day Cash Flow</p>
              <p className={`text-2xl font-bold ${metrics.cashFlowForecast >= 0 ? 'text-success' : 'text-risk'}`}>
                {metrics.cashFlowForecast >= 0 ? '+' : ''}{formatCurrency(metrics.cashFlowForecast)}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/app')}
            className="w-full bg-steel-500 hover:bg-steel-600 text-white py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2"
            data-testid="go-to-dashboard-btn"
          >
            Go to Dashboard
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal-900 flex items-center justify-center px-4 py-8">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <img src="/shield-icon.png" alt="TradeOS" className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h1 className="text-2xl font-bold text-white mb-1">Activate Your Business</h1>
          <p className="text-gray-400 text-sm">Complete in under 2 minutes</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Step {currentStep + 1} of {STEPS.length}</span>
            <span className="text-xs text-steel-400">{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 bg-charcoal-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-steel-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between mb-8 px-2">
          {STEPS.map((step, idx) => {
            const StepIcon = step.icon;
            const isComplete = idx < currentStep;
            const isCurrent = idx === currentStep;
            
            return (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isComplete ? 'bg-success text-white' :
                  isCurrent ? 'bg-steel-500 text-white ring-2 ring-steel-400 ring-offset-2 ring-offset-charcoal-900' :
                  'bg-charcoal-700 text-gray-500'
                }`}>
                  {isComplete ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                </div>
                <span className={`text-xs mt-2 ${isCurrent ? 'text-white' : 'text-gray-500'}`}>
                  {step.title.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="bg-charcoal-800 rounded-2xl border border-charcoal-700 p-6" data-testid="activation-form">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-steel-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              {React.createElement(STEPS[currentStep].icon, { className: "w-7 h-7 text-steel-400" })}
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{STEPS[currentStep].title}</h2>
            <p className="text-gray-400 text-sm">{STEPS[currentStep].description}</p>
          </div>

          {/* Step 1: Labor Rate */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Hourly Labor Rate ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="number"
                    value={laborRate}
                    onChange={(e) => setLaborRate(e.target.value)}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl pl-12 pr-4 py-4 text-white text-xl font-semibold placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                    placeholder="65"
                    min="1"
                    data-testid="labor-rate-input"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">/hour</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Used for estimating and time tracking</p>
              </div>
              
              <div className="bg-charcoal-700/50 rounded-lg p-3 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-steel-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-400">
                  Tip: Include your burden rate (benefits, taxes, overhead). Most contractors charge 2-3x their base wage.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Project */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Project Name *</label>
                <input
                  type="text"
                  value={projectData.name}
                  onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                  placeholder="Kitchen Renovation - Smith"
                  data-testid="project-name-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Client / GC</label>
                <input
                  type="text"
                  value={projectData.client_gc}
                  onChange={(e) => setProjectData({ ...projectData, client_gc: e.target.value })}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                  placeholder="John Smith"
                  data-testid="project-client-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Contract Value ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="number"
                    value={projectData.contract_value}
                    onChange={(e) => setProjectData({ ...projectData, contract_value: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                    placeholder="15000"
                    data-testid="project-value-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Milestone */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="bg-charcoal-700/50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-400">
                  <span className="text-white font-medium">{createdData.project?.name}</span>
                  <span className="mx-2">•</span>
                  {formatCurrency(createdData.project?.contract_value)}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Milestone Name</label>
                <input
                  type="text"
                  value={milestoneData.name}
                  onChange={(e) => setMilestoneData({ ...milestoneData, name: e.target.value })}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                  placeholder="Initial Deposit"
                  data-testid="milestone-name-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Amount ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="number"
                    value={milestoneData.amount}
                    onChange={(e) => setMilestoneData({ ...milestoneData, amount: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                    placeholder="7500"
                    data-testid="milestone-amount-input"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Due Date</label>
                <input
                  type="date"
                  value={milestoneData.due_date}
                  onChange={(e) => setMilestoneData({ ...milestoneData, due_date: e.target.value })}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                  data-testid="milestone-date-input"
                />
              </div>
            </div>
          )}

          {/* Step 4: Invoice */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="bg-success/10 border border-success/30 rounded-xl p-4">
                <p className="text-success text-sm font-medium mb-1">Ready to Invoice</p>
                <p className="text-white text-lg font-bold">{formatCurrency(createdData.milestone?.amount)}</p>
                <p className="text-gray-400 text-sm">{createdData.milestone?.name} • {createdData.project?.name}</p>
              </div>
              
              <p className="text-gray-400 text-sm text-center">
                Click continue to generate an invoice for this milestone. You can add client email later to send it.
              </p>
            </div>
          )}

          {/* Step 5: Receipt/Expense */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Expense Description</label>
                <input
                  type="text"
                  value={receiptData.description}
                  onChange={(e) => setReceiptData({ ...receiptData, description: e.target.value })}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                  placeholder="Lumber from Home Depot"
                  data-testid="expense-desc-input"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Amount ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="number"
                      value={receiptData.amount}
                      onChange={(e) => setReceiptData({ ...receiptData, amount: e.target.value })}
                      className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                      placeholder="250"
                      data-testid="expense-amount-input"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select
                    value={receiptData.category}
                    onChange={(e) => setReceiptData({ ...receiptData, category: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                    data-testid="expense-category-select"
                  >
                    <option value="Materials">Materials</option>
                    <option value="Tools">Tools</option>
                    <option value="Vehicle & Fuel">Vehicle & Fuel</option>
                    <option value="Subcontractors">Subcontractors</option>
                    <option value="Meals">Meals</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              
              {/* Photo Upload (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Receipt Photo (Optional)</label>
                <label className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-charcoal-600 rounded-xl cursor-pointer hover:border-steel-500 transition-colors">
                  <Camera className="w-6 h-6 text-gray-500" />
                  <span className="text-gray-400 text-sm">
                    {receiptFile ? receiptFile.name : 'Tap to upload or take photo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={handleNextStep}
              disabled={isSubmitting}
              className="flex-1 bg-steel-500 hover:bg-steel-600 disabled:opacity-50 text-white py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              data-testid="activation-next-btn"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : currentStep === STEPS.length - 1 ? (
                <>
                  Complete Setup
                  <Sparkles className="w-5 h-5" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          {/* Skip Option */}
          <button
            onClick={handleSkip}
            className="w-full mt-4 text-gray-500 hover:text-gray-400 text-sm py-2 transition-colors"
            data-testid="skip-activation-btn"
          >
            Skip for now (you can complete this later)
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-6">
          TradeOS™ • Built for Builders
        </p>
      </div>
    </div>
  );
};

export default ActivateBusinessFlow;
