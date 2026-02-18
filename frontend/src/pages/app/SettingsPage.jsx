import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Settings as SettingsIcon, User, CreditCard, Bell, Shield, Check, Loader2, Crown, FileText, Save } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SettingsPage = () => {
  const { profile, user, updateProfile } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  
  // Business Defaults State
  const [defaultPaymentDays, setDefaultPaymentDays] = useState(profile?.default_payment_days || 30);
  const [isSavingDefaults, setIsSavingDefaults] = useState(false);
  const [defaultsSaved, setDefaultsSaved] = useState(false);

  // Load defaults from profile
  useEffect(() => {
    if (profile?.default_payment_days) {
      setDefaultPaymentDays(profile.default_payment_days);
    }
  }, [profile]);

  const handleSaveDefaults = async () => {
    if (!user) return;
    
    setIsSavingDefaults(true);
    try {
      const { error } = await supabase
        .from('users_profile')
        .update({ default_payment_days: defaultPaymentDays })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setDefaultsSaved(true);
      setTimeout(() => setDefaultsSaved(false), 2000);
      
      // Update local profile
      if (updateProfile) {
        await updateProfile({ default_payment_days: defaultPaymentDays });
      }
    } catch (err) {
      console.error('Error saving defaults:', err);
    } finally {
      setIsSavingDefaults(false);
    }
  };

  // Check for payment return from Stripe
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const paymentStatus = searchParams.get('payment');
    
    if (sessionId && paymentStatus === 'success') {
      pollPaymentStatus(sessionId);
    } else if (paymentStatus === 'cancelled') {
      setPaymentMessage({ type: 'warning', text: 'Payment was cancelled. You can try again anytime.' });
    }
  }, [searchParams]);

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 5;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setPaymentMessage({ type: 'warning', text: 'Payment verification timed out. Please check your email for confirmation.' });
      setIsProcessingPayment(false);
      return;
    }

    setIsProcessingPayment(true);

    try {
      const response = await fetch(`${API_URL}/api/subscription/status/${sessionId}`);
      if (!response.ok) throw new Error('Failed to check payment status');
      
      const data = await response.json();
      
      if (data.payment_status === 'paid') {
        setPaymentMessage({ type: 'success', text: `Payment successful! You are now on the ${data.plan_type?.toUpperCase()} plan.` });
        setIsProcessingPayment(false);
        // Update local profile state
        if (updateProfile && data.plan_type) {
          await updateProfile({ subscription_tier: data.plan_type });
        }
        // Clear URL params
        window.history.replaceState({}, '', '/app/settings');
        return;
      } else if (data.status === 'expired') {
        setPaymentMessage({ type: 'error', text: 'Payment session expired. Please try again.' });
        setIsProcessingPayment(false);
        return;
      }
      
      // Continue polling
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setPaymentMessage({ type: 'error', text: 'Error checking payment status. Please contact support.' });
      setIsProcessingPayment(false);
    }
  };

  const handleUpgrade = async (planType) => {
    setIsUpgrading(true);
    setPaymentMessage(null);

    try {
      const response = await fetch(`${API_URL}/api/subscription/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_type: planType,
          origin_url: window.location.origin,
          user_id: user?.id,
          email: user?.email
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create checkout session');
      }

      const data = await response.json();
      
      // Redirect to Stripe Checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      setPaymentMessage({ type: 'error', text: error.message });
      setIsUpgrading(false);
    }
  };

  const currentPlan = profile?.subscription_tier || 'trial';

  return (
    <div className="space-y-6" data-testid="settings-page">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400">Manage your account and subscription</p>
      </div>

      {/* Payment Status Messages */}
      {paymentMessage && (
        <div className={`p-4 rounded-lg ${
          paymentMessage.type === 'success' ? 'bg-success/20 border border-success/50 text-success' :
          paymentMessage.type === 'error' ? 'bg-risk/20 border border-risk/50 text-risk' :
          'bg-warning/20 border border-warning/50 text-warning'
        }`}>
          {paymentMessage.text}
        </div>
      )}

      {isProcessingPayment && (
        <div className="flex items-center gap-3 p-4 bg-steel-500/20 border border-steel-500/50 rounded-lg text-steel-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Verifying your payment...</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-steel-400" />
              Profile Information
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                  <p className="text-white">{profile?.name || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                  <p className="text-white">{user?.email || 'Not set'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Company</label>
                  <p className="text-white">{profile?.company_name || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Trade</label>
                  <p className="text-white">{profile?.trade_type || 'Not set'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Region</label>
                  <p className="text-white">{profile?.region || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
                  <p className="text-white">{profile?.phone || 'Not set'}</p>
                </div>
              </div>
              <button className="bg-charcoal-700 hover:bg-charcoal-600 text-white px-4 py-2 rounded-lg font-medium transition-colors mt-4">
                Edit Profile
              </button>
            </div>
          </div>

          {/* Subscription Section */}
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
              <CreditCard className="w-5 h-5 text-steel-400" />
              Subscription & Billing
            </h2>
            
            {/* Current Plan */}
            <div className="mb-6">
              <p className="text-gray-400 text-sm mb-2">Current Plan</p>
              <div className="flex items-center gap-3">
                <span className={`text-xl font-bold capitalize ${
                  currentPlan === 'elite' ? 'text-steel-400' : 
                  currentPlan === 'pro' ? 'text-success' : 'text-warning'
                }`}>
                  {currentPlan}
                </span>
                {currentPlan === 'elite' && <Crown className="w-5 h-5 text-warning" />}
              </div>
            </div>

            {/* Plan Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Pro Plan */}
              <div className={`rounded-xl p-6 border ${
                currentPlan === 'pro' ? 'bg-success/10 border-success/50' : 'bg-charcoal-700 border-charcoal-600'
              }`}>
                <h3 className="text-lg font-bold text-white mb-1">Pro</h3>
                <p className="text-2xl font-bold text-white mb-4">$39<span className="text-sm text-gray-400">/mo</span></p>
                <ul className="space-y-2 mb-4 text-sm">
                  {['Unlimited Projects', 'Quote Builder + PDF', 'Change Order Manager', 'Labor Cost Engine', 'Production Logs'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-300">
                      <Check className="w-4 h-4 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                {currentPlan === 'pro' ? (
                  <span className="block w-full text-center py-2 rounded-lg bg-success/20 text-success font-medium">
                    Current Plan
                  </span>
                ) : currentPlan === 'elite' ? (
                  <span className="block w-full text-center py-2 rounded-lg bg-charcoal-600 text-gray-400 font-medium">
                    Downgrade not available
                  </span>
                ) : (
                  <button
                    onClick={() => handleUpgrade('pro')}
                    disabled={isUpgrading}
                    className="w-full bg-steel-500 hover:bg-steel-600 disabled:opacity-50 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    data-testid="upgrade-pro-btn"
                  >
                    {isUpgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upgrade to Pro'}
                  </button>
                )}
              </div>

              {/* Elite Plan */}
              <div className={`rounded-xl p-6 border-2 ${
                currentPlan === 'elite' ? 'bg-steel-500/10 border-steel-500' : 'bg-charcoal-700 border-steel-500/50'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-white">Elite</h3>
                  <Crown className="w-4 h-4 text-warning" />
                </div>
                <p className="text-2xl font-bold text-white mb-4">$59<span className="text-sm text-gray-400">/mo</span></p>
                <ul className="space-y-2 mb-4 text-sm">
                  {['Everything in Pro', 'Advanced Reports & KPIs', 'Production Analytics', 'Priority Support', 'Early Feature Access'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-300">
                      <Check className="w-4 h-4 text-steel-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                {currentPlan === 'elite' ? (
                  <span className="block w-full text-center py-2 rounded-lg bg-steel-500/20 text-steel-400 font-medium">
                    Current Plan
                  </span>
                ) : (
                  <button
                    onClick={() => handleUpgrade('elite')}
                    disabled={isUpgrading}
                    className="w-full bg-steel-500 hover:bg-steel-600 disabled:opacity-50 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    data-testid="upgrade-elite-btn"
                  >
                    {isUpgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upgrade to Elite'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Business Defaults Section */}
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-steel-400" />
              Business Defaults
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Default Payment Terms</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {[7, 14, 30, 45, 60].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setDefaultPaymentDays(days)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        defaultPaymentDays === days
                          ? 'bg-steel-500 text-white'
                          : 'bg-charcoal-700 text-gray-400 hover:text-white hover:bg-charcoal-600'
                      }`}
                    >
                      Net {days}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">Custom:</span>
                  <input
                    type="number"
                    min="1"
                    value={defaultPaymentDays}
                    onChange={(e) => setDefaultPaymentDays(parseInt(e.target.value) || 30)}
                    className="w-20 bg-charcoal-700 border border-charcoal-600 rounded px-3 py-2 text-white text-sm focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                  />
                  <span className="text-gray-400 text-sm">days</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">This will be used as the default for new quotes and invoices</p>
              </div>

              <button
                onClick={handleSaveDefaults}
                disabled={isSavingDefaults}
                className={`${defaultsSaved ? 'bg-success' : 'bg-steel-500 hover:bg-steel-600'} text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2`}
              >
                {isSavingDefaults ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : defaultsSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Defaults
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-steel-400" />
              Notifications
            </h2>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-400 text-sm">Email notifications</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-400 text-sm">CO reminders</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-400 text-sm">Weekly summary</span>
                <input type="checkbox" className="w-4 h-4 rounded" />
              </label>
            </div>
          </div>

          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-steel-400" />
              Security
            </h2>
            <div className="space-y-3">
              <button className="w-full text-left text-gray-400 hover:text-white text-sm transition-colors">
                Change password
              </button>
              <button className="w-full text-left text-gray-400 hover:text-white text-sm transition-colors">
                Two-factor authentication
              </button>
              <button className="w-full text-left text-gray-400 hover:text-white text-sm transition-colors">
                Active sessions
              </button>
            </div>
          </div>

          <div className="bg-risk/10 border border-risk/30 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-2">Danger Zone</h2>
            <p className="text-gray-400 text-sm mb-4">Once you delete your account, there is no going back.</p>
            <button className="bg-risk hover:bg-risk/80 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
