import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  getMenuCategories,
  getMenuItems,
  getMenuItemDetail,
  getMyPosTicket,
  listPosTickets,
  quotePosTicket,
} from "./api";

export const useGetMenuCategoriesQuery = () =>
  useQuery({
    queryKey: ["pos-menu-categories"],
    queryFn: () => getMenuCategories(),
    // Menu bootstrap rarely changes; keep it warm.
    staleTime: 1000 * 60 * 30, // 30 min
    gcTime: 1000 * 60 * 60, // 60 min
    refetchOnWindowFocus: false,
  });

export const useMenuItemDetailQuery = (slug: string | null, enabled: boolean) =>
  useQuery({
    queryKey: ["pos-menu-item-detail", slug],
    queryFn: () =>
      getMenuItemDetail({ slug: slug as string, includeModifiers: true }),
    enabled: enabled && Boolean(slug),
    // Item detail (with modifiers) is stable; cache aggressively.
    staleTime: 1000 * 60 * 30, // 30 min
    gcTime: 1000 * 60 * 60, // 60 min
    refetchOnWindowFocus: false,
  });

export const useGetMenuItemsQuery = (
  categoryId: string,
  menuId: string,
  enabled: boolean,
) =>
  useInfiniteQuery({
    queryKey: ["pos-menu-items", categoryId, menuId],
    queryFn: ({ pageParam }) =>
      getMenuItems({
        categoryId,
        menuId,
        cursor: (pageParam as string | null | undefined) ?? undefined,
        limit: 20,
      }),
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
    staleTime: 1000 * 60 * 10, // 10 min
    gcTime: 1000 * 60 * 60, // 60 min
    refetchOnWindowFocus: false,
    // Keep previous pages visible while loading more.
    placeholderData: (prev) => prev,
  });

export const useMyPosTicketQuery = (ticketToken: string | null, enabled: boolean) =>
  useQuery({
    queryKey: ["pos-ticket", ticketToken],
    queryFn: () => getMyPosTicket(ticketToken as string),
    enabled: enabled && Boolean(ticketToken),
    // Ticket is dynamic; keep fresh-ish but avoid thrash.
    staleTime: 1000 * 5, // 5s
    gcTime: 1000 * 60 * 10, // 10 min
    refetchOnWindowFocus: false,
  });

export const useListPosTicketsQuery = (args?: {
  status?: string;
  limit?: number;
}) =>
  useQuery({
    queryKey: ["pos-tickets", args?.status ?? "all", args?.limit ?? 50],
    queryFn: () => listPosTickets(args),
    staleTime: 1000 * 5, // 5s
    gcTime: 1000 * 60 * 10, // 10 min
    refetchOnWindowFocus: false,
  });

export const useQuotePosTicketQuery = (ticketToken: string | null, enabled: boolean) =>
  useQuery({
    queryKey: ["pos-ticket-quote", ticketToken],
    queryFn: () => quotePosTicket({ ticketToken: ticketToken as string }),
    enabled: enabled && Boolean(ticketToken),
    refetchOnWindowFocus: false,
    // Quote changes often; don't keep stale for long.
    staleTime: 0,
    gcTime: 1000 * 60 * 10,
  });
