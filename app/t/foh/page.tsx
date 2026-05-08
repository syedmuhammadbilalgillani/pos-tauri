"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { useOrdersStore } from "@/store/orders";
import { FohHeader } from "@/features/foh/components/FohHeader";
import { OrderGrid } from "@/features/foh/components/OrderGrid";
import { ReadyAlert } from "@/features/foh/components/ReadyAlert";
import { cn } from "@/lib/utils";
import type { KdsOrderStatus, OrderItem } from "@/types";

function playBeep() {
  try {
    const maybeWebkit = (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    const AudioCtx = (window.AudioContext || maybeWebkit) as typeof AudioContext | undefined;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
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
  } catch { /* ignore */ }
}

function sortFoh(orders: OrderItem[]) {
  return [...orders].sort((a, b) => {
    const priority = (s: string) => (s === "ready" ? 0 : s === "preparing" ? 1 : 2);
    const pd = priority(a.status) - priority(b.status);
    return pd !== 0 ? pd : Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });
}

export default function FohPage() {
  useRealtimeOrders("foh");

  const ordersById = useOrdersStore((s) => s.ordersById);
  const orderIds   = useOrdersStore((s) => s.orderIds);

  const orders = useMemo(() => orderIds.map((id) => ordersById[id]).filter(Boolean), [orderIds, ordersById]);
  const sorted = useMemo(() => sortFoh(orders), [orders]);

  const prevReadyIds = useRef<Set<string>>(new Set());
  const [flash, setFlash]         = useState(false);
  const [newReadyId, setNewReadyId] = useState<string | null>(null);

  useEffect(() => {
    const readyIds = new Set(sorted.filter((o) => o.status === "ready").map((o) => o.id));
    for (const id of readyIds) {
      if (!prevReadyIds.current.has(id)) {
        playBeep();
        setFlash(true);
        setNewReadyId(id);
        setTimeout(() => { setFlash(false); setNewReadyId(null); }, 2500);
        break;
      }
    }
    prevReadyIds.current = readyIds;
  }, [sorted]);

  const readyCount     = sorted.filter((o) => o.status === "ready").length;
  const preparingCount = sorted.filter((o) => (o.status as KdsOrderStatus) === "preparing" || (o.status as KdsOrderStatus) === "confirmed" || o.status === "pending").length;
  const completedCount = sorted.filter((o) => o.status === "completed").length;
  const totalActive    = sorted.filter((o) => o.status !== "completed" && o.status !== "cancelled").length;

  return (
    <div className={cn("flex h-dvh flex-col transition-colors duration-500", flash ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-zinc-50 dark:bg-zinc-950")}>
      <ReadyAlert flash={flash} />

      <FohHeader
        readyCount={readyCount}
        preparingCount={preparingCount}
        completedCount={completedCount}
        totalActive={totalActive}
      />

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <OrderGrid orders={sorted} newReadyId={newReadyId} />
      </div>
    </div>
  );
}
