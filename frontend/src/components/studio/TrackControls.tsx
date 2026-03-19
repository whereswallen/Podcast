"use client";

import { useState } from "react";
import {
  Volume2,
  VolumeX,
  Trash2,
  Music,
  Mic2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTimelineStore } from "@/stores/timeline";
import { Button } from "@/components/ui/button";
import type { Track } from "@/types";

export function TrackControls() {
  const {
    project,
    selectedTrackId,
    updateTrack,
    removeTrack,
    toggleMute,
    toggleSolo,
    setTrackVolume,
  } = useTimelineStore();

  const track = project?.tracks.find((t) => t.id === selectedTrackId) || null;

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");

  if (!track) {
    return (
      <div className="flex items-center justify-center h-full px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">
        Select a track to view its controls
      </div>
    );
  }

  const handleNameDoubleClick = () => {
    setNameValue(track.name);
    setEditingName(true);
  };

  const handleNameSave = () => {
    if (nameValue.trim()) {
      updateTrack(track.id, { name: nameValue.trim() });
    }
    setEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleNameSave();
    if (e.key === "Escape") setEditingName(false);
  };

  const volumeDb = track.volume > 0 ? 20 * Math.log10(track.volume) : -Infinity;
  const volumeDbDisplay =
    volumeDb === -Infinity ? "-inf" : `${volumeDb.toFixed(1)} dB`;

  const typeIcon: Record<string, React.ReactNode> = {
    speech: <Mic2 className="w-4 h-4 text-blue-500" />,
    music: <Music className="w-4 h-4 text-green-500" />,
    sfx: <Sparkles className="w-4 h-4 text-orange-500" />,
  };

  const typeBadge: Record<string, string> = {
    speech: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    music: "bg-green-500/10 text-green-600 dark:text-green-400",
    sfx: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  };

  return (
    <div className="flex items-center gap-6 px-4 py-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      {/* Track Identity */}
      <div className="flex items-center gap-2 min-w-[180px]">
        {typeIcon[track.type]}
        <div>
          {editingName ? (
            <input
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={handleNameKeyDown}
              autoFocus
              className="text-sm font-semibold bg-transparent border-b border-primary-500 outline-none text-[hsl(var(--foreground))] w-32"
            />
          ) : (
            <span
              className="text-sm font-semibold text-[hsl(var(--foreground))] cursor-pointer hover:text-primary-600 transition-colors"
              onDoubleClick={handleNameDoubleClick}
              title="Double-click to edit name"
            >
              {track.name}
            </span>
          )}
          <span
            className={cn(
              "block text-[10px] font-medium px-1.5 py-0.5 rounded-full w-fit mt-0.5",
              typeBadge[track.type]
            )}
          >
            {track.type.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => toggleMute(track.id)}
          className={cn(
            "p-1.5 rounded transition-colors",
            track.muted
              ? "bg-red-500/20 text-red-500"
              : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
          )}
          title={track.muted ? "Unmute" : "Mute"}
        >
          {track.muted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
        <div className="flex flex-col items-center gap-0.5">
          <input
            type="range"
            min={0}
            max={1.5}
            step={0.01}
            value={track.volume}
            onChange={(e) =>
              setTrackVolume(track.id, parseFloat(e.target.value))
            }
            className="w-24 h-1.5 accent-primary-600"
          />
          <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
            {volumeDbDisplay}
          </span>
        </div>
      </div>

      {/* Pan Control */}
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
            L
          </span>
          <input
            type="range"
            min={-1}
            max={1}
            step={0.01}
            value={track.pan}
            onChange={(e) =>
              updateTrack(track.id, { pan: parseFloat(e.target.value) })
            }
            className="w-20 h-1.5 accent-primary-600"
          />
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
            R
          </span>
        </div>
        <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
          Pan: {track.pan === 0 ? "C" : track.pan < 0 ? `L${Math.round(Math.abs(track.pan) * 100)}` : `R${Math.round(track.pan * 100)}`}
        </span>
      </div>

      {/* Solo Toggle */}
      <button
        onClick={() => toggleSolo(track.id)}
        className={cn(
          "px-2.5 py-1 rounded text-xs font-bold transition-colors",
          track.solo
            ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
            : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] border border-[hsl(var(--border))]"
        )}
      >
        SOLO
      </button>

      {/* Segments info */}
      <div className="text-xs text-[hsl(var(--muted-foreground))]">
        {track.segments.length} segment{track.segments.length !== 1 ? "s" : ""}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Delete Track */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => removeTrack(track.id)}
        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete Track
      </Button>
    </div>
  );
}
