"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { patchOrderStatus } from "@/lib/kds";
import { useOrdersStore } from "@/store/orders";
import { TimerRing } from "./TimerRing";
import type { KdsOrderStatus, OrderItem } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function nextAction(status: KdsOrderStatus): { label: string; to: KdsOrderStatus } | null {
  switch (status) {
    case "pending":   return { label: "Confirm",       to: "confirmed" };
    case "confirmed": return { label: "Start Cooking", to: "preparing" };
    case "preparing": return { label: "Mark Ready",    to: "ready" };
    case "ready":     return { label: "Complete",      to: "completed" };
    default:          return null;
  }
}

function canCancel(s: KdsOrderStatus) {
  return s === "pending" || s === "confirmed" || s === "preparing";
}

function urgencyStyles(elapsed: number) {
  if (elapsed >= 20) return { border: "border-rose-400 dark:border-rose-700", header: "bg-rose-50 dark:bg-rose-950/30" };
  if (elapsed >= 10) return { border: "border-amber-400 dark:border-amber-700", header: "bg-amber-50 dark:bg-amber-950/20" };
  return { border: "border-zinc-200 dark:border-zinc-800", header: "" };
}

const SOURCE_BADGE: Record<string, { label: string; color: string; icon: string }> = {
  pos:        { label: "POS",      color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",       icon: "🖥️" },
  online:     { label: "Online",   color: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300", icon: "🌐" },
  qr:         { label: "QR",       color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",         icon: "📱" },
  kiosk:      { label: "Kiosk",    color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300", icon: "📟" },
  whatsapp:   { label: "WhatsApp", color: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",    icon: "💬" },
  aggregator: { label: "Agg.",     color: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300", icon: "🛵" },
  group:      { label: "Group",    color: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",        icon: "👥" },
};

const PAYMENT_BADGE: Record<string, { label: string; color: string }> = {
  unpaid:   { label: "Unpaid",   color: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" },
  partial:  { label: "Partial",  color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  paid:     { label: "Paid",     color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  refunded: { label: "Refunded", color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
};

const ORDER_TYPE_LABEL: Record<string, string> = {
  dine_in:  "Dine In",
  takeaway: "Takeaway",
  delivery: "Delivery",
  catering: "Catering",
};

// ─── Component ────────────────────────────────────────────────────────────────

type Props = { order: OrderItem };

export function KitchenTicket({ order }: Props) {
  const updateOrderStatus = useOrdersStore((s) => s.updateOrderStatus);
  const removeOrder       = useOrdersStore((s) => s.removeOrder);

  const [now, setNow]     = useState(() => Date.now());
  const [busy, setBusy]   = useState<"primary" | "cancel" | null>(null);

  React.useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const elapsed = useMemo(() => {
    const ms = new Date(order.createdAt).getTime();
    return Number.isFinite(ms) ? Math.max(0, Math.floor((now - ms) / 60_000)) : 0;
  }, [now, order.createdAt]);

  const primary       = nextAction(order.status as KdsOrderStatus);
  const { border, header } = urgencyStyles(elapsed);
  const sourceCfg     = SOURCE_BADGE[order.orderSource] ?? SOURCE_BADGE.pos;
  const paymentCfg    = PAYMENT_BADGE[order.paymentStatus] ?? PAYMENT_BADGE.unpaid;

  async function doAction(to: KdsOrderStatus, kind: "primary" | "cancel") {
    setBusy(kind);
    const prev = order.status;
    updateOrderStatus(order.id, to);
    try {
      await patchOrderStatus(order.id, { status: to });
      if (to === "completed" || to === "cancelled" || to === "rejected") {
        removeOrder(order.id);
      }
    } catch (e: unknown) {
      updateOrderStatus(order.id, prev as KdsOrderStatus);
      toast.error(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={cn("rounded-2xl border-2 bg-white dark:bg-zinc-950 shadow-sm transition-colors overflow-hidden", border)}>

      {/* ── Header ── */}
      <div className={cn("px-4 py-3", header)}>
        <div className="flex items-start justify-between gap-2">
          {/* Left: ticket + badges */}
          <div className="min-w-0">
            {/* Big ticket number */}
            <div className="flex items-baseline gap-2 mb-1.5">
              <span className="text-3xl font-black tracking-tight leading-none">
                #{String(order.dailyTicket ?? 0).padStart(2, "0")}
              </span>
              <span className="text-xs text-zinc-400 font-mono truncate">{order.orderNumber}</span>
            </div>

            {/* Badge row */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Source */}
              <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold", sourceCfg.color)}>
                {sourceCfg.icon} {sourceCfg.label}
              </span>

              {/* Payment */}
              <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-bold", paymentCfg.color)}>
                {paymentCfg.label}
              </span>

              {/* Order type */}
              <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
                {ORDER_TYPE_LABEL[order.orderType] ?? order.orderType}
              </span>

              {/* Urgent */}
              {elapsed >= 20 && (
                <span className="rounded-md bg-rose-100 dark:bg-rose-950/60 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300 animate-pulse">
                  ⚠ URGENT
                </span>
              )}
            </div>

            {/* Table + time */}
            <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              {order.tableNumber && (
                <span className="font-bold text-amber-700 dark:text-amber-300">
                  Table {order.tableNumber}
                </span>
              )}
              {order.tableNumber && <span>·</span>}
              <span>{formatTime(order.createdAt)}</span>
              {order.estimatedPrepMinutes && (
                <>
                  <span>·</span>
                  <span>est. {order.estimatedPrepMinutes}min</span>
                </>
              )}
            </div>
          </div>

          {/* Right: timer ring */}
          <TimerRing elapsed={elapsed} size={56} />
        </div>
      </div>

      {/* ── Notes ── */}
      {(order.kitchenNotes || order.customerNotes) && (
        <div className="border-b border-zinc-100 dark:border-zinc-800 bg-amber-50/60 dark:bg-amber-950/20 px-4 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300 mb-0.5">Note</p>
          <p className="text-sm text-zinc-800 dark:text-zinc-100 whitespace-pre-wrap leading-snug">
            {order.kitchenNotes || order.customerNotes}
          </p>
        </div>
      )}

      {/* ── Items ── */}
      <div className="p-3 space-y-1.5">
        {order.items?.map((item) => (
          <div
            key={item.id}
            className={cn(
              "rounded-xl border px-3 py-2.5 transition-colors",
              item.status === "ready"
                ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
                : item.status === "cancelled" || item.status === "voided"
                  ? "border-rose-200 bg-rose-50/30 opacity-60 dark:border-rose-900"
                  : "border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm leading-snug">
                  <span className="text-primary">{item.quantity}×</span>{" "}
                  {item.itemNameSnapshot}
                  {item.status === "ready" && <span className="ml-1 text-emerald-600 text-xs">✓</span>}
                </p>
                {item.specialInstructions && (
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 italic">
                    "{item.specialInstructions}"
                  </p>
                )}
              </div>
              <span className="text-xs text-zinc-400 tabular-nums shrink-0">
                Rs.{item.lineTotal}
              </span>
            </div>

            {/* Modifiers */}
            {!!item.modifiers?.length && (
              <div className="mt-1.5 pl-2 space-y-0.5 border-l-2 border-zinc-200 dark:border-zinc-700">
                {item.modifiers.map((mod) => (
                  <div key={mod.id} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 dark:text-zinc-300">
                      {mod.quantity && mod.quantity > 1 ? `${mod.quantity}× ` : ""}
                      {mod.modifierNameSnapshot}
                      {mod.groupNameSnapshot && (
                        <span className="ml-1 text-zinc-400">({mod.groupNameSnapshot})</span>
                      )}
                    </span>
                    {Number(mod.priceDeltaSnapshot) !== 0 && (
                      <span className="text-zinc-400 ml-2 shrink-0">
                        +Rs.{Number(mod.priceDeltaSnapshot).toFixed(2)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Summary row ── */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>
          {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? "s" : ""}
          {" · "}
          {order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0} qty
        </span>
        <span className="font-bold text-foreground tabular-nums">
          Rs. {Number(order.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* ── Actions ── */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 px-3 py-3">
        <div className="flex gap-2">
          {primary && (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => doAction(primary.to, "primary")}
              className="flex-1 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 touch-manipulation"
            >
              {busy === "primary" ? "Updating…" : primary.label}
            </button>
          )}
          {canCancel(order.status as KdsOrderStatus) && (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => doAction("cancelled", "cancel")}
              className="rounded-xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30 touch-manipulation"
            >
              {busy === "cancel" ? "…" : "Cancel"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
