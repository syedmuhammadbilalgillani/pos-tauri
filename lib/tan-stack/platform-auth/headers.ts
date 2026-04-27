import { loadPlatformSession } from "./storage";

export function platformAuthHeaders(): HeadersInit {
  const token = loadPlatformSession()?.accessToken ?? null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}