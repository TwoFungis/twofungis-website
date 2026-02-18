import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  User, CreditCard, Bell, Shield, Check, Loader2, Crown, FileText, Save, X, 
  Clock, Edit2, Eye, EyeOff, AlertTriangle, Trash2, DollarSign
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SettingsPage = () => {
  const { profile, user, updateProfile, signOut } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradingPlan, setUpgradingPlan] = useState(null);
  
  // Profile editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    company_name: '',
    trade: '',
    region: '',
    phone: ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // Password change
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  
  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [defaultPaymentDays, setDefaultPaymentDays] = useState(profile?.default_payment_days || 30);
  const [laborRate, setLaborRate] = useState(profile?.labor_rate || '');
  const [isSavingDefaults, setIsSavingDefaults] = useState(false);
  const [defaultsSaved, setDefaultsSaved] = useState(false);
  const [laborRateSaved, setLaborRateSaved] = useState(false);
  
  const [plans, setPlans] = useState(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  const [notifications, setNotifications] = useState({
    email: profile?.notifications_email ?? true,
    co_reminders: profile?.notifications_co ?? true,
    weekly_summary: profile?.notifications_weekly ?? false
  });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        company_name: profile.company_name || '',
        trade: profile.trade || '',
        region: profile.region || '',
        phone: profile.phone || ''
      });
      setDefaultPaymentDays(profile.default_payment_days || 30);
      setLaborRate(profile.labor_rate || '');
    }
  }, [profile]);

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

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await updateProfile(profileForm);
      setIsEditingProfile(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      setIsChangingPassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    try {
      // First, delete user data from our database
      const { data: { session } } = await supabase.auth.getSession();
      
      // Delete profile and related data
      await supabase.from('users_profile').delete().eq('id', user.id);
      await supabase.from('projects').delete().eq('user_id', user.id);
      await supabase.from('change_orders').delete().eq('user_id', user.id);
      await supabase.from('expenses').delete().eq('user_id', user.id);
      
      // Sign out and inform user
      toast.success('Account deleted successfully');
      await signOut();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account. Please contact support.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleSaveDefaults = async () => {
    setIsSavingDefaults(true);
    try {
      await updateProfile({ default_payment_days: defaultPaymentDays });
      setDefaultsSaved(true);
      toast.success('Payment terms saved');
      setTimeout(() => setDefaultsSaved(false), 3000);
    } catch (error) {
      console.error('Error saving defaults:', error);
      toast.error('Failed to save defaults');
    } finally {
      setIsSavingDefaults(false);
    }
  };

  const handleSaveLaborRate = async () => {
    const rate = parseFloat(laborRate);
    if (isNaN(rate) || rate <= 0) {
      toast.error('Please enter a valid labor rate');
      return;
    }
    
    try {
      await updateProfile({ labor_rate: rate });
      setLaborRateSaved(true);
      toast.success('Labor rate saved');
      setTimeout(() => setLaborRateSaved(false), 3000);
    } catch (error) {
      console.error('Error saving labor rate:', error);
      toast.error('Failed to save labor rate');
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
      {/* Header with Shield */}
      <div className="flex items-center gap-4 mb-2">
        <img src="/shield-icon.png" alt="" className="w-10 h-10 opacity-30 hidden lg:block" />
        <div>
          <h1 className="text-2xl font-bold text-charcoal-800">Settings</h1>
          <p className="text-charcoal-600 text-sm">Manage your account, subscription, and preferences</p>
        </div>
      </div>

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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-steel-400" />
            Profile Information
          </h2>
          {!isEditingProfile && (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="text-steel-400 hover:text-steel-300 text-sm font-medium flex items-center gap-1"
              data-testid="edit-profile-btn"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
        
        {isEditingProfile ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white focus:border-steel-500 focus:outline-none"
                  data-testid="input-full-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Company Name</label>
                <input
                  type="text"
                  value={profileForm.company_name}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, company_name: e.target.value }))}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white focus:border-steel-500 focus:outline-none"
                  data-testid="input-company-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Trade</label>
                <select
                  value={profileForm.trade}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, trade: e.target.value }))}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white focus:border-steel-500 focus:outline-none"
                >
                  <option value="">Select trade...</option>
                  <option value="General Contractor">General Contractor</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="HVAC">HVAC</option>
                  <option value="Framing">Framing</option>
                  <option value="Drywall">Drywall</option>
                  <option value="Roofing">Roofing</option>
                  <option value="Concrete">Concrete</option>
                  <option value="Landscaping">Landscaping</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Region</label>
                <input
                  type="text"
                  value={profileForm.region}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, region: e.target.value }))}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white focus:border-steel-500 focus:outline-none"
                  placeholder="e.g., Ontario, Canada"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white focus:border-steel-500 focus:outline-none"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg px-4 py-2 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-charcoal-700">
              <button
                onClick={() => {
                  setIsEditingProfile(false);
                  setProfileForm({
                    full_name: profile?.full_name || '',
                    company_name: profile?.company_name || '',
                    trade: profile?.trade || '',
                    region: profile?.region || '',
                    phone: profile?.phone || ''
                  });
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="bg-steel-500 hover:bg-steel-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                data-testid="save-profile-btn"
              >
                {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
        )}
      </div>

      {/* Subscription & Billing */}
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6 relative overflow-hidden">
        {/* Shield watermark - more visible */}
        <div 
          className="absolute -right-4 -bottom-4 w-48 h-48 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: 'url(/shield-icon.png)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat'
          }}
        />
        
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <img src="/shield-icon.png" alt="" className="w-6 h-6" />
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
                $29<span className="text-sm text-gray-400">/month</span>
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
                $59<span className="text-sm text-gray-400">/month</span>
              </p>
              <ul className="space-y-2 text-sm text-gray-300 mb-4">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success" /> Everything in Pro</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success" /> Advanced reports & PDF export</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success" /> Financial health dashboard</li>
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

        {/* Lifetime Founder Plan */}
        {profile?.subscription_tier !== 'lifetime' && (
          <div className="mt-6 bg-gradient-to-r from-warning/10 to-warning/5 rounded-xl border border-warning/30 p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-warning/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <img src="/shield-icon.png" alt="" className="w-10 h-10" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-white">Lifetime Founder</h3>
                  <span className="bg-warning/20 text-warning text-xs px-2 py-0.5 rounded-full font-medium">LIMITED</span>
                  <span className="bg-risk/20 text-risk text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">97/100 REMAINING</span>
                </div>
                <p className="text-gray-300 text-sm mb-3">
                  Join our first 100 founders and lock in lifetime access to TradeOS Elite features. 
                  One payment, forever access. Help shape the future of the platform.
                </p>
                <div className="flex items-center gap-4 mb-4">
                  <p className="text-3xl font-bold text-warning">
                    $599<span className="text-sm text-gray-400 font-normal"> one-time</span>
                  </p>
                  <span className="text-gray-500 line-through">$1,416/yr value</span>
                </div>
                <ul className="grid grid-cols-2 gap-2 text-sm text-gray-300 mb-4">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-warning" /> All Elite features forever</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-warning" /> Founder badge on profile</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-warning" /> Priority feature requests</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-warning" /> Direct founder support line</li>
                </ul>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleUpgrade('lifetime')}
                    disabled={isUpgrading}
                    className="bg-warning hover:bg-warning/90 disabled:opacity-50 text-charcoal-900 px-6 py-2.5 rounded-lg font-bold transition-colors flex items-center gap-2"
                  >
                    {isUpgrading && upgradingPlan === 'lifetime' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <img src="/shield-icon.png" alt="" className="w-5 h-5" />
                        Become a Founder
                      </>
                    )}
                  </button>
                  <span className="text-gray-500 text-sm">Only 100 spots available</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lifetime Founder Badge - shown if user is a founder */}
        {profile?.subscription_tier === 'lifetime' && (
          <div className="mt-6 bg-gradient-to-r from-warning/20 to-warning/10 rounded-xl border border-warning/50 p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-warning/30 rounded-xl flex items-center justify-center">
                <img src="/shield-icon.png" alt="" className="w-10 h-10" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-warning">Lifetime Founder</h3>
                  <Crown className="w-5 h-5 text-warning" />
                </div>
                <p className="text-gray-300 text-sm">Thank you for being one of our founding members!</p>
                <p className="text-warning text-sm font-medium mt-1">All Elite features • Forever access • Founder #XX</p>
              </div>
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
              <option value={7}>Net 7</option>
              <option value={14}>Net 14</option>
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

      {/* Labor Rate */}
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6" id="labor-rate">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-steel-400" />
          Labor Rate
        </h2>
        
        <p className="text-gray-400 text-sm mb-4">
          Set your hourly labor rate for accurate estimate calculations. Include your overhead and desired profit margin.
        </p>
        
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Hourly Rate ($/hr)
          </label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={laborRate}
                onChange={(e) => setLaborRate(e.target.value)}
                placeholder="75.00"
                min="0"
                step="0.01"
                className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg pl-8 pr-4 py-2 text-white focus:border-steel-500 focus:outline-none"
                data-testid="input-labor-rate"
              />
            </div>
            <button
              onClick={handleSaveLaborRate}
              disabled={!laborRate}
              className="bg-steel-500 hover:bg-steel-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              data-testid="save-labor-rate-btn"
            >
              {laborRateSaved ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Tip: Your fully loaded labor cost should include wages, benefits, insurance, and overhead.
          </p>
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
                  notifications[key] ? 'bg-steel-500' : 'bg-charcoal-700/50'
                }`}
              >
                <div className={`w-5 h-5 bg-charcoal-800 rounded-full transition-transform ${
                  notifications[key] ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-steel-400" />
          Security
        </h2>
        
        {isChangingPassword ? (
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 pr-10 text-white focus:border-steel-500 focus:outline-none"
                  placeholder="Enter new password"
                  data-testid="input-new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 pr-10 text-white focus:border-steel-500 focus:outline-none"
                  placeholder="Confirm new password"
                  data-testid="input-confirm-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsChangingPassword(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={isSavingPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                className="bg-steel-500 hover:bg-steel-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                data-testid="save-password-btn"
              >
                {isSavingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Update Password
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsChangingPassword(true)}
            className="text-gray-300 hover:text-white py-2 border-b border-charcoal-700 w-full text-left"
            data-testid="change-password-btn"
          >
            Change password
          </button>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-charcoal-800 rounded-xl border border-risk/30 p-6">
        <h2 className="text-lg font-semibold text-risk flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h2>
        <p className="text-gray-400 text-sm mb-4">
          Once you delete your account, there is no going back. All your data including projects, invoices, and expenses will be permanently deleted.
        </p>
        <button 
          onClick={() => setShowDeleteModal(true)}
          className="border border-risk/50 text-risk hover:bg-risk/10 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          data-testid="delete-account-btn"
        >
          <Trash2 className="w-4 h-4" />
          Delete Account
        </button>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-risk/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-risk" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete Account</h3>
                <p className="text-gray-400 text-sm">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-300 mb-4">
              This will permanently delete your account and all associated data including:
            </p>
            <ul className="text-gray-400 text-sm mb-6 space-y-1">
              <li>• All projects and milestones</li>
              <li>• All invoices and expenses</li>
              <li>• All change orders</li>
              <li>• Your profile and settings</li>
            </ul>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Type <span className="text-risk font-bold">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white focus:border-risk focus:outline-none"
                placeholder="DELETE"
                data-testid="delete-confirm-input"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 px-4 py-2 text-gray-400 hover:text-white transition-colors border border-charcoal-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmText !== 'DELETE'}
                className="flex-1 bg-risk hover:bg-risk/80 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                data-testid="confirm-delete-btn"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
