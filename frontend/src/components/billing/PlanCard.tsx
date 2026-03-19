"use client";

import { Check, Crown, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { PlanInfo } from "@/types";

interface PlanCardProps {
  plan: PlanInfo;
  currentPlan: string;
  onSelect: (plan: string) => void;
  isLoading?: boolean;
}

const planIcons: Record<string, React.ElementType> = {
  Free: Zap,
  Pro: Crown,
  Enterprise: Crown,
};

export function PlanCard({ plan, currentPlan, onSelect, isLoading }: PlanCardProps) {
  const isCurrent = plan.name.toLowerCase() === currentPlan;
  const isPro = plan.name === "Pro";
  const Icon = planIcons[plan.name] || Zap;

  return (
    <div
      className={cn(
        "relative flex flex-col p-6 rounded-2xl border-2 transition-all",
        isCurrent
          ? "border-primary-500 bg-primary-50/50 dark:bg-primary-950/20 shadow-lg shadow-primary-500/10"
          : "border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--muted-foreground))]",
        isPro && !isCurrent && "ring-2 ring-primary-500/20"
      )}
    >
      {isPro && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-primary-500 to-secondary-600 rounded-full">
            Most Popular
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <Icon
          className={cn(
            "w-5 h-5",
            isCurrent ? "text-primary-600" : "text-[hsl(var(--muted-foreground))]"
          )}
        />
        <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">
          {plan.name}
        </h3>
      </div>

      <div className="mb-4">
        <span className="text-3xl font-extrabold text-[hsl(var(--foreground))]">
          {plan.price.split("/")[0]}
        </span>
        {plan.price.includes("/") && (
          <span className="text-sm text-[hsl(var(--muted-foreground))]">
            /{plan.price.split("/")[1]}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 mb-4 px-3 py-1.5 rounded-lg bg-[hsl(var(--muted))]">
        <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
          {plan.monthly_credits.toLocaleString()}
        </span>
        <span className="text-sm text-[hsl(var(--muted-foreground))]">
          credits/month
        </span>
      </div>

      <ul className="space-y-2 mb-6 flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {isCurrent ? (
        <Button variant="outline" disabled className="w-full">
          Current Plan
        </Button>
      ) : plan.stripe_price_id ? (
        <Button
          onClick={() => onSelect(plan.name.toLowerCase())}
          isLoading={isLoading}
          className="w-full"
          variant={isPro ? "default" : "outline"}
        >
          {currentPlan === "free" ? "Upgrade" : "Switch"} to {plan.name}
        </Button>
      ) : (
        <Button variant="outline" disabled className="w-full">
          Free Forever
        </Button>
      )}
    </div>
  );
}
