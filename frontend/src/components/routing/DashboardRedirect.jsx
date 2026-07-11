import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const API_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * DashboardRedirect - Centralized post-login routing component
 * 
 * This component is the SINGLE location for determining which dashboard
 * a user should see after authentication.
 * 
 * Routing Logic:
 * - TFCS Users (has_role: true) → /app/mainframe
 * - Standard Users → /app/dashboard
 * 
 * This component uses the existing /api/tfcs/role/me endpoint to determine
 * user access. No hardcoded emails or duplicate logic.
 */
const DashboardRedirect = () => {
  const [loading, setLoading] = useState(true);
  const [destination, setDestination] = useState('/app/dashboard');

  useEffect(() => {
    const determineDestination = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
          // No session - will be caught by ProtectedRoute
          setLoading(false);
          return;
        }

        // Check TFCS role using existing API
        const response = await fetch(`${API_URL}/api/tfcs/role/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const roleData = await response.json();
          
          // TFCS users with active role go to Mainframe
          if (roleData.has_role) {
            setDestination('/app/mainframe');
          }
          // Standard users go to Dashboard (default)
        }
      } catch (error) {
        // On error, default to standard dashboard
        console.error('[DashboardRedirect] Role check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    determineDestination();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-steel-500"></div>
          <p className="text-gray-400 text-sm">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return <Navigate to={destination} replace />;
};

export default DashboardRedirect;
