"use client";

import { useEffect } from "react";
import { Users, Podcast, FileText, Shield } from "lucide-react";
import { useAdminStore } from "@/stores/admin";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminDashboardPage() {
  const { stats, isLoading, loadStats } = useAdminStore();

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">
          Admin Dashboard
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          Platform overview and key metrics
        </p>
      </div>

      {/* Stat Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.total_users}
            icon={Users}
            trend={{ value: `${stats.active_users} active`, positive: true }}
          />
          <StatCard
            title="Total Podcasts"
            value={stats.total_podcasts}
            icon={Podcast}
          />
          <StatCard
            title="Total Episodes"
            value={stats.total_episodes}
            icon={FileText}
          />
          <StatCard
            title="Admin Users"
            value={stats.admin_count}
            icon={Shield}
          />
        </div>
      ) : null}

      {/* Breakdown Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Auth Provider Breakdown */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-4">
                Auth Providers
              </h3>
              <div className="space-y-3">
                {Object.entries(stats.provider_breakdown).map(([provider, count]) => (
                  <div key={provider} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          provider === "google"
                            ? "bg-blue-500"
                            : provider === "github"
                              ? "bg-gray-700"
                              : "bg-primary-500"
                        }`}
                      />
                      <span className="text-sm text-[hsl(var(--foreground))] capitalize">
                        {provider}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Plan Breakdown */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-4">
                Plan Distribution
              </h3>
              <div className="space-y-3">
                {Object.entries(stats.plan_breakdown).map(([plan, count]) => {
                  const total = stats.total_users || 1;
                  const percentage = Math.round((count / total) * 100);
                  return (
                    <div key={plan}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-[hsl(var(--foreground))] capitalize">
                          {plan}
                        </span>
                        <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-[hsl(var(--muted))] rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            plan === "enterprise"
                              ? "bg-amber-500"
                              : plan === "pro"
                                ? "bg-primary-500"
                                : "bg-slate-400"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
