import * as React from "react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function Header({ title, description, children, className }: HeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8",
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-[hsl(var(--muted-foreground))]">
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}
