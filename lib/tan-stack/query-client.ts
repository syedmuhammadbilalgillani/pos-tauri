// lib/query-client.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min — don't refetch if data is fresh
      gcTime: 1000 * 60 * 10, // 10 min — keep in cache after unmount
      retry: (
        failureCount,
        error: Error & { response?: { status?: number } },
      ) => {
        if (
          error instanceof Error &&
          "response" in error &&
          error.response?.status === 401
        )
          return false; // don't retry auth errors
        if (
          error instanceof Error &&
          "response" in error &&
          error.response?.status === 404
        )
          return false;
        return failureCount < 2;
      },
    },
  },
});
