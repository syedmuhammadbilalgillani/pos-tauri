import { useQuery } from "@tanstack/react-query";
import { searchCustomerByPhone, getCustomerById } from "./api";

export const useSearchCustomerByPhoneQuery = (
  phone: string | null,
  enabled: boolean = true
) =>
  useQuery({
    queryKey: ["customer-search", phone ?? null],
    queryFn: () => {
      if (!phone) throw new Error("Phone number is required");
      return searchCustomerByPhone(phone);
    },
    enabled: enabled && Boolean(phone) && phone.length >= 3,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
  });

export const useGetCustomerByIdQuery = (
  customerId: string | null,
  enabled: boolean = true
) =>
  useQuery({
    queryKey: ["customer", customerId ?? null],
    queryFn: () => {
      if (!customerId) throw new Error("Customer ID is required");
      return getCustomerById(customerId);
    },
    enabled: enabled && Boolean(customerId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
  });
