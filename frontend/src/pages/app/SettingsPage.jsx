import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Settings as SettingsIcon, User, CreditCard, Bell, Shield, Check, Loader2, Crown, FileText, Save, MapPin, Info, X, Sparkles } from 'lucide-react';
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
  
  // Lifetime Plan State
  const [lifetimeStatus, setLifetimeStatus] = useState({
    seats_remaining: 100,
    is_available: true,
    region_lock: 'CA',
    max_seats: 100
  });
  const [showLifetimeModal, setShowLifetimeModal] = useState(false);

  // Load defaults from profile
  useEffect(() => {
    if (profile?.default_payment_days) {
      setDefaultPaymentDays(profile.default_payment_days);
    }
  }, [profile]);

  // Fetch lifetime seats status
  useEffect(() => {
    const fetchLifetimeStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/api/subscription/lifetime/status`);
        if (response.ok) {
          const data = await response.json();
          setLifetimeStatus(data);
        }
      } catch (error) {
        console.error('Error fetching lifetime status:', error);
      }
    };
    
    fetchLifetimeStatus();
  }, []);

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

  // Check for payment completion
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const paymentStatus = searchParams.get('payment');
    const planType = searchParams.get('plan');

    if (paymentStatus === 'success' && sessionId) {
      setIsProcessingPayment(true);
      setPaymentMessage({ type: 'info', text: 'Verifying your payment...' });
      pollPaymentStatus(sessionId, 0, planType);
    } else if (paymentStatus === 'cancelled') {
      setPaymentMessage({ type: 'error', text: 'Payment was cancelled. Please try again.' });
    }
  }, [searchParams]);

  const pollPaymentStatus = async (sessionId, attempts, planType) => {
    const maxAttempts = 10;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setPaymentMessage({ type: 'error', text: 'Payment verification timed out. Please contact support.' });
      setIsProcessingPayment(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/subscription/status/${sessionId}`);
      const data = await response.json();

      if (data.payment_status === 'paid') {
        const planName = planType === 'lifetime_elite' ? 'Founding Lifetime (Elite)' : 
                        planType === 'elite' ? 'Elite' : 
                        planType === 'pro' ? 'Pro' : 'your plan';
        setPaymentMessage({ 
          type: 'success', 
          text: `🎉 Payment successful! Welcome to ${planName}!` 
        });
        setIsProcessingPayment(false);
        
        // Refresh user profile
        if (updateProfile) {
          await updateProfile({});
        }
        
        // Clear URL parameters
        window.history.replaceState({}, '', '/app/settings');
        return;
      }

      if (data.status === 'expired') {
        setPaymentMessage({ type: 'error', text: 'Payment session expired. Please try again.' });
        setIsProcessingPayment(false);
        return;
      }

      // Continue polling
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1, planType), pollInterval);
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
      // For lifetime plan, check country
      if (planType === 'lifetime_elite') {
        const userCountry = profile?.country || profile?.region?.includes('Canada') || profile?.region?.includes('British Columbia') || profile?.region?.includes('Ontario') || profile?.region?.includes('Alberta') || profile?.region?.includes('Quebec') ? 'CA' : 'OTHER';
        
        if (userCountry !== 'CA' && !lifetimeStatus.is_available) {
          setPaymentMessage({ type: 'error', text: 'Founding Lifetime is only available in Canada' });
          setIsUpgrading(false);
          return;
        }
      }

      const response = await fetch(`${API_URL}/api/subscription/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_type: planType,
          origin_url: window.location.origin,
          user_id: user?.id,
          email: user?.email,
          country: profile?.country || 'CA'
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

  const currentPlan = profile?.plan_type || profile?.subscription_tier || 'trial';
  const isLifetime = currentPlan === 'lifetime_elite';
  const isCanada = profile?.country === 'CA' || 
                   profile?.region?.includes('British Columbia') || 
                   profile?.region?.includes('Ontario') || 
                   profile?.region?.includes('Alberta') ||
                   profile?.region?.includes('Quebec') ||
                   profile?.region?.includes('Manitoba') ||
                   profile?.region?.includes('Saskatchewan');

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
                <span className={`text-xl font-bold ${
                  isLifetime ? 'text-warning' :
                  currentPlan === 'elite' ? 'text-steel-400' : 
                  currentPlan === 'pro' ? 'text-success' : 'text-warning'
                }`}>
                  {isLifetime ? 'Founding Lifetime (Elite)' : currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                </span>
                {(currentPlan === 'elite' || isLifetime) && <Crown className="w-5 h-5 text-warning" />}
                {isLifetime && <Sparkles className="w-5 h-5 text-warning" />}
              </div>
              {isLifetime && (
                <p className="text-sm text-gray-400 mt-2">
                  No subscription. Lifetime access active since {profile?.lifetime_purchased_at ? new Date(profile.lifetime_purchased_at).toLocaleDateString() : 'purchase date'}.
                </p>
              )}
            </div>

            {/* Plan Cards */}
            {!isLifetime && (
              <div className="grid md:grid-cols-3 gap-4">
                {/* Pro Plan */}
                <div className={`rounded-xl p-5 border ${
                  currentPlan === 'pro' ? 'bg-success/10 border-success/50' : 'bg-charcoal-700 border-charcoal-600'
                }`}>
                  <h3 className="text-lg font-bold text-white mb-1">Pro</h3>
                  <p className="text-2xl font-bold text-white mb-3">$39<span className="text-sm text-gray-400">/mo</span></p>
                  <ul className="space-y-1.5 mb-4 text-sm">
                    {['Unlimited Projects', 'Quote Builder', 'Change Orders', 'Labor Engine'].map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-300">
                        <Check className="w-3 h-3 text-success flex-shrink-0" />
                        <span className="text-xs">{f}</span>
                      </li>
                    ))}
                  </ul>
                  {currentPlan === 'pro' ? (
                    <span className="block w-full text-center py-2 rounded-lg bg-success/20 text-success font-medium text-sm">
                      Current Plan
                    </span>
                  ) : currentPlan === 'elite' ? (
                    <span className="block w-full text-center py-2 rounded-lg bg-charcoal-600 text-gray-400 font-medium text-sm">
                      Downgrade N/A
                    </span>
                  ) : (
                    <button
                      onClick={() => handleUpgrade('pro')}
                      disabled={isUpgrading}
                      className="w-full bg-steel-500 hover:bg-steel-600 disabled:opacity-50 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                      data-testid="upgrade-pro-btn"
                    >
                      {isUpgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upgrade'}
                    </button>
                  )}
                </div>

                {/* Elite Plan */}
                <div className={`rounded-xl p-5 border ${
                  currentPlan === 'elite' ? 'bg-steel-500/10 border-steel-500' : 'bg-charcoal-700 border-steel-500/50'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white">Elite</h3>
                    <Crown className="w-4 h-4 text-warning" />
                  </div>
                  <p className="text-2xl font-bold text-white mb-3">$59<span className="text-sm text-gray-400">/mo</span></p>
                  <ul className="space-y-1.5 mb-4 text-sm">
                    {['Everything in Pro', 'Advanced Reports', 'KPIs & Analytics', 'Priority Support'].map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-300">
                        <Check className="w-3 h-3 text-steel-400 flex-shrink-0" />
                        <span className="text-xs">{f}</span>
                      </li>
                    ))}
                  </ul>
                  {currentPlan === 'elite' ? (
                    <span className="block w-full text-center py-2 rounded-lg bg-steel-500/20 text-steel-400 font-medium text-sm">
                      Current Plan
                    </span>
                  ) : (
                    <button
                      onClick={() => handleUpgrade('elite')}
                      disabled={isUpgrading}
                      className="w-full bg-steel-500 hover:bg-steel-600 disabled:opacity-50 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                      data-testid="upgrade-elite-btn"
                    >
                      {isUpgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upgrade'}
                    </button>
                  )}
                </div>

                {/* Founding Lifetime Plan */}
                <div className={`rounded-xl p-5 border-2 relative overflow-hidden ${
                  lifetimeStatus.is_available && isCanada
                    ? 'bg-gradient-to-br from-warning/10 to-charcoal-700 border-warning/50'
                    : 'bg-charcoal-700 border-charcoal-600 opacity-75'
                }`}>
                  {/* Limited Badge */}
                  <div className="absolute top-0 right-0 bg-warning text-charcoal-900 text-xs font-bold px-2 py-1 rounded-bl">
                    LIMITED
                  </div>
                  
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white">Lifetime</h3>
                    <Sparkles className="w-4 h-4 text-warning" />
                  </div>
                  <p className="text-2xl font-bold text-white mb-1">$599<span className="text-sm text-gray-400"> CAD</span></p>
                  <p className="text-xs text-warning mb-3">One-time payment</p>
                  
                  <ul className="space-y-1.5 mb-4 text-sm">
                    {['Elite forever', 'No monthly fees', 'Founding badge'].map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-300">
                        <Check className="w-3 h-3 text-warning flex-shrink-0" />
                        <span className="text-xs">{f}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {/* Seats Remaining */}
                  <div className="mb-3 bg-charcoal-800/50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-400">Founding Memberships</p>
                    <p className="text-lg font-bold text-warning">
                      {lifetimeStatus.seats_remaining} <span className="text-sm font-normal text-gray-400">/ {lifetimeStatus.max_seats}</span>
                    </p>
                  </div>
                  
                  {!isCanada ? (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-400 text-xs mb-2">
                        <MapPin className="w-3 h-3" />
                        <span>Canada only</span>
                      </div>
                      <span className="block w-full text-center py-2 rounded-lg bg-charcoal-600 text-gray-500 font-medium text-sm cursor-not-allowed">
                        Not Available
                      </span>
                    </div>
                  ) : !lifetimeStatus.is_available ? (
                    <span className="block w-full text-center py-2 rounded-lg bg-charcoal-600 text-gray-400 font-medium text-sm">
                      Sold Out
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowLifetimeModal(true)}
                        disabled={isUpgrading}
                        className="w-full bg-warning hover:bg-warning/90 disabled:opacity-50 text-charcoal-900 py-2 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 text-sm"
                        data-testid="upgrade-lifetime-btn"
                      >
                        {isUpgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Get Lifetime'}
                      </button>
                      <button
                        onClick={() => setShowLifetimeModal(true)}
                        className="w-full text-center text-xs text-gray-400 hover:text-white mt-2 flex items-center justify-center gap-1"
                      >
                        <Info className="w-3 h-3" />
                        Learn more
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Lifetime user info */}
            {isLifetime && (
              <div className="bg-gradient-to-r from-warning/10 to-transparent rounded-xl p-4 border border-warning/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Founding Member</p>
                    <p className="text-sm text-gray-400">You have lifetime Elite access. No subscription needed.</p>
                  </div>
                </div>
              </div>
            )}
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

          <div className="bg-charcoal-800 rounded-xl border border-risk/30 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Danger Zone</h2>
            <p className="text-gray-400 text-sm mb-4">Once you delete your account, there is no going back.</p>
            <button className="w-full bg-risk/20 hover:bg-risk/30 text-risk py-2 rounded-lg font-medium transition-colors text-sm">
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Lifetime Info Modal */}
      {showLifetimeModal && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowLifetimeModal(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto bg-charcoal-800 rounded-2xl border border-charcoal-700 p-6 z-50" data-testid="lifetime-modal">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Founding Lifetime</h2>
                  <p className="text-sm text-gray-400">One-time purchase, forever access</p>
                </div>
              </div>
              <button onClick={() => setShowLifetimeModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-charcoal-700/50 rounded-xl p-4">
                <h3 className="font-semibold text-white mb-2">What you get:</h3>
                <ul className="space-y-2">
                  {[
                    'All Elite features forever',
                    'No monthly subscription fees',
                    'Exclusive Founding Member badge',
                    'Priority support for life',
                    'Early access to new features',
                    'Lock in before price increases'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                      <Check className="w-4 h-4 text-warning flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-warning/10 border border-warning/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-warning" />
                  <span className="font-semibold text-warning">Canada Only</span>
                </div>
                <p className="text-sm text-gray-400">
                  Founding Lifetime memberships are currently limited to 100 Canadian users. 
                  Your billing address must be in Canada.
                </p>
              </div>

              <div className="text-center py-4">
                <p className="text-3xl font-bold text-white">$599 <span className="text-lg text-gray-400">CAD</span></p>
                <p className="text-sm text-gray-400">One-time payment • No recurring charges</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowLifetimeModal(false)}
                className="flex-1 bg-charcoal-700 hover:bg-charcoal-600 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLifetimeModal(false);
                  handleUpgrade('lifetime_elite');
                }}
                disabled={isUpgrading || !lifetimeStatus.is_available}
                className="flex-1 bg-warning hover:bg-warning/90 disabled:opacity-50 text-charcoal-900 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
              >
                {isUpgrading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Purchase Lifetime
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SettingsPage;
