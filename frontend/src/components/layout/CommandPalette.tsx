"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  LayoutDashboard,
  Mic2,
  Palette,
  Sliders,
  Settings,
  Plus,
  Search,
  Shield,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth";

const pages = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Voices", href: "/voices", icon: Mic2 },
  { name: "Studio", href: "/studio", icon: Sliders },
  { name: "Settings", href: "/settings", icon: Settings },
];

const actions = [
  { name: "New Podcast", href: "/dashboard", icon: Plus },
  { name: "Clone Voice", href: "/voices", icon: Mic2 },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navigate = (href: string) => {
    router.push(href);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg">
        <Command className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 border-b border-[hsl(var(--border))]">
            <Search className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            <Command.Input
              placeholder="Search pages, actions..."
              className="w-full py-3 text-sm bg-transparent text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none"
              autoFocus
            />
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] rounded">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
              No results found.
            </Command.Empty>

            <Command.Group heading="Pages" className="text-xs font-medium text-[hsl(var(--muted-foreground))] px-2 py-1.5">
              {pages.map((page) => (
                <Command.Item
                  key={page.href}
                  onSelect={() => navigate(page.href)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] data-[selected=true]:bg-[hsl(var(--muted))]"
                >
                  <page.icon className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  {page.name}
                </Command.Item>
              ))}
              {user?.is_admin && (
                <Command.Item
                  onSelect={() => navigate("/admin")}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] data-[selected=true]:bg-[hsl(var(--muted))]"
                >
                  <Shield className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  Admin Panel
                </Command.Item>
              )}
            </Command.Group>

            <Command.Group heading="Quick Actions" className="text-xs font-medium text-[hsl(var(--muted-foreground))] px-2 py-1.5">
              {actions.map((action) => (
                <Command.Item
                  key={action.name}
                  onSelect={() => navigate(action.href)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] data-[selected=true]:bg-[hsl(var(--muted))]"
                >
                  <action.icon className="w-4 h-4 text-accent-500" />
                  {action.name}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
