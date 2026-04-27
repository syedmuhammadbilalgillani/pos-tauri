"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import type { LocationData } from "@/types";

export function LocationSelectModal(props: {
  open: boolean;
  locations: LocationData[];
  onSelect: (locationId: string) => Promise<void> | void;
}) {
  const { open, locations, onSelect } = props;
  const [value, setValue] = React.useState<string>("");

  React.useEffect(() => {
    if (!open) return;
    // default selection: first item
    setValue((prev) => prev || locations[0]?.id || "");
  }, [open, locations]);

  const canContinue = Boolean(value);

  return (
    <Sheet open={open}>
      <SheetContent side="bottom" showCloseButton={false} className="mx-auto w-full max-w-md">
        <SheetHeader>
          <SheetTitle>Select Location</SheetTitle>
          <SheetDescription>
            Choose the location you want to work in.
          </SheetDescription>
        </SheetHeader>

        <div className="px-8">
          <RadioGroup value={value} onValueChange={setValue} className="gap-4">
            {locations.map((l) => (
              <label key={l.id} className="flex items-center gap-3 border border-border p-3">
                <RadioGroupItem value={l.id} />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{l.name ?? "Unnamed location"}</span>
                  <span className="text-xs text-muted-foreground">{l.id}</span>
                </div>
              </label>
            ))}
          </RadioGroup>
        </div>

        <SheetFooter>
          <Button
            className="w-full"
            disabled={!canContinue}
            onClick={() => value && onSelect(value)}
          >
            Continue
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}