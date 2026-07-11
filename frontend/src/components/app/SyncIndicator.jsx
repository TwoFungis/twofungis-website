import React, { useState, useEffect, useCallback } from 'react';
import { Cloud, CloudOff, RefreshCw, Check, AlertCircle } from 'lucide-react';
import OfflineQueueService from '../../services/OfflineQueueService';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SyncIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState(OfflineQueueService.getSyncStatus());
  const [pendingCount, setPendingCount] = useState(OfflineQueueService.getPendingCount());
  const [isSyncing, setIsSyncing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    };
  }, []);

  const triggerSync = useCallback(async () => {
    if (isSyncing) return;
    
    const pending = OfflineQueueService.getPendingCount();
    if (pending === 0) return;

    setIsSyncing(true);
    try {
      const result = await OfflineQueueService.syncAll(getAuthHeaders, API_URL);
      
      if (result.success) {
        if (result.synced > 0) {
          toast.success(`Synced ${result.synced} item${result.synced > 1 ? 's' : ''}`);
        }
      } else if (result.reason !== 'offline') {
        toast.error(`Sync failed for ${result.failed} item${result.failed > 1 ? 's' : ''}`);
      }
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setIsSyncing(false);
      setPendingCount(OfflineQueueService.getPendingCount());
      setSyncStatus(OfflineQueueService.getSyncStatus());
    }
  }, [isSyncing, getAuthHeaders]);

  useEffect(() => {
    // Listen for online/offline
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => setIsOnline(false);
    
    // Listen for sync status changes
    const handleSyncStatus = (e) => {
      setSyncStatus(e.detail);
      setPendingCount(OfflineQueueService.getPendingCount());
    };

    // Listen for connection restored
    const handleConnectionRestored = () => {
      triggerSync();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('tradeos-sync-status', handleSyncStatus);
    window.addEventListener('tradeos-connection-restored', handleConnectionRestored);

    // Check pending count periodically
    const interval = setInterval(() => {
      setPendingCount(OfflineQueueService.getPendingCount());
      setSyncStatus(OfflineQueueService.getSyncStatus());
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('tradeos-sync-status', handleSyncStatus);
      window.removeEventListener('tradeos-connection-restored', handleConnectionRestored);
      clearInterval(interval);
    };
  }, [triggerSync]);

  // Don't show if everything is synced and online
  const showIndicator = !isOnline || pendingCount > 0 || syncStatus.status === 'synced';

  if (!showIndicator && isOnline && pendingCount === 0) {
    return null;
  }

  const getStatusColor = () => {
    if (!isOnline) return 'text-warning';
    if (isSyncing) return 'text-steel-400';
    if (pendingCount > 0) return 'text-warning';
    if (syncStatus.status === 'synced') return 'text-success';
    if (syncStatus.status === 'partial') return 'text-warning';
    return 'text-gray-400';
  };

  const getStatusIcon = () => {
    if (!isOnline) return CloudOff;
    if (isSyncing) return RefreshCw;
    if (pendingCount > 0) return AlertCircle;
    if (syncStatus.status === 'synced') return Check;
    return Cloud;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isSyncing) return 'Syncing...';
    if (pendingCount > 0) return `${pendingCount} pending`;
    if (syncStatus.status === 'synced') return 'Synced';
    return 'Connected';
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className="relative" data-testid="sync-indicator">
      <button
        onClick={triggerSync}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        disabled={!isOnline || isSyncing}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-charcoal-700/50 transition-colors ${getStatusColor()}`}
        aria-label={getStatusText()}
      >
        <StatusIcon className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
        {pendingCount > 0 && (
          <span className="text-xs font-medium">{pendingCount}</span>
        )}
        {syncStatus.status === 'synced' && pendingCount === 0 && (
          <span className="text-xs font-medium">Synced</span>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-charcoal-700 rounded-lg shadow-lg text-xs whitespace-nowrap z-50">
          <p className="text-white font-medium">{getStatusText()}</p>
          {syncStatus.lastSync && (
            <p className="text-gray-400 mt-1">
              Last sync: {new Date(syncStatus.lastSync).toLocaleTimeString()}
            </p>
          )}
          {pendingCount > 0 && isOnline && (
            <p className="text-steel-400 mt-1">Click to sync now</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SyncIndicator;
