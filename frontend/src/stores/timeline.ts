import { create } from "zustand";
import api from "@/lib/api";
import type {
  AudioProject,
  Track,
  TrackSegment,
  MusicItem,
  SFXItem,
} from "@/types";

interface TimelineState {
  project: AudioProject | null;
  selectedTrackId: string | null;
  selectedSegmentId: string | null;
  zoom: number; // pixels per second
  scrollPosition: number;
  musicLibrary: MusicItem[];
  sfxLibrary: SFXItem[];
  isLoading: boolean;
  isDirty: boolean;

  loadProject: (episodeId: string) => Promise<void>;
  saveProject: (episodeId: string) => Promise<void>;
  loadMusicLibrary: () => Promise<void>;
  loadSFXLibrary: () => Promise<void>;

  addMusicTrack: (
    episodeId: string,
    musicId: string,
    positionMs: number
  ) => Promise<void>;
  addSFX: (
    episodeId: string,
    sfxId: string,
    positionMs: number
  ) => Promise<void>;

  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  removeTrack: (trackId: string) => void;
  toggleMute: (trackId: string) => void;
  toggleSolo: (trackId: string) => void;
  setTrackVolume: (trackId: string, volume: number) => void;

  updateSegment: (
    trackId: string,
    segmentId: string,
    updates: Partial<TrackSegment>
  ) => void;
  removeSegment: (trackId: string, segmentId: string) => void;
  moveSegment: (
    trackId: string,
    segmentId: string,
    newStartMs: number
  ) => void;
  trimSegment: (
    trackId: string,
    segmentId: string,
    trimStartMs: number,
    trimEndMs: number
  ) => void;

  setZoom: (zoom: number) => void;
  setScrollPosition: (pos: number) => void;
  selectTrack: (trackId: string | null) => void;
  selectSegment: (
    trackId: string | null,
    segmentId: string | null
  ) => void;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  project: null,
  selectedTrackId: null,
  selectedSegmentId: null,
  zoom: 50, // 50 pixels per second
  scrollPosition: 0,
  musicLibrary: [],
  sfxLibrary: [],
  isLoading: false,
  isDirty: false,

  loadProject: async (episodeId: string) => {
    set({ isLoading: true });
    try {
      const response = await api.get<AudioProject>(
        `/api/mixer/projects/${episodeId}`
      );
      set({ project: response.data, isLoading: false, isDirty: false });
    } catch {
      set({ isLoading: false });
    }
  },

  saveProject: async (episodeId: string) => {
    const { project } = get();
    if (!project) return;
    set({ isLoading: true });
    try {
      const response = await api.put<AudioProject>(
        `/api/mixer/projects/${episodeId}`,
        project
      );
      set({ project: response.data, isLoading: false, isDirty: false });
    } catch {
      set({ isLoading: false });
    }
  },

  loadMusicLibrary: async () => {
    try {
      const response = await api.get<MusicItem[]>("/api/mixer/music");
      set({
        musicLibrary: Array.isArray(response.data) ? response.data : [],
      });
    } catch {
      // ignore
    }
  },

  loadSFXLibrary: async () => {
    try {
      const response = await api.get<SFXItem[]>("/api/mixer/sfx");
      set({
        sfxLibrary: Array.isArray(response.data) ? response.data : [],
      });
    } catch {
      // ignore
    }
  },

  addMusicTrack: async (
    episodeId: string,
    musicId: string,
    positionMs: number
  ) => {
    try {
      const response = await api.post<AudioProject>(
        `/api/mixer/projects/${episodeId}/add-music`,
        { music_id: musicId, position_ms: positionMs }
      );
      set({ project: response.data, isDirty: false });
    } catch {
      // ignore
    }
  },

  addSFX: async (
    episodeId: string,
    sfxId: string,
    positionMs: number
  ) => {
    try {
      const response = await api.post<AudioProject>(
        `/api/mixer/projects/${episodeId}/add-sfx`,
        { sfx_id: sfxId, position_ms: positionMs }
      );
      set({ project: response.data, isDirty: false });
    } catch {
      // ignore
    }
  },

  updateTrack: (trackId: string, updates: Partial<Track>) => {
    const { project } = get();
    if (!project) return;
    set({
      project: {
        ...project,
        tracks: project.tracks.map((t) =>
          t.id === trackId ? { ...t, ...updates } : t
        ),
      },
      isDirty: true,
    });
  },

  removeTrack: (trackId: string) => {
    const { project, selectedTrackId } = get();
    if (!project) return;
    set({
      project: {
        ...project,
        tracks: project.tracks.filter((t) => t.id !== trackId),
      },
      selectedTrackId:
        selectedTrackId === trackId ? null : selectedTrackId,
      selectedSegmentId:
        selectedTrackId === trackId ? null : get().selectedSegmentId,
      isDirty: true,
    });
  },

  toggleMute: (trackId: string) => {
    const { project } = get();
    if (!project) return;
    set({
      project: {
        ...project,
        tracks: project.tracks.map((t) =>
          t.id === trackId ? { ...t, muted: !t.muted } : t
        ),
      },
      isDirty: true,
    });
  },

  toggleSolo: (trackId: string) => {
    const { project } = get();
    if (!project) return;
    set({
      project: {
        ...project,
        tracks: project.tracks.map((t) =>
          t.id === trackId ? { ...t, solo: !t.solo } : t
        ),
      },
      isDirty: true,
    });
  },

  setTrackVolume: (trackId: string, volume: number) => {
    const { project } = get();
    if (!project) return;
    set({
      project: {
        ...project,
        tracks: project.tracks.map((t) =>
          t.id === trackId ? { ...t, volume } : t
        ),
      },
      isDirty: true,
    });
  },

  updateSegment: (
    trackId: string,
    segmentId: string,
    updates: Partial<TrackSegment>
  ) => {
    const { project } = get();
    if (!project) return;
    set({
      project: {
        ...project,
        tracks: project.tracks.map((t) =>
          t.id === trackId
            ? {
                ...t,
                segments: t.segments.map((s) =>
                  s.id === segmentId ? { ...s, ...updates } : s
                ),
              }
            : t
        ),
      },
      isDirty: true,
    });
  },

  removeSegment: (trackId: string, segmentId: string) => {
    const { project, selectedSegmentId } = get();
    if (!project) return;
    set({
      project: {
        ...project,
        tracks: project.tracks.map((t) =>
          t.id === trackId
            ? {
                ...t,
                segments: t.segments.filter((s) => s.id !== segmentId),
              }
            : t
        ),
      },
      selectedSegmentId:
        selectedSegmentId === segmentId ? null : selectedSegmentId,
      isDirty: true,
    });
  },

  moveSegment: (
    trackId: string,
    segmentId: string,
    newStartMs: number
  ) => {
    const { project } = get();
    if (!project) return;
    set({
      project: {
        ...project,
        tracks: project.tracks.map((t) =>
          t.id === trackId
            ? {
                ...t,
                segments: t.segments.map((s) => {
                  if (s.id !== segmentId) return s;
                  const duration = s.end_ms - s.start_ms;
                  return {
                    ...s,
                    start_ms: Math.max(0, newStartMs),
                    end_ms: Math.max(0, newStartMs) + duration,
                  };
                }),
              }
            : t
        ),
      },
      isDirty: true,
    });
  },

  trimSegment: (
    trackId: string,
    segmentId: string,
    trimStartMs: number,
    trimEndMs: number
  ) => {
    const { project } = get();
    if (!project) return;
    set({
      project: {
        ...project,
        tracks: project.tracks.map((t) =>
          t.id === trackId
            ? {
                ...t,
                segments: t.segments.map((s) =>
                  s.id === segmentId
                    ? {
                        ...s,
                        trim_start_ms: trimStartMs,
                        trim_end_ms: trimEndMs,
                      }
                    : s
                ),
              }
            : t
        ),
      },
      isDirty: true,
    });
  },

  setZoom: (zoom: number) => set({ zoom }),
  setScrollPosition: (pos: number) => set({ scrollPosition: pos }),
  selectTrack: (trackId: string | null) =>
    set({ selectedTrackId: trackId }),
  selectSegment: (
    trackId: string | null,
    segmentId: string | null
  ) => set({ selectedTrackId: trackId, selectedSegmentId: segmentId }),
}));
