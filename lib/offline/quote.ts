import type { CartItem } from "@/features/pos/types";

export type OfflineQuote = {
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  serviceCharge: string;
  total: string;
  currency: string;
  isLocal: true; // marker so UI can show "est." label
};

/**
 * Calculate a local price quote without hitting the server.
 * Matches the server's order.service.ts calculation:
 *   subtotal = Σ (unitPrice + modifierTotal) × qty
 *   taxAmount = 0  (server currently sets tax=0)
 *   total     = subtotal
 */
export function calculateOfflineQuote(
  items: CartItem[],
  taxRate = 0,
): OfflineQuote {
  const subtotal = items.reduce((sum, line) => {
    const modTotal = (line.modifiers ?? []).reduce(
      (ms, m) =>
        ms + Number(m.priceDeltaSnapshot ?? 0) * (m.quantity ?? 1),
      0,
    );
    const unitPrice = line._price ?? 0;
    return sum + (unitPrice + modTotal) * line.quantity;
  }, 0);

  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  return {
    subtotal: subtotal.toFixed(2),
    taxAmount: taxAmount.toFixed(2),
    discountAmount: "0.00",
    serviceCharge: "0.00",
    total: total.toFixed(2),
    currency: "PKR",
    isLocal: true,
  };
}
