import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Realtime Hook for Production Library
 * 
 * Subscribes to changes on production_items table and provides
 * callbacks for INSERT, UPDATE, DELETE events.
 * 
 * Features:
 * - Incremental state updates (no full refetch)
 * - Automatic reconnection on disconnect
 * - Proper cleanup on unmount
 * - Ignores changes from the current user (optimistic updates handle those)
 */

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Create a single Supabase client for realtime
let supabaseClient = null;

const getSupabaseClient = () => {
  if (!supabaseClient && SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
  }
  return supabaseClient;
};

export const useProductionLibraryRealtime = ({
  organizationId,
  currentUserId,
  onInsert,
  onUpdate,
  onDelete,
  enabled = true
}) => {
  const channelRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Handle incoming realtime events
  const handleRealtimeEvent = useCallback((payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    // Skip if no organization filter match (shouldn't happen with RLS, but extra safety)
    const record = newRecord || oldRecord;
    if (record && record.organization_id !== organizationId) {
      return;
    }

    // Skip events triggered by the current user (optimistic updates handle those)
    // Note: Supabase doesn't provide user_id in realtime by default,
    // so we rely on the updated_by field if available
    if (record && record.updated_by === currentUserId) {
      return;
    }

    switch (eventType) {
      case 'INSERT':
        if (onInsert && newRecord) {
          console.log('[Realtime] Production item inserted by another user:', newRecord.id);
          onInsert(newRecord);
        }
        break;
      case 'UPDATE':
        if (onUpdate && newRecord) {
          console.log('[Realtime] Production item updated by another user:', newRecord.id);
          onUpdate(newRecord);
        }
        break;
      case 'DELETE':
        if (onDelete && oldRecord) {
          console.log('[Realtime] Production item deleted by another user:', oldRecord.id);
          onDelete(oldRecord);
        }
        break;
      default:
        break;
    }
  }, [organizationId, currentUserId, onInsert, onUpdate, onDelete]);

  // Subscribe to realtime changes
  const subscribe = useCallback(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !organizationId || !enabled) {
      return;
    }

    // Clean up existing subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Create a new channel for production_items
    const channel = supabase
      .channel(`production_items_${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events: INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'production_items',
          filter: `organization_id=eq.${organizationId}`
        },
        handleRealtimeEvent
      )
      .subscribe((status) => {
        console.log('[Realtime] Production Library subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Successfully subscribed to Production Library changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] Channel error, will attempt reconnect');
          // Supabase handles reconnection automatically, but we can add a timeout fallback
          reconnectTimeoutRef.current = setTimeout(() => {
            subscribe();
          }, 5000);
        }
      });

    channelRef.current = channel;
  }, [organizationId, enabled, handleRealtimeEvent]);

  // Set up subscription on mount
  useEffect(() => {
    if (enabled && organizationId) {
      subscribe();
    }

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (channelRef.current) {
        const supabase = getSupabaseClient();
        if (supabase) {
          console.log('[Realtime] Cleaning up Production Library subscription');
          supabase.removeChannel(channelRef.current);
        }
        channelRef.current = null;
      }
    };
  }, [subscribe, enabled, organizationId]);

  // Return function to manually reconnect if needed
  const reconnect = useCallback(() => {
    subscribe();
  }, [subscribe]);

  return { reconnect };
};

/**
 * Hook for subscribing to Knowledge Domains realtime changes
 */
export const useDomainsRealtime = ({
  organizationId,
  onInsert,
  onUpdate,
  onDelete,
  enabled = true
}) => {
  const channelRef = useRef(null);

  const handleRealtimeEvent = useCallback((payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    const record = newRecord || oldRecord;
    
    if (record && record.organization_id !== organizationId) {
      return;
    }

    switch (eventType) {
      case 'INSERT':
        if (onInsert && newRecord) onInsert(newRecord);
        break;
      case 'UPDATE':
        if (onUpdate && newRecord) onUpdate(newRecord);
        break;
      case 'DELETE':
        if (onDelete && oldRecord) onDelete(oldRecord);
        break;
      default:
        break;
    }
  }, [organizationId, onInsert, onUpdate, onDelete]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !organizationId || !enabled) return;

    const channel = supabase
      .channel(`knowledge_domains_${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'knowledge_domains',
          filter: `organization_id=eq.${organizationId}`
        },
        handleRealtimeEvent
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [organizationId, enabled, handleRealtimeEvent]);
};

/**
 * Hook for subscribing to Service Categories realtime changes
 */
export const useCategoriesRealtime = ({
  organizationId,
  onInsert,
  onUpdate,
  onDelete,
  enabled = true
}) => {
  const channelRef = useRef(null);

  const handleRealtimeEvent = useCallback((payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    const record = newRecord || oldRecord;
    
    if (record && record.organization_id !== organizationId) {
      return;
    }

    switch (eventType) {
      case 'INSERT':
        if (onInsert && newRecord) onInsert(newRecord);
        break;
      case 'UPDATE':
        if (onUpdate && newRecord) onUpdate(newRecord);
        break;
      case 'DELETE':
        if (onDelete && oldRecord) onDelete(oldRecord);
        break;
      default:
        break;
    }
  }, [organizationId, onInsert, onUpdate, onDelete]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !organizationId || !enabled) return;

    const channel = supabase
      .channel(`service_categories_${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_categories',
          filter: `organization_id=eq.${organizationId}`
        },
        handleRealtimeEvent
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [organizationId, enabled, handleRealtimeEvent]);
};

export default useProductionLibraryRealtime;
