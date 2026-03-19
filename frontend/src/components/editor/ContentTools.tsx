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
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  ImageIcon,
  Download,
} from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  ShowNotes,
  Transcript,
  SEOMetadata,
  FactCheckItem,
  FactCheckSummary,
  ContentSuggestion,
  VisualCards,
} from "@/types";

interface ContentToolsProps {
  episodeId: string;
  podcastId?: string;
}

type ToolSection = "show-notes" | "transcript" | "seo" | "visual-cards" | "fact-check" | "suggestions" | "translate" | null;

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
  const [factCheckSummary, setFactCheckSummary] = useState<FactCheckSummary | null>(null);
  const [suggestions, setSuggestions] = useState<ContentSuggestion[] | null>(null);
  const [visualCards, setVisualCards] = useState<VisualCards | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState("");

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
        case "visual-cards": {
          const res = await api.post<VisualCards>(`/api/ai/episodes/${episodeId}/visual-cards`);
          setVisualCards(res.data);
          break;
        }
        case "fact-check": {
          const res = await api.post<FactCheckSummary>(`/api/ai/episodes/${episodeId}/fact-check`);
          setFactCheckSummary(res.data);
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
    { id: "visual-cards" as const, label: "Visual Cards", icon: ImageIcon, description: "Quote & topic cards" },
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
                    (tool.id === "visual-cards" && visualCards) ||
                    (tool.id === "fact-check" && factCheckSummary) ||
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

                    {/* Visual Cards */}
                    {tool.id === "visual-cards" && visualCards && (
                      <div className="space-y-3">
                        <p className="text-[hsl(var(--muted-foreground))]">
                          &ldquo;{visualCards.best_quote}&rdquo;
                        </p>
                        {[
                          { label: "Quote Card (1080×1080)", data: visualCards.quote_card, key: "quote" },
                          { label: "Topic Card (1200×628)", data: visualCards.topic_card, key: "topic" },
                          { label: "Audiogram (1080×1080)", data: visualCards.audiogram_preview, key: "audiogram" },
                        ].map((card) => (
                          <div key={card.key} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{card.label}</p>
                              <button
                                onClick={() => {
                                  const link = document.createElement("a");
                                  link.href = `data:image/png;base64,${card.data}`;
                                  link.download = `${card.key}-card.png`;
                                  link.click();
                                }}
                                className="flex items-center gap-1 text-primary-600 hover:underline"
                              >
                                <Download className="w-3 h-3" />
                                Download
                              </button>
                            </div>
                            <img
                              src={`data:image/png;base64,${card.data}`}
                              alt={card.label}
                              className="w-full rounded-md border border-[hsl(var(--border))]"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Fact Check */}
                    {tool.id === "fact-check" && factCheckSummary && (
                      <div className="space-y-2">
                        {/* Publish gate banner */}
                        {factCheckSummary.publish_blocked && (
                          <div className="flex items-center gap-2 p-2 rounded-md bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700">
                            <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-red-700 dark:text-red-400">Publishing Blocked</p>
                              <p className="text-red-600 dark:text-red-400 opacity-80">
                                {factCheckSummary.unresolved_high} unresolved high-severity flag{factCheckSummary.unresolved_high !== 1 ? "s" : ""}.
                                {factCheckSummary.domain && factCheckSummary.domain !== "general" && (
                                  <> Domain: <strong>{factCheckSummary.domain}</strong> — all high-severity claims must be verified.</>
                                )}
                              </p>
                            </div>
                          </div>
                        )}

                        {!factCheckSummary.publish_blocked && factCheckSummary.total > 0 && (
                          <div className="flex items-center gap-2 p-2 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                            <p className="text-green-700 dark:text-green-400">Publishing allowed — no blocking flags.</p>
                          </div>
                        )}

                        {/* Summary stats */}
                        {factCheckSummary.total > 0 && (
                          <div className="flex items-center gap-3 text-[10px] text-[hsl(var(--muted-foreground))]">
                            <span>{factCheckSummary.total} total</span>
                            {factCheckSummary.unresolved_high > 0 && <span className="text-red-600">{factCheckSummary.unresolved_high} high</span>}
                            {factCheckSummary.unresolved_medium > 0 && <span className="text-amber-600">{factCheckSummary.unresolved_medium} medium</span>}
                            {factCheckSummary.unresolved_low > 0 && <span className="text-blue-600">{factCheckSummary.unresolved_low} low</span>}
                            {factCheckSummary.domain && <span>Domain: {factCheckSummary.domain}</span>}
                          </div>
                        )}

                        {factCheckSummary.items.length === 0 ? (
                          <p className="text-[hsl(var(--muted-foreground))] py-2 text-center">
                            No claims flagged for fact-checking.
                          </p>
                        ) : (
                          factCheckSummary.items.map((item) => (
                            <div
                              key={item.id}
                              className={`p-2 rounded-md ${item.resolved ? "bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 opacity-70" : severityColor[item.severity] || ""}`}
                            >
                              {/* Header row: severity + confidence + resolved status */}
                              <div className="flex items-center gap-1.5 mb-1">
                                {item.resolved ? (
                                  <CheckCircle2 className="w-3 h-3" />
                                ) : (
                                  <AlertTriangle className="w-3 h-3" />
                                )}
                                <Badge variant={item.resolved ? "secondary" : item.severity === "high" ? "destructive" : item.severity === "medium" ? "warning" : "default"}>
                                  {item.severity}
                                </Badge>
                                <span className="text-[10px] opacity-60 ml-auto">
                                  {Math.round(item.confidence * 100)}% confidence
                                </span>
                              </div>

                              {/* Claim text */}
                              <p className={`font-medium ${item.resolved ? "line-through opacity-60" : ""}`}>{item.claim}</p>
                              <p className="mt-0.5 opacity-80">{item.suggestion}</p>

                              {/* Sources */}
                              {item.sources && item.sources.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {item.sources.map((src, si) => (
                                    <span key={si} className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-white/50 dark:bg-black/20">
                                      <ExternalLink className="w-2.5 h-2.5" />
                                      {src}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Resolution note (if resolved) */}
                              {item.resolved && item.resolution_note && (
                                <p className="mt-1 text-[10px] italic opacity-60">
                                  Verified: {item.resolution_note}
                                </p>
                              )}

                              {/* Resolve / Unresolve actions */}
                              {!item.resolved && resolvingId !== item.id && (
                                <button
                                  onClick={() => { setResolvingId(item.id); setResolveNote(""); }}
                                  className="mt-1.5 flex items-center gap-1 text-[10px] font-medium hover:underline opacity-70 hover:opacity-100"
                                >
                                  <CheckCircle2 className="w-3 h-3" /> Mark as verified
                                </button>
                              )}

                              {!item.resolved && resolvingId === item.id && (
                                <div className="mt-1.5 space-y-1">
                                  <textarea
                                    value={resolveNote}
                                    onChange={(e) => setResolveNote(e.target.value)}
                                    placeholder="How did you verify this claim? (required)"
                                    className="w-full text-[10px] p-1.5 rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] resize-none"
                                    rows={2}
                                  />
                                  <div className="flex gap-1">
                                    <Button
                                      variant="default"
                                      size="sm"
                                      disabled={!resolveNote.trim()}
                                      onClick={async () => {
                                        try {
                                          await api.post(`/api/ai/episodes/${episodeId}/fact-check/${item.id}/resolve`, { resolution_note: resolveNote });
                                          const res = await api.get<FactCheckSummary>(`/api/ai/episodes/${episodeId}/fact-check`);
                                          setFactCheckSummary(res.data);
                                        } catch { /* error handled by parent */ }
                                        setResolvingId(null);
                                        setResolveNote("");
                                      }}
                                      className="text-[10px] h-6"
                                    >
                                      Confirm
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => { setResolvingId(null); setResolveNote(""); }}
                                      className="text-[10px] h-6"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {item.resolved && (
                                <button
                                  onClick={async () => {
                                    try {
                                      await api.post(`/api/ai/episodes/${episodeId}/fact-check/${item.id}/unresolve`);
                                      const res = await api.get<FactCheckSummary>(`/api/ai/episodes/${episodeId}/fact-check`);
                                      setFactCheckSummary(res.data);
                                    } catch { /* error handled by parent */ }
                                  }}
                                  className="mt-1 flex items-center gap-1 text-[10px] font-medium hover:underline opacity-60 hover:opacity-100"
                                >
                                  <RotateCcw className="w-3 h-3" /> Re-open
                                </button>
                              )}
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
