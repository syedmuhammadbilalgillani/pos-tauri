export const BRANDS_KEYS = {
    all: () => ["brands"] as const,
    list: (tenantId: string, params: { q?: string; isActive?: boolean } = {}) =>
      ["brands", "list", tenantId, params] as const,
    byId: (tenantId: string, id: string) => ["brands", "byId", tenantId, id] as const,
  } as const;