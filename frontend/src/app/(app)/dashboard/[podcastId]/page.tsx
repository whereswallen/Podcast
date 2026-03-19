"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  ArrowLeft,
  Clock,
  Calendar,
  Pencil,
} from "lucide-react";
import api from "@/lib/api";
import { formatDate, formatDuration } from "@/lib/utils";
import type {
  Podcast,
  Episode,
  CreateEpisodeRequest,
  EpisodeFormat,
  EpisodeStatus,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const formatOptions = [
  { value: "solo", label: "Solo" },
  { value: "conversation", label: "Conversation" },
  { value: "interview", label: "Interview" },
  { value: "panel", label: "Panel Discussion" },
  { value: "narrative", label: "Narrative" },
];

const statusBadgeVariant: Record<EpisodeStatus, "default" | "secondary" | "warning" | "success" | "destructive"> = {
  draft: "default",
  scripted: "secondary",
  rendering: "warning",
  rendered: "success",
  published: "success",
};

export default function PodcastDetailPage() {
  const params = useParams();
  const podcastId = params.podcastId as string;
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newEpisode, setNewEpisode] = useState<CreateEpisodeRequest>({
    title: "",
    format: "conversation",
    target_duration: 600,
  });

  const fetchData = useCallback(async () => {
    try {
      const [podcastRes, episodesRes] = await Promise.all([
        api.get<Podcast>(`/api/podcasts/${podcastId}`),
        api.get<Episode[]>(`/api/podcasts/${podcastId}/episodes`),
      ]);
      setPodcast(podcastRes.data);
      setEpisodes(
        Array.isArray(episodesRes.data) ? episodesRes.data : []
      );
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  }, [podcastId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await api.post(`/api/podcasts/${podcastId}/episodes`, newEpisode);
      setDialogOpen(false);
      setNewEpisode({ title: "", format: "conversation", target_duration: 600 });
      fetchData();
    } catch {
      // Handle error
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-[hsl(var(--muted))] rounded w-1/3" />
        <div className="h-4 bg-[hsl(var(--muted))] rounded w-2/3" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-[hsl(var(--muted))] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Podcasts
      </Link>

      {/* Podcast Header */}
      <Header
        title={podcast?.title || "Podcast"}
        description={podcast?.description || ""}
      >
        <Button variant="outline" size="sm">
          <Pencil className="w-4 h-4" />
          Edit
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button>
              <Plus className="w-4 h-4" />
              New Episode
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Episode</DialogTitle>
              <DialogDescription>
                Set up a new episode. You can write or generate a script next.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateEpisode} className="space-y-4">
              <Input
                label="Episode Title"
                placeholder="Episode 1: Introduction"
                value={newEpisode.title}
                onChange={(e) =>
                  setNewEpisode({ ...newEpisode, title: e.target.value })
                }
                required
              />
              <Select
                label="Format"
                options={formatOptions}
                value={newEpisode.format}
                onChange={(value) =>
                  setNewEpisode({
                    ...newEpisode,
                    format: value as EpisodeFormat,
                  })
                }
              />
              <Input
                label="Target Duration (minutes)"
                type="number"
                min={1}
                max={180}
                value={Math.round(newEpisode.target_duration / 60)}
                onChange={(e) =>
                  setNewEpisode({
                    ...newEpisode,
                    target_duration: parseInt(e.target.value) * 60,
                  })
                }
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isCreating}>
                  Create Episode
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </Header>

      {/* Episodes Table */}
      {episodes.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center">
              <Plus className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No episodes yet</h3>
            <p className="text-[hsl(var(--muted-foreground))] mb-4">
              Create your first episode to start writing scripts.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              Create Episode
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[hsl(var(--border))]">
                  <th className="text-left text-sm font-medium text-[hsl(var(--muted-foreground))] px-6 py-3">
                    Title
                  </th>
                  <th className="text-left text-sm font-medium text-[hsl(var(--muted-foreground))] px-6 py-3">
                    Status
                  </th>
                  <th className="text-left text-sm font-medium text-[hsl(var(--muted-foreground))] px-6 py-3">
                    Format
                  </th>
                  <th className="text-left text-sm font-medium text-[hsl(var(--muted-foreground))] px-6 py-3">
                    Duration
                  </th>
                  <th className="text-left text-sm font-medium text-[hsl(var(--muted-foreground))] px-6 py-3">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {episodes.map((episode) => (
                  <tr
                    key={episode.id}
                    className="border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted))] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/editor/${episode.id}`}
                        className="text-sm font-medium text-[hsl(var(--foreground))] hover:text-primary-600 transition-colors"
                      >
                        {episode.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={statusBadgeVariant[episode.status]}>
                        {episode.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[hsl(var(--muted-foreground))] capitalize">
                        {episode.format}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[hsl(var(--muted-foreground))] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDuration(
                          episode.actual_duration || episode.target_duration
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[hsl(var(--muted-foreground))] flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(episode.created_at)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
