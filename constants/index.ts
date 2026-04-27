// export const API_URL = "http://127.0.0.1:4040/api/v1";
// export const REALTIME_URL = "http://192.168.100.70:4040/realtime";
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
export const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL || "";
export const SESSION_SECRET = process.env.NEXT_PUBLIC_SESSION_SECRET || "";
