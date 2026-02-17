import React, { useState } from 'react';
import { User, Settings as SettingsIcon, CreditCard, Shield } from 'lucide-react';
import ContractorProfile from '../../components/profile/ContractorProfile';
import { useAuthStore } from '../../store/authStore';

const ProfilePage = () => {
  const { profile, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="space-y-6" data-testid="profile-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">My Profile</h1>
        <p className="text-gray-400">Manage your contractor profile and showcase your work</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-charcoal-800 p-1 rounded-xl border border-charcoal-700 w-fit">
        <button
          onClick={() => setActiveTab('profile')}
          className={`py-2 px-4 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
            activeTab === 'profile' 
              ? 'bg-steel-500 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-charcoal-700'
          }`}
          data-testid="tab-profile"
        >
          <User className="w-4 h-4" />
          Profile
        </button>
        <button
          onClick={() => setActiveTab('account')}
          className={`py-2 px-4 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
            activeTab === 'account' 
              ? 'bg-steel-500 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-charcoal-700'
          }`}
          data-testid="tab-account"
        >
          <Shield className="w-4 h-4" />
          Account
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && <ContractorProfile />}

      {activeTab === 'account' && (
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Account Settings</h2>
          
          <div className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
              <p className="text-white">{user?.email || 'Not set'}</p>
              <p className="text-xs text-gray-500 mt-1">Contact support to change your email</p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
              <button className="bg-charcoal-700 hover:bg-charcoal-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Change Password
              </button>
            </div>

            {/* Account Type */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Account Type</label>
              <span className="inline-flex items-center px-3 py-1 bg-steel-500/20 text-steel-400 rounded-full text-sm">
                {profile?.user_role === 'contractor' ? 'Contractor' : 'Customer'}
              </span>
            </div>

            {/* Danger Zone */}
            <div className="pt-6 border-t border-charcoal-700">
              <h3 className="text-risk font-medium mb-4">Danger Zone</h3>
              <button className="bg-risk/20 hover:bg-risk/30 text-risk px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-risk/50">
                Delete Account
              </button>
              <p className="text-xs text-gray-500 mt-2">This action cannot be undone. All your data will be permanently deleted.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
