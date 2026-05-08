"use client";

import { useEffect } from "react";
import { useOfflineStore } from "@/store/offline";

export function useNetworkStatus() {
  const setNetworkStatus = useOfflineStore((s) => s.setNetworkStatus);
  const networkStatus = useOfflineStore((s) => s.networkStatus);

  useEffect(() => {
    // Set initial state
    setNetworkStatus(navigator.onLine ? "online" : "offline");

    const onOnline = () => setNetworkStatus("online");
    const onOffline = () => setNetworkStatus("offline");

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [setNetworkStatus]);

  return {
    isOnline: networkStatus === "online",
    isOffline: networkStatus === "offline",
    networkStatus,
  };
}
