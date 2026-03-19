"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Shield, ShieldOff, UserX, UserCheck, Coins } from "lucide-react";
import { toast } from "sonner";
import { useAdminStore } from "@/stores/admin";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import type { AdminUser } from "@/types";

const planOptions = [
  { value: "", label: "All Plans" },
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
  { value: "enterprise", label: "Enterprise" },
];

const providerOptions = [
  { value: "", label: "All Providers" },
  { value: "email", label: "Email" },
  { value: "google", label: "Google" },
  { value: "github", label: "GitHub" },
];

const planTierOptions = [
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
  { value: "enterprise", label: "Enterprise" },
];

const providerBadge: Record<string, "default" | "secondary" | "success"> = {
  email: "default",
  google: "secondary",
  github: "secondary",
};

export default function AdminUsersPage() {
  const { users, isLoading, loadUsers, updateUser, grantCredits } = useAdminStore();
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");

  const fetchUsers = useCallback(() => {
    loadUsers({
      search: search || undefined,
      plan_tier: planFilter || undefined,
      provider: providerFilter || undefined,
    });
  }, [search, planFilter, providerFilter, loadUsers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleAdmin = async (user: AdminUser) => {
    await updateUser(user.id, { is_admin: !user.is_admin });
  };

  const handleToggleActive = async (user: AdminUser) => {
    await updateUser(user.id, { is_active: !user.is_active });
  };

  const handleChangePlan = async (userId: string, plan: string) => {
    await updateUser(userId, { plan_tier: plan });
  };

  const handleGrantCredits = async (user: AdminUser) => {
    const amount = prompt(`Grant credits to ${user.name}.\nEnter amount:`);
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    try {
      await grantCredits(user.id, Number(amount), `Admin grant to ${user.name}`);
      toast.success(`Granted ${amount} credits to ${user.name}`);
    } catch {
      toast.error("Failed to grant credits");
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">
          User Management
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          Manage platform users, roles, and plans
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <Select
          options={planOptions}
          value={planFilter}
          onChange={setPlanFilter}
        />
        <Select
          options={providerOptions}
          value={providerFilter}
          onChange={setProviderFilter}
        />
      </div>

      {/* Users Table */}
      {isLoading ? (
        <SkeletonTable rows={8} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[hsl(var(--border))]">
                  <th className="text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider px-6 py-3">
                    User
                  </th>
                  <th className="text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider px-6 py-3">
                    Provider
                  </th>
                  <th className="text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider px-6 py-3">
                    Plan
                  </th>
                  <th className="text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider px-6 py-3">
                    Role
                  </th>
                  <th className="text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider px-6 py-3">
                    Podcasts
                  </th>
                  <th className="text-right text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider px-6 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted))] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={user.avatar_url}
                          name={user.name}
                          size="sm"
                        />
                        <div>
                          <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                            {user.name}
                          </p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">
                            {user.email}
                          </p>
                        </div>
                        {!user.is_active && (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={providerBadge[user.auth_provider] || "default"}>
                        {user.auth_provider}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.plan_tier}
                        onChange={(e) => handleChangePlan(user.id, e.target.value)}
                        className="text-xs rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1"
                      >
                        {planTierOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      {user.is_admin ? (
                        <Badge variant="warning">Admin</Badge>
                      ) : (
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[hsl(var(--foreground))]">
                        {user.podcast_count}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleGrantCredits(user)}
                          className="p-1.5 rounded hover:bg-[hsl(var(--muted))] transition-colors"
                          title="Grant credits"
                        >
                          <Coins className="w-4 h-4 text-amber-600" />
                        </button>
                        <button
                          onClick={() => handleToggleAdmin(user)}
                          className="p-1.5 rounded hover:bg-[hsl(var(--muted))] transition-colors"
                          title={user.is_admin ? "Remove admin" : "Make admin"}
                        >
                          {user.is_admin ? (
                            <ShieldOff className="w-4 h-4 text-amber-600" />
                          ) : (
                            <Shield className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                          )}
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          className="p-1.5 rounded hover:bg-[hsl(var(--muted))] transition-colors"
                          title={user.is_active ? "Deactivate" : "Activate"}
                        >
                          {user.is_active ? (
                            <UserX className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-green-600" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <div className="py-12 text-center text-sm text-[hsl(var(--muted-foreground))]">
              No users found.
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
