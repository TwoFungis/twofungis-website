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
  Home
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
    { path: '/app/estimating', icon: Calculator, label: 'Estimating' },
    { path: '/app/invoices', icon: Receipt, label: 'Financial' },
    { path: '/app/expenses', icon: Wallet, label: 'Expenses' },
    { path: '/app/documents', icon: FolderOpen, label: 'Documents' },
    { path: '/app/reports', icon: BarChart3, label: 'Reports' },
  ];
  
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
          {navItems.map((item) => (
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
          ))}
          
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
        {/* Top Bar */}
        <header className="bg-zinc-900 border-b border-zinc-800 px-4 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden text-zinc-400 hover:text-white"
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
            
            {/* Company Brain Button - Universal AI Interface */}
            <button
              onClick={() => setBrainOpen(true)}
              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 border border-emerald-500/30"
              data-testid="company-brain-btn"
              title="Company Brain - Your Operations Partner"
            >
              <Brain className="w-5 h-5" />
              <span className="hidden sm:inline">Brain</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8 overflow-auto relative bg-black">
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
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 flex justify-around py-2 z-30">
          {navItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive ? 'text-emerald-400' : 'text-zinc-500'
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
          <aside className="fixed inset-y-0 left-0 w-72 bg-zinc-900 z-50 lg:hidden flex flex-col">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <Logo size="sm" showText={false} />
              <button onClick={() => setMobileMenuOpen(false)} className="text-zinc-400">
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
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="p-4 border-t border-zinc-800">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
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
