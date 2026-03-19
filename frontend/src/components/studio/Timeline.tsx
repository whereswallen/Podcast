"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  Music,
  Mic2,
  Sparkles,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
  Trash2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTimelineStore } from "@/stores/timeline";
import { useAudioStore } from "@/stores/audio";
import type { Track, TrackSegment } from "@/types";

interface TimelineProps {
  episodeId: string;
}

const TRACK_HEIGHT = 64;
const RULER_HEIGHT = 32;
const LABEL_WIDTH = 200;

const sourceTypeColor: Record<string, string> = {
  speech: "bg-blue-500/80",
  music: "bg-green-500/80",
  sfx: "bg-orange-500/80",
};

const sourceTypeBorder: Record<string, string> = {
  speech: "border-blue-400",
  music: "border-green-400",
  sfx: "border-orange-400",
};

const sourceTypeIcon: Record<string, React.ReactNode> = {
  speech: <Mic2 className="w-3 h-3" />,
  music: <Music className="w-3 h-3" />,
  sfx: <Sparkles className="w-3 h-3" />,
};

function formatTimeRuler(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatDurationMs(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export function Timeline({ episodeId }: TimelineProps) {
  const {
    project,
    selectedTrackId,
    selectedSegmentId,
    zoom,
    scrollPosition,
    isLoading,
    loadProject,
    toggleMute,
    toggleSolo,
    setTrackVolume,
    removeTrack,
    moveSegment,
    removeSegment,
    setZoom,
    setScrollPosition,
    selectTrack,
    selectSegment,
  } = useTimelineStore();

  const { currentTime } = useAudioStore();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{
    trackId: string;
    segmentId: string;
    offsetMs: number;
  } | null>(null);

  useEffect(() => {
    loadProject(episodeId);
  }, [episodeId, loadProject]);

  const durationMs = project?.duration_ms || 300000; // default 5 min
  const totalWidthPx = (durationMs / 1000) * zoom;

  const msToPixels = useCallback(
    (ms: number) => (ms / 1000) * zoom,
    [zoom]
  );

  const pixelsToMs = useCallback(
    (px: number) => (px / zoom) * 1000,
    [zoom]
  );

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollPosition(e.currentTarget.scrollLeft);
  };

  const handleZoomIn = () => setZoom(Math.min(zoom * 1.5, 500));
  const handleZoomOut = () => setZoom(Math.max(zoom / 1.5, 5));

  const handleSegmentMouseDown = (
    e: React.MouseEvent,
    track: Track,
    segment: TrackSegment
  ) => {
    e.stopPropagation();
    selectSegment(track.id, segment.id);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clickOffsetPx = e.clientX - rect.left;
    const clickOffsetMs = pixelsToMs(clickOffsetPx);
    setDragging({
      trackId: track.id,
      segmentId: segment.id,
      offsetMs: clickOffsetMs,
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging || !scrollContainerRef.current) return;
      const container = scrollContainerRef.current;
      const timelineArea = container.getBoundingClientRect();
      const relativeX =
        e.clientX - timelineArea.left + container.scrollLeft - LABEL_WIDTH;
      const newStartMs = pixelsToMs(relativeX) - dragging.offsetMs;
      moveSegment(
        dragging.trackId,
        dragging.segmentId,
        Math.max(0, Math.round(newStartMs))
      );
    },
    [dragging, pixelsToMs, moveSegment]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  const handleTrackClick = (trackId: string) => {
    selectTrack(trackId);
  };

  const handleDeleteSegment = (trackId: string, segmentId: string) => {
    removeSegment(trackId, segmentId);
  };

  // Generate ruler tick marks
  const rulerTicks: { ms: number; label: string; major: boolean }[] = [];
  const tickIntervalMs =
    zoom >= 100 ? 1000 : zoom >= 40 ? 5000 : zoom >= 15 ? 10000 : 30000;
  for (let ms = 0; ms <= durationMs; ms += tickIntervalMs) {
    rulerTicks.push({
      ms,
      label: formatTimeRuler(ms),
      major: ms % (tickIntervalMs * 5) === 0 || tickIntervalMs >= 10000,
    });
  }

  // Playhead position
  const playheadPx = msToPixels(currentTime * 1000);

  if (isLoading && !project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tracks = project?.tracks || [];

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--background))]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
            Tracks: {tracks.length}
          </span>
          <span className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDurationMs(durationMs)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-[hsl(var(--muted-foreground))] min-w-[40px] text-center">
            {Math.round(zoom)}px/s
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Timeline Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto relative"
        onScroll={handleScroll}
      >
        {/* Sticky labels column + scrollable timeline */}
        <div
          className="relative"
          style={{
            width: LABEL_WIDTH + totalWidthPx,
            minHeight:
              RULER_HEIGHT + tracks.length * TRACK_HEIGHT + 100,
          }}
        >
          {/* Time Ruler */}
          <div
            className="sticky top-0 z-20 flex border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]"
            style={{ height: RULER_HEIGHT }}
          >
            {/* Label area spacer */}
            <div
              className="flex-shrink-0 border-r border-[hsl(var(--border))] bg-[hsl(var(--card))]"
              style={{ width: LABEL_WIDTH }}
            />
            {/* Ticks */}
            <div className="relative flex-1" style={{ width: totalWidthPx }}>
              {rulerTicks.map((tick) => (
                <div
                  key={tick.ms}
                  className="absolute top-0 h-full flex flex-col items-start"
                  style={{ left: msToPixels(tick.ms) }}
                >
                  <div
                    className={cn(
                      "w-px",
                      tick.major
                        ? "h-full bg-[hsl(var(--border))]"
                        : "h-2/3 bg-[hsl(var(--border))]/50 mt-auto"
                    )}
                  />
                  {tick.major && (
                    <span className="absolute top-1 left-1 text-[10px] text-[hsl(var(--muted-foreground))] font-mono whitespace-nowrap">
                      {tick.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tracks */}
          {tracks.map((track, trackIndex) => (
            <div
              key={track.id}
              className={cn(
                "flex border-b border-[hsl(var(--border))]",
                selectedTrackId === track.id &&
                  "bg-[hsl(var(--muted))]/30"
              )}
              style={{ height: TRACK_HEIGHT }}
              onClick={() => handleTrackClick(track.id)}
            >
              {/* Track Label */}
              <div
                className={cn(
                  "flex-shrink-0 flex items-center gap-2 px-3 border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] sticky left-0 z-10",
                  selectedTrackId === track.id &&
                    "bg-primary-50 dark:bg-primary-950/20"
                )}
                style={{ width: LABEL_WIDTH }}
              >
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span
                    className={cn(
                      "flex items-center justify-center w-5 h-5 rounded text-white text-[10px]",
                      track.type === "speech"
                        ? "bg-blue-500"
                        : track.type === "music"
                        ? "bg-green-500"
                        : "bg-orange-500"
                    )}
                  >
                    {sourceTypeIcon[track.type]}
                  </span>
                  <span className="text-xs font-medium text-[hsl(var(--foreground))] truncate">
                    {track.name}
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMute(track.id);
                    }}
                    className={cn(
                      "p-1 rounded text-[10px] font-bold transition-colors",
                      track.muted
                        ? "bg-red-500/20 text-red-500"
                        : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
                    )}
                    title="Mute"
                  >
                    {track.muted ? (
                      <VolumeX className="w-3 h-3" />
                    ) : (
                      <Volume2 className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSolo(track.id);
                    }}
                    className={cn(
                      "p-1 rounded text-[10px] font-bold transition-colors",
                      track.solo
                        ? "bg-yellow-500/20 text-yellow-600"
                        : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
                    )}
                    title="Solo"
                  >
                    S
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={track.volume}
                    onChange={(e) => {
                      e.stopPropagation();
                      setTrackVolume(track.id, parseFloat(e.target.value));
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-12 h-1 accent-primary-600"
                    title={`Volume: ${Math.round(track.volume * 100)}%`}
                  />
                </div>
              </div>

              {/* Track Timeline Area */}
              <div
                className="relative flex-1"
                style={{ width: totalWidthPx }}
              >
                {/* Grid lines (from ruler) */}
                {rulerTicks
                  .filter((t) => t.major)
                  .map((tick) => (
                    <div
                      key={tick.ms}
                      className="absolute top-0 h-full w-px bg-[hsl(var(--border))]/30"
                      style={{ left: msToPixels(tick.ms) }}
                    />
                  ))}

                {/* Segments */}
                {track.segments.map((segment) => {
                  const left = msToPixels(segment.start_ms);
                  const width = msToPixels(
                    segment.end_ms - segment.start_ms
                  );
                  const isSelected =
                    selectedSegmentId === segment.id &&
                    selectedTrackId === track.id;

                  return (
                    <div
                      key={segment.id}
                      className={cn(
                        "absolute top-1 bottom-1 rounded cursor-pointer border transition-all",
                        sourceTypeColor[segment.source_type],
                        isSelected
                          ? `ring-2 ring-white ${sourceTypeBorder[segment.source_type]} border-2`
                          : "border-transparent hover:brightness-110"
                      )}
                      style={{
                        left,
                        width: Math.max(width, 4),
                      }}
                      onMouseDown={(e) =>
                        handleSegmentMouseDown(e, track, segment)
                      }
                      title={`${segment.source_type} | ${formatDurationMs(segment.end_ms - segment.start_ms)}`}
                    >
                      {/* Segment content */}
                      {width > 40 && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 overflow-hidden h-full">
                          <span className="text-white text-[10px] truncate">
                            {formatDurationMs(
                              segment.end_ms - segment.start_ms
                            )}
                          </span>
                        </div>
                      )}

                      {/* Trim handles for selected segment */}
                      {isSelected && (
                        <>
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white/50 cursor-ew-resize rounded-l" />
                          <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-white/50 cursor-ew-resize rounded-r" />
                          {/* Delete button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSegment(track.id, segment.id);
                            }}
                            className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 z-10"
                            title="Delete segment"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Empty state */}
          {tracks.length === 0 && (
            <div className="flex items-center justify-center py-20 text-center">
              <div>
                <Music className="w-10 h-10 text-[hsl(var(--muted-foreground))] mx-auto mb-3" />
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  No tracks yet. Add music or SFX from the library.
                </p>
              </div>
            </div>
          )}

          {/* Playhead */}
          <div
            className="absolute z-30 pointer-events-none"
            style={{
              left: LABEL_WIDTH + playheadPx,
              top: 0,
              bottom: 0,
              width: 2,
            }}
          >
            <div className="w-full h-full bg-red-500" />
            <div className="absolute -top-0 -left-1 w-2.5 h-3 bg-red-500 rounded-b" />
          </div>
        </div>
      </div>
    </div>
  );
}
