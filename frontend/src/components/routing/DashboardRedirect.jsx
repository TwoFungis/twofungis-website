import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const API_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * DashboardRedirect - TradeOS Operating System Entry Point
 * 
 * This component is the SINGLE location for determining which workspace
 * a user should see after authentication.
 * 
 * Routing Logic (New Architecture):
 * - User with organization membership → /app/command-center (Organization Workspace)
 * - Platform admin → /app/command-center
 * - User without organization → /app/dashboard (onboarding/setup)
 * 
 * This component uses the new /api/workspace/context endpoint which:
 * - Checks organization_members table first
 * - Falls back to platform_admins
 * - Falls back to legacy tfcs_user_roles (for migration period)
 * 
 * NO MORE tfcs_user_roles checks directly - all routing through workspace context.
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

        // Use new workspace context API
        const response = await fetch(`${API_URL}/api/workspace/context`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const context = await response.json();
          
          // Use the redirect_to from the API response
          if (context.redirect_to) {
            setDestination(context.redirect_to);
          } else if (context.has_organization || context.is_platform_admin) {
            // Fallback: Users with access go to command center
            setDestination('/app/command-center');
          }
          // Otherwise, default to dashboard (set initially)
        } else {
          // API error - fall back to dashboard
          console.error('[DashboardRedirect] Workspace context failed:', response.status);
        }
      } catch (error) {
        // On error, default to standard dashboard
        console.error('[DashboardRedirect] Error:', error);
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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          <p className="text-gray-400 text-sm">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return <Navigate to={destination} replace />;
};

export default DashboardRedirect;
