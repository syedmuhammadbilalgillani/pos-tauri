// tauri-pos/lib/tan-stack/pos/ticket-token.ts

import { isTauri } from "@/lib/tan-stack/auth/runtime";

const KEY = "pos-ticket-token";
const STORE_FILE = "pos-auth.json";

async function getTauriStore() {
  const { LazyStore } = await import("@tauri-apps/plugin-store");
  return new LazyStore(STORE_FILE);
}

export function loadTicketToken(): string | null {
  if (typeof window === "undefined") return null;
  // Tauri: in-memory cache is not available synchronously for the store,
  // so we fall back to localStorage which exists in Tauri's webview too.
  // The async saveTicketToken/clearTicketToken keep both in sync.
  return localStorage.getItem(KEY);
}

export async function saveTicketToken(token: string): Promise<void> {
  localStorage.setItem(KEY, token);
  if (isTauri()) {
    try {
      const store = await getTauriStore();
      await store.set(KEY, token);
      await store.save();
    } catch {
      // Tauri store write failed; localStorage already saved — non-fatal
    }
  }
}

export async function clearTicketToken(): Promise<void> {
  localStorage.removeItem(KEY);
  if (isTauri()) {
    try {
      const store = await getTauriStore();
      await store.delete(KEY);
      await store.save();
    } catch {
      // Non-fatal
    }
  }
}
