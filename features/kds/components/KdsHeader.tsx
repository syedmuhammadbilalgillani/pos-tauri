"use client";

import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

type ConnectionStatus = "connected" | "connecting" | "disconnected" | "error";

type Props = {
  totalActive: number;
  connection: ConnectionStatus;
  connectionError?: string | null;
  lastSyncedAt?: string | null;
  loading?: boolean;
  onRefresh: () => void;
};

const CONNECTION_CONFIG: Record<ConnectionStatus, { label: string; dot: string; badge: string }> = {
  connected: {
    label: "Live",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800",
  },
  connecting: {
    label: "Connecting…",
    dot: "bg-amber-400 animate-pulse",
    badge: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800",
  },
  disconnected: {
    label: "Disconnected",
    dot: "bg-zinc-400",
    badge: "bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
  },
  error: {
    label: "Error",
    dot: "bg-rose-500 animate-pulse",
    badge: "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800",
  },
};

export function KdsHeader({
  totalActive,
  connection,
  connectionError,
  lastSyncedAt,
  loading,
  onRefresh,
}: Props) {
  const cfg = CONNECTION_CONFIG[connection] ?? CONNECTION_CONFIG.error;

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-3 shrink-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Kitchen Display</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {totalActive} active order{totalActive !== 1 ? "s" : ""}
            </p>
          </div>

          <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", cfg.badge)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
            {cfg.label}
          </span>

          {connection !== "connected" && connectionError && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[200px]">
              {connectionError}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {lastSyncedAt && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500 hidden sm:block">
              Synced {new Date(lastSyncedAt).toLocaleTimeString()}
            </span>
          )}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>
    </div>
  );
}
