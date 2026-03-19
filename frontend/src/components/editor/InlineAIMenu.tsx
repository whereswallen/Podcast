"use client";

import { useState, useRef, useEffect } from "react";
import {
  Wand2,
  Maximize2,
  Minimize2,
  Briefcase,
  Coffee,
  Zap,
  Send,
  X,
  Loader2,
} from "lucide-react";
import { useEditorStore } from "@/stores/editor";
import { cn } from "@/lib/utils";

interface InlineAIMenuProps {
  blockId: string;
  blockText: string;
  position: { top: number; left: number };
  onClose: () => void;
}

interface QuickAction {
  label: string;
  instruction: string;
  icon: React.ReactNode;
}

const quickActions: QuickAction[] = [
  {
    label: "Rewrite",
    instruction: "Rewrite this text to improve clarity and flow while keeping the same meaning.",
    icon: <Wand2 className="w-3.5 h-3.5" />,
  },
  {
    label: "Expand",
    instruction: "Expand this text with more detail, examples, and explanation while maintaining the same tone.",
    icon: <Maximize2 className="w-3.5 h-3.5" />,
  },
  {
    label: "Condense",
    instruction: "Condense this text to be shorter and more concise while preserving key points.",
    icon: <Minimize2 className="w-3.5 h-3.5" />,
  },
  {
    label: "Make Formal",
    instruction: "Rewrite this text in a more formal and professional tone.",
    icon: <Briefcase className="w-3.5 h-3.5" />,
  },
  {
    label: "Make Casual",
    instruction: "Rewrite this text in a more casual and conversational tone.",
    icon: <Coffee className="w-3.5 h-3.5" />,
  },
  {
    label: "Make Energetic",
    instruction: "Rewrite this text to be more energetic, enthusiastic, and engaging.",
    icon: <Zap className="w-3.5 h-3.5" />,
  },
];

export function InlineAIMenu({
  blockId,
  blockText,
  position,
  onClose,
}: InlineAIMenuProps) {
  const { rewriteBlock } = useEditorStore();
  const [customInstruction, setCustomInstruction] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        handleClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 150);
  };

  const handleAction = async (instruction: string) => {
    if (!blockText.trim() || isLoading) return;
    setIsLoading(true);
    try {
      await rewriteBlock(blockId, instruction);
      handleClose();
    } catch {
      // Error is set in store
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomSubmit = () => {
    if (!customInstruction.trim()) return;
    handleAction(customInstruction.trim());
  };

  return (
    <div
      ref={menuRef}
      className={cn(
        "fixed z-50 w-72 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xl transition-all duration-150",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
      )}
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-1.5">
          <Wand2 className="w-3.5 h-3.5 text-accent-500" />
          <span className="text-xs font-semibold text-[hsl(var(--foreground))]">
            AI Rewrite
          </span>
        </div>
        <button
          onClick={handleClose}
          className="p-0.5 rounded hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-[hsl(var(--card))]/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
            <Loader2 className="w-4 h-4 animate-spin text-accent-500" />
            <span>Rewriting...</span>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="p-2 grid grid-cols-2 gap-1">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => handleAction(action.instruction)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors disabled:opacity-50"
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>

      {/* Custom Instruction */}
      <div className="px-2 pb-2">
        <div className="flex items-center gap-1.5 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2">
          <input
            ref={inputRef}
            type="text"
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCustomSubmit();
              }
            }}
            placeholder="Custom instruction..."
            className="flex-1 h-8 bg-transparent text-xs text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none"
            disabled={isLoading}
          />
          <button
            onClick={handleCustomSubmit}
            disabled={!customInstruction.trim() || isLoading}
            className="p-1 rounded hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-accent-500 disabled:opacity-30 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
