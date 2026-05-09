import { getDatabase, getDBType } from './db';
import { apiClient } from '../tan-stack/api-helper';
import { loadAuthSession } from '../tan-stack/auth/storage';

/**
 * Sync menu data from server to local cache (SQLite for Tauri, skipped for web)
 */
export async function syncMenuDataToLocal() {
  const dbType = getDBType();

  // Only sync to SQLite in Tauri desktop environment
  if (dbType !== 'sqlite') {
    console.log('Skipping menu sync (web environment uses TanStack Query caching)');
    return;
  }

  const db = await getDatabase();
  const session = loadAuthSession();

  if (!session?.accessToken) {
    console.warn('Not authenticated, skipping menu sync');
    return;
  }

  try {
    const response = await apiClient.get<{
      data: {
        menus: Array<{
          id: string;
          items: Array<{
            id: string;
            menuId: string;
            categoryId: string;
            sku: string | null;
            name: string;
            slug: string;
            description: string | null;
            imageUrl: string | null;
            basePrice: string;
            modifierGroups: Array<{
              id: string;
              name: string;
              selectionType: 'single' | 'multiple' | 'exactly';
              minSelections: number | null;
              maxSelections: number | null;
              isRequired: boolean;
              modifiers: Array<{
                id: string;
                name: string;
                priceAdjustment: string;
              }>;
            }>;
          }>;
          categories: Array<{
            id: string;
            name: string;
            displayOrder: number;
          }>;
        }>;
      };
    }>('/restaurant/menus/bootstrap', {
      headers: {
        'x-location-id': session?.user?.activeLocationId ?? '',
      },
    });

    const menus = response.data?.data?.menus ?? [];

    for (const menu of menus) {
      // Sync categories
      for (const category of menu.categories) {
        await db.execute(
          `INSERT OR REPLACE INTO categories (id, menuId, name, displayOrder, isActive, syncedAt)
           VALUES (?, ?, ?, ?, true, CURRENT_TIMESTAMP)`,
          [category.id, menu.id, category.name, category.displayOrder],
        );
      }

      // Sync items, modifier groups, and modifiers
      for (const item of menu.items) {
        await db.execute(
          `INSERT OR REPLACE INTO menu_items
           (id, menuId, categoryId, sku, name, slug, description, imageUrl, basePrice, isActive, syncedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true, CURRENT_TIMESTAMP)`,
          [
            item.id,
            menu.id,
            item.categoryId,
            item.sku,
            item.name,
            item.slug,
            item.description,
            item.imageUrl,
            item.basePrice,
          ],
        );

        // Sync modifier groups and modifiers
        for (const group of item.modifierGroups) {
          await db.execute(
            `INSERT OR REPLACE INTO modifier_groups
             (id, menuItemId, name, selectionType, minSelections, maxSelections, isRequired, syncedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [
              group.id,
              item.id,
              group.name,
              group.selectionType,
              group.minSelections,
              group.maxSelections,
              group.isRequired ? 1 : 0,
            ],
          );

          for (const modifier of group.modifiers) {
            await db.execute(
              `INSERT OR REPLACE INTO modifiers (id, modifierGroupId, name, priceAdjustment, syncedAt)
               VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
              [modifier.id, group.id, modifier.name, modifier.priceAdjustment],
            );
          }
        }
      }
    }

    console.log('Menu data synced to local database');
  } catch (error) {
    console.error('Failed to sync menu data:', error);
    throw error;
  }
}

/**
 * Sync discounts from server to local cache (SQLite only)
 */
export async function syncDiscountsToLocal() {
  const dbType = getDBType();

  // Only sync to SQLite in Tauri desktop environment
  if (dbType !== 'sqlite') {
    return;
  }

  const session = loadAuthSession();

  if (!session?.accessToken) {
    console.warn('Not authenticated, skipping discount sync');
    return;
  }

  try {
    // Discounts validated on-demand via server
    console.log('Discount sync (Tauri only)');
  } catch (error) {
    console.error('Failed to sync discounts:', error);
  }
}

/**
 * Queue an order for sync when online
 */
export async function queueOrderForSync(orderData: Record<string, unknown>) {
  const db = await getDatabase();
  const orderId = `pending-${Date.now()}`;

  await db.execute(
    `INSERT INTO orders_queue (id, orderData, status) VALUES (?, ?, 'pending')`,
    [orderId, JSON.stringify(orderData)],
  );

  return orderId;
}

/**
 * Sync queued orders to server
 */
export async function syncQueuedOrders() {
  const db = await getDatabase();
  const session = loadAuthSession();

  if (!session?.accessToken) {
    console.warn('Not authenticated, skipping queued order sync');
    return;
  }

  try {
    const rows = await db.select<Array<{ id: string; orderData: string }>>(
      `SELECT id, orderData FROM orders_queue WHERE status = 'pending'`,
    );

    for (const row of rows) {
      try {
        const orderData = JSON.parse(row.orderData);
        // Submit to server
        await apiClient.post('/pos/tickets/convert', orderData);

        // Mark as synced
        await db.execute(
          `UPDATE orders_queue SET status = 'synced', syncedAt = CURRENT_TIMESTAMP WHERE id = ?`,
          [row.id],
        );
      } catch (error) {
        console.error(`Failed to sync order ${row.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Failed to sync queued orders:', error);
  }
}
