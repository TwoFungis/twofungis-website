import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';

const API_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Organization Context - Phase 1A
 * 
 * Provides organization context throughout the application.
 * This is the foundation for multi-tenant data scoping.
 * 
 * Usage:
 *   const { currentOrg, organizations, switchOrg, loading } = useOrganization();
 */

const OrganizationContext = createContext(null);

export const OrganizationProvider = ({ children }) => {
  const [organizations, setOrganizations] = useState([]);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/organizations/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Handle gracefully if tables don't exist yet
        if (response.status === 404) {
          console.log('[useOrganization] Organization tables not yet initialized');
          setLoading(false);
          return;
        }
        throw new Error('Failed to fetch organizations');
      }

      const data = await response.json();
      const orgs = data.organizations || [];
      setOrganizations(orgs);

      // Determine current organization
      const savedOrgId = localStorage.getItem('tradeos_current_org');
      const primaryOrgId = data.primary_organization_id;

      const current = orgs.find(o => o.id === savedOrgId)
                    || orgs.find(o => o.id === primaryOrgId)
                    || orgs.find(o => !o.is_platform)  // Prefer non-platform
                    || orgs[0];

      if (current) {
        setCurrentOrg(current);
        setCurrentRole(current.role);
        localStorage.setItem('tradeos_current_org', current.id);
      }
    } catch (err) {
      console.error('[useOrganization] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizations();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        fetchOrganizations();
      } else if (event === 'SIGNED_OUT') {
        setOrganizations([]);
        setCurrentOrg(null);
        setCurrentRole(null);
        localStorage.removeItem('tradeos_current_org');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchOrganizations]);

  const switchOrg = useCallback(async (orgId) => {
    const org = organizations.find(o => o.id === orgId);
    if (!org) return false;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Update server
      await fetch(`${API_URL}/api/organizations/me/primary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ organization_id: orgId })
      });

      // Update local state
      setCurrentOrg(org);
      setCurrentRole(org.role);
      localStorage.setItem('tradeos_current_org', orgId);

      return true;
    } catch (err) {
      console.error('[useOrganization] Switch error:', err);
      return false;
    }
  }, [organizations]);

  const refreshOrganizations = useCallback(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Utility checks
  const isPlatformAdmin = currentOrg?.is_platform && currentRole === 'platform_admin';
  const isOwner = currentRole === 'owner';
  const isAdmin = currentRole === 'admin' || currentRole === 'owner';
  const hasMultipleOrgs = organizations.length > 1;

  const value = {
    // State
    organizations,
    currentOrg,
    currentRole,
    loading,
    error,
    
    // Actions
    switchOrg,
    refreshOrganizations,
    
    // Utilities
    isPlatformAdmin,
    isOwner,
    isAdmin,
    hasMultipleOrgs,
    
    // Current org ID for API calls
    organizationId: currentOrg?.id
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    // Return a default object if used outside provider (backward compatibility)
    return {
      organizations: [],
      currentOrg: null,
      currentRole: null,
      loading: false,
      error: null,
      switchOrg: () => Promise.resolve(false),
      refreshOrganizations: () => {},
      isPlatformAdmin: false,
      isOwner: false,
      isAdmin: false,
      hasMultipleOrgs: false,
      organizationId: null
    };
  }
  return context;
};

export default useOrganization;
