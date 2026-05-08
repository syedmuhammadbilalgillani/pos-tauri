"use client";

import { cn } from "@/lib/utils";

type Props = {
  elapsed: number; // minutes
  size?: number;
};

export function TimerRing({ elapsed, size = 52 }: Props) {
  const maxMinutes = 20;
  const fraction = Math.min(elapsed / maxMinutes, 1);
  const r = (size - 6) / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - fraction);

  const color =
    elapsed >= 20
      ? "#ef4444" // red-500
      : elapsed >= 10
        ? "#f59e0b" // amber-500
        : "#22c55e"; // green-500

  const textColor =
    elapsed >= 20
      ? "text-rose-600 dark:text-rose-400"
      : elapsed >= 10
        ? "text-amber-600 dark:text-amber-400"
        : "text-zinc-600 dark:text-zinc-400";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={4}
          className="text-zinc-100 dark:text-zinc-800"
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-xs font-bold tabular-nums leading-none", textColor)}>
          {elapsed}m
        </span>
      </div>
    </div>
  );
}
