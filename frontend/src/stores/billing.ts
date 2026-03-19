import { create } from "zustand";
import api from "@/lib/api";
import type { PlanInfo, SubscriptionInfo } from "@/types";

interface BillingState {
  plans: PlanInfo[];
  subscription: SubscriptionInfo | null;
  isLoading: boolean;
  fetchPlans: () => Promise<void>;
  fetchSubscription: () => Promise<void>;
  createCheckout: (plan: string) => Promise<void>;
  createCreditCheckout: () => Promise<void>;
  openPortal: () => Promise<void>;
}

export const useBillingStore = create<BillingState>((set) => ({
  plans: [],
  subscription: null,
  isLoading: false,

  fetchPlans: async () => {
    try {
      const response = await api.get<PlanInfo[]>("/api/billing/plans");
      set({ plans: response.data });
    } catch {
      // Silently fail
    }
  },

  fetchSubscription: async () => {
    try {
      const response = await api.get<SubscriptionInfo>("/api/billing/subscription");
      set({ subscription: response.data });
    } catch {
      // Silently fail
    }
  },

  createCheckout: async (plan: string) => {
    set({ isLoading: true });
    try {
      const response = await api.post<{ checkout_url: string }>(
        "/api/billing/checkout/subscription",
        { plan }
      );
      window.location.href = response.data.checkout_url;
    } catch (err: unknown) {
      set({ isLoading: false });
      throw err;
    }
  },

  createCreditCheckout: async () => {
    set({ isLoading: true });
    try {
      const response = await api.post<{ checkout_url: string }>(
        "/api/billing/checkout/credits",
        { pack: "credits_100" }
      );
      window.location.href = response.data.checkout_url;
    } catch (err: unknown) {
      set({ isLoading: false });
      throw err;
    }
  },

  openPortal: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get<{ portal_url: string }>("/api/billing/portal");
      window.location.href = response.data.portal_url;
    } catch (err: unknown) {
      set({ isLoading: false });
      throw err;
    }
  },
}));
