"use client";

import type {
  CursorPageResponse,
  KdsItemStatus,
  KdsOrderStatus,
  OrderWithItems,
} from "@/types";
import { apiClient } from "./tan-stack/api-helper";

export async function fetchKdsOrders(params: {
  status: KdsOrderStatus[];
  limit?: number;
  cursor?: string | null;
}) {
  const qs = new URLSearchParams();
  qs.set("status", params.status.join(","));
  qs.set("limit", String(params.limit ?? 30));
  if (params.cursor) qs.set("cursor", params.cursor);
  const res = await apiClient.get(`/kds/orders?${qs.toString()}`, {});
  console.log(res, "res fetchKdsOrders");
  return res?.data as CursorPageResponse<OrderWithItems>;
}

export function patchOrderStatus(
  orderId: string,
  body: { status: KdsOrderStatus; note?: string },
) {
  console.log(body, "to patchOrderStatus");
  return apiClient.patch(`/kds/orders/${orderId}/status`, body, {});
}

export function patchItemStatus(
  itemId: string,
  body: { status: KdsItemStatus; note?: string },
) {
  return apiClient.patch(`/kds/items/${itemId}/status`, { body });
}
