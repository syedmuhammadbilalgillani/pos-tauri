"use client";

import { queryClient } from "@/lib/tan-stack/query-client";
import { AUTH_KEYS } from "@/lib/tan-stack/auth/key";
import { hydrateAuthStorage, loadAuthSession } from "@/lib/tan-stack/auth/storage";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import * as React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthHydrate>{children}</AuthHydrate>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

function AuthHydrate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    void (async () => {
      await hydrateAuthStorage();
      queryClient.setQueryData(AUTH_KEYS.session(), loadAuthSession());
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}