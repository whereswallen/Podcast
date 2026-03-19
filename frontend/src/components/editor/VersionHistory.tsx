"use client";

import { useState, useEffect } from "react";
import {
  X,
  History,
  RotateCcw,
  Loader2,
  ChevronRight,
  FileText,
} from "lucide-react";
import { cn, formatRelativeDate } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor";
import { Button } from "@/components/ui/button";
import type { ScriptBlock, ScriptRevision } from "@/types";

interface VersionHistoryProps {
  episodeId: string;
  isOpen: boolean;
  onClose: () => void;
  currentBlocks: ScriptBlock[];
}

export function VersionHistory({
  episodeId,
  isOpen,
  onClose,
  currentBlocks,
}: VersionHistoryProps) {
  const { revisions, loadRevisions, restoreRevision } = useEditorStore();
  const [selectedRevision, setSelectedRevision] = useState<ScriptRevision | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isLoadingRevisions, setIsLoadingRevisions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingRevisions(true);
      loadRevisions(episodeId).finally(() => setIsLoadingRevisions(false));
      setSelectedRevision(null);
    }
  }, [isOpen, episodeId, loadRevisions]);

  const handleRestore = async (version: number) => {
    setIsRestoring(true);
    try {
      await restoreRevision(episodeId, version);
      onClose();
    } catch {
      // Error handled in store
    } finally {
      setIsRestoring(false);
    }
  };

  // Simple diff: compare blocks by order. Identify added, removed, and changed blocks.
  const getDiff = (revisionBlocks: ScriptBlock[]) => {
    const maxLen = Math.max(currentBlocks.length, revisionBlocks.length);
    const diffItems: Array<{
      type: "unchanged" | "added" | "removed" | "changed";
      current?: ScriptBlock;
      revision?: ScriptBlock;
    }> = [];

    for (let i = 0; i < maxLen; i++) {
      const current = currentBlocks[i];
      const revision = revisionBlocks[i];

      if (!current && revision) {
        diffItems.push({ type: "removed", revision });
      } else if (current && !revision) {
        diffItems.push({ type: "added", current });
      } else if (current && revision) {
        if (current.text === revision.text && current.speaker === revision.speaker) {
          diffItems.push({ type: "unchanged", current, revision });
        } else {
          diffItems.push({ type: "changed", current, revision });
        }
      }
    }

    return diffItems;
  };

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-[480px] max-w-full bg-[hsl(var(--card))] border-l border-[hsl(var(--border))] shadow-2xl transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-secondary-500" />
            <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">
              Version History
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Revision List */}
          <div className="w-48 border-r border-[hsl(var(--border))] overflow-y-auto flex-shrink-0">
            {isLoadingRevisions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-[hsl(var(--muted-foreground))]" />
              </div>
            ) : revisions.length === 0 ? (
              <div className="p-4 text-center">
                <FileText className="w-8 h-8 text-[hsl(var(--muted-foreground))] mx-auto mb-2" />
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  No revisions yet. Save your script to create the first version.
                </p>
              </div>
            ) : (
              <div className="py-1">
                {revisions.map((revision) => (
                  <button
                    key={revision.id}
                    onClick={() => setSelectedRevision(revision)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 border-b border-[hsl(var(--border))]/50 hover:bg-[hsl(var(--muted))] transition-colors",
                      selectedRevision?.id === revision.id && "bg-[hsl(var(--muted))]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[hsl(var(--foreground))]">
                        v{revision.version}
                      </span>
                      <ChevronRight className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
                    </div>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">
                      {formatTimestamp(revision.created_at)}
                    </p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                      {revision.content.length} blocks
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Diff View */}
          <div className="flex-1 overflow-y-auto">
            {selectedRevision ? (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                      Version {selectedRevision.version}
                    </h3>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                      {formatRelativeDate(selectedRevision.created_at)} &middot;{" "}
                      {formatTimestamp(selectedRevision.created_at)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(selectedRevision.version)}
                    disabled={isRestoring}
                  >
                    {isRestoring ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                    Restore
                  </Button>
                </div>

                {/* Diff blocks */}
                <div className="space-y-2">
                  {getDiff(selectedRevision.content).map((item, index) => (
                    <div
                      key={index}
                      className={cn(
                        "rounded-md border px-3 py-2 text-xs",
                        item.type === "unchanged" &&
                          "border-[hsl(var(--border))] bg-[hsl(var(--background))]",
                        item.type === "added" &&
                          "border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/30",
                        item.type === "removed" &&
                          "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30",
                        item.type === "changed" &&
                          "border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            "text-[10px] font-medium uppercase tracking-wide",
                            item.type === "unchanged" && "text-[hsl(var(--muted-foreground))]",
                            item.type === "added" && "text-green-600 dark:text-green-400",
                            item.type === "removed" && "text-red-600 dark:text-red-400",
                            item.type === "changed" && "text-amber-600 dark:text-amber-400"
                          )}
                        >
                          {item.type === "unchanged" ? "" : item.type}
                        </span>
                        <span className="text-[10px] font-medium text-[hsl(var(--muted-foreground))]">
                          {(item.revision || item.current)?.speaker}
                        </span>
                      </div>
                      {item.type === "changed" && item.revision && (
                        <div className="mb-1.5 pb-1.5 border-b border-amber-200 dark:border-amber-800/50">
                          <p className="text-red-700 dark:text-red-400 line-through leading-relaxed">
                            {item.revision.text}
                          </p>
                        </div>
                      )}
                      {item.type === "changed" && item.current && (
                        <p className="text-green-700 dark:text-green-400 leading-relaxed">
                          {item.current.text}
                        </p>
                      )}
                      {item.type === "removed" && item.revision && (
                        <p className="text-red-700 dark:text-red-400 leading-relaxed">
                          {item.revision.text}
                        </p>
                      )}
                      {item.type === "added" && item.current && (
                        <p className="text-green-700 dark:text-green-400 leading-relaxed">
                          {item.current.text}
                        </p>
                      )}
                      {item.type === "unchanged" && (
                        <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
                          {(item.revision || item.current)?.text}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-center p-4">
                <div>
                  <History className="w-8 h-8 text-[hsl(var(--muted-foreground))] mx-auto mb-2" />
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Select a revision to view changes
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
