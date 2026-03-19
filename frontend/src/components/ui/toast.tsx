"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] shadow-lg rounded-xl",
          title: "text-sm font-semibold",
          description: "text-xs text-[hsl(var(--muted-foreground))]",
          actionButton: "bg-primary-600 text-white text-xs rounded-lg px-3 py-1.5",
          cancelButton:
            "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] text-xs rounded-lg px-3 py-1.5",
        },
      }}
      richColors
      closeButton
    />
  );
}
