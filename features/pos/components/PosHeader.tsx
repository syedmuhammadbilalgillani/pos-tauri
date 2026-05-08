"use client";

import { useOfflineStore } from "@/store/offline";
import { useAuthUser } from "@/lib/tan-stack/auth/query";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, ChevronDown } from "lucide-react";

type Props = {
  menuName?: string;
  locationName?: string;
  search: string;
  onSearchChange: (v: string) => void;
  heldCount?: number;
  onHeldClick: () => void;
  onNewTicket: () => void;
  busy?: boolean;
};

function ConnectivityDot() {
  const status = useOfflineStore((s) => s.networkStatus);
  const isSyncing = useOfflineStore((s) => s.isSyncing);

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          isSyncing
            ? "bg-blue-400 animate-pulse"
            : status === "online"
              ? "bg-emerald-500"
              : status === "offline"
                ? "bg-amber-500"
                : "bg-zinc-400",
        )}
      />
      <span className="text-[11px] text-muted-foreground font-medium">
        {isSyncing ? "Syncing" : status === "online" ? "Live" : status === "offline" ? "Offline" : ""}
      </span>
    </div>
  );
}

export function PosHeader({
  menuName,
  locationName,
  search,
  onSearchChange,
  heldCount = 0,
  onHeldClick,
  onNewTicket,
  busy,
}: Props) {
  const user = useAuthUser();

  return (
    <div className="flex h-14 items-center gap-3 border-b bg-background px-4 shrink-0">
      {/* Branding */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="min-w-0">
          <p className="text-sm font-bold truncate leading-none">{menuName ?? "POS"}</p>
          {locationName && (
            <p className="text-[11px] text-muted-foreground truncate leading-none mt-0.5">
              {locationName}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1" />

      {/* Search */}
      <div className="relative w-56 xl:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search menu…"
          className="h-9 pl-8 bg-muted/40 text-sm"
        />
      </div>

      {/* Connectivity */}
      <ConnectivityDot />

      {/* Held tickets */}
      <button
        onClick={onHeldClick}
        disabled={busy}
        className="relative flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
      >
        <ChevronDown className="h-3.5 w-3.5" />
        Held
        {heldCount > 0 && (
          <span className="ml-0.5 rounded-full bg-primary/15 px-1.5 text-[10px] font-bold text-primary">
            {heldCount}
          </span>
        )}
      </button>

      {/* New ticket */}
      <button
        onClick={onNewTicket}
        disabled={busy}
        className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        + New
      </button>

      {/* User */}
      {user?.name && (
        <div className="hidden xl:flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {user.name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}
