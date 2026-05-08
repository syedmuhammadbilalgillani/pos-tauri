"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type MenuItem = {
  id: string;
  slug?: string | null;
  name?: string | null;
  imageUrl?: string | null;
  basePrice?: string | number | null;
  description?: string | null;
};

type Props = {
  items: MenuItem[];
  isLoading?: boolean;
  isError?: boolean;
  searchQuery?: string;
  onItemClick: (item: MenuItem) => void;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  isFetching?: boolean;
  disabled?: boolean;
};

function formatPrice(raw?: string | number | null) {
  const n = typeof raw === "number" ? raw : Number.parseFloat(String(raw ?? "0"));
  return Number.isFinite(n) ? n.toLocaleString() : "0";
}

export function ProductGrid({
  items,
  isLoading,
  isError,
  searchQuery,
  onItemClick,
  onLoadMore,
  hasNextPage,
  isFetching,
  disabled,
}: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 p-4">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="h-36 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
        <span className="text-4xl">⚠️</span>
        <p className="text-sm font-medium">Failed to load items</p>
        <p className="text-xs">Showing cached data if available</p>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
        <span className="text-4xl">🔍</span>
        <p className="text-sm font-medium">
          {searchQuery ? `No results for "${searchQuery}"` : "No items in this category"}
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="grid grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 p-4">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick(item)}
            disabled={disabled}
            className={cn(
              "group relative flex flex-col items-center gap-2 rounded-2xl border bg-card p-3",
              "text-left transition-all duration-150 active:scale-95",
              "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "min-h-[140px] touch-manipulation",
            )}
          >
            <Avatar className="h-16 w-16 rounded-xl">
              <AvatarImage src={item.imageUrl ?? ""} alt={item.name ?? ""} className="object-cover" />
              <AvatarFallback className="rounded-xl text-xl font-bold bg-primary/10 text-primary">
                {item.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="w-full">
              <p className="truncate text-center text-sm font-semibold leading-snug">
                {item.name}
              </p>
              <p className="mt-0.5 text-center text-xs font-bold text-primary">
                Rs. {formatPrice(item.basePrice)}
              </p>
            </div>

            {/* Quick-add indicator */}
            <div className="absolute right-2 top-2 rounded-lg bg-primary/10 p-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <Plus className="h-3.5 w-3.5 text-primary" />
            </div>
          </button>
        ))}
      </div>

      {hasNextPage && (
        <div className="flex justify-center pb-6">
          <button
            onClick={onLoadMore}
            disabled={isFetching}
            className="rounded-xl border bg-muted/50 px-6 py-2.5 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            {isFetching ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </ScrollArea>
  );
}
