"use client";

import type { KdsOrderStatus, OrderWithItems } from "@/types";
import { OrderCard } from "@/components/OrderCard";

export function OrderColumn({
  title,
  status,
  orders,
}: {
  title: string;
  status: KdsOrderStatus;
  orders: OrderWithItems[];
}) {
  console.log('orders', orders);
  return (

    <section className="flex flex-col min-w-[320px] w-[380px] max-w-[420px]">
      <div className="z-5 bg-zinc-50/80 backdrop-blur sticky top-0 dark:bg-black/60">
        <div className="flex items-center justify-between px-2 py-3">
          <div className="text-sm font-semibold tracking-tight">{title}</div>
          <div className="text-xs rounded-full bg-zinc-200 px-2 py-0.5 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
            {orders.length}
          </div>
        </div>
      </div>
      <div className="flex-1 px-2 pb-6 space-y-3">
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
        {orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            No orders in <span className="font-medium">{status}</span>.
          </div>
        ) : null}
      </div>
    </section>
  );
}

