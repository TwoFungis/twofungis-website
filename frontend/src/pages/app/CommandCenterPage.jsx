import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Sparkles, 
  Crown, 
  Plus,
  ChevronRight,
  X,
  Loader2,
  User,
  FolderKanban,
  Target,
  Clock,
  AlertCircle,
  Zap,
  TrendingUp,
  Calendar,
  ArrowRight,
  CheckCircle2,
  FileText,
  MessageSquare,
  Send
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ============================================
// UTILITY FUNCTIONS
// ============================================

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'Yesterday';
  return date.toLocaleDateString();
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-CA', { 
    style: 'currency', 
    currency: 'CAD', 
    maximumFractionDigits: 0 
  }).format(value || 0);
};

// ============================================
// HEADER PANELS
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

const QuickAddPanel = ({ isOpen, onClose, onNavigate }) => {
  if (!isOpen) return null;
  
  const items = [
    { label: 'New Opportunity', icon: Target, href: '/app/opportunities/new', description: 'Start tracking a new opportunity' },
    { label: 'New Project', icon: FolderKanban, href: '/app/projects/new', description: 'Create a new project workspace' },
    { label: 'Quick Note', icon: FileText, href: '/app/notes/new', description: 'Capture a quick note' },
  ];
  
  return (
    <div className="fixed inset-0 z-50 lg:relative lg:inset-auto">
      <div className="fixed inset-0 bg-black/50 lg:hidden" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-zinc-900 border-l border-zinc-800 lg:absolute lg:top-full lg:right-0 lg:h-auto lg:mt-2 lg:rounded-lg lg:border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="font-semibold text-white">Quick Add</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white" data-testid="close-quickadd">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-3 space-y-2">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => { onNavigate(item.href); onClose(); }}
              className="w-full flex items-center gap-4 px-4 py-4 text-left bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors group"
              data-testid={`quickadd-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                <item.icon className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <span className="text-white font-medium block">{item.label}</span>
                <span className="text-zinc-500 text-xs">{item.description}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// TODAY'S FOCUS COMPONENT
// ============================================

const TodaysFocus = ({ items, loading, onItemClick }) => {
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'urgent': 
        return { 
          bg: 'bg-red-500/10', 
          border: 'border-red-500/30', 
          dot: 'bg-red-500',
          icon: AlertCircle,
          iconColor: 'text-red-400'
        };
      case 'success': 
        return { 
          bg: 'bg-emerald-500/10', 
          border: 'border-emerald-500/30', 
          dot: 'bg-emerald-500',
          icon: CheckCircle2,
          iconColor: 'text-emerald-400'
        };
      case 'info': 
        return { 
          bg: 'bg-amber-500/10', 
          border: 'border-amber-500/30', 
          dot: 'bg-amber-500',
          icon: Clock,
          iconColor: 'text-amber-400'
        };
      default: 
        return { 
          bg: 'bg-zinc-800', 
          border: 'border-zinc-700', 
          dot: 'bg-zinc-500',
          icon: Zap,
          iconColor: 'text-zinc-400'
        };
    }
  };
  
  if (loading) {
    return (
      <div className="bg-zinc-900 border-l-4 border-l-emerald-500 border border-zinc-800 p-6 rounded-lg" data-testid="todays-focus">
        <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-4">Today&apos;s Focus</h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        </div>
      </div>
    );
  }
  
  if (!items || items.length === 0) {
    return (
      <div className="bg-zinc-900 border-l-4 border-l-emerald-500 border border-zinc-800 p-6 rounded-lg" data-testid="todays-focus">
        <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-4">Today&apos;s Focus</h2>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-zinc-400 font-medium">All caught up!</p>
          <p className="text-zinc-500 text-sm mt-1">No priority items require attention today.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-zinc-900 border-l-4 border-l-emerald-500 border border-zinc-800 p-4 lg:p-6 rounded-lg" data-testid="todays-focus">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500">Today&apos;s Focus</h2>
        <span className="text-xs text-zinc-600">{items.length} item{items.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
        {items.slice(0, 3).map((item, i) => {
          const style = getPriorityStyle(item.priority);
          const Icon = style.icon;
          return (
            <button
              key={item.id || i}
              onClick={() => onItemClick(item)}
              className={`${style.bg} border ${style.border} rounded-lg p-4 text-left hover:opacity-90 transition-all hover:scale-[1.02] group`}
              data-testid={`focus-item-${i}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                  <Icon className={`w-4 h-4 ${style.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{item.title}</p>
                  <p className="text-zinc-400 text-xs mt-1">{item.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center justify-end mt-3 text-xs text-zinc-500 group-hover:text-emerald-400 transition-colors">
                <span>View</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// PIPELINE CARDS
// ============================================

const ProjectsCard = ({ data, loading, onRowClick }) => {
  const rows = [
    { label: 'Starting Soon', key: 'starting_soon', count: data?.starting_soon || 0 },
    { label: 'In Progress', key: 'in_progress', count: data?.in_progress || 0, highlight: true },
    { label: 'On Hold', key: 'deficiencies', count: data?.deficiencies || 0, warning: data?.deficiencies > 0 },
    { label: 'Completed', key: 'completed', count: data?.completed || 0 },
  ];
  
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden" data-testid="projects-card">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500">Projects</h2>
        </div>
        <span className="text-lg font-bold text-white">{data?.total || 0}</span>
      </div>
      {loading ? (
        <div className="p-8 flex justify-center">
          <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/50">
          {rows.map((row) => (
            <button
              key={row.key}
              onClick={() => onRowClick('projects', row.key)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50 transition-colors text-left group"
              data-testid={`project-row-${row.key}`}
            >
              <span className={`${row.highlight ? 'text-white font-medium' : row.warning ? 'text-amber-400' : 'text-zinc-400'}`}>
                {row.label}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-mono ${row.highlight ? 'text-emerald-400' : row.warning ? 'text-amber-400' : 'text-white'}`}>
                  {row.count}
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const OpportunitiesCard = ({ data, loading, onRowClick }) => {
  // Group by workflow phase
  const phases = [
    { 
      label: 'Pipeline', 
      items: [
        { key: 'discovered', label: 'Discovered', count: data?.discovered || 0 },
        { key: 'qualifying', label: 'Qualifying', count: data?.qualifying || 0 },
      ]
    },
    {
      label: 'Active Work',
      items: [
        { key: 'tendering', label: 'Tendering', count: data?.tendering || 0, highlight: true },
        { key: 'submitted', label: 'Submitted', count: data?.submitted || 0 },
        { key: 'negotiation', label: 'Negotiating', count: data?.negotiation || 0 },
      ]
    },
    {
      label: 'Outcomes',
      items: [
        { key: 'awarded', label: 'Awarded', count: data?.awarded || 0, success: true },
        { key: 'lost', label: 'Lost', count: data?.lost || 0, muted: true },
      ]
    }
  ];
  
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden" data-testid="opportunities-card">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500">Opportunities</h2>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-white">{data?.total_active || 0}</span>
          <span className="text-xs text-zinc-500 ml-1">active</span>
        </div>
      </div>
      {loading ? (
        <div className="p-8 flex justify-center">
          <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
        </div>
      ) : (
        <div className="p-2">
          {phases.map((phase, pi) => (
            <div key={pi} className="mb-2 last:mb-0">
              <div className="px-2 py-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-600">{phase.label}</span>
              </div>
              <div className="space-y-0.5">
                {phase.items.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => onRowClick('opportunities', item.key)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-zinc-800/50 rounded-md transition-colors text-left group"
                    data-testid={`opportunity-row-${item.key}`}
                  >
                    <span className={`text-sm ${item.highlight ? 'text-white font-medium' : item.success ? 'text-emerald-400' : item.muted ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {item.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono ${item.highlight ? 'text-emerald-400 font-bold' : item.success ? 'text-emerald-400' : item.muted ? 'text-zinc-600' : 'text-zinc-300'}`}>
                        {item.count}
                      </span>
                      <ChevronRight className="w-3 h-3 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {data?.total_value > 0 && (
            <div className="mt-3 pt-3 border-t border-zinc-800 px-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Pipeline Value</span>
                <span className="text-sm font-bold text-emerald-400">{formatCurrency(data.total_value)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// COMPANY BRAIN CARD
// ============================================

const CompanyBrainCard = ({ insights, onAskBrain }) => {
  const [inputValue, setInputValue] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAskBrain(inputValue);
      setInputValue('');
    }
  };
  
  return (
    <div className="bg-black border border-emerald-500/20 rounded-lg overflow-hidden" data-testid="company-brain-card">
      <div className="px-4 py-3 border-b border-emerald-500/20 bg-emerald-500/5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-mono uppercase tracking-wider text-emerald-400">Company Brain</h2>
        </div>
      </div>
      
      <div className="p-4">
        {/* Insights Section */}
        {insights?.has_insights && insights.insights?.length > 0 && (
          <div className="mb-4 space-y-2">
            {insights.insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-zinc-900/50 rounded-lg">
                <Zap className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-zinc-300">{insight.message}</p>
              </div>
            ))}
          </div>
        )}
        
        {/* Recommendations */}
        {insights?.recommendations?.length > 0 && (
          <div className="mb-4 space-y-2">
            {insights.recommendations.map((rec, i) => (
              <button
                key={i}
                onClick={() => rec.action_link && window.location.assign(rec.action_link)}
                className="w-full flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors text-left group"
              >
                <TrendingUp className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-sm text-zinc-300 flex-1">{rec.message}</span>
                <ArrowRight className="w-4 h-4 text-emerald-500/50 group-hover:text-emerald-400 transition-colors" />
              </button>
            ))}
          </div>
        )}
        
        {/* No insights state */}
        {!insights?.has_insights && (
          <div className="text-center py-4 mb-4">
            <p className="text-zinc-500 text-sm">Company Brain is analyzing your operations...</p>
          </div>
        )}
        
        {/* Ask Brain Input */}
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask Company Brain anything..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-4 pr-12 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
            data-testid="brain-input"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-emerald-400 disabled:opacity-30 disabled:hover:text-zinc-500 transition-colors"
            data-testid="brain-submit"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

// ============================================
// RECENT ACTIVITY TIMELINE
// ============================================

const RecentActivity = ({ activities, loading }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'create': return { icon: Plus, color: 'text-emerald-400', bg: 'bg-emerald-500' };
      case 'update': return { icon: FileText, color: 'text-amber-400', bg: 'bg-amber-500' };
      case 'urgent': return { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500' };
      default: return { icon: MessageSquare, color: 'text-zinc-400', bg: 'bg-zinc-500' };
    }
  };
  
  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg" data-testid="recent-activity">
        <div className="px-4 py-3 border-b border-zinc-800">
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500">Recent Activity</h2>
        </div>
        <div className="p-8 flex justify-center">
          <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg" data-testid="recent-activity">
      <div className="px-4 py-3 border-b border-zinc-800">
        <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500">Recent Activity</h2>
      </div>
      <div className="p-4">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-zinc-500 text-sm">No recent activity</p>
            <p className="text-zinc-600 text-xs mt-1">Activity will appear here as you work</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[5px] top-2 bottom-2 w-px bg-zinc-800" />
            
            <div className="space-y-4">
              {activities.map((activity, i) => {
                const style = getActivityIcon(activity.type);
                return (
                  <div key={activity.id || i} className="flex gap-4 relative">
                    <div className={`w-3 h-3 rounded-full ${style.bg} flex-shrink-0 mt-1.5 z-10 ring-4 ring-zinc-900`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">
                        <span className="font-medium text-zinc-300">{activity.user}</span>
                        <span className="text-zinc-500"> {activity.action}</span>
                      </p>
                      <p className="text-xs font-mono text-zinc-600 mt-1">
                        {formatTimeAgo(activity.time)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// MAIN COMMAND CENTER COMPONENT
// ============================================

const CommandCenterPage = () => {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  
  // Panel states
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  
  // Data states
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
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
      
      // Fetch unified command center data
      const response = await fetch(`${API_URL}/api/command-center/dashboard`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        console.error('[CommandCenter] Dashboard fetch failed:', response.status);
        setError('Failed to load dashboard data');
      }
      
    } catch (error) {
      console.error('[CommandCenter] Error:', error);
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDashboardData();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const handleRowClick = (section, filter) => {
    navigate(`/app/${section}?status=${filter}`);
  };
  
  const handleFocusItemClick = (item) => {
    if (item.link) {
      navigate(item.link);
    }
  };
  
  const handleAskBrain = (question) => {
    // Navigate to brain panel or open chat
    navigate('/app/brain?q=' + encodeURIComponent(question));
  };

  const handleMarkRead = (notifId) => {
    setNotifications(prev => prev.filter(n => n.id !== notifId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const closeAllPanels = () => {
    setNotificationsOpen(false);
    setQuickAddOpen(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-zinc-500 text-sm font-mono">Loading Command Center...</p>
        </div>
      </div>
    );
  }

  const organizationName = dashboardData?.organization_name || profile?.company_name || 'Your Company';
  const userName = dashboardData?.user_name || profile?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-black font-sans" data-testid="tradeos-command-center">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Title */}
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {userName}
              </h1>
              <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider mt-0.5">{organizationName}</p>
            </div>
            
            {/* Right: Actions */}
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Notifications */}
              <button
                onClick={() => { closeAllPanels(); setNotificationsOpen(true); }}
                className="relative p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800"
                data-testid="notifications-bell"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              
              {/* Quick Add */}
              <button
                onClick={() => { closeAllPanels(); setQuickAddOpen(true); }}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-lg transition-colors"
                data-testid="quickadd-btn"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">New</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Panels */}
      <NotificationsPanel 
        isOpen={notificationsOpen} 
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkRead}
      />
      <QuickAddPanel 
        isOpen={quickAddOpen} 
        onClose={() => setQuickAddOpen(false)}
        onNavigate={navigate}
      />

      {/* Main Content */}
      <main className="px-4 lg:px-6 py-6 pb-32 lg:pb-24 space-y-6 max-w-7xl mx-auto">
        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-red-400 font-medium">Unable to load data</p>
              <p className="text-red-400/70 text-sm">{error}</p>
            </div>
            <button 
              onClick={fetchDashboardData}
              className="ml-auto text-red-400 hover:text-red-300 text-sm underline"
            >
              Retry
            </button>
          </div>
        )}
        
        {/* Today's Focus */}
        <TodaysFocus 
          items={dashboardData?.today_focus || []} 
          loading={loading}
          onItemClick={handleFocusItemClick}
        />
        
        {/* Two Column Layout: Projects & Opportunities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProjectsCard 
            data={dashboardData?.projects} 
            loading={loading}
            onRowClick={handleRowClick} 
          />
          <OpportunitiesCard 
            data={dashboardData?.opportunities} 
            loading={loading}
            onRowClick={handleRowClick} 
          />
        </div>
        
        {/* Company Brain */}
        <CompanyBrainCard 
          insights={dashboardData?.brain_insights}
          onAskBrain={handleAskBrain}
        />
        
        {/* Recent Activity */}
        <RecentActivity 
          activities={dashboardData?.recent_activity || []} 
          loading={loading}
        />
      </main>
    </div>
  );
};

export default CommandCenterPage;
