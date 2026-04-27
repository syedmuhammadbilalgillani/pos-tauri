"use client";

import { useQuery } from "@tanstack/react-query";
import { PLATFORM_PLANS_KEYS } from "./key";
import { getPlanByIdRequest, listPlansRequest } from "./api";

export function usePlatformPlansListQuery(params?: {
  q?: string;
  includeInactive?: boolean;
}) {
  return useQuery({
    queryKey: PLATFORM_PLANS_KEYS.list(params ?? {}),
    queryFn: async () => {
      const res = await listPlansRequest(params);
      return res.items;
    },
    staleTime: 1000 * 30,
  });
}

export function usePlatformPlanQuery(id: string) {
  return useQuery({
    queryKey: PLATFORM_PLANS_KEYS.byId(id),
    queryFn: async () => {
      const res = await getPlanByIdRequest(id);
      return res;
    },
    staleTime: 1000 * 30,
  });
}