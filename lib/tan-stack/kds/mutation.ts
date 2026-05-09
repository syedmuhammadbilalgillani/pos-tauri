import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateKdsItemStatus,
  updateKdsOrderStatus,
  type KdsItemStatusUpdateRequest,
  type KdsOrderStatusUpdateRequest,
} from "./api";
import { toast } from "sonner";

export const useUpdateKdsItemStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: { orderItemId: string; status: KdsItemStatusUpdateRequest }) =>
      updateKdsItemStatus(args.orderItemId, args.status),
    onSuccess: () => {
      toast.success("Item status updated");
      queryClient.invalidateQueries({ queryKey: ["kds-orders"] });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to update item status";
      toast.error(message);
    },
  });
};

export const useUpdateKdsOrderStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: { orderId: string; status: KdsOrderStatusUpdateRequest }) =>
      updateKdsOrderStatus(args.orderId, args.status),
    onSuccess: () => {
      toast.success("Order status updated");
      queryClient.invalidateQueries({ queryKey: ["kds-orders"] });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to update order status";
      toast.error(message);
    },
  });
};
