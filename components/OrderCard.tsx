"use client";

import type { KdsOrderStatus, OrderItem } from "@/types";
import { patchOrderStatus } from "@/lib/kds";
import { useOrdersStore } from "@/store/orders";
import { toast } from "sonner";
import React, { useMemo, useState } from "react";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(status: KdsOrderStatus) {
  const map: Record<string, string> = {
    pending: "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
    confirmed: "bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100",
    preparing:
      "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
    ready:
      "bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
    completed: "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
    cancelled: "bg-rose-50 text-rose-900 dark:bg-rose-950 dark:text-rose-100",
    rejected: "bg-rose-50 text-rose-900 dark:bg-rose-950 dark:text-rose-100",
  };
  return (
    map[status] ??
    "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
  );
}

function urgencyBorder(elapsed: number) {
  if (elapsed >= 20) return "border-rose-400 dark:border-rose-700";
  if (elapsed >= 10) return "border-amber-400 dark:border-amber-700";
  return "border-zinc-200 dark:border-zinc-800";
}

function urgencyHeader(elapsed: number) {
  if (elapsed >= 20) return "bg-rose-50 dark:bg-rose-950/30";
  if (elapsed >= 10) return "bg-amber-50 dark:bg-amber-950/20";
  return "";
}

function nextPrimaryAction(status: KdsOrderStatus) {
  switch (status) {
    case "pending":
      return { label: "Confirm", to: "confirmed" as const };
    case "confirmed":
      return { label: "Start Cooking", to: "preparing" as const };
    case "preparing":
      return { label: "Mark Ready", to: "ready" as const };
    case "ready":
      return { label: "Complete", to: "completed" as const };
    default:
      return null;
  }
}

function canCancel(status: KdsOrderStatus) {
  return (
    status === "pending" || status === "confirmed" || status === "preparing"
  );
}

export function OrderCard({ order }: { order: OrderItem }) {
  const updateOrderStatus = useOrdersStore((s) => s.updateOrderStatus);
  const removeOrder = useOrdersStore((s) => s.removeOrder);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState<null | "primary" | "cancel">(null);

  const primary = useMemo(
    () => nextPrimaryAction(order?.status as KdsOrderStatus),
    [order?.status],
  );

  React.useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const createdMs = new Date(order?.createdAt).getTime();
  const elapsed = Number.isFinite(createdMs)
    ? Math.max(0, Math.floor((now - createdMs) / 60000))
    : 0;

  async function doPatchStatus(to: KdsOrderStatus, kind: "primary" | "cancel") {
    setBusy(kind);
    const prev = order?.status;
    updateOrderStatus(order?.id, to);

    try {
      await patchOrderStatus(order?.id, { status: to });
      if (to === "completed" || to === "cancelled" || to === "rejected") {
        removeOrder(order?.id);
      }
    } catch (e: unknown) {
      updateOrderStatus(order?.id, prev as KdsOrderStatus);
      const msg = e instanceof Error ? e.message : "Failed to update status";
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className={`rounded-2xl border-2 bg-white shadow-sm dark:bg-zinc-950 transition-colors ${urgencyBorder(elapsed)}`}
    >
      {/* Header */}
      <div
        className={`rounded-t-2xl border-b border-zinc-100 dark:border-zinc-800 px-4 py-3 ${urgencyHeader(elapsed)}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight">
                #{order?.orderNumber}
              </h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${statusBadge(order?.status as KdsOrderStatus)}`}
              >
                {order?.status}
              </span>
              {elapsed >= 20 && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                  ⚠ Urgent
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span>{formatTime(order?.createdAt)}</span>
              <span>·</span>
              <span className="capitalize">{order?.orderType}</span>
              <span>·</span>
              <span className="capitalize">{order?.orderSource}</span>
            </div>
          </div>

          {/* Elapsed timer */}
          <div
            className={`rounded-xl border px-3 py-1.5 text-center shrink-0 ${
              elapsed >= 20
                ? "border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40"
                : elapsed >= 10
                  ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
                  : "border-zinc-200 dark:border-zinc-700"
            }`}
          >
            <div className="text-[10px] uppercase tracking-wide text-zinc-500">
              Wait
            </div>
            <div
              className={`text-lg font-bold tabular-nums leading-none ${
                elapsed >= 20
                  ? "text-rose-700 dark:text-rose-300"
                  : elapsed >= 10
                    ? "text-amber-700 dark:text-amber-300"
                    : ""
              }`}
            >
              {elapsed}m
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {(order?.kitchenNotes || order?.customerNotes) && (
        <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <div className="rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-950/30">
            <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
              Notes
            </p>
            <p className="text-sm text-zinc-800 dark:text-zinc-100 whitespace-pre-wrap">
              {order?.kitchenNotes || order?.customerNotes}
            </p>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="space-y-2 p-4">
        {order?.items?.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold leading-snug">
                  <span className="text-primary">{item.quantity}×</span>{" "}
                  {item.itemNameSnapshot }
                </p>
                {item.specialInstructions ? (
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {item.specialInstructions}
                  </p>
                ) : null}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold">Rs. {item.lineTotal}</p>
                {item.status ? (
                  <p className="text-xs capitalize text-zinc-400">
                    {item.status}
                  </p>
                ) : null}
              </div>
            </div>

            {!!item.modifiers?.length && (
              <div className="mt-2 rounded-lg bg-white p-2 dark:bg-zinc-950">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                  Modifiers
                </p>
                <div className="space-y-0.5">
                  {item.modifiers.map((mod) => (
                    <div
                      key={mod.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {mod.quantity ? `${mod.quantity}× ` : ""}
                          {mod.modifierNameSnapshot}
                      </span>
                      <span className="text-zinc-400">
                        +Rs. {mod.priceDeltaSnapshot}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="rounded-b-2xl border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <div className="flex flex-wrap gap-2">
          {primary && (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => doPatchStatus(primary.to, "primary")}
              className="flex-1 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {busy === "primary" ? "Updating…" : primary.label}
            </button>
          )}
          {canCancel(order?.status as KdsOrderStatus) && (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => doPatchStatus("cancelled", "cancel")}
              className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
            >
              {busy === "cancel" ? "…" : "Cancel"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
