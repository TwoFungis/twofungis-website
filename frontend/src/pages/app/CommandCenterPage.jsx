import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Sparkles, 
  Crown, 
  Plus,
  ChevronRight,
  CheckCircle2,
  X,
  Loader2,
  User,
  FolderKanban,
  Target,
  DollarSign,
  Users,
  Calendar,
  Building2,
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ============================================
// HEADER COMPONENTS
// ============================================

const NotificationsPanel = ({ isOpen, onClose, notifications, onMarkRead }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 lg:relative lg:inset-auto">
      <div className="fixed inset-0 bg-black/50 lg:hidden" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-zinc-900 border-l border-zinc-800 lg:absolute lg:top-full lg:right-0 lg:h-auto lg:max-h-[70vh] lg:mt-2 lg:rounded-lg lg:border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="font-semibold text-white">Notifications</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white" data-testid="close-notifications">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(100vh-80px)] lg:max-h-[50vh]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No new notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {notifications.map((notif, i) => (
                <div 
                  key={i} 
                  className="p-4 hover:bg-zinc-800/50 cursor-pointer transition-colors"
                  onClick={() => onMarkRead(notif.id)}
                >
                  <p className="text-white text-sm">{notif.title}</p>
                  <p className="text-zinc-500 text-xs mt-1 font-mono">{notif.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CompanyBrainPanel = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 lg:relative lg:inset-auto">
      <div className="fixed inset-0 bg-black/50 lg:hidden" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-black border-l border-zinc-800 lg:absolute lg:top-full lg:right-0 lg:h-auto lg:mt-2 lg:rounded-lg lg:border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-white">Company Brain</h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white" data-testid="close-brain">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 font-mono text-sm text-zinc-400 bg-black">
          <div className="flex flex-col items-center justify-center text-center py-8">
            <Sparkles className="w-8 h-8 text-emerald-400/50 mb-4" />
            <p className="text-zinc-500 leading-relaxed">
              Company Brain will provide operational insights and recommendations here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const OwnerAccessPanel = ({ isOpen, onClose, workspaceContext, owners, loadingOwners }) => {
  if (!isOpen) return null;
  
  const permissions = [
    { label: 'Full Access', enabled: true },
    { label: 'Financial', enabled: true },
    { label: 'User Management', enabled: true },
    { label: 'Company Brain', enabled: true },
    { label: 'System Settings', enabled: true },
  ];
  
  const formatLastLogin = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 172800) return 'Yesterday';
    return date.toLocaleDateString();
  };
  
  return (
    <div className="fixed inset-0 z-50 lg:relative lg:inset-auto">
      <div className="fixed inset-0 bg-black/50 lg:hidden" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-zinc-900 border-l border-emerald-500/30 lg:absolute lg:top-full lg:right-0 lg:h-auto lg:max-h-[80vh] lg:mt-2 lg:rounded-lg lg:border overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-emerald-500/30 bg-emerald-500/10">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-emerald-400">Owner Access</h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white" data-testid="close-owner">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {/* Owner Management Section */}
          <div className="p-4 border-b border-zinc-800">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-mono mb-3">Company Owners</p>
            {loadingOwners ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {owners.map((owner, i) => (
                  <div key={owner.user_id || i} className="bg-black/30 rounded-lg p-3" data-testid={`owner-${i}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{owner.name || owner.email?.split('@')[0]}</p>
                        <p className="text-xs text-zinc-500">{owner.email}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Crown className="w-3 h-3 text-emerald-400" />
                        <span className="text-xs text-emerald-400 font-medium">Owner</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-zinc-500">
                      <span className={owner.status === 'active' ? 'text-emerald-400' : 'text-zinc-500'}>
                        {owner.status === 'active' ? '● Active' : '○ Inactive'}
                      </span>
                      <span>Last login: {formatLastLogin(owner.last_login)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Current User Info */}
          <div className="p-4 border-b border-zinc-800">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-mono mb-2">Your Account</p>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-zinc-600">Name</p>
                <p className="text-white">{workspaceContext?.user_name || 'Owner'}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-600">Email</p>
                <p className="text-white">{workspaceContext?.user_email}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-600">Role</p>
                <p className="text-emerald-400 capitalize">{workspaceContext?.organization_role || 'Owner'}</p>
              </div>
            </div>
          </div>
          
          {/* Permissions */}
          <div className="p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-mono mb-2">Permissions</p>
            <div className="space-y-1">
              {permissions.map((perm, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-white">{perm.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickAddPanel = ({ isOpen, onClose, onNavigate }) => {
  if (!isOpen) return null;
  
  const items = [
    { label: 'Project', icon: FolderKanban, href: '/app/projects/new' },
    { label: 'Opportunity', icon: Target, href: '/app/opportunities/new' },
    { label: 'Estimate', icon: DollarSign, href: '/app/estimates/new' },
    { label: 'Client', icon: User, href: '/app/crm/new' },
    { label: 'Employee', icon: Users, href: '/app/team/new' },
  ];
  
  return (
    <div className="fixed inset-0 z-50 lg:relative lg:inset-auto">
      <div className="fixed inset-0 bg-black/50 lg:hidden" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-xs bg-zinc-900 border-l border-zinc-800 lg:absolute lg:top-full lg:right-0 lg:h-auto lg:mt-2 lg:rounded-lg lg:border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="font-semibold text-white">Quick Add</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white" data-testid="close-quickadd">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-2">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => { onNavigate(item.href); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-zinc-800 rounded-lg transition-colors"
              data-testid={`quickadd-${item.label.toLowerCase()}`}
            >
              <item.icon className="w-5 h-5 text-zinc-400" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENTS
// ============================================

const TodaysFocus = ({ items }) => {
  const getStatusColor = (priority) => {
    switch (priority) {
      case 'urgent': return { bg: 'bg-red-500/10', border: 'border-red-500/50', dot: 'bg-red-500' };
      case 'success': return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/50', dot: 'bg-emerald-500' };
      case 'info': return { bg: 'bg-amber-500/10', border: 'border-amber-500/50', dot: 'bg-amber-500' };
      default: return { bg: 'bg-zinc-800', border: 'border-zinc-700', dot: 'bg-zinc-500' };
    }
  };
  
  // Empty state when no priority items exist
  if (!items || items.length === 0) {
    return (
      <div className="bg-zinc-900 border-l-4 border-l-emerald-500 border border-zinc-800 p-6 rounded-lg" data-testid="todays-focus">
        <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-4">Today&apos;s Focus</h2>
        <div className="flex items-center justify-center py-4">
          <p className="text-zinc-500 text-sm">No priority items require attention today.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-zinc-900 border-l-4 border-l-emerald-500 border border-zinc-800 p-4 rounded-lg" data-testid="todays-focus">
      <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-4">Today&apos;s Focus</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.slice(0, 3).map((item, i) => {
          const colors = getStatusColor(item.priority);
          return (
            <div 
              key={i} 
              className={`${colors.bg} border ${colors.border} rounded-lg p-4 cursor-pointer hover:opacity-90 transition-opacity`}
              data-testid={`focus-item-${i}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full ${colors.dot} mt-2 flex-shrink-0`} />
                <div>
                  <p className="text-white font-medium">{item.title}</p>
                  <p className="text-zinc-400 text-sm mt-1">{item.subtitle}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ProjectsCard = ({ data, onRowClick }) => {
  const rows = [
    { label: 'Starting Soon', key: 'starting_soon', count: data?.starting_soon || 0 },
    { label: 'In Progress', key: 'in_progress', count: data?.in_progress || 0 },
    { label: 'Deficiencies', key: 'deficiencies', count: data?.deficiencies || 0 },
    { label: 'Completed', key: 'completed', count: data?.completed || 0 },
  ];
  
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg" data-testid="projects-card">
      <div className="px-4 py-3 border-b border-zinc-800">
        <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500">Projects</h2>
      </div>
      <div className="divide-y divide-zinc-800">
        {rows.map((row) => (
          <button
            key={row.key}
            onClick={() => onRowClick('projects', row.key)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50 transition-colors text-left"
            data-testid={`project-row-${row.key}`}
          >
            <span className="text-white">{row.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-mono text-white">{row.count}</span>
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const OpportunitiesCard = ({ data, onRowClick }) => {
  const rows = [
    { label: 'Invited', key: 'invited', count: data?.invited || 0 },
    { label: 'Estimating', key: 'estimating', count: data?.estimating || 0 },
    { label: 'Submitted', key: 'submitted', count: data?.submitted || 0 },
    { label: 'Negotiating', key: 'negotiating', count: data?.negotiating || 0 },
    { label: 'Awarded', key: 'awarded', count: data?.awarded || 0 },
    { label: 'Lost', key: 'lost', count: data?.lost || 0 },
  ];
  
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg" data-testid="opportunities-card">
      <div className="px-4 py-3 border-b border-zinc-800">
        <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500">Opportunities</h2>
      </div>
      <div className="divide-y divide-zinc-800">
        {rows.map((row) => (
          <button
            key={row.key}
            onClick={() => onRowClick('opportunities', row.key)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50 transition-colors text-left"
            data-testid={`opportunity-row-${row.key}`}
          >
            <span className="text-white">{row.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-mono text-white">{row.count}</span>
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const CompanyBrainCard = () => {
  return (
    <div className="bg-black border border-zinc-800 rounded-lg" data-testid="company-brain-card">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-emerald-400" />
        <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500">Company Brain</h2>
      </div>
      <div className="p-6 font-mono text-sm text-zinc-500 min-h-[100px] flex items-center justify-center">
        <p className="text-center leading-relaxed">
          Company Brain will provide operational insights here.
        </p>
      </div>
    </div>
  );
};

const RecentActivity = ({ activities }) => {
  const getActivityColor = (type) => {
    switch (type) {
      case 'create': return 'bg-emerald-500';
      case 'update': return 'bg-amber-500';
      case 'urgent': return 'bg-red-500';
      default: return 'bg-zinc-500';
    }
  };
  
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg" data-testid="recent-activity">
      <div className="px-4 py-3 border-b border-zinc-800">
        <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500">Recent Activity</h2>
      </div>
      <div className="p-4">
        {activities.length === 0 ? (
          <p className="text-zinc-500 text-center py-4">No recent activity</p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[5px] top-2 bottom-2 w-px bg-zinc-800" />
            
            <div className="space-y-4">
              {activities.map((activity, i) => (
                <div key={i} className="flex gap-4 relative">
                  <div className={`w-3 h-3 rounded-full ${getActivityColor(activity.type)} flex-shrink-0 mt-1 z-10`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white">
                      <span className="font-medium">{activity.user}</span>
                      <span className="text-zinc-400"> {activity.action}</span>
                    </p>
                    <p className="text-xs font-mono text-zinc-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// MAIN PAGE COMPONENT
// ============================================

const CommandCenterPage = () => {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  
  // Panel states
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [brainOpen, setBrainOpen] = useState(false);
  const [ownerAccessOpen, setOwnerAccessOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  
  // Data states
  const [loading, setLoading] = useState(true);
  const [workspaceContext, setWorkspaceContext] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [todaysFocus, setTodaysFocus] = useState([]);
  const [projectsData, setProjectsData] = useState({});
  const [opportunitiesData, setOpportunitiesData] = useState({});
  const [activities, setActivities] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [owners, setOwners] = useState([]);
  const [loadingOwners, setLoadingOwners] = useState(false);

  // Helper function for relative time formatting
  const formatTimeAgo = useCallback((dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 172800) return 'Yesterday';
    return date.toLocaleDateString();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // Fetch workspace context (new API)
      const contextRes = await fetch(`${API_URL}/api/workspace/context`, { headers });
      if (contextRes.ok) {
        const data = await contextRes.json();
        setWorkspaceContext(data);
      }
      
      // Fetch notifications (try new endpoint, fallback to tfcs)
      try {
        const notifRes = await fetch(`${API_URL}/api/tfcs/notifications?limit=10`, { headers });
        if (notifRes.ok) {
          const data = await notifRes.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unread_count || 0);
        }
      } catch (e) {
        console.log('Notifications fetch skipped');
      }
      
      // Fetch activity events
      try {
        const activityRes = await fetch(`${API_URL}/api/tfcs/activity?limit=10`, { headers });
        if (activityRes.ok) {
          const data = await activityRes.json();
          const formattedActivities = (data.events || []).map(event => ({
            user: event.user_name || event.user_email?.split('@')[0] || 'User',
            action: event.action,
            time: formatTimeAgo(event.created_at),
            type: event.action_type
          }));
          setActivities(formattedActivities);
        }
      } catch (e) {
        console.log('Activity fetch skipped');
      }
      
      // Fetch projects summary
      try {
        const projectsRes = await fetch(`${API_URL}/api/projects`, { headers });
        if (projectsRes.ok) {
          const data = await projectsRes.json();
          const projects = data.projects || [];
          setProjectsData({
            starting_soon: projects.filter(p => p.status === 'starting_soon' || p.status === 'pending' || p.status === 'planned').length,
            in_progress: projects.filter(p => p.status === 'in_progress' || p.status === 'active').length,
            deficiencies: projects.filter(p => p.status === 'deficiency' || p.status === 'on_hold').length,
            completed: projects.filter(p => p.status === 'completed' || p.status === 'done').length,
          });
        }
      } catch (e) {
        console.log('Projects fetch error:', e);
      }
      
      // Opportunities data (will show zeros until the endpoint has data)
      setOpportunitiesData({
        invited: 0,
        estimating: 0,
        submitted: 0,
        negotiating: 0,
        awarded: 0,
        lost: 0,
      });
      
      // Today's Focus placeholder
      setTodaysFocus([]);
      
      // Fetch owners for panel
      setLoadingOwners(true);
      try {
        const ownersRes = await fetch(`${API_URL}/api/tfcs/owners`, { headers });
        if (ownersRes.ok) {
          const data = await ownersRes.json();
          setOwners(data.owners || []);
        }
      } catch (e) {
        console.log('Owners fetch skipped');
      } finally {
        setLoadingOwners(false);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [navigate, formatTimeAgo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRowClick = (section, filter) => {
    navigate(`/app/${section}?status=${filter}`);
  };

  const handleMarkRead = async (notifId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      
      await fetch(`${API_URL}/api/tfcs/notifications/${notifId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setNotifications(prev => prev.filter(n => n.id !== notifId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Error marking notification read:', e);
    }
  };

  const closeAllPanels = () => {
    setNotificationsOpen(false);
    setBrainOpen(false);
    setOwnerAccessOpen(false);
    setQuickAddOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  const organizationName = workspaceContext?.organization_name || profile?.company_name || 'Your Company';
  const isOwner = workspaceContext?.is_owner || workspaceContext?.organization_role === 'owner';

  return (
    <div className="min-h-screen bg-black font-sans" data-testid="tradeos-command-center">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black border-b border-zinc-800">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Title */}
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">Command Center</h1>
              <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">{organizationName}</p>
            </div>
            
            {/* Right: Actions */}
            <div className="flex items-center gap-2 lg:gap-4">
              {/* Notifications */}
              <button
                onClick={() => { closeAllPanels(); setNotificationsOpen(true); }}
                className="relative p-2 text-zinc-400 hover:text-white transition-colors"
                data-testid="notifications-bell"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              
              {/* Company Brain */}
              <button
                onClick={() => { closeAllPanels(); setBrainOpen(true); }}
                className="p-2 text-zinc-400 hover:text-emerald-400 transition-colors"
                data-testid="brain-btn"
              >
                <Sparkles className="w-5 h-5" />
              </button>
              
              {/* Owner Access - only show for owners */}
              {isOwner && (
                <button
                  onClick={() => { closeAllPanels(); setOwnerAccessOpen(true); }}
                  className="p-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                  data-testid="owner-access-btn"
                >
                  <Crown className="w-5 h-5" />
                </button>
              )}
              
              {/* Quick Add */}
              <button
                onClick={() => { closeAllPanels(); setQuickAddOpen(true); }}
                className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white hover:bg-zinc-800 transition-colors"
                data-testid="quickadd-btn"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Panels */}
      <NotificationsPanel 
        isOpen={notificationsOpen} 
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications.map(n => ({ ...n, time: formatTimeAgo(n.created_at) }))}
        onMarkRead={handleMarkRead}
      />
      <CompanyBrainPanel 
        isOpen={brainOpen} 
        onClose={() => setBrainOpen(false)}
      />
      <OwnerAccessPanel 
        isOpen={ownerAccessOpen} 
        onClose={() => setOwnerAccessOpen(false)}
        workspaceContext={workspaceContext}
        owners={owners}
        loadingOwners={loadingOwners}
      />
      <QuickAddPanel 
        isOpen={quickAddOpen} 
        onClose={() => setQuickAddOpen(false)}
        onNavigate={navigate}
      />

      {/* Main Content */}
      <main className="px-4 lg:px-6 py-6 pb-32 lg:pb-24 space-y-6">
        {/* Today's Focus */}
        <TodaysFocus items={todaysFocus} />
        
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProjectsCard data={projectsData} onRowClick={handleRowClick} />
          <OpportunitiesCard data={opportunitiesData} onRowClick={handleRowClick} />
        </div>
        
        {/* Company Brain */}
        <CompanyBrainCard />
        
        {/* Recent Activity */}
        <RecentActivity activities={activities} />
      </main>
    </div>
  );
};

export default CommandCenterPage;
