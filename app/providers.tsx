'use client';

import { AUTH_KEYS } from '@/lib/tan-stack/auth/key';
import {
  hydrateAuthStorage,
  loadAuthSession,
} from '@/lib/tan-stack/auth/storage';
import { usePermissionsSync } from '@/lib/tan-stack/auth/permissions-sync';
import { queryClient } from '@/lib/tan-stack/query-client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Loader2 } from 'lucide-react';
import * as React from 'react';

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
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  return <PermissionsSyncProvider>{children}</PermissionsSyncProvider>;
}

/** Separate component so the hook runs after hydration is complete. */
function PermissionsSyncProvider({ children }: { children: React.ReactNode }) {
  usePermissionsSync(); // ← auto-refresh on focus / visibilitychange
  return <>{children}</>;
}