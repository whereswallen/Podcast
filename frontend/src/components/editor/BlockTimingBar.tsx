"use client";

import { useMemo } from "react";
import { Clock } from "lucide-react";
import { cn, countWords, formatDuration } from "@/lib/utils";
import type { ScriptBlock } from "@/types";

interface BlockTimingBarProps {
  blocks: ScriptBlock[];
}

// Color palette for speakers
const speakerColors: Record<string, string> = {
  Host: "bg-primary-500",
  Guest: "bg-secondary-500",
  Narrator: "bg-accent-500",
  Interviewer: "bg-emerald-500",
};

const speakerColorList = [
  "bg-primary-500",
  "bg-secondary-500",
  "bg-accent-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-amber-500",
];

function getSpeakerColor(speaker: string, speakerIndex: number): string {
  if (speakerColors[speaker]) return speakerColors[speaker];
  return speakerColorList[speakerIndex % speakerColorList.length];
}

export function BlockTimingBar({ blocks }: BlockTimingBarProps) {
  const blockTimings = useMemo(() => {
    const uniqueSpeakers = Array.from(new Set(blocks.map((b) => b.speaker)));
    return blocks.map((block) => {
      const words = countWords(block.text);
      const seconds = Math.round((words / 150) * 60);
      const speakerIndex = uniqueSpeakers.indexOf(block.speaker);
      return {
        id: block.id,
        speaker: block.speaker,
        seconds,
        color: getSpeakerColor(block.speaker, speakerIndex),
      };
    });
  }, [blocks]);

  const totalSeconds = useMemo(
    () => blockTimings.reduce((sum, b) => sum + b.seconds, 0),
    [blockTimings]
  );

  const uniqueSpeakers = useMemo(() => {
    const seen = new Set<string>();
    return blockTimings.filter((b) => {
      if (seen.has(b.speaker)) return false;
      seen.add(b.speaker);
      return true;
    });
  }, [blockTimings]);

  if (blocks.length === 0) return null;

  return (
    <div className="px-6 py-2 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div className="flex items-center gap-3">
        <Clock className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))] flex-shrink-0" />

        {/* Timing bar */}
        <div className="flex-1 flex h-3 rounded-full overflow-hidden bg-[hsl(var(--muted))]">
          {blockTimings.map((block) => {
            const widthPercent =
              totalSeconds > 0 ? (block.seconds / totalSeconds) * 100 : 0;
            if (widthPercent === 0) return null;
            return (
              <div
                key={block.id}
                className={cn(block.color, "opacity-80 hover:opacity-100 transition-opacity")}
                style={{ width: `${widthPercent}%` }}
                title={`${block.speaker}: ~${block.seconds}s`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {uniqueSpeakers.map((s) => (
            <div key={s.speaker} className="flex items-center gap-1">
              <div className={cn("w-2 h-2 rounded-full", s.color)} />
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                {s.speaker}
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <span className="text-xs font-medium text-[hsl(var(--foreground))] flex-shrink-0">
          {formatDuration(totalSeconds)}
        </span>
      </div>
    </div>
  );
}
