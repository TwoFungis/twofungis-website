import React, { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { OrganizationProvider } from './hooks/useOrganization';

// Landing Pages
import LandingPage from './pages/landing/LandingPage';
import PrivacyPage from './pages/landing/PrivacyPage';
import TermsPage from './pages/landing/TermsPage';

// Public Pages
import ClientReviewPage from './pages/public/ClientReviewPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import SignUpPage from './pages/auth/SignUpPage';
import OnboardingPage from './pages/auth/OnboardingPage';
import ActivateBusinessFlow from './pages/auth/ActivateBusinessFlow';
import GoogleAuthCallback from './pages/auth/GoogleAuthCallback';

// App Pages
import DashboardPage from './pages/app/DashboardPage';
import DashboardRedirect from './components/routing/DashboardRedirect';
import ProjectsPage from './pages/app/ProjectsPage';
import ProjectDetailPage from './pages/app/ProjectDetailPage';
import EstimatingPage from './pages/app/EstimatingPage';
import ChangeOrdersPage from './pages/app/ChangeOrdersPage';
import ReportsPage from './pages/app/ReportsPage';
import SettingsPage from './pages/app/SettingsPage';
import ProfilePage from './pages/app/ProfilePage';
import MilestonesPage from './pages/app/MilestonesPage';
import InvoicesPage from './pages/app/InvoicesPage';
import ExpensesPage from './pages/app/ExpensesPage';
import DocumentsPage from './pages/app/DocumentsPage';
import TaxSummaryPage from './pages/app/TaxSummaryPage';
import IntegrationsPage from './pages/app/IntegrationsPage';
import ReceivablesPage from './pages/app/ReceivablesPage';
import MainframePage from './pages/app/MainframePage';
import CommandCenterPage from './pages/app/CommandCenterPage';

// Opportunities (Vertical Slice 1)
import OpportunitiesPage from './pages/app/opportunities/OpportunitiesPage';
import OpportunityWorkspace from './pages/app/opportunities/OpportunityWorkspaceV2';

// Layout
import AppLayout from './components/layout/AppLayout';

const ProtectedRoute = ({ children }) => {
  const { user, profile, loading, initialized } = useAuthStore();

  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-charcoal-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-steel-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user && profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  // Check activation status - DB is source of truth, localStorage is fallback only
  // Founders and Elite users are considered pre-activated
  const tierLower = (profile?.subscription_tier || '').toLowerCase();
  const isFounderOrElite = tierLower.includes('lifetime') || 
                           tierLower.includes('founding') ||
                           tierLower === 'elite';
  
  // DB values take precedence when available (not null/undefined)
  const dbActivated = profile?.business_activated;
  const dbSkipped = profile?.business_activation_skipped;
  
  // Only use localStorage as fallback when DB values are null/undefined
  const localActivated = localStorage.getItem('tradeos_activation_completed') === 'true';
  const localSkipped = localStorage.getItem('tradeos_activation_skipped') === 'true';
  
  // Final activation state: DB wins when available, otherwise fallback to localStorage
  const isActivated = isFounderOrElite || 
                      (dbActivated !== null && dbActivated !== undefined ? dbActivated : localActivated);
  const isSkipped = dbSkipped !== null && dbSkipped !== undefined ? dbSkipped : localSkipped;
  
  // Redirect to activation flow if not completed and not skipped
  if (user && profile && profile.onboarding_completed && !isActivated && !isSkipped) {
    return <Navigate to="/activate" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { initialize, initialized } = useAuthStore();
  const initRef = useRef(false);

  useEffect(() => {
    if (!initRef.current && !initialized) {
      initRef.current = true;
      initialize();
    }
  }, [initialize, initialized]);

  return (
    <OrganizationProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/client/review/:token" element={<ClientReviewPage />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/activate" element={<ActivateBusinessFlow />} />
          <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
          
          {/* App Routes - Core Business Functions */}
          <Route path="/app" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardRedirect />} />
            <Route path="dashboard" element={<DashboardPage />} />
            
            {/* Opportunities - Vertical Slice 1 */}
            <Route path="opportunities" element={<OpportunitiesPage />} />
            <Route path="opportunities/:id" element={<OpportunityWorkspace />} />
            
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />
            <Route path="estimating" element={<EstimatingPage />} />
            <Route path="estimating/:id" element={<EstimatingPage />} />
            <Route path="change-orders" element={<ChangeOrdersPage />} />
            <Route path="milestones" element={<MilestonesPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="receivables" element={<ReceivablesPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="tax-summary" element={<TaxSummaryPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="integrations" element={<IntegrationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="mainframe" element={<MainframePage />} />
            <Route path="command-center" element={<CommandCenterPage />} />
          </Route>

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </OrganizationProvider>
  );
}

export default App;
