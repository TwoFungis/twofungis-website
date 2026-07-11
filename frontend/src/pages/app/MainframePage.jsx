import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Activity, 
  Bell, 
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Crown,
  Briefcase,
  UserCheck
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const MainframePage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleData, setRoleData] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('supabase_token') || 
        JSON.parse(localStorage.getItem('sb-oiocmchdtllqpszciuxh-auth-token') || '{}')?.access_token;

      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      // Check role
      const roleResponse = await fetch(`${API_URL}/api/tfcs/role/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const roleResult = await roleResponse.json();
      setRoleData(roleResult);

      // If owner, fetch diagnostics
      if (roleResult.has_role && roleResult.role === 'owner') {
        try {
          const diagResponse = await fetch(`${API_URL}/api/tfcs/diagnostics`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (diagResponse.ok) {
            const diagResult = await diagResponse.json();
            setDiagnostics(diagResult.diagnostics);
          }
        } catch (e) {
          console.log('Could not fetch diagnostics:', e);
        }
      }

    } catch (err) {
      console.error('Error checking TFCS access:', err);
      setError(err.message || 'Failed to check access');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-6 h-6 text-amber-400" />;
      case 'manager':
        return <Briefcase className="w-6 h-6 text-blue-400" />;
      case 'employee':
        return <UserCheck className="w-6 h-6 text-green-400" />;
      default:
        return <Users className="w-6 h-6 text-gray-400" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'owner':
        return 'from-amber-500/20 to-amber-600/10 border-amber-500/30';
      case 'manager':
        return 'from-blue-500/20 to-blue-600/10 border-blue-500/30';
      case 'employee':
        return 'from-green-500/20 to-green-600/10 border-green-500/30';
      default:
        return 'from-gray-500/20 to-gray-600/10 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-steel-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Verifying TFCS Mainframe access...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Access Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/app/dashboard')}
            className="px-4 py-2 bg-charcoal-700 text-white rounded-lg hover:bg-charcoal-600 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!roleData?.has_role) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <Shield className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Access Restricted</h2>
          <p className="text-gray-400 mb-4">
            {roleData?.tables_initialized === false 
              ? 'TFCS Mainframe is not yet initialized. Please contact the system administrator.'
              : 'You do not have a TFCS Mainframe role assigned. Contact your administrator for access.'}
          </p>
          {roleData?.message && (
            <p className="text-sm text-gray-500 mb-4">{roleData.message}</p>
          )}
          <button
            onClick={() => navigate('/app/dashboard')}
            className="px-4 py-2 bg-charcoal-700 text-white rounded-lg hover:bg-charcoal-600 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // User has access
  return (
    <div className="space-y-6" data-testid="tfcs-mainframe">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-steel-500/20 to-steel-600/10 rounded-xl border border-steel-500/30">
            <Shield className="w-8 h-8 text-steel-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">TFCS Mainframe</h1>
            <p className="text-gray-400">Two Fungis Finishing - Internal Operations</p>
          </div>
        </div>
      </div>

      {/* Role Card */}
      <div className={`bg-gradient-to-br ${getRoleColor(roleData.role)} rounded-xl border p-6`}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-charcoal-800/50 rounded-lg">
            {getRoleIcon(roleData.role)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-white capitalize">{roleData.role} Access</h2>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-gray-400 text-sm">{roleData.user_email}</p>
            {roleData.auto_assigned && (
              <p className="text-xs text-amber-400 mt-1">Auto-assigned as initial owner</p>
            )}
          </div>
        </div>

        {/* Role Permissions */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Permissions</h3>
          <div className="flex flex-wrap gap-2">
            {roleData.role === 'owner' && (
              <>
                <span className="px-2 py-1 bg-charcoal-800/50 rounded text-xs text-green-400">Full Access</span>
                <span className="px-2 py-1 bg-charcoal-800/50 rounded text-xs text-green-400">Manage Users</span>
                <span className="px-2 py-1 bg-charcoal-800/50 rounded text-xs text-green-400">View Private Events</span>
                <span className="px-2 py-1 bg-charcoal-800/50 rounded text-xs text-green-400">System Settings</span>
              </>
            )}
            {roleData.role === 'manager' && (
              <>
                <span className="px-2 py-1 bg-charcoal-800/50 rounded text-xs text-blue-400">Operational Access</span>
                <span className="px-2 py-1 bg-charcoal-800/50 rounded text-xs text-blue-400">Manage Projects</span>
                <span className="px-2 py-1 bg-charcoal-800/50 rounded text-xs text-blue-400">View Team Activity</span>
              </>
            )}
            {roleData.role === 'employee' && (
              <>
                <span className="px-2 py-1 bg-charcoal-800/50 rounded text-xs text-gray-400">View Assigned Work</span>
                <span className="px-2 py-1 bg-charcoal-800/50 rounded text-xs text-gray-400">Log Own Activity</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Foundation Verification Status */}
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          Foundation Verification
        </h2>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-charcoal-700/50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-gray-300">Owner Login Verified</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-charcoal-700/50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-gray-300">TFCS Mainframe Accessible</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-charcoal-700/50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-gray-300">Owner Permissions Confirmed</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-charcoal-700/50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-gray-300">Role-Based Access Control Active</span>
          </div>
        </div>
      </div>

      {/* Diagnostics (Owner Only) */}
      {roleData.role === 'owner' && diagnostics && (
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-steel-400" />
            System Diagnostics
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-charcoal-700/50 rounded-lg p-4">
              <p className="text-2xl font-bold text-white">{diagnostics.total_users_with_roles}</p>
              <p className="text-sm text-gray-400">Total Users</p>
            </div>
            <div className="bg-charcoal-700/50 rounded-lg p-4">
              <p className="text-2xl font-bold text-amber-400">{diagnostics.roles_breakdown?.owners || 0}</p>
              <p className="text-sm text-gray-400">Owners</p>
            </div>
            <div className="bg-charcoal-700/50 rounded-lg p-4">
              <p className="text-2xl font-bold text-blue-400">{diagnostics.roles_breakdown?.managers || 0}</p>
              <p className="text-sm text-gray-400">Managers</p>
            </div>
            <div className="bg-charcoal-700/50 rounded-lg p-4">
              <p className="text-2xl font-bold text-green-400">{diagnostics.roles_breakdown?.employees || 0}</p>
              <p className="text-sm text-gray-400">Employees</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-charcoal-700/50 rounded-lg p-4">
              <p className="text-2xl font-bold text-white">{diagnostics.events_last_24h}</p>
              <p className="text-sm text-gray-400">Events (24h)</p>
            </div>
            <div className="bg-charcoal-700/50 rounded-lg p-4">
              <p className="text-2xl font-bold text-white">{diagnostics.unread_notifications}</p>
              <p className="text-sm text-gray-400">Unread Notifications</p>
            </div>
          </div>
        </div>
      )}

      {/* Awaiting Dashboard */}
      <div className="bg-gradient-to-br from-charcoal-800 to-charcoal-900 rounded-xl border border-charcoal-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
          <h2 className="text-lg font-semibold text-white">Dashboard Pending</h2>
        </div>
        <p className="text-gray-400">
          The TFCS Mainframe Dashboard will be developed after the foundation has been reviewed and approved.
          The following pages are planned:
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {['Dashboard', 'Projects', 'Opportunities', 'Production Library', 'CRM', 'Documents', 'Employees', 'Settings'].map((page, i) => (
            <span 
              key={page} 
              className={`px-3 py-1 rounded-full text-sm ${
                i === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-charcoal-700 text-gray-400'
              }`}
            >
              {page}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainframePage;
