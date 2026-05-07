"use client";

import * as React from "react";
import { queryClient } from "@/lib/tan-stack/query-client";
import { AUTH_KEYS } from "./key";
import { loadAuthSession, updateSessionTokens, updateSessionPermissions } from "./storage";
import { refreshRequest } from "./api";
import type { PosStaffMeBody } from "@/types";

const STALE_THRESHOLD_MS = 10 * 60 * 1_000; // 10 minutes

/**
 * Silently refreshes tokens then re-fetches /me for fresh permissions.
 * Called on window focus / visibilitychange and on mount (covers Tauri app re-open).
 */
export async function silentlyRefreshPermissions(): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  const session = loadAuthSession();
  if (!session?.refreshToken) return;

  const lastUpdated = session.user?.permissionsUpdatedAt ?? 0;
  if (Date.now() - lastUpdated < STALE_THRESHOLD_MS) return;

  try {
    // 1. Rotate tokens
    const tokens = await refreshRequest(session.refreshToken);
    await updateSessionTokens(tokens.accessToken, tokens.refreshToken);

    // 2. Fetch fresh permissions from /me using current active location
    const locationId = loadAuthSession()?.user?.activeLocationId;
    const { apiClient } = await import("@/lib/tan-stack/api-helper");

    const meRes = await apiClient.get<PosStaffMeBody>("restaurant/auth/me", {
      token: tokens.accessToken,
      _skipRefresh: true,
      ...(locationId ? { headers: { "x-location-id": locationId } } : {}),
    });

    const perms = meRes.data?.data?.effectivePermissions;
    if (perms) {
      await updateSessionPermissions(perms, Date.now());
    }

    // Push updated session into TanStack Query cache
    queryClient.setQueryData(AUTH_KEYS.session(), loadAuthSession());
  } catch {
    // Silent — never crash the UI for a background permission sync
  }
}

export function usePermissionsSync(): void {
  React.useEffect(() => {
    const handleFocus = () => void silentlyRefreshPermissions();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") handleFocus();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    // Run on mount — covers app re-open in Tauri
    void silentlyRefreshPermissions();

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);
}