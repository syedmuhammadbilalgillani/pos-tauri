import { useMutation } from "@tanstack/react-query";
import { validateDiscountCode } from "./api";
import { validateDiscountCodeLocally } from "@/lib/offline";
import { toast } from "sonner";

export const useValidateDiscountCodeMutation = () => {
  return useMutation({
    mutationFn: async (args: {
      code: string;
      orderType: "dine_in" | "takeaway" | "delivery" | "catering";
      subtotal: string;
      customerId?: string | null;
    }) => {
      // Try local validation first (offline-first / Tauri)
      const localResult = await validateDiscountCodeLocally(args.code, args.subtotal);

      if (localResult.valid) {
        // Valid locally, return immediately
        return localResult;
      }

      if (localResult.error?.code === "WEB_MODE" || localResult.error?.code === "CUSTOMER_NOT_FOUND") {
        // Web mode or not found locally - validate via server
        try {
          return await validateDiscountCode(args);
        } catch (error) {
          // Server failed, return local error or rethrow
          if (localResult.error?.code === "WEB_MODE") {
            throw error;
          }
          return localResult;
        }
      }

      // Other validation errors, return as-is
      return localResult;
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to validate discount code";
      toast.error(message);
    },
  });
};
