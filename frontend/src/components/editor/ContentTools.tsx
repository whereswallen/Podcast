"use client";

import { useState } from "react";
import {
  FileText,
  Search,
  Share2,
  AlertTriangle,
  Lightbulb,
  Languages,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  ShowNotes,
  Transcript,
  SEOMetadata,
  FactCheckItem,
  ContentSuggestion,
} from "@/types";

interface ContentToolsProps {
  episodeId: string;
  podcastId?: string;
}

type ToolSection = "show-notes" | "transcript" | "seo" | "fact-check" | "suggestions" | "translate" | null;

const LANGUAGES = [
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "pt", name: "Portuguese" },
  { code: "ja", name: "Japanese" },
  { code: "zh", name: "Chinese" },
  { code: "ko", name: "Korean" },
  { code: "it", name: "Italian" },
  { code: "nl", name: "Dutch" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "ru", name: "Russian" },
];

export function ContentTools({ episodeId, podcastId }: ContentToolsProps) {
  const [activeSection, setActiveSection] = useState<ToolSection>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const [showNotes, setShowNotes] = useState<ShowNotes | null>(null);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [seoData, setSeoData] = useState<SEOMetadata | null>(null);
  const [factChecks, setFactChecks] = useState<FactCheckItem[] | null>(null);
  const [suggestions, setSuggestions] = useState<ContentSuggestion[] | null>(null);

  const toggleSection = (section: ToolSection) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const runTool = async (section: ToolSection) => {
    setIsLoading(true);
    setError(null);
    try {
      switch (section) {
        case "show-notes": {
          const res = await api.post<ShowNotes>(`/api/ai/episodes/${episodeId}/show-notes`);
          setShowNotes(res.data);
          break;
        }
        case "transcript": {
          const res = await api.post<Transcript>(`/api/ai/episodes/${episodeId}/transcript`);
          setTranscript(res.data);
          break;
        }
        case "seo": {
          const res = await api.post<SEOMetadata>(`/api/ai/episodes/${episodeId}/seo`);
          setSeoData(res.data);
          break;
        }
        case "fact-check": {
          const res = await api.post<FactCheckItem[]>(`/api/ai/episodes/${episodeId}/fact-check`);
          setFactChecks(res.data);
          break;
        }
        case "suggestions": {
          if (podcastId) {
            const res = await api.post<ContentSuggestion[]>(`/api/ai/podcasts/${podcastId}/content-suggestions`);
            setSuggestions(res.data);
          }
          break;
        }
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to run tool.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const severityColor: Record<string, string> = {
    high: "text-red-600 bg-red-50 dark:bg-red-900/20",
    medium: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
    low: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
  };

  const tools = [
    { id: "show-notes" as const, label: "Show Notes", icon: FileText, description: "Timestamps, takeaways, quotes" },
    { id: "transcript" as const, label: "Transcript", icon: FileText, description: "Formatted with timestamps" },
    { id: "seo" as const, label: "SEO & Social", icon: Share2, description: "Metadata + social posts" },
    { id: "fact-check" as const, label: "Fact Check", icon: AlertTriangle, description: "Flag claims to verify" },
    { id: "suggestions" as const, label: "Topic Ideas", icon: Lightbulb, description: "Next episode suggestions" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Search className="w-4 h-4 text-accent-500" />
        <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
          Content Tools
        </h3>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-2">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {tools.map((tool) => {
        const isActive = activeSection === tool.id;
        const Icon = tool.icon;

        return (
          <div key={tool.id}>
            <button
              onClick={() => {
                toggleSection(tool.id);
                // Auto-run if no data yet
                if (!isActive) {
                  const hasData =
                    (tool.id === "show-notes" && showNotes) ||
                    (tool.id === "transcript" && transcript) ||
                    (tool.id === "seo" && seoData) ||
                    (tool.id === "fact-check" && factChecks) ||
                    (tool.id === "suggestions" && suggestions);
                  if (!hasData) runTool(tool.id);
                }
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
            >
              <Icon className="w-4 h-4 text-accent-500 flex-shrink-0" />
              <span className="flex-1 text-left">{tool.label}</span>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{tool.description}</span>
              {isActive ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>

            {/* Expanded content */}
            {isActive && (
              <div className="mt-1 p-3 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-xs space-y-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-[hsl(var(--muted-foreground))]" />
                  </div>
                ) : (
                  <>
                    {/* Show Notes */}
                    {tool.id === "show-notes" && showNotes && (
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium mb-1">Summary</p>
                          <p className="text-[hsl(var(--muted-foreground))]">{showNotes.summary}</p>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Key Takeaways</p>
                          <ul className="list-disc pl-4 space-y-0.5 text-[hsl(var(--muted-foreground))]">
                            {showNotes.key_takeaways.map((t, i) => <li key={i}>{t}</li>)}
                          </ul>
                        </div>
                        {showNotes.timestamps.length > 0 && (
                          <div>
                            <p className="font-medium mb-1">Timestamps</p>
                            {showNotes.timestamps.map((ts, i) => (
                              <p key={i} className="text-[hsl(var(--muted-foreground))]">
                                <span className="font-mono text-primary-600">{ts.time}</span> — {ts.topic}
                              </p>
                            ))}
                          </div>
                        )}
                        {showNotes.quotes.length > 0 && (
                          <div>
                            <p className="font-medium mb-1">Notable Quotes</p>
                            {showNotes.quotes.map((q, i) => (
                              <p key={i} className="text-[hsl(var(--muted-foreground))] italic">&ldquo;{q}&rdquo;</p>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => copyText(
                            `${showNotes.summary}\n\nKey Takeaways:\n${showNotes.key_takeaways.map(t => `- ${t}`).join("\n")}\n\nTimestamps:\n${showNotes.timestamps.map(t => `${t.time} - ${t.topic}`).join("\n")}`,
                            "show-notes"
                          )}
                          className="flex items-center gap-1 text-primary-600 hover:underline"
                        >
                          {copied === "show-notes" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copied === "show-notes" ? "Copied!" : "Copy All"}
                        </button>
                      </div>
                    )}

                    {/* Transcript */}
                    {tool.id === "transcript" && transcript && (
                      <div className="space-y-2">
                        <p className="text-[hsl(var(--muted-foreground))]">
                          {transcript.word_count} words · {transcript.total_duration}
                        </p>
                        <div className="max-h-60 overflow-y-auto space-y-1.5">
                          {transcript.lines.map((line, i) => (
                            <div key={i}>
                              <span className="font-mono text-primary-600">{line.timestamp}</span>{" "}
                              <span className="font-medium">{line.speaker}:</span>{" "}
                              <span className="text-[hsl(var(--muted-foreground))]">{line.text}</span>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => copyText(
                            transcript.lines.map(l => `[${l.timestamp}] ${l.speaker}: ${l.text}`).join("\n"),
                            "transcript"
                          )}
                          className="flex items-center gap-1 text-primary-600 hover:underline"
                        >
                          {copied === "transcript" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copied === "transcript" ? "Copied!" : "Copy Transcript"}
                        </button>
                      </div>
                    )}

                    {/* SEO */}
                    {tool.id === "seo" && seoData && (
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium mb-1">SEO Title</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[hsl(var(--muted-foreground))] flex-1">{seoData.seo_title}</p>
                            <button onClick={() => copyText(seoData.seo_title, "seo-title")}>
                              {copied === "seo-title" ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Meta Description</p>
                          <p className="text-[hsl(var(--muted-foreground))]">{seoData.meta_description}</p>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Tags</p>
                          <div className="flex flex-wrap gap-1">
                            {seoData.tags.map((tag, i) => (
                              <Badge key={i} variant="secondary">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Twitter</p>
                          <div className="flex items-start gap-2">
                            <p className="text-[hsl(var(--muted-foreground))] flex-1">{seoData.social_post_twitter}</p>
                            <button onClick={() => copyText(seoData.social_post_twitter, "twitter")}>
                              {copied === "twitter" ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium mb-1">LinkedIn</p>
                          <div className="flex items-start gap-2">
                            <p className="text-[hsl(var(--muted-foreground))] flex-1">{seoData.social_post_linkedin}</p>
                            <button onClick={() => copyText(seoData.social_post_linkedin, "linkedin")}>
                              {copied === "linkedin" ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fact Check */}
                    {tool.id === "fact-check" && factChecks && (
                      <div className="space-y-2">
                        {factChecks.length === 0 ? (
                          <p className="text-[hsl(var(--muted-foreground))] py-2 text-center">
                            No claims flagged for fact-checking.
                          </p>
                        ) : (
                          factChecks.map((item, i) => (
                            <div
                              key={i}
                              className={`p-2 rounded-md ${severityColor[item.severity] || ""}`}
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                <AlertTriangle className="w-3 h-3" />
                                <Badge variant={item.severity === "high" ? "destructive" : item.severity === "medium" ? "warning" : "default"}>
                                  {item.severity}
                                </Badge>
                              </div>
                              <p className="font-medium">{item.claim}</p>
                              <p className="mt-0.5 opacity-80">{item.suggestion}</p>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Suggestions */}
                    {tool.id === "suggestions" && suggestions && (
                      <div className="space-y-2">
                        {suggestions.map((s, i) => (
                          <div key={i} className="p-2 rounded-md bg-[hsl(var(--muted))]">
                            <p className="font-medium">{s.title}</p>
                            <p className="text-[hsl(var(--muted-foreground))] mt-0.5">{s.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary">{s.format}</Badge>
                              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                                {s.connects_to}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Re-run button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => runTool(tool.id)}
                      className="w-full mt-2"
                    >
                      Regenerate
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
