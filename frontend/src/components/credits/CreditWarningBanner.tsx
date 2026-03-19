"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useCreditsStore } from "@/stores/credits";

export function CreditWarningBanner() {
  const { balance } = useCreditsStore();

  if (!balance) return null;

  const available = balance.available_credits;
  const total = balance.monthly_credits;
  const percentage = total > 0 ? (available / total) * 100 : 100;

  // Only show warning when below 20% of monthly credits
  if (percentage > 20 || available > 10) return null;

  if (available === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            No credits remaining
          </p>
          <p className="text-xs text-red-600 dark:text-red-500">
            AI features are disabled. Upgrade your plan or buy credits to continue.
          </p>
        </div>
        <Link
          href="/settings/billing"
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          Upgrade
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
          Running low on credits
        </p>
        <p className="text-xs text-amber-600 dark:text-amber-500">
          You have {available} credits remaining this month.
        </p>
      </div>
      <Link
        href="/settings/billing"
        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 rounded-lg transition-colors"
      >
        Buy More
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
