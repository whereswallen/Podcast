"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Database, Server, Key } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">
          System Settings
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          Platform configuration and system information
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* API Configuration */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Server className="w-5 h-5 text-primary-600" />
              <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                API Configuration
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">API Version</span>
                <Badge variant="secondary">v1.0.0</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">Framework</span>
                <span className="text-sm text-[hsl(var(--foreground))]">FastAPI</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">Python</span>
                <span className="text-sm text-[hsl(var(--foreground))]">3.12</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-green-600" />
              <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                Database
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">Engine</span>
                <span className="text-sm text-[hsl(var(--foreground))]">PostgreSQL</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">ORM</span>
                <span className="text-sm text-[hsl(var(--foreground))]">SQLAlchemy 2.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">Status</span>
                <Badge variant="success">Connected</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Auth Providers */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                Auth Providers
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">Email/Password</span>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">Google OAuth</span>
                <Badge variant="secondary">Configured</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">GitHub OAuth</span>
                <Badge variant="secondary">Configured</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-secondary-500" />
              <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                Services
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">Claude API (LLM)</span>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">TTS Engine</span>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">Celery Workers</span>
                <Badge variant="success">Running</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">Redis</span>
                <Badge variant="success">Connected</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
