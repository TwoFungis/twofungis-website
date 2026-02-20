/**
 * TradeOS Offline Queue Service
 * Handles offline storage and sync for expenses and other entries
 */

const QUEUE_KEY = 'tradeos_offline_queue';
const SYNC_STATUS_KEY = 'tradeos_sync_status';

// Queue item structure
// { id, type, data, createdAt, status: 'pending' | 'syncing' | 'synced' | 'failed' }

export const OfflineQueueService = {
  // Get all items in the queue
  getQueue: () => {
    try {
      const queue = localStorage.getItem(QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (e) {
      console.error('Error reading queue:', e);
      return [];
    }
  },

  // Add item to queue
  addToQueue: (type, data) => {
    try {
      const queue = OfflineQueueService.getQueue();
      const item = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
      queue.push(item);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      OfflineQueueService.updateSyncStatus('pending');
      return item;
    } catch (e) {
      console.error('Error adding to queue:', e);
      return null;
    }
  },

  // Update item status
  updateItemStatus: (id, status, error = null) => {
    try {
      const queue = OfflineQueueService.getQueue();
      const index = queue.findIndex(item => item.id === id);
      if (index !== -1) {
        queue[index].status = status;
        if (error) queue[index].error = error;
        if (status === 'synced') queue[index].syncedAt = new Date().toISOString();
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      }
    } catch (e) {
      console.error('Error updating item status:', e);
    }
  },

  // Remove synced items (cleanup)
  removeSyncedItems: () => {
    try {
      const queue = OfflineQueueService.getQueue();
      const filtered = queue.filter(item => item.status !== 'synced');
      localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error('Error removing synced items:', e);
    }
  },

  // Get pending count
  getPendingCount: () => {
    const queue = OfflineQueueService.getQueue();
    return queue.filter(item => item.status === 'pending' || item.status === 'failed').length;
  },

  // Get sync status
  getSyncStatus: () => {
    try {
      const status = localStorage.getItem(SYNC_STATUS_KEY);
      return status ? JSON.parse(status) : { status: 'idle', lastSync: null };
    } catch (e) {
      return { status: 'idle', lastSync: null };
    }
  },

  // Update sync status
  updateSyncStatus: (status, lastSync = null) => {
    try {
      const current = OfflineQueueService.getSyncStatus();
      localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify({
        status,
        lastSync: lastSync || current.lastSync,
        updatedAt: new Date().toISOString()
      }));
      // Dispatch custom event for components to listen
      window.dispatchEvent(new CustomEvent('tradeos-sync-status', { detail: { status, lastSync } }));
    } catch (e) {
      console.error('Error updating sync status:', e);
    }
  },

  // Check if online
  isOnline: () => navigator.onLine,

  // Sync all pending items
  syncAll: async (getAuthHeaders, apiUrl) => {
    if (!OfflineQueueService.isOnline()) {
      console.log('Offline - cannot sync');
      return { success: false, reason: 'offline' };
    }

    const queue = OfflineQueueService.getQueue();
    const pending = queue.filter(item => item.status === 'pending' || item.status === 'failed');
    
    if (pending.length === 0) {
      OfflineQueueService.updateSyncStatus('synced', new Date().toISOString());
      return { success: true, synced: 0 };
    }

    OfflineQueueService.updateSyncStatus('syncing');
    let syncedCount = 0;
    let failedCount = 0;

    for (const item of pending) {
      try {
        OfflineQueueService.updateItemStatus(item.id, 'syncing');
        
        const headers = await getAuthHeaders();
        let endpoint = '';
        
        switch (item.type) {
          case 'expense':
            endpoint = `${apiUrl}/api/expenses`;
            break;
          case 'invoice':
            endpoint = `${apiUrl}/api/invoices`;
            break;
          default:
            endpoint = `${apiUrl}/api/${item.type}s`;
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(item.data)
        });

        if (response.ok) {
          OfflineQueueService.updateItemStatus(item.id, 'synced');
          syncedCount++;
        } else {
          const error = await response.text();
          OfflineQueueService.updateItemStatus(item.id, 'failed', error);
          failedCount++;
        }
      } catch (e) {
        console.error(`Error syncing item ${item.id}:`, e);
        OfflineQueueService.updateItemStatus(item.id, 'failed', e.message);
        failedCount++;
      }
    }

    // Cleanup synced items after a delay
    setTimeout(() => OfflineQueueService.removeSyncedItems(), 5000);

    const finalStatus = failedCount > 0 ? 'partial' : 'synced';
    OfflineQueueService.updateSyncStatus(finalStatus, new Date().toISOString());

    return { success: failedCount === 0, synced: syncedCount, failed: failedCount };
  }
};

// Auto-sync when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Connection restored - triggering sync');
    window.dispatchEvent(new CustomEvent('tradeos-connection-restored'));
  });

  window.addEventListener('offline', () => {
    console.log('Connection lost');
    OfflineQueueService.updateSyncStatus('offline');
  });
}

export default OfflineQueueService;
