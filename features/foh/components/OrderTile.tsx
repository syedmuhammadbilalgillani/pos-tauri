"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { KdsOrderStatus, OrderItem } from "@/types";

type FohStatus = "Preparing" | "Ready" | "Completed";

function normalize(s: KdsOrderStatus): FohStatus {
  if (s === "ready") return "Ready";
  if (s === "completed") return "Completed";
  return "Preparing";
}

const STATUS_CONFIG: Record<FohStatus, { card: string; label: string; dot: string; num: string; ring: string }> = {
  Preparing: {
    card: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
    label: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-400 animate-pulse",
    num: "text-amber-900 dark:text-amber-100",
    ring: "ring-amber-200 dark:ring-amber-800",
  },
  Ready: {
    card: "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/50 shadow-lg shadow-emerald-100 dark:shadow-emerald-900/30",
    label: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
    num: "text-emerald-900 dark:text-emerald-100",
    ring: "ring-emerald-300 dark:ring-emerald-700",
  },
  Completed: {
    card: "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50 opacity-50",
    label: "text-zinc-500 dark:text-zinc-400",
    dot: "bg-zinc-400",
    num: "text-zinc-400 dark:text-zinc-600",
    ring: "ring-zinc-200 dark:ring-zinc-800",
  },
};

const SOURCE_ICON: Record<string, string> = {
  pos:        "🖥️",
  online:     "🌐",
  qr:         "📱",
  kiosk:      "📟",
  whatsapp:   "💬",
  aggregator: "🛵",
  group:      "👥",
};

const ORDER_TYPE_LABEL: Record<string, string> = {
  dine_in:  "🍽️ Dine In",
  takeaway: "🥡 Takeaway",
  delivery: "🛵 Delivery",
  catering: "🎉 Catering",
};

type Props = {
  order: OrderItem;
  isNew?: boolean;
};

export function OrderTile({ order, isNew }: Props) {
  const fohStatus = normalize(order.status as KdsOrderStatus);
  const cfg       = STATUS_CONFIG[fohStatus];

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (fohStatus === "Completed") return;
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [fohStatus]);

  const elapsedMin = useMemo(() => {
    const ms = new Date(order.createdAt).getTime();
    return Number.isFinite(ms) ? Math.max(0, Math.floor((now - ms) / 60_000)) : 0;
  }, [now, order.createdAt]);

  const totalQty = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
  const sourceIcon = SOURCE_ICON[order.orderSource] ?? "🖥️";

  return (
    <div
      className={cn(
        "rounded-2xl border-2 p-5 transition-all duration-500 flex flex-col gap-3",
        cfg.card,
        isNew ? `scale-105 ring-2 ring-offset-2 ${cfg.ring}` : "",
      )}
    >
      {/* ── Ticket number ── */}
      <div className="flex items-start justify-between gap-2">
        <div className={cn("text-7xl font-black leading-none tabular-nums tracking-tighter", cfg.num)}>
          #{String(order.dailyTicket ?? 0).padStart(2, "0")}
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-mono font-bold text-zinc-400 dark:text-zinc-600 leading-none">
            {elapsedMin}m
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">ago</div>
        </div>
      </div>

      {/* ── Status ── */}
      <div className="flex items-center gap-2">
        <span className={cn("h-3 w-3 rounded-full shrink-0", cfg.dot)} />
        <span className={cn("text-xl font-bold", cfg.label)}>{fohStatus}</span>
        <span className="ml-auto text-lg">{sourceIcon}</span>
      </div>

      {/* ── Order type + table ── */}
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
          {ORDER_TYPE_LABEL[order.orderType] ?? order.orderType}
        </p>
        {order.tableNumber && (
          <p className="text-lg font-black text-amber-700 dark:text-amber-300">
            Table {order.tableNumber}
          </p>
        )}
      </div>

      {/* ── Item summary ── */}
      <div className="rounded-xl bg-black/5 dark:bg-white/5 px-3 py-2">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
          {order.items?.length ?? 0} line{(order.items?.length ?? 0) !== 1 ? "s" : ""} · {totalQty} item{totalQty !== 1 ? "s" : ""}
        </p>
        <div className="space-y-0.5">
          {order.items?.slice(0, 3).map((item) => (
            <p key={item.id} className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
              {item.quantity}× {item.itemNameSnapshot}
            </p>
          ))}
          {(order.items?.length ?? 0) > 3 && (
            <p className="text-xs text-zinc-400">+{(order.items?.length ?? 0) - 3} more</p>
          )}
        </div>
      </div>

      {/* ── Notes (if any) ── */}
      {(order.customerNotes || order.kitchenNotes) && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 italic truncate">
          "{order.customerNotes || order.kitchenNotes}"
        </p>
      )}
    </div>
  );
}
