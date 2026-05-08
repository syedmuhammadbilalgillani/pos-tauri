"use client";

import { create } from "zustand";
import type { OfflineOrderRow } from "@/lib/offline/db";

type NetworkStatus = "online" | "offline" | "unknown";

type OfflineState = {
  networkStatus: NetworkStatus;
  isSyncing: boolean;
  lastSyncAt: number | null;
  pendingOrders: OfflineOrderRow[];

  setNetworkStatus: (status: NetworkStatus) => void;
  setSyncing: (syncing: boolean) => void;
  setLastSyncAt: (ts: number) => void;
  setPendingOrders: (orders: OfflineOrderRow[]) => void;
  addPendingOrder: (order: OfflineOrderRow) => void;
  removePendingOrder: (localId: string) => void;
};

export const useOfflineStore = create<OfflineState>((set) => ({
  networkStatus: "unknown",
  isSyncing: false,
  lastSyncAt: null,
  pendingOrders: [],

  setNetworkStatus: (networkStatus) => set({ networkStatus }),
  setSyncing: (isSyncing) => set({ isSyncing }),
  setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
  setPendingOrders: (pendingOrders) => set({ pendingOrders }),
  addPendingOrder: (order) =>
    set((s) => ({
      pendingOrders: [order, ...s.pendingOrders.filter((o) => o.local_id !== order.local_id)],
    })),
  removePendingOrder: (localId) =>
    set((s) => ({
      pendingOrders: s.pendingOrders.filter((o) => o.local_id !== localId),
    })),
}));
