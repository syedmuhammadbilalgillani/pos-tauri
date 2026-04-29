import type {
  POSCategoryResponse,
  PublicMenuItemDetail,
  PosTicket,
  PosQuoteResponse,
  PosConvertResponse,
  PosPaymentResponse,
  PosTicketLine,
} from "@/types";
import { apiClient } from "../api-helper";
import { loadAuthSession } from "../auth";

// Existing
export async function getMenuCategories() {
  const response = await apiClient.get<POSCategoryResponse | null>(
    `/menus/bootstrap`,
  );
  return response.data;
}

export async function getMenuItems(args: {
  categoryId: string;
  menuId: string;
  cursor?: string | null;
  limit?: number;
}) {
  const session = loadAuthSession();
  const response = await apiClient.get(`/menus/items`, {
    params: {
      categoryId: args.categoryId,
      locationId: session?.user?.activeLocationId,
      menuId: args.menuId,
      limitParam: args.limit ?? 20,
      cursor: args.cursor ?? undefined,
    },
  });
  return response.data;
}

export async function getMenuItemDetail(args: {
  slug: string;
  includeModifiers?: boolean;
}) {
  const session = loadAuthSession();
  const res = await apiClient.get<{ success: boolean; data: PublicMenuItemDetail }>(
    `/public/menu/items/${args.slug}`,
    {
      params: {
        includeModifiers: args.includeModifiers === false ? "false" : "true",
        locationId: session?.user?.activeLocationId ?? undefined,
      },
    },
  );
  if (!res.data?.success) {
    throw new Error("Failed to load menu item detail");
  }
  return res.data;
}

// ----------------------
// POS tickets (backend /pos/*)
// ----------------------

export async function createPosTicket(body?: {
  orderType?: "dine_in" | "takeaway" | "delivery" | "catering";
  tableNumber?: string;
}) {
  const res = await apiClient.post<PosTicket>(`/pos/tickets`, body ?? {});
  return res.data;
}

export async function getMyPosTicket(ticketToken: string) {
  const res = await apiClient.get<PosTicket>(`/pos/tickets/me`, {
    headers: { "x-ticket-token": ticketToken },
  });
  return res.data;
}

export async function listPosTickets(params?: {
  status?: string;
  limit?: number;
}) {
  const res = await apiClient.get<{ items: PosTicket[] }>(`/pos/tickets`, {
    params: {
      status: params?.status ?? undefined,
      limit: params?.limit ?? 50,
    },
  });
  return res.data;
}

export async function setPosTicketItems(args: {
  ticketToken: string;
  items: PosTicketLine[];
  clientUpdatedAt?: string;
}) {
  const res = await apiClient.put<PosTicket>(
    `/pos/tickets/items`,
    { items: args.items, clientUpdatedAt: args.clientUpdatedAt ?? undefined },
    { headers: { "x-ticket-token": args.ticketToken } },
  );
  return res.data;
}

export async function quotePosTicket(args: {
  ticketToken: string;
  includeUnavailableItems?: boolean;
}) {
  const res = await apiClient.post<PosQuoteResponse>(
    `/pos/tickets/quote`,
    { includeUnavailableItems: args.includeUnavailableItems ?? false },
    { headers: { "x-ticket-token": args.ticketToken } },
  );
  return res.data;
}

export async function holdPosTicket(ticketToken: string) {
  const res = await apiClient.post<PosTicket>(
    `/pos/tickets/hold`,
    {},
    { headers: { "x-ticket-token": ticketToken } },
  );
  return res.data;
}

export async function recallPosTicket(ticketToken: string) {
  const res = await apiClient.post<PosTicket>(
    `/pos/tickets/recall`,
    {},
    { headers: { "x-ticket-token": ticketToken } },
  );
  return res.data;
}

export async function applyPosPromo(args: {
  ticketToken: string;
  code: string;
}) {
  const res = await apiClient.post<{ promoCode: string }>(
    `/pos/tickets/promo`,
    { code: args.code },
    { headers: { "x-ticket-token": args.ticketToken } },
  );
  return res.data;
}

export async function removePosPromo(ticketToken: string) {
  const res = await apiClient.delete<{ promoCode: null }>(
    `/pos/tickets/promo`,
    {
      headers: { "x-ticket-token": ticketToken },
    },
  );
  return res.data;
}

export async function convertPosTicket(args: {
  ticketToken: string;
  clientTotal?: string;
  customerNotes?: string;
  kitchenNotes?: string;
  tableNumber?: string;
}) {
  const res = await apiClient.post<PosConvertResponse>(
    `/pos/tickets/convert`,
    {
      clientTotal: args.clientTotal ?? undefined,
      customerNotes: args.customerNotes ?? undefined,
      kitchenNotes: args.kitchenNotes ?? undefined,
      tableNumber: args.tableNumber ?? undefined,
    },
    { headers: { "x-ticket-token": args.ticketToken } },
  );
  return res.data;
}

export async function updatePosTicketContext(args: {
  ticketToken: string;
  orderType?: "dine_in" | "takeaway" | "delivery" | "catering";
  tableNumber?: string;
}) {
  const res = await apiClient.put<PosTicket>(
    `/pos/tickets/context`,
    {
      orderType: args.orderType ?? undefined,
      tableNumber: args.tableNumber ?? undefined,
    },
    { headers: { "x-ticket-token": args.ticketToken } },
  );
  return res.data;
}

export async function addPosPayment(args: {
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
  paymentGateway?:
    | "manual"
    | "stripe"
    | "checkout"
    | "jazzcash"
    | "easypaisa"
    | "internal_wallet";
  amount: string;
  tipAmount?: string;
}) {
  const res = await apiClient.post<PosPaymentResponse>(
    `/pos/orders/${args.orderId}/payments`,
    {
      paymentMethod: args.paymentMethod,
      paymentGateway: args.paymentGateway ?? "manual",
      amount: args.amount,
      tipAmount: args.tipAmount ?? undefined,
    },
  );
  return res.data;
}
