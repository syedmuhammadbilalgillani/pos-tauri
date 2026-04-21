"use client";

import { useQuery } from "@tanstack/react-query";
import { loadAuthSession } from "./storage";
import type { AuthSession } from "@/types";
import { AUTH_KEYS } from "./key";

export function useAuthSession() {
  return useQuery({
    queryKey: AUTH_KEYS.session(),
    queryFn: (): AuthSession | null => loadAuthSession(),
    staleTime: Infinity,
    gcTime: Infinity,
    networkMode: "offlineFirst",
  });
}

export function useAuthUser() {
  const q = useAuthSession();
  return q.data?.user ?? null;
}