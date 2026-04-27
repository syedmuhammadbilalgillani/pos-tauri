"use client";

import { fetchKdsOrders } from "@/lib/kds";
import { createRealtimeSocket } from "@/lib/socket";
import { playNewOrderTone } from "@/lib/sound";
import { useOrdersStore } from "@/store/orders";
import type {
  KdsOrderStatus,
  OrderWithItems,
  SocketOrderCreated,
  SocketOrderItemStatusChanged,
  SocketOrderStatusChanged,
} from "@/types";
import { useEffect, useMemo, useRef, useState } from "react";

type Mode = "kds" | "foh";

export type RealtimeConnectionState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

const KDS_STATUSES = ["pending", "confirmed", "preparing", "ready"] as const;
const FOH_STATUSES = ["preparing", "ready", "completed"] as const;

export function useRealtimeOrders(mode: Mode) {
  const setFromFeed = useOrdersStore((s) => s.setFromFeed);
  const updateOrderStatus = useOrdersStore((s) => s.updateOrderStatus);
  const updateItemStatus = useOrdersStore((s) => s.updateItemStatus);

  const statuses = useMemo(() => {
    return (mode === "kds" ? [...KDS_STATUSES] : [...FOH_STATUSES]) as KdsOrderStatus[];
  }, [mode]);

  const hasEverConnected = useRef(false);

  const [connection, setConnection] = useState<RealtimeConnectionState>("connecting");
  const [connectionError, setConnectionError] = useState("");

  async function refetch() {
    const res = await fetchKdsOrders({
      status: statuses,
      limit: 30,
      cursor: null,
    });
    setFromFeed(res?.data as OrderWithItems[], res?.nextCursor as string | null);
  }

  useEffect(() => {
    let socket: Awaited<ReturnType<typeof createRealtimeSocket>> | null = null;
    let cancelled = false;

    // setConnection("connecting");
    // setConnectionError("");

    (async () => {
      try {
        await refetch();
      } catch {
        // ignore
      }

      if (cancelled) return;

      try {
        socket = await createRealtimeSocket();
      } catch (e: unknown) {
        if (cancelled) return;
        setConnection("error");
        setConnectionError(e instanceof Error ? e.message : "Failed to create socket");
        return;
      }

      if (cancelled) {
        socket.disconnect();
        return;
      }

      socket.on("connect", () => {
        // This means transport connected; gateway may still reject before "connected"
        if (!hasEverConnected.current) setConnection("connecting");
      });

      socket.on("connected", (p: unknown) => {
        hasEverConnected.current = true;
        setConnection("connected");
        setConnectionError("");
        // Optional: see the room/tenant/location in console
        // console.log("connected payload", p);
        void p;
      });

      socket.on("disconnect", (reason) => {
        if (cancelled) return;
        setConnection("disconnected");
        setConnectionError(String(reason ?? ""));
      });

      socket.on("connect_error", (err: Error) => {
        if (cancelled) return;
        setConnection("error");
        setConnectionError(err?.message ?? "connect_error");
      });

      socket.on("order.status_changed", (evt: SocketOrderStatusChanged) => {
        updateOrderStatus(evt.orderId, evt.toStatus);
      });

      socket.on("order.item_status_changed", (evt: SocketOrderItemStatusChanged) => {
        updateItemStatus(evt.orderId, evt.orderItemId, evt.status);
      });

      socket.on("order.created", async (_evt: SocketOrderCreated) => {
        try {
          playNewOrderTone();
          await refetch();
        } catch {
          // ignore
        }
      });

      socket.io.on("reconnect", async () => {
        try {
          await refetch();
        } catch {
          // ignore
        }
      });

      // When the socket reconnects later, re-sync once.
      socket.on("connect", async () => {
        if (!hasEverConnected.current) return;
        try {
          await refetch();
        } catch {
          // ignore
        }
      });
    })();

    return () => {
      cancelled = true;
      socket?.disconnect();
      socket = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return { connection, connectionError };
}