"use client";

import { useQuery } from "@tanstack/react-query";
import { loadAuthSession } from "@/lib/tan-stack/auth/storage";
import { BRANDS_KEYS } from "./key";
import { listBrandsRequest, getBrandByIdRequest } from "./api";

export function useBrandsListQuery(params?: { q?: string; isActive?: boolean }) {
  const tenantId = loadAuthSession()?.user?.tenantId ?? "";

  return useQuery({
    queryKey: BRANDS_KEYS.list(tenantId, params ?? {}),
    enabled: Boolean(tenantId),
    queryFn: async () => {
      // For DataTable (client pagination), fetch a “big enough” page.
      const res = await listBrandsRequest({ ...params, limit: 200 });
      return res.items;
    },
    staleTime: 1000 * 30, // 30s: list stays fresh briefly
  });
}

export function useBrandByIdQuery(id: string) {
  const tenantId = loadAuthSession()?.user?.tenantId ?? "";

  return useQuery({
    queryKey: BRANDS_KEYS.byId(tenantId, id),
    enabled: Boolean(tenantId && id),
    queryFn: async () => getBrandByIdRequest(id),
  });
}