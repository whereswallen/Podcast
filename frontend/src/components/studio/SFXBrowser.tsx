"use client";

import { useEffect, useState, useMemo } from "react";
import { Sparkles, Search, Plus, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTimelineStore } from "@/stores/timeline";
import { Button } from "@/components/ui/button";
import type { SFXItem } from "@/types";

const SFX_CATEGORIES = [
  "all",
  "transitions",
  "stingers",
  "ambient",
  "notifications",
  "audience",
];

interface SFXBrowserProps {
  episodeId: string;
}

function formatMs(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const min = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export function SFXBrowser({ episodeId }: SFXBrowserProps) {
  const { sfxLibrary, loadSFXLibrary, addSFX } = useTimelineStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [positionInputId, setPositionInputId] = useState<string | null>(null);
  const [positionMs, setPositionMs] = useState(0);

  useEffect(() => {
    loadSFXLibrary();
  }, [loadSFXLibrary]);

  const filteredSfx = useMemo(() => {
    return sfxLibrary.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" ||
        item.category.toLowerCase() === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [sfxLibrary, searchQuery, selectedCategory]);

  const handleAdd = async (item: SFXItem) => {
    if (positionInputId === item.id) {
      setAddingId(item.id);
      try {
        await addSFX(episodeId, item.id, positionMs);
      } finally {
        setAddingId(null);
        setPositionInputId(null);
        setPositionMs(0);
      }
    } else {
      setPositionInputId(item.id);
      setPositionMs(0);
    }
  };

  const handleQuickAdd = async (item: SFXItem) => {
    setAddingId(item.id);
    try {
      await addSFX(episodeId, item.id, 0);
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
          placeholder="Search SFX..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-1 mb-3">
        {SFX_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "px-2 py-0.5 text-[10px] rounded-full font-medium capitalize transition-colors",
              selectedCategory === cat
                ? "bg-orange-500 text-white"
                : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/80"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* SFX List */}
      <div className="flex-1 overflow-y-auto space-y-1.5">
        {filteredSfx.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Sparkles className="w-6 h-6 text-[hsl(var(--muted-foreground))] mb-2" />
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {sfxLibrary.length === 0
                ? "No sound effects available"
                : "No matches found"}
            </p>
          </div>
        ) : (
          filteredSfx.map((item) => (
            <div
              key={item.id}
              className="p-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-orange-300 dark:hover:border-orange-700 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[hsl(var(--foreground))] truncate">
                    {item.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-1.5 py-0.5 text-[9px] font-medium rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 capitalize">
                      {item.category}
                    </span>
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))] flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {formatMs(item.duration_ms)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdd(item)}
                  disabled={addingId === item.id}
                  className="flex-shrink-0 text-[10px] h-6 px-2"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </Button>
              </div>

              {/* Position input (shown when user clicks Add with position) */}
              {positionInputId === item.id && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[hsl(var(--border))]">
                  <label className="text-[10px] text-[hsl(var(--muted-foreground))]">
                    Position (ms):
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={positionMs}
                    onChange={(e) =>
                      setPositionMs(parseInt(e.target.value) || 0)
                    }
                    className="flex-1 px-2 py-0.5 text-[10px] rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAdd(item)}
                    disabled={addingId === item.id}
                    className="text-[10px] h-5 px-2"
                  >
                    Confirm
                  </Button>
                  <button
                    onClick={() => setPositionInputId(null)}
                    className="text-[10px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
