/**
 * AppLayout.jsx - TradeOS V2 Operating System Shell
 * ==================================================
 * 
 * The universal application shell for ALL authenticated users.
 * 
 * V2 Architecture Principles:
 * - ONE application experience for all users
 * - Company Brain is the single AI interface
 * - Dark theme with emerald accents is universal
 * - Content adapts to user data, not user type
 * - No conditional rendering based on workspace access
 */

import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  FolderKanban, 
  Calculator, 
  Receipt, 
  Wallet,
  FolderOpen,
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Link2,
  Brain,
  Target,
  Home,
  ChevronDown,
  Library,
  Layers,
  FileText
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { Logo, LogoIcon } from '../ui/Logo';
import SyncIndicator from '../app/SyncIndicator';
import UpdateBanner from '../app/UpdateBanner';
import PWARedirectModal from '../app/PWARedirectModal';
import CompanyBrainPanel from '../brain/CompanyBrainPanel';
import { useBrainContext, getContextFromPath } from '../../hooks/useBrainContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AppLayout = () => {
  const { profile, signOut, user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
  
  // Fetch workspace context on mount (for organization name display)
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
  
  // Subscription tier display
  const tier = (profile?.subscription_tier || '').toLowerCase();
  const displayPlan = tier.includes('lifetime') || tier.includes('founding') 
    ? 'Lifetime Elite' 
    : tier === 'elite' 
      ? 'Elite' 
      : 'Pro';

  // TradeOS V2 Navigation - Workflow-Oriented
  // This is the permanent navigation structure for ALL users
  const navItems = [
    { path: '/app/command-center', icon: Home, label: 'Home' },
    { path: '/app/opportunities', icon: Target, label: 'Opportunities' },
    { path: '/app/projects', icon: FolderKanban, label: 'Projects' },
    { 
      path: '/app/estimating', 
      icon: Calculator, 
      label: 'Estimating',
      hasSubMenu: true,
      subItems: [
        { path: '/app/estimating', label: 'Estimate Workbench', icon: Calculator },
        { path: '/app/estimating/library', label: 'Production Library', icon: Library },
        { path: '/app/estimating/assemblies', label: 'Assemblies', icon: Layers },
        { path: '/app/estimating/templates', label: 'Templates', icon: FileText },
      ]
    },
    { path: '/app/invoices', icon: Receipt, label: 'Financial' },
    { path: '/app/expenses', icon: Wallet, label: 'Expenses' },
    { path: '/app/documents', icon: FolderOpen, label: 'Documents' },
    { path: '/app/reports', icon: BarChart3, label: 'Reports' },
  ];
  
  // Track expanded menu sections
  const [expandedMenus, setExpandedMenus] = useState(() => {
    // Auto-expand if we're on an estimating page
    if (location.pathname.startsWith('/app/estimating')) {
      return new Set(['Estimating']);
    }
    return new Set();
  });
  
  // Update expanded state when location changes
  useEffect(() => {
    if (location.pathname.startsWith('/app/estimating')) {
      setExpandedMenus(prev => new Set([...prev, 'Estimating']));
    }
  }, [location.pathname]);
  
  const toggleMenuExpand = (label) => {
    setExpandedMenus(prev => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };
  
  const bottomNavItems = [
    { path: '/app/integrations', icon: Link2, label: 'Integrations' },
    { path: '/app/settings', icon: Settings, label: 'Settings' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const organizationName = workspaceContext?.organization_name || profile?.company_name || 'My Company';

  return (
    <div className="min-h-screen bg-black flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-zinc-900 border-r border-zinc-800" data-testid="desktop-sidebar">
        <div className="p-5 border-b border-zinc-800">
          <Link to="/app/command-center" className="flex items-center justify-center">
            <img src="/logo.png" alt="TradeOS" className="h-20 w-auto" />
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isEstimatingSection = location.pathname.startsWith('/app/estimating');
            const isExpanded = item.hasSubMenu && expandedMenus.has(item.label);
            const isParentActive = item.hasSubMenu 
              ? location.pathname.startsWith(item.path)
              : location.pathname === item.path;
            
            if (item.hasSubMenu) {
              return (
                <div key={item.path}>
                  {/* Parent Item with Toggle */}
                  <button
                    onClick={() => toggleMenuExpand(item.label)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isParentActive
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <ChevronDown 
                      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                    />
                  </button>
                  
                  {/* Sub Items */}
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-zinc-800 pl-3">
                      {item.subItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = location.pathname === subItem.path;
                        
                        return (
                          <NavLink
                            key={subItem.path}
                            to={subItem.path}
                            end={subItem.path === '/app/estimating'}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                              isSubActive
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
                            }`}
                            data-testid={`nav-${subItem.label.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <SubIcon className="w-4 h-4" />
                            <span>{subItem.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`
                }
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
          
          {/* Separator */}
          <div className="border-t border-zinc-800 my-2"></div>
          
          {/* Bottom nav items */}
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`
              }
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <NavLink
            to="/app/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-2 ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`
            }
            data-testid="nav-profile"
          >
            <User className="w-5 h-5" />
            <span className="font-medium">My Profile</span>
          </NavLink>
          <div className="bg-zinc-800 rounded-lg p-4 mb-4">
            <p className="text-sm text-zinc-300 truncate">{organizationName}</p>
            <p className="text-xs text-zinc-500 capitalize">{displayPlan} Plan</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            data-testid="signout-btn"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar - Mobile Optimized */}
        <header className="bg-zinc-900 border-b border-zinc-800 px-4 lg:px-8 py-3 lg:py-4 flex items-center justify-between min-h-[56px] lg:min-h-[64px] safe-area-inset-top">
          {/* Hamburger Menu Button - 48px touch target */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden w-12 h-12 -ml-2 flex items-center justify-center text-zinc-400 hover:text-white active:bg-zinc-800 rounded-xl transition-colors"
            data-testid="mobile-menu-btn"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo for mobile - centered */}
          <div className="lg:hidden">
            <Link to="/app/command-center">
              <LogoIcon size="md" />
            </Link>
          </div>

          {/* Spacer for desktop */}
          <div className="hidden lg:block" />

          {/* Right side actions */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Sync Indicator */}
            <SyncIndicator />
            
            {/* Company Brain Button - Touch friendly */}
            <button
              onClick={() => setBrainOpen(true)}
              className="bg-emerald-500/20 hover:bg-emerald-500/30 active:bg-emerald-500/40 text-emerald-400 px-3 lg:px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 border border-emerald-500/30 min-h-[44px]"
              data-testid="company-brain-btn"
              title="Company Brain - Your Operations Partner"
            >
              <Brain className="w-5 h-5" />
              <span className="hidden sm:inline text-sm">Brain</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-8 overflow-x-hidden overflow-y-auto relative bg-black">
          {/* Large Shield Watermark - Centered Background - Hidden on mobile */}
          <div 
            className="fixed inset-0 pointer-events-none z-0 hidden lg:flex items-center justify-center"
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
          <div className="relative z-10 max-w-full overflow-x-hidden">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Sidebar / Navigation Drawer */}
      {mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" 
            onClick={() => setMobileMenuOpen(false)} 
          />
          <aside className="fixed inset-y-0 left-0 w-[85%] max-w-[320px] bg-zinc-900 z-50 lg:hidden flex flex-col safe-area-inset-left">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between min-h-[64px]">
              <Link to="/app/command-center" onClick={() => setMobileMenuOpen(false)}>
                <img src="/logo.png" alt="TradeOS" className="h-10 w-auto" />
              </Link>
              <button 
                onClick={() => setMobileMenuOpen(false)} 
                className="w-10 h-10 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 active:bg-zinc-700 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto overscroll-contain">
              {navItems.map((item) => {
                const isExpanded = item.hasSubMenu && expandedMenus.has(item.label);
                const isParentActive = item.hasSubMenu 
                  ? location.pathname.startsWith(item.path)
                  : location.pathname === item.path;
                
                if (item.hasSubMenu) {
                  return (
                    <div key={item.path}>
                      {/* Parent Item with Toggle */}
                      <button
                        onClick={() => toggleMenuExpand(item.label)}
                        className={`w-full flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl transition-colors min-h-[48px] ${
                          isParentActive
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'text-zinc-300 hover:text-white hover:bg-zinc-800 active:bg-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          <span className="font-medium text-[15px]">{item.label}</span>
                        </div>
                        <ChevronDown 
                          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                        />
                      </button>
                      
                      {/* Sub Items */}
                      {isExpanded && (
                        <div className="ml-5 mt-1 space-y-1 border-l border-zinc-800 pl-4">
                          {item.subItems.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const isSubActive = location.pathname === subItem.path;
                            
                            return (
                              <NavLink
                                key={subItem.path}
                                to={subItem.path}
                                end={subItem.path === '/app/estimating'}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors min-h-[44px] ${
                                  isSubActive
                                    ? 'bg-emerald-500/15 text-emerald-400'
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800 active:bg-zinc-700'
                                }`}
                              >
                                <SubIcon className="w-4 h-4 flex-shrink-0" />
                                <span className="text-[14px]">{subItem.label}</span>
                              </NavLink>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }
                
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors min-h-[48px] ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-400 border-l-4 border-emerald-500'
                          : 'text-zinc-300 hover:text-white hover:bg-zinc-800 active:bg-zinc-700'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-[15px]">{item.label}</span>
                  </NavLink>
                );
              })}
              
              {/* Separator */}
              <div className="border-t border-zinc-800 my-3"></div>
              
              {/* Bottom nav items */}
              {bottomNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors min-h-[48px] ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-800 active:bg-zinc-700'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium text-[15px]">{item.label}</span>
                </NavLink>
              ))}
              
              {/* Profile Link */}
              <NavLink
                to="/app/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors min-h-[48px] ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-800 active:bg-zinc-700'
                  }`
                }
              >
                <User className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-[15px]">My Profile</span>
              </NavLink>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-800 space-y-3 safe-area-inset-bottom">
              <div className="bg-zinc-800/50 rounded-xl p-4">
                <p className="text-sm text-zinc-200 truncate font-medium">{organizationName}</p>
                <p className="text-xs text-zinc-500 capitalize mt-0.5">{displayPlan} Plan</p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 active:bg-zinc-700 transition-colors min-h-[48px]"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-[15px]">Sign Out</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Update Banner - Shows when service worker update is available */}
      <UpdateBanner />
      
      {/* PWA Redirect Modal - Shows when user opens in browser but has app installed */}
      <PWARedirectModal />
      
      {/* Company Brain Panel - Universal AI Interface */}
      <CompanyBrainPanel
        isOpen={brainOpen}
        onClose={() => setBrainOpen(false)}
        pageContext={context}
      />
    </div>
  );
};

export default AppLayout;
