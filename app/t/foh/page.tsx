"use client";

import { useMemo } from "react";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { useOrdersStore } from "@/store/orders";
import { FohTicker } from "@/components/FohTicker";

export default function FohPage() {
  useRealtimeOrders("foh");

  const ordersById = useOrdersStore((s) => s.ordersById);
  const orderIds = useOrdersStore((s) => s.orderIds);

  const orders = useMemo(
    () => orderIds.map((id) => ordersById[id]).filter(Boolean),
    [orderIds, ordersById],
  );

  return (
    <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-black">
      <FohTicker orders={orders} enableReadyAlert />
    </div>
  );
}
