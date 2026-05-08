"use client";

import type { POSCategory } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Props = {
  categories: POSCategory[];
  activeCategoryId: string;
  onSelect: (id: string) => void;
  isLoading?: boolean;
};

export function CategoryRail({ categories, activeCategoryId, onSelect, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto px-4 py-3 border-b bg-background scrollbar-none">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 w-24 shrink-0 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3 border-b bg-background scrollbar-none touch-pan-x">
      {categories.map((cat) => {
        const active = cat.id === activeCategoryId;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={cn(
              "flex shrink-0 flex-col items-center gap-1.5 rounded-xl border px-3 py-2 transition-all duration-150",
              "min-w-[72px] max-w-[96px] active:scale-95",
              active
                ? "border-primary bg-primary text-primary-foreground shadow-md"
                : "border-border bg-card hover:border-primary/40 hover:bg-muted/60",
            )}
          >
            <Avatar className={cn("h-9 w-9 rounded-lg", active ? "bg-primary-foreground/20" : "bg-muted")}>
              <AvatarImage src={cat.image ?? ""} alt={cat.name} />
              <AvatarFallback className="rounded-lg text-sm font-bold">
                {cat.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="w-full truncate text-center text-[11px] font-semibold leading-tight">
              {cat.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
