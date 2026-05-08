
// ← remove: import { boolean } from "zod";  it was unused and wrong
export type LocationData = {
  id: string;
  name?: string | null;
};
export type AuthUser = {
  id: string;
  name: string | null;
  email: string;
  tenantId: string;
  permissions: any;
  permissionsUpdatedAt: number;
  locationData: LocationData[];
  activeLocationId: string | null;
};
export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  updatedAt: number;
};
/** Shape returned by Nest login/refresh — wrapped in { data } by TransformInterceptor */
export type PosLoginResponseBody = {
  data: {
    accessToken: string;
    refreshToken: string;
    expiresInSeconds: number;
  };
};
export type PosRefreshResponseBody = {
  data: {
    accessToken: string;
    refreshToken: string;
    expiresInSeconds: number;
  };
};
/** Shape returned by GET /restaurant/auth/me */
export type PosStaffMeBody = {
  data: {
    user: {
      id: string;
      tenantId: string;
      fullName: string;
      email: string;
      phone: string | null;
      avatarUrl: string | null;
      emailVerified: boolean;
      isActive: boolean;
      lastLoginAt: string | null;
    };
    tenant: {
      id: string;
      businessName: string;
      slug: string;
      status: string;
      defaultTimezone: string;
      defaultCurrency: string;
    };
    locationsAllowed: {
      id: string;
      name: string;
      code: string;
      status: string;
    }[];
    effectivePermissions: Record<string, Record<string, boolean>>;
    activeLocationId: string | null;
  };
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



export interface OrderItem {
  id: string;
  tenantId: string;
  locationId: string;
  customerId: string | null;
  deliveryAddressId: string | null;
  deliveryZoneId: string | null;
  discountId: string | null;
  qrCodeId: string | null;
  groupSessionId: string | null;
  kioskTerminalId: string | null;
  orderNumber: string;
  orderType: string;
  orderSource: string;
  tableNumber: string | null;
  aggregatorName: string | null;
  aggregatorOrderId: string | null;
  status: string;
  paymentStatus: string;
  cancelledBy: string | null;
  cancelledByType: string | null;
  cancellationReason: string | null;
  kitchenNotes: string | null;
  subtotal: string;
  discountAmount: string;
  deliveryFee: string;
  taxAmount: string;
  tipAmount: string;
  serviceCharge: string;
  walletAmountUsed: string;
  loyaltyAmountUsed: string;
  total: string;
  currency: string;
  fbrPosCharge: string;
  fbrPosChargeRate: string;
  fbrInvoiceNumber: string | null;
  srbTaxAmount: string;
  customerNotes: string | null;
  internalNotes: string | null;
  estimatedPrepMinutes: string | null;
  scheduledFor: string | null;
  isPreOrder: boolean;
  confirmedAt: string;
  preparingAt: string | null;
  readyAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  dailyTicket: number;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: Item[];
}

export interface Item {
  id: string;
  orderId: string;
  menuItemId: string;
  itemNameSnapshot: string;
  itemSkuSnapshot: string;
  unitPriceSnapshot: string;
  discountPriceSnapshot: string | null;
  quantity: number;
  modifierTotal: string;
  lineDiscount: string;
  lineTotal: string;
  specialInstructions: string | null;
  status: string;
  createdAt: string;
  modifiers: Modifier[];
}

export interface Modifier {
  id: string;
  orderItemId: string;
  modifierId: string;
  modifierNameSnapshot: string;
  groupNameSnapshot: string;
  priceDeltaSnapshot: string;
  quantity: number;
}


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
};
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
};

export type PosTicketLine = {
  menuItemId: string;
  quantity: number;
  specialInstructions?: string;
  modifiers?: { modifierId: string; quantity?: number }[];
};

// -------------------------
// Menu item detail (modifiers)
// -------------------------
export type PublicModifier = {
  id: string;
  name: string;
  priceDelta: string;
  displayOrder: number;
};

export type PublicModifierGroup = {
  id: string;
  name: string;
  selectionType: "single" | "multiple" | "exactly";
  minSelections: number;
  maxSelections: number | null;
  isRequired: boolean;
  displayOrder: number;
  modifiers: PublicModifier[];
};

export type PublicMenuItemDetail = {
  id: string;
  categoryId: string;
  slug: string;
  sku: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  uom: string | null;
  basePrice: string;
  compareAtPrice: string | null;
  discountPrice: string | null;
  isFeatured: boolean;
  displayOrder: number;
  prepTimeSeconds: number | null;
  modifierGroups?: PublicModifierGroup[];
  menu: { id: string; name: string };
  category: { id: string; name: string };
};
export type PosTicket = {
  id: string;
  sessionToken: string;
  orderType?: "dine_in" | "takeaway" | "delivery" | "catering";
  promoCode?: string | null;
  cartItems: PosTicketLine[];
  status: "active" | "held" | "converted" | string;
  updatedAt: string;
  createdAt: string;
};
export type PosQuoteResponse = {
  currency: string;
  subtotal: string;
  discountAmount: string;
  serviceCharge: string;
  taxAmount: string;
  deliveryFee: string;
  fbrPosCharge: string;
  srbTaxAmount: string;
  total: string;
  appliedDiscount: null | {
    discountId: string;
    code: string;
    type: string;
    value: string;
  };
  issues: Array<{ code: string; message: string; meta?: any }>;
};
export type PosConvertResponse = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: string;
  currency: string;
};
export type PosPaymentResponse = {
  payment: any;
  paymentStatus: "unpaid" | "partial" | "paid" | "failed" | string;
};
