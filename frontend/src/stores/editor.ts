import { create } from "zustand";
import api from "@/lib/api";
import type {
  Script,
  ScriptBlock,
  SaveScriptRequest,
  ScriptRevision,
  InlineRewriteRequest,
  InlineRewriteResponse,
} from "@/types";

interface EditorState {
  script: Script | null;
  blocks: ScriptBlock[];
  selectedBlockId: string | null;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  revisions: ScriptRevision[];
  setScript: (script: Script) => void;
  updateBlock: (blockId: string, updates: Partial<ScriptBlock>) => void;
  addBlock: (afterBlockId?: string) => void;
  removeBlock: (blockId: string) => void;
  moveBlock: (blockId: string, direction: "up" | "down") => void;
  setSelectedBlock: (blockId: string | null) => void;
  saveScript: (episodeId: string) => Promise<void>;
  loadScript: (episodeId: string) => Promise<void>;
  clearEditor: () => void;
  loadRevisions: (episodeId: string) => Promise<void>;
  restoreRevision: (episodeId: string, version: number) => Promise<void>;
  rewriteBlock: (blockId: string, instruction: string, context?: string) => Promise<void>;
}

let nextBlockId = 1;

function generateBlockId(): string {
  return `block_${Date.now()}_${nextBlockId++}`;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  script: null,
  blocks: [],
  selectedBlockId: null,
  isDirty: false,
  isLoading: false,
  isSaving: false,
  error: null,
  revisions: [],

  setScript: (script: Script) => {
    set({
      script,
      blocks: script.blocks,
      isDirty: false,
      error: null,
    });
  },

  updateBlock: (blockId: string, updates: Partial<ScriptBlock>) => {
    set((state) => ({
      blocks: state.blocks.map((b) =>
        b.id === blockId ? { ...b, ...updates } : b
      ),
      isDirty: true,
    }));
  },

  addBlock: (afterBlockId?: string) => {
    const { blocks } = get();
    const newBlock: ScriptBlock = {
      id: generateBlockId(),
      order: 0,
      speaker: "Host",
      text: "",
      stage_direction: "",
    };

    let newBlocks: ScriptBlock[];
    if (afterBlockId) {
      const index = blocks.findIndex((b) => b.id === afterBlockId);
      newBlocks = [
        ...blocks.slice(0, index + 1),
        newBlock,
        ...blocks.slice(index + 1),
      ];
    } else {
      newBlocks = [...blocks, newBlock];
    }

    // Reorder
    newBlocks = newBlocks.map((b, i) => ({ ...b, order: i }));

    set({ blocks: newBlocks, isDirty: true, selectedBlockId: newBlock.id });
  },

  removeBlock: (blockId: string) => {
    set((state) => {
      const newBlocks = state.blocks
        .filter((b) => b.id !== blockId)
        .map((b, i) => ({ ...b, order: i }));
      return {
        blocks: newBlocks,
        isDirty: true,
        selectedBlockId:
          state.selectedBlockId === blockId ? null : state.selectedBlockId,
      };
    });
  },

  moveBlock: (blockId: string, direction: "up" | "down") => {
    set((state) => {
      const index = state.blocks.findIndex((b) => b.id === blockId);
      if (index === -1) return state;
      if (direction === "up" && index === 0) return state;
      if (direction === "down" && index === state.blocks.length - 1)
        return state;

      const newBlocks = [...state.blocks];
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      [newBlocks[index], newBlocks[swapIndex]] = [
        newBlocks[swapIndex],
        newBlocks[index],
      ];

      return {
        blocks: newBlocks.map((b, i) => ({ ...b, order: i })),
        isDirty: true,
      };
    });
  },

  setSelectedBlock: (blockId: string | null) => {
    set({ selectedBlockId: blockId });
  },

  saveScript: async (episodeId: string) => {
    const { blocks } = get();
    set({ isSaving: true, error: null });
    try {
      const payload: SaveScriptRequest = {
        blocks: blocks.map(({ speaker, text, stage_direction, voice_id, order }) => ({
          order,
          speaker,
          text,
          stage_direction,
          voice_id,
        })),
      };
      const response = await api.put<Script>(
        `/api/episodes/${episodeId}/script`,
        payload
      );
      set({ script: response.data, isDirty: false, isSaving: false });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to save script.";
      set({ error: message, isSaving: false });
    }
  },

  loadScript: async (episodeId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<Script>(
        `/api/episodes/${episodeId}/script`
      );
      const script = response.data;
      set({
        script,
        blocks: script.blocks || [],
        isLoading: false,
        isDirty: false,
      });
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        // No script yet — start empty
        set({ script: null, blocks: [], isLoading: false, isDirty: false });
      } else {
        const message =
          (err as { response?: { data?: { detail?: string } } })?.response?.data
            ?.detail || "Failed to load script.";
        set({ error: message, isLoading: false });
      }
    }
  },

  clearEditor: () => {
    set({
      script: null,
      blocks: [],
      selectedBlockId: null,
      isDirty: false,
      error: null,
      revisions: [],
    });
  },

  loadRevisions: async (episodeId: string) => {
    try {
      const response = await api.get<ScriptRevision[]>(
        `/api/episodes/${episodeId}/script/revisions`
      );
      set({ revisions: response.data });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to load revisions.";
      set({ error: message });
    }
  },

  restoreRevision: async (episodeId: string, version: number) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(
        `/api/episodes/${episodeId}/script/revisions/${version}/restore`
      );
      // Reload the script after restoring
      const response = await api.get<Script>(
        `/api/episodes/${episodeId}/script`
      );
      const script = response.data;
      set({
        script,
        blocks: script.blocks || [],
        isLoading: false,
        isDirty: false,
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to restore revision.";
      set({ error: message, isLoading: false });
    }
  },

  rewriteBlock: async (blockId: string, instruction: string, context?: string) => {
    const { blocks } = get();
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;

    try {
      const payload: InlineRewriteRequest = {
        text: block.text,
        instruction,
        context,
      };
      const response = await api.post<InlineRewriteResponse>(
        "/api/ai/rewrite-inline",
        payload
      );
      set((state) => ({
        blocks: state.blocks.map((b) =>
          b.id === blockId ? { ...b, text: response.data.text } : b
        ),
        isDirty: true,
      }));
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to rewrite block.";
      set({ error: message });
      throw new Error(message);
    }
  },
}));
