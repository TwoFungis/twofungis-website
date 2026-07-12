import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * GoogleAuthCallback - Handles the return from Emergent Google OAuth
 * 
 * Flow:
 * 1. User returns from auth.emergentagent.com with #session_id=xxx in URL
 * 2. This component extracts the session_id
 * 3. Sends it to backend to exchange for user data + session token
 * 4. Backend sets httpOnly session cookie
 * 5. Redirects user to Command Center
 * 
 * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
 */
const GoogleAuthCallback = () => {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processCallback = async () => {
      try {
        // Extract session_id from URL fragment (hash)
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.replace('#', ''));
        const sessionId = params.get('session_id');

        if (!sessionId) {
          console.error('[GoogleAuth] No session_id found in URL');
          navigate('/login', { state: { error: 'Authentication failed. Please try again.' } });
          return;
        }

        // Exchange session_id for user data via backend
        const response = await fetch(`${API_URL}/api/auth/google/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Important for receiving cookies
          body: JSON.stringify({ session_id: sessionId }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || 'Authentication failed');
        }

        const userData = await response.json();
        console.log('[GoogleAuth] Successfully authenticated:', userData.email);

        // Clear the hash from URL and redirect to Command Center
        window.history.replaceState(null, '', window.location.pathname);
        
        // Navigate to Command Center with user data
        navigate('/app/command-center', { 
          replace: true,
          state: { user: userData }
        });

      } catch (error) {
        console.error('[GoogleAuth] Callback error:', error);
        navigate('/login', { 
          replace: true,
          state: { error: error.message || 'Authentication failed. Please try again.' } 
        });
      }
    };

    processCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-gray-400 text-sm">Completing sign in...</p>
      </div>
    </div>
  );
};

export default GoogleAuthCallback;
