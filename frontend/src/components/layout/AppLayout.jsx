import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
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
  Briefcase
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Logo, LogoIcon } from '../ui/Logo';
import TrialCountdown from '../trial/TrialCountdown';
import TrialExpiredModal from '../trial/TrialExpiredModal';
import QuickAddExpenseModal from './QuickAddExpenseModal';

const AppLayout = () => {
  const { profile, signOut } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [showQuickExpenseModal, setShowQuickExpenseModal] = useState(false);
  const navigate = useNavigate();

  // Focused navigation - Core business functions only
  const navItems = [
    { path: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/app/projects', icon: FolderKanban, label: 'Projects' },
    { path: '/app/estimating', icon: Calculator, label: 'Estimates' },
    { path: '/app/change-orders', icon: FileText, label: 'Change Orders' },
    { path: '/app/milestones', icon: Flag, label: 'Milestones' },
    { path: '/app/invoices', icon: Receipt, label: 'Invoices' },
    { path: '/app/expenses', icon: Wallet, label: 'Expenses' },
    { path: '/app/documents', icon: FolderOpen, label: 'Document Vault' },
    { path: '/app/tax-summary', icon: PieChart, label: 'Tax Summary' },
    { path: '/app/reports', icon: BarChart3, label: 'Reports' },
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
    <div className="min-h-screen bg-cloud-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-charcoal-800 border-r border-charcoal-700" data-testid="desktop-sidebar">
        <div className="p-5 border-b border-charcoal-700">
          <Logo size="lg" showText={true} />
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-steel-500/20 text-steel-400'
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

        <div className="p-4 border-t border-charcoal-700">
          <NavLink
            to="/app/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-2 ${
                isActive
                  ? 'bg-steel-500/20 text-steel-400'
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
            <p className="text-xs text-gray-500 capitalize">{profile?.subscription_tier || 'Pro'} Plan</p>
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
            {/* Trial Countdown Badge */}
            <TrialCountdown />
            
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
                    {quickActions.map((action, idx) => (
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
                        className={`flex items-center gap-3 w-full px-4 py-2 transition-colors ${
                          action.highlight 
                            ? 'text-steel-400 hover:text-steel-300 hover:bg-steel-500/10 font-medium' 
                            : 'text-gray-300 hover:text-white hover:bg-charcoal-700'
                        } ${idx === 0 ? 'border-b border-charcoal-700 pb-2 mb-1' : ''}`}
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
          </div>
        </header>

        {/* Page Content with Shield Backdrop */}
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8 overflow-auto relative">
          {/* Shield Watermark */}
          <div 
            className="fixed bottom-0 right-0 w-96 h-96 opacity-[0.02] pointer-events-none z-0"
            style={{
              backgroundImage: 'url(/logo.png)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'bottom right'
            }}
          />
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

      {/* Trial Expired Modal */}
      <TrialExpiredModal />

      {/* Quick Add Expense Modal */}
      {showQuickExpenseModal && (
        <QuickAddExpenseModal 
          onClose={() => setShowQuickExpenseModal(false)}
          onSuccess={() => setShowQuickExpenseModal(false)}
        />
      )}
    </div>
  );
};

export default AppLayout;
