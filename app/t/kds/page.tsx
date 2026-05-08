"use client";

import { useMemo, useState } from "react";
import { useOrdersStore } from "@/store/orders";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { fetchKdsOrders } from "@/lib/kds";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { KdsHeader } from "@/features/kds/components/KdsHeader";
import { KanbanColumn } from "@/features/kds/components/KanbanColumn";
import type { KdsOrderStatus, OrderItem } from "@/types";

const BOARD_STATUSES: KdsOrderStatus[] = ["pending", "confirmed", "preparing", "ready"];

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

  const pending  = useMemo(() => byStatus(orders, "pending"),   [orders]);
  const confirmed = useMemo(() => byStatus(orders, "confirmed"), [orders]);
  const preparing = useMemo(() => byStatus(orders, "preparing"), [orders]);
  const ready    = useMemo(() => byStatus(orders, "ready"),     [orders]);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetchKdsOrders({ status: BOARD_STATUSES, limit: 30 });
      setFromFeed(res.data, res.nextCursor);
      toast.success("Board refreshed");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      <KdsHeader
        totalActive={orders.length}
        connection={connection as "connected" | "connecting" | "disconnected" | "error"}
        connectionError={connectionError}
        lastSyncedAt={lastSyncedAt}
        loading={loading}
        onRefresh={refresh}
      />

      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex gap-4">
            <KanbanColumn title="Pending"   status="pending"   orders={pending}   />
            <KanbanColumn title="Confirmed" status="confirmed" orders={confirmed} />
            <KanbanColumn title="Preparing" status="preparing" orders={preparing} />
            <KanbanColumn title="Ready"     status="ready"     orders={ready}     />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
