"use client";

import { useEffect, useState, useMemo } from "react";
import { Music, Search, Plus, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTimelineStore } from "@/stores/timeline";
import { Button } from "@/components/ui/button";
import type { MusicItem } from "@/types";

const MUSIC_CATEGORIES = [
  "all",
  "ambient",
  "upbeat",
  "cinematic",
  "lo-fi",
  "electronic",
  "acoustic",
  "jazz",
];

const moodColors: Record<string, string> = {
  calm: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  energetic: "bg-red-500/10 text-red-600 dark:text-red-400",
  happy: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  dark: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  inspiring: "bg-green-500/10 text-green-600 dark:text-green-400",
  mysterious: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
};

interface MusicBrowserProps {
  episodeId: string;
}

function formatSeconds(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export function MusicBrowser({ episodeId }: MusicBrowserProps) {
  const { musicLibrary, loadMusicLibrary, addMusicTrack } =
    useTimelineStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    loadMusicLibrary();
  }, [loadMusicLibrary]);

  const filteredMusic = useMemo(() => {
    return musicLibrary.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.mood.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" ||
        item.category.toLowerCase() === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [musicLibrary, searchQuery, selectedCategory]);

  const handleAdd = async (item: MusicItem) => {
    setAddingId(item.id);
    try {
      await addMusicTrack(episodeId, item.id, 0);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
        <input
          type="text"
          placeholder="Search music..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-1 mb-3">
        {MUSIC_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "px-2 py-0.5 text-[10px] rounded-full font-medium capitalize transition-colors",
              selectedCategory === cat
                ? "bg-primary-600 text-white"
                : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/80"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Music List */}
      <div className="flex-1 overflow-y-auto space-y-1.5">
        {filteredMusic.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Music className="w-6 h-6 text-[hsl(var(--muted-foreground))] mb-2" />
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {musicLibrary.length === 0
                ? "No music available"
                : "No matches found"}
            </p>
          </div>
        ) : (
          filteredMusic.map((item) => (
            <div
              key={item.id}
              className="p-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[hsl(var(--foreground))] truncate">
                    {item.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="px-1.5 py-0.5 text-[9px] font-medium rounded-full bg-green-500/10 text-green-600 dark:text-green-400 capitalize">
                      {item.category}
                    </span>
                    <span
                      className={cn(
                        "px-1.5 py-0.5 text-[9px] font-medium rounded-full capitalize",
                        moodColors[item.mood.toLowerCase()] ||
                          "bg-gray-500/10 text-gray-600 dark:text-gray-400"
                      )}
                    >
                      {item.mood}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))] flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {formatSeconds(item.duration)}
                    </span>
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                      {item.bpm} BPM
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAdd(item)}
                  disabled={addingId === item.id}
                  className="flex-shrink-0 text-[10px] h-6 px-2"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
