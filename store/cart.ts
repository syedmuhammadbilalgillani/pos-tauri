"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem, OrderType } from "@/features/pos/types";
import { v4 as uuidv4 } from "uuid";

type CartStore = {
  items: CartItem[];
  orderType: OrderType;
  tableNumber: string;
  customerNotes: string;
  kitchenNotes: string;
  ticketToken: string | null;
  orderId: string | null;

  setItems: (items: CartItem[]) => void;
  addItem: (item: CartItem) => void;
  updateItem: (localId: string, updates: Partial<CartItem>) => void;
  removeItem: (localId: string) => void;
  incQty: (localId: string) => void;
  decQty: (localId: string) => void;
  setOrderType: (type: OrderType) => void;
  setTableNumber: (n: string) => void;
  setCustomerNotes: (n: string) => void;
  setKitchenNotes: (n: string) => void;
  setTicketToken: (token: string | null) => void;
  setOrderId: (id: string | null) => void;
  clear: () => void;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      orderType: "takeaway",
      tableNumber: "",
      customerNotes: "",
      kitchenNotes: "",
      ticketToken: null,
      orderId: null,

      setItems: (items) => set({ items }),

      addItem: (item) =>
        set((s) => {
          // If no modifiers, bump existing matching line
          if (!item.modifiers?.length) {
            const idx = s.items.findIndex(
              (l) =>
                l.menuItemId === item.menuItemId &&
                !l.modifiers?.length &&
                !l.specialInstructions,
            );
            if (idx !== -1) {
              const items = s.items.map((l, i) =>
                i === idx ? { ...l, quantity: l.quantity + 1 } : l,
              );
              return { items };
            }
          }
          return {
            items: [
              ...s.items,
              { ...item, _localId: item._localId || uuidv4() },
            ],
          };
        }),

      updateItem: (localId, updates) =>
        set((s) => ({
          items: s.items.map((l) =>
            l._localId === localId ? { ...l, ...updates } : l,
          ),
        })),

      removeItem: (localId) =>
        set((s) => ({
          items: s.items.filter((l) => l._localId !== localId),
        })),

      incQty: (localId) =>
        set((s) => ({
          items: s.items.map((l) =>
            l._localId === localId ? { ...l, quantity: l.quantity + 1 } : l,
          ),
        })),

      decQty: (localId) =>
        set((s) => ({
          items: s.items.map((l) =>
            l._localId === localId
              ? { ...l, quantity: Math.max(1, l.quantity - 1) }
              : l,
          ),
        })),

      setOrderType: (orderType) => set({ orderType }),
      setTableNumber: (tableNumber) => set({ tableNumber }),
      setCustomerNotes: (customerNotes) => set({ customerNotes }),
      setKitchenNotes: (kitchenNotes) => set({ kitchenNotes }),
      setTicketToken: (ticketToken) => set({ ticketToken }),
      setOrderId: (orderId) => set({ orderId }),

      clear: () =>
        set({
          items: [],
          tableNumber: "",
          customerNotes: "",
          kitchenNotes: "",
          ticketToken: null,
          orderId: null,
        }),
    }),
    {
      name: "pos-cart",
      storage: createJSONStorage(() => localStorage),
      // Only persist cart data, not session-specific stuff
      partialize: (s) => ({
        items: s.items,
        orderType: s.orderType,
        tableNumber: s.tableNumber,
        customerNotes: s.customerNotes,
        kitchenNotes: s.kitchenNotes,
        ticketToken: s.ticketToken,
        orderId: s.orderId,
      }),
    },
  ),
);
