/**
 * Brain Context Hook
 * ==================
 * Tracks the current page context for Company Brain.
 * 
 * When the Brain is opened, it automatically understands
 * the current context (Project, Opportunity, Client, etc.)
 * and uses it to answer questions or perform actions.
 */

import { create } from 'zustand';

// Context type definitions
export const BRAIN_CONTEXTS = {
  GENERAL: 'general',
  PROJECT: 'project',
  OPPORTUNITY: 'opportunity',
  ESTIMATE: 'estimate',
  FINANCIAL: 'financial',
  CRM: 'crm',
  PRODUCTION: 'production',
  DOCUMENTS: 'documents',
  REPORTS: 'reports',
  SETTINGS: 'settings',
};

/**
 * Brain Context Store
 * 
 * Usage in components:
 * 
 * // Set context when viewing a record
 * const { setContext } = useBrainContext();
 * setContext({
 *   type: BRAIN_CONTEXTS.PROJECT,
 *   id: project.id,
 *   name: project.name,
 *   data: { status: project.status, client: project.client }
 * });
 * 
 * // Clear context when leaving
 * const { clearContext } = useBrainContext();
 * clearContext();
 * 
 * // Get current context
 * const { context } = useBrainContext();
 */
export const useBrainContext = create((set) => ({
  // Current page context
  context: {
    type: BRAIN_CONTEXTS.GENERAL,
    id: null,
    name: null,
    data: null,
    path: null,
  },
  
  // Set context when navigating to a record
  setContext: (newContext) => set((state) => ({
    context: {
      ...state.context,
      type: newContext.type || BRAIN_CONTEXTS.GENERAL,
      id: newContext.id || null,
      name: newContext.name || null,
      data: newContext.data || null,
      path: newContext.path || window.location.pathname,
    }
  })),
  
  // Clear context (back to general)
  clearContext: () => set({
    context: {
      type: BRAIN_CONTEXTS.GENERAL,
      id: null,
      name: null,
      data: null,
      path: null,
    }
  }),
  
  // Update context data without changing type
  updateContextData: (data) => set((state) => ({
    context: {
      ...state.context,
      data: { ...state.context.data, ...data }
    }
  })),
}));

/**
 * Helper to determine context type from URL path
 */
export const getContextFromPath = (path) => {
  if (!path) return { type: BRAIN_CONTEXTS.GENERAL };
  
  const pathLower = path.toLowerCase();
  
  if (pathLower.includes('/projects')) {
    return { type: BRAIN_CONTEXTS.PROJECT };
  }
  if (pathLower.includes('/opportunities') || pathLower.includes('/tenders')) {
    return { type: BRAIN_CONTEXTS.OPPORTUNITY };
  }
  if (pathLower.includes('/estimat')) {
    return { type: BRAIN_CONTEXTS.ESTIMATE };
  }
  if (pathLower.includes('/invoices') || pathLower.includes('/financial') || pathLower.includes('/receivables')) {
    return { type: BRAIN_CONTEXTS.FINANCIAL };
  }
  if (pathLower.includes('/crm') || pathLower.includes('/clients') || pathLower.includes('/contacts')) {
    return { type: BRAIN_CONTEXTS.CRM };
  }
  if (pathLower.includes('/production')) {
    return { type: BRAIN_CONTEXTS.PRODUCTION };
  }
  if (pathLower.includes('/documents')) {
    return { type: BRAIN_CONTEXTS.DOCUMENTS };
  }
  if (pathLower.includes('/reports')) {
    return { type: BRAIN_CONTEXTS.REPORTS };
  }
  if (pathLower.includes('/settings')) {
    return { type: BRAIN_CONTEXTS.SETTINGS };
  }
  
  return { type: BRAIN_CONTEXTS.GENERAL };
};

export default useBrainContext;
