"use client";

import { useEffect } from "react";
import {
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Mic2,
  FileAudio,
} from "lucide-react";
import { useVoiceCloneStore } from "@/stores/voiceClone";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { VoiceCloneJob } from "@/types";

const STATUS_CONFIG: Record<
  string,
  {
    icon: typeof CheckCircle2;
    variant: "default" | "secondary" | "warning" | "success" | "destructive";
    label: string;
  }
> = {
  pending: { icon: Clock, variant: "default", label: "Pending" },
  uploading: { icon: FileAudio, variant: "secondary", label: "Uploading" },
  processing: { icon: Loader2, variant: "warning", label: "Processing" },
  training: { icon: Loader2, variant: "warning", label: "Training" },
  ready: { icon: CheckCircle2, variant: "success", label: "Ready" },
  failed: { icon: AlertCircle, variant: "destructive", label: "Failed" },
};

export function VoiceCloneList() {
  const { jobs, isLoading, loadJobs, deleteJob } = useVoiceCloneStore();

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--muted-foreground))]" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
        Voice Clone Jobs
      </h3>
      {jobs.map((job) => {
        const config = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
        const StatusIcon = config.icon;

        return (
          <Card key={job.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                    <Mic2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                        {job.name}
                      </span>
                      <Badge variant={config.variant}>
                        <StatusIcon
                          className={`w-3 h-3 mr-1 ${
                            job.status === "training" || job.status === "processing"
                              ? "animate-spin"
                              : ""
                          }`}
                        />
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {job.sample_urls.length} sample{job.sample_urls.length !== 1 ? "s" : ""}{" "}
                      &middot; {Math.round(job.total_duration_seconds)}s total
                      {job.progress > 0 && job.progress < 100 && (
                        <span> &middot; {job.progress}%</span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteJob(job.id)}
                  className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[hsl(var(--muted-foreground))] hover:text-red-600 transition-colors"
                  title="Delete clone job"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Progress bar */}
              {job.status === "training" && (
                <div className="mt-3">
                  <div className="w-full bg-[hsl(var(--muted))] rounded-full h-1.5">
                    <div
                      className="bg-primary-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {job.error_message && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                  {job.error_message}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
