import { apiClient } from "../api-helper";
import { loadAuthSession } from "../auth/storage";

/**
 * Discount response from validation API
 */
export interface DiscountValidationResponse {
  valid: boolean;
  discount?: {
    id: string;
    code: string;
    name: string;
    discountType: "percentage" | "fixed_amount" | "free_item" | "bogo";
    value: string;
    maxDiscountCap: string | null;
    calculatedDiscount: string;
    message: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Validate a discount code before applying
 */
export async function validateDiscountCode(args: {
  code: string;
  orderType: "dine_in" | "takeaway" | "delivery" | "catering";
  subtotal: string;
  customerId?: string | null;
}): Promise<DiscountValidationResponse> {
  const session = loadAuthSession();
  const res = await apiClient.post<DiscountValidationResponse>(
    `/pos/discounts/validate`,
    {
      code: args.code.trim().toUpperCase(),
      orderType: args.orderType,
      subtotal: args.subtotal,
      customerId: args.customerId ?? undefined,
    },
    {
      headers: {
        "x-location-id": session?.user?.activeLocationId ?? "",
      },
    }
  );

  return res.data;
}
