// tauri-pos/lib/tan-stack/pos/ticket-token.ts

const KEY = "pos-ticket-token"

export function loadTicketToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(KEY)
}

export async function saveTicketToken(token: string): Promise<void> {
  localStorage.setItem(KEY, token)
}

export async function clearTicketToken(): Promise<void> {
  localStorage.removeItem(KEY)
}