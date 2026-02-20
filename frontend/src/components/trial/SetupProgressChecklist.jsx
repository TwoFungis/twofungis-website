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
  const { user, profile, setupProgress, setupProgressLoading, refreshSetupProgress } = useAuthStore();
  const [isExpanded, setIsExpanded] = useState(false); // Start minimized
  const [dismissed, setDismissed] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Initial load
  useEffect(() => {
    if (user) {
      refreshSetupProgress().finally(() => setInitialLoading(false));
    }
  }, [user]);

  // Check if already dismissed in localStorage
  useEffect(() => {
    const wasDismissed = localStorage.getItem('tradeos_setup_dismissed');
    if (wasDismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  // Update labor rate progress when profile changes
  useEffect(() => {
    if (profile?.labor_rate) {
      useAuthStore.getState().markSetupComplete('has_labor_rate');
    }
  }, [profile?.labor_rate]);

  const completedCount = Object.values(setupProgress).filter(Boolean).length;
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

  // Don't show if dismissed or still loading
  if (dismissed || initialLoading) return null;
  
  // Show for ALL users until setup is complete
  // User requested: "The setup progress bar must be visible on all accounts until all milestones are completed"
  if (isComplete) {
    // Auto-dismiss completed checklists
    return null;
  }

  return (
    <div 
      className="bg-charcoal-800 rounded-xl border border-charcoal-700 overflow-hidden"
      data-testid="setup-progress-checklist"
    >
      {/* Header - Always Dark */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer bg-charcoal-800 hover:bg-charcoal-700/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-steel-500/30 rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-steel-400" />
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
                className="text-charcoal-700"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${progressPercent * 1.26} 126`}
                className={isComplete ? 'text-success' : 'text-steel-400'}
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
        <div className="px-4 pb-4 border-t border-charcoal-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {CHECKLIST_ITEMS.map((item) => {
              const isCompleted = setupProgress[item.checkField];
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isCompleted 
                      ? 'bg-success/20 border border-success/40' 
                      : 'bg-charcoal-800 border border-charcoal-600 hover:border-steel-500/50 hover:bg-charcoal-700'
                  }`}
                  data-testid={`setup-item-${item.id}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCompleted ? 'bg-success/30' : 'bg-charcoal-700'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : (
                      <Icon className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      isCompleted ? 'text-success' : 'text-white'
                    }`}>
                      {item.label}
                    </p>
                    <p className={`text-xs truncate ${isCompleted ? 'text-success/70' : 'text-gray-500'}`}>{item.description}</p>
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
