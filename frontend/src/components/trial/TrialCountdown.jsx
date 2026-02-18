import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, AlertTriangle, X, Crown, Zap } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const TrialCountdown = () => {
  const { profile } = useAuthStore();
  const [daysRemaining, setDaysRemaining] = useState(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderDismissed, setReminderDismissed] = useState({});

  useEffect(() => {
    if (profile?.trial_ends_at && profile?.subscription_tier === 'trial') {
      const trialEnd = new Date(profile.trial_ends_at);
      const now = new Date();
      const diffTime = trialEnd - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysRemaining(Math.max(0, diffDays));
    } else {
      setDaysRemaining(null);
    }
  }, [profile]);

  // Check if we should show reminder modal
  useEffect(() => {
    if (daysRemaining === null) return;
    
    const dismissedKey = `tradeos_reminder_dismissed_${daysRemaining}`;
    const wasDismissed = localStorage.getItem(dismissedKey);
    
    // Show modal at specific days: 7, 3, 1, 0
    const showAtDays = [7, 3, 1, 0];
    if (showAtDays.includes(daysRemaining) && !wasDismissed) {
      setShowReminderModal(true);
    }
  }, [daysRemaining]);

  const dismissReminder = () => {
    const dismissedKey = `tradeos_reminder_dismissed_${daysRemaining}`;
    localStorage.setItem(dismissedKey, 'true');
    setShowReminderModal(false);
    setReminderDismissed(prev => ({ ...prev, [daysRemaining]: true }));
  };

  // Don't show for non-trial users
  if (!profile || profile.subscription_tier !== 'trial' || daysRemaining === null) {
    return null;
  }

  // Determine urgency level
  const getUrgencyStyle = () => {
    if (daysRemaining <= 1) return 'bg-risk/20 text-risk border-risk/30';
    if (daysRemaining <= 3) return 'bg-warning/20 text-warning border-warning/30';
    if (daysRemaining <= 7) return 'bg-slate-300/20 text-slate-200 border-slate-300/40';
    return 'bg-slate-400/15 text-slate-300 border-slate-400/30';
  };

  const getIcon = () => {
    if (daysRemaining <= 1) return <AlertTriangle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  return (
    <>
      {/* Header Badge */}
      <Link
        to="/app/settings"
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors hover:opacity-80 ${getUrgencyStyle()}`}
        data-testid="trial-countdown-badge"
      >
        {getIcon()}
        <span>
          {daysRemaining === 0 
            ? 'Trial ends today!' 
            : daysRemaining === 1 
              ? '1 day left' 
              : `${daysRemaining} days left`
          }
        </span>
      </Link>

      {/* Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className={`p-6 ${
              daysRemaining <= 1 
                ? 'bg-gradient-to-r from-risk/20 to-risk/10' 
                : daysRemaining <= 3 
                  ? 'bg-gradient-to-r from-warning/20 to-warning/10'
                  : 'bg-gradient-to-r from-steel-500/20 to-steel-500/10'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    daysRemaining <= 1 ? 'bg-risk/20' : daysRemaining <= 3 ? 'bg-warning/20' : 'bg-steel-500/20'
                  }`}>
                    {daysRemaining === 0 ? (
                      <AlertTriangle className={`w-6 h-6 ${daysRemaining <= 1 ? 'text-risk' : 'text-warning'}`} />
                    ) : (
                      <Clock className={`w-6 h-6 ${daysRemaining <= 3 ? 'text-warning' : 'text-steel-400'}`} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {daysRemaining === 0 
                        ? 'Your trial ends today!'
                        : daysRemaining === 1 
                          ? 'Last day of your trial!'
                          : `${daysRemaining} days left in your trial`
                      }
                    </h3>
                    <p className="text-sm text-gray-400">
                      {daysRemaining <= 3 
                        ? "Don't lose access to your data"
                        : "Unlock all features with a subscription"
                      }
                    </p>
                  </div>
                </div>
                <button
                  onClick={dismissReminder}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {daysRemaining === 0 ? (
                <div className="space-y-4">
                  <p className="text-gray-300">
                    Your 30-day trial is ending today. Upgrade now to keep access to:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-steel-400" /> All your projects and data
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-steel-400" /> Invoicing and milestone tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-steel-400" /> Financial reports and analytics
                    </li>
                  </ul>
                </div>
              ) : daysRemaining <= 3 ? (
                <div className="space-y-4">
                  <p className="text-gray-300">
                    Time is running out! Upgrade to Pro or Elite to continue using TradeOS without interruption.
                  </p>
                  <div className="bg-charcoal-700/50 rounded-lg p-4">
                    <p className="text-sm text-gray-400">
                      <span className="text-white font-medium">Your data is safe.</span> Even after the trial, your projects and records are preserved. You can access them anytime by upgrading.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-300">
                    You're making great progress! Consider upgrading to unlock advanced features and support your growing business.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-charcoal-700/50 rounded-lg p-3 text-center">
                      <Crown className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-400">Elite Reports</p>
                    </div>
                    <div className="bg-charcoal-700/50 rounded-lg p-3 text-center">
                      <Zap className="w-5 h-5 text-steel-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-400">Unlimited Projects</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={dismissReminder}
                  className="flex-1 px-4 py-2 text-gray-400 hover:text-white border border-charcoal-600 rounded-lg transition-colors"
                >
                  Remind me later
                </button>
                <Link
                  to="/app/settings"
                  onClick={dismissReminder}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium text-center transition-colors ${
                    daysRemaining <= 3 
                      ? 'bg-warning hover:bg-warning/90 text-charcoal-900'
                      : 'bg-steel-500 hover:bg-steel-600 text-white'
                  }`}
                >
                  Upgrade Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TrialCountdown;
