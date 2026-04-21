import { apiClient } from "@/lib/tan-stack/api-helper";
import type {
  AuthSession,
  PosLoginResponseBody,
  PosRefreshResponseBody,
} from "@/types";

/** Login/refresh must not send stored Bearer; `""` skips `loadAuthSession()` fallback. */
const publicAuthConfig = {
  token: "",
  _skipRefresh: true,
} as const;

export async function loginRequest(body: {
  email: string;
  password: string;
  rememberMe: boolean;
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

  return {
    user: {
      id: inner.id,
      name: inner.name,
      email: inner.email,
      tenantId: inner.tenantId,
    },
    accessToken: inner.accessToken,
    refreshToken: inner.refreshToken,
    updatedAt: Date.now(),
  };
}

export async function refreshRequest(
  refreshToken: string,
): Promise<PosRefreshResponseBody> {
  const res = await apiClient.post<PosRefreshResponseBody>(
    "users/pos/refresh",
    { refreshToken },
    publicAuthConfig,
  );

  const data = res.data;
  if (!data?.accessToken || !data?.refreshToken) {
    throw new Error("Invalid refresh response");
  }

  return data;
}