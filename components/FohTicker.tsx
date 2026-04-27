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
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close().catch(() => {});
    }, 180);
  } catch {
    // ignore
  }
}

export function FohTicker({
  orders,
  enableReadyAlert = true,
}: {
  orders: OrderWithItems[];
  enableReadyAlert?: boolean;
}) {
  const sorted = useMemo(() => {
    return [...orders].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [orders]);

  const prevReadyIds = useRef<Set<string>>(new Set());
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const readyIds = new Set(sorted.filter((o) => o.status === "ready").map((o) => o.id));
    if (enableReadyAlert) {
      for (const id of readyIds) {
        if (!prevReadyIds.current.has(id)) {
          playBeep();
          setFlash(true);
          setTimeout(() => setFlash(false), 600);
          break;
        }
      }
    }
    prevReadyIds.current = readyIds;
  }, [sorted, enableReadyAlert]);

  return (
    <div
      className={[
        "flex-1 flex flex-col",
        flash ? "bg-emerald-50 dark:bg-emerald-950/20" : "",
      ].join(" ")}
    >
      <div className="px-10 py-8 flex items-center justify-between">
        <div>
          <div className="text-4xl font-semibold tracking-tight">Now Serving</div>
          <div className="mt-2 text-lg text-zinc-600 dark:text-zinc-300">
            Preparing • Ready • Completed
          </div>
        </div>
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          Auto-updates in realtime
        </div>
      </div>

      <div className="flex-1 px-10 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sorted.map((o) => (
            <div
              key={o.id}
              className={[
                "rounded-3xl border p-8",
                o.status === "ready"
                  ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40"
                  : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950",
              ].join(" ")}
            >
              <div className="flex items-baseline justify-between">
                <div className="text-6xl font-bold tracking-tight">#{String(o.orderNumber)}</div>
                <div
                  className={[
                    "text-2xl font-semibold",
                    o.status === "ready"
                      ? "text-emerald-800 dark:text-emerald-200"
                      : o.status === "completed"
                        ? "text-zinc-600 dark:text-zinc-300"
                        : "text-amber-700 dark:text-amber-200",
                  ].join(" ")}
                >
                  {normalizeFohStatus(o.status)}
                </div>
              </div>
            </div>
          ))}
          {sorted.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-200 bg-white p-10 text-2xl text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              No active orders.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

