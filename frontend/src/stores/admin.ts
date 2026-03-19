import { create } from "zustand";
import api from "@/lib/api";
import type { PlatformStats, AdminUser } from "@/types";

interface AdminState {
  stats: PlatformStats | null;
  users: AdminUser[];
  isLoading: boolean;
  error: string | null;

  loadStats: () => Promise<void>;
  loadUsers: (filters?: { search?: string; plan_tier?: string; provider?: string }) => Promise<void>;
  updateUser: (userId: string, data: { plan_tier?: string; is_active?: boolean; is_admin?: boolean }) => Promise<void>;
  grantCredits: (userId: string, amount: number, reason?: string) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  stats: null,
  users: [],
  isLoading: false,
  error: null,

  loadStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<PlatformStats>("/api/admin/stats");
      set({ stats: response.data, isLoading: false });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to load stats.";
      set({ error: message, isLoading: false });
    }
  },

  loadUsers: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.set("search", filters.search);
      if (filters?.plan_tier) params.set("plan_tier", filters.plan_tier);
      if (filters?.provider) params.set("provider", filters.provider);
      const qs = params.toString();
      const response = await api.get<AdminUser[]>(
        `/api/admin/users${qs ? `?${qs}` : ""}`
      );
      set({ users: response.data, isLoading: false });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to load users.";
      set({ error: message, isLoading: false });
    }
  },

  updateUser: async (userId, data) => {
    try {
      await api.put(`/api/admin/users/${userId}`, data);
      await get().loadUsers();
      await get().loadStats();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to update user.";
      set({ error: message });
    }
  },

  grantCredits: async (userId, amount, reason = "Admin credit grant") => {
    try {
      await api.post(`/api/credits/admin/${userId}/grant`, { amount, reason });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to grant credits.";
      set({ error: message });
      throw new Error(message);
    }
  },
}));
