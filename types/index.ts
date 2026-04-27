import type { PermissionMap } from "@/lib/permissions/types";

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
