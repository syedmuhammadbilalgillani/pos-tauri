import { apiClient } from "@/lib/tan-stack/api-helper";
import type {
  AuthSession,
  PosLoginResponseBody,
  PosRefreshResponseBody,
  PosStaffMeBody,
} from "@/types";

const publicAuthConfig = { token: "", _skipRefresh: true } as const;

export async function loginRequest(body: {
  email: string;
  password: string;
  tenantSlug: string;
}): Promise<AuthSession> {
  // 1. Exchange credentials for tokens
  const loginRes = await apiClient.post<PosLoginResponseBody>(
    "restaurant/auth/login",
    body,
    publicAuthConfig,
  );

  const tokens = loginRes.data?.data;
  if (!tokens?.accessToken || !tokens?.refreshToken) {
    throw new Error("Invalid login response — missing tokens");
  }

  // 2. Load staff profile + allowed locations (no locationId → effectivePermissions = {})
  const meRes = await apiClient.get<PosStaffMeBody>("restaurant/auth/me", {
    token: tokens.accessToken,
    _skipRefresh: true,
  });

  const me = meRes.data?.data;
  if (!me?.user?.id) {
    throw new Error("Could not load staff profile");
  }

  const locationData = (me.locationsAllowed ?? []).map((l) => ({
    id: l.id,
    name: l.name ?? null,
  }));
  const activeLocationId =
    locationData.length === 1 ? locationData[0]!.id : null;

  // 3. If a single location exists, re-fetch /me with it to get permissions immediately
  let permissions = {};
  let permissionsUpdatedAt = Date.now();

  if (activeLocationId) {
    try {
      const meWithPerms = await apiClient.get<PosStaffMeBody>(
        "restaurant/auth/me",
        {
          token: tokens.accessToken,
          _skipRefresh: true,
          headers: { "x-location-id": activeLocationId },
        },
      );
      const perms = meWithPerms.data?.data?.effectivePermissions;
      if (perms) {
        permissions = perms;
        permissionsUpdatedAt = Date.now();
      }
    } catch {
      // Non-fatal — silentlyRefreshPermissions will retry on next focus
    }
  }

  return {
    user: {
      id: me.user.id,
      name: me.user.fullName,
      email: me.user.email,
      tenantId: me.user.tenantId,
      permissions,
      permissionsUpdatedAt,
      locationData,
      activeLocationId,
    },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    updatedAt: Date.now(),
  };
}

export type RefreshTokens = {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
};

/** Returns only the new token pair. Callers that need fresh permissions must call /me separately. */
export async function refreshRequest(
  refreshToken: string,
): Promise<RefreshTokens> {
  const res = await apiClient.post<PosRefreshResponseBody>(
    "restaurant/auth/refresh",
    { refreshToken },
    publicAuthConfig,
  );
  const data = res.data?.data;
  if (!data?.accessToken || !data?.refreshToken) {
    throw new Error("Invalid refresh response — missing tokens");
  }
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresInSeconds: data.expiresInSeconds,
  };
}
