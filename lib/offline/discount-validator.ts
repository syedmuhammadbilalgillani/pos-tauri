import { getDatabase, getDBType } from './db';

export interface LocalDiscountResult {
  valid: boolean;
  discount?: {
    id: string;
    code: string;
    name: string;
    discountType: 'percentage' | 'fixed_amount' | 'free_item' | 'bogo';
    value: string;
    maxDiscountCap: string | null;
    calculatedDiscount: string;
    message: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Validate discount code locally from cache
 * Falls back to server validation if offline or code not found locally
 * Returns "not found" in web mode to trigger server validation
 */
export async function validateDiscountCodeLocally(
  code: string,
  subtotal: string,
): Promise<LocalDiscountResult> {
  const dbType = getDBType();
  const normalizedCode = code.trim().toUpperCase();

  // In web mode, skip local validation and let server handle it
  if (dbType !== 'sqlite') {
    return {
      valid: false,
      error: {
        code: 'WEB_MODE',
        message: 'Local validation skipped in web mode',
      },
    };
  }

  const db = await getDatabase();

  try {
    const rows = await db.select<
      Array<{
        id: string;
        code: string;
        name: string;
        discountType: string;
        value: string;
        maxDiscountCap: string | null;
        validFrom: string | null;
        validUntil: string | null;
      }>
    >(
      `SELECT id, code, name, discountType, value, maxDiscountCap, validFrom, validUntil
       FROM discounts WHERE code = ? AND isActive = true`,
      [normalizedCode],
    );

    if (!rows.length) {
      return {
        valid: false,
        error: {
          code: 'DISCOUNT_NOT_FOUND',
          message: 'Invalid discount code',
        },
      };
    }

    const discount = rows[0];
    const now = new Date();

    // Check validity dates
    if (discount.validFrom && new Date(discount.validFrom) > now) {
      return {
        valid: false,
        error: {
          code: 'DISCOUNT_NOT_ACTIVE',
          message: 'Discount code is not yet active',
        },
      };
    }

    if (discount.validUntil && new Date(discount.validUntil) < now) {
      return {
        valid: false,
        error: {
          code: 'DISCOUNT_EXPIRED',
          message: 'Discount code has expired',
        },
      };
    }

    // Calculate discount
    const subtotalNum = parseFloat(subtotal);
    let calculatedAmount = '0';

    if (discount.discountType === 'percentage') {
      const percentage = parseFloat(discount.value);
      calculatedAmount = (subtotalNum * (percentage / 100)).toFixed(2);
    } else if (discount.discountType === 'fixed_amount') {
      calculatedAmount = discount.value;
    }

    // Apply cap if present
    if (discount.maxDiscountCap) {
      const cap = parseFloat(discount.maxDiscountCap);
      const calculated = parseFloat(calculatedAmount);
      if (calculated > cap) {
        calculatedAmount = cap.toFixed(2);
      }
    }

    return {
      valid: true,
      discount: {
        id: discount.id,
        code: discount.code,
        name: discount.name,
        discountType: discount.discountType as
          | 'percentage'
          | 'fixed_amount'
          | 'free_item'
          | 'bogo',
        value: discount.value,
        maxDiscountCap: discount.maxDiscountCap,
        calculatedDiscount: calculatedAmount,
        message: `${discount.name} - ${calculatedAmount} off`,
      },
    };
  } catch (error) {
    console.error('Failed to validate discount locally:', error);
    return {
      valid: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Could not validate discount offline',
      },
    };
  }
}

/**
 * Get item details with modifiers from local cache
 * Returns null in web mode to trigger server fetch
 */
export async function getItemDetailsLocally(itemId: string) {
  const dbType = getDBType();

  if (dbType !== 'sqlite') {
    return null; // Let server handle in web mode
  }

  const db = await getDatabase();

  try {
    const itemRows = await db.select<
      Array<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        basePrice: string;
        imageUrl: string | null;
      }>
    >(`SELECT id, name, slug, description, basePrice, imageUrl FROM menu_items WHERE id = ?`, [
      itemId,
    ]);

    if (!itemRows.length) {
      return null;
    }

    const item = itemRows[0];

    const groupRows = await db.select<
      Array<{
        id: string;
        name: string;
        selectionType: string;
        minSelections: number | null;
        maxSelections: number | null;
        isRequired: boolean;
      }>
    >(
      `SELECT id, name, selectionType, minSelections, maxSelections, isRequired
       FROM modifier_groups WHERE menuItemId = ? ORDER BY id`,
      [itemId],
    );

    const modifierGroups = [];
    for (const group of groupRows) {
      const modifierRows = await db.select<
        Array<{
          id: string;
          name: string;
          priceAdjustment: string;
        }>
      >(`SELECT id, name, priceAdjustment FROM modifiers WHERE modifierGroupId = ? ORDER BY id`, [
        group.id,
      ]);

      modifierGroups.push({
        id: group.id,
        name: group.name,
        selectionType: group.selectionType,
        minSelections: group.minSelections,
        maxSelections: group.maxSelections,
        isRequired: group.isRequired,
        modifiers: modifierRows.map((m) => ({
          id: m.id,
          name: m.name,
          priceAdjustment: m.priceAdjustment,
        })),
      });
    }

    return {
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      basePrice: item.basePrice,
      imageUrl: item.imageUrl,
      modifierGroups,
    };
  } catch (error) {
    console.error('Failed to get item details locally:', error);
    return null;
  }
}

/**
 * Get all categories with items from local cache
 * Returns empty array in web mode to trigger server fetch
 */
export async function getMenuCategoriesLocally(menuId: string) {
  const dbType = getDBType();

  if (dbType !== 'sqlite') {
    return []; // Let server handle in web mode
  }

  const db = await getDatabase();

  try {
    const categoryRows = await db.select<
      Array<{
        id: string;
        name: string;
        displayOrder: number;
      }>
    >(
      `SELECT id, name, displayOrder FROM categories WHERE menuId = ? AND isActive = true ORDER BY displayOrder`,
      [menuId],
    );

    const categories = [];
    for (const category of categoryRows) {
      const itemRows = await db.select<
        Array<{
          id: string;
          name: string;
          basePrice: string;
          imageUrl: string | null;
        }>
      >(
        `SELECT id, name, basePrice, imageUrl FROM menu_items
         WHERE categoryId = ? AND isActive = true ORDER BY name`,
        [category.id],
      );

      categories.push({
        id: category.id,
        name: category.name,
        displayOrder: category.displayOrder,
        items: itemRows,
      });
    }

    return categories;
  } catch (error) {
    console.error('Failed to get categories locally:', error);
    return [];
  }
}
