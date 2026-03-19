import { create } from "zustand";
import api from "@/lib/api";
import type { VoiceCloneJob, VoiceCloneTrainRequest } from "@/types";

interface VoiceCloneState {
  jobs: VoiceCloneJob[];
  activeJob: VoiceCloneJob | null;
  isLoading: boolean;
  isUploading: boolean;
  isTraining: boolean;
  error: string | null;

  loadJobs: () => Promise<void>;
  createJob: (name: string) => Promise<VoiceCloneJob | null>;
  loadJob: (jobId: string) => Promise<void>;
  uploadSample: (jobId: string, file: File) => Promise<void>;
  trainVoice: (jobId: string, config: VoiceCloneTrainRequest) => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;
}

export const useVoiceCloneStore = create<VoiceCloneState>((set, get) => ({
  jobs: [],
  activeJob: null,
  isLoading: false,
  isUploading: false,
  isTraining: false,
  error: null,

  loadJobs: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<VoiceCloneJob[]>("/api/voice-clone");
      set({ jobs: response.data, isLoading: false });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to load clone jobs.";
      set({ error: message, isLoading: false });
    }
  },

  createJob: async (name: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<VoiceCloneJob>("/api/voice-clone", {
        name,
      });
      const job = response.data;
      set({ activeJob: job, isLoading: false });
      await get().loadJobs();
      return job;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to create clone job.";
      set({ error: message, isLoading: false });
      return null;
    }
  },

  loadJob: async (jobId: string) => {
    try {
      const response = await api.get<VoiceCloneJob>(
        `/api/voice-clone/${jobId}`
      );
      set({ activeJob: response.data });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to load clone job.";
      set({ error: message });
    }
  },

  uploadSample: async (jobId: string, file: File) => {
    set({ isUploading: true, error: null });
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post<VoiceCloneJob>(
        `/api/voice-clone/${jobId}/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      set({ activeJob: response.data, isUploading: false });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to upload sample.";
      set({ error: message, isUploading: false });
    }
  },

  trainVoice: async (jobId: string, config: VoiceCloneTrainRequest) => {
    set({ isTraining: true, error: null });
    try {
      const response = await api.post<VoiceCloneJob>(
        `/api/voice-clone/${jobId}/train`,
        config
      );
      set({ activeJob: response.data, isTraining: false });
      await get().loadJobs();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to train voice.";
      set({ error: message, isTraining: false });
    }
  },

  deleteJob: async (jobId: string) => {
    try {
      await api.delete(`/api/voice-clone/${jobId}`);
      set((state) => ({
        jobs: state.jobs.filter((j) => j.id !== jobId),
        activeJob:
          state.activeJob?.id === jobId ? null : state.activeJob,
      }));
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to delete clone job.";
      set({ error: message });
    }
  },
}));
