"use client";

import type { KdsOrderStatus, OrderWithItems } from "@/types";
import { useEffect, useMemo, useRef, useState } from "react";

function normalizeFohStatus(s: KdsOrderStatus): "Preparing" | "Ready" | "Completed" {
  if (s === "ready") return "Ready";
  if (s === "completed") return "Completed";
  return "Preparing";
}

function playBeep() {
  try {
    const maybeWebkit = (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
    const AudioCtx = (window.AudioContext || maybeWebkit) as typeof AudioContext | undefined;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Two-tone pleasant chime
    [880, 1108].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.4);
    });

    setTimeout(() => ctx.close().catch(() => {}), 1500);
  } catch {
    // ignore
  }
}

const STATUS_CONFIG = {
  Preparing: {
    card:  "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
    label: "text-amber-700 dark:text-amber-300",
    dot:   "bg-amber-400 animate-pulse",
    num:   "text-amber-900 dark:text-amber-100",
  },
  Ready: {
    card:  "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/50 shadow-emerald-100 dark:shadow-emerald-900/30 shadow-lg",
    label: "text-emerald-700 dark:text-emerald-300",
    dot:   "bg-emerald-500",
    num:   "text-emerald-900 dark:text-emerald-100",
  },
  Completed: {
    card:  "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50 opacity-60",
    label: "text-zinc-500 dark:text-zinc-400",
    dot:   "bg-zinc-400",
    num:   "text-zinc-500 dark:text-zinc-400",
  },
} as const;

function Clock() {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return <>{time}</>;
}

export function FohTicker({
  orders,
  enableReadyAlert = true,
}: {
  orders: OrderWithItems[];
  enableReadyAlert?: boolean;
}) {
  const sorted = useMemo(() => {
    return [...orders].sort((a, b) => {
      // Ready orders first, then by creation time
      const priority = (s: string) => s === "ready" ? 0 : s === "preparing" ? 1 : 2;
      const pd = priority(a.status) - priority(b.status);
      if (pd !== 0) return pd;
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });
  }, [orders]);

  const prevReadyIds = useRef<Set<string>>(new Set());
  const [flash, setFlash] = useState(false);
  const [newReadyId, setNewReadyId] = useState<string | null>(null);

  useEffect(() => {
    const readyIds = new Set(sorted.filter((o) => o.status === "ready").map((o) => o.id));
    if (enableReadyAlert) {
      for (const id of readyIds) {
        if (!prevReadyIds.current.has(id)) {
          playBeep();
          setFlash(true);
          setNewReadyId(id);
          setTimeout(() => { setFlash(false); setNewReadyId(null); }, 2000);
          break;
        }
      }
    }
    prevReadyIds.current = readyIds;
  }, [sorted, enableReadyAlert]);

  const readyCount = sorted.filter((o) => o.status === "ready").length;
  const preparingCount = sorted.filter((o) => o.status === "preparing").length;

  return (
    <div
      className={[
        "flex-1 flex flex-col min-h-0 transition-colors duration-500",
        flash ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-zinc-50 dark:bg-zinc-950",
      ].join(" ")}
    >
      {/* Header bar */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Now Serving</h1>
            <div className="mt-1 flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
              {readyCount > 0 && (
                <span className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {readyCount} ready
                </span>
              )}
              {preparingCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  {preparingCount} preparing
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold tabular-nums text-zinc-700 dark:text-zinc-200">
              <Clock />
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">Live updates</div>
          </div>
        </div>
      </div>

      {/* Order grid */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {sorted.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="rounded-3xl border border-dashed border-zinc-200 bg-white px-16 py-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
              <div className="text-5xl font-bold text-zinc-200 dark:text-zinc-700">—</div>
              <div className="mt-2 text-lg text-zinc-500 dark:text-zinc-400">No active orders</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {sorted.map((o) => {
              const fohStatus = normalizeFohStatus(o.status);
              const cfg = STATUS_CONFIG[fohStatus];
              const isNew = o.id === newReadyId;

              return (
                <div
                  key={o.id}
                  className={[
                    "rounded-2xl border-2 p-6 transition-all duration-500",
                    cfg.card,
                    isNew ? "scale-105 ring-2 ring-emerald-400 ring-offset-2" : "",
                  ].join(" ")}
                >
                  {/* Order number */}
                  <div className={`text-7xl font-black leading-none tabular-nums tracking-tighter ${cfg.num}`}>
                    #{String(o.orderNumber).padStart(2, "0")}
                  </div>

                  {/* Status */}
                  <div className="mt-3 flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${cfg.dot}`} />
                    <span className={`text-lg font-bold ${cfg.label}`}>{fohStatus}</span>
                  </div>

                  {/* Order type */}
                  <div className="mt-1 text-sm capitalize text-zinc-400 dark:text-zinc-500">
                    {o.orderType?.replace("_", " ") ?? ""}
                    {o.tableNumber ? ` · Table ${o.tableNumber}` : ""}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
