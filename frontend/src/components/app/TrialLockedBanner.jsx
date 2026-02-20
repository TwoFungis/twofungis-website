import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

/**
 * Trial and Locked mode banners for dashboard
 * Shows based on access state from authStore
 */
const TrialLockedBanner = () => {
  const { accessState, trialDaysRemaining, accessRestrictions } = useAuthStore();
  
  // Don't show for ACTIVE users
  if (accessState === 'ACTIVE') {
    return null;
  }
  
  // TRIAL Banner
  if (accessState === 'TRIAL') {
    return (
      <div 
        className="bg-gradient-to-r from-steel-500/20 via-steel-500/10 to-steel-500/20 rounded-xl border border-steel-500/40 p-4"
        data-testid="trial-banner"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-steel-500/30 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-steel-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-steel-400">PRO Trial</h3>
                <span className="bg-steel-500/30 text-steel-300 text-xs px-2 py-0.5 rounded-full font-medium">
                  {trialDaysRemaining} {trialDaysRemaining === 1 ? 'day' : 'days'} left
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                You have full access to all PRO features during your trial.
              </p>
            </div>
          </div>
          <Link 
            to="/app/settings"
            className="hidden sm:flex items-center gap-2 bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Subscribe
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }
  
  // LOCKED Banner
  if (accessState === 'LOCKED') {
    return (
      <div 
        className="bg-gradient-to-r from-risk/20 via-risk/10 to-risk/20 rounded-xl border border-risk/40 p-4"
        data-testid="locked-banner"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-risk/30 rounded-full flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-risk" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-risk">Trial Ended</h3>
              </div>
              <p className="text-gray-400 text-sm">
                Subscribe to continue sending invoices and using AI.
                {!accessRestrictions.canSend && (
                  <span className="text-gray-500 ml-1">Sending is disabled.</span>
                )}
              </p>
            </div>
          </div>
          <Link 
            to="/app/settings"
            className="flex items-center gap-2 bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            Upgrade Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        {/* Restrictions summary - mobile friendly */}
        <div className="mt-3 pt-3 border-t border-risk/20 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <span className={accessRestrictions.canCreateProject ? 'text-success' : 'text-risk'}>
              {accessRestrictions.canCreateProject ? '1' : '0'}
            </span>
            <span>project left</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={accessRestrictions.canCreateQuote ? 'text-success' : 'text-risk'}>
              {accessRestrictions.canCreateQuote ? '1' : '0'}
            </span>
            <span>quote left</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={accessRestrictions.canCreateInvoice ? 'text-success' : 'text-risk'}>
              {accessRestrictions.canCreateInvoice ? '1' : '0'}
            </span>
            <span>invoice left</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={accessRestrictions.aiRemaining > 0 ? 'text-success' : 'text-risk'}>
              {accessRestrictions.aiRemaining}
            </span>
            <span>AI msgs today</span>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
};

export default TrialLockedBanner;
