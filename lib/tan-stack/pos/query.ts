import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  getMenuCategories,
  getMenuItems,
  getMenuItemDetail,
  getMyPosTicket,
  listPosTickets,
  quotePosTicket,
} from "./api";
import {
  cacheMenuCategories,
  cacheMenuItems,
  getCachedMenuCategories,
  getCachedMenuItems,
} from "@/lib/offline/menu-cache";

export const useGetMenuCategoriesQuery = () =>
  useQuery({
    queryKey: ["pos-menu-categories"],
    queryFn: async () => {
      try {
        const data = await getMenuCategories();
        if (data) cacheMenuCategories(data).catch(() => {});
        return data;
      } catch {
        // Fall back to SQLite cache when offline
        const cached = await getCachedMenuCategories();
        if (cached) return cached as Awaited<ReturnType<typeof getMenuCategories>>;
        throw new Error("No menu data available offline");
      }
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    retry: 0, // don't hammer server when offline
  });

export const useMenuItemDetailQuery = (slug: string | null, enabled: boolean) =>
  useQuery({
    queryKey: ["pos-menu-item-detail", slug],
    queryFn: () =>
      getMenuItemDetail({ slug: slug as string, includeModifiers: true }),
    enabled: enabled && Boolean(slug),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

export const useGetMenuItemsQuery = (
  categoryId: string,
  menuId: string,
  enabled: boolean,
) =>
  useInfiniteQuery({
    queryKey: ["pos-menu-items", categoryId, menuId],
    queryFn: async ({ pageParam }) => {
      try {
        const data = await getMenuItems({
          categoryId,
          menuId,
          cursor: (pageParam as string | null | undefined) ?? undefined,
          limit: 20,
        });
        if (data && !pageParam) {
          // Only cache first page (no cursor) to keep cache size reasonable
          cacheMenuItems(categoryId, menuId, data).catch(() => {});
        }
        return data;
      } catch {
        if (!pageParam) {
          const cached = await getCachedMenuItems(categoryId, menuId);
          if (cached) return cached as ReturnType<typeof getMenuItems>;
        }
        throw new Error("Menu items unavailable offline");
      }
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: unknown) => {
      const lp = lastPage as {
        data?: { nextCursor?: string | null; hasMore?: boolean };
      } | null;
      const next = lp?.data?.nextCursor ?? null;
      const hasMore = Boolean(lp?.data?.hasMore);
      return hasMore ? next : undefined;
    },
    enabled: enabled && Boolean(menuId) && Boolean(categoryId),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
    retry: 0,
  });

export const useMyPosTicketQuery = (ticketToken: string | null, enabled: boolean) =>
  useQuery({
    queryKey: ["pos-ticket", ticketToken],
    queryFn: () => getMyPosTicket(ticketToken as string),
    enabled: enabled && Boolean(ticketToken),
    staleTime: 1000 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    retry: 1,
  });

export const useListPosTicketsQuery = (args?: {
  status?: string;
  limit?: number;
}) =>
  useQuery({
    queryKey: ["pos-tickets", args?.status ?? "all", args?.limit ?? 50],
    queryFn: () => listPosTickets(args),
    staleTime: 1000 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    retry: 0,
  });

export const useQuotePosTicketQuery = (ticketToken: string | null, enabled: boolean) =>
  useQuery({
    queryKey: ["pos-ticket-quote", ticketToken],
    queryFn: () => quotePosTicket({ ticketToken: ticketToken as string }),
    enabled: enabled && Boolean(ticketToken),
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 1000 * 60 * 10,
    retry: 0,
  });
