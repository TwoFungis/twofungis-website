import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, X } from 'lucide-react';

/**
 * PWA Update Banner
 * 
 * Displays a non-intrusive banner when a new version of TradeOS is available.
 * User can click "Refresh" to update to the new version.
 * 
 * Features:
 * - Listens for service worker update events
 * - Smooth slide-in animation
 * - Single click to update
 * - Dismissible (will show again on next navigation)
 */

const PWAUpdateBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  // Listen for service worker updates
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event) => {
      if (event.data?.type === 'SW_UPDATE_WAITING') {
        console.log('[PWA] New version waiting:', event.data.version);
        setShowBanner(true);
      }
      if (event.data?.type === 'SW_ACTIVATED') {
        console.log('[PWA] New version activated:', event.data.version);
        setShowBanner(false);
      }
    };

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', handleMessage);

    // Check for waiting service worker on mount
    navigator.serviceWorker.ready.then((registration) => {
      // If there's already a waiting worker, show the banner
      if (registration.waiting) {
        console.log('[PWA] Found waiting service worker on mount');
        setWaitingWorker(registration.waiting);
        setShowBanner(true);
      }

      // Listen for new service workers
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('[PWA] Update found, new worker installing');

        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker is waiting
            console.log('[PWA] New version installed and waiting');
            setWaitingWorker(newWorker);
            setShowBanner(true);
          }
        });
      });
    });

    // Listen for controller change (service worker activated)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      console.log('[PWA] Controller changed, reloading...');
      window.location.reload();
    });

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  // Handle refresh/update click
  const handleUpdate = useCallback(() => {
    if (!waitingWorker && !navigator.serviceWorker.controller) {
      // No waiting worker, just reload
      window.location.reload();
      return;
    }

    setIsUpdating(true);

    // Tell the waiting service worker to skip waiting
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // Try to get the waiting worker from registration
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else {
          // No waiting worker, just reload
          window.location.reload();
        }
      });
    }
  }, [waitingWorker]);

  // Dismiss banner (will show again on next navigation/update check)
  const handleDismiss = useCallback(() => {
    setShowBanner(false);
  }, []);

  if (!showBanner) return null;

  return (
    <div 
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] animate-slide-up"
      data-testid="pwa-update-banner"
    >
      <div className="flex items-center gap-3 bg-zinc-900 border border-emerald-500/30 rounded-xl px-4 py-3 shadow-lg shadow-emerald-500/10">
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        <span className="text-sm text-zinc-200">
          A new version of TradeOS is available.
        </span>
        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-600 text-black font-medium text-sm px-3 py-1.5 rounded-lg transition-colors"
          data-testid="pwa-refresh-btn"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
          {isUpdating ? 'Updating...' : 'Refresh'}
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
          data-testid="pwa-dismiss-btn"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PWAUpdateBanner;
