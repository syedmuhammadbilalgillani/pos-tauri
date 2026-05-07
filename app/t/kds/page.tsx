"use client";

import { useMemo, useState } from "react";
import { useOrdersStore } from "@/store/orders";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import type { KdsOrderStatus, OrderItem } from "@/types";
import { fetchKdsOrders } from "@/lib/kds";
import { OrderColumn } from "@/components/OrderColumn";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

const BOARD_STATUSES: KdsOrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
];

function byStatus(orders: OrderItem[], status: KdsOrderStatus) {
  return orders.filter((o) => o.status === status);
}

export default function KdsPage() {
  const { connection, connectionError } = useRealtimeOrders("kds");

  const ordersById = useOrdersStore((s) => s.ordersById);
  const orderIds = useOrdersStore((s) => s.orderIds);
  const setFromFeed = useOrdersStore((s) => s.setFromFeed);
  const lastSyncedAt = useOrdersStore((s) => s.lastSyncedAt);

  const [loading, setLoading] = useState(false);

  const orders = useMemo(
    () => orderIds.map((id) => ordersById[id]).filter(Boolean),
    [orderIds, ordersById],
  );

  const pending = useMemo(() => byStatus(orders, "pending"), [orders]);
  const confirmed = useMemo(() => byStatus(orders, "confirmed"), [orders]);
  const preparing = useMemo(() => byStatus(orders, "preparing"), [orders]);
  const ready = useMemo(() => byStatus(orders, "ready"), [orders]);

  const badge =
    connection === "connected"
      ? {
          label: "Live",
          dot: "bg-emerald-500",
          cls: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800",
        }
      : connection === "connecting"
        ? {
            label: "Connecting…",
            dot: "bg-amber-400 animate-pulse",
            cls: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800",
          }
        : connection === "disconnected"
          ? {
              label: "Disconnected",
              dot: "bg-zinc-400",
              cls: "bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
            }
          : {
              label: "Error",
              dot: "bg-rose-500 animate-pulse",
              cls: "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800",
            };

  const totalActive = orders.length;

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetchKdsOrders({ status: BOARD_STATUSES, limit: 30 });
      setFromFeed(res.data, res.nextCursor);
      toast.success("Board refreshed");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load orders";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 max-h-dvh overflow-y-hidden">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-3">
        <div className="mx-auto w-full max-w-7xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-lg font-bold tracking-tight">Kitchen Display</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {totalActive} active order{totalActive !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Connection badge */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${badge.cls}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
              {badge.label}
            </span>

            {connection !== "connected" && connectionError ? (
              <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[200px]">
                {connectionError}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            {lastSyncedAt ? (
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                Synced {new Date(lastSyncedAt).toLocaleTimeString()}
              </span>
            ) : null}
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* Board */}
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex gap-4">
            <OrderColumn title="Pending" status="pending" orders={pending} />
            <OrderColumn title="Confirmed" status="confirmed" orders={confirmed} />
            <OrderColumn title="Preparing" status="preparing" orders={preparing} />
            <OrderColumn title="Ready" status="ready" orders={ready} />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
