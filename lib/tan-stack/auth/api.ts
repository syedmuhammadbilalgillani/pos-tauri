import { apiClient } from "@/lib/tan-stack/api-helper";
import type {
  AuthSession,
  PosLoginResponseBody,
  PosRefreshResponseBody,
} from "@/types";

const publicAuthConfig = { token: "", _skipRefresh: true } as const;

// tauri-pos/lib/tan-stack/auth/api.ts (proposed loginRequest rewrite)

export async function loginRequest(body: {
  email: string;
  password: string;
  rememberMe: boolean;
  locationId?: string;
}): Promise<AuthSession> {
  const res = await apiClient.post<PosLoginResponseBody>(
    "users/pos/login",
    body,
    publicAuthConfig,
  );

  const inner = res.data?.data;
  if (!inner?.accessToken || !inner?.refreshToken) {
    throw new Error("Invalid login response");
  }

  const locationData = inner.locationData ?? [];
  const activeLocationId =
    locationData.length === 1 ? locationData[0]!.id : null;

  return {
    user: {
      id: inner.id,
      name: inner.name,
      email: inner.email,
      tenantId: inner.tenantId,
      permissions: inner.permissions ?? {},
      permissionsUpdatedAt: inner.permissionsUpdatedAt ?? Date.now(),

      locationData,
      activeLocationId,
    },
    accessToken: inner.accessToken,
    refreshToken: inner.refreshToken,
    updatedAt: Date.now(),
  };
}

export async function refreshRequest(
  refreshToken: string,
  locationId?: string,
): Promise<PosRefreshResponseBody> {
  const res = await apiClient.post<PosRefreshResponseBody>(
    "users/pos/refresh",
    { refreshToken, locationId },
    publicAuthConfig,
  );
  const data = res.data;
  if (!data?.accessToken || !data?.refreshToken) {
    throw new Error("Invalid refresh response");
  }
  return data;
}
