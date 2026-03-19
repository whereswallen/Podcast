"use client";

import { useEffect } from "react";
import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreditsStore } from "@/stores/credits";

interface CreditBadgeProps {
  collapsed?: boolean;
}

export function CreditBadge({ collapsed = false }: CreditBadgeProps) {
  const { balance, fetchBalance } = useCreditsStore();

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  if (!balance) return null;

  const available = balance.available_credits;
  const total = balance.monthly_credits + balance.bonus_credits;
  const percentage = total > 0 ? (available / total) * 100 : 0;

  const colorClass =
    percentage > 50
      ? "text-emerald-600 dark:text-emerald-400"
      : percentage > 20
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  const bgClass =
    percentage > 50
      ? "bg-emerald-50 dark:bg-emerald-950/20"
      : percentage > 20
        ? "bg-amber-50 dark:bg-amber-950/20"
        : "bg-red-50 dark:bg-red-950/20";

  if (collapsed) {
    return (
      <div
        className={cn("flex items-center justify-center p-2 rounded-lg", bgClass)}
        title={`${available} credits remaining`}
      >
        <Coins className={cn("w-4 h-4", colorClass)} />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg", bgClass)}>
      <Coins className={cn("w-4 h-4 flex-shrink-0", colorClass)} />
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold", colorClass)}>
          {available} credits
        </p>
        <div className="w-full bg-[hsl(var(--muted))] rounded-full h-1 mt-1">
          <div
            className={cn(
              "h-1 rounded-full transition-all duration-300",
              percentage > 50
                ? "bg-emerald-500"
                : percentage > 20
                  ? "bg-amber-500"
                  : "bg-red-500"
            )}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
