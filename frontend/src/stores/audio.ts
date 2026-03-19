import { create } from "zustand";
import api from "@/lib/api";
import type { RenderJob, RenderStatus } from "@/types";

interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  audioUrl: string | null;
  renderStatus: RenderStatus;
  renderProgress: number;
  renderError: string | null;
  isLoading: boolean;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setDuration: (duration: number) => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  setAudioUrl: (url: string | null) => void;
  startRender: (episodeId: string) => Promise<void>;
  checkRenderStatus: (episodeId: string) => Promise<RenderStatus>;
  reset: () => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  audioUrl: null,
  renderStatus: "idle",
  renderProgress: 0,
  renderError: null,
  isLoading: false,

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  seek: (time: number) => set({ currentTime: time }),
  setDuration: (duration: number) => set({ duration }),
  setCurrentTime: (time: number) => set({ currentTime: time }),
  setVolume: (volume: number) => set({ volume }),
  setAudioUrl: (url: string | null) => set({ audioUrl: url }),

  startRender: async (episodeId: string) => {
    set({ renderStatus: "queued", renderProgress: 0, renderError: null, isLoading: true });
    try {
      const response = await api.post<RenderJob>(
        `/api/episodes/${episodeId}/render`
      );
      const job = response.data;
      set({
        renderStatus: job.status,
        renderProgress: job.progress,
        isLoading: false,
      });

      // Start polling
      const poll = async () => {
        const status = await get().checkRenderStatus(episodeId);
        if (status === "rendering" || status === "queued") {
          setTimeout(poll, 2000);
        }
      };
      poll();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to start render.";
      set({ renderStatus: "failed", renderError: message, isLoading: false });
    }
  },

  checkRenderStatus: async (episodeId: string): Promise<RenderStatus> => {
    try {
      const response = await api.get<RenderJob>(
        `/api/episodes/${episodeId}/render/status`
      );
      const job = response.data;
      set({
        renderStatus: job.status,
        renderProgress: job.progress,
        audioUrl: job.audio_url || null,
        renderError: job.error || null,
      });
      return job.status;
    } catch {
      return get().renderStatus;
    }
  },

  reset: () => {
    set({
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      audioUrl: null,
      renderStatus: "idle",
      renderProgress: 0,
      renderError: null,
    });
  },
}));
