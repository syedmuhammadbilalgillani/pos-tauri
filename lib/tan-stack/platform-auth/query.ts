"use client";

import { useQuery } from "@tanstack/react-query";
import { PLATFORM_AUTH_KEYS } from "./key";
import { loadPlatformSession } from "./storage";
import type { PlatformSession } from "./storage";

export function usePlatformSession() {
  return useQuery({
    queryKey: PLATFORM_AUTH_KEYS.session(),
    queryFn: (): PlatformSession | null => loadPlatformSession(),
    staleTime: Infinity,
    gcTime: Infinity,
    networkMode: "offlineFirst",
  });
}

export function usePlatformUser() {
  const q = usePlatformSession();
  return q.data?.user ?? null;
}
