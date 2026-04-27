export const PLATFORM_AUTH_KEYS = {
    all: ["platform-auth"] as const,
    session: () => [...PLATFORM_AUTH_KEYS.all, "session"] as const,
  };