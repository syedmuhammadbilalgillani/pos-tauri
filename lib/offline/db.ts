"use client";

import { isTauri } from "@/lib/tan-stack/auth/runtime";

// Database is the default export from @tauri-apps/plugin-sql
type SqlDatabase = Awaited<ReturnType<typeof import("@tauri-apps/plugin-sql")["default"]["load"]>>;
let _db: SqlDatabase | null = null;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS offline_orders (
    local_id    TEXT PRIMARY KEY,
    server_id   TEXT,
    status      TEXT NOT NULL DEFAULT 'pending',
    payload     TEXT NOT NULL,
    created_at  INTEGER NOT NULL,
    synced_at   INTEGER,
    error_msg   TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS menu_cache (
    cache_key   TEXT PRIMARY KEY,
    data        TEXT NOT NULL,
    cached_at   INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS local_tickets (
    token       TEXT PRIMARY KEY,
    order_type  TEXT NOT NULL DEFAULT 'takeaway',
    table_number TEXT,
    cart_items  TEXT NOT NULL DEFAULT '[]',
    status      TEXT NOT NULL DEFAULT 'active',
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
  );
`;

export async function getDb() {
  if (!isTauri()) return null;
  if (_db) return _db;

  const { default: Database } = await import("@tauri-apps/plugin-sql");
  _db = await Database.load("sqlite:pos-offline.db");

  // Run schema migrations (idempotent)
  for (const stmt of SCHEMA.split(";").map((s) => s.trim()).filter(Boolean)) {
    await _db.execute(stmt + ";");
  }

  return _db;
}

// ─── Offline orders ───────────────────────────────────────────────────────────

export type OfflineOrderStatus = "pending" | "syncing" | "synced" | "failed";

export type OfflineOrderRow = {
  local_id: string;
  server_id: string | null;
  status: OfflineOrderStatus;
  payload: string;
  created_at: number;
  synced_at: number | null;
  error_msg: string | null;
  retry_count: number;
};

export async function insertOfflineOrder(
  localId: string,
  payload: object,
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.execute(
    `INSERT OR REPLACE INTO offline_orders (local_id, status, payload, created_at)
     VALUES ($1, 'pending', $2, $3)`,
    [localId, JSON.stringify(payload), Date.now()],
  );
}

export async function getPendingOfflineOrders(): Promise<OfflineOrderRow[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select<OfflineOrderRow[]>(
    `SELECT * FROM offline_orders WHERE status IN ('pending', 'failed') AND retry_count < 3 ORDER BY created_at ASC`,
  );
}

export async function markOfflineOrderSynced(
  localId: string,
  serverId: string,
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.execute(
    `UPDATE offline_orders SET status='synced', server_id=$1, synced_at=$2, error_msg=NULL WHERE local_id=$3`,
    [serverId, Date.now(), localId],
  );
}

export async function markOfflineOrderFailed(
  localId: string,
  error: string,
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.execute(
    `UPDATE offline_orders SET status='failed', error_msg=$1, retry_count=retry_count+1 WHERE local_id=$2`,
    [error, localId],
  );
}

export async function deleteOfflineOrder(localId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.execute(`DELETE FROM offline_orders WHERE local_id=$1`, [localId]);
}

export async function getAllOfflineOrders(): Promise<OfflineOrderRow[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select<OfflineOrderRow[]>(
    `SELECT * FROM offline_orders ORDER BY created_at DESC`,
  );
}

// ─── Local held tickets ──────────────────────────────────────────────────────

export type LocalTicketRow = {
  token: string;
  order_type: string;
  table_number: string | null;
  cart_items: string; // JSON
  status: "active" | "held";
  created_at: number;
  updated_at: number;
};

export async function saveLocalTicket(ticket: {
  token: string;
  orderType: string;
  tableNumber?: string;
  cartItems: unknown[];
  status?: "active" | "held";
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const now = Date.now();
  await db.execute(
    `INSERT INTO local_tickets (token, order_type, table_number, cart_items, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT(token) DO UPDATE SET
       order_type=$2, table_number=$3, cart_items=$4, status=$5, updated_at=$7`,
    [
      ticket.token,
      ticket.orderType,
      ticket.tableNumber ?? null,
      JSON.stringify(ticket.cartItems),
      ticket.status ?? "active",
      now,
      now,
    ],
  );
}

export async function getLocalHeldTickets(): Promise<LocalTicketRow[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select<LocalTicketRow[]>(
    `SELECT * FROM local_tickets WHERE status='held' ORDER BY updated_at DESC`,
  );
}

export async function getLocalTicket(token: string): Promise<LocalTicketRow | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select<LocalTicketRow[]>(
    `SELECT * FROM local_tickets WHERE token=$1`,
    [token],
  );
  return rows[0] ?? null;
}

export async function deleteLocalTicket(token: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.execute(`DELETE FROM local_tickets WHERE token=$1`, [token]);
}

// ─── Menu cache ───────────────────────────────────────────────────────────────

export async function setMenuCache(key: string, data: unknown): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.execute(
    `INSERT OR REPLACE INTO menu_cache (cache_key, data, cached_at) VALUES ($1, $2, $3)`,
    [key, JSON.stringify(data), Date.now()],
  );
}

export async function getMenuCache<T>(
  key: string,
  maxAgeMs = 24 * 60 * 60 * 1000,
): Promise<T | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select<{ data: string; cached_at: number }[]>(
    `SELECT data, cached_at FROM menu_cache WHERE cache_key=$1`,
    [key],
  );
  if (!rows.length) return null;
  const row = rows[0];
  if (Date.now() - row.cached_at > maxAgeMs) return null;
  try {
    return JSON.parse(row.data) as T;
  } catch {
    return null;
  }
}
