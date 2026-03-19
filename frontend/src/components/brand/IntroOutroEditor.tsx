"use client";

import { useState } from "react";
import {
  Plus,
  Save,
  Sparkles,
  Trash2,
  Star,
  Loader2,
} from "lucide-react";
import { useBrandStore } from "@/stores/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { IntroOutroCreateRequest } from "@/types";

const TEMPLATE_VARIABLES = [
  { key: "{episode_title}", label: "Episode Title" },
  { key: "{episode_number}", label: "Episode #" },
  { key: "{guest_name}", label: "Guest Name" },
  { key: "{topic}", label: "Topic" },
  { key: "{date}", label: "Date" },
];

interface IntroOutroEditorProps {
  podcastId: string;
}

export function IntroOutroEditor({ podcastId }: IntroOutroEditorProps) {
  const {
    templates,
    isSaving,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    generateTemplate,
  } = useBrandStore();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<IntroOutroCreateRequest>({
    type: "intro",
    name: "",
    script_template: "",
    speaker_id: "host",
    is_default: false,
  });

  const intros = templates.filter((t) => t.type === "intro");
  const outros = templates.filter((t) => t.type === "outro");

  const insertVariable = (variable: string) => {
    setForm((prev) => ({
      ...prev,
      script_template: prev.script_template + variable,
    }));
  };

  const handleSave = async () => {
    if (editingId) {
      await updateTemplate(podcastId, editingId, form);
    } else {
      await createTemplate(podcastId, form);
    }
    resetForm();
  };

  const handleEdit = (template: (typeof templates)[0]) => {
    setForm({
      type: template.type as "intro" | "outro",
      name: template.name,
      script_template: template.script_template,
      speaker_id: template.speaker_id || "host",
      music_id: template.music_id || undefined,
      sfx_id: template.sfx_id || undefined,
      duration_target: template.duration_target || undefined,
      is_default: template.is_default,
    });
    setEditingId(template.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({
      type: "intro",
      name: "",
      script_template: "",
      speaker_id: "host",
      is_default: false,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleToggleDefault = async (
    templateId: string,
    currentDefault: boolean
  ) => {
    await updateTemplate(podcastId, templateId, {
      is_default: !currentDefault,
    });
  };

  const renderTemplateList = (
    list: typeof templates,
    label: string,
    type: "intro" | "outro"
  ) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-[hsl(var(--foreground))]">
          {label}
        </h4>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateTemplate(podcastId, type)}
            disabled={isSaving}
          >
            <Sparkles className="w-3 h-3" />
            AI Generate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setForm({ ...form, type });
              setShowForm(true);
            }}
          >
            <Plus className="w-3 h-3" />
            Add
          </Button>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))] py-4 text-center">
          No {label.toLowerCase()} templates yet
        </p>
      ) : (
        list.map((template) => (
          <Card key={template.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                      {template.name}
                    </span>
                    {template.is_default && (
                      <Badge variant="success">Default</Badge>
                    )}
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2">
                    {template.script_template}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() =>
                      handleToggleDefault(template.id, template.is_default)
                    }
                    className="p-1.5 rounded hover:bg-[hsl(var(--muted))] transition-colors"
                    title={
                      template.is_default
                        ? "Remove as default"
                        : "Set as default"
                    }
                  >
                    <Star
                      className={`w-4 h-4 ${template.is_default ? "text-yellow-500 fill-yellow-500" : "text-[hsl(var(--muted-foreground))]"}`}
                    />
                  </button>
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-1.5 rounded hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteTemplate(podcastId, template.id)}
                    className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-[hsl(var(--muted-foreground))] hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {renderTemplateList(intros, "Intros", "intro")}
      <div className="border-t border-[hsl(var(--border))]" />
      {renderTemplateList(outros, "Outros", "outro")}

      {/* Create/Edit Form */}
      {showForm && (
        <div className="border border-[hsl(var(--border))] rounded-lg p-4 space-y-4 bg-[hsl(var(--card))]">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-[hsl(var(--foreground))]">
              {editingId ? "Edit Template" : "New Template"}
            </h4>
            <button
              onClick={resetForm}
              className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Template Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Standard Intro"
            />
            <Input
              label="Speaker ID"
              value={form.speaker_id || ""}
              onChange={(e) =>
                setForm({ ...form, speaker_id: e.target.value })
              }
              placeholder="host"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[hsl(var(--foreground))]">
              Template Text
            </label>
            <div className="flex flex-wrap gap-1 mb-2">
              {TEMPLATE_VARIABLES.map((v) => (
                <button
                  key={v.key}
                  onClick={() => insertVariable(v.key)}
                  className="px-2 py-1 text-xs rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
                >
                  {v.label}
                </button>
              ))}
            </div>
            <Textarea
              value={form.script_template}
              onChange={(e) =>
                setForm({ ...form, script_template: e.target.value })
              }
              placeholder="Welcome to {episode_title}! I'm your host, and today we're diving into {topic}..."
              rows={4}
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_default || false}
                onChange={(e) =>
                  setForm({ ...form, is_default: e.target.checked })
                }
                className="rounded border-[hsl(var(--border))]"
              />
              Set as default (auto-apply to new episodes)
            </label>
          </div>

          <Button onClick={handleSave} disabled={isSaving || !form.name.trim()}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {editingId ? "Update" : "Create"}
          </Button>
        </div>
      )}
    </div>
  );
}
