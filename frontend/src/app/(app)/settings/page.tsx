"use client";

import Link from "next/link";
import { CreditCard, User, Bell, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { useAuthStore } from "@/stores/auth";
import { Badge } from "@/components/ui/badge";

const settingsLinks = [
  {
    title: "Billing & Credits",
    description: "Manage your subscription, view credit balance, and purchase credit packs",
    href: "/settings/billing",
    icon: CreditCard,
  },
];

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div>
      <Header
        title="Settings"
        description="Manage your account and preferences"
      />

      {/* Account Info */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center overflow-hidden">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-white">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                {user?.name || "User"}
              </h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {user?.email}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">
                  {user?.plan_tier || "free"} plan
                </Badge>
                <Badge variant="outline">
                  {user?.auth_provider || "email"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Links */}
      <div className="space-y-3">
        {settingsLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="hover:border-primary-500/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-950/20 flex items-center justify-center flex-shrink-0">
                  <link.icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                    {link.title}
                  </h4>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {link.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
