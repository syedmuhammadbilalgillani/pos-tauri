"use client";

import { JSX, useEffect, useMemo, useRef, useState } from "react";
import { useKdsOrdersListQuery } from "@/lib/tan-stack/kds/query";
import {
  useUpdateKdsItemStatusMutation,
  useUpdateKdsOrderStatusMutation,
} from "@/lib/tan-stack/kds/mutation";
import { createKdsStream, type KdsStreamEvent } from "@/lib/tan-stack/kds/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { KdsOrderStatus, KdsItemStatus } from "@/types";
import { toast } from "sonner";

interface KdsOrder {
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
}

function getUrgencyLevel(
  createdAt: string,
  estimatedPrepMinutes: number | null
): "fresh" | "moderate" | "urgent" | "sla_breached" {
  const elapsed = (Date.now() - new Date(createdAt).getTime()) / 1000;
  const target = (estimatedPrepMinutes ?? 10) * 60;

  if (elapsed < target * 0.5) return "fresh";
  if (elapsed < target * 0.8) return "moderate";
  if (elapsed < target) return "urgent";
  return "sla_breached";
}

const urgencyStyles = {
  fresh: { border: "border-green-600", bg: "bg-background", indicator: "bg-green-600" },
  moderate: { border: "border-amber-500", bg: "bg-background", indicator: "bg-amber-500" },
  urgent: { border: "border-orange-500", bg: "bg-orange-950/20", indicator: "bg-orange-500" },
  sla_breached: {
    border: "border-red-600",
    bg: "bg-red-950/30",
    indicator: "bg-red-600 animate-pulse",
  },
};

function ElapsedTimer({ startTime }: { startTime: string }): JSX.Element {
  const [elapsed, setElapsed] = useState<number>(0);

  useEffect(() => {
    const start = new Date(startTime).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const mm = Math.floor(elapsed / 60)
    .toString()
    .padStart(2, "0");
  const ss = (elapsed % 60).toString().padStart(2, "0");

  return (
    <span className="font-mono font-bold text-lg">
      {mm}:{ss}
    </span>
  );
}

function KdsOrderCard({ order }: { order: KdsOrder }): JSX.Element {
  const urgency = getUrgencyLevel(order.createdAt, order.estimatedPrepMinutes);
  const styles = urgencyStyles[urgency];
  const updateItemM = useUpdateKdsItemStatusMutation();
  const updateOrderM = useUpdateKdsOrderStatusMutation();

  const allItemsReady = order.items.every((item) => item.status === "ready");

  return (
    <Card
      className={`overflow-hidden border-2 ${styles.border} ${styles.bg} min-w-64 max-w-sm`}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-lg font-bold text-foreground">#{order.dailyTicket}</div>
            <div className="text-xs text-muted-foreground truncate">
              {order.orderType === "dine_in"
                ? `Table ${order.tableNumber ?? "?"}`
                : order.orderType}
            </div>
          </div>
          <div className="text-center">
            <div className={`w-3 h-3 rounded-full ${styles.indicator}`} />
            <ElapsedTimer startTime={order.createdAt} />
          </div>
        </div>

        {/* Items */}
        <div className="space-y-1.5 text-sm">
          {order.items.map((item) => {
            const itemReady = item.status === "ready";
            return (
              <div
                key={item.id}
                className={`flex items-start justify-between gap-2 p-1.5 rounded border text-xs ${
                  itemReady ? "bg-green-950/30 border-green-700/50" : "bg-muted/50"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{item.itemNameSnapshot}</div>
                  {item.quantity > 1 && (
                    <div className="text-muted-foreground">× {item.quantity}</div>
                  )}
                  {item.specialInstructions && (
                    <div className="text-muted-foreground italic truncate">
                      {item.specialInstructions}
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  className="h-6 px-2 text-xs shrink-0"
                  variant={itemReady ? "default" : "outline"}
                  onClick={async () => {
                    try {
                      const newStatus: KdsItemStatus = itemReady ? "pending" : "ready";
                      await updateItemM.mutateAsync({
                        orderItemId: item.id,
                        status: { status: newStatus },
                      });
                    } catch {
                      // Error handled by mutation
                    }
                  }}
                  disabled={updateItemM.isPending}
                >
                  {itemReady ? "✓" : "→"}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-muted-foreground/20 space-y-2">
          <Button
            className="w-full h-8 text-xs"
            variant={order.status === "preparing" ? "default" : "outline"}
            onClick={async () => {
              try {
                const newStatus: KdsOrderStatus =
                  order.status === "confirmed" ? "preparing" : "ready";
                await updateOrderM.mutateAsync({
                  orderId: order.id,
                  status: { status: newStatus },
                });
              } catch {
                // Error handled by mutation
              }
            }}
            disabled={updateOrderM.isPending || order.status === "ready"}
          >
            {order.status === "pending" || order.status === "confirmed"
              ? "START"
              : order.status === "preparing"
                ? "BUMP"
                : "READY"}
          </Button>

          {order.status === "ready" && (
            <Button
              className="w-full h-8 text-xs bg-green-700 hover:bg-green-800"
              onClick={async () => {
                try {
                  await updateOrderM.mutateAsync({
                    orderId: order.id,
                    status: { status: "completed" },
                  });
                  toast.success("Order completed");
                } catch {
                  // Error handled by mutation
                }
              }}
              disabled={updateOrderM.isPending}
            >
              COMPLETE
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function KdsPage(): JSX.Element {
  const ordersQ = useKdsOrdersListQuery();
  const [orders, setOrders] = useState<KdsOrder[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  const displayOrders = useMemo(() => {
    const combined = [
      ...(ordersQ.data?.data ?? []),
      ...orders.filter((o) => !ordersQ.data?.data?.find((d) => d.id === o.id)),
    ];
    return combined.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orders, ordersQ.data?.data]);

  // Setup SSE on mount
  useEffect(() => {
    const handleStreamEvent = (event: KdsStreamEvent): void => {
      if (event.type === "order.new") {
        const newOrder = event.data as unknown as KdsOrder;
        setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
      } else if (event.type === "order.updated") {
        const { orderId, status } = event.data as unknown as {
          orderId: string;
          status: KdsOrderStatus;
        };
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status } : o))
        );
      } else if (event.type === "item.status_updated") {
        const { orderId, orderItemId, status } = event.data as unknown as {
          orderId: string;
          orderItemId: string;
          status: KdsItemStatus;
        };
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  items: o.items.map((item) =>
                    item.id === orderItemId ? { ...item, status } : item
                  ),
                }
              : o
          )
        );
      }
    };

    try {
      eventSourceRef.current = createKdsStream(handleStreamEvent);
    } catch (error) {
      console.error("Failed to create KDS stream:", error);
    }

    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">🍴 KITCHEN</h1>
            <p className="text-sm text-slate-400">
              {ordersQ.data?.data?.length ?? 0} active order
              {(ordersQ.data?.data?.length ?? 0) !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-bold">
              {new Date().toLocaleTimeString()}
            </div>
            <Badge
              variant={ordersQ.isLoading ? "outline" : ordersQ.isError ? "destructive" : "default"}
            >
              {ordersQ.isLoading ? "Loading..." : ordersQ.isError ? "Error" : "Live"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      {ordersQ.isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 rounded-lg bg-slate-900 animate-pulse" />
          ))}
        </div>
      ) : ordersQ.isError ? (
        <div className="rounded-lg border-2 border-red-700 bg-red-950/30 p-6 text-center">
          <div className="text-red-500 text-lg font-semibold">Connection Error</div>
          <p className="text-sm text-red-400 mt-2">Failed to load KDS orders</p>
        </div>
      ) : displayOrders.length === 0 ? (
        <div className="rounded-lg border-2 border-slate-700 p-12 text-center">
          <div className="text-4xl mb-4">✨</div>
          <div className="text-lg font-semibold text-slate-300">All caught up!</div>
          <p className="text-sm text-slate-400 mt-2">No active orders</p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pr-4">
            {displayOrders.map((order) => (
              <KdsOrderCard key={order.id} order={order} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
