"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Download,
  Music,
  Sparkles,
  Settings,
  Volume2,
  Loader2,
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { useTimelineStore } from "@/stores/timeline";
import { useAudioStore } from "@/stores/audio";
import type { Episode } from "@/types";
import { Button } from "@/components/ui/button";
import { Timeline } from "@/components/studio/Timeline";
import { TrackControls } from "@/components/studio/TrackControls";
import { MusicBrowser } from "@/components/studio/MusicBrowser";
import { SFXBrowser } from "@/components/studio/SFXBrowser";

type SidebarTab = "music" | "sfx" | "settings";

export default function StudioPage() {
  const params = useParams();
  const episodeId = params.episodeId as string;

  const {
    project,
    isDirty,
    isLoading: timelineLoading,
    saveProject,
    loadProject,
  } = useTimelineStore();

  const { startRender, renderStatus } = useAudioStore();

  const [episode, setEpisode] = useState<Episode | null>(null);
  const [activeTab, setActiveTab] = useState<SidebarTab>("music");
  const [isSaving, setIsSaving] = useState(false);
  const [masterVolume, setMasterVolume] = useState(1);

  const fetchEpisode = useCallback(async () => {
    try {
      const response = await api.get<Episode>(`/api/episodes/${episodeId}`);
      setEpisode(response.data);
    } catch {
      // ignore
    }
  }, [episodeId]);

  useEffect(() => {
    fetchEpisode();
  }, [fetchEpisode]);

  useEffect(() => {
    if (project) {
      setMasterVolume(project.master_volume);
    }
  }, [project]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveProject(episodeId);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    startRender(episodeId);
  };

  const handleMasterVolumeChange = (value: number) => {
    setMasterVolume(value);
    if (project) {
      // Update in store directly — a bit of a shortcut
      useTimelineStore.setState({
        project: { ...project, master_volume: value },
        isDirty: true,
      });
    }
  };

  const tabs: { id: SidebarTab; label: string; icon: React.ReactNode }[] = [
    { id: "music", label: "Music", icon: <Music className="w-3.5 h-3.5" /> },
    { id: "sfx", label: "SFX", icon: <Sparkles className="w-3.5 h-3.5" /> },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] -m-6 lg:-m-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4 px-4 py-2.5 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={episode ? `/editor/${episodeId}` : "/dashboard"}
            className="p-1.5 rounded hover:bg-[hsl(var(--muted))] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          </Link>
          <div>
            <h1 className="text-sm font-semibold text-[hsl(var(--foreground))]">
              {episode?.title || "Studio"}
            </h1>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
              Audio Production Studio
              {isDirty && (
                <span className="ml-2 text-accent-600 font-medium">
                  Unsaved changes
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSaving && (
            <div className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving...
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
          >
            <Save className="w-4 h-4" />
            Save
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExport}
            disabled={
              renderStatus === "rendering" || renderStatus === "queued"
            }
          >
            <Download className="w-4 h-4" />
            {renderStatus === "rendering"
              ? "Rendering..."
              : renderStatus === "queued"
              ? "Queued..."
              : "Export"}
          </Button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-[250px] flex-shrink-0 border-r border-[hsl(var(--border))] bg-[hsl(var(--background))] flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-[hsl(var(--border))]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium transition-colors",
                  activeTab === tab.id
                    ? "text-primary-600 border-b-2 border-primary-600 bg-primary-50/50 dark:bg-primary-950/20"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden p-3">
            {activeTab === "music" && (
              <MusicBrowser episodeId={episodeId} />
            )}
            {activeTab === "sfx" && (
              <SFXBrowser episodeId={episodeId} />
            )}
            {activeTab === "settings" && (
              <div className="space-y-4">
                {/* Master Volume */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-[hsl(var(--foreground))] mb-2">
                    <Volume2 className="w-3.5 h-3.5" />
                    Master Volume
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={1.5}
                      step={0.01}
                      value={masterVolume}
                      onChange={(e) =>
                        handleMasterVolumeChange(
                          parseFloat(e.target.value)
                        )
                      }
                      className="flex-1 h-1.5 accent-primary-600"
                    />
                    <span className="text-xs font-mono text-[hsl(var(--muted-foreground))] min-w-[36px] text-right">
                      {Math.round(masterVolume * 100)}%
                    </span>
                  </div>
                </div>

                {/* Sample Rate */}
                <div>
                  <label className="text-xs font-medium text-[hsl(var(--foreground))] block mb-1">
                    Sample Rate
                  </label>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    44,100 Hz
                  </p>
                </div>

                {/* Bit Depth */}
                <div>
                  <label className="text-xs font-medium text-[hsl(var(--foreground))] block mb-1">
                    Bit Depth
                  </label>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    16-bit
                  </p>
                </div>

                {/* Project Info */}
                <div className="border-t border-[hsl(var(--border))] pt-3">
                  <label className="text-xs font-medium text-[hsl(var(--foreground))] block mb-2">
                    Project Info
                  </label>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[hsl(var(--muted-foreground))]">
                        Tracks
                      </span>
                      <span className="text-[hsl(var(--foreground))] font-medium">
                        {project?.tracks.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[hsl(var(--muted-foreground))]">
                        Duration
                      </span>
                      <span className="text-[hsl(var(--foreground))] font-medium">
                        {project
                          ? `${Math.round(project.duration_ms / 1000)}s`
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[hsl(var(--muted-foreground))]">
                        Format
                      </span>
                      <span className="text-[hsl(var(--foreground))] font-medium">
                        {episode?.format || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <Timeline episodeId={episodeId} />
          </div>

          {/* Bottom: Track Controls */}
          <TrackControls />
        </div>
      </div>
    </div>
  );
}
