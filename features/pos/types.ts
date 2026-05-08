import type { PosTicketLine } from "@/types";

export type OrderType = "takeaway" | "dine_in" | "delivery" | "catering";

export type CartModifier = {
  modifierId: string;
  quantity?: number;
  modifierNameSnapshot?: string;
  groupNameSnapshot?: string;
  priceDeltaSnapshot?: string;
};

export type CartItem = Omit<PosTicketLine, "modifiers"> & {
  _localId: string; // stable key for list rendering
  _name?: string;
  _price?: number;
  modifiers?: CartModifier[];
};

export type CreateOrderDto = {
  locationId: string;
  orderType: OrderType;
  orderSource: string;
  tableNumber?: string;
  customerNotes?: string;
  kitchenNotes?: string;
  items: Array<{
    menuItemId?: string;
    itemNameSnapshot: string;
    itemSkuSnapshot?: string;
    unitPriceSnapshot: string;
    quantity: number;
    specialInstructions?: string;
    modifiers?: Array<{
      modifierId?: string;
      modifierNameSnapshot: string;
      groupNameSnapshot?: string;
      priceDeltaSnapshot: string;
      quantity?: number;
    }>;
  }>;
};
