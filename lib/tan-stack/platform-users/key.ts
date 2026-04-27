export const PLATFORM_USERS_KEYS = {
    all: () => ["platform-users"] as const,
    list: (params: { q?: string } = {}) => ["platform-users", "list", params] as const,
    byId: (id: string) => ["platform-users", "byId", id] as const,
  };