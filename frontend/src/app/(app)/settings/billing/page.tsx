"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CreditCard,
  Coins,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlanCard } from "@/components/billing/PlanCard";
import { CreditPackCard } from "@/components/billing/CreditPackCard";
import { UsageHistory } from "@/components/credits/UsageHistory";
import { useCreditsStore } from "@/stores/credits";
import { useBillingStore } from "@/stores/billing";
import { useAuthStore } from "@/stores/auth";

export default function BillingPage() {
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { balance, fetchBalance } = useCreditsStore();
  const {
    plans,
    subscription,
    isLoading,
    fetchPlans,
    fetchSubscription,
    createCheckout,
    createCreditCheckout,
    openPortal,
  } = useBillingStore();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchBalance();
    fetchPlans();
    fetchSubscription();
  }, [fetchBalance, fetchPlans, fetchSubscription]);

  // Handle success/cancel redirects from Stripe
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Plan upgraded successfully! Your credits have been updated.");
      fetchBalance();
      fetchSubscription();
    }
    if (searchParams.get("credits_purchased") === "true") {
      toast.success("Credits purchased! 100 credits have been added to your balance.");
      fetchBalance();
    }
    if (searchParams.get("cancelled") === "true") {
      toast.info("Checkout cancelled.");
    }
  }, [searchParams, fetchBalance, fetchSubscription]);

  const handleSelectPlan = async (plan: string) => {
    setCheckoutLoading(plan);
    try {
      await createCheckout(plan);
    } catch {
      toast.error("Failed to start checkout. Please try again.");
      setCheckoutLoading(null);
    }
  };

  const handleBuyCredits = async () => {
    try {
      await createCreditCheckout();
    } catch {
      toast.error("Failed to start checkout. Please try again.");
    }
  };

  const handleManageSubscription = async () => {
    try {
      await openPortal();
    } catch {
      toast.error("Failed to open billing portal.");
    }
  };

  const planTier = user?.plan_tier || "free";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/settings"
          className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">
            Billing & Credits
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Manage your subscription and credit balance
          </p>
        </div>
      </div>

      {/* Current Balance Card */}
      {balance && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 rounded-xl bg-[hsl(var(--muted))]">
                <p className="text-3xl font-extrabold text-[hsl(var(--foreground))]">
                  {balance.available_credits}
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  Available Credits
                </p>
              </div>
              <div className="text-center p-4 rounded-xl bg-[hsl(var(--muted))]">
                <p className="text-3xl font-extrabold text-[hsl(var(--foreground))]">
                  {balance.monthly_remaining}
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  Monthly Remaining
                </p>
              </div>
              <div className="text-center p-4 rounded-xl bg-[hsl(var(--muted))]">
                <p className="text-3xl font-extrabold text-[hsl(var(--foreground))]">
                  {balance.bonus_credits}
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  Bonus Credits
                </p>
              </div>
              <div className="text-center p-4 rounded-xl bg-[hsl(var(--muted))]">
                <p className="text-3xl font-extrabold text-[hsl(var(--foreground))]">
                  {balance.used_today}/{balance.daily_cap}
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  Used Today
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Selection */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
            Your Plan
          </h2>
          {subscription?.stripe_subscription_id && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleManageSubscription}
              isLoading={isLoading}
            >
              <ExternalLink className="w-4 h-4 mr-1.5" />
              Manage Subscription
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanCard
              key={plan.name}
              plan={plan}
              currentPlan={planTier}
              onSelect={handleSelectPlan}
              isLoading={checkoutLoading === plan.name.toLowerCase()}
            />
          ))}
        </div>
      </div>

      {/* Credit Packs */}
      <div>
        <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">
          Buy Extra Credits
        </h2>
        <CreditPackCard
          planTier={planTier}
          onPurchase={handleBuyCredits}
          isLoading={isLoading}
        />
      </div>

      {/* Usage History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Credit Usage History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UsageHistory />
        </CardContent>
      </Card>
    </div>
  );
}
