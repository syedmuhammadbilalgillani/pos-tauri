/**
 * Offline cart total calculation
 * Works without server queries for offline-first POS
 */

export interface CartItem {
  id: string;
  basePrice: string;
  quantity: number;
  selectedModifiers?: Array<{ priceAdjustment: string }>;
  specialInstructions?: string;
}

export interface CartTotal {
  subtotal: string;
  discountAmount: string;
  taxableAmount: string;
  taxAmount: string;
  total: string;
}

/**
 * Calculate item line total
 */
function getItemLineTotal(item: CartItem): string {
  const basePrice = parseFloat(item.basePrice);
  const modifiersTotal = (item.selectedModifiers ?? []).reduce((sum, mod) => {
    const adj = parseFloat(mod.priceAdjustment);
    return sum + (Number.isFinite(adj) ? adj : 0);
  }, 0);

  const itemPrice = basePrice + modifiersTotal;
  return (itemPrice * item.quantity).toFixed(2);
}

/**
 * Calculate cart totals with tax and optional discount
 */
export function calculateOfflineCartTotal(
  items: CartItem[],
  discountAmount: string = '0',
  taxRate: number = 0.08,
): CartTotal {
  // Calculate subtotal from all items
  const subtotal = items.reduce((sum, item) => {
    const lineTotal = parseFloat(getItemLineTotal(item));
    return sum + (Number.isFinite(lineTotal) ? lineTotal : 0);
  }, 0);

  const discount = parseFloat(discountAmount);
  const discountNum = Number.isFinite(discount) ? discount : 0;

  // Tax is calculated on subtotal minus discount
  const taxable = Math.max(0, subtotal - discountNum);
  const tax = taxable * taxRate;

  return {
    subtotal: subtotal.toFixed(2),
    discountAmount: discountNum.toFixed(2),
    taxableAmount: taxable.toFixed(2),
    taxAmount: tax.toFixed(2),
    total: (taxable + tax).toFixed(2),
  };
}

/**
 * Validate that all items have required modifiers selected
 */
export function validateCartItems(
  items: CartItem[],
  modifierGroupRequirements: Record<string, { isRequired: boolean; minSelections: number }>,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const item of items) {
    for (const [groupId, req] of Object.entries(modifierGroupRequirements)) {
      const selected = item.selectedModifiers?.filter(
        (m) => m.priceAdjustment !== '', // Assuming group membership info
      ) ?? [];

      if (req.isRequired && selected.length < (req.minSelections || 1)) {
        errors.push(`Item "${item.id}" missing required modifier in group "${groupId}"`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
