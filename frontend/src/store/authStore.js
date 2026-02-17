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
    // Use XMLHttpRequest to avoid body stream issues with fetch
    const response = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${supabaseUrl}/auth/v1/token?grant_type=password`);
      xhr.setRequestHeader('apikey', supabaseAnonKey);
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({ status: xhr.status, ok: xhr.status >= 200 && xhr.status < 300, data });
        } catch (e) {
          reject(new Error('Failed to parse response'));
        }
      };
      
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(JSON.stringify({ email, password }));
    });
    
    if (!response.ok) {
      const errorMsg = response.data.msg || response.data.error_description || 'Login failed';
      return { 
        data: null, 
        error: { message: errorMsg.includes('Invalid login credentials') ? 'Invalid email or password' : errorMsg } 
      };
    }
    
    // Set the session manually in Supabase client
    if (response.data.access_token && response.data.refresh_token) {
      // Set the session without awaiting to avoid blocking
      supabase.auth.setSession({
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
      }).then(() => {
        console.log('Login session set successfully');
      }).catch(err => {
        console.error('Error setting login session:', err);
      });
      
      // Return with user data from the response
      return { data: { user: response.data.user, session: response.data }, error: null };
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
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
    
    try {
      // Use XMLHttpRequest to avoid body stream issues
      const response = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${supabaseUrl}/auth/v1/signup`);
        xhr.setRequestHeader('apikey', supabaseAnonKey);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({ status: xhr.status, ok: xhr.status >= 200 && xhr.status < 300, data });
          } catch (e) {
            reject(new Error('Failed to parse response'));
          }
        };
        
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(JSON.stringify({ email: email.trim().toLowerCase(), password }));
      });
      
      if (!response.ok) {
        set({ loading: false });
        const errorMsg = response.data.msg || response.data.error_description || 'Signup failed';
        return { error: { message: errorMsg } };
      }
      
      // Set the session if we got tokens back
      if (response.data.access_token && response.data.refresh_token) {
        // Set the session without awaiting to avoid blocking
        supabase.auth.setSession({
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token,
        }).then(() => {
          console.log('Session set successfully');
        }).catch(err => {
          console.error('Error setting session:', err);
        });
        
        // Return with user data from response
        set({ loading: false });
        return { error: null, data: { user: response.data.user, session: response.data } };
      }
      
      set({ loading: false });
      return { error: null, data: response.data };
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
