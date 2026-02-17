import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({ user: session.user });
        await get().fetchProfile();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      set({ loading: false, initialized: true });
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        set({ user: session.user });
        await get().fetchProfile();
      } else {
        set({ user: null, profile: null });
      }
    });
  },

  signIn: async (email, password) => {
    set({ loading: true });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    set({ loading: false });
    return { error };
  },

  signUp: async (email, password) => {
    set({ loading: true });
    const { error } = await supabase.auth.signUp({ email, password });
    set({ loading: false });
    return { error };
  },

  signInWithMagicLink: async (email) => {
    set({ loading: true });
    const { error } = await supabase.auth.signInWithOtp({ email });
    set({ loading: false });
    return { error };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    const { data, error } = await supabase
      .from('users_profile')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
    }

    set({ profile: data });
  },

  updateProfile: async (data) => {
    const { user, profile } = get();
    if (!user) return;

    if (profile) {
      const { error } = await supabase
        .from('users_profile')
        .update(data)
        .eq('user_id', user.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('users_profile')
        .insert({ user_id: user.id, ...data });
      if (error) throw error;
    }

    await get().fetchProfile();
  },
}));
