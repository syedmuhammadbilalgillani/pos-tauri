"use client";

import { REALTIME_URL } from "@/constants";
import { io, type Socket } from "socket.io-client";
import { loadAuthSession } from "./tan-stack/auth/storage";

export type RealtimeSocket = Socket;

export async function createRealtimeSocket(): Promise<RealtimeSocket> {
  const data = loadAuthSession();
  if (!data) {
    throw new Error("No auth session found");
  }
  const headers = {
    "x-tenant-id": data?.user?.tenantId,
    "x-location-id": data?.user?.activeLocationId,
    authorization: `Bearer ${data?.accessToken}`,
  };

  return io(`${REALTIME_URL}`, {
    transports: ["polling", "websocket"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    timeout: 10000,
    transportOptions: {
      polling: { extraHeaders: headers },
    },
    auth: {
      tenantId: data?.user?.tenantId,
      locationId: data?.user?.activeLocationId,
      authorization: headers.authorization,
    },
  });
}
