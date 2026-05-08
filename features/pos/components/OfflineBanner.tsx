"use client";

import { useOfflineStore } from "@/store/offline";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { syncOfflineOrders } from "@/lib/offline/sync";

export function OfflineBanner() {
  const networkStatus = useOfflineStore((s) => s.networkStatus);
  const isSyncing = useOfflineStore((s) => s.isSyncing);
  const pendingOrders = useOfflineStore((s) => s.pendingOrders);
  const lastSyncAt = useOfflineStore((s) => s.lastSyncAt);

  const pendingCount = pendingOrders.filter((o) => o.status === "pending" || o.status === "failed").length;
  const failedCount = pendingOrders.filter((o) => o.status === "failed").length;

  if (networkStatus === "online" && pendingCount === 0) return null;

  // Just synced — show brief success
  if (networkStatus === "online" && pendingCount === 0 && lastSyncAt) {
    return null;
  }

  if (networkStatus === "offline") {
    return (
      <div className="flex items-center gap-3 bg-amber-500 px-4 py-2 text-white text-sm font-medium">
        <WifiOff className="size-4 shrink-0" />
        <span className="flex-1">
          Offline mode — orders will sync when internet returns
          {pendingCount > 0 && (
            <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
              {pendingCount} queued
            </span>
          )}
        </span>
      </div>
    );
  }

  // Online but has pending orders waiting to sync
  if (networkStatus === "online" && pendingCount > 0) {
    return (
      <div className="flex items-center gap-3 bg-blue-600 px-4 py-2 text-white text-sm font-medium">
        {isSyncing ? (
          <RefreshCw className="size-4 shrink-0 animate-spin" />
        ) : (
          <CheckCircle2 className="size-4 shrink-0" />
        )}
        <span className="flex-1">
          {isSyncing
            ? "Syncing offline orders…"
            : `${pendingCount} order${pendingCount > 1 ? "s" : ""} waiting to sync`}
          {failedCount > 0 && !isSyncing && (
            <span className="ml-2 text-red-200 text-xs">({failedCount} failed)</span>
          )}
        </span>
        {!isSyncing && (
          <button
            onClick={() => void syncOfflineOrders()}
            className="rounded-md bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30 transition-colors"
          >
            Sync now
          </button>
        )}
      </div>
    );
  }

  return null;
}
