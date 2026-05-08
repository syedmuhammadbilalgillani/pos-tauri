"use client";

import { useEffect, useState } from "react";

type Props = {
  readyCount: number;
  preparingCount: number;
  completedCount: number;
  totalActive: number;
};

function Clock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  );
  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return <>{time}</>;
}

export function FohHeader({ readyCount, preparingCount, completedCount, totalActive }: Props) {
  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-8 py-4 shrink-0">
      <div className="flex items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Now Serving</h1>
          <div className="mt-1.5 flex items-center gap-5 text-sm">
            {readyCount > 0 && (
              <span className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                {readyCount} ready
              </span>
            )}
            {preparingCount > 0 && (
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
                {preparingCount} preparing
              </span>
            )}
            {completedCount > 0 && (
              <span className="flex items-center gap-1.5 text-zinc-400 font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
                {completedCount} done
              </span>
            )}
            {totalActive === 0 && (
              <span className="text-zinc-400">All clear</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold tabular-nums text-zinc-700 dark:text-zinc-200 font-mono">
            <Clock />
          </div>
          <div className="text-xs text-zinc-400 mt-0.5">Live · {totalActive} active</div>
        </div>
      </div>
    </div>
  );
}
