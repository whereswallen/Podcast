"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Podcast, Calendar, FileText } from "lucide-react";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Podcast as PodcastType, CreatePodcastRequest } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const categoryOptions = [
  { value: "technology", label: "Technology" },
  { value: "business", label: "Business" },
  { value: "science", label: "Science" },
  { value: "education", label: "Education" },
  { value: "health", label: "Health" },
  { value: "entertainment", label: "Entertainment" },
  { value: "news", label: "News" },
  { value: "sports", label: "Sports" },
  { value: "other", label: "Other" },
];

const languageOptions = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
];

export default function DashboardPage() {
  const [podcasts, setPodcasts] = useState<PodcastType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newPodcast, setNewPodcast] = useState<CreatePodcastRequest>({
    title: "",
    description: "",
    category: "technology",
    language: "en",
  });

  const fetchPodcasts = useCallback(async () => {
    try {
      const response = await api.get<PodcastType[]>("/api/podcasts");
      setPodcasts(Array.isArray(response.data) ? response.data : response.data);
    } catch {
      // Handle error silently for now
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPodcasts();
  }, [fetchPodcasts]);

  const handleCreatePodcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await api.post("/api/podcasts", newPodcast);
      setDialogOpen(false);
      setNewPodcast({ title: "", description: "", category: "technology", language: "en" });
      fetchPodcasts();
    } catch {
      // Handle error
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      <Header
        title="Your Podcasts"
        description="Manage and create AI-powered podcasts"
      >
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button>
              <Plus className="w-4 h-4" />
              New Podcast
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Podcast</DialogTitle>
              <DialogDescription>
                Set up a new podcast project. You can add episodes later.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePodcast} className="space-y-4">
              <Input
                label="Title"
                placeholder="My Awesome Podcast"
                value={newPodcast.title}
                onChange={(e) =>
                  setNewPodcast({ ...newPodcast, title: e.target.value })
                }
                required
              />
              <Textarea
                label="Description"
                placeholder="What is your podcast about?"
                value={newPodcast.description}
                onChange={(e) =>
                  setNewPodcast({ ...newPodcast, description: e.target.value })
                }
                rows={3}
              />
              <Select
                label="Category"
                options={categoryOptions}
                value={newPodcast.category}
                onChange={(value) =>
                  setNewPodcast({ ...newPodcast, category: value })
                }
              />
              <Select
                label="Language"
                options={languageOptions}
                value={newPodcast.language}
                onChange={(value) =>
                  setNewPodcast({ ...newPodcast, language: value })
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
                  Create Podcast
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </Header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-[hsl(var(--muted))] rounded w-3/4 mb-3" />
                <div className="h-4 bg-[hsl(var(--muted))] rounded w-full mb-2" />
                <div className="h-4 bg-[hsl(var(--muted))] rounded w-2/3 mb-4" />
                <div className="h-3 bg-[hsl(var(--muted))] rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : podcasts.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center">
            <Podcast className="w-10 h-10 text-[hsl(var(--muted-foreground))]" />
          </div>
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">
            No podcasts yet
          </h3>
          <p className="text-[hsl(var(--muted-foreground))] mb-6 max-w-sm mx-auto">
            Create your first podcast to get started with AI-powered audio
            production.
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Create Your First Podcast
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {podcasts.map((podcast) => (
            <Link key={podcast.id} href={`/dashboard/${podcast.id}`}>
              <Card className="hover:border-primary-300 dark:hover:border-primary-700 transition-all hover:shadow-md cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] line-clamp-1">
                      {podcast.title}
                    </h3>
                    <Badge variant="secondary">{podcast.category}</Badge>
                  </div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-2 mb-4">
                    {podcast.description || "No description"}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {podcast.episode_count} episodes
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(podcast.created_at)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
