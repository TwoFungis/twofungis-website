import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Calculator, 
  FileText, 
  Flag, 
  Receipt, 
  Wallet,
  FolderOpen,
  BarChart3, 
  Settings,
  Plus,
  LogOut,
  Menu,
  X,
  FileSpreadsheet,
  Crown,
  User,
  PieChart,
  Link2,
  DollarSign,
  Brain,
  Target,
  Users,
  Calendar,
  Store,
  Home
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { Logo, LogoIcon } from '../ui/Logo';
import TrialCountdown from '../trial/TrialCountdown';
import TrialExpiredModal from '../trial/TrialExpiredModal';
import QuickAddExpenseModal from './QuickAddExpenseModal';
import AICopilot from '../ai/AICopilot';
import QuickAddFab from '../app/QuickAddFab';
import SyncIndicator from '../app/SyncIndicator';
import UpdateBanner from '../app/UpdateBanner';
import PWARedirectModal from '../app/PWARedirectModal';
import CompanyBrainPanel from '../brain/CompanyBrainPanel';
import { useBrainContext, getContextFromPath } from '../../hooks/useBrainContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AppLayout = () => {
  const { profile, signOut, user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [showQuickExpenseModal, setShowQuickExpenseModal] = useState(false);
  const [workspaceContext, setWorkspaceContext] = useState(null);
  const [brainOpen, setBrainOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { context, setContext } = useBrainContext();
  
  // Update brain context based on current path
  useEffect(() => {
    const pathContext = getContextFromPath(location.pathname);
    setContext({ ...pathContext, path: location.pathname });
  }, [location.pathname, setContext]);
  
  // Fetch workspace context on mount
  useEffect(() => {
    const fetchWorkspaceContext = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        if (!token) return;
        
        const response = await fetch(`${API_URL}/api/workspace/context`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setWorkspaceContext(data);
        }
      } catch (e) {
        console.error('[AppLayout] Workspace context error:', e);
      }
    };
    
    fetchWorkspaceContext();
  }, []);
  
  // Determine if user has workspace access (organization member or platform admin)
  const hasWorkspaceAccess = workspaceContext?.has_access || 
                             workspaceContext?.has_organization || 
                             workspaceContext?.is_platform_admin;
  
  const isOwner = workspaceContext?.is_owner || 
                  workspaceContext?.organization_role === 'owner';
  
  // Subscription tier display
  const tier = (profile?.subscription_tier || '').toLowerCase();
  const isFounderOrElite = tier.includes('lifetime') || 
                           tier.includes('founding') ||
                           tier === 'elite';
  const displayPlan = tier.includes('lifetime') || tier.includes('founding') 
    ? 'Lifetime Elite' 
    : tier === 'elite' 
      ? 'Elite' 
      : 'Pro';

  // TradeOS Navigation - Workflow-Oriented (Phase 2)
  // This is the new operating system navigation structure
  const tradeOSNavItems = [
    { path: '/app/command-center', icon: Home, label: 'Home' },
    { path: '/app/opportunities', icon: Target, label: 'Opportunities' },
    { path: '/app/projects', icon: FolderKanban, label: 'Projects' },
    { path: '/app/estimating', icon: Calculator, label: 'Estimating' },
    { path: '/app/invoices', icon: Receipt, label: 'Financial' },
    { path: '/app/expenses', icon: Wallet, label: 'Expenses' },
    { path: '/app/documents', icon: FolderOpen, label: 'Documents' },
    { path: '/app/reports', icon: BarChart3, label: 'Reports' },
  ];

  // Standard TradeOS navigation (users without org membership - onboarding)
  const standardNavItems = [
    { path: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/app/projects', icon: FolderKanban, label: 'Projects' },
    { path: '/app/estimating', icon: Calculator, label: 'Estimates' },
    { path: '/app/invoices', icon: Receipt, label: 'Invoices' },
    { path: '/app/expenses', icon: Wallet, label: 'Expenses' },
    { path: '/app/documents', icon: FolderOpen, label: 'Documents' },
    { path: '/app/reports', icon: BarChart3, label: 'Reports' },
  ];

  // Use TradeOS nav if user has workspace access, otherwise standard
  const activeNavItems = hasWorkspaceAccess ? tradeOSNavItems : standardNavItems;
  
  const bottomNavItems = [
    { path: '/app/integrations', icon: Link2, label: 'Integrations' },
    { path: '/app/settings', icon: Settings, label: 'Settings' },
  ];

  const quickActions = [
    { label: 'Quick Expense', action: () => setShowQuickExpenseModal(true), icon: Wallet, highlight: true },
    { label: 'New Estimate', path: '/app/estimating?new=true', icon: FileSpreadsheet },
    { label: 'New Project', path: '/app/projects?new=true', icon: FolderKanban },
    { label: 'New Invoice', path: '/app/invoices?new=true', icon: Receipt },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const organizationName = workspaceContext?.organization_name || profile?.company_name || 'My Company';

  return (
    <div className={`min-h-screen ${hasWorkspaceAccess ? 'bg-black' : 'bg-cloud-100'} flex`}>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col w-64 ${hasWorkspaceAccess ? 'bg-zinc-900 border-r border-zinc-800' : 'bg-charcoal-800 border-r border-charcoal-700'}`} data-testid="desktop-sidebar">
        <div className={`p-5 border-b ${hasWorkspaceAccess ? 'border-zinc-800' : 'border-charcoal-700'}`}>
          <Link to={hasWorkspaceAccess ? "/app/command-center" : "/app"} className="flex items-center justify-center">
            <img src="/logo.png" alt="TradeOS" className="h-20 w-auto" />
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {activeNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? hasWorkspaceAccess 
                      ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500'
                      : 'bg-steel-500/20 text-steel-400'
                    : hasWorkspaceAccess
                      ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      : 'text-gray-400 hover:text-white hover:bg-charcoal-700'
                }`
              }
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
          
          {/* Separator */}
          <div className={`border-t ${hasWorkspaceAccess ? 'border-zinc-800' : 'border-charcoal-700'} my-2`}></div>
          
          {/* Bottom nav items */}
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? hasWorkspaceAccess
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-steel-500/20 text-steel-400'
                    : hasWorkspaceAccess
                      ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      : 'text-gray-400 hover:text-white hover:bg-charcoal-700'
                }`
              }
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={`p-4 border-t ${hasWorkspaceAccess ? 'border-zinc-800' : 'border-charcoal-700'}`}>
          <NavLink
            to="/app/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-2 ${
                isActive
                  ? hasWorkspaceAccess
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-steel-500/20 text-steel-400'
                  : hasWorkspaceAccess
                    ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    : 'text-gray-400 hover:text-white hover:bg-charcoal-700'
              }`
            }
            data-testid="nav-profile"
          >
            <User className="w-5 h-5" />
            <span className="font-medium">My Profile</span>
          </NavLink>
          <div className={`${hasWorkspaceAccess ? 'bg-zinc-800' : 'bg-charcoal-700'} rounded-lg p-4 mb-4`}>
            <p className={`text-sm ${hasWorkspaceAccess ? 'text-zinc-300' : 'text-gray-400'} truncate`}>{organizationName}</p>
            <p className={`text-xs ${hasWorkspaceAccess ? 'text-zinc-500' : 'text-gray-500'} capitalize`}>
              {displayPlan} Plan
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg ${hasWorkspaceAccess ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-gray-400 hover:text-white hover:bg-charcoal-700'} transition-colors`}
            data-testid="signout-btn"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className={`${hasWorkspaceAccess ? 'bg-zinc-900 border-b border-zinc-800' : 'bg-charcoal-800 border-b border-charcoal-700'} px-4 lg:px-8 py-4 flex items-center justify-between`}>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={`lg:hidden ${hasWorkspaceAccess ? 'text-zinc-400 hover:text-white' : 'text-gray-400 hover:text-white'}`}
            data-testid="mobile-menu-btn"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="lg:hidden">
            <LogoIcon size="md" />
          </div>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            {/* Sync Indicator */}
            <SyncIndicator />
            
            {/* Trial Countdown Badge - only for users without workspace access */}
            {!hasWorkspaceAccess && <TrialCountdown />}
            
            {/* Company Brain Button - for users with workspace access */}
            {hasWorkspaceAccess ? (
              <button
                onClick={() => setBrainOpen(true)}
                className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 border border-emerald-500/30"
                data-testid="company-brain-btn"
                title="Company Brain - Your Operations Partner"
              >
                <Brain className="w-5 h-5" />
                <span className="hidden sm:inline">Brain</span>
              </button>
            ) : (
              /* Standard Quick Add for users without workspace */
              <div className="relative">
                <button
                  onClick={() => setQuickActionOpen(!quickActionOpen)}
                  className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  data-testid="quick-add-btn"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Quick Add</span>
                </button>

                {quickActionOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setQuickActionOpen(false)} />
                    <div className="absolute right-0 mt-2 w-52 bg-charcoal-800 rounded-lg shadow-xl border border-charcoal-700 py-2 z-50">
                      {/* New Expense */}
                      <button
                        onClick={() => {
                          setShowQuickExpenseModal(true);
                          setQuickActionOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-gray-300 hover:text-white hover:bg-charcoal-700 transition-colors"
                        data-testid="quick-action-new-expense"
                      >
                        <Wallet className="w-4 h-4" />
                        New Expense
                      </button>
                      {quickActions.filter(a => a.label !== 'Quick Expense').map((action) => (
                        <button
                          key={action.label}
                          onClick={() => {
                            if (action.action) {
                              action.action();
                            } else if (action.path) {
                              navigate(action.path);
                            }
                            setQuickActionOpen(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2 text-gray-300 hover:text-white hover:bg-charcoal-700 transition-colors"
                          data-testid={`quick-action-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <action.icon className="w-4 h-4" />
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className={`flex-1 p-4 lg:p-8 pb-20 lg:pb-8 overflow-auto relative ${hasWorkspaceAccess ? 'bg-black' : ''}`}>
          {/* Large Shield Watermark - Centered Background */}
          <div 
            className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center"
            style={{ marginLeft: '200px' }}
          >
            <div 
              className="w-[700px] h-[700px] opacity-[0.03]"
              style={{
                backgroundImage: 'url(/shield-icon.png)',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center'
              }}
            />
          </div>
          <div className="relative z-10">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className={`lg:hidden fixed bottom-0 left-0 right-0 ${hasWorkspaceAccess ? 'bg-zinc-900 border-t border-zinc-800' : 'bg-charcoal-800 border-t border-charcoal-700'} flex justify-around py-2 z-30`}>
          {activeNavItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? hasWorkspaceAccess ? 'text-emerald-400' : 'text-steel-400' 
                    : hasWorkspaceAccess ? 'text-zinc-500' : 'text-gray-500'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label.split(' ')[0]}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
            onClick={() => setMobileMenuOpen(false)} 
          />
          <aside className={`fixed inset-y-0 left-0 w-72 ${hasWorkspaceAccess ? 'bg-zinc-900' : 'bg-charcoal-800'} z-50 lg:hidden flex flex-col`}>
            <div className={`p-4 border-b ${hasWorkspaceAccess ? 'border-zinc-800' : 'border-charcoal-700'} flex items-center justify-between`}>
              <Logo size="sm" showText={false} />
              <button onClick={() => setMobileMenuOpen(false)} className={hasWorkspaceAccess ? 'text-zinc-400' : 'text-gray-400'}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {activeNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? hasWorkspaceAccess
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-steel-500/20 text-steel-400'
                        : hasWorkspaceAccess
                          ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                          : 'text-gray-400 hover:text-white hover:bg-charcoal-700'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className={`p-4 border-t ${hasWorkspaceAccess ? 'border-zinc-800' : 'border-charcoal-700'}`}>
              <button
                onClick={handleSignOut}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg ${hasWorkspaceAccess ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-gray-400 hover:text-white hover:bg-charcoal-700'} transition-colors`}
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Trial Expired Modal - only for users without workspace access */}
      {!hasWorkspaceAccess && <TrialExpiredModal />}

      {/* Quick Add Expense Modal */}
      {showQuickExpenseModal && (
        <QuickAddExpenseModal 
          onClose={() => setShowQuickExpenseModal(false)}
          onSuccess={() => setShowQuickExpenseModal(false)}
        />
      )}
      
      {/* AI Copilot - only for users without workspace access */}
      {!hasWorkspaceAccess && <AICopilot />}
      
      {/* Quick Add FAB - only for users without workspace access */}
      {!hasWorkspaceAccess && <QuickAddFab />}
      
      {/* Update Banner - Shows when service worker update is available */}
      <UpdateBanner />
      
      {/* PWA Redirect Modal - Shows when user opens in browser but has app installed */}
      <PWARedirectModal />
      
      {/* Company Brain Panel - for users with workspace access */}
      {hasWorkspaceAccess && (
        <CompanyBrainPanel
          isOpen={brainOpen}
          onClose={() => setBrainOpen(false)}
          pageContext={context}
        />
      )}
    </div>
  );
};

export default AppLayout;
