import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, Circle, FolderKanban, DollarSign, FileText, 
  Receipt, Flag, Wallet, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

const CHECKLIST_ITEMS = [
  {
    id: 'project',
    label: 'Create first project',
    description: 'Start tracking your work',
    icon: FolderKanban,
    path: '/app/projects?new=true',
    checkField: 'has_project'
  },
  {
    id: 'labor_rate',
    label: 'Set labor rate',
    description: 'Configure your hourly rate',
    icon: DollarSign,
    path: '/app/settings#labor-rate',
    checkField: 'has_labor_rate'
  },
  {
    id: 'quote',
    label: 'Create first quote',
    description: 'Send your first estimate',
    icon: FileText,
    path: '/app/estimating?new=true',
    checkField: 'has_quote'
  },
  {
    id: 'expense',
    label: 'Add first expense',
    description: 'Track your costs',
    icon: Wallet,
    path: '/app/expenses?new=true',
    checkField: 'has_expense'
  },
  {
    id: 'milestone',
    label: 'Create first milestone',
    description: 'Break down project payments',
    icon: Flag,
    path: '/app/milestones?new=true',
    checkField: 'has_milestone'
  },
  {
    id: 'invoice',
    label: 'Generate first invoice',
    description: 'Get paid for your work',
    icon: Receipt,
    path: '/app/invoices?new=true',
    checkField: 'has_invoice'
  }
];

const SetupProgressChecklist = () => {
  const { user, profile } = useAuthStore();
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (user) {
      checkProgress();
    }
  }, [user]);

  // Check if already dismissed in localStorage
  useEffect(() => {
    const wasDismissed = localStorage.getItem('tradeos_setup_dismissed');
    if (wasDismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  const checkProgress = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [projectsRes, quotesRes, expensesRes, milestonesRes, invoicesRes] = await Promise.all([
        supabase.from('projects').select('id').eq('user_id', user.id).limit(1),
        supabase.from('estimates').select('id').eq('user_id', user.id).limit(1),
        supabase.from('expenses').select('id').eq('user_id', user.id).limit(1),
        supabase.from('project_milestones').select('id').eq('user_id', user.id).limit(1),
        supabase.from('invoices').select('id').eq('user_id', user.id).limit(1)
      ]);

      setProgress({
        has_project: projectsRes.data?.length > 0,
        has_labor_rate: !!profile?.labor_rate,
        has_quote: quotesRes.data?.length > 0,
        has_expense: expensesRes.data?.length > 0,
        has_milestone: milestonesRes.data?.length > 0,
        has_invoice: invoicesRes.data?.length > 0
      });
    } catch (err) {
      console.error('Error checking setup progress:', err);
    } finally {
      setLoading(false);
    }
  };

  // Re-check when profile changes (for labor rate)
  useEffect(() => {
    if (profile) {
      setProgress(prev => ({
        ...prev,
        has_labor_rate: !!profile?.labor_rate
      }));
    }
  }, [profile?.labor_rate]);

  const completedCount = Object.values(progress).filter(Boolean).length;
  const totalCount = CHECKLIST_ITEMS.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  const isComplete = completedCount === totalCount;

  // Auto-dismiss when complete
  useEffect(() => {
    if (isComplete && !dismissed) {
      // Wait 3 seconds then collapse
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, dismissed]);

  const handleDismiss = () => {
    localStorage.setItem('tradeos_setup_dismissed', 'true');
    setDismissed(true);
  };

  // Don't show if dismissed or not on trial
  if (dismissed || loading) return null;
  
  // Don't show for paid users
  if (profile?.subscription_tier && !['trial', 'free'].includes(profile.subscription_tier)) {
    return null;
  }

  return (
    <div 
      className="bg-gradient-to-r from-slate-400/20 to-slate-300/10 rounded-xl border border-slate-400/40 overflow-hidden"
      data-testid="setup-progress-checklist"
    >
      {/* Header */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-400/10 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-300/30 rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-slate-200" />
          </div>
          <div>
            <h3 className="font-semibold text-white flex items-center gap-2">
              Setup Progress
              {isComplete && (
                <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
                  Complete!
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-400">
              {completedCount} of {totalCount} tasks completed
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Progress Circle */}
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-slate-500/30"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${progressPercent * 1.26} 126`}
                className={isComplete ? 'text-success' : 'text-slate-200'}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
              {progressPercent}%
            </span>
          </div>
          
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-400/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {CHECKLIST_ITEMS.map((item) => {
              const isCompleted = progress[item.checkField];
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isCompleted 
                      ? 'bg-success/10 border border-success/20' 
                      : 'bg-slate-400/10 border border-slate-400/30 hover:border-slate-300/50 hover:bg-slate-400/20'
                  }`}
                  data-testid={`setup-item-${item.id}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCompleted ? 'bg-success/20' : 'bg-slate-400/20'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : (
                      <Icon className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      isCompleted ? 'text-success line-through' : 'text-white'
                    }`}>
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{item.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Dismiss button when complete */}
          {isComplete && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss();
                }}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Dismiss checklist
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SetupProgressChecklist;
