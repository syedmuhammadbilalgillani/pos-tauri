import { useQuery } from "@tanstack/react-query";
import { getKdsBootstrap, listKdsOrders } from "./api";

export const useKdsBootstrapQuery = (enabled: boolean = true) =>
  useQuery({
    queryKey: ["kds-bootstrap"],
    queryFn: () => getKdsBootstrap(),
    enabled,
    staleTime: 1000 * 5, // 5 seconds
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });

export const useKdsOrdersListQuery = (args?: {
  status?: string;
  limit?: number;
  cursor?: string;
}) =>
  useQuery({
    queryKey: ["kds-orders", args?.status ?? "all", args?.limit ?? 50, args?.cursor ?? null],
    queryFn: () => listKdsOrders(args),
    staleTime: 0, // Always fresh
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });
