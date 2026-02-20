import React, { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import ServiceWorkerUpdateService from '../../services/ServiceWorkerUpdateService';

const UpdateBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Listen for update available event
    const handleUpdateAvailable = () => {
      setShowBanner(true);
    };

    window.addEventListener('sw-update-available', handleUpdateAvailable);

    // Check on mount if update is already available
    const status = ServiceWorkerUpdateService.getStatus();
    if (status.updateAvailable || status.waiting) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
    };
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    
    // Apply the update (skip waiting)
    const applied = ServiceWorkerUpdateService.applyUpdate();
    
    if (!applied) {
      // If no waiting worker, just reload
      window.location.reload();
    }
    // If applied, the controllerchange event will trigger reload
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Show again in 1 hour
    setTimeout(() => {
      const status = ServiceWorkerUpdateService.getStatus();
      if (status.updateAvailable) {
        setShowBanner(true);
      }
    }, 60 * 60 * 1000);
  };

  if (!showBanner) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[100] bg-steel-600 text-white py-2 px-4 flex items-center justify-center gap-3 shadow-lg"
      data-testid="update-banner"
    >
      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      <span className="text-sm font-medium">Update available</span>
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50"
        data-testid="update-refresh-btn"
      >
        {isRefreshing ? 'Refreshing...' : 'Refresh'}
      </button>
      <button
        onClick={handleDismiss}
        className="ml-2 text-white/70 hover:text-white p-1"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default UpdateBanner;
