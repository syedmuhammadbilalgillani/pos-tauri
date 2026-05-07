export type MeLocation = {
  id: string;
  name: string;
  code: string;
  status: string;
};

export type MeEntitlements = {
  planId: string | null;
  planName: string | null;
  subscriptionStatus: string | null;
  features: Record<string, boolean>;
  permissionCap: Record<string, unknown>;
  limits: {
    maxLocations: number | null;
    maxUsers: number | null;
    maxMenuItems: number | null;
    maxOrdersPerMonth: number | null;
  };
};


export type MeResponse = {
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
  entitlements: MeEntitlements;
  locationsAllowed: MeLocation[];
  effectivePermissions: Record<string, Record<string, boolean>>;
  activeLocationId: string | null;
};

export type FeatureKey = string;
export type PermKey = string;

export type FeaturePermMap = Record<string, Record<string, boolean>>;

export type AccessDecision =
  | { allowed: true }
  | { allowed: false; reason: "unauthenticated" | "feature_disabled" | "cap_denied" | "role_denied" };

function isObject(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

export function getEntitlements(me: MeResponse | null) {
  return me?.entitlements ?? null;
}

export function isFeatureEnabled(me: MeResponse | null, feature: FeatureKey): boolean {
  return Boolean(me?.entitlements?.features?.[feature]);
}

/**
 * Plan-level permission cap check.
 * - If permissionCap is empty object -> no cap applied
 * - Otherwise require permissionCap[feature][perm] === true
 */
export function isCappedAllowed(me: MeResponse | null, feature: FeatureKey, perm: PermKey): boolean {
  const cap = me?.entitlements?.permissionCap as unknown;

  if (!isObject(cap)) return false;

  // empty cap means "no cap"
  if (Object.keys(cap).length === 0) return true;

  const capFeature = cap[feature];
  if (!isObject(capFeature)) return false;

  return capFeature[perm] === true;
}

/**
 * Role/effective permission check (already computed server-side for active location).
 */
export function hasEffectivePermission(
  me: MeResponse | null,
  feature: FeatureKey,
  perm: PermKey,
): boolean {
  const eff = me?.effectivePermissions as unknown;
  if (!isObject(eff)) return false;

  const effFeature = eff[feature];
  if (!isObject(effFeature)) return false;

  return effFeature[perm] === true;
}

/**
 * Final UI access decision:
 * feature flag -> plan cap -> effective role permission
 */
export function canAccess(
  me: MeResponse | null,
  req: { feature: FeatureKey; perm: PermKey },
): AccessDecision {
  if (!me) return { allowed: false, reason: "unauthenticated" };

  if (!isFeatureEnabled(me, req.feature)) {
    return { allowed: false, reason: "feature_disabled" };
  }

  if (!isCappedAllowed(me, req.feature, req.perm)) {
    return { allowed: false, reason: "cap_denied" };
  }

  if (!hasEffectivePermission(me, req.feature, req.perm)) {
    return { allowed: false, reason: "role_denied" };
  }

  return { allowed: true };
}

/**
 * Convenience for route/nav gating.
 * Any one of the requirements granting access -> allowed.
 */
export function canAccessAny(
  me: MeResponse | null,
  reqs: Array<{ feature: FeatureKey; perm: PermKey }>,
): AccessDecision {
  if (!me) return { allowed: false, reason: "unauthenticated" };

  for (const r of reqs) {
    const d = canAccess(me, r);
    if (d.allowed) return d;
  }

  // pick a deterministic reason (feature/cap/role) for UX
  // prefer "feature_disabled" if ALL features disabled, else cap/role
  return { allowed: false, reason: "role_denied" };
}




// import { canAccess } from "@/lib/restaurant/auth/feature-permissions";

// const me = auth.status === "authenticated" ? auth.me : null;

// const showRoles = canAccess(me, {
//   feature: "featOnlineOrdering",
//   perm: "canManageOrders",
// }).allowed;



// import { useRestaurantAuth } from "@/lib/restaurant/auth/restaurant-hooks";
// import { canAccess } from "@/lib/restaurant/auth/feature-permissions";

// export default function SomePage() {
//   const auth = useRestaurantAuth();
//   if (auth.status !== "authenticated") return null;

//   const decision = canAccess(auth.me, {
//     feature: "featOnlineOrdering",
//     perm: "canViewOrders",
//   });

//   if (!decision.allowed) {
//     return <div className="p-6 text-sm text-destructive">Access denied.</div>;
//   }

//   return <div>Page content</div>;
// }