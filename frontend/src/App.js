import React, { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Landing Pages
import LandingPage from './pages/landing/LandingPage';
import PrivacyPage from './pages/landing/PrivacyPage';
import TermsPage from './pages/landing/TermsPage';

// Public Pages
import ClientReviewPage from './pages/public/ClientReviewPage';
import PublicContractorProfile from './pages/public/PublicContractorProfile';
import ContractorsPage from './pages/public/ContractorsPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import SignUpPage from './pages/auth/SignUpPage';
import OnboardingPage from './pages/auth/OnboardingPage';

// App Pages
import DashboardPage from './pages/app/DashboardPage';
import ProjectsPage from './pages/app/ProjectsPage';
import ProjectDetailPage from './pages/app/ProjectDetailPage';
import EstimatingPage from './pages/app/EstimatingPage';
import LaborPage from './pages/app/LaborPage';
import ChangeOrdersPage from './pages/app/ChangeOrdersPage';
import ProductionPage from './pages/app/ProductionPage';
import ReportsPage from './pages/app/ReportsPage';
import SettingsPage from './pages/app/SettingsPage';
import ProfilePage from './pages/app/ProfilePage';
import BookkeepingPage from './pages/app/BookkeepingPage';

// Layout
import AppLayout from './components/layout/AppLayout';

const ProtectedRoute = ({ children, eliteOnly = false }) => {
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

  if (eliteOnly && profile?.subscription_tier !== 'elite') {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { initialize, initialized } = useAuthStore();
  const initRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (!initRef.current && !initialized) {
      initRef.current = true;
      initialize();
    }
  }, [initialize, initialized]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/client/review/:token" element={<ClientReviewPage />} />
        <Route path="/contractor/:contractorId" element={<PublicContractorProfile />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        
        {/* App Routes */}
        <Route path="/app" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="estimating" element={<EstimatingPage />} />
          <Route path="estimating/:id" element={<EstimatingPage />} />
          <Route path="labor" element={<LaborPage />} />
          <Route path="change-orders" element={<ChangeOrdersPage />} />
          <Route path="production" element={<ProductionPage />} />
          <Route path="reports" element={
            <ProtectedRoute eliteOnly>
              <ReportsPage />
            </ProtectedRoute>
          } />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="bookkeeping" element={<BookkeepingPage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
