import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { ChevronDown, Building2, Settings, Plus, Check } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * WorkspaceSwitcher - Phase 1A Component
 * 
 * Allows users to switch between organizations they belong to.
 * Designed per TradeOS Constitution Article VI.
 * 
 * Features:
 * - Lists all user's organizations
 * - Shows current workspace
 * - Allows switching (triggers page reload to new context)
 * - Remembers last active workspace
 */
const WorkspaceSwitcher = ({ onSwitch, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrganizations = useCallback(async () => {
    try {
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

      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
        
        // Set current org from localStorage or primary
        const savedOrgId = localStorage.getItem('tradeos_current_org');
        const primaryOrgId = data.primary_organization_id;
        
        const orgs = data.organizations || [];
        const current = orgs.find(o => o.id === savedOrgId) 
                      || orgs.find(o => o.id === primaryOrgId)
                      || orgs[0];
        
        if (current) {
          setCurrentOrg(current);
          localStorage.setItem('tradeos_current_org', current.id);
        }
      }
    } catch (error) {
      console.error('[WorkspaceSwitcher] Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const handleSwitch = async (org) => {
    if (org.id === currentOrg?.id) {
      setIsOpen(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Update primary organization on server
      await fetch(`${API_URL}/api/organizations/me/primary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ organization_id: org.id })
      });

      // Update local state
      localStorage.setItem('tradeos_current_org', org.id);
      setCurrentOrg(org);
      setIsOpen(false);

      // Notify parent component
      if (onSwitch) {
        onSwitch(org);
      }

      // Reload to apply new context
      // In future, this could be a soft switch without reload
      window.location.reload();
    } catch (error) {
      console.error('[WorkspaceSwitcher] Error switching workspace:', error);
    }
  };

  // Don't render if only one org (or none)
  if (loading || organizations.length <= 1) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 transition-colors border border-charcoal-700"
      >
        {currentOrg?.logo_url ? (
          <img 
            src={currentOrg.logo_url} 
            alt="" 
            className="w-5 h-5 rounded object-cover"
          />
        ) : (
          <Building2 className="w-5 h-5 text-gray-400" />
        )}
        <span className="text-sm text-white max-w-[120px] truncate">
          {currentOrg?.name || 'Select Workspace'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute top-full left-0 mt-2 w-72 bg-charcoal-800 border border-charcoal-700 rounded-xl shadow-xl z-50 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-charcoal-700">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Your Workspaces</p>
            </div>

            {/* Organizations List */}
            <div className="max-h-64 overflow-y-auto py-2">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleSwitch(org)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-charcoal-700 transition-colors ${
                    org.id === currentOrg?.id ? 'bg-charcoal-700/50' : ''
                  }`}
                >
                  {/* Logo/Icon */}
                  <div className="w-10 h-10 rounded-lg bg-charcoal-600 flex items-center justify-center flex-shrink-0">
                    {org.logo_url ? (
                      <img src={org.logo_url} alt="" className="w-8 h-8 rounded object-cover" />
                    ) : org.is_platform ? (
                      <Settings className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Building2 className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {org.name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {org.is_platform ? 'Platform Administration' : org.role}
                    </p>
                  </div>

                  {/* Current Indicator */}
                  {org.id === currentOrg?.id && (
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Footer - Future: Create Organization */}
            {/* 
            <div className="border-t border-charcoal-700 p-2">
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-charcoal-700 text-gray-400 text-sm">
                <Plus className="w-4 h-4" />
                Create New Organization
              </button>
            </div>
            */}
          </div>
        </>
      )}
    </div>
  );
};

export default WorkspaceSwitcher;
