'use client';

import * as React from 'react';
import { queryClient } from '@/lib/tan-stack/query-client';
import { AUTH_KEYS } from './key';
import {
  loadAuthSession,
  updateSessionTokens,
} from './storage';
import { refreshRequest } from './api';

/** Re-fetch permissions if stale by more than this threshold. */
const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Silently refreshes tokens + permissions.
 * Called on window focus or when a 403 is detected.
 * Does nothing if offline or if permissions are fresh.
 */
export async function silentlyRefreshPermissions(): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;

  const session = loadAuthSession();
  if (!session?.refreshToken) return;

  const lastUpdated = session.user?.permissionsUpdatedAt ?? 0;
  const isStale = Date.now() - lastUpdated > STALE_THRESHOLD_MS;
  if (!isStale) return;

  try {
    const tokens = await refreshRequest(session.refreshToken);
    await updateSessionTokens(
      tokens.accessToken,
      tokens.refreshToken,
      tokens.permissions,
      tokens.permissionsUpdatedAt,
    );
    // Update TanStack Query cache so usePermissions() re-renders
    queryClient.setQueryData(AUTH_KEYS.session(), loadAuthSession());
  } catch {
    // Silent — never crash the UI for a background permission refresh
  }
}

/**
 * Hook — call once at app root (in Providers).
 * Listens to window focus + visibilitychange to refresh stale permissions.
 */
export function usePermissionsSync(): void {
  React.useEffect(() => {
    const handleFocus = () => void silentlyRefreshPermissions();

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') handleFocus();
    });

    // Also refresh on mount (covers app re-open in Tauri)
    void silentlyRefreshPermissions();

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
}