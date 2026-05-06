// lib/query-client.ts
import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/tan-stack/api-helper";

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403 || error.status === 404)
      return false;
    // Server errors: retry up to 2 times
    if (error.status >= 500) return failureCount < 2;
  }
  // Network errors: retry up to 2 times
  return failureCount < 2;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,        // 5 min fresh window
      gcTime: 1000 * 60 * 30,           // 30 min in cache after unmount
      retry: shouldRetry,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      refetchOnReconnect: true,          // re-fetch when network comes back
      networkMode: "offlineFirst",       // serve cache when offline (Tauri + web)
    },
    mutations: {
      retry: false,                      // mutations never retry by default
      networkMode: "offlineFirst",
    },
  },
});
