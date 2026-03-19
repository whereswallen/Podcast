"use client";

import { useEffect } from "react";
import { useAdminStore } from "@/stores/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, Users, Podcast } from "lucide-react";

export default function AdminAnalyticsPage() {
  const { stats, isLoading, loadStats } = useAdminStore();

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">
          Analytics
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          Platform usage metrics and trends
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Growth */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Users className="w-5 h-5 text-primary-600" />
                <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                  User Distribution
                </h3>
              </div>
              <div className="space-y-4">
                {Object.entries(stats.provider_breakdown).map(([provider, count]) => {
                  const total = stats.total_users || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={provider}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize text-[hsl(var(--foreground))]">{provider}</span>
                        <span className="text-[hsl(var(--muted-foreground))]">{count} users ({pct}%)</span>
                      </div>
                      <div className="w-full bg-[hsl(var(--muted))] rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            provider === "google" ? "bg-blue-500"
                            : provider === "github" ? "bg-gray-600"
                            : "bg-primary-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Plan Distribution */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                  Plan Distribution
                </h3>
              </div>
              <div className="space-y-4">
                {Object.entries(stats.plan_breakdown).map(([plan, count]) => {
                  const total = stats.total_users || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={plan}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize text-[hsl(var(--foreground))]">{plan}</span>
                        <span className="text-[hsl(var(--muted-foreground))]">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-[hsl(var(--muted))] rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            plan === "enterprise" ? "bg-amber-500"
                            : plan === "pro" ? "bg-primary-500"
                            : "bg-slate-400"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Platform Metrics */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                  Platform Metrics
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-xl bg-[hsl(var(--muted))]">
                  <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{stats.total_users}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Total Users</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-[hsl(var(--muted))]">
                  <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{stats.active_users}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Active Users</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-[hsl(var(--muted))]">
                  <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{stats.total_podcasts}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Podcasts</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-[hsl(var(--muted))]">
                  <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{stats.total_episodes}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Episodes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Stats */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Podcast className="w-5 h-5 text-secondary-500" />
                <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                  Content Overview
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-[hsl(var(--muted))]">
                  <span className="text-sm text-[hsl(var(--foreground))]">Avg Podcasts/User</span>
                  <span className="text-sm font-bold text-[hsl(var(--foreground))]">
                    {stats.total_users > 0
                      ? (stats.total_podcasts / stats.total_users).toFixed(1)
                      : "0"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-[hsl(var(--muted))]">
                  <span className="text-sm text-[hsl(var(--foreground))]">Avg Episodes/Podcast</span>
                  <span className="text-sm font-bold text-[hsl(var(--foreground))]">
                    {stats.total_podcasts > 0
                      ? (stats.total_episodes / stats.total_podcasts).toFixed(1)
                      : "0"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-[hsl(var(--muted))]">
                  <span className="text-sm text-[hsl(var(--foreground))]">Admin Count</span>
                  <span className="text-sm font-bold text-amber-600">{stats.admin_count}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
