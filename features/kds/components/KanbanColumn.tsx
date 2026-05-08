"use client";

import { cn } from "@/lib/utils";
import { KitchenTicket } from "./KitchenTicket";
import type { KdsOrderStatus, OrderItem } from "@/types";

const COLUMN_STYLES: Record<string, { header: string; badge: string; underline: string; empty: string }> = {
  pending: {
    header: "text-zinc-700 dark:text-zinc-300",
    badge: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    underline: "bg-zinc-300 dark:bg-zinc-700",
    empty: "border-zinc-200 dark:border-zinc-800",
  },
  confirmed: {
    header: "text-blue-700 dark:text-blue-300",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    underline: "bg-blue-300 dark:bg-blue-700",
    empty: "border-blue-200 dark:border-blue-900",
  },
  preparing: {
    header: "text-amber-700 dark:text-amber-300",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    underline: "bg-amber-300 dark:bg-amber-700",
    empty: "border-amber-200 dark:border-amber-900",
  },
  ready: {
    header: "text-emerald-700 dark:text-emerald-300",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    underline: "bg-emerald-400 dark:bg-emerald-700",
    empty: "border-emerald-200 dark:border-emerald-900",
  },
};

type Props = {
  title: string;
  status: KdsOrderStatus;
  orders: OrderItem[];
};

export function KanbanColumn({ title, status, orders }: Props) {
  const styles = COLUMN_STYLES[status] ?? COLUMN_STYLES.pending;

  return (
    <section className="flex flex-col min-w-[300px] w-[360px] max-w-[400px]">
      {/* Sticky column header */}
      <div className="sticky top-0 z-10 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur pb-2">
        <div className="flex items-center justify-between px-1 py-2">
          <span className={cn("text-sm font-bold tracking-tight uppercase", styles.header)}>
            {title}
          </span>
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold tabular-nums", styles.badge)}>
            {orders.length}
          </span>
        </div>
        <div className={cn("h-0.5 w-full rounded-full", styles.underline)} />
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-3 pt-2 pb-6 px-0.5">
        {orders.length === 0 ? (
          <div className={cn("rounded-xl border border-dashed p-6 text-center text-sm text-zinc-400 dark:text-zinc-600", styles.empty)}>
            No <span className="font-medium lowercase">{status}</span> orders
          </div>
        ) : (
          orders.map((o) => <KitchenTicket key={o.id} order={o} />)
        )}
      </div>
    </section>
  );
}
