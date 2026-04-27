import { apiClient } from "@/lib/tan-stack/api-helper";
import { loadPlatformSession } from "@/lib/tan-stack/platform-auth/storage";

export type PlatformUser = {
  id: string;
  email: string;
  fullName: string;
  role: "super_admin" | "support";
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListPlatformUsersResponse = {
  items: PlatformUser[];
  nextCursor: string | null;
};

export type CreatePlatformUserInput = {
  email: string;
  password: string;
  fullName: string;
  role?: "super_admin" | "support";
  isActive?: boolean;
};

export type UpdatePlatformUserInput = Partial<{
  email: string;
  password: string;
  fullName: string;
  role: "super_admin" | "support";
  isActive: boolean;
}>;

/** Ensures apiClient does NOT fall back to POS `loadAuthSession()` token. */
function platformApiConfig(): { token: string; _skipRefresh: true } {
  const access = loadPlatformSession()?.accessToken;
  if (!access) {
    throw new Error("Platform session missing: login at /platform-admin/login");
  }
  return { token: access, _skipRefresh: true };
}

export async function listPlatformUsersRequest(params?: {
  q?: string;
  limit?: number;
  cursor?: string;
}): Promise<ListPlatformUsersResponse> {
  const res = await apiClient.get<ListPlatformUsersResponse>("platform-users", {
    ...platformApiConfig(),
    params,
  });
  return res.data;
}

export async function getPlatformUserByIdRequest(id: string): Promise<PlatformUser> {
  const res = await apiClient.get<PlatformUser>(`platform-users/${id}`, {
    ...platformApiConfig(),
  });
  return res.data;
}

export async function createPlatformUserRequest(
  input: CreatePlatformUserInput,
): Promise<PlatformUser> {
  const res = await apiClient.post<PlatformUser>("platform-users", input, {
    ...platformApiConfig(),
  });
  return res.data;
}

export async function updatePlatformUserRequest(args: {
  id: string;
  input: UpdatePlatformUserInput;
}): Promise<PlatformUser> {
  const res = await apiClient.patch<PlatformUser>(
    `platform-users/${args.id}`,
    args.input,
    { ...platformApiConfig() },
  );
  return res.data;
}

export async function deactivatePlatformUserRequest(id: string): Promise<{ ok: true }> {
  const res = await apiClient.delete<{ ok: true }>(`platform-users/${id}`, {
    ...platformApiConfig(),
  });
  return res.data;
}