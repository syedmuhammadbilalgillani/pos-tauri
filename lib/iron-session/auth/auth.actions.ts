"use server";

import { revalidatePath } from "next/cache";
import { apiClient } from "@/lib/api-helper";
import { getSession } from "../session";
import type { AuthUser } from "@/types";

export type AuthSnapshot = {
  user: AuthUser | null;
};

type PosLoginResponse = {
  data: {
    id: string;
    name: string | null;
    email: string;
    tenantId: string;
    accessToken: string;
    refreshToken: string;
    isAuthenticated: true;
  };
};

function applyUserToSession(
  session: Awaited<ReturnType<typeof getSession>>,
  payload: PosLoginResponse["data"],
) {
  session.userId = payload.id;
  session.tenantId = payload.tenantId;
  session.userName = payload.name ?? "";
  session.userEmail = payload.email;
  session.accessToken = payload.accessToken;
  session.refreshToken = payload.refreshToken;
  session.isAuthenticated = true;
}

function clearAuthFields(session: Awaited<ReturnType<typeof getSession>>) {
  delete session.accessToken;
  delete session.refreshToken;
  delete session.isAuthenticated;

  delete session.userId;
  delete session.tenantId;
  delete session.userName;
  delete session.userEmail;
}

export async function getAuthSnapshot(): Promise<AuthSnapshot> {
  const session = await getSession();

  const ok =
    session.isAuthenticated === true &&
    typeof session.accessToken === "string" &&
    session.accessToken.length > 0 &&
    typeof session.userId === "string" &&
    session.userId.length > 0 &&
    typeof session.tenantId === "string" &&
    session.tenantId.length > 0;

  if (!ok) return { user: null };

  return {
    user: {
      id: session.userId!,
      tenantId: session.tenantId!,
      name:
        (typeof session.userName === "string" && session.userName) || "User",
      email: (typeof session.userEmail === "string" && session.userEmail) || "",
      accessToken: session.accessToken!,
      refreshToken: session.refreshToken!,
      isAuthenticated: session?.isAuthenticated ?? false,
    },
  };
}

export async function loginWithPasswordAction(
  email: string,
  password: string,
  rememberMe: boolean,
) {
  try {
    const res = await apiClient.post<PosLoginResponse>("users/pos/login", {
      email,
      password,
      rememberMe,
    });

    const payload = res.data?.data;
    if (!payload?.accessToken || !payload?.refreshToken) {
      return { success: false as const, error: "Login failed" };
    }

    const session = await getSession();
    applyUserToSession(session, payload);
    await session.save();

    revalidatePath("/", "layout");
    return { success: true as const };
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Login failed",
    };
  }
}

export async function logoutAction() {
  const session = await getSession();
  clearAuthFields(session);
  await session.save();
  revalidatePath("/", "layout");
}
