import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// Prevent duplicate initialization in React StrictMode
let isInitializing = false;
let authSubscription = null;

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
      if (session?.user) {
        set({ user: session.user });
        await get().fetchProfile();
      } else {
        set({ user: null, profile: null });
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
      // Use custom sign-in to avoid body stream issues
      const { data, error } = await customSignIn(email.trim().toLowerCase(), password);
      
      if (error) {
        set({ loading: false });
        // Map error messages to user-friendly versions
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
    } catch (err) {
      console.error('SignUp error:', err);
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

    try {
      // Try to get session, but don't fail if it's not available
      // The RLS will verify the token anyway
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session) {
        // Try to refresh the session
        console.log('No session found, attempting refresh...');
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.warn('Session refresh failed:', refreshError);
          // Continue anyway - the stored token might still work
        }
      }

      if (profile) {
        const { error } = await supabase
          .from('users_profile')
          .update(profileData)
          .eq('user_id', user.id);
        if (error) {
          console.error('Profile update error:', error);
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('users_profile')
          .insert({ user_id: user.id, ...profileData });
        if (error) {
          console.error('Profile insert error:', error);
          throw error;
        }
      }

      await get().fetchProfile();
      return { error: null };
    } catch (err) {
      console.error('UpdateProfile error:', err);
      return { error: { message: err.message || 'Failed to update profile' } };
    }
  },
}));
