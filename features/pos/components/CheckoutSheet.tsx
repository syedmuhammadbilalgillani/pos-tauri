"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type PaymentMethod = "cash" | "card" | "jazzcash" | "easypaisa";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: string;
  busy?: boolean;
  onConfirm: (method: PaymentMethod, amount: string, tip: string) => void;
};

const METHODS: { value: PaymentMethod; label: string; emoji: string }[] = [
  { value: "cash", label: "Cash", emoji: "💵" },
  { value: "card", label: "Card", emoji: "💳" },
  { value: "jazzcash", label: "JazzCash", emoji: "📱" },
  { value: "easypaisa", label: "EasyPaisa", emoji: "📲" },
];

type TipPreset = { label: string; value: "0" } | { label: string; pct: number };

const TIP_PRESETS: TipPreset[] = [
  { label: "No tip", value: "0" },
  { label: "10%", pct: 10 },
  { label: "15%", pct: 15 },
  { label: "20%", pct: 20 },
];

const NUMPAD_KEYS = ["1","2","3","4","5","6","7","8","9",".", "0","⌫"];

export function CheckoutSheet({ open, onOpenChange, total, busy, onConfirm }: Props) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [amount, setAmount] = useState(total);
  const [tip, setTip] = useState("0");
  const [tipCustom, setTipCustom] = useState(false);

  function pressKey(k: string) {
    setAmount((prev) => {
      if (k === "⌫") return prev.slice(0, -1) || "0";
      if (k === "." && prev.includes(".")) return prev;
      if (prev === "0" && k !== ".") return k;
      return prev + k;
    });
  }

  function selectTip(preset: TipPreset) {
    setTipCustom(false);
    if ("pct" in preset) {
      const t = ((Number(total) * preset.pct) / 100).toFixed(2);
      setTip(t);
    } else {
      setTip("0");
    }
  }

  const change = Math.max(0, Number(amount) - Number(total)).toFixed(2);
  const canPay = Number(amount) >= Number(total) || method !== "cash";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md p-0 flex flex-col">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="text-xl">Payment</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Method selector */}
          <div className="grid grid-cols-4 gap-2">
            {METHODS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMethod(m.value)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border py-3 text-xs font-semibold transition-all",
                  method === m.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-muted/60",
                )}
              >
                <span className="text-xl">{m.emoji}</span>
                {m.label}
              </button>
            ))}
          </div>

          {/* Total due */}
          <div className="rounded-xl bg-muted/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">Total due</p>
            <p className="text-3xl font-black tabular-nums text-primary">
              Rs. {Number(total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Amount numpad (cash only) */}
          {method === "cash" && (
            <>
              <div className="rounded-xl border px-4 py-3 bg-background">
                <p className="text-xs text-muted-foreground mb-1">Amount tendered</p>
                <p className="text-2xl font-bold tabular-nums">
                  Rs. {Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {NUMPAD_KEYS.map((k) => (
                  <button
                    key={k}
                    onClick={() => pressKey(k)}
                    className={cn(
                      "rounded-xl border py-4 text-lg font-bold transition-all active:scale-95",
                      k === "⌫"
                        ? "border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/30"
                        : "border-border hover:bg-muted/60",
                    )}
                  >
                    {k}
                  </button>
                ))}
              </div>

              {Number(amount) > Number(total) && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3">
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">Change</p>
                  <p className="text-xl font-bold text-emerald-800 dark:text-emerald-200 tabular-nums">
                    Rs. {Number(change).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Tip */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">Tip</p>
            <div className="grid grid-cols-4 gap-2">
              {TIP_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => selectTip(preset)}
                  className={cn(
                    "rounded-xl border py-2.5 text-xs font-semibold transition-all",
                    tip === ("pct" in preset ? ((Number(total) * (preset as { pct: number }).pct) / 100).toFixed(2) : "0") && !tipCustom
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-muted/60",
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Confirm */}
        <div className="border-t p-6">
          <button
            onClick={() => onConfirm(method, amount, tip)}
            disabled={busy || !canPay}
            className="w-full rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {busy ? "Processing…" : `Confirm Payment · Rs. ${Number(total).toLocaleString()}`}
          </button>
          {method === "cash" && !canPay && (
            <p className="mt-2 text-center text-xs text-rose-500">
              Amount tendered must be ≥ total
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
