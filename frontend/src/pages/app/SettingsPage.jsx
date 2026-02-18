import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { User, CreditCard, Bell, Shield, Check, Loader2, Crown, FileText, Save, X, Clock, Edit2 } from 'lucide-react';
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
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  // Notifications state
  const [notifications, setNotifications] = useState({
    email: profile?.notifications_email ?? true,
    co_reminders: profile?.notifications_co ?? true,
    weekly_summary: profile?.notifications_weekly ?? false
  });

  useEffect(() => {
    if (profile?.default_payment_days) {
      setDefaultPaymentDays(profile.default_payment_days);
    }
  }, [profile]);

  // Check for payment success/cancel
  useEffect(() => {
    const success = searchParams.get('success');
    const cancelled = searchParams.get('cancelled');
    
    if (success === 'true') {
      setPaymentMessage({ type: 'success', text: 'Payment successful! Your plan has been upgraded.' });
      window.history.replaceState({}, '', '/app/settings');
    } else if (cancelled === 'true') {
      setPaymentMessage({ type: 'error', text: 'Payment was cancelled.' });
      window.history.replaceState({}, '', '/app/settings');
    }
  }, [searchParams]);

  // Fetch plans
  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoadingPlans(true);
      try {
        const response = await fetch(`${API_URL}/api/stripe/plans`);
        if (response.ok) {
          const data = await response.json();
          setPlans(data.plans);
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
    setIsSavingDefaults(true);
    try {
      await updateProfile({ default_payment_days: defaultPaymentDays });
      setDefaultsSaved(true);
      setTimeout(() => setDefaultsSaved(false), 3000);
    } catch (error) {
      console.error('Error saving defaults:', error);
    } finally {
      setIsSavingDefaults(false);
    }
  };

  const handleNotificationChange = async (key, value) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    try {
      await updateProfile({ [`notifications_${key}`]: value });
    } catch (error) {
      console.error('Error updating notification preference:', error);
    }
  };

  const handleUpgrade = async (planName) => {
    setIsUpgrading(true);
    setUpgradingPlan(planName);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${API_URL}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          price_id: plans?.[planName]?.price_id,
          plan_name: planName
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create checkout session');
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      setPaymentMessage({ type: 'error', text: error.message });
    } finally {
      setIsUpgrading(false);
      setUpgradingPlan(null);
    }
  };

  const getPlanStatus = () => {
    const tier = profile?.subscription_tier || 'trial';
    const status = profile?.subscription_status || 'active';
    const endDate = profile?.trial_ends_at || profile?.subscription_ends_at;
    
    if (tier === 'trial') {
      return {
        name: 'Trial',
        status: 'active',
        endDate: endDate ? new Date(endDate).toLocaleDateString() : null,
        color: 'text-blue-400'
      };
    }
    
    return {
      name: tier === 'elite' ? 'Elite' : tier === 'lifetime' ? 'Lifetime Elite' : 'Pro',
      status,
      endDate: endDate ? new Date(endDate).toLocaleDateString() : null,
      color: tier === 'lifetime' ? 'text-warning' : tier === 'elite' ? 'text-purple-400' : 'text-steel-400'
    };
  };

  const planStatus = getPlanStatus();

  return (
    <div className="space-y-6" data-testid="settings-page">
      {/* Payment Messages */}
      {paymentMessage && (
        <div className={`p-4 rounded-lg flex items-center justify-between ${
          paymentMessage.type === 'success' 
            ? 'bg-success/20 border border-success/50 text-success' 
            : 'bg-risk/20 border border-risk/50 text-risk'
        }`}>
          <span>{paymentMessage.text}</span>
          <button onClick={() => setPaymentMessage(null)}>
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Profile Section */}
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-steel-400" />
          Profile Information
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400 text-sm">Name</p>
            <p className="text-white font-medium">{profile?.full_name || 'Not set'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Email</p>
            <p className="text-white font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Company</p>
            <p className="text-white font-medium">{profile?.company_name || 'Not set'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Trade</p>
            <p className="text-white font-medium">{profile?.trade || 'Not set'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Region</p>
            <p className="text-white font-medium">{profile?.region || 'Not set'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Phone</p>
            <p className="text-white font-medium">{profile?.phone || 'Not set'}</p>
          </div>
        </div>
        
        <Link 
          to="/app/profile" 
          className="bg-charcoal-700 hover:bg-charcoal-600 text-white px-4 py-2 rounded-lg font-medium transition-colors mt-4 inline-flex items-center gap-2"
          data-testid="edit-profile-btn"
        >
          <Edit2 className="w-4 h-4" />
          Edit Profile
        </Link>
      </div>

      {/* Subscription & Billing */}
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-steel-400" />
          Subscription & Billing
        </h2>
        
        <div className="bg-charcoal-700/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Your current plan</p>
              <p className={`text-xl font-bold ${planStatus.color}`}>{planStatus.name}</p>
            </div>
            <div className="text-right">
              {planStatus.endDate && (
                <p className="text-gray-400 text-sm flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {planStatus.name === 'Trial' ? 'Trial ends' : 'Renews'}: {planStatus.endDate}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Plans */}
        {isLoadingPlans ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-steel-500" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {/* Pro Plan */}
            <div className={`rounded-lg border p-4 ${
              profile?.subscription_tier === 'pro' ? 'border-steel-500 bg-steel-500/10' : 'border-charcoal-600'
            }`}>
              <h3 className="text-lg font-bold text-white">Pro</h3>
              <p className="text-gray-400 text-sm mb-2">For growing trades getting organized.</p>
              <p className="text-2xl font-bold text-white mb-4">
                $49<span className="text-sm text-gray-400">/month</span>
              </p>
              <ul className="space-y-2 text-sm text-gray-300 mb-4">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success" /> Unlimited projects</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success" /> Estimates & invoicing</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success" /> Expense tracking</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success" /> Milestone management</li>
              </ul>
              {profile?.subscription_tier !== 'pro' && profile?.subscription_tier !== 'elite' && profile?.subscription_tier !== 'lifetime' && (
                <button
                  onClick={() => handleUpgrade('pro')}
                  disabled={isUpgrading}
                  className="w-full bg-steel-500 hover:bg-steel-600 disabled:opacity-50 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  {isUpgrading && upgradingPlan === 'pro' ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    'Upgrade to Pro'
                  )}
                </button>
              )}
              {profile?.subscription_tier === 'pro' && (
                <div className="text-center text-steel-400 font-medium py-2">Current Plan</div>
              )}
            </div>

            {/* Elite Plan */}
            <div className={`rounded-lg border p-4 ${
              profile?.subscription_tier === 'elite' ? 'border-purple-500 bg-purple-500/10' : 'border-charcoal-600'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-white">Elite</h3>
                <Crown className="w-4 h-4 text-warning" />
              </div>
              <p className="text-gray-400 text-sm mb-2">For contractors running serious operations.</p>
              <p className="text-2xl font-bold text-white mb-4">
                $99<span className="text-sm text-gray-400">/month</span>
              </p>
              <ul className="space-y-2 text-sm text-gray-300 mb-4">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success" /> Everything in Pro</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success" /> Financial health dashboard</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success" /> Advanced margin analytics</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success" /> Tax summary & projections</li>
              </ul>
              {profile?.subscription_tier !== 'elite' && profile?.subscription_tier !== 'lifetime' && (
                <button
                  onClick={() => handleUpgrade('elite')}
                  disabled={isUpgrading}
                  className="w-full bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  {isUpgrading && upgradingPlan === 'elite' ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    'Upgrade to Elite'
                  )}
                </button>
              )}
              {(profile?.subscription_tier === 'elite' || profile?.subscription_tier === 'lifetime') && (
                <div className="text-center text-purple-400 font-medium py-2">
                  {profile?.subscription_tier === 'lifetime' ? 'Lifetime Access' : 'Current Plan'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Invoice Defaults */}
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-steel-400" />
          Invoice Defaults
        </h2>
        
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Default Payment Terms (days)
          </label>
          <div className="flex items-center gap-3">
            <select
              value={defaultPaymentDays}
              onChange={(e) => setDefaultPaymentDays(parseInt(e.target.value))}
              className="flex-1 bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white"
            >
              <option value={15}>Net 15</option>
              <option value={30}>Net 30</option>
              <option value={45}>Net 45</option>
              <option value={60}>Net 60</option>
            </select>
            <button
              onClick={handleSaveDefaults}
              disabled={isSavingDefaults}
              className="bg-steel-500 hover:bg-steel-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {isSavingDefaults ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : defaultsSaved ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-steel-400" />
          Notifications
        </h2>
        
        <div className="space-y-4">
          {[
            { key: 'email', label: 'Email notifications', description: 'Receive email updates about your projects' },
            { key: 'co_reminders', label: 'Change order reminders', description: 'Get notified about pending change orders' },
            { key: 'weekly_summary', label: 'Weekly summary', description: 'Receive a weekly digest of your business' }
          ].map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{label}</p>
                <p className="text-gray-400 text-sm">{description}</p>
              </div>
              <button
                onClick={() => handleNotificationChange(key, !notifications[key])}
                className={`w-12 h-6 rounded-full transition-colors ${
                  notifications[key] ? 'bg-steel-500' : 'bg-charcoal-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  notifications[key] ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Security Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-steel-400" />
            Security
          </h2>
          <div className="space-y-3">
            <button className="w-full text-left text-gray-300 hover:text-white py-2 border-b border-charcoal-700">
              Change password
            </button>
            <button className="w-full text-left text-gray-300 hover:text-white py-2">
              Two-factor authentication
            </button>
          </div>
        </div>

        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Danger Zone</h2>
          <p className="text-gray-400 text-sm mb-4">Once you delete your account, there is no going back.</p>
          <button className="border border-risk/50 text-risk hover:bg-risk/10 px-4 py-2 rounded-lg font-medium transition-colors">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
