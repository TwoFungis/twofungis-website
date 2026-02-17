import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// Prevent duplicate initialization in React StrictMode
let isInitializing = false;
let authSubscription = null;

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
    const redirectUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
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

    try {
      const { data, error } = await supabase
        .from('users_profile')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }

      set({ profile: data || null });
    } catch (err) {
      console.error('FetchProfile error:', err);
      set({ profile: null });
    }
  },

  updateProfile: async (profileData) => {
    const { user, profile } = get();
    if (!user) return { error: { message: 'Not authenticated' } };

    // Helper function to perform the actual database operation
    const performUpdate = async () => {
      if (profile) {
        const { error } = await supabase
          .from('users_profile')
          .update(profileData)
          .eq('user_id', user.id);
        return error;
      } else {
        const { error } = await supabase
          .from('users_profile')
          .insert({ user_id: user.id, ...profileData });
        return error;
      }
    };

    try {
      // Ensure we have a valid session first
      let session = await waitForSession(3, 300);
      
      if (!session) {
        // Try to refresh the session
        console.log('No session found, attempting refresh...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.warn('Session refresh failed:', refreshError);
        } else if (refreshData?.session) {
          session = refreshData.session;
        }
      }

      // First attempt
      let dbError = await performUpdate();
      
      // If auth error, try refreshing session and retry once
      if (dbError && (dbError.message?.includes('JWT') || dbError.code === 'PGRST301')) {
        console.log('Auth error detected, refreshing session and retrying...');
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError) {
          dbError = await performUpdate();
        }
      }

      if (dbError) {
        console.error('Profile operation error:', dbError);
        throw dbError;
      }

      await get().fetchProfile();
      return { error: null };
    } catch (err) {
      console.error('UpdateProfile error:', err);
      // Return user-friendly error message
      const message = err.message?.includes('not authenticated') || err.message?.includes('JWT')
        ? 'Session expired. Please try again or refresh the page.'
        : err.message || 'Failed to update profile';
      return { error: { message } };
    }
  },
}));
