"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Trash2, Pencil, Minus, Plus } from "lucide-react";
import type { CartItem, OrderType } from "@/features/pos/types";

type Quote = {
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  total: string;
};

type Props = {
  cartItems: CartItem[];
  orderType: OrderType;
  tableNumber?: string;
  quote?: Quote | null;
  quoteLoading?: boolean;
  isOfflineQuote?: boolean;
  ticketStatus?: string;
  pendingCount?: number;
  busy?: boolean;
  onOrderTypeChange: (type: OrderType) => void;
  onInc: (localId: string) => void;
  onDec: (localId: string) => void;
  onRemove: (localId: string) => void;
  onEdit: (localId: string) => void;
  onHold: () => void;
  onSendToKitchen: () => void;
  onPay: () => void;
};

const ORDER_TYPES: { value: OrderType; label: string; emoji: string }[] = [
  { value: "takeaway", label: "Takeaway", emoji: "🥡" },
  { value: "dine_in", label: "Dine In", emoji: "🍽️" },
  { value: "delivery", label: "Delivery", emoji: "🛵" },
  { value: "catering", label: "Catering", emoji: "🎉" },
];

function fmt(raw?: string | null) {
  const n = Number.parseFloat(raw ?? "0");
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

export function CartPanel({
  cartItems,
  orderType,
  tableNumber,
  quote,
  quoteLoading,
  isOfflineQuote,
  busy,
  onOrderTypeChange,
  onInc,
  onDec,
  onRemove,
  onEdit,
  onHold,
  onSendToKitchen,
  onPay,
}: Props) {
  const total = quote?.total ?? "0.00";
  const isEmpty = cartItems.length === 0;

  return (
    <div className="flex h-full flex-col bg-background border-l">
      {/* Order type tabs */}
      <div className="grid grid-cols-4 gap-0 border-b">
        {ORDER_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => onOrderTypeChange(t.value)}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors",
              orderType === t.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted/50",
            )}
          >
            <span className="text-base">{t.emoji}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Table number for dine-in */}
      {orderType === "dine_in" && (
        <div className="border-b px-4 py-2 bg-amber-50 dark:bg-amber-950/20">
          <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
            {tableNumber ? `Table ${tableNumber}` : "No table selected — tap to set"}
          </p>
        </div>
      )}

      {/* Cart items */}
      <ScrollArea className="flex-1">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <span className="text-5xl opacity-30">🛒</span>
            <p className="text-sm font-medium">Cart is empty</p>
            <p className="text-xs">Tap items from the menu to add</p>
          </div>
        ) : (
          <div className="space-y-2 p-3">
            {cartItems.map((line) => (
              <div
                key={line._localId}
                className="rounded-xl border bg-card p-3"
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm leading-snug truncate">
                      {line._name ?? line.menuItemId}
                    </p>
                    {line.specialInstructions && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                        {line.specialInstructions}
                      </p>
                    )}
                    {!!line.modifiers?.length && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {line.modifiers.length} modifier{line.modifiers.length > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-bold text-primary tabular-nums shrink-0">
                    {line._price != null
                      ? `Rs. ${(line._price * line.quantity).toLocaleString()}`
                      : "—"}
                  </p>
                </div>

                {/* Qty controls + actions */}
                <div className="mt-2 flex items-center gap-1.5">
                  <button
                    onClick={() => onDec(line._localId)}
                    disabled={busy}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold tabular-nums">
                    {line.quantity}
                  </span>
                  <button
                    onClick={() => onInc(line._localId)}
                    disabled={busy}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>

                  <div className="flex-1" />

                  <button
                    onClick={() => onEdit(line._localId)}
                    disabled={busy || !line.menuItemId}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-muted transition-colors disabled:opacity-30"
                    title="Edit modifiers"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onRemove(line._localId)}
                    disabled={busy}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-50"
                    title="Remove item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Totals + actions */}
      <div className="border-t p-4 space-y-3 bg-background">
        {/* Totals */}
        <div className="rounded-xl bg-muted/40 px-3 py-2.5 space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums font-medium text-foreground">
              {quoteLoading ? "…" : `Rs. ${fmt(quote?.subtotal)}`}
            </span>
          </div>
          {quote?.discountAmount && Number(quote.discountAmount) > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount</span>
              <span className="tabular-nums font-medium">-Rs. {fmt(quote.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>Tax</span>
            <span className="tabular-nums font-medium text-foreground">
              {quoteLoading ? "…" : `Rs. ${fmt(quote?.taxAmount)}`}
            </span>
          </div>
          <Separator className="my-1" />
          <div className="flex justify-between font-bold text-base">
            <span className="flex items-center gap-1.5">
              Total
              {isOfflineQuote && !quoteLoading && (
                <span className="text-[10px] font-normal text-amber-600 dark:text-amber-400">(est.)</span>
              )}
            </span>
            <span className="tabular-nums text-primary">
              {quoteLoading ? "…" : `Rs. ${fmt(total)}`}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onHold}
            disabled={busy || isEmpty}
            className="rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-40"
          >
            Hold
          </button>
          <button
            onClick={onSendToKitchen}
            disabled={busy || isEmpty}
            className="rounded-xl bg-zinc-800 text-white px-4 py-2.5 text-sm font-semibold hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 transition-colors disabled:opacity-40"
          >
            Send to Kitchen
          </button>
        </div>

        <button
          onClick={onPay}
          disabled={busy || isEmpty}
          className="w-full rounded-xl bg-primary py-3.5 text-base font-bold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 touch-manipulation"
        >
          {isEmpty ? "Add items to pay" : `Pay · Rs. ${fmt(total)}`}
        </button>
      </div>
    </div>
  );
}
