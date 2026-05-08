"use client";

import { cn } from "@/lib/utils";

type Props = {
  flash: boolean;
};

export function ReadyAlert({ flash }: Props) {
  if (!flash) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-50 flex items-center justify-center",
        "bg-emerald-500/10 dark:bg-emerald-400/10",
        "animate-pulse",
      )}
    >
      <div className="rounded-3xl bg-emerald-500 px-16 py-8 text-center shadow-2xl">
        <div className="text-6xl font-black text-white">✓ Ready!</div>
      </div>
    </div>
  );
}
