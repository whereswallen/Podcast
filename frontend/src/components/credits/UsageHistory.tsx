"use client";

import { useEffect } from "react";
import {
  Coins,
  FileText,
  Mic2,
  Search,
  Languages,
  Sparkles,
  PenLine,
  Gift,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreditsStore } from "@/stores/credits";

const operationIcons: Record<string, React.ElementType> = {
  script_generate: FileText,
  rewrite_blocks: PenLine,
  rewrite_inline: PenLine,
  show_notes: BookOpen,
  seo_metadata: Search,
  fact_check: Search,
  suggest_content: Sparkles,
  translate: Languages,
  auto_summarize: BookOpen,
  brand_generate: Sparkles,
  intro_outro_generate: Mic2,
  credit_grant: Gift,
  transcript: FileText,
};

const operationLabels: Record<string, string> = {
  script_generate: "Script Generation",
  rewrite_blocks: "Block Rewrite",
  rewrite_inline: "Inline Rewrite",
  show_notes: "Show Notes",
  seo_metadata: "SEO Metadata",
  fact_check: "Fact Check",
  suggest_content: "Content Suggestion",
  translate: "Translation",
  auto_summarize: "Auto-Summarize",
  brand_generate: "Brand Profile",
  intro_outro_generate: "Intro/Outro",
  credit_grant: "Credit Grant",
  transcript: "Transcript",
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function UsageHistory() {
  const { transactions, fetchTransactions } = useCreditsStore();

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <Coins className="w-8 h-8 mx-auto text-[hsl(var(--muted-foreground))] mb-2" />
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          No credit usage yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {transactions.map((tx) => {
        const Icon = operationIcons[tx.operation] || Coins;
        const isGrant = tx.amount > 0;

        return (
          <div
            key={tx.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
          >
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                isGrant
                  ? "bg-emerald-50 dark:bg-emerald-950/20"
                  : "bg-[hsl(var(--muted))]"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4",
                  isGrant
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-[hsl(var(--muted-foreground))]"
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">
                {operationLabels[tx.operation] || tx.operation}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                {tx.description}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p
                className={cn(
                  "text-sm font-semibold",
                  isGrant
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-[hsl(var(--foreground))]"
                )}
              >
                {isGrant ? "+" : ""}{tx.amount}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {formatRelativeTime(tx.created_at)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
