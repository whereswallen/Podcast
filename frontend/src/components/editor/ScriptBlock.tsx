"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  GripVertical,
  Trash2,
  ChevronUp,
  ChevronDown,
  Wand2,
} from "lucide-react";
import { cn, countWords } from "@/lib/utils";
import type { ScriptBlock as ScriptBlockType, VoiceProfile } from "@/types";
import { InlineAIMenu } from "./InlineAIMenu";

interface ScriptBlockProps {
  block: ScriptBlockType;
  isSelected: boolean;
  voices: VoiceProfile[];
  speakers: string[];
  onSelect: () => void;
  onUpdate: (updates: Partial<ScriptBlockType>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  contextText?: string;
}

export function ScriptBlock({
  block,
  isSelected,
  voices,
  speakers,
  onSelect,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  contextText,
}: ScriptBlockProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [aiMenuPosition, setAIMenuPosition] = useState({ top: 0, left: 0 });

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    }
  }, [block.text]);

  const allSpeakers = Array.from(
    new Set([...speakers, "Host", "Guest", "Narrator", "Interviewer"])
  );

  const wordCount = countWords(block.text);
  const timingSeconds = Math.round((wordCount / 150) * 60);

  const handleAIClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (blockRef.current) {
      const rect = blockRef.current.getBoundingClientRect();
      setAIMenuPosition({
        top: rect.top,
        left: rect.right + 8,
      });

      // If the menu would overflow the viewport on the right, position it to the left
      if (rect.right + 8 + 288 > window.innerWidth) {
        setAIMenuPosition({
          top: rect.top,
          left: rect.left - 288 - 8,
        });
      }
    }
    setShowAIMenu(true);
  }, []);

  return (
    <div
      ref={blockRef}
      className={cn(
        "group relative rounded-lg border bg-[hsl(var(--card))] p-4 transition-all",
        isSelected
          ? "border-primary-400 dark:border-primary-600 ring-1 ring-primary-400/20 dark:ring-primary-600/20"
          : "border-[hsl(var(--border))] hover:border-[hsl(var(--muted-foreground))]/30"
      )}
      onClick={onSelect}
    >
      <div className="flex gap-3">
        {/* Drag handle & controls */}
        <div className="flex flex-col items-center gap-1 pt-1">
          <div className="cursor-grab text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
            <GripVertical className="w-4 h-4" />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            disabled={isFirst}
            className="p-0.5 rounded hover:bg-[hsl(var(--muted))] disabled:opacity-30 transition-colors"
          >
            <ChevronUp className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            disabled={isLast}
            className="p-0.5 rounded hover:bg-[hsl(var(--muted))] disabled:opacity-30 transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          {/* Speaker row */}
          <div className="flex items-center gap-3">
            <select
              value={block.speaker}
              onChange={(e) => onUpdate({ speaker: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              className="h-8 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            >
              {allSpeakers.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {voices.length > 0 && (
              <select
                value={block.voice_id || ""}
                onChange={(e) =>
                  onUpdate({ voice_id: e.target.value || undefined })
                }
                onClick={(e) => e.stopPropagation()}
                className="h-8 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2 text-xs text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              >
                <option value="">Default voice</option>
                {voices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            )}
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={handleAIClick}
                className="p-1.5 rounded hover:bg-accent-50 dark:hover:bg-accent-950/30 text-[hsl(var(--muted-foreground))] hover:text-accent-600 opacity-0 group-hover:opacity-100 transition-all"
                title="AI Rewrite"
              >
                <Wand2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-[hsl(var(--muted-foreground))] hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                title="Delete block"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Text content */}
          <textarea
            ref={textareaRef}
            value={block.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            placeholder="Enter dialogue text..."
            className="w-full bg-transparent text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] resize-none focus:outline-none leading-relaxed min-h-[60px]"
            rows={2}
          />

          {/* Stage direction */}
          <input
            type="text"
            value={block.stage_direction || ""}
            onChange={(e) => onUpdate({ stage_direction: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            placeholder="Stage direction (optional)..."
            className="w-full bg-transparent text-xs italic text-[hsl(var(--muted-foreground))] placeholder:text-[hsl(var(--muted-foreground))]/50 focus:outline-none"
          />

          {/* Word count & timing */}
          <div className="flex items-center justify-end gap-3">
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
              {wordCount} {wordCount === 1 ? "word" : "words"}
            </span>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
              ~{timingSeconds}s
            </span>
          </div>
        </div>
      </div>

      {/* Inline AI Menu */}
      {showAIMenu && (
        <InlineAIMenu
          blockId={block.id}
          blockText={block.text}
          position={aiMenuPosition}
          onClose={() => setShowAIMenu(false)}
        />
      )}
    </div>
  );
}
