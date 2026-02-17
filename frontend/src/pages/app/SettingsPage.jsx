import React from 'react';
import { Settings as SettingsIcon, User, CreditCard, Bell, Shield, Building2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const SettingsPage = () => {
  const { profile, user } = useAuthStore();

  return (
    <div className="space-y-6" data-testid="settings-page">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400">Manage your account and preferences</p>
      </div>

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

          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
              <CreditCard className="w-5 h-5 text-steel-400" />
              Subscription & Billing
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-charcoal-700 rounded-lg">
                <div>
                  <p className="text-white font-medium capitalize">{profile?.subscription_tier || 'Pro'} Plan</p>
                  <p className="text-gray-400 text-sm">
                    {profile?.subscription_tier === 'elite' ? '$59/month' : '$39/month'}
                  </p>
                </div>
                <button className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
                  {profile?.subscription_tier === 'elite' ? 'Manage' : 'Upgrade'}
                </button>
              </div>
              <button className="text-gray-400 hover:text-white text-sm transition-colors">
                View billing history
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
