import { apiClient } from "../api-helper";
import { loadAuthSession } from "../auth/storage";

/**
 * Customer response from POS search API
 */
export interface PosCustomerResponse {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  isActive: boolean;
  totalOrders: number;
  cachedLoyaltyPoints: number;
  cachedWalletBalance: string;
  customerSegment: string | null;
  lastOrderAt: string | null;
  createdAt: string;
}

/**
 * Search customer by phone number
 */
export async function searchCustomerByPhone(
  phone: string
): Promise<PosCustomerResponse | null> {
  const session = loadAuthSession();
  const res = await apiClient.get<{
    success: boolean;
    data: PosCustomerResponse | null;
  }>(`/pos/customers/search`, {
    params: {
      phone: phone.trim(),
    },
    headers: {
      "x-location-id": session?.user?.activeLocationId ?? "",
    },
  });

  if (!res.data.success) {
    throw new Error("Failed to search customer");
  }

  return res.data.data;
}

/**
 * Get customer by ID with full details
 */
export async function getCustomerById(
  customerId: string
): Promise<PosCustomerResponse | null> {
  const session = loadAuthSession();
  const res = await apiClient.get<{
    success: boolean;
    data: PosCustomerResponse | null;
  }>(`/pos/customers`, {
    params: {
      id: customerId,
    },
    headers: {
      "x-location-id": session?.user?.activeLocationId ?? "",
    },
  });

  if (!res.data.success) {
    throw new Error("Failed to get customer");
  }

  return res.data.data;
}
