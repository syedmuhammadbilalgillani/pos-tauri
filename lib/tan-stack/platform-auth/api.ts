import { apiClient } from "@/lib/tan-stack/api-helper";
import type { PlatformSession } from "./storage";

/** Login/refresh must not send stored Bearer; `""` skips `loadAuthSession()` fallback. */
const publicAuthConfig = {
  token: "",
  _skipRefresh: true,
} as const;

export async function platformLoginRequest(body: {
  email: string;
  password: string;
}): Promise<PlatformSession> {
  const res = await apiClient.post<any>("platform-auth/login", body, publicAuthConfig);

  const data = res.data;
  if (!data?.user?.id || !data?.accessToken || !data?.refreshToken) {
    throw new Error("Invalid platform login response");
  }

  return {
    user: data.user,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    updatedAt: Date.now(),
  };
}

export async function platformRefreshRequest(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await apiClient.post<any>(
    "platform-auth/refresh",
    { refreshToken },
    publicAuthConfig,
  );

  const data = res.data;
  if (!data?.accessToken || !data?.refreshToken) {
    throw new Error("Invalid platform refresh response");
  }

  return { accessToken: data.accessToken, refreshToken: data.refreshToken };
}