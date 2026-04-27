import { isTauri } from "@/lib/tan-stack/auth/runtime";

const STORAGE_KEY = "platform-auth-session";
const STORE_FILE = "platform-auth.json";

/** In-memory copy — source of truth for sync reads (api headers). */
let cache: PlatformSession | null = null;

export type PlatformSession = {
  user: { id: string; email: string; fullName?: string; role: string };
  accessToken: string;
  refreshToken: string;
  updatedAt: number;
};

function safeParse(raw: string | null): PlatformSession | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as PlatformSession;
    if (
      v &&
      typeof v.accessToken === "string" &&
      typeof v.refreshToken === "string" &&
      v.user &&
      typeof v.user.id === "string" &&
      typeof v.user.email === "string" &&
      typeof v.user.role === "string"
    ) {
      return v;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function loadFromLocalStorage(): PlatformSession | null {
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

async function getTauriStore() {
  const { LazyStore } = await import("@tauri-apps/plugin-store");
  return new LazyStore(STORE_FILE);
}

async function loadFromTauriDisk(): Promise<PlatformSession | null> {
  const store = await getTauriStore();
  const value = await store.get<PlatformSession>(STORAGE_KEY);
  return value ?? null;
}

/** Call once on app startup (inside a platform-admin provider/hydrator). */
export async function hydratePlatformAuthStorage(): Promise<void> {
  if (!isTauri()) {
    cache = loadFromLocalStorage();
    return;
  }
  cache = await loadFromTauriDisk();
}

/** Sync read for headers. */
export function loadPlatformSession(): PlatformSession | null {
  if (typeof window === "undefined") return null;
  if (cache !== null) return cache;
  if (!isTauri()) cache = loadFromLocalStorage();
  return cache;
}

export async function savePlatformSession(session: PlatformSession): Promise<void> {
  cache = session;
  if (isTauri()) {
    const store = await getTauriStore();
    await store.set(STORAGE_KEY, session);
    await store.save();
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }
}

export async function clearPlatformSession(): Promise<void> {
  cache = null;
  if (isTauri()) {
    const store = await getTauriStore();
    await store.delete(STORAGE_KEY);
    await store.save();
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export async function updatePlatformTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  const current = loadPlatformSession();
  if (!current) return;
  await savePlatformSession({
    ...current,
    accessToken,
    refreshToken,
    updatedAt: Date.now(),
  });
}