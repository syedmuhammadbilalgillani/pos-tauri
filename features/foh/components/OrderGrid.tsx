"use client";

import { OrderTile } from "./OrderTile";
import type { OrderItem } from "@/types";

type Props = {
  orders: OrderItem[];
  newReadyId: string | null;
};

export function OrderGrid({ orders, newReadyId }: Props) {
  if (orders.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-16 py-12 text-center">
          <div className="text-5xl font-bold text-zinc-200 dark:text-zinc-700">—</div>
          <div className="mt-2 text-lg text-zinc-500 dark:text-zinc-400">No active orders</div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {orders.map((o) => (
        <OrderTile key={o.id} order={o} isNew={o.id === newReadyId} />
      ))}
    </div>
  );
}
