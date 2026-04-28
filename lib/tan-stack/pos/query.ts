import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import {
  getMenuCategories,
  getMenuItems,
  getMyPosTicket,
  listPosTickets,
  quotePosTicket,
} from "./api"

export const useGetMenuCategoriesQuery = () =>
  useQuery({
    queryKey: ["pos-menu-categories"],
    queryFn: () => getMenuCategories(),
  })

export const useGetMenuItemsQuery = (categoryId: string, menuId: string) =>
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
        data?: { nextCursor?: string | null; hasMore?: boolean }
      } | null
      const next = lp?.data?.nextCursor ?? null
      const hasMore = Boolean(lp?.data?.hasMore)
      return hasMore ? next : undefined
    },
    enabled: Boolean(menuId) && Boolean(categoryId),
  })

export const useMyPosTicketQuery = (ticketToken: string | null) =>
  useQuery({
    queryKey: ["pos-ticket", ticketToken],
    queryFn: () => getMyPosTicket(ticketToken as string),
    enabled: Boolean(ticketToken),
  })

export const useListPosTicketsQuery = (args?: { status?: string; limit?: number }) =>
  useQuery({
    queryKey: ["pos-tickets", args?.status ?? "all", args?.limit ?? 50],
    queryFn: () => listPosTickets(args),
  })

export const useQuotePosTicketQuery = (ticketToken: string | null) =>
  useQuery({
    queryKey: ["pos-ticket-quote", ticketToken],
    queryFn: () => quotePosTicket({ ticketToken: ticketToken as string }),
    enabled: Boolean(ticketToken),
    refetchOnWindowFocus: false,
  })