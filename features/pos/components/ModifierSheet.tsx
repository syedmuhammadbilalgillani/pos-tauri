"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { PublicMenuItemDetail, PublicModifierGroup } from "@/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PublicMenuItemDetail | null | undefined;
  isLoading?: boolean;
  selectedModsByGroup: Record<string, string[]>;
  onToggle: (groupId: string, modifierId: string, group: PublicModifierGroup) => void;
  onAdd: () => void;
  validationError?: string | null;
  isEditing?: boolean;
  busy?: boolean;
};

export function ModifierSheet({
  open,
  onOpenChange,
  item,
  isLoading,
  selectedModsByGroup,
  onToggle,
  onAdd,
  validationError,
  isEditing,
  busy,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md p-0 flex flex-col">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="text-lg truncate">
            {isLoading ? "Loading…" : (item?.name ?? "Customize")}
          </SheetTitle>
          {item && (
            <p className="text-sm text-muted-foreground">
              Rs. {Number(item.basePrice).toLocaleString()}
            </p>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : !item?.modifierGroups?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <span className="text-3xl">✓</span>
              <p className="text-sm">No customization needed</p>
            </div>
          ) : (
            <div className="space-y-5">
              {item.modifierGroups.map((group) => {
                const selected = selectedModsByGroup[group.id] ?? [];
                const isFull =
                  group.maxSelections != null && selected.length >= group.maxSelections;

                return (
                  <div key={group.id}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-semibold text-sm">{group.name}</p>
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold",
                        group.isRequired
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
                      )}>
                        {group.isRequired ? "Required" : "Optional"}
                        {group.maxSelections != null
                          ? ` · max ${group.maxSelections}`
                          : ""}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {group.modifiers.map((mod) => {
                        const isSelected = selected.includes(mod.id);
                        const isDisabled = !isSelected && isFull;

                        return (
                          <button
                            key={mod.id}
                            onClick={() => onToggle(group.id, mod.id, group)}
                            disabled={isDisabled}
                            className={cn(
                              "w-full rounded-xl border px-4 py-3 text-left transition-all active:scale-[0.98]",
                              "flex items-center justify-between gap-3",
                              isSelected
                                ? "border-primary bg-primary/5 dark:bg-primary/10"
                                : isDisabled
                                  ? "border-border opacity-40"
                                  : "border-border hover:border-primary/40 hover:bg-muted/40",
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={cn(
                                "h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center",
                                isSelected
                                  ? "border-primary bg-primary"
                                  : "border-muted-foreground/40",
                              )}>
                                {isSelected && (
                                  <span className="text-[10px] text-primary-foreground font-bold">✓</span>
                                )}
                              </div>
                              <span className="text-sm font-medium truncate">{mod.name}</span>
                            </div>
                            {Number(mod.priceDelta) !== 0 && (
                              <span className="text-sm font-semibold text-primary shrink-0">
                                +Rs. {Number(mod.priceDelta).toLocaleString()}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-6 space-y-3">
          {validationError && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
              {validationError}
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-xl border px-4 py-3 text-sm font-semibold hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onAdd}
              disabled={busy || isLoading || !item}
              className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {isEditing ? "Save changes" : "Add to cart"}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
