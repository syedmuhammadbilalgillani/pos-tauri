export interface AuthUser {
    id: string;
    name: string;
    email: string;
    tenantId?: string;
    accessToken: string;
    refreshToken: string;
    isAuthenticated: boolean;
  }