import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserPlus, Crown, Briefcase, Mail, MoreVertical, 
  Trash2, Shield, ChevronLeft, Loader2, Check, X, AlertTriangle
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useOrganization } from '../../hooks/useOrganization';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Role badge component
const RoleBadge = ({ role }) => {
  const roleConfig = {
    owner: { label: 'Owner', icon: Crown, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    employee: { label: 'Employee', icon: Briefcase, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  };
  
  const config = roleConfig[role] || roleConfig.employee;
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
};

// Status badge component
const StatusBadge = ({ isActive }) => {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
      isActive 
        ? 'text-emerald-400 bg-emerald-500/10' 
        : 'text-zinc-400 bg-zinc-500/10'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-zinc-400'}`} />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
};

// Invite Modal Component
const InviteModal = ({ isOpen, onClose, onInvite, isInviting }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('employee');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    onInvite(email.trim(), role);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            Invite Team Member
          </h3>
          <button 
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              data-testid="invite-email-input"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('owner')}
                className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                  role === 'owner'
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                }`}
                data-testid="role-owner-btn"
              >
                <Crown className={`w-5 h-5 ${role === 'owner' ? 'text-amber-400' : 'text-zinc-400'}`} />
                <div className="text-left">
                  <div className={`font-medium ${role === 'owner' ? 'text-amber-400' : 'text-white'}`}>Owner</div>
                  <div className="text-xs text-zinc-500">Full access</div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setRole('employee')}
                className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                  role === 'employee'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                }`}
                data-testid="role-employee-btn"
              >
                <Briefcase className={`w-5 h-5 ${role === 'employee' ? 'text-blue-400' : 'text-zinc-400'}`} />
                <div className="text-left">
                  <div className={`font-medium ${role === 'employee' ? 'text-blue-400' : 'text-white'}`}>Employee</div>
                  <div className="text-xs text-zinc-500">Limited access</div>
                </div>
              </button>
            </div>
          </div>
          
          <div className="pt-2">
            <button
              type="submit"
              disabled={!email.trim() || isInviting}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:text-zinc-400 text-black font-semibold py-3 rounded-lg transition-colors"
              data-testid="send-invite-btn"
            >
              {isInviting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending Invite...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Send Invitation
                </>
              )}
            </button>
          </div>
          
          <p className="text-xs text-zinc-500 text-center">
            {role === 'owner' 
              ? 'Owners have full access to all company data and settings.'
              : 'Employees can access company data but cannot manage billing or invite users.'}
          </p>
        </form>
      </div>
    </div>
  );
};

// Member Actions Menu
const MemberActions = ({ member, currentUserId, onChangeRole, onRemove, isOwner }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isCurrentUser = member.user_id === currentUserId;
  
  if (!isOwner) return null;
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
        data-testid={`member-actions-${member.user_id}`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 py-1">
            {member.role !== 'owner' && (
              <button
                onClick={() => { onChangeRole(member, 'owner'); setIsOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white"
              >
                <Crown className="w-4 h-4 text-amber-400" />
                Make Owner
              </button>
            )}
            {member.role === 'owner' && !isCurrentUser && (
              <button
                onClick={() => { onChangeRole(member, 'employee'); setIsOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white"
              >
                <Briefcase className="w-4 h-4 text-blue-400" />
                Make Employee
              </button>
            )}
            {!isCurrentUser && (
              <button
                onClick={() => { onRemove(member); setIsOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
                Remove from Team
              </button>
            )}
            {isCurrentUser && (
              <div className="px-4 py-2 text-xs text-zinc-500">
                This is you
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const TeamPage = () => {
  const navigate = useNavigate();
  const { user, session } = useAuthStore();
  const { currentOrg: organization } = useOrganization();
  
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  
  const fetchMembers = useCallback(async () => {
    if (!organization?.id || !session?.access_token) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_URL}/api/organizations/${organization.id}/members`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
        
        // Find current user's role
        const currentMember = data.members?.find(m => m.user_id === user?.id);
        setCurrentUserRole(currentMember?.role || null);
      } else {
        toast.error('Failed to load team members');
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to load team members');
    } finally {
      setIsLoading(false);
    }
  }, [organization?.id, session?.access_token, user?.id]);
  
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);
  
  const handleInvite = async (email, role) => {
    if (!organization?.id || !session?.access_token) return;
    
    try {
      setIsInviting(true);
      const response = await fetch(
        `${API_URL}/api/organizations/${organization.id}/invite`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, role })
        }
      );
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success(data.message || `Invitation sent to ${email}`);
        setIsInviteModalOpen(false);
        fetchMembers(); // Refresh the list
      } else {
        toast.error(data.detail || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error inviting member:', error);
      toast.error('Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };
  
  const handleChangeRole = async (member, newRole) => {
    if (!organization?.id || !session?.access_token) return;
    
    try {
      const response = await fetch(
        `${API_URL}/api/organizations/${organization.id}/members/${member.user_id}/role`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role: newRole })
        }
      );
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success(`${member.name || member.email} is now ${newRole === 'owner' ? 'an Owner' : 'an Employee'}`);
        fetchMembers();
      } else {
        toast.error(data.detail || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };
  
  const handleRemoveMember = async (member) => {
    if (!organization?.id || !session?.access_token) return;
    
    if (!window.confirm(`Remove ${member.name || member.email} from the team?`)) return;
    
    try {
      const response = await fetch(
        `${API_URL}/api/organizations/${organization.id}/members/${member.user_id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success(`${member.name || member.email} has been removed`);
        fetchMembers();
      } else {
        toast.error(data.detail || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };
  
  const isOwner = currentUserRole === 'owner';
  
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/app/settings')}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            data-testid="back-to-settings"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Team</h1>
            <p className="text-zinc-400 text-sm">
              Manage your organization members
            </p>
          </div>
        </div>
        
        {/* Organization Info */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white">{organization?.name || 'Organization'}</h2>
                <p className="text-sm text-zinc-400">{members.length} team member{members.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            {isOwner && (
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-medium px-4 py-2.5 rounded-lg transition-colors"
                data-testid="invite-member-btn"
              >
                <UserPlus className="w-4 h-4" />
                Invite Member
              </button>
            )}
          </div>
        </div>
        
        {/* Role Permissions Info */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-6">
          <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-zinc-400" />
            Role Permissions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="font-medium text-amber-400">Owner</span>
              </div>
              <ul className="text-xs text-zinc-400 space-y-1">
                <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-400" /> Full access to all company data</li>
                <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-400" /> Invite and manage team members</li>
                <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-400" /> Manage billing and settings</li>
                <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-400" /> Delete organization</li>
              </ul>
            </div>
            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-blue-400" />
                <span className="font-medium text-blue-400">Employee</span>
              </div>
              <ul className="text-xs text-zinc-400 space-y-1">
                <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-400" /> Access company data for daily work</li>
                <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-400" /> Create and edit records</li>
                <li className="flex items-center gap-2"><X className="w-3 h-3 text-red-400" /> Cannot invite users</li>
                <li className="flex items-center gap-2"><X className="w-3 h-3 text-red-400" /> Cannot manage billing or settings</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Members List */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h3 className="font-semibold text-white">Team Members</h3>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-12 h-12 text-zinc-600 mb-4" />
              <p className="text-zinc-400">No team members yet</p>
              {isOwner && (
                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="mt-4 text-emerald-400 hover:text-emerald-300 text-sm font-medium"
                >
                  Invite your first team member
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {members.map((member) => (
                <div 
                  key={member.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-zinc-800/30 transition-colors"
                  data-testid={`team-member-${member.user_id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-zinc-300">
                        {(member.name || member.email || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">
                          {member.name || member.email?.split('@')[0] || 'Unknown'}
                        </span>
                        {member.user_id === user?.id && (
                          <span className="text-xs text-zinc-500">(you)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Mail className="w-3.5 h-3.5" />
                        {member.email || 'No email'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <RoleBadge role={member.role} />
                    <StatusBadge isActive={member.is_active} />
                    <MemberActions
                      member={member}
                      currentUserId={user?.id}
                      onChangeRole={handleChangeRole}
                      onRemove={handleRemoveMember}
                      isOwner={isOwner}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Shared Data Notice */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-400">Shared Organization Data</h4>
              <p className="text-sm text-blue-300/80 mt-1">
                All team members share the same Production Library, Opportunities, Estimates, Projects, and Company Brain. 
                Changes made by any team member are visible to everyone.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Invite Modal */}
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInvite}
        isInviting={isInviting}
      />
    </div>
  );
};

export default TeamPage;
