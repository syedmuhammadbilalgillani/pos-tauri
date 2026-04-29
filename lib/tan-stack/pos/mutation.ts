import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addPosPayment,
  applyPosPromo,
  convertPosTicket,
  createPosTicket,
  holdPosTicket,
  recallPosTicket,
  removePosPromo,
  setPosTicketItems,
  updatePosTicketContext,
} from "./api";
import { PosTicketLine } from "@/types";

export function useCreatePosTicketMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPosTicket,
    onSuccess: (ticket) => {
      qc.invalidateQueries({ queryKey: ["pos-tickets"] });
      qc.setQueryData(["pos-ticket", ticket.sessionToken], ticket);
    },
  });
}

export function useSetPosTicketItemsMutation(ticketToken: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { items: PosTicketLine[]; clientUpdatedAt?: string }) =>
      setPosTicketItems({ ticketToken, ...args }),
    
    onSuccess: (ticket) => {
      qc.setQueryData(["pos-ticket", ticketToken], ticket);
      qc.invalidateQueries({ queryKey: ["pos-ticket-quote", ticketToken] });
    },
  });
}

export function useHoldPosTicketMutation(ticketToken: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => holdPosTicket(ticketToken),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pos-tickets"] }),
  });
}

export function useRecallPosTicketMutation(ticketToken: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => recallPosTicket(ticketToken),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pos-tickets"] }),
  });
}

export function useRecallPosTicketByTokenMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ticketToken: string) => recallPosTicket(ticketToken),
    onSuccess: (_ticket, ticketToken) => {
      qc.invalidateQueries({ queryKey: ["pos-tickets"] });
      qc.invalidateQueries({ queryKey: ["pos-ticket", ticketToken] });
    },
  });
}

export function useApplyPosPromoMutation(ticketToken: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => applyPosPromo({ ticketToken, code }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["pos-ticket-quote", ticketToken] }),
  });
}

export function useRemovePosPromoMutation(ticketToken: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => removePosPromo(ticketToken),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["pos-ticket-quote", ticketToken] }),
  });
}

export function useConvertPosTicketMutation(ticketToken: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args?: {
      clientTotal?: string;
      customerNotes?: string;
      kitchenNotes?: string;
      tableNumber?: string;
    }) => convertPosTicket({ ticketToken, ...args }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pos-tickets"] });
      qc.invalidateQueries({ queryKey: ["pos-ticket", ticketToken] });
    },
  });
}

export function useUpdatePosTicketContextMutation(ticketToken: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      orderType?: "dine_in" | "takeaway" | "delivery" | "catering";
      tableNumber?: string;
    }) => updatePosTicketContext({ ticketToken, ...args }),
    onSuccess: (ticket) => {
      qc.setQueryData(["pos-ticket", ticketToken], ticket);
      qc.invalidateQueries({ queryKey: ["pos-ticket-quote", ticketToken] });
    },
  });
}

export function useAddPosPaymentMutation(orderId: string) {
  return useMutation({
    mutationFn: (args: {
      paymentMethod:
        | "cash"
        | "card"
        | "jazzcash"
        | "easypaisa"
        | "nayapay"
        | "sadapay"
        | "bank_transfer"
        | "wallet"
        | "loyalty"
        | "complementary";
      amount: string;
      tipAmount?: string;
    }) =>
      addPosPayment({
        orderId,
        paymentMethod: args.paymentMethod,
        amount: args.amount,
        tipAmount: args.tipAmount,
      }),
  });
}

export function useAddPosPaymentByOrderIdMutation() {
  return useMutation({
    mutationFn: (args: {
      orderId: string;
      paymentMethod:
        | "cash"
        | "card"
        | "jazzcash"
        | "easypaisa"
        | "nayapay"
        | "sadapay"
        | "bank_transfer"
        | "wallet"
        | "loyalty"
        | "complementary";
      amount: string;
      tipAmount?: string;
    }) =>
      addPosPayment({
        orderId: args.orderId,
        paymentMethod: args.paymentMethod,
        amount: args.amount,
        tipAmount: args.tipAmount,
      }),
  });
}
