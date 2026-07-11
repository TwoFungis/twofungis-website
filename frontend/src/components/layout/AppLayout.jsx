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
  Briefcase,
  Link2,
  DollarSign,
  Shield,
  Brain
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
  // Quick Add controls - only for non-TFCS users
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [showQuickExpenseModal, setShowQuickExpenseModal] = useState(false);
  const [tfcsRole, setTfcsRole] = useState(null);
  // Company Brain - TFCS users only
  const [brainOpen, setBrainOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { context, setContext } = useBrainContext();
  
  // Update brain context based on current path
  useEffect(() => {
    const pathContext = getContextFromPath(location.pathname);
    setContext({ ...pathContext, path: location.pathname });
  }, [location.pathname, setContext]);
  
  // Founder email check - use user.email from auth
  const FOUNDER_EMAILS = ["info@twofungis.ca", "swdmarshall@gmail.com", "carpenterbeau@hotmail.com", "inbox@twofungis.ca"];
  const userEmail = (user?.email || '').toLowerCase();
  const isFounder = FOUNDER_EMAILS.map(e => e.toLowerCase()).includes(userEmail);
  const tier = (profile?.subscription_tier || '').toLowerCase();
  const isElite = isFounder || tier.includes('elite') || tier.includes('lifetime') || tier.includes('founding');
  const displayPlan = isFounder || tier.includes('lifetime') || tier.includes('founding') 
    ? 'Lifetime Elite' 
    : tier === 'elite' 
      ? 'Elite' 
      : 'Pro';

  // Check TFCS Mainframe access for designated users
  useEffect(() => {
    const checkTfcsAccess = async () => {
      // Only check for potential TFCS users
      if (!userEmail || !FOUNDER_EMAILS.map(e => e.toLowerCase()).includes(userEmail)) {
        console.log('[TFCS] User not in founder list:', userEmail);
        return;
      }

      try {
        // Get token from Supabase session (the correct way)
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
          console.log('[TFCS] No session token available');
          return;
        }

        console.log('[TFCS] Checking role for:', userEmail);
        const response = await fetch(`${API_URL}/api/tfcs/role/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[TFCS] Role data:', data);
          setTfcsRole(data);
        } else {
          console.log('[TFCS] Role check failed:', response.status);
        }
      } catch (e) {
        console.error('[TFCS] Check failed:', e);
      }
    };

    checkTfcsAccess();
  }, [userEmail]);

  // Check if user has TFCS access (for sidebar reorganization)
  const hasTfcsAccess = tfcsRole?.has_role || FOUNDER_EMAILS.map(e => e.toLowerCase()).includes(userEmail);

  // TFCS Mainframe Navigation (when user has access)
  const tfcsNavItems = [
    { path: '/app/mainframe', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/app/projects', icon: FolderKanban, label: 'Projects' },
    { path: '/app/estimating', icon: Calculator, label: 'Estimates' },
    { path: '/app/invoices', icon: Receipt, label: 'Invoices' },
    { path: '/app/receivables', icon: DollarSign, label: 'Financial' },
    { path: '/app/expenses', icon: Wallet, label: 'Expenses' },
    { path: '/app/documents', icon: FolderOpen, label: 'Documents' },
    { path: '/app/reports', icon: BarChart3, label: 'Reports' },
  ];

  // Standard TradeOS navigation (non-TFCS users)
  const navItems = [
    { path: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/app/projects', icon: FolderKanban, label: 'Projects' },
    { path: '/app/estimating', icon: Calculator, label: 'Estimates' },
    { path: '/app/change-orders', icon: FileText, label: 'Change Orders' },
    { path: '/app/milestones', icon: Flag, label: 'Milestones' },
    { path: '/app/invoices', icon: Receipt, label: 'Invoices' },
    { path: '/app/receivables', icon: DollarSign, label: 'Receivables' },
    { path: '/app/expenses', icon: Wallet, label: 'Expenses' },
    { path: '/app/documents', icon: FolderOpen, label: 'Document Vault' },
    { path: '/app/tax-summary', icon: PieChart, label: 'Tax Summary' },
    { path: '/app/reports', icon: BarChart3, label: 'Reports' },
  ];

  // Use TFCS nav if user has access
  const activeNavItems = hasTfcsAccess ? tfcsNavItems : navItems;
  
  const bottomNavItems = [
    { path: '/app/integrations', icon: Link2, label: 'Integrations' },
    { path: '/app/settings', icon: Settings, label: 'Settings' },
  ];

  const quickActions = [
    { label: 'Quick Expense', action: () => setShowQuickExpenseModal(true), icon: Wallet, highlight: true },
    { label: 'New Estimate', path: '/app/estimating?new=true', icon: FileSpreadsheet },
    { label: 'New Project', path: '/app/projects?new=true', icon: FolderKanban },
    { label: 'New Change Order', path: '/app/change-orders?new=true', icon: FileText },
    { label: 'New Invoice', path: '/app/invoices?new=true', icon: Receipt },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className={`min-h-screen ${hasTfcsAccess ? 'bg-tfcs-black' : 'bg-cloud-100'} flex`}>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col w-64 ${hasTfcsAccess ? 'bg-tfcs-surface border-r border-tfcs-border' : 'bg-charcoal-800 border-r border-charcoal-700'}`} data-testid="desktop-sidebar">
        <div className={`p-5 border-b ${hasTfcsAccess ? 'border-tfcs-border' : 'border-charcoal-700'}`}>
          {hasTfcsAccess ? (
            <Link to="/app/mainframe" className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-6 h-6 text-tfcs-gold" />
                <span className="text-lg font-bold text-white tracking-tight">TFCS</span>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Two Fungis Finishing</span>
            </Link>
          ) : (
            <Link to="/app" className="flex items-center justify-center">
              <img src="/logo.png" alt="TradeOS" className="h-24 w-auto" />
            </Link>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {activeNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? hasTfcsAccess 
                      ? 'bg-tfcs-gold/10 text-tfcs-gold border-l-2 border-tfcs-gold'
                      : 'bg-steel-500/20 text-steel-400'
                    : hasTfcsAccess
                      ? 'text-zinc-400 hover:text-white hover:bg-tfcs-surface-hover'
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
          <div className={`border-t ${hasTfcsAccess ? 'border-tfcs-border' : 'border-charcoal-700'} my-2`}></div>
          
          {/* Bottom nav items */}
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? hasTfcsAccess
                      ? 'bg-tfcs-gold/10 text-tfcs-gold'
                      : 'bg-steel-500/20 text-steel-400'
                    : hasTfcsAccess
                      ? 'text-zinc-400 hover:text-white hover:bg-tfcs-surface-hover'
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

        <div className={`p-4 border-t ${hasTfcsAccess ? 'border-tfcs-border' : 'border-charcoal-700'}`}>
          <NavLink
            to="/app/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-2 ${
                isActive
                  ? hasTfcsAccess
                    ? 'bg-tfcs-gold/10 text-tfcs-gold'
                    : 'bg-steel-500/20 text-steel-400'
                  : hasTfcsAccess
                    ? 'text-zinc-400 hover:text-white hover:bg-tfcs-surface-hover'
                    : 'text-gray-400 hover:text-white hover:bg-charcoal-700'
              }`
            }
            data-testid="nav-profile"
          >
            <User className="w-5 h-5" />
            <span className="font-medium">My Profile</span>
          </NavLink>
          <div className="bg-charcoal-700 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-400 truncate">{profile?.company_name || 'My Company'}</p>
            <p className="text-xs text-gray-500 capitalize">
              {displayPlan} Plan
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-charcoal-700 transition-colors"
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
        <header className="bg-charcoal-800 border-b border-charcoal-700 px-4 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden text-gray-400 hover:text-white"
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
            
            {/* Trial Countdown Badge - Non-TFCS users only */}
            {!hasTfcsAccess && <TrialCountdown />}
            
            {/* TFCS Users: Company Brain is the single operational interface */}
            {hasTfcsAccess ? (
              <button
                onClick={() => setBrainOpen(true)}
                className="bg-tfcs-gold/20 hover:bg-tfcs-gold/30 text-tfcs-gold px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 border border-tfcs-gold/30"
                data-testid="company-brain-btn"
                title="Company Brain - Your Operations Partner"
              >
                <Brain className="w-5 h-5" />
                <span className="hidden sm:inline">Brain</span>
              </button>
            ) : (
              /* Non-TFCS Users: Traditional Quick Add */
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

        {/* Page Content with Shield Backdrop */}
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8 overflow-auto relative">
          {/* Large Shield Watermark - Centered Background - More Visible */}
          <div 
            className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center"
            style={{ marginLeft: '200px' }}
          >
            <div 
              className="w-[700px] h-[700px] opacity-[0.06]"
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
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-charcoal-800 border-t border-charcoal-700 flex justify-around py-2 z-30">
          {navItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive ? 'text-steel-400' : 'text-gray-500'
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
          <aside className="fixed inset-y-0 left-0 w-72 bg-charcoal-800 z-50 lg:hidden flex flex-col">
            <div className="p-4 border-b border-charcoal-700 flex items-center justify-between">
              <Logo size="sm" showText={false} />
              <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-steel-500/20 text-steel-400'
                        : 'text-gray-400 hover:text-white hover:bg-charcoal-700'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="p-4 border-t border-charcoal-700">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-charcoal-700 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Trial Expired Modal - Non-TFCS users only */}
      {!hasTfcsAccess && <TrialExpiredModal />}

      {/* Quick Add Expense Modal - Non-TFCS users only */}
      {!hasTfcsAccess && showQuickExpenseModal && (
        <QuickAddExpenseModal 
          onClose={() => setShowQuickExpenseModal(false)}
          onSuccess={() => setShowQuickExpenseModal(false)}
        />
      )}
      
      {/* AI Copilot - Non-TFCS users only (TFCS uses Company Brain) */}
      {!hasTfcsAccess && <AICopilot />}
      
      {/* Quick Add FAB (Floating Action Button) - Non-TFCS users only */}
      {!hasTfcsAccess && <QuickAddFab />}
      
      {/* Update Banner - Shows when service worker update is available */}
      <UpdateBanner />
      
      {/* PWA Redirect Modal - Shows when user opens in browser but has app installed */}
      <PWARedirectModal />
      
      {/* Company Brain Panel - TFCS users only - Single operational interface */}
      {hasTfcsAccess && (
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
