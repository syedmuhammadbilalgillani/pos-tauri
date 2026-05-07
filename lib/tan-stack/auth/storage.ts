import type { AuthSession } from "@/types";
import { isTauri } from "./runtime";
import Cookies from "js-cookie";

const STORAGE_KEY = "pos-auth-session";
const STORE_FILE = "pos-auth.json";

/** In-memory copy — source of truth for sync reads (api-helper). */
let cache: AuthSession | null = null;

function safeParse(raw: string | null): AuthSession | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as AuthSession;
    if (
      v &&
      typeof v.accessToken === "string" &&
      typeof v.refreshToken === "string" &&
      v.user &&
      typeof v.user.id === "string" &&
      typeof v.user.tenantId === "string"
    ) {
      return v;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function loadFromLocalStorage(): AuthSession | null {
  return safeParse(Cookies.get(STORAGE_KEY) ?? null);
}

async function getTauriStore() {
  const { LazyStore } = await import("@tauri-apps/plugin-store");
  return new LazyStore(STORE_FILE);
}

async function loadFromTauriDisk(): Promise<AuthSession | null> {
  const store = await getTauriStore();
  const value = await store.get<AuthSession>(STORAGE_KEY);
  return value ?? null;
}

/** Call once on app startup (see Providers). Loads Tauri disk → cache. */
export async function hydrateAuthStorage(): Promise<void> {
  if (!isTauri()) {
    cache = loadFromLocalStorage();
    return;
  }
  cache = await loadFromTauriDisk();
}

/** Sync read for api-helper / interceptors. */
export function loadAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  if (cache !== null) return cache;
  if (!isTauri()) {
    cache = loadFromLocalStorage();
  }
  return cache;
}

export async function saveAuthSession(session: AuthSession): Promise<void> {
  cache = session;
  if (isTauri()) {
    const store = await getTauriStore();
    await store.set(STORAGE_KEY, session);
    await store.save();
  } else {
    Cookies.set(STORAGE_KEY, JSON.stringify(session));
  }
}

export async function clearAuthSession(): Promise<void> {
  cache = null;
  if (isTauri()) {
    const store = await getTauriStore();
    await store.delete(STORAGE_KEY);
    await store.save();
  } else {
    Cookies.remove(STORAGE_KEY);
  }
}

/** Update tokens only — called after a successful token refresh. */
export async function updateSessionTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  const current = loadAuthSession();
  if (!current) return;
  await saveAuthSession({
    ...current,
    accessToken,
    refreshToken,
    updatedAt: Date.now(),
  });
}

/** Update permissions only — called after fetching /me with a location context. */
export async function updateSessionPermissions(
  permissions: any,
  permissionsUpdatedAt: number,
): Promise<void> {
  const current = loadAuthSession();
  if (!current) return;
  await saveAuthSession({
    ...current,
    updatedAt: Date.now(),
    user: {
      ...current.user,
      permissions,
      permissionsUpdatedAt,
    },
  });
}

export async function setActiveLocationId(locationId: string): Promise<void> {
  const current = loadAuthSession();
  if (!current) return;
  await saveAuthSession({
    ...current,
    updatedAt: Date.now(),
    user: {
      ...current.user,
      activeLocationId: locationId,
    },
  });
}
