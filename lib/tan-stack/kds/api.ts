import type {
  KdsOrderStatus,
  KdsItemStatus,
  OrderItem,
  Item,
} from "@/types";
import { apiClient } from "../api-helper";
import { loadAuthSession } from "../auth/storage";

// ─────────────────────────────────────────────────────────
// KDS Bootstrap
// ─────────────────────────────────────────────────────────

export interface KdsBootstrapResponse {
  location: {
    id: string;
    name: string;
    timezone: string;
  };
  activeOrders: Array<{
    id: string;
    orderNumber: string;
    dailyTicket: number;
    orderType: string;
    tableNumber: string | null;
    status: KdsOrderStatus;
    items: Array<{
      id: string;
      name: string;
      sku: string | null;
      quantity: number;
      status: KdsItemStatus;
      modifiers: string;
      specialInstructions: string | null;
      elapsedSeconds: number;
    }>;
    createdAt: string;
    elapsedSeconds: number;
    estimatedPrepMinutes: number | null;
    isSlaBreached: boolean;
  }>;
}

export async function getKdsBootstrap(): Promise<KdsBootstrapResponse> {
  const session = loadAuthSession();
  const res = await apiClient.get<{ data: KdsBootstrapResponse }>(
    `/kds/bootstrap`,
    {
      headers: {
        "x-location-id": session?.user?.activeLocationId ?? "",
      },
    }
  );
  return res.data.data;
}

// ─────────────────────────────────────────────────────────
// KDS Orders List
// ─────────────────────────────────────────────────────────

export interface KdsOrdersListResponse {
  data: Array<{
    id: string;
    orderNumber: string;
    dailyTicket: number;
    orderType: string;
    tableNumber: string | null;
    status: KdsOrderStatus;
    items: Array<{
      id: string;
      itemNameSnapshot: string;
      itemSkuSnapshot: string | null;
      quantity: number;
      status: KdsItemStatus;
      specialInstructions: string | null;
      modifiers: Array<{
        id: string;
        modifierNameSnapshot: string;
        priceDeltaSnapshot: string;
      }>;
    }>;
    createdAt: string;
    estimatedPrepMinutes: number | null;
  }>;
  nextCursor: string | null;
}

export async function listKdsOrders(args?: {
  status?: string;
  limit?: number;
  cursor?: string;
}): Promise<KdsOrdersListResponse> {
  const session = loadAuthSession();
  const res = await apiClient.get<KdsOrdersListResponse>(`/kds/orders`, {
    params: {
      status: args?.status ?? "pending,confirmed,preparing,ready",
      limit: args?.limit ?? 50,
      cursor: args?.cursor ?? undefined,
    },
    headers: {
      "x-location-id": session?.user?.activeLocationId ?? "",
    },
  });
  return res.data;
}

// ─────────────────────────────────────────────────────────
// KDS Item Status Update
// ─────────────────────────────────────────────────────────

export interface KdsItemStatusUpdateRequest {
  status: KdsItemStatus;
}

export interface KdsItemStatusUpdateResponse {
  id: string;
  status: KdsItemStatus;
  orderId: string;
  itemNameSnapshot: string;
  quantity: number;
  updatedAt: string;
}

export async function updateKdsItemStatus(
  orderItemId: string,
  dto: KdsItemStatusUpdateRequest
): Promise<KdsItemStatusUpdateResponse> {
  const res = await apiClient.patch<KdsItemStatusUpdateResponse>(
    `/kds/items/${orderItemId}/status`,
    dto
  );
  return res.data;
}

// ─────────────────────────────────────────────────────────
// KDS Order Status Update
// ─────────────────────────────────────────────────────────

export interface KdsOrderStatusUpdateRequest {
  status: KdsOrderStatus;
  reason?: string;
}

export interface KdsOrderStatusUpdateResponse {
  id: string;
  status: KdsOrderStatus;
  orderNumber: string;
  dailyTicket: number;
  updatedAt: string;
}

export async function updateKdsOrderStatus(
  orderId: string,
  dto: KdsOrderStatusUpdateRequest
): Promise<KdsOrderStatusUpdateResponse> {
  const res = await apiClient.patch<KdsOrderStatusUpdateResponse>(
    `/kds/orders/${orderId}/status`,
    dto
  );
  return res.data;
}

// ─────────────────────────────────────────────────────────
// KDS SSE Stream
// ─────────────────────────────────────────────────────────

export type KdsStreamEventType =
  | "order.new"
  | "order.updated"
  | "item.status_updated"
  | "item.eighty_six"
  | "ping";

export interface KdsStreamEvent {
  type: KdsStreamEventType;
  data: Record<string, unknown>;
  timestamp: number;
}

export function createKdsStream(onEvent: (event: KdsStreamEvent) => void): EventSource {
  const session = loadAuthSession();
  const locationId = session?.user?.activeLocationId ?? "";
  const token = session?.accessToken ?? "";

  const es = new EventSource(
    `/api/v1/kds/stream?locationId=${locationId}&token=${token}`,
    { withCredentials: true }
  );

  es.addEventListener("order.new", (e: Event) => {
    if (e instanceof MessageEvent) {
      try {
        const data = JSON.parse(e.data) as Record<string, unknown>;
        onEvent({
          type: "order.new",
          data,
          timestamp: Date.now(),
        });
      } catch {
        console.error("Failed to parse order.new event");
      }
    }
  });

  es.addEventListener("order.updated", (e: Event) => {
    if (e instanceof MessageEvent) {
      try {
        const data = JSON.parse(e.data) as Record<string, unknown>;
        onEvent({
          type: "order.updated",
          data,
          timestamp: Date.now(),
        });
      } catch {
        console.error("Failed to parse order.updated event");
      }
    }
  });

  es.addEventListener("item.status_updated", (e: Event) => {
    if (e instanceof MessageEvent) {
      try {
        const data = JSON.parse(e.data) as Record<string, unknown>;
        onEvent({
          type: "item.status_updated",
          data,
          timestamp: Date.now(),
        });
      } catch {
        console.error("Failed to parse item.status_updated event");
      }
    }
  });

  es.addEventListener("item.eighty_six", (e: Event) => {
    if (e instanceof MessageEvent) {
      try {
        const data = JSON.parse(e.data) as Record<string, unknown>;
        onEvent({
          type: "item.eighty_six",
          data,
          timestamp: Date.now(),
        });
      } catch {
        console.error("Failed to parse item.eighty_six event");
      }
    }
  });

  es.addEventListener("ping", (e: Event) => {
    if (e instanceof MessageEvent) {
      try {
        const data = JSON.parse(e.data) as Record<string, unknown>;
        onEvent({
          type: "ping",
          data,
          timestamp: Date.now(),
        });
      } catch {
        console.error("Failed to parse ping event");
      }
    }
  });

  es.addEventListener("error", () => {
    console.log("SSE connection error, will auto-reconnect");
  });

  return es;
}
