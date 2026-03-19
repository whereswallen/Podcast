"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Plus,
  FileText,
  Clock,
  Mic2,
  CheckCircle,
  AlertCircle,
  History,
} from "lucide-react";
import api from "@/lib/api";
import { cn, countWords, estimateDuration, formatDuration } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor";
import type { Episode, VoiceProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScriptBlock } from "@/components/editor/ScriptBlock";
import { GeneratePanel } from "@/components/editor/GeneratePanel";
import { AudioPlayer } from "@/components/player/AudioPlayer";
import { VersionHistory } from "@/components/editor/VersionHistory";
import { BlockTimingBar } from "@/components/editor/BlockTimingBar";

export default function EditorPage() {
  const params = useParams();
  const episodeId = params.episodeId as string;

  const {
    blocks,
    selectedBlockId,
    isDirty,
    isLoading,
    isSaving,
    error,
    loadScript,
    saveScript,
    updateBlock,
    addBlock,
    removeBlock,
    moveBlock,
    setSelectedBlock,
  } = useEditorStore();

  const [episode, setEpisode] = useState<Episode | null>(null);
  const [voices, setVoices] = useState<VoiceProfile[]>([]);
  const [voiceAssignments, setVoiceAssignments] = useState<
    Record<string, string>
  >({});
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [episodeRes, voicesRes] = await Promise.all([
        api.get<Episode>(`/api/episodes/${episodeId}`),
        api.get<VoiceProfile[]>("/api/voices"),
      ]);
      setEpisode(episodeRes.data);
      setVoices(Array.isArray(voicesRes.data) ? voicesRes.data : []);
    } catch {
      // Handle error
    }
  }, [episodeId]);

  useEffect(() => {
    fetchData();
    loadScript(episodeId);
  }, [fetchData, loadScript, episodeId]);

  // Keyboard shortcut: Ctrl+S to save
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (isDirty && !isSaving) {
          saveScript(episodeId);
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDirty, isSaving, episodeId, saveScript]);

  // Derived data
  const speakers = useMemo(() => {
    const set = new Set(blocks.map((b) => b.speaker));
    return Array.from(set);
  }, [blocks]);

  const totalWords = useMemo(() => {
    return blocks.reduce((sum, b) => sum + countWords(b.text), 0);
  }, [blocks]);

  const estimatedTime = useMemo(() => estimateDuration(totalWords), [totalWords]);

  const handleSave = async () => {
    await saveScript(episodeId);
  };

  const handleVoiceAssign = (speaker: string, voiceId: string) => {
    setVoiceAssignments((prev) => ({ ...prev, [speaker]: voiceId }));
    // Update all blocks with this speaker
    blocks.forEach((block) => {
      if (block.speaker === speaker) {
        updateBlock(block.id, { voice_id: voiceId || undefined });
      }
    });
  };

  // Build context text for each block (prev + next block text)
  const getBlockContext = (index: number): string => {
    const parts: string[] = [];
    if (index > 0) {
      parts.push(`Previous: ${blocks[index - 1].text}`);
    }
    if (index < blocks.length - 1) {
      parts.push(`Next: ${blocks[index + 1].text}`);
    }
    return parts.join("\n");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] -m-6 lg:-m-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="flex items-center gap-3">
          <Link
            href={episode ? `/dashboard/${episode.podcast_id}` : "/dashboard"}
            className="p-1.5 rounded hover:bg-[hsl(var(--muted))] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          </Link>
          <div>
            <h1 className="text-sm font-semibold text-[hsl(var(--foreground))]">
              {episode?.title || "Episode"}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              {episode && (
                <Badge variant="secondary" className="text-[10px]">
                  {episode.format}
                </Badge>
              )}
              {isDirty && (
                <span className="text-[10px] text-accent-600 font-medium">
                  Unsaved changes
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <div className="flex items-center gap-1 text-xs text-red-500">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </div>
          )}
          {isSaving && (
            <div className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
              <div className="w-3 h-3 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              Saving...
            </div>
          )}
          {!isDirty && !isSaving && blocks.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle className="w-3.5 h-3.5" />
              Saved
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsHistoryOpen(true)}
          >
            <History className="w-4 h-4" />
            History
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={!isDirty || isSaving}>
            <Save className="w-4 h-4" />
            Save
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel — Script Editor */}
        <div className="flex-[7] overflow-y-auto p-6 space-y-3">
          {blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No script yet</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4 max-w-sm">
                Start by adding script blocks manually or generate a complete
                script using AI.
              </p>
              <Button onClick={() => addBlock()}>
                <Plus className="w-4 h-4" />
                Add First Block
              </Button>
            </div>
          ) : (
            <>
              {blocks.map((block, index) => (
                <ScriptBlock
                  key={block.id}
                  block={block}
                  isSelected={block.id === selectedBlockId}
                  voices={voices}
                  speakers={speakers}
                  onSelect={() => setSelectedBlock(block.id)}
                  onUpdate={(updates) => updateBlock(block.id, updates)}
                  onDelete={() => removeBlock(block.id)}
                  onMoveUp={() => moveBlock(block.id, "up")}
                  onMoveDown={() => moveBlock(block.id, "down")}
                  isFirst={index === 0}
                  isLast={index === blocks.length - 1}
                  contextText={getBlockContext(index)}
                />
              ))}
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    addBlock(blocks.length > 0 ? blocks[blocks.length - 1].id : undefined)
                  }
                >
                  <Plus className="w-4 h-4" />
                  Add Block
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Right Panel */}
        <div className="flex-[3] border-l border-[hsl(var(--border))] overflow-y-auto bg-[hsl(var(--background))]">
          <div className="p-4 space-y-6">
            {/* Generate Script Section */}
            <GeneratePanel episodeId={episodeId} />

            {/* Divider */}
            <div className="border-t border-[hsl(var(--border))]" />

            {/* Voice Assignment */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Mic2 className="w-4 h-4 text-secondary-500" />
                <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                  Voice Assignment
                </h3>
              </div>
              {speakers.length === 0 ? (
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Add script blocks to assign voices.
                </p>
              ) : (
                <div className="space-y-3">
                  {speakers.map((speaker) => (
                    <div key={speaker}>
                      <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">
                        {speaker}
                      </label>
                      <Select
                        options={[
                          { value: "", label: "Default voice" },
                          ...voices.map((v) => ({
                            value: v.id,
                            label: v.name,
                          })),
                        ]}
                        value={voiceAssignments[speaker] || ""}
                        onChange={(value) =>
                          handleVoiceAssign(speaker, value)
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-[hsl(var(--border))]" />

            {/* Episode Info */}
            <div>
              <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">
                Episode Info
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Words
                  </span>
                  <span className={cn("font-medium", totalWords > 0 ? "text-[hsl(var(--foreground))]" : "text-[hsl(var(--muted-foreground))]")}>
                    {totalWords.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Est. Duration
                  </span>
                  <span className={cn("font-medium", estimatedTime > 0 ? "text-[hsl(var(--foreground))]" : "text-[hsl(var(--muted-foreground))]")}>
                    {formatDuration(estimatedTime)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[hsl(var(--muted-foreground))]">
                    Blocks
                  </span>
                  <span className="font-medium text-[hsl(var(--foreground))]">
                    {blocks.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[hsl(var(--muted-foreground))]">
                    Speakers
                  </span>
                  <span className="font-medium text-[hsl(var(--foreground))]">
                    {speakers.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Block Timing Bar */}
      <BlockTimingBar blocks={blocks} />

      {/* Bottom Audio Player */}
      <AudioPlayer episodeId={episodeId} />

      {/* Version History Panel */}
      <VersionHistory
        episodeId={episodeId}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        currentBlocks={blocks}
      />
    </div>
  );
}
