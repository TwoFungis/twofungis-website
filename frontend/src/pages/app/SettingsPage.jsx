import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, CreditCard, Bell, Shield, Check, Loader2, Crown, FileText, Save, MapPin, X, Sparkles, ExternalLink, Clock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SettingsPage = () => {
  const { profile, user, updateProfile } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradingPlan, setUpgradingPlan] = useState(null);
  
  const [defaultPaymentDays, setDefaultPaymentDays] = useState(profile?.default_payment_days || 30);
  const [isSavingDefaults, setIsSavingDefaults] = useState(false);
  const [defaultsSaved, setDefaultsSaved] = useState(false);
  
  const [plans, setPlans] = useState(null);
  const [lifetimeStatus, setLifetimeStatus] = useState({
    remaining: 100,
    is_active: true,
    region_lock: 'CA',
    max_seats: 100,
    seats_sold: 0
  });
  const [showLifetimeModal, setShowLifetimeModal] = useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  useEffect(() => {
    if (profile?.default_payment_days) {
      setDefaultPaymentDays(profile.default_payment_days);
    }
  }, [profile]);

  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoadingPlans(true);
      try {
        const response = await fetch(`${API_URL}/api/stripe/plans`);
        if (response.ok) {
          const data = await response.json();
          setPlans(data.plans);
          setLifetimeStatus(data.lifetime_status);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setIsLoadingPlans(false);
      }
    };
    
    fetchPlans();
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
      
      if (updateProfile) {
        await updateProfile({ default_payment_days: defaultPaymentDays });
      }
    } catch (err) {
      console.error('Error saving defaults:', err);
    } finally {
      setIsSavingDefaults(false);
    }
  };

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const paymentStatus = searchParams.get('payment');
    const planType = searchParams.get('plan');

    if (paymentStatus === 'success' && sessionId) {
      setIsProcessingPayment(true);
      setPaymentMessage({ type: 'info', text: 'Verifying your payment...' });
      verifyPayment(sessionId, planType);
    } else if (paymentStatus === 'cancelled') {
      setPaymentMessage({ type: 'error', text: 'Payment was cancelled. Please try again.' });
      window.history.replaceState({}, '', '/app/settings');
    }
  }, [searchParams]);

  const verifyPayment = async (sessionId, planType) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      if (updateProfile) {
        await updateProfile({});
      }
      
      const planName = planType === 'LIFETIME_ELITE' ? 'Founding Lifetime' : 
                      planType === 'ELITE' ? 'Elite' : 
                      planType === 'PRO' ? 'Pro' : 'your plan';
      
      setPaymentMessage({ 
        type: 'success', 
        text: `Welcome to ${planName}! Your account has been upgraded.` 
      });
      setIsProcessingPayment(false);
      
      if (planType === 'LIFETIME_ELITE') {
        const response = await fetch(`${API_URL}/api/stripe/lifetime-seats`);
        if (response.ok) {
          const data = await response.json();
          setLifetimeStatus(data);
        }
      }
      
      window.history.replaceState({}, '', '/app/settings');
      
    } catch (error) {
      console.error('Error verifying payment:', error);
      setPaymentMessage({ type: 'error', text: 'Error verifying payment. Please contact support.' });
      setIsProcessingPayment(false);
    }
  };

  const handleUpgrade = async (planType) => {
    setIsUpgrading(true);
    setUpgradingPlan(planType);
    setPaymentMessage(null);

    try {
      const userCountry = getUserCountry();
      
      if (planType === 'LIFETIME_ELITE' && userCountry !== 'CA') {
        setPaymentMessage({ type: 'error', text: 'Founding Lifetime is currently available to Canadian contractors only.' });
        setIsUpgrading(false);
        setUpgradingPlan(null);
        return;
      }

      const response = await fetch(`${API_URL}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planType,
          user_id: user?.id,
          email: user?.email,
          country: userCountry
        })
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create checkout session';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      setPaymentMessage({ type: 'error', text: error.message });
      setIsUpgrading(false);
      setUpgradingPlan(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stripe/create-portal-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id })
      });

      const data = await response.json();
      
      if (data.portal_url) {
        window.location.href = data.portal_url;
      } else if (data.message) {
        setPaymentMessage({ type: 'info', text: data.message });
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      setPaymentMessage({ type: 'error', text: 'Failed to open billing portal' });
    }
  };

  const getUserCountry = () => {
    if (profile?.country) return profile.country.toUpperCase();
    
    const region = profile?.region || '';
    const canadianProvinces = [
      'British Columbia', 'Alberta', 'Saskatchewan', 'Manitoba',
      'Ontario', 'Quebec', 'New Brunswick', 'Nova Scotia',
      'Prince Edward Island', 'Newfoundland', 'Yukon', 'Northwest Territories', 'Nunavut'
    ];
    
    if (canadianProvinces.some(p => region.includes(p))) {
      return 'CA';
    }
    
    return 'OTHER';
  };

  const currentPlan = profile?.plan_type || profile?.subscription_tier?.toUpperCase() || 'TRIAL';
  const planStatus = profile?.plan_status || 'inactive';
  const isLifetime = currentPlan === 'LIFETIME_ELITE';
  const isCanada = getUserCountry() === 'CA';
  const lifetimePurchaseDate = profile?.lifetime_purchased_at ? new Date(profile.lifetime_purchased_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }) : null;

  const getPlanDisplayName = (plan) => {
    if (plan === 'LIFETIME_ELITE') return 'Founding Lifetime';
    if (plan === 'TRIAL') return 'Trial';
    return plan.charAt(0) + plan.slice(1).toLowerCase();
  };

  return (
    <div className="space-y-6" data-testid="settings-page">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400">Manage your account and subscription</p>
      </div>

      {paymentMessage && (
        <div className={`p-4 rounded-lg flex items-center justify-between ${
          paymentMessage.type === 'success' ? 'bg-success/20 border border-success/50 text-success' :
          paymentMessage.type === 'error' ? 'bg-risk/20 border border-risk/50 text-risk' :
          'bg-warning/20 border border-warning/50 text-warning'
        }`}>
          <span>{paymentMessage.text}</span>
          <button onClick={() => setPaymentMessage(null)} className="ml-4 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isProcessingPayment && (
        <div className="flex items-center gap-3 p-4 bg-steel-500/20 border border-steel-500/50 rounded-lg text-steel-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Verifying your payment...</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Section */}
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
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-steel-400" />
              Subscription & Billing
            </h2>
            
            {/* Current Plan Display */}
            <div className="mb-6 p-4 bg-charcoal-700/50 rounded-xl">
              <p className="text-gray-400 text-sm mb-1">Your current plan</p>
              <div className="flex items-center gap-3">
                <span className={`text-xl font-bold ${
                  isLifetime ? 'text-warning' :
                  currentPlan === 'ELITE' ? 'text-steel-400' : 
                  currentPlan === 'PRO' ? 'text-success' : 'text-gray-400'
                }`}>
                  {getPlanDisplayName(currentPlan)}
                </span>
                {(currentPlan === 'ELITE' || isLifetime) && <Crown className="w-5 h-5 text-warning" />}
                {isLifetime && <Sparkles className="w-5 h-5 text-warning" />}
                {planStatus === 'active' && !isLifetime && currentPlan !== 'TRIAL' && (
                  <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded">Active</span>
                )}
                {planStatus === 'past_due' && (
                  <span className="text-xs bg-risk/20 text-risk px-2 py-0.5 rounded">Past Due</span>
                )}
              </div>
              
              {isLifetime && lifetimePurchaseDate && (
                <p className="text-sm text-warning/80 mt-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Lifetime Elite — Active since {lifetimePurchaseDate}
                </p>
              )}
              
              {currentPlan === 'TRIAL' && profile?.trial_ends_at && (
                <p className="text-sm text-gray-400 mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Trial ends {new Date(profile.trial_ends_at).toLocaleDateString()}
                </p>
              )}
              
              {!isLifetime && currentPlan !== 'TRIAL' && profile?.stripe_subscription_id && (
                <button
                  onClick={handleManageBilling}
                  className="mt-3 text-sm text-steel-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Manage Subscription
                </button>
              )}
            </div>

            {isLoadingPlans && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-steel-400" />
              </div>
            )}

            {/* Plan Cards */}
            {!isLoadingPlans && !isLifetime && (
              <div className="grid md:grid-cols-3 gap-4">
                {/* Pro Plan */}
                <div className={`rounded-xl p-5 border transition-all ${
                  currentPlan === 'PRO' ? 'bg-success/10 border-success/50' : 'bg-charcoal-700 border-charcoal-600 hover:border-charcoal-500'
                }`} data-testid="pro-plan-card">
                  <h3 className="text-lg font-bold text-white mb-1">Pro</h3>
                  <p className="text-xs text-gray-400 mb-2">{plans?.PRO?.tagline || 'For growing trades getting organized.'}</p>
                  <p className="text-2xl font-bold text-white mb-3">
                    ${plans?.PRO?.price || 39}<span className="text-sm text-gray-400">/mo</span>
                  </p>
                  <ul className="space-y-1.5 mb-4 text-sm">
                    {(plans?.PRO?.features || ['Unlimited Projects', 'Quote Builder', 'Change Orders', 'Labor Engine']).map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-300">
                        <Check className="w-3 h-3 text-success flex-shrink-0" />
                        <span className="text-xs">{f}</span>
                      </li>
                    ))}
                  </ul>
                  {currentPlan === 'PRO' ? (
                    <span className="block w-full text-center py-2 rounded-lg bg-success/20 text-success font-medium text-sm">
                      Current Plan
                    </span>
                  ) : currentPlan === 'ELITE' ? (
                    <span className="block w-full text-center py-2 rounded-lg bg-charcoal-600 text-gray-400 font-medium text-sm">
                      Included in Elite
                    </span>
                  ) : (
                    <button
                      onClick={() => handleUpgrade('PRO')}
                      disabled={isUpgrading}
                      className="w-full bg-steel-500 hover:bg-steel-600 disabled:opacity-50 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                      data-testid="upgrade-pro-btn"
                    >
                      {isUpgrading && upgradingPlan === 'PRO' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upgrade to Pro'}
                    </button>
                  )}
                </div>

                {/* Elite Plan */}
                <div className={`rounded-xl p-5 border transition-all ${
                  currentPlan === 'ELITE' ? 'bg-steel-500/10 border-steel-500' : 'bg-charcoal-700 border-steel-500/50 hover:border-steel-500'
                }`} data-testid="elite-plan-card">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white">Elite</h3>
                    <Crown className="w-4 h-4 text-warning" />
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{plans?.ELITE?.tagline || 'Built for contractors running serious operations.'}</p>
                  <p className="text-2xl font-bold text-white mb-3">
                    ${plans?.ELITE?.price || 59}<span className="text-sm text-gray-400">/mo</span>
                  </p>
                  <ul className="space-y-1.5 mb-4 text-sm">
                    {(plans?.ELITE?.features || ['Everything in Pro', 'Advanced Reports', 'KPIs & Analytics', 'Priority Support']).map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-300">
                        <Check className="w-3 h-3 text-steel-400 flex-shrink-0" />
                        <span className="text-xs">{f}</span>
                      </li>
                    ))}
                  </ul>
                  {currentPlan === 'ELITE' ? (
                    <span className="block w-full text-center py-2 rounded-lg bg-steel-500/20 text-steel-400 font-medium text-sm">
                      Current Plan
                    </span>
                  ) : (
                    <button
                      onClick={() => handleUpgrade('ELITE')}
                      disabled={isUpgrading}
                      className="w-full bg-steel-500 hover:bg-steel-600 disabled:opacity-50 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                      data-testid="upgrade-elite-btn"
                    >
                      {isUpgrading && upgradingPlan === 'ELITE' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upgrade to Elite'}
                    </button>
                  )}
                </div>

                {/* Founding Lifetime Plan */}
                <div className={`rounded-xl p-5 border-2 relative overflow-hidden transition-all ${
                  lifetimeStatus.is_active && lifetimeStatus.remaining > 0 && isCanada
                    ? 'bg-gradient-to-br from-warning/10 via-charcoal-700 to-charcoal-800 border-warning/60 shadow-lg shadow-warning/10'
                    : 'bg-charcoal-700 border-charcoal-600 opacity-75'
                }`} data-testid="lifetime-plan-card">
                  {/* Badge */}
                  <div className="absolute top-0 right-0 bg-warning text-charcoal-900 text-[10px] font-bold px-2 py-1 rounded-bl tracking-wide">
                    FOUNDING MEMBER
                  </div>
                  
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white">Lifetime</h3>
                    <Sparkles className="w-4 h-4 text-warning" />
                  </div>
                  <p className="text-xs text-gray-400 mb-2">Permanent Elite access.</p>
                  <p className="text-2xl font-bold text-white mb-0.5">
                    ${plans?.LIFETIME_ELITE?.price || 599}<span className="text-sm text-gray-400"> CAD</span>
                  </p>
                  <p className="text-[10px] text-warning/80 mb-3">One-time • No renewals • Elite for life</p>
                  
                  <ul className="space-y-1.5 mb-4 text-sm">
                    {['Elite forever', 'No monthly fees', 'Founding badge'].map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-300">
                        <Check className="w-3 h-3 text-warning flex-shrink-0" />
                        <span className="text-xs">{f}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {/* Seats Counter */}
                  <div className={`mb-3 bg-charcoal-800/70 rounded-lg p-2 text-center ${lifetimeStatus.remaining <= 25 && lifetimeStatus.remaining > 0 ? 'animate-pulse' : ''}`} data-testid="seats-counter">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Seats Remaining</p>
                    <p className={`text-lg font-bold ${lifetimeStatus.remaining <= 10 ? 'text-risk' : lifetimeStatus.remaining <= 25 ? 'text-warning' : 'text-warning'}`}>
                      {lifetimeStatus.remaining} <span className="text-sm font-normal text-gray-500">of {lifetimeStatus.max_seats}</span>
                    </p>
                  </div>
                  
                  {!isCanada ? (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-400 text-xs mb-2">
                        <MapPin className="w-3 h-3" />
                        <span>Canada only (for now)</span>
                      </div>
                      <span className="block w-full text-center py-2 rounded-lg bg-charcoal-600 text-gray-500 font-medium text-sm cursor-not-allowed">
                        Not Available
                      </span>
                    </div>
                  ) : !lifetimeStatus.is_active || lifetimeStatus.remaining <= 0 ? (
                    <button className="w-full text-center py-2 rounded-lg bg-charcoal-600 text-gray-300 font-medium text-sm hover:bg-charcoal-500 transition-colors">
                      Sold Out — Join Waitlist
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowLifetimeModal(true)}
                      disabled={isUpgrading}
                      className="w-full bg-warning hover:bg-warning/90 disabled:opacity-50 text-charcoal-900 py-2.5 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 text-sm"
                      data-testid="upgrade-lifetime-btn"
                    >
                      {isUpgrading && upgradingPlan === 'LIFETIME_ELITE' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Become a Founder'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Lifetime Member Display */}
            {!isLoadingPlans && isLifetime && (
              <div className="bg-gradient-to-r from-warning/10 to-transparent rounded-xl p-5 border border-warning/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">Founding Lifetime Member</p>
                    <p className="text-sm text-gray-400">You have permanent Elite access. No subscription to manage.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Business Defaults */}
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

      {/* Lifetime Modal */}
      {showLifetimeModal && (
        <>
          <div className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm" onClick={() => setShowLifetimeModal(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto bg-charcoal-800 rounded-2xl border border-warning/30 p-6 z-50 shadow-2xl" data-testid="lifetime-modal">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Founding Lifetime</h2>
                  <p className="text-sm text-gray-400">Elite Access</p>
                </div>
              </div>
              <button onClick={() => setShowLifetimeModal(false)} className="text-gray-400 hover:text-white p-1">
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-300 mb-5">
              Secure permanent Elite access to TradeOS™ as an original founding contractor.
            </p>

            <div className="space-y-4 mb-6">
              <div className="bg-charcoal-700/50 rounded-xl p-4">
                <h3 className="font-semibold text-white mb-3">What You Get</h3>
                <ul className="space-y-2">
                  {[
                    'Elite features forever',
                    'No monthly subscription',
                    'Founding Member badge (profile + public)',
                    'Priority feature voting',
                    'Early access to new tools',
                    'Locked pricing protection'
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
                <p className="text-sm text-gray-300">
                  Founding Lifetime is available to Canadian contractors only. Billing address must be in Canada. Limited to {lifetimeStatus.max_seats} total members.
                </p>
              </div>

              <div className="bg-charcoal-700/50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Seats Remaining</p>
                <p className={`text-2xl font-bold ${lifetimeStatus.remaining <= 10 ? 'text-risk' : 'text-warning'}`}>
                  {lifetimeStatus.remaining} <span className="text-sm text-gray-400">/ {lifetimeStatus.max_seats}</span>
                </p>
              </div>

              <div className="text-center py-3">
                <p className="text-3xl font-bold text-white">${plans?.LIFETIME_ELITE?.price || 599} <span className="text-lg text-gray-400">CAD</span></p>
                <p className="text-sm text-gray-400">One-time payment • No recurring charges</p>
              </div>
              
              <p className="text-xs text-center text-gray-500 italic">
                This offer will never be repeated in Canada at this price.
              </p>
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
                  handleUpgrade('LIFETIME_ELITE');
                }}
                disabled={isUpgrading || !lifetimeStatus.is_active || lifetimeStatus.remaining <= 0}
                className="flex-1 bg-warning hover:bg-warning/90 disabled:opacity-50 text-charcoal-900 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                data-testid="confirm-lifetime-btn"
              >
                {isUpgrading && upgradingPlan === 'LIFETIME_ELITE' ? (
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
