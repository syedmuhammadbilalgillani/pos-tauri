"use client";

import { apiClient } from "@/lib/tan-stack/api-helper";
import {
  getAllOfflineOrders,
  getPendingOfflineOrders,
  markOfflineOrderFailed,
  markOfflineOrderSynced,
} from "@/lib/offline/db";
import { useOfflineStore } from "@/store/offline";
import { toast } from "sonner";

type BatchResult = {
  clientId: string;
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  error?: string;
};

type SyncResponse = {
  data: BatchResult[];
};

const BATCH_SIZE = 20;

/**
 * Push all pending offline orders to the server in batches.
 * Also records any embedded payment info after successful order creation.
 */
export async function syncOfflineOrders(): Promise<void> {
  const { isSyncing, setSyncing, setLastSyncAt, setPendingOrders } =
    useOfflineStore.getState();

  if (isSyncing) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  const pending = await getPendingOfflineOrders();
  if (!pending.length) return;

  setSyncing(true);

  let successCount = 0;
  let failCount = 0;

  try {
    for (let i = 0; i < pending.length; i += BATCH_SIZE) {
      const batch = pending.slice(i, i + BATCH_SIZE);

      const orders = batch.map((row) => {
        const parsed = JSON.parse(row.payload);
        // Strip internal fields before sending to server
        const { _offlinePayment: _p, ...orderPayload } = parsed;
        return { clientId: row.local_id, ...orderPayload };
      });

      try {
        const res = await apiClient.post<SyncResponse>(
          "restaurant/orders/batch",
          { orders },
        );

        const results: BatchResult[] = res.data?.data ?? [];

        for (const result of results) {
          if (result.success && result.orderId) {
            await markOfflineOrderSynced(result.clientId, result.orderId);
            successCount++;

            // Record embedded payment if present
            const row = batch.find((r) => r.local_id === result.clientId);
            if (row) {
              const parsed = JSON.parse(row.payload);
              const payment = parsed._offlinePayment;
              if (payment?.paymentMethod) {
                try {
                  await apiClient.post(`pos/orders/${result.orderId}/payments`, {
                    paymentMethod: payment.paymentMethod,
                    amount: payment.amount,
                    tipAmount: payment.tipAmount ?? "0",
                  });
                } catch {
                  // Non-fatal: order is created, payment retry can happen manually
                }
              }
            }
          } else {
            await markOfflineOrderFailed(
              result.clientId,
              result.error ?? "Server rejected order",
            );
            failCount++;
          }
        }
      } catch (e) {
        for (const row of batch) {
          await markOfflineOrderFailed(
            row.local_id,
            e instanceof Error ? e.message : "Network error",
          );
          failCount++;
        }
      }
    }

    setLastSyncAt(Date.now());

    const updated = await getAllOfflineOrders();
    setPendingOrders(updated);

    if (successCount > 0 && failCount === 0) {
      toast.success(
        `${successCount} offline order${successCount > 1 ? "s" : ""} synced`,
        { id: "offline-sync-success" },
      );
    } else if (successCount > 0 && failCount > 0) {
      toast.warning(
        `${successCount} synced, ${failCount} failed — will retry`,
        { id: "offline-sync-partial" },
      );
    } else if (failCount > 0) {
      toast.error(`${failCount} order${failCount > 1 ? "s" : ""} failed to sync`, {
        id: "offline-sync-fail",
      });
    }
  } finally {
    setSyncing(false);
  }
}

export async function hydratePendingOrders(): Promise<void> {
  const orders = await getAllOfflineOrders();
  useOfflineStore.getState().setPendingOrders(orders);
}
