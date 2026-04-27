"use client";

import { useQuery } from "@tanstack/react-query";
import { PLATFORM_USERS_KEYS } from "./key";
import { getPlatformUserByIdRequest, listPlatformUsersRequest } from "./api";

export function usePlatformUsersListQuery(params?: { q?: string }) {
  return useQuery({
    queryKey: PLATFORM_USERS_KEYS.list(params ?? {}),
    queryFn: async () => {
      const res = await listPlatformUsersRequest({ ...params, limit: 200 });
      return res.items;
    },
    staleTime: 1000 * 30,
  });
}

export function usePlatformUserQuery(id: string) {
  return useQuery({
    queryKey: PLATFORM_USERS_KEYS.byId(id),
    queryFn: async () => {
      const res = await getPlatformUserByIdRequest(id);
      return res;
    },
    staleTime: 1000 * 30,
  });
}