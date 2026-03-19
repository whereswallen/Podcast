"use client";

import { useState, useEffect } from "react";
import { Search, Podcast, FileText } from "lucide-react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SkeletonTable } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface AdminPodcast {
  id: string;
  title: string;
  description?: string;
  category?: string;
  user_email: string;
  user_name: string;
  episode_count: number;
  is_active: boolean;
  created_at: string;
}

interface AdminEpisode {
  id: string;
  title: string;
  podcast_title: string;
  user_email: string;
  status: string;
  format: string;
  created_at: string;
}

type Tab = "podcasts" | "episodes";

export default function AdminContentPage() {
  const [tab, setTab] = useState<Tab>("podcasts");
  const [podcasts, setPodcasts] = useState<AdminPodcast[]>([]);
  const [episodes, setEpisodes] = useState<AdminEpisode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setIsLoading(true);
    const endpoint = tab === "podcasts"
      ? `/api/admin/content/podcasts${search ? `?search=${search}` : ""}`
      : `/api/admin/content/episodes${search ? `?search=${search}` : ""}`;

    api.get(endpoint)
      .then((res) => {
        if (tab === "podcasts") setPodcasts(res.data);
        else setEpisodes(res.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [tab, search]);

  const statusVariant: Record<string, "default" | "secondary" | "warning" | "success"> = {
    draft: "default",
    script: "secondary",
    recording: "warning",
    editing: "warning",
    rendered: "success",
    published: "success",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">
          Content Management
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          View and manage all podcasts and episodes
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 mb-6 border-b border-[hsl(var(--border))]">
        {[
          { id: "podcasts" as const, label: "Podcasts", icon: Podcast },
          { id: "episodes" as const, label: "Episodes", icon: FileText },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors",
              tab === t.id
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${tab}...`}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable />
      ) : tab === "podcasts" ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[hsl(var(--border))]">
                  <th className="text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider px-6 py-3">Title</th>
                  <th className="text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider px-6 py-3">Owner</th>
                  <th className="text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider px-6 py-3">Category</th>
                  <th className="text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider px-6 py-3">Episodes</th>
                  <th className="text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {podcasts.map((p) => (
                  <tr key={p.id} className="border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted))]">
                    <td className="px-6 py-4 text-sm font-medium text-[hsl(var(--foreground))]">{p.title}</td>
                    <td className="px-6 py-4 text-sm text-[hsl(var(--muted-foreground))]">{p.user_name} ({p.user_email})</td>
                    <td className="px-6 py-4"><Badge variant="secondary">{p.category || "—"}</Badge></td>
                    <td className="px-6 py-4 text-sm text-[hsl(var(--foreground))]">{p.episode_count}</td>
                    <td className="px-6 py-4">
                      <Badge variant={p.is_active ? "success" : "destructive"}>
                        {p.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {podcasts.length === 0 && (
            <div className="py-12 text-center text-sm text-[hsl(var(--muted-foreground))]">No podcasts found.</div>
          )}
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[hsl(var(--border))]">
                  <th className="text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider px-6 py-3">Title</th>
                  <th className="text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider px-6 py-3">Podcast</th>
                  <th className="text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider px-6 py-3">Owner</th>
                  <th className="text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider px-6 py-3">Format</th>
                </tr>
              </thead>
              <tbody>
                {episodes.map((ep) => (
                  <tr key={ep.id} className="border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted))]">
                    <td className="px-6 py-4 text-sm font-medium text-[hsl(var(--foreground))]">{ep.title}</td>
                    <td className="px-6 py-4 text-sm text-[hsl(var(--muted-foreground))]">{ep.podcast_title}</td>
                    <td className="px-6 py-4 text-sm text-[hsl(var(--muted-foreground))]">{ep.user_email}</td>
                    <td className="px-6 py-4"><Badge variant={statusVariant[ep.status] || "default"}>{ep.status}</Badge></td>
                    <td className="px-6 py-4 text-sm text-[hsl(var(--muted-foreground))] capitalize">{ep.format}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {episodes.length === 0 && (
            <div className="py-12 text-center text-sm text-[hsl(var(--muted-foreground))]">No episodes found.</div>
          )}
        </Card>
      )}
    </div>
  );
}
