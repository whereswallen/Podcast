import { create } from "zustand";
import api from "@/lib/api";
import type { CreditBalance, CreditTransaction, OperationCost } from "@/types";

interface CreditsState {
  balance: CreditBalance | null;
  transactions: CreditTransaction[];
  operationCosts: Record<string, number>;
  isLoading: boolean;
  fetchBalance: () => Promise<void>;
  fetchTransactions: (page?: number) => Promise<void>;
  fetchCosts: () => Promise<void>;
  getOperationCost: (operation: string) => number;
  refreshAfterOperation: () => Promise<void>;
}

export const useCreditsStore = create<CreditsState>((set, get) => ({
  balance: null,
  transactions: [],
  operationCosts: {},
  isLoading: false,

  fetchBalance: async () => {
    try {
      const response = await api.get<CreditBalance>("/api/credits/balance");
      set({ balance: response.data });
    } catch {
      // Silently fail — user may not have credits initialized yet
    }
  },

  fetchTransactions: async (page = 1) => {
    try {
      const response = await api.get<CreditTransaction[]>(
        `/api/credits/transactions?page=${page}&page_size=20`
      );
      set({ transactions: response.data });
    } catch {
      // Silently fail
    }
  },

  fetchCosts: async () => {
    try {
      const response = await api.get<OperationCost[]>("/api/credits/costs");
      const costMap: Record<string, number> = {};
      for (const item of response.data) {
        costMap[item.operation] = item.cost;
      }
      set({ operationCosts: costMap });
    } catch {
      // Silently fail
    }
  },

  getOperationCost: (operation: string) => {
    return get().operationCosts[operation] || 0;
  },

  refreshAfterOperation: async () => {
    await get().fetchBalance();
  },
}));
