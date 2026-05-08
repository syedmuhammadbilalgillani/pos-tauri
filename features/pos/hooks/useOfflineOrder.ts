"use client";

import { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { insertOfflineOrder } from "@/lib/offline/db";
import { useOfflineStore } from "@/store/offline";
import { apiClient } from "@/lib/tan-stack/api-helper";
import { loadAuthSession } from "@/lib/tan-stack/auth/storage";
import type { CreateOrderDto } from "@/features/pos/types";

export type PaymentInfo = {
  paymentMethod: string;
  amount: string;
  tipAmount?: string;
};

type SendOrderResult =
  | { ok: true; orderId: string; orderNumber: string; offline: false }
  | { ok: true; localId: string; offline: true }
  | { ok: false; error: string };

/**
 * Send an order online, or queue it in SQLite when offline.
 * If paymentInfo is provided it is embedded in the offline payload so sync.ts
 * can record the payment after creating the order server-side.
 */
export function useOfflineOrder() {
  const { networkStatus, addPendingOrder } = useOfflineStore();
  const isOnline = networkStatus === "online";

  const sendOrder = useCallback(
    async (
      payload: CreateOrderDto,
      paymentInfo?: PaymentInfo,
    ): Promise<SendOrderResult> => {
      // ── Online path ───────────────────────────────────────────────
      if (isOnline) {
        try {
          const res = await apiClient.post<{
            data: { id: string; orderNumber: string };
          }>("restaurant/orders", payload);
          const data = res.data?.data;
          if (!data?.id) return { ok: false, error: "Invalid server response" };

          // Record payment immediately if provided
          if (paymentInfo) {
            try {
              await apiClient.post(`pos/orders/${data.id}/payments`, {
                paymentMethod: paymentInfo.paymentMethod,
                amount: paymentInfo.amount,
                tipAmount: paymentInfo.tipAmount ?? "0",
              });
            } catch {
              // Payment recording failure is non-fatal — order is already created
            }
          }

          return { ok: true, orderId: data.id, orderNumber: data.orderNumber, offline: false };
        } catch (e) {
          const isNetworkErr =
            e instanceof TypeError ||
            (e instanceof Error &&
              (e.message.toLowerCase().includes("network") ||
                e.message.toLowerCase().includes("fetch")));
          if (!isNetworkErr) {
            return { ok: false, error: e instanceof Error ? e.message : "Failed to send order" };
          }
          // Fall through to offline queue
        }
      }

      // ── Offline path ──────────────────────────────────────────────
      const localId = uuidv4();
      const session = loadAuthSession();
      const enrichedPayload = {
        ...payload,
        locationId: payload.locationId ?? session?.user?.activeLocationId ?? "",
        orderSource: "pos",
        // Embed payment info so sync.ts can record it after order creation
        _offlinePayment: paymentInfo ?? null,
      };

      await insertOfflineOrder(localId, enrichedPayload);

      addPendingOrder({
        local_id: localId,
        server_id: null,
        status: "pending",
        payload: JSON.stringify(enrichedPayload),
        created_at: Date.now(),
        synced_at: null,
        error_msg: null,
        retry_count: 0,
      });

      return { ok: true, localId, offline: true };
    },
    [isOnline, addPendingOrder],
  );

  return { sendOrder, isOnline };
}
