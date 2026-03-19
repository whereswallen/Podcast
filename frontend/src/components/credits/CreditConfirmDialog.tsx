"use client";

import { useState } from "react";
import { AlertTriangle, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useCreditsStore } from "@/stores/credits";

interface CreditConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cost: number;
  operation: string;
  description?: string;
  isLoading?: boolean;
}

export function CreditConfirmDialog({
  open,
  onClose,
  onConfirm,
  cost,
  operation,
  description,
  isLoading = false,
}: CreditConfirmDialogProps) {
  const { balance } = useCreditsStore();
  const available = balance?.available_credits ?? 0;
  const isInsufficient = available < cost;

  const operationLabels: Record<string, string> = {
    script_generate: "Generate Script",
    rewrite_blocks: "Rewrite Blocks",
    rewrite_inline: "Inline Rewrite",
    show_notes: "Generate Show Notes",
    seo_metadata: "Generate SEO Metadata",
    fact_check: "Fact Check Script",
    suggest_content: "Suggest Topics",
    translate: "Translate Script",
    auto_summarize: "Auto-Summarize",
    brand_generate: "AI Brand Profile",
    intro_outro_generate: "AI Intro/Outro",
  };

  return (
    <Dialog open={open} onClose={onClose} title="Confirm Credit Usage">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-[hsl(var(--muted))]">
          <Coins className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
              {operationLabels[operation] || operation}
            </p>
            {description && (
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                {description}
              </p>
            )}
          </div>
          <span className="ml-auto text-lg font-bold text-primary-600">
            {cost} credits
          </span>
        </div>

        <div className="flex items-center justify-between px-1">
          <span className="text-sm text-[hsl(var(--muted-foreground))]">
            Your balance:
          </span>
          <span className="text-sm font-semibold">
            {available} credits
          </span>
        </div>

        {available > 0 && (
          <div className="flex items-center justify-between px-1">
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              After this operation:
            </span>
            <span className="text-sm font-semibold">
              {available - cost} credits
            </span>
          </div>
        )}

        {isInsufficient && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                Insufficient credits
              </p>
              <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
                You need {cost - available} more credits. Upgrade your plan or
                purchase a credit pack.
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1"
            disabled={isInsufficient || isLoading}
            isLoading={isLoading}
          >
            Use {cost} Credits
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

/**
 * Hook for credit confirmation flow.
 * For operations >= 5 credits, shows a confirmation dialog.
 * For operations < 5 credits, executes immediately.
 */
export function useCreditConfirm() {
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    cost: number;
    operation: string;
    description?: string;
    onConfirm: () => void;
  }>({
    open: false,
    cost: 0,
    operation: "",
    onConfirm: () => {},
  });

  const confirmCredits = (
    cost: number,
    operation: string,
    onConfirm: () => void,
    description?: string
  ) => {
    // Skip confirmation for small operations
    const skipConfirm =
      typeof window !== "undefined" &&
      localStorage.getItem("skipCreditConfirmUnder5") === "true";

    if (cost < 5 || skipConfirm) {
      onConfirm();
      return;
    }

    setDialogState({ open: true, cost, operation, description, onConfirm });
  };

  const closeDialog = () => {
    setDialogState((prev) => ({ ...prev, open: false }));
  };

  const handleConfirm = () => {
    dialogState.onConfirm();
    closeDialog();
  };

  return {
    confirmCredits,
    CreditDialog: () => (
      <CreditConfirmDialog
        open={dialogState.open}
        onClose={closeDialog}
        onConfirm={handleConfirm}
        cost={dialogState.cost}
        operation={dialogState.operation}
        description={dialogState.description}
      />
    ),
  };
}
