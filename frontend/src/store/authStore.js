import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// Prevent duplicate initialization in React StrictMode
let isInitializing = false;
let authSubscription = null;

// Custom sign-in function that bypasses SDK body stream issues
const customSignIn = async (email, password) => {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { 
        data: null, 
        error: { message: data.msg || data.error_description || 'Login failed' } 
      };
    }
    
    // Set the session manually in Supabase client
    if (data.access_token && data.refresh_token) {
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      
      // Get the user from the session
      const { data: sessionData } = await supabase.auth.getSession();
      return { data: { user: sessionData.session?.user, session: sessionData.session }, error: null };
    }
    
    return { data: null, error: { message: 'Failed to establish session' } };
  } catch (err) {
    console.error('Custom signIn error:', err);
    return { data: null, error: { message: err.message || 'Login failed' } };
  }
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
        set({ user: data.user });
        await get().fetchProfile();
      }
      
      set({ loading: false });
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
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/app/dashboard`
        }
      });
      
      set({ loading: false });
      
      if (error) {
        return { error };
      }
      
      return { error: null, data };
    } catch (err) {
      console.error('SignUp error:', err);
      set({ loading: false });
      return { error: { message: err.message || 'Signup failed' } };
    }
  },

  signInWithMagicLink: async (email) => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signInWithOtp({ 
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/app/dashboard`
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
      if (profile) {
        const { error } = await supabase
          .from('users_profile')
          .update(profileData)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('users_profile')
          .insert({ user_id: user.id, ...profileData });
        if (error) throw error;
      }

      await get().fetchProfile();
      return { error: null };
    } catch (err) {
      console.error('UpdateProfile error:', err);
      return { error: { message: err.message || 'Failed to update profile' } };
    }
  },
}));
