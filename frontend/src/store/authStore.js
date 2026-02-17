import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  initialize: async () => {
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

    // Return cleanup function
    return () => {
      subscription?.unsubscribe();
    };
  },

  signIn: async (email, password) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        set({ loading: false });
        return { error };
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
      return { error: { message: err.message || 'Login failed' } };
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
