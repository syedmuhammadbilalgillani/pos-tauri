"use client";

import { create } from "zustand";
import type { KdsItemStatus, KdsOrderStatus, OrderWithItems } from "@/types";

type OrdersState = {
  ordersById: Record<string, OrderWithItems>;
  orderIds: string[];
  nextCursor: string | null;
  lastSyncedAt: string | null;

  setFromFeed: (orders: OrderWithItems[], nextCursor: string | null) => void;
  upsertOrder: (order: OrderWithItems) => void;
  updateOrderStatus: (orderId: string, toStatus: KdsOrderStatus) => void;
  updateItemStatus: (orderId: string, orderItemId: string, status: KdsItemStatus) => void;
  removeOrder: (orderId: string) => void;
  reset: () => void;
};

function sortOrderIds(ordersById: Record<string, OrderWithItems>): string[] {
  return Object.values(ordersById)
    .sort((a, b) => {
      const at = Date.parse(a.createdAt);
      const bt = Date.parse(b.createdAt);
      return bt - at;
    })
    .map((o) => o.id);
}

export const useOrdersStore = create<OrdersState>((set) => ({
  ordersById: {},
  orderIds: [],
  nextCursor: null,
  lastSyncedAt: null,

  setFromFeed: (orders, nextCursor) =>
    set(() => {
      const ordersById: Record<string, OrderWithItems> = {};
      for (const o of orders) ordersById[o.id] = o;
      return {
        ordersById,
        orderIds: sortOrderIds(ordersById),
        nextCursor,
        lastSyncedAt: new Date().toISOString(),
      };
    }),

  upsertOrder: (order) =>
    set((s) => {
      const ordersById = { ...s.ordersById, [order.id]: order };
      return { ordersById, orderIds: sortOrderIds(ordersById) };
    }),

  updateOrderStatus: (orderId, toStatus) =>
    set((s) => {
      const existing = s.ordersById[orderId];
      if (!existing) return s;
      const ordersById = {
        ...s.ordersById,
        [orderId]: { ...existing, status: toStatus },
      };
      return { ordersById, orderIds: sortOrderIds(ordersById) };
    }),

  updateItemStatus: (orderId, orderItemId, status) =>
    set((s) => {
      const existing = s.ordersById[orderId];
      if (!existing) return s;
      const items = existing.items.map((it) =>
        it.id === orderItemId ? { ...it, status } : it
      );
      const ordersById = {
        ...s.ordersById,
        [orderId]: { ...existing, items },
      };
      return { ordersById, orderIds: sortOrderIds(ordersById) };
    }),

  removeOrder: (orderId) =>
    set((s) => {
      const ordersById = { ...s.ordersById };
      delete ordersById[orderId];
      return { ordersById, orderIds: sortOrderIds(ordersById) };
    }),

  reset: () =>
    set({
      ordersById: {},
      orderIds: [],
      nextCursor: null,
      lastSyncedAt: null,
    }),
}));

