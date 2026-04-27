export const PLATFORM_PLANS_KEYS = {
    all: () => ["platform-plans"] as const,
    list: (params: { q?: string; includeInactive?: boolean } = {}) =>
      ["platform-plans", "list", params] as const,
    byId: (id: string) => ["platform-plans", "byId", id] as const,
  };