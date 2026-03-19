import { create } from "zustand";
import api from "@/lib/api";
import type {
  BrandProfile,
  BrandProfileUpdate,
  IntroOutroTemplate,
  IntroOutroCreateRequest,
} from "@/types";

interface BrandState {
  brand: BrandProfile | null;
  templates: IntroOutroTemplate[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  loadBrand: (podcastId: string) => Promise<void>;
  updateBrand: (podcastId: string, data: BrandProfileUpdate) => Promise<void>;
  generateBrand: (podcastId: string, title: string, description?: string, category?: string) => Promise<void>;

  loadTemplates: (podcastId: string) => Promise<void>;
  createTemplate: (podcastId: string, data: IntroOutroCreateRequest) => Promise<void>;
  updateTemplate: (podcastId: string, templateId: string, data: Partial<IntroOutroCreateRequest>) => Promise<void>;
  deleteTemplate: (podcastId: string, templateId: string) => Promise<void>;
  generateTemplate: (podcastId: string, type: "intro" | "outro") => Promise<void>;
}

export const useBrandStore = create<BrandState>((set, get) => ({
  brand: null,
  templates: [],
  isLoading: false,
  isSaving: false,
  error: null,

  loadBrand: async (podcastId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<BrandProfile>(
        `/api/podcasts/${podcastId}/brand`
      );
      set({ brand: response.data, isLoading: false });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to load brand profile.";
      set({ error: message, isLoading: false });
    }
  },

  updateBrand: async (podcastId: string, data: BrandProfileUpdate) => {
    set({ isSaving: true, error: null });
    try {
      const response = await api.put<BrandProfile>(
        `/api/podcasts/${podcastId}/brand`,
        data
      );
      set({ brand: response.data, isSaving: false });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to save brand profile.";
      set({ error: message, isSaving: false });
    }
  },

  generateBrand: async (podcastId: string, title: string, description?: string, category?: string) => {
    set({ isSaving: true, error: null });
    try {
      const response = await api.post<BrandProfile>(
        `/api/podcasts/${podcastId}/brand/generate`,
        { podcast_title: title, podcast_description: description, category }
      );
      set({ brand: response.data, isSaving: false });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to generate brand profile.";
      set({ error: message, isSaving: false });
    }
  },

  loadTemplates: async (podcastId: string) => {
    try {
      const response = await api.get<IntroOutroTemplate[]>(
        `/api/podcasts/${podcastId}/intro-outro`
      );
      set({ templates: response.data });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to load templates.";
      set({ error: message });
    }
  },

  createTemplate: async (podcastId: string, data: IntroOutroCreateRequest) => {
    set({ isSaving: true, error: null });
    try {
      await api.post(`/api/podcasts/${podcastId}/intro-outro`, data);
      await get().loadTemplates(podcastId);
      set({ isSaving: false });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to create template.";
      set({ error: message, isSaving: false });
    }
  },

  updateTemplate: async (podcastId: string, templateId: string, data: Partial<IntroOutroCreateRequest>) => {
    set({ isSaving: true, error: null });
    try {
      await api.put(`/api/podcasts/${podcastId}/intro-outro/${templateId}`, data);
      await get().loadTemplates(podcastId);
      set({ isSaving: false });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to update template.";
      set({ error: message, isSaving: false });
    }
  },

  deleteTemplate: async (podcastId: string, templateId: string) => {
    try {
      await api.delete(`/api/podcasts/${podcastId}/intro-outro/${templateId}`);
      await get().loadTemplates(podcastId);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to delete template.";
      set({ error: message });
    }
  },

  generateTemplate: async (podcastId: string, type: "intro" | "outro") => {
    set({ isSaving: true, error: null });
    try {
      await api.post(`/api/podcasts/${podcastId}/intro-outro/generate`, { type });
      await get().loadTemplates(podcastId);
      set({ isSaving: false });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to generate template.";
      set({ error: message, isSaving: false });
    }
  },
}));
