'use client';

import { useEffect, useRef } from 'react';
import { initializeLocalDB } from './db';
import { syncMenuDataToLocal, syncDiscountsToLocal } from './sync';

/**
 * Initialize offline-first architecture on app startup
 * Syncs menu data and discounts to local SQLite cache
 */
export function useOfflineInit() {
  const initRef = useRef(false);

  useEffect(() => {
    // Only run once per app lifecycle
    if (initRef.current) return;
    initRef.current = true;

    const initialize = async () => {
      try {
        // Initialize local database
        await initializeLocalDB();

        // Sync menu data from server
        await syncMenuDataToLocal().catch((err) => {
          console.warn('Failed to sync menu data (offline mode enabled):', err);
        });

        // Sync discounts from server
        await syncDiscountsToLocal().catch((err) => {
          console.warn('Failed to sync discounts (offline mode enabled):', err);
        });
      } catch (error) {
        console.error('Failed to initialize offline cache:', error);
        // Don't throw - app should still work with online queries as fallback
      }
    };

    initialize();
  }, []);
}
