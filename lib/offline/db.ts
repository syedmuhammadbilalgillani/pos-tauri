/**
 * Offline database layer
 * Supports both IndexedDB (web) and SQLite (Tauri desktop)
 */

type DBType = 'indexeddb' | 'sqlite';

interface Database {
  execute(sql: string, params?: unknown[]): Promise<void>;
  select<T>(sql: string, params?: unknown[]): Promise<T[]>;
  close(): Promise<void>;
}

class IndexedDBAdapter implements Database {
  private db: IDBDatabase | null = null;
  private readonly storeName = 'pos_cache';

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('pos_db', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  async execute(): Promise<void> {
    // IndexedDB doesn't use SQL, this is a no-op for schema creation
  }

  async select<T>(): Promise<T[]> {
    // For web, return empty - menu data synced from server via TanStack Query
    return [];
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

let dbAdapter: Database | null = null;
let dbType: DBType = 'indexeddb';

/**
 * Initialize local database (auto-detects environment)
 */
export async function initializeLocalDB(): Promise<Database> {
  if (dbAdapter) return dbAdapter;

  // Check if running in Tauri context
  const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

  if (isTauri) {
    // Use SQLite via Tauri plugin
    try {
      const TauriSqlModule = await import('@tauri-apps/plugin-sql');
      const TauriSql = (TauriSqlModule as Record<string, unknown>).default as {
        open(path: string): Promise<Database>;
      };
      const tauriDb = await TauriSql.open('sqlite:pos_cache.db');
      dbType = 'sqlite';
      dbAdapter = tauriDb;
      await createSchema();
      return dbAdapter;
    } catch (error) {
      console.warn('Failed to initialize Tauri SQL, falling back to IndexedDB:', error);
    }
  }

  // Fall back to IndexedDB for web
  dbType = 'indexeddb';
  const adapter = new IndexedDBAdapter();
  await adapter.initialize();
  dbAdapter = adapter;
  return dbAdapter;
}

async function createSchema() {
  if (!dbAdapter || dbType !== 'sqlite') return;

  await dbAdapter.execute(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      menuId TEXT NOT NULL,
      categoryId TEXT NOT NULL,
      sku TEXT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE,
      description TEXT,
      imageUrl TEXT,
      basePrice TEXT NOT NULL,
      isActive BOOLEAN DEFAULT true,
      syncedAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS modifier_groups (
      id TEXT PRIMARY KEY,
      menuItemId TEXT NOT NULL,
      name TEXT NOT NULL,
      selectionType TEXT NOT NULL,
      minSelections INTEGER,
      maxSelections INTEGER,
      isRequired BOOLEAN DEFAULT false,
      syncedAt DATETIME,
      FOREIGN KEY (menuItemId) REFERENCES menu_items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS modifiers (
      id TEXT PRIMARY KEY,
      modifierGroupId TEXT NOT NULL,
      name TEXT NOT NULL,
      priceAdjustment TEXT NOT NULL,
      isActive BOOLEAN DEFAULT true,
      syncedAt DATETIME,
      FOREIGN KEY (modifierGroupId) REFERENCES modifier_groups(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      menuId TEXT NOT NULL,
      name TEXT NOT NULL,
      displayOrder INTEGER,
      isActive BOOLEAN DEFAULT true,
      syncedAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS discounts (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      discountType TEXT NOT NULL,
      value TEXT NOT NULL,
      maxDiscountCap TEXT,
      isActive BOOLEAN DEFAULT true,
      validFrom DATETIME,
      validUntil DATETIME,
      syncedAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders_queue (
      id TEXT PRIMARY KEY,
      orderData TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      syncedAt DATETIME
    );

    CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(categoryId);
    CREATE INDEX IF NOT EXISTS idx_menu_items_sku ON menu_items(sku);
    CREATE INDEX IF NOT EXISTS idx_modifier_groups_item ON modifier_groups(menuItemId);
    CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts(code);
  `);
}

export async function getDatabase(): Promise<Database> {
  if (!dbAdapter) {
    return initializeLocalDB();
  }
  return dbAdapter;
}

export function getDBType(): DBType {
  return dbType;
}

export async function closeDatabase() {
  if (dbAdapter) {
    await dbAdapter.close();
    dbAdapter = null;
  }
}
