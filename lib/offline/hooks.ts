'use client';

import { useQuery } from '@tanstack/react-query';
import { getItemDetailsLocally, getMenuCategoriesLocally } from './discount-validator';
import { calculateOfflineCartTotal, type CartItem } from './cart-calculator';
import { useMenuItemDetailQuery } from '../tan-stack/pos/query';
import { useGetMenuCategoriesQuery, useQuotePosTicketQuery } from '../tan-stack/pos/query';

/**
 * Hook to get item details with fallback from local cache
 * Returns instantly from cache if available, syncs from server in background
 */
export function useOfflineMenuItemDetailQuery(slug: string | null, enabled: boolean = true) {
  const serverQuery = useMenuItemDetailQuery(slug, enabled);

  return useQuery({
    queryKey: ['offline-menu-item', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Slug is required');

      // Try to get from local cache first
      try {
        const localItem = await getItemDetailsLocally(slug);
        if (localItem) {
          // Kick off a background server sync
          serverQuery.refetch().catch(() => {
            /* ignore server sync errors */
          });
          return localItem;
        }
      } catch (err) {
        console.warn('Failed to get item from local cache:', err);
      }

      // Fall back to server if not in cache
      if (serverQuery.data) {
        return serverQuery.data;
      }

      throw new Error('Item not found');
    },
    enabled: enabled && Boolean(slug),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Hook to get menu categories with fallback from local cache
 * Returns instantly from cache if available
 */
export function useOfflineMenuCategoriesQuery(menuId: string, enabled: boolean = true) {
  const serverQuery = useGetMenuCategoriesQuery();

  return useQuery({
    queryKey: ['offline-menu-categories', menuId],
    queryFn: async () => {
      if (!menuId) throw new Error('Menu ID is required');

      // Try to get from local cache first
      try {
        const localCategories = await getMenuCategoriesLocally(menuId);
        if (localCategories.length > 0) {
          // Kick off a background server sync
          serverQuery.refetch().catch(() => {
            /* ignore server sync errors */
          });
          return {
            meta: {
              categories: localCategories,
              menu: { id: menuId },
            },
          };
        }
      } catch (err) {
        console.warn('Failed to get categories from local cache:', err);
      }

      // Fall back to server if not in cache
      if (serverQuery.data) {
        return serverQuery.data;
      }

      throw new Error('Categories not found');
    },
    enabled: enabled && Boolean(menuId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Hook to quote cart with fallback to local calculation
 * Uses server quote if available, falls back to local calculation for offline mode
 */
export function useOfflineQuoteQuery(
  ticketToken: string | null,
  cartItems: CartItem[],
  discountAmount: string = '0',
  enabled: boolean = true,
) {
  const serverQuoteQ = useQuotePosTicketQuery(ticketToken, enabled);

  return useQuery({
    queryKey: ['offline-quote', ticketToken, JSON.stringify(cartItems), discountAmount],
    queryFn: async () => {
      // Prefer server quote if available and fresh
      if (serverQuoteQ.data && !serverQuoteQ.isError) {
        return serverQuoteQ.data;
      }

      // Fall back to local calculation for offline mode
      const localTotal = calculateOfflineCartTotal(cartItems, discountAmount, 0.08);
      return {
        subtotal: localTotal.subtotal,
        discountAmount: localTotal.discountAmount,
        taxableAmount: localTotal.taxableAmount,
        taxAmount: localTotal.taxAmount,
        total: localTotal.total,
        issues: [],
      };
    },
    enabled: enabled && (serverQuoteQ.isSuccess || serverQuoteQ.isError),
    staleTime: 1000 * 30, // 30 seconds
  });
}
