import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Lock, Crown, Zap, Check, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const TrialExpiredModal = () => {
  const { profile } = useAuthStore();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if trial has expired
    if (profile?.subscription_tier === 'trial' && profile?.trial_ends_at) {
      const trialEnd = new Date(profile.trial_ends_at);
      const now = new Date();
      
      if (now > trialEnd) {
        // Trial has expired
        const wasDismissed = sessionStorage.getItem('tradeos_expired_modal_dismissed');
        if (!wasDismissed) {
          setShowModal(true);
        }
      }
    }
  }, [profile, location.pathname]);

  const handleDismiss = () => {
    sessionStorage.setItem('tradeos_expired_modal_dismissed', 'true');
    setShowModal(false);
    setDismissed(true);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-risk/20 via-warning/10 to-risk/20 p-6 text-center">
          <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-warning" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Your Trial Has Ended</h2>
          <p className="text-gray-400">
            Your 30-day free trial has expired. Upgrade to continue using TradeOS.
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Data preserved notice */}
          <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium">Your data is safe!</p>
                <p className="text-sm text-gray-400">
                  All your projects, invoices, and expenses are preserved. They'll be waiting for you when you upgrade.
                </p>
              </div>
            </div>
          </div>

          {/* What's locked */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
              Upgrade to unlock:
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Create new projects',
                'Generate invoices',
                'Track expenses',
                'Financial reports',
                'Milestone billing',
                'Document storage'
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                  <Zap className="w-4 h-4 text-steel-400" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border border-charcoal-600 rounded-lg p-4">
              <h4 className="font-bold text-white mb-1">Pro</h4>
              <p className="text-2xl font-bold text-steel-400 mb-2">
                $69<span className="text-sm text-gray-500">/mo</span>
              </p>
              <p className="text-xs text-gray-500">Perfect for growing trades</p>
            </div>
            <div className="border border-purple-500/50 rounded-lg p-4 bg-purple-500/5">
              <div className="flex items-center gap-1 mb-1">
                <h4 className="font-bold text-white">Elite</h4>
                <Crown className="w-4 h-4 text-warning" />
              </div>
              <p className="text-2xl font-bold text-purple-400 mb-2">
                $99<span className="text-sm text-gray-500">/mo</span>
              </p>
              <p className="text-xs text-gray-500">For serious operations</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-3 text-gray-400 hover:text-white border border-charcoal-600 rounded-lg transition-colors"
            >
              View limited access
            </button>
            <Link
              to="/app/settings"
              onClick={handleDismiss}
              className="flex-1 bg-steel-500 hover:bg-steel-600 text-white px-4 py-3 rounded-lg font-medium text-center transition-colors"
            >
              Upgrade Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialExpiredModal;
