"use client";

import { fetchKdsOrders } from "@/lib/kds";
import { createRealtimeSocket } from "@/lib/socket";
import { playNewOrderTone } from "@/lib/sound";
import { useOrdersStore } from "@/store/orders";
import type {
  KdsOrderStatus,
  OrderItem,
  SocketOrderItemStatusChanged,
  SocketOrderStatusChanged
} from "@/types";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

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
    return (
      mode === "kds" ? [...KDS_STATUSES] : [...FOH_STATUSES]
    ) as KdsOrderStatus[];
  }, [mode]);

  const hasEverConnected = useRef(false);
  // Track whether we already showed a disconnect toast so we don't spam
  const disconnectToastId = useRef<string | number | null>(null);

  const [connection, setConnection] =
    useState<RealtimeConnectionState>("connecting");
  const [connectionError, setConnectionError] = useState("");

  async function refetch() {
    const res = await fetchKdsOrders({
      status: statuses,
      limit: 30,
      cursor: null,
    });
    setFromFeed(res?.data as OrderItem[], res?.nextCursor as string | null);
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
        // ignore — will retry via socket reconnect
      }

      if (cancelled) return;

      try {
        socket = await createRealtimeSocket();
      } catch (e: unknown) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Failed to create socket";
        setConnection("error");
        setConnectionError(msg);
        toast.error(`Realtime connection failed: ${msg}`, {
          id: "socket-error",
        });
        return;
      }

      if (cancelled) {
        socket.disconnect();
        return;
      }

      socket.on("connect", () => {
        // Transport connected — gateway auth not confirmed yet until "connected" event
        if (!hasEverConnected.current) setConnection("connecting");
      });

      socket.on("connected", (p: unknown) => {
        hasEverConnected.current = true;
        setConnection("connected");
        setConnectionError("");
        // Dismiss any previous disconnect toast
        if (disconnectToastId.current !== null) {
          toast.dismiss(disconnectToastId.current);
          disconnectToastId.current = null;
        }
        // Optional: see the room/tenant/location in console
        // console.log("connected payload", p);
        void p;
      });

      socket.on("disconnect", (reason) => {
        if (cancelled) return;
        setConnection("disconnected");
        setConnectionError(String(reason ?? ""));
        disconnectToastId.current = toast.warning(
          "Realtime disconnected — reconnecting…",
          {
            id: "socket-disconnect",
            duration: Infinity,
          },
        );
      });

      socket.on("connect_error", (err: Error) => {
        if (cancelled) return;
        setConnection("error");
        setConnectionError(err?.message ?? "connect_error");
      });

      socket.on("order.status_changed", (evt: SocketOrderStatusChanged) => {
        updateOrderStatus(evt.orderId, evt.toStatus);
      });

      socket.on(
        "order.item_status_changed",
        (evt: SocketOrderItemStatusChanged) => {
          updateItemStatus(evt.orderId, evt.orderItemId, evt.status);
        },
      );

      socket.on("order.created", async () => {
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

      // Re-sync after reconnect (only fires when hasEverConnected is true)
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
      // Clean up lingering disconnect toast on unmount
      if (disconnectToastId.current !== null) {
        toast.dismiss(disconnectToastId.current);
        disconnectToastId.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return { connection, connectionError };
}
