import { create } from "zustand";
import api from "@/lib/api";
import type {
  KnowledgeEntry,
  KnowledgeEntryCreateRequest,
  KnowledgeContext,
  KnowledgeEntryType,
  RevisitLevel,
} from "@/types";

interface KnowledgeState {
  entries: KnowledgeEntry[];
  context: KnowledgeContext | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  selectedIds: Set<string>;

  loadEntries: (podcastId: string, filters?: { entry_type?: string; search?: string; revisit?: string }) => Promise<void>;
  createEntry: (podcastId: string, data: KnowledgeEntryCreateRequest) => Promise<void>;
  updateEntry: (podcastId: string, entryId: string, data: Partial<KnowledgeEntryCreateRequest>) => Promise<void>;
  deleteEntry: (podcastId: string, entryId: string) => Promise<void>;
  bulkDelete: (podcastId: string, entryIds: string[]) => Promise<void>;
  autoSummarize: (podcastId: string, episodeId: string) => Promise<void>;
  loadContext: (podcastId: string, topic?: string) => Promise<void>;

  toggleSelected: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
}

export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
  entries: [],
  context: null,
  isLoading: false,
  isSaving: false,
  error: null,
  selectedIds: new Set<string>(),

  loadEntries: async (podcastId, filters) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.entry_type) params.set("entry_type", filters.entry_type);
      if (filters?.search) params.set("search", filters.search);
      if (filters?.revisit) params.set("revisit", filters.revisit);
      const qs = params.toString();
      const response = await api.get<KnowledgeEntry[]>(
        `/api/podcasts/${podcastId}/knowledge${qs ? `?${qs}` : ""}`
      );
      set({ entries: response.data, isLoading: false, selectedIds: new Set() });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to load knowledge entries.";
      set({ error: message, isLoading: false });
    }
  },

  createEntry: async (podcastId, data) => {
    set({ isSaving: true, error: null });
    try {
      await api.post(`/api/podcasts/${podcastId}/knowledge`, data);
      await get().loadEntries(podcastId);
      set({ isSaving: false });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to create entry.";
      set({ error: message, isSaving: false });
    }
  },

  updateEntry: async (podcastId, entryId, data) => {
    set({ isSaving: true, error: null });
    try {
      await api.put(`/api/podcasts/${podcastId}/knowledge/${entryId}`, data);
      await get().loadEntries(podcastId);
      set({ isSaving: false });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to update entry.";
      set({ error: message, isSaving: false });
    }
  },

  deleteEntry: async (podcastId, entryId) => {
    try {
      await api.delete(`/api/podcasts/${podcastId}/knowledge/${entryId}`);
      await get().loadEntries(podcastId);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to delete entry.";
      set({ error: message });
    }
  },

  bulkDelete: async (podcastId, entryIds) => {
    try {
      const params = entryIds.map((id) => `entry_ids=${id}`).join("&");
      await api.delete(`/api/podcasts/${podcastId}/knowledge?${params}`);
      await get().loadEntries(podcastId);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to delete entries.";
      set({ error: message });
    }
  },

  autoSummarize: async (podcastId, episodeId) => {
    set({ isSaving: true, error: null });
    try {
      await api.post(`/api/podcasts/${podcastId}/knowledge/auto-summarize/${episodeId}`);
      await get().loadEntries(podcastId);
      set({ isSaving: false });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to auto-summarize episode.";
      set({ error: message, isSaving: false });
    }
  },

  loadContext: async (podcastId, topic) => {
    try {
      const params = topic ? `?topic=${encodeURIComponent(topic)}` : "";
      const response = await api.get<KnowledgeContext>(
        `/api/podcasts/${podcastId}/knowledge/context${params}`
      );
      set({ context: response.data });
    } catch {
      // Non-critical, fail silently
    }
  },

  toggleSelected: (id) => {
    set((state) => {
      const newSet = new Set(state.selectedIds);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return { selectedIds: newSet };
    });
  },

  selectAll: () => {
    set((state) => ({
      selectedIds: new Set(state.entries.map((e) => e.id)),
    }));
  },

  clearSelection: () => {
    set({ selectedIds: new Set() });
  },
}));
