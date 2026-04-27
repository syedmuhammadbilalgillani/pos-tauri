"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  hydratePlatformAuthStorage,
  loadPlatformSession,
} from "@/lib/tan-stack/platform-auth/storage";
import { PLATFORM_AUTH_KEYS } from "@/lib/tan-stack/platform-auth/key";
import { queryClient } from "@/lib/tan-stack/query-client";

export function PlatformAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    void (async () => {
      await hydratePlatformAuthStorage();
      queryClient.setQueryData(
        PLATFORM_AUTH_KEYS.session(),
        loadPlatformSession(),
      );

      const s = loadPlatformSession();
      const onLogin = pathname?.startsWith("/platform-admin/login");

      if (!s && !onLogin) {
        router.replace("/platform-admin/login");
        return;
      }
      setReady(true);
    })();
  }, [pathname, router]);

  if (!ready) return null;
  return <>{children}</>;
}
