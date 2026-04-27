"use client";

import type {
  CursorPageResponse,
  KdsItemStatus,
  KdsOrderStatus,
  OrderWithItems,
} from "@/types";
import { apiClient } from "./tan-stack/api-helper";
import { requireTenantId } from "./tan-stack/brands";
import { loadAuthSession } from "@/lib/tan-stack/auth/storage";

export async function fetchKdsOrders(params: {
  status: KdsOrderStatus[];
  limit?: number;
  cursor?: string | null;
}) {
  const tenantId = requireTenantId();
  const activeLocationId = loadAuthSession()?.user?.activeLocationId;
  if (!activeLocationId) {
    throw new Error("Active location ID is required");
  }
  const qs = new URLSearchParams();
  qs.set("status", params.status.join(","));
  qs.set("limit", String(params.limit ?? 30));
  if (params.cursor) qs.set("cursor", params.cursor);
  const res = await apiClient.get(`/kds/orders?${qs.toString()}`, {
    headers: { "x-tenant-id": tenantId, "x-location-id": activeLocationId },
  });
  console.log(res, "res fetchKdsOrders");
  return res?.data as CursorPageResponse<OrderWithItems>;
}

export function patchOrderStatus(
  orderId: string,
  body: { status: KdsOrderStatus; note?: string },
) {
  const tenantId = requireTenantId();
  const activeLocationId = loadAuthSession()?.user?.activeLocationId;
  if (!activeLocationId) {
    throw new Error("Active location ID is required");
  }
  console.log(body, "to patchOrderStatus");
  return apiClient.patch(
    `/kds/orders/${orderId}/status`,
    body ,
    {
      headers: { "x-tenant-id": tenantId, "x-location-id": activeLocationId },
    },
  );
}

export function patchItemStatus(
  itemId: string,
  body: { status: KdsItemStatus; note?: string },
) {
  const tenantId = requireTenantId();
  const activeLocationId = loadAuthSession()?.user?.activeLocationId;
  if (!activeLocationId) {
    throw new Error("Active location ID is required");
  }
  return apiClient.patch(
    `/kds/items/${itemId}/status`,
    { body },
    {
      headers: { "x-tenant-id": tenantId, "x-location-id": activeLocationId },
    },
  );
}
