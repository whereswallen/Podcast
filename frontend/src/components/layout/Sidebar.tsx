"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Mic2,
  Palette,
  Sliders,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { ThemeToggle } from "./ThemeToggle";
import { useState } from "react";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Brand",
    href: "/brand",
    icon: Palette,
  },
  {
    label: "Voices",
    href: "/voices",
    icon: Mic2,
  },
  {
    label: "Studio",
    href: "/studio",
    icon: Sliders,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-screen border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 p-4 border-b border-[hsl(var(--border))]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center flex-shrink-0">
          <Mic2 className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            PodcastAI
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1 rounded hover:bg-[hsl(var(--muted))] transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          )}
        </button>
      </div>

      {/* Search hint */}
      {!collapsed && (
        <button
          onClick={() => {
            document.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", metaKey: true })
            );
          }}
          className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-xs text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[hsl(var(--muted))] rounded">
            Cmd+K
          </kbd>
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 shadow-sm"
                  : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* Admin link */}
        {user?.is_admin && (
          <>
            <div className="my-2 border-t border-[hsl(var(--border))]" />
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                pathname.startsWith("/admin")
                  ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300"
                  : "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
              )}
              title={collapsed ? "Admin" : undefined}
            >
              <Shield className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>Admin</span>}
            </Link>
          </>
        )}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-[hsl(var(--border))]">
        {/* Theme toggle */}
        <div
          className={cn(
            "flex items-center mb-2",
            collapsed ? "justify-center" : "justify-end px-3"
          )}
        >
          <ThemeToggle />
        </div>

        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2",
            collapsed && "justify-center"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            )}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                {user?.email || ""}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="p-1.5 rounded hover:bg-[hsl(var(--muted))] transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
