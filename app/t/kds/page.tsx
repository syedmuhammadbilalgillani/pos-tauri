"use client";

import { useMemo, useState } from "react";
import { useOrdersStore } from "@/store/orders";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import type { KdsOrderStatus, OrderWithItems } from "@/types";
import { fetchKdsOrders } from "@/lib/kds";
import { OrderColumn } from "@/components/OrderColumn";
import { ScrollArea } from "@/components/ui/scroll-area";

const BOARD_STATUSES: KdsOrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
];

function byStatus(orders: OrderWithItems[], status: KdsOrderStatus) {
  return orders.filter((o) => o.status === status);
}

export default function KdsPage() {
  const { connection, connectionError } = useRealtimeOrders("kds");

  const ordersById = useOrdersStore((s) => s.ordersById);
  const orderIds = useOrdersStore((s) => s.orderIds);
  const setFromFeed = useOrdersStore((s) => s.setFromFeed);
  const lastSyncedAt = useOrdersStore((s) => s.lastSyncedAt);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const orders = useMemo(
    () => orderIds.map((id) => ordersById[id]).filter(Boolean),
    [orderIds, ordersById],
  );

  const pending = useMemo(() => byStatus(orders, "pending"), [orders]);
  console.log(pending, "pending");
  const confirmed = useMemo(() => byStatus(orders, "confirmed"), [orders]);
  const preparing = useMemo(() => byStatus(orders, "preparing"), [orders]);
  const ready = useMemo(() => byStatus(orders, "ready"), [orders]);

  const badge =
    connection === "connected"
      ? {
          label: "Connected",
          cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
        }
      : connection === "connecting"
        ? {
            label: "Connecting…",
            cls: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
          }
        : connection === "disconnected"
          ? {
              label: "Disconnected",
              cls: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
            }
          : {
              label: "Error",
              cls: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
            };

  async function refresh() {
    setError("");
    setLoading(true);
    try {
      const res = await fetchKdsOrders({ status: BOARD_STATUSES, limit: 30 });
      console.log(res, "res fetchKdsOrders");
      setFromFeed(res.data, res.nextCursor);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load orders";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-background max-h-dvh overflow-y-hidden">
      <div className="mx-auto w-full max-w-7xl px-4 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-semibold tracking-tight">
              Kitchen Display (KDS)
            </div>
            {/* <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Realtime via Socket.IO; REST refetch on reconnect.
            </div>

            <div className="mt-2 flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}
              >
                {badge.label}
              </span>

              {connection !== "connected" && connectionError ? (
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  {connectionError}
                </span>
              ) : null}
            </div> */}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>

            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {lastSyncedAt
                ? `Last sync: ${new Date(lastSyncedAt).toLocaleTimeString()}`
                : "Not synced"}
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
            {error}
          </div>
        ) : null}
      </div>

      <ScrollArea className="h-[82dvh]">
        <div className="mx-auto max-w-7xl px-2 pb-6">
          <div className="flex gap-4">
            <OrderColumn title="Pending" status="pending" orders={pending} />
            <OrderColumn
              title="Confirmed"
              status="confirmed"
              orders={confirmed}
            />
            <OrderColumn
              title="Preparing"
              status="preparing"
              orders={preparing}
            />
            <OrderColumn title="Ready" status="ready" orders={ready} />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
