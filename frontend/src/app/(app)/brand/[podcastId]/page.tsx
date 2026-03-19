"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Palette,
  Play,
  BookOpen,
  Loader2,
} from "lucide-react";
import api from "@/lib/api";
import { useBrandStore } from "@/stores/brand";
import { useKnowledgeStore } from "@/stores/knowledge";
import { BrandEditor } from "@/components/brand/BrandEditor";
import { IntroOutroEditor } from "@/components/brand/IntroOutroEditor";
import { KnowledgeList } from "@/components/brand/KnowledgeList";
import { cn } from "@/lib/utils";
import type { Podcast } from "@/types";

const tabs = [
  { id: "identity", label: "Identity", icon: Palette },
  { id: "intro-outro", label: "Intro / Outro", icon: Play },
  { id: "knowledge", label: "Knowledge Base", icon: BookOpen },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function BrandPage() {
  const params = useParams();
  const podcastId = params.podcastId as string;
  const [activeTab, setActiveTab] = useState<TabId>("identity");
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { loadBrand, loadTemplates } = useBrandStore();
  const { loadEntries } = useKnowledgeStore();

  const fetchAll = useCallback(async () => {
    try {
      const [podcastRes] = await Promise.all([
        api.get<Podcast>(`/api/podcasts/${podcastId}`),
        loadBrand(podcastId),
        loadTemplates(podcastId),
        loadEntries(podcastId),
      ]);
      setPodcast(podcastRes.data);
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  }, [podcastId, loadBrand, loadTemplates, loadEntries]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--muted-foreground))]" />
      </div>
    );
  }

  return (
    <div>
      {/* Back link */}
      <Link
        href={`/dashboard/${podcastId}`}
        className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {podcast?.title || "Podcast"}
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-1">
          Brand & Knowledge
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Configure your podcast&apos;s brand identity, intro/outro templates,
          and knowledge base
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-[hsl(var(--border))] mb-6">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="max-w-4xl">
        {activeTab === "identity" && (
          <BrandEditor
            podcastId={podcastId}
            podcastTitle={podcast?.title || ""}
            podcastDescription={podcast?.description}
            podcastCategory={podcast?.category}
          />
        )}
        {activeTab === "intro-outro" && (
          <IntroOutroEditor podcastId={podcastId} />
        )}
        {activeTab === "knowledge" && (
          <KnowledgeList podcastId={podcastId} />
        )}
      </div>
    </div>
  );
}
