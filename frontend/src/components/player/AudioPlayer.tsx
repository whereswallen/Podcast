"use client";

import { useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Radio,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAudioStore } from "@/stores/audio";
import { formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AudioPlayerProps {
  episodeId: string;
}

export function AudioPlayer({ episodeId }: AudioPlayerProps) {
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    audioUrl,
    renderStatus,
    renderProgress,
    renderError,
    play,
    pause,
    togglePlay,
    setCurrentTime,
    setDuration,
    setVolume,
    startRender,
  } = useAudioStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<unknown>(null);

  // Initialize WaveSurfer when audio is available
  useEffect(() => {
    if (!audioUrl || !waveformRef.current) return;

    let ws: { destroy: () => void } | null = null;

    const initWavesurfer = async () => {
      try {
        const WaveSurfer = (await import("wavesurfer.js")).default;
        ws = WaveSurfer.create({
          container: waveformRef.current!,
          waveColor: "#60a5fa",
          progressColor: "#2563eb",
          cursorColor: "#2563eb",
          barWidth: 2,
          barGap: 1,
          barRadius: 2,
          height: 40,
          normalize: true,
          url: audioUrl,
        });
        wavesurferRef.current = ws;
      } catch {
        // WaveSurfer not available, fall back to simple player
      }
    };

    initWavesurfer();

    return () => {
      if (ws) ws.destroy();
    };
  }, [audioUrl]);

  // Sync audio element
  useEffect(() => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
    audio.addEventListener("ended", () => pause());

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [audioUrl, setDuration, setCurrentTime, pause]);

  // Play/pause sync
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.play().catch(() => pause());
    } else {
      audio.pause();
    }
  }, [isPlaying, pause]);

  // Volume sync
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const bar = progressRef.current;
      if (!bar || !audioRef.current) return;
      const rect = bar.getBoundingClientRect();
      const fraction = (e.clientX - rect.left) / rect.width;
      const newTime = fraction * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    },
    [duration, setCurrentTime]
  );

  const handleRender = () => {
    startRender(episodeId);
  };

  const statusIcon = {
    idle: <Radio className="w-4 h-4" />,
    queued: <Loader2 className="w-4 h-4 animate-spin" />,
    rendering: <Loader2 className="w-4 h-4 animate-spin" />,
    completed: <CheckCircle className="w-4 h-4 text-green-500" />,
    failed: <AlertCircle className="w-4 h-4 text-red-500" />,
  };

  const statusLabel = {
    idle: "Not rendered",
    queued: "Queued...",
    rendering: `Rendering ${renderProgress}%`,
    completed: "Ready",
    failed: "Failed",
  };

  return (
    <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3">
      <div className="flex items-center gap-4">
        {/* Render Button */}
        <Button
          variant={renderStatus === "completed" ? "outline" : "primary"}
          size="sm"
          onClick={handleRender}
          disabled={renderStatus === "rendering" || renderStatus === "queued"}
        >
          {statusIcon[renderStatus]}
          <span className="text-xs">{statusLabel[renderStatus]}</span>
        </Button>

        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          disabled={!audioUrl}
          className={cn(
            "w-9 h-9 flex items-center justify-center rounded-full transition-colors",
            audioUrl
              ? "bg-primary-600 text-white hover:bg-primary-700"
              : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed"
          )}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </button>

        {/* Time */}
        <span className="text-xs text-[hsl(var(--muted-foreground))] font-mono min-w-[40px]">
          {formatDuration(currentTime)}
        </span>

        {/* Progress / Waveform */}
        <div className="flex-1">
          {audioUrl ? (
            <div ref={waveformRef} className="w-full">
              {/* Fallback progress bar if wavesurfer fails */}
              <div
                ref={progressRef}
                className="h-2 bg-[hsl(var(--muted))] rounded-full cursor-pointer"
                onClick={handleProgressClick}
              >
                <div
                  className="h-full bg-primary-600 rounded-full transition-all"
                  style={{
                    width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="h-2 bg-[hsl(var(--muted))] rounded-full">
              {renderStatus === "rendering" && (
                <div
                  className="h-full bg-accent-500 rounded-full transition-all"
                  style={{ width: `${renderProgress}%` }}
                />
              )}
            </div>
          )}
        </div>

        {/* Duration */}
        <span className="text-xs text-[hsl(var(--muted-foreground))] font-mono min-w-[40px]">
          {formatDuration(duration)}
        </span>

        {/* Volume */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
            className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            {volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 h-1 accent-primary-600"
          />
        </div>

        {/* Error tooltip */}
        {renderError && (
          <span className="text-xs text-red-500 max-w-[200px] truncate" title={renderError}>
            {renderError}
          </span>
        )}
      </div>
    </div>
  );
}
