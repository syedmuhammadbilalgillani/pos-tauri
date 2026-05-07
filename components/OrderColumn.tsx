"use client";

import type { KdsOrderStatus, OrderItem } from "@/types";
import { OrderCard } from "@/components/OrderCard";

const COLUMN_STYLES: Partial<
  Record<KdsOrderStatus, { header: string; badge: string; empty: string }>
> = {
  preparing: {
    header: "text-amber-800 dark:text-amber-200",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    empty: "border-amber-200 dark:border-amber-900",
  },
  ready: {
    header: "text-emerald-800 dark:text-emerald-200",
    badge:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    empty: "border-emerald-200 dark:border-emerald-900",
  },
  completed: {
    header: "text-zinc-500 dark:text-zinc-400",
    badge: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    empty: "border-zinc-200 dark:border-zinc-800",
  },
  cancelled: {
    header: "text-rose-700 dark:text-rose-300",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200",
    empty: "border-rose-200 dark:border-rose-900",
  },
  rejected: {
    header: "text-rose-700 dark:text-rose-300",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200",
    empty: "border-rose-200 dark:border-rose-900",
  },
};

export function OrderColumn({
  title,
  status,
  orders,
}: {
  title: string;
  status: KdsOrderStatus;
  orders: OrderItem[];
}) {
  const styles = COLUMN_STYLES[status] ?? COLUMN_STYLES.pending;

  return (
    <section className="flex flex-col min-w-[300px] w-[360px] max-w-[400px]">
      {/* Column header */}
      <div className="sticky top-0 z-10 bg-zinc-50/90 backdrop-blur dark:bg-zinc-950/90 pb-2">
        <div className="flex items-center justify-between px-1 py-2">
          <div
            className={`text-sm font-bold tracking-tight uppercase ${styles?.header}`}
          >
            {title}
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${styles?.badge}`}
          >
            {orders.length}
          </span>
        </div>
        <div
          className={`h-0.5 w-full rounded-full ${
            status === "pending"
              ? "bg-zinc-300 dark:bg-zinc-700"
              : status === "confirmed"
                ? "bg-blue-300 dark:bg-blue-800"
                : status === "preparing"
                  ? "bg-amber-300 dark:bg-amber-700"
                  : status === "ready"
                    ? "bg-emerald-400 dark:bg-emerald-700"
                    : "bg-zinc-200 dark:bg-zinc-800"
          }`}
        />
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-3 pt-2 pb-6 px-0.5">
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
        {orders.length === 0 ? (
          <div
            className={`rounded-xl border border-dashed p-6 text-center text-sm text-zinc-400 dark:text-zinc-600 ${styles?.empty}`}
          >
            No <span className="font-medium lowercase">{status}</span> orders
          </div>
        ) : null}
      </div>
    </section>
  );
}
