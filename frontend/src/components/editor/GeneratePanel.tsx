"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import api from "@/lib/api";
import { useEditorStore } from "@/stores/editor";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { GenerateScriptRequest, GenerateScriptResponse, EpisodeFormat } from "@/types";

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
}

export function GeneratePanel({ episodeId }: GeneratePanelProps) {
  const { setScript } = useEditorStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

      <Button
        onClick={handleGenerate}
        className="w-full"
        isLoading={isGenerating}
        disabled={!formData.topic.trim()}
      >
        <Sparkles className="w-4 h-4" />
        {isGenerating ? "Generating..." : "Generate Script"}
      </Button>
    </div>
  );
}
