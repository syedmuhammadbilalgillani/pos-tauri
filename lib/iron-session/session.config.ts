import { SessionOptions } from "iron-session";

export interface SessionData {
  isAuthenticated?: boolean;

  userId?: string;
  tenantId?: string;

  userName?: string;
  userEmail?: string;

  accessToken?: string;
  refreshToken?: string;

  // allow non-auth extras (geo, ui prefs, etc.)
  [key: string]: unknown;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "fh-session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
  ttl: 60 * 60 * 24 * 14,
};