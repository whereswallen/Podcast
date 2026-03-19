"use client";

import { Coins, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CreditPackCardProps {
  planTier: string;
  onPurchase: () => void;
  isLoading?: boolean;
}

export function CreditPackCard({ planTier, onPurchase, isLoading }: CreditPackCardProps) {
  const price = planTier === "enterprise" ? "$4" : "$5";
  const disabled = planTier === "free";

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center flex-shrink-0">
        <Coins className="w-6 h-6 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-[hsl(var(--foreground))]">
          100 Credit Pack
        </h4>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          {disabled
            ? "Available to Pro and Enterprise users"
            : `One-time purchase • ${price}`}
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={onPurchase}
        disabled={disabled || isLoading}
        isLoading={isLoading}
      >
        <Plus className="w-4 h-4 mr-1" />
        Buy {price}
      </Button>
    </div>
  );
}
