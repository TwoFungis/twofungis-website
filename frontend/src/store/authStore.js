import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// Prevent duplicate initialization in React StrictMode
let isInitializing = false;
let authSubscription = null;
let isUpdatingProfile = false; // Lock to prevent concurrent profile updates

// Helper to wait for session to be ready
const waitForSession = async (maxAttempts = 5, delayMs = 500) => {
  for (let i = 0; i < maxAttempts; i++) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return session;
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  return null;
};

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  
  // Access state for trial/locked mode
  accessState: 'ACTIVE', // 'ACTIVE', 'TRIAL', 'LOCKED'
  trialDaysRemaining: null,
  accessRestrictions: {
    canCreateProject: true,
    canCreateQuote: true,
    canCreateInvoice: true,
    canSend: true,
    aiRemaining: -1 // -1 = unlimited
  },
  
  // Setup progress tracking - for real-time updates
  setupProgress: {
    has_project: false,
    has_labor_rate: false,
    has_quote: false,
    has_expense: false,
    has_milestone: false,
    has_invoice: false
  },
  setupProgressLoading: false,

  // Refresh setup progress - can be called by any component after creating items
  refreshSetupProgress: async () => {
    const { user, profile } = get();
    if (!user) return;
    
    set({ setupProgressLoading: true });
    
    try {
      const [projectsRes, quotesRes, expensesRes, milestonesRes, invoicesRes] = await Promise.all([
        supabase.from('projects').select('id').eq('user_id', user.id).limit(1),
        supabase.from('quotes').select('id').eq('user_id', user.id).limit(1),
        supabase.from('expenses').select('id').eq('user_id', user.id).limit(1),
        supabase.from('project_milestones').select('id').eq('user_id', user.id).limit(1),
        supabase.from('invoices').select('id').eq('user_id', user.id).limit(1)
      ]);

      set({
        setupProgress: {
          has_project: projectsRes.data?.length > 0,
          has_labor_rate: !!profile?.labor_rate,
          has_quote: quotesRes.data?.length > 0,
          has_expense: expensesRes.data?.length > 0,
          has_milestone: milestonesRes.data?.length > 0,
          has_invoice: invoicesRes.data?.length > 0
        },
        setupProgressLoading: false
      });
    } catch (err) {
      console.error('Error refreshing setup progress:', err);
      set({ setupProgressLoading: false });
    }
  },

  // Mark a specific setup item as complete (for immediate UI update)
  markSetupComplete: (item) => {
    set((state) => ({
      setupProgress: {
        ...state.setupProgress,
        [item]: true
      }
    }));
  },

  // Compute access state from profile data
  computeAccessState: (profile) => {
    if (!profile) {
      return { state: 'LOCKED', daysRemaining: null, restrictions: {} };
    }

    const now = new Date();
    const paidTiers = ['pro', 'elite', 'lifetime', 'founding', 'founding_lifetime', 'lifetime_elite'];
    const tier = (profile.subscription_tier || '').toLowerCase().trim();
    
    // Check for paid tier FIRST
    if (paidTiers.includes(tier)) {
      return { state: 'ACTIVE', daysRemaining: null, restrictions: {} };
    }
    
    // Check for grandfathered status
    if (profile.grandfathered_active === true) {
      return { state: 'ACTIVE', daysRemaining: null, restrictions: {} };
    }
    
    // Pre-migration compatibility: if grandfathered_active column doesn't exist
    // and no trial_ends_at, treat as grandfathered (ACTIVE)
    if (profile.grandfathered_active === undefined && !profile.trial_ends_at) {
      return { state: 'ACTIVE', daysRemaining: null, restrictions: {} };
    }
    
    // Check trial status
    const trialEndsAt = profile.trial_ends_at;
    if (trialEndsAt) {
      const trialEnd = new Date(trialEndsAt);
      if (now < trialEnd) {
        const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
        return { state: 'TRIAL', daysRemaining: Math.max(0, daysRemaining), restrictions: {} };
      } else {
        // Trial expired
        return { 
          state: 'LOCKED', 
          daysRemaining: 0,
          restrictions: {
            canCreateProject: !profile.locked_project_created,
            canCreateQuote: !profile.locked_quote_created,
            canCreateInvoice: !profile.locked_invoice_created,
            canSend: false,
            aiRemaining: Math.max(0, 3 - (profile.ai_daily_usage || 0))
          }
        };
      }
    }
    
    // No trial set and not grandfathered -> LOCKED
    return { state: 'LOCKED', daysRemaining: null, restrictions: {} };
  },

  // Refresh access state from server
  refreshAccessState: async () => {
    const API_URL = process.env.REACT_APP_BACKEND_URL;
    const { user } = get();
    
    if (!user) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      
      const response = await fetch(`${API_URL}/api/profile/access-state`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        set({
          accessState: data.state || 'ACTIVE',
          trialDaysRemaining: data.trial_days_remaining,
          accessRestrictions: {
            canCreateProject: data.restrictions?.can_create_project ?? true,
            canCreateQuote: data.restrictions?.can_create_quote ?? true,
            canCreateInvoice: data.restrictions?.can_create_invoice ?? true,
            canSend: data.restrictions?.can_send ?? true,
            aiRemaining: data.restrictions?.ai_remaining ?? -1
          }
        });
      }
    } catch (err) {
      console.error('Error refreshing access state:', err);
    }
  },

  initialize: async () => {
    // Prevent duplicate initialization
    if (isInitializing || get().initialized) {
      return;
    }
    isInitializing = true;

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Session error:', error);
      }
      if (session?.user) {
        set({ user: session.user });
        await get().fetchProfile();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      set({ loading: false, initialized: true });
      isInitializing = false;
    }

    // Clean up existing subscription before creating new one
    if (authSubscription) {
      authSubscription.unsubscribe();
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          set({ user: session.user });
          // Delay profile fetch to ensure session is fully propagated
          setTimeout(() => get().fetchProfile(), 100);
        }
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, profile: null });
      } else if (session?.user) {
        set({ user: session.user });
      }
    });

    authSubscription = subscription;

    // Return cleanup function
    return () => {
      if (authSubscription) {
        authSubscription.unsubscribe();
        authSubscription = null;
      }
    };
  },

  signIn: async (email, password) => {
    set({ loading: true });
    try {
      // Use the Supabase SDK directly for login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });
      
      if (error) {
        // Handle body stream error
        if (error.message.includes('body stream')) {
          set({ loading: false });
          return { error: { message: 'Invalid email or password' } };
        }
        set({ loading: false });
        const errorMessage = error.message.includes('Invalid login credentials')
          ? 'Invalid email or password. Please check your credentials and try again.'
          : error.message;
        return { error: { message: errorMessage } };
      }
      
      if (data?.user) {
        set({ user: data.user, loading: false });
        // Fetch profile in background
        get().fetchProfile().catch(err => {
          console.error('Error fetching profile:', err);
        });
      } else {
        set({ loading: false });
      }
      
      return { error: null };
    } catch (err) {
      console.error('SignIn error:', err);
      set({ loading: false });
      // Handle body stream error in catch
      if (err.message && err.message.includes('body stream')) {
        return { error: { message: 'Invalid email or password' } };
      }
      return { error: { message: err.message || 'Login failed. Please try again.' } };
    }
  },

  signUp: async (email, password) => {
    set({ loading: true });
    
    try {
      // Use the Supabase SDK directly for signup
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password
      });
      
      if (error) {
        // Handle body stream error - still might have worked
        if (error.message.includes('body stream')) {
          console.warn('Body stream error during signup, checking if user was created...');
          // Try to sign in instead
          const signInResult = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password
          });
          if (!signInResult.error && signInResult.data?.user) {
            set({ user: signInResult.data.user, loading: false });
            return { error: null, data: signInResult.data };
          }
        }
        set({ loading: false });
        return { error };
      }
      
      if (data?.user) {
        set({ user: data.user, loading: false });
      } else {
        set({ loading: false });
      }
      
      return { error: null, data };
    } catch (err) {
      console.error('SignUp error:', err);
      // Handle body stream error in catch
      if (err.message && err.message.includes('body stream')) {
        set({ loading: false });
        return { error: { message: 'Account may have been created. Please try signing in.' } };
      }
      set({ loading: false });
      return { error: { message: err.message || 'Signup failed' } };
    }
  },

  signInWithMagicLink: async (email) => {
    set({ loading: true });
    
    // Use environment variable for redirect URL, fallback to window.location.origin
    // In production, this should be the deployed app URL
    const baseUrl = process.env.REACT_APP_BACKEND_URL 
      ? process.env.REACT_APP_BACKEND_URL.replace('/api', '').replace(':8001', '')
      : window.location.origin;
    
    // Use current origin for preview/development environments
    const isPreviewEnv = window.location.hostname.includes('preview.') || 
                         window.location.hostname === 'localhost';
    const redirectUrl = isPreviewEnv
      ? window.location.origin
      : (baseUrl || window.location.origin);
    
    console.log('Magic link redirect URL:', `${redirectUrl}/app/dashboard`);
    
    try {
      const { error } = await supabase.auth.signInWithOtp({ 
        email,
        options: {
          emailRedirectTo: `${redirectUrl}/app/dashboard`
        }
      });
      set({ loading: false });
      return { error };
    } catch (err) {
      console.error('Magic link error:', err);
      set({ loading: false });
      return { error: { message: err.message || 'Failed to send magic link' } };
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('SignOut error:', err);
    }
    set({ user: null, profile: null });
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    let profileFetchSuccess = false;
    
    try {
      const { data, error } = await supabase
        .from('users_profile')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // Ignore "body stream already read" errors during fetch
        if (!error.message?.includes('body stream')) {
          console.error('Error fetching profile:', error);
        }
      }

      if (data) {
        profileFetchSuccess = true;
        set({ profile: data });
        
        // DB is source of truth - clear any stale localStorage activation keys
        // when we have valid DB values
        if (data.business_activated !== null || data.business_activation_skipped !== null) {
          localStorage.removeItem('tradeos_activation_completed');
          localStorage.removeItem('tradeos_activation_skipped');
          localStorage.removeItem('tradeos_activation_labor_rate');
          if (process.env.NODE_ENV === 'development') {
            console.log('[Auth] Activation state hydrated from DB');
          }
        }
        
        // Compute access state from profile data
        const accessInfo = get().computeAccessState(data);
        set({
          accessState: accessInfo.state,
          trialDaysRemaining: accessInfo.daysRemaining,
          accessRestrictions: {
            canCreateProject: accessInfo.restrictions?.canCreateProject ?? true,
            canCreateQuote: accessInfo.restrictions?.canCreateQuote ?? true,
            canCreateInvoice: accessInfo.restrictions?.canCreateInvoice ?? true,
            canSend: accessInfo.restrictions?.canSend ?? true,
            aiRemaining: accessInfo.restrictions?.aiRemaining ?? -1
          }
        });
      } else {
        set({ profile: null, accessState: 'LOCKED' });
      }
    } catch (err) {
      // Ignore body stream errors
      if (!err.message?.includes('body stream')) {
        console.error('FetchProfile error:', err);
      }
      set({ profile: null });
    }
    
    // Log fallback scenario (dev only)
    if (!profileFetchSuccess && process.env.NODE_ENV === 'development') {
      const hasLocalStorage = localStorage.getItem('tradeos_activation_completed') || 
                              localStorage.getItem('tradeos_activation_skipped');
      if (hasLocalStorage) {
        console.log('[Auth] Fallback to localStorage due to fetch failure');
      }
    }
  },

  updateProfile: async (profileData) => {
    const { user, profile } = get();
    if (!user) return { error: { message: 'Not authenticated' } };

    // Prevent concurrent updates
    if (isUpdatingProfile) {
      console.log('Profile update already in progress, waiting...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (isUpdatingProfile) {
        return { error: { message: 'Please wait for the current operation to complete.' } };
      }
    }

    isUpdatingProfile = true;
    const API_URL = process.env.REACT_APP_BACKEND_URL;

    try {
      // Ensure we have a valid session first
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Try to refresh the session
        console.log('No session found, attempting refresh...');
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.warn('Session refresh failed:', refreshError);
          isUpdatingProfile = false;
          return { error: { message: 'Session expired. Please refresh the page.' } };
        }
        // Wait a moment for session to propagate
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Get fresh session for auth header
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      // Try backend API first (more reliable, uses service key)
      try {
        const response = await fetch(`${API_URL}/api/profile/update`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentSession?.access_token}`
          },
          body: JSON.stringify(profileData)
        });
        
        const data = await response.json();
        
        if (data.success) {
          console.log('Profile updated via backend API');
          if (data.profile) {
            set({ profile: data.profile });
          } else {
            await get().fetchProfile();
          }
          isUpdatingProfile = false;
          return { error: null };
        } else {
          console.warn('Backend API update failed:', data.message);
          // Fall through to try direct Supabase
        }
      } catch (apiError) {
        console.warn('Backend API error, trying direct Supabase:', apiError.message);
      }

      // Fallback: Perform direct Supabase database operation
      let dbError = null;
      
      if (profile) {
        const result = await supabase
          .from('users_profile')
          .update(profileData)
          .eq('user_id', user.id);
        dbError = result.error;
      } else {
        const result = await supabase
          .from('users_profile')
          .insert({ user_id: user.id, ...profileData });
        dbError = result.error;
      }

      // Handle body stream error specially - check if update actually succeeded
      if (dbError && (dbError.message?.includes('body stream') || dbError.details?.message?.includes('body stream') || String(dbError).includes('body stream'))) {
        console.log('Body stream error detected, checking if update succeeded...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Fetch the profile to see if update went through
        const { data: checkData, error: checkError } = await supabase
          .from('users_profile')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        console.log('Check data:', checkData, 'Error:', checkError);
        
        if (checkData) {
          // Check if the profileData fields were updated - use loose equality for numbers
          let updateSucceeded = true;
          for (const key of Object.keys(profileData)) {
            const dbValue = checkData[key];
            const expectedValue = profileData[key];
            // Handle number comparisons with tolerance
            if (typeof expectedValue === 'number' && typeof dbValue === 'number') {
              if (Math.abs(dbValue - expectedValue) > 0.001) {
                updateSucceeded = false;
                console.log(`Field ${key} mismatch: ${dbValue} vs ${expectedValue}`);
                break;
              }
            } else if (String(dbValue) !== String(expectedValue)) {
              // For non-numbers, compare as strings
              console.log(`Field ${key} mismatch: ${dbValue} vs ${expectedValue}`);
              updateSucceeded = false;
              break;
            }
          }
          
          if (updateSucceeded) {
            console.log('Update succeeded despite body stream error');
            set({ profile: checkData });
            isUpdatingProfile = false;
            return { error: null };
          }
        }
        
        // If we get here, update likely failed - return error
        isUpdatingProfile = false;
        return { error: { message: 'Connection error. Please try again.' } };
      }

      if (dbError) {
        console.error('Profile operation error:', dbError);
        isUpdatingProfile = false;
        // Handle specific error types
        if (dbError.message?.includes('JWT') || dbError.code === 'PGRST301') {
          return { error: { message: 'Session expired. Please refresh the page.' } };
        }
        return { error: { message: dbError.message || 'Failed to update profile' } };
      }

      // Refresh profile data with a small delay
      await new Promise(resolve => setTimeout(resolve, 200));
      await get().fetchProfile();
      isUpdatingProfile = false;
      return { error: null };
    } catch (err) {
      console.error('UpdateProfile error:', err);
      isUpdatingProfile = false;
      // Handle body stream error at top level too - check if update succeeded
      if (err.message?.includes('body stream') || String(err).includes('body stream')) {
        try {
          console.log('Body stream error in catch, checking if update succeeded...');
          await new Promise(resolve => setTimeout(resolve, 500));
          const { data: checkData, error: checkError } = await supabase
            .from('users_profile')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          console.log('Check data (catch):', checkData, 'Error:', checkError);
          
          if (checkData) {
            let updateSucceeded = true;
            for (const key of Object.keys(profileData)) {
              const dbValue = checkData[key];
              const expectedValue = profileData[key];
              if (typeof expectedValue === 'number' && typeof dbValue === 'number') {
                if (Math.abs(dbValue - expectedValue) > 0.001) {
                  updateSucceeded = false;
                  console.log(`Field ${key} mismatch: ${dbValue} vs ${expectedValue}`);
                  break;
                }
              } else if (String(dbValue) !== String(expectedValue)) {
                console.log(`Field ${key} mismatch: ${dbValue} vs ${expectedValue}`);
                updateSucceeded = false;
                break;
              }
            }
            
            if (updateSucceeded) {
              console.log('Update succeeded despite body stream error (catch)');
              set({ profile: checkData });
              return { error: null };
            }
          }
        } catch (checkErr) {
          console.error('Error checking profile:', checkErr);
        }
        return { error: { message: 'Connection error. Please try again.' } };
      }
      return { error: { message: err.message || 'Failed to update profile' } };
    }
  },
}));
