import type { PermissionMap } from "@/lib/permissions/types";
import { boolean } from "zod";

// proposed (new) types (not currently in codebase)
export type LocationData = {
  id: string;
  name?: string | null;
};
export type AuthUser = {
  id: string;
  name: string | null;
  email: string;
  tenantId: string;
  permissions: PermissionMap;
  permissionsUpdatedAt: number;
  // NEW: from backend login response
  locationData: LocationData[];
  // NEW: persisted selection used everywhere
  activeLocationId: string | null;
};

export type UserLocationAccess = {
  locationId: string | null;
  allLocations: boolean;
  roleId: string;
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  updatedAt: number;
};

export type PosLoginResponseBody = {
  data: {
    id: string;
    name: string | null;
    email: string;
    tenantId: string;
    accessToken: string;
    refreshToken: string;
    isAuthenticated: true;
    permissions: PermissionMap;
    permissionsUpdatedAt: number;
    // backend name
    locationData: LocationData[];
  };
};
export type PosRefreshResponseBody = {
  accessToken: string;
  refreshToken: string;
  permissions: PermissionMap; // ← NEW
  permissionsUpdatedAt: number; // ← NEW
};

export type KdsOrderStatus =
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled"
  | "rejected"
  | "out_for_delivery"
  | "delivered"
  | "scheduled"
  | "pending";

export type KdsItemStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "served"
  | "cancelled"
  | "voided";

export type OrderType = "dine_in" | "takeaway" | "delivery" | "pickup" | string;

export type OrderItemModifier = {
  id: string;
  name: string;
  quantity?: number;
  modifierNameSnapshot?: string | null;
  priceDeltaSnapshot?: number;
};

export type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  status?: KdsItemStatus;
  modifiers?: OrderItemModifier[];
  note?: string | null;
  itemNameSnapshot?: string | null;
  specialInstructions?: string | null;
  lineTotal?: number;
};

export type OrderWithItems = {
  id: string;
  orderNumber: string | number;
  createdAt: string;
  status: KdsOrderStatus;
  orderType?: OrderType;
  kitchenNotes?: string | null;
  notes?: string | null;
  items: OrderItem[];
  orderSource?: string | null;
  customerNotes?: string | null;
};

export type CursorPageResponse<T> = {
  data: T[];
  nextCursor: string | null;
};

export type SocketConnectedPayload = {
  room: string;
  tenantId: string;
  locationId: string;
};

export type SocketOrderStatusChanged = {
  orderId: string;
  fromStatus: KdsOrderStatus;
  toStatus: KdsOrderStatus;
  changedAt: string;
};

export type SocketOrderItemStatusChanged = {
  orderId: string;
  orderItemId: string;
  status: KdsItemStatus;
  changedAt: string;
};

export type SocketOrderCreated = {
  orderId: string;
  createdAt: string;
  status: KdsOrderStatus | string;
  orderNumber?: string | number;
};

export type SocketPrintJobUpdated = {
  jobId: string;
  status: "printed" | "failed" | string;
  printedAt?: string | null;
  lastError?: string | null;
};
export type POSCategory = {
  id: string;
  name: string;
  image: string | null;
  slug: string;
  itemCount: number;
}
export type POSCategoryResponse = {
  success: boolean;
  meta: {
    menu: {
      id: string;
      name: string;
      isDefault: boolean;
    };
    categories: POSCategory[];

    isMultiLocation: boolean;
    location: {
      id: string;
      name: string;
      slug: string;
    };
  };
}


export type PosTicketLine = {
  menuItemId: string
  quantity: number
  specialInstructions?: string
  modifiers?: { modifierId: string; quantity?: number }[]
}

// -------------------------
// Menu item detail (modifiers)
// -------------------------
export type PublicModifier = {
  id: string
  name: string
  priceDelta: string
  displayOrder: number
}

export type PublicModifierGroup = {
  id: string
  name: string
  selectionType: "single" | "multiple" | "exactly"
  minSelections: number
  maxSelections: number | null
  isRequired: boolean
  displayOrder: number
  modifiers: PublicModifier[]
}

export type PublicMenuItemDetail = {
  id: string
  categoryId: string
  slug: string
  sku: string
  name: string
  description: string | null
  imageUrl: string | null
  uom: string | null
  basePrice: string
  compareAtPrice: string | null
  discountPrice: string | null
  isFeatured: boolean
  displayOrder: number
  prepTimeSeconds: number | null
  modifierGroups?: PublicModifierGroup[]
  menu: { id: string; name: string }
  category: { id: string; name: string }
}
export type PosTicket = {
  id: string
  sessionToken: string
  orderType?: "dine_in" | "takeaway" | "delivery" | "catering"
  promoCode?: string | null
  cartItems: PosTicketLine[]
  status: "active" | "held" | "converted" | string
  updatedAt: string
  createdAt: string
}
export type PosQuoteResponse = {
  currency: string
  subtotal: string
  discountAmount: string
  serviceCharge: string
  taxAmount: string
  deliveryFee: string
  fbrPosCharge: string
  srbTaxAmount: string
  total: string
  appliedDiscount: null | {
    discountId: string
    code: string
    type: string
    value: string
  }
  issues: Array<{ code: string; message: string; meta?: any }>
}
export type PosConvertResponse = {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  total: string
  currency: string
}
export type PosPaymentResponse = {
  payment: any
  paymentStatus: "unpaid" | "partial" | "paid" | "failed" | string
}