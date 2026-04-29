"use client";

import type { KdsOrderStatus, OrderWithItems } from "@/types";
import { patchOrderStatus } from "@/lib/kds";
import { useOrdersStore } from "@/store/orders";
import React, { useMemo, useState } from "react";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function minutesSince(iso: string) {
  const created = new Date(iso).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - created) / 1000 / 60));
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

export function OrderCard({ order }: { order: OrderWithItems }) {
  const updateOrderStatus = useOrdersStore((s) => s.updateOrderStatus);
  const removeOrder = useOrdersStore((s) => s.removeOrder);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState<null | "primary" | "cancel">(null);
  const [error, setError] = useState("");

  const primary = useMemo(
    () => nextPrimaryAction(order.status),
    [order.status],
  );
  React.useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const createdMs = new Date(order.createdAt).getTime();
  const elapsed = Number.isFinite(createdMs)
    ? Math.max(0, Math.floor((now - createdMs) / 60000))
    : 0;
  async function doPatchStatus(to: KdsOrderStatus, kind: "primary" | "cancel") {
    setError("");
    setBusy(kind);

    const prev = order.status;

    updateOrderStatus(order.id, to);

    try {
      await patchOrderStatus(order.id, { status: to });

      if (to === "completed" || to === "cancelled" || to === "rejected") {
        removeOrder(order.id);
      }
    } catch (e: unknown) {
      updateOrderStatus(order.id, prev);

      const msg = e instanceof Error ? e.message : "Failed to update status";

      setError(msg);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-100 p-4 dark:border-zinc-800">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight">
                #{order.orderNumber}
              </h2>

              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${statusBadge(
                  order.status,
                )}`}
              >
                {order.status}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span>{formatTime(order.createdAt)}</span>
              <span>•</span>
              <span className="capitalize">{order.orderType}</span>
              <span>•</span>
              <span className="capitalize">{order.orderSource}</span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 px-3 py-2 text-center dark:border-zinc-700">
            <div className="text-[11px] text-zinc-500">Waiting</div>
            <div className="text-lg font-bold">{elapsed}m</div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {(order.kitchenNotes || order.customerNotes) && (
        <div className="border-b border-zinc-100 p-4 dark:border-zinc-800">
          <div className="rounded-xl bg-amber-50 p-3 text-sm dark:bg-amber-950/30">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
              Kitchen Notes
            </div>

            <div className="whitespace-pre-wrap text-zinc-800 dark:text-zinc-100">
              {order.kitchenNotes || order.customerNotes}
            </div>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="space-y-3 p-4">
        {order.items?.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold">
                  {item.quantity}× {item.itemNameSnapshot || item.name}
                </div>

                {item.specialInstructions || item.note ? (
                  <div className="mt-1 text-sm text-zinc-500">
                    {item.specialInstructions || item.note}
                  </div>
                ) : null}
              </div>

              <div className="text-right">
                <div className="text-sm font-semibold">
                  Rs. {item.lineTotal}
                </div>

                {item.status ? (
                  <div className="text-xs text-zinc-500 capitalize">
                    {item.status}
                  </div>
                ) : null}
              </div>
            </div>

            {!!item.modifiers?.length && (
              <div className="mt-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Modifiers
                </div>

                <div className="space-y-1">
                  {item.modifiers.map((mod) => (
                    <div
                      key={mod.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div>
                        {mod.quantity ? `${mod.quantity}× ` : ""}
                        {mod.modifierNameSnapshot || mod.name}
                      </div>

                      <div className="text-zinc-500">
                        + Rs. {mod.priceDeltaSnapshot}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
        <div className="flex flex-wrap gap-3">
          {primary && (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => doPatchStatus(primary.to, "primary")}
              className="flex-1 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-zinc-900"
            >
              {busy === "primary" ? "Processing..." : primary.label}
            </button>
          )}

          {canCancel(order.status) && (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => doPatchStatus("cancelled", "cancel")}
              className="rounded-xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900 dark:text-rose-200 dark:hover:bg-rose-950/30"
            >
              {busy === "cancel" ? "..." : "Cancel"}
            </button>
          )}
        </div>

        {error ? (
          <div className="mt-3 text-sm text-rose-600">{error}</div>
        ) : null}
      </div>
    </div>
  );
}
