"use client";

import { getMenuCache, setMenuCache } from "@/lib/offline/db";
import type { POSCategoryResponse } from "@/types";

const KEY_CATEGORIES = "pos:menu-categories";
const KEY_ITEMS_PREFIX = "pos:menu-items:";

export async function cacheMenuCategories(data: POSCategoryResponse): Promise<void> {
  await setMenuCache(KEY_CATEGORIES, data);
}

export async function getCachedMenuCategories(): Promise<POSCategoryResponse | null> {
  return getMenuCache<POSCategoryResponse>(KEY_CATEGORIES);
}

export async function cacheMenuItems(
  categoryId: string,
  menuId: string,
  data: unknown,
): Promise<void> {
  await setMenuCache(`${KEY_ITEMS_PREFIX}${menuId}:${categoryId}`, data);
}

export async function getCachedMenuItems(
  categoryId: string,
  menuId: string,
): Promise<unknown | null> {
  return getMenuCache(`${KEY_ITEMS_PREFIX}${menuId}:${categoryId}`);
}
