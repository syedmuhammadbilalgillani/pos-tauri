/** User profile cached for offline UI (no secrets). */
export type AuthUser = {
  id: string;
  name: string | null;
  email: string;
  tenantId: string;
};

/** Full session including tokens (persisted locally for offline-first). */
export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  updatedAt: number;
};

export type PosLoginResponseBody = {
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

export type PosRefreshResponseBody = {
  accessToken: string;
  refreshToken: string;
};