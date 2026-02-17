import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'tradeos-auth-token',
    storage: window.localStorage
  }
});

// Helper to manually set session tokens in localStorage
export const setSessionTokens = (accessToken, refreshToken, user) => {
  // Supabase uses this key format
  const projectRef = supabaseUrl.split('//')[1].split('.')[0];
  const storageKey = `sb-${projectRef}-auth-token`;
  
  const sessionData = {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: user
  };
  
  localStorage.setItem(storageKey, JSON.stringify(sessionData));
  console.log('Session tokens stored in localStorage with key:', storageKey);
};
