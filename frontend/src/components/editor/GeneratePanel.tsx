"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  BookOpen,
  BookMarked,
  ArrowRightLeft,
  Loader2,
  Brain,
} from "lucide-react";
import api from "@/lib/api";
import { useEditorStore } from "@/stores/editor";
import { useKnowledgeStore } from "@/stores/knowledge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type {
  GenerateScriptRequest,
  GenerateScriptResponse,
  EpisodeFormat,
  InlineRewriteRequest,
  InlineRewriteResponse,
  ScriptBlock,
} from "@/types";

const formatOptions = [
  { value: "solo", label: "Solo" },
  { value: "conversation", label: "Conversation" },
  { value: "interview", label: "Interview" },
  { value: "panel", label: "Panel Discussion" },
  { value: "narrative", label: "Narrative" },
];

const toneOptions = [
  { value: "casual", label: "Casual" },
  { value: "professional", label: "Professional" },
  { value: "educational", label: "Educational" },
  { value: "comedic", label: "Comedic" },
];

interface GeneratePanelProps {
  episodeId: string;
  podcastId?: string;
}

let quickActionBlockId = 1;
function generateQuickBlockId(): string {
  return `quick_block_${Date.now()}_${quickActionBlockId++}`;
}

export function GeneratePanel({ episodeId, podcastId }: GeneratePanelProps) {
  const { setScript, blocks, updateBlock } = useEditorStore();
  const { context, loadContext } = useKnowledgeStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickActionLoading, setQuickActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (podcastId) {
      loadContext(podcastId);
    }
  }, [podcastId, loadContext]);
  const [formData, setFormData] = useState<GenerateScriptRequest>({
    topic: "",
    format: "conversation",
    tone: "casual",
    target_duration: 600,
    source_material: "",
  });

  const handleGenerate = async () => {
    if (!formData.topic.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const response = await api.post<GenerateScriptResponse>(
        `/api/episodes/${episodeId}/generate`,
        formData
      );
      setScript(response.data.script);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to generate script. Please try again.";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    if (blocks.length === 0) {
      setError("Add some script blocks first before using quick actions.");
      return;
    }

    setQuickActionLoading(action);
    setError(null);

    try {
      if (action === "introduction") {
        const contextText = blocks
          .slice(0, 3)
          .map((b) => `${b.speaker}: ${b.text}`)
          .join("\n");

        const payload: InlineRewriteRequest = {
          text: contextText,
          instruction:
            "Generate an engaging introduction paragraph for a podcast episode that leads into this content. Write only the introduction text, not the existing content. Make it welcoming and set the stage for the topic.",
          context: contextText,
        };
        const response = await api.post<InlineRewriteResponse>(
          "/api/ai/rewrite-inline",
          payload
        );

        const newBlock: ScriptBlock = {
          id: generateQuickBlockId(),
          order: 0,
          speaker: "Host",
          text: response.data.text,
          stage_direction: "Introduction",
        };

        const { blocks: currentBlocks } = useEditorStore.getState();
        const updatedBlocks = [newBlock, ...currentBlocks].map((b, i) => ({
          ...b,
          order: i,
        }));

        useEditorStore.setState({ blocks: updatedBlocks, isDirty: true });
      } else if (action === "conclusion") {
        const contextText = blocks
          .slice(-3)
          .map((b) => `${b.speaker}: ${b.text}`)
          .join("\n");

        const payload: InlineRewriteRequest = {
          text: contextText,
          instruction:
            "Generate a strong conclusion paragraph for a podcast episode based on this content. Write only the conclusion text. Summarize key takeaways and give a compelling closing.",
          context: contextText,
        };
        const response = await api.post<InlineRewriteResponse>(
          "/api/ai/rewrite-inline",
          payload
        );

        const { blocks: currentBlocks } = useEditorStore.getState();
        const newBlock: ScriptBlock = {
          id: generateQuickBlockId(),
          order: currentBlocks.length,
          speaker: "Host",
          text: response.data.text,
          stage_direction: "Conclusion",
        };

        const updatedBlocks = [...currentBlocks, newBlock].map((b, i) => ({
          ...b,
          order: i,
        }));

        useEditorStore.setState({ blocks: updatedBlocks, isDirty: true });
      } else if (action === "improve-flow") {
        // Rewrite all blocks to improve transitions
        for (let i = 0; i < blocks.length; i++) {
          const block = blocks[i];
          const prevText = i > 0 ? blocks[i - 1].text : "";
          const nextText = i < blocks.length - 1 ? blocks[i + 1].text : "";

          const contextParts: string[] = [];
          if (prevText) contextParts.push(`Previous block: ${prevText}`);
          if (nextText) contextParts.push(`Next block: ${nextText}`);

          const payload: InlineRewriteRequest = {
            text: block.text,
            instruction:
              "Improve the flow and transitions of this text. Make it connect smoothly with the surrounding content while keeping the core message intact. Only return the improved version of this specific text.",
            context: contextParts.join("\n"),
          };

          const response = await api.post<InlineRewriteResponse>(
            "/api/ai/rewrite-inline",
            payload
          );

          updateBlock(block.id, { text: response.data.text });
        }
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Quick action failed. Please try again.";
      setError(message);
    } finally {
      setQuickActionLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-accent-500" />
        <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
          Generate Script
        </h3>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-2.5">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <Textarea
        label="Topic"
        placeholder="What should the podcast episode be about?"
        value={formData.topic}
        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
        rows={3}
        className="text-sm"
      />

      <Select
        label="Format"
        options={formatOptions}
        value={formData.format}
        onChange={(value) =>
          setFormData({ ...formData, format: value as EpisodeFormat })
        }
      />

      <Select
        label="Tone"
        options={toneOptions}
        value={formData.tone}
        onChange={(value) =>
          setFormData({
            ...formData,
            tone: value as "casual" | "professional" | "educational" | "comedic",
          })
        }
      />

      <Input
        label="Target Duration (minutes)"
        type="number"
        min={1}
        max={180}
        value={Math.round((formData.target_duration || 600) / 60)}
        onChange={(e) =>
          setFormData({
            ...formData,
            target_duration: parseInt(e.target.value) * 60,
          })
        }
      />

      <Textarea
        label="Source Material (optional)"
        placeholder="Paste any reference text, notes, or outlines..."
        value={formData.source_material || ""}
        onChange={(e) =>
          setFormData({ ...formData, source_material: e.target.value })
        }
        rows={3}
        className="text-sm"
      />

      {/* Knowledge context indicator */}
      {context && context.total_entries > 0 && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary-50/50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-800">
          <Brain className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-primary-700 dark:text-primary-300">
              Analyzing {context.total_entries} knowledge{" "}
              {context.total_entries === 1 ? "entry" : "entries"}
            </p>
            <p className="text-[10px] text-primary-600/70 dark:text-primary-400/70">
              {context.never_repeat.length} topics to avoid repeating
              {context.recurring.length > 0 &&
                ` · ${context.recurring.length} recurring themes`}
            </p>
          </div>
        </div>
      )}

      <Button
        onClick={handleGenerate}
        className="w-full"
        isLoading={isGenerating}
        disabled={!formData.topic.trim()}
      >
        <Sparkles className="w-4 h-4" />
        {isGenerating ? "Generating..." : "Generate Script"}
      </Button>

      {/* Quick Actions */}
      <div className="border-t border-[hsl(var(--border))] pt-4">
        <h4 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">
          Quick Actions
        </h4>
        <div className="space-y-2">
          <button
            onClick={() => handleQuickAction("introduction")}
            disabled={quickActionLoading !== null}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors disabled:opacity-50"
          >
            {quickActionLoading === "introduction" ? (
              <Loader2 className="w-4 h-4 animate-spin text-accent-500" />
            ) : (
              <BookOpen className="w-4 h-4 text-accent-500" />
            )}
            Add Introduction
          </button>
          <button
            onClick={() => handleQuickAction("conclusion")}
            disabled={quickActionLoading !== null}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors disabled:opacity-50"
          >
            {quickActionLoading === "conclusion" ? (
              <Loader2 className="w-4 h-4 animate-spin text-accent-500" />
            ) : (
              <BookMarked className="w-4 h-4 text-accent-500" />
            )}
            Add Conclusion
          </button>
          <button
            onClick={() => handleQuickAction("improve-flow")}
            disabled={quickActionLoading !== null}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors disabled:opacity-50"
          >
            {quickActionLoading === "improve-flow" ? (
              <Loader2 className="w-4 h-4 animate-spin text-accent-500" />
            ) : (
              <ArrowRightLeft className="w-4 h-4 text-accent-500" />
            )}
            Improve Flow
          </button>
        </div>
      </div>
    </div>
  );
}
