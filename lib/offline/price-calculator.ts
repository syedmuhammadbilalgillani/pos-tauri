/**
 * Calculate item price with modifiers and discount
 * All calculations happen locally without server calls
 */
export function calculateItemPrice(
  basePrice: string,
  selectedModifiers: Array<{ priceAdjustment: string }>,
): string {
  const base = parseFloat(basePrice);
  if (!Number.isFinite(base)) return '0.00';

  const modifiersTotal = selectedModifiers.reduce((sum, mod) => {
    const adjustment = parseFloat(mod.priceAdjustment);
    return sum + (Number.isFinite(adjustment) ? adjustment : 0);
  }, 0);

  return (base + modifiersTotal).toFixed(2);
}

/**
 * Calculate cart subtotal
 */
export function calculateCartSubtotal(
  items: Array<{
    basePrice: string;
    quantity: number;
    selectedModifiers?: Array<{ priceAdjustment: string }>;
  }>,
): string {
  const total = items.reduce((sum, item) => {
    const itemPrice = calculateItemPrice(item.basePrice, item.selectedModifiers ?? []);
    return sum + parseFloat(itemPrice) * item.quantity;
  }, 0);

  return total.toFixed(2);
}

/**
 * Calculate final total with tax and discount
 */
export function calculateTotal(
  subtotal: string,
  taxRate: number = 0.08,
  discountAmount: string = '0',
): {
  subtotal: string;
  tax: string;
  discount: string;
  total: string;
} {
  const subtotalNum = parseFloat(subtotal);
  const discountNum = parseFloat(discountAmount);

  const taxableAmount = Math.max(0, subtotalNum - discountNum);
  const tax = taxableAmount * taxRate;
  const total = taxableAmount + tax;

  return {
    subtotal: subtotalNum.toFixed(2),
    tax: tax.toFixed(2),
    discount: discountNum.toFixed(2),
    total: total.toFixed(2),
  };
}

/**
 * Validate modifier selections against group constraints
 */
export function validateModifierSelections(
  selections: Record<string, string[]>,
  groups: Array<{
    id: string;
    minSelections?: number | null;
    maxSelections?: number | null;
    isRequired: boolean;
    selectionType: 'single' | 'multiple' | 'exactly';
  }>,
): { valid: boolean; message?: string | null } {
  for (const group of groups) {
    const selected = selections[group.id] ?? [];
    const min = Math.max(0, group.minSelections ?? 0);
    const max = group.maxSelections ?? null;
    const requiredMin = group.isRequired ? Math.max(1, min) : min;

    if (selected.length < requiredMin) {
      return {
        valid: false,
        message: `Select at least ${requiredMin} for this group`,
      };
    }

    if (max != null && selected.length > max) {
      return {
        valid: false,
        message: `Select at most ${max} for this group`,
      };
    }

    if (group.selectionType === 'exactly' && selected.length !== min) {
      return {
        valid: false,
        message: `Select exactly ${min} for this group`,
      };
    }

    if (group.selectionType === 'single' && selected.length > 1) {
      return {
        valid: false,
        message: 'This group allows only 1 selection',
      };
    }
  }

  return { valid: true };
}
