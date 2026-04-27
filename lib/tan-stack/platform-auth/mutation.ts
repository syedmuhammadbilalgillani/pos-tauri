"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PLATFORM_AUTH_KEYS } from "./key";
import { platformLoginRequest, platformRefreshRequest } from "./api";
import {
  clearPlatformSession,
  loadPlatformSession,
  savePlatformSession,
  updatePlatformTokens,
} from "./storage";

export function usePlatformLoginMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const session = await platformLoginRequest(input);
      await savePlatformSession(session);
      return session;
    },
    onSuccess: (session) => {
      qc.setQueryData(PLATFORM_AUTH_KEYS.session(), session);
    },
  });
}

export function usePlatformLogoutMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await clearPlatformSession();
    },
    onSuccess: () => {
      qc.setQueryData(PLATFORM_AUTH_KEYS.session(), null);
      // optional: also clear platform-admin caches if you want
      // qc.removeQueries({ queryKey: ["platform-users"] });
    },
  });
}

/** Optional: call this manually if you want proactive refresh in UI. */
export function usePlatformRefreshMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const s = loadPlatformSession();
      if (!s?.refreshToken) throw new Error("Missing refresh token");
      const tokens = await platformRefreshRequest(s.refreshToken);
      await updatePlatformTokens(tokens.accessToken, tokens.refreshToken);
      return tokens;
    },
    onSuccess: () => {
      qc.setQueryData(PLATFORM_AUTH_KEYS.session(), loadPlatformSession());
    },
  });
}
