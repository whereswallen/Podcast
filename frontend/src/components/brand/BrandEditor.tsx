"use client";

import { useState, useEffect } from "react";
import { Save, Sparkles, Loader2, Plus, X } from "lucide-react";
import { useBrandStore } from "@/stores/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { BrandProfileUpdate } from "@/types";

interface BrandEditorProps {
  podcastId: string;
  podcastTitle: string;
  podcastDescription?: string;
  podcastCategory?: string;
}

export function BrandEditor({
  podcastId,
  podcastTitle,
  podcastDescription,
  podcastCategory,
}: BrandEditorProps) {
  const { brand, isSaving, error, updateBrand, generateBrand } =
    useBrandStore();

  const [form, setForm] = useState<BrandProfileUpdate>({});
  const [newTheme, setNewTheme] = useState("");
  const [newVocab, setNewVocab] = useState("");
  const [newDo, setNewDo] = useState("");
  const [newDont, setNewDont] = useState("");

  useEffect(() => {
    if (brand) {
      setForm({
        show_name: brand.show_name || "",
        tagline: brand.tagline || "",
        personality: brand.personality || "",
        target_audience: brand.target_audience || "",
        tone_guidelines: brand.tone_guidelines || { do: [], dont: [] },
        key_themes: brand.key_themes || [],
        vocabulary: brand.vocabulary || [],
        content_rules: brand.content_rules || "",
        brand_colors: brand.brand_colors || {},
      });
    }
  }, [brand]);

  const handleSave = () => {
    updateBrand(podcastId, form);
  };

  const handleGenerate = () => {
    generateBrand(podcastId, podcastTitle, podcastDescription, podcastCategory);
  };

  const addTag = (
    field: "key_themes" | "vocabulary",
    value: string,
    setter: (v: string) => void
  ) => {
    if (!value.trim()) return;
    const current = (form[field] as string[]) || [];
    if (!current.includes(value.trim())) {
      setForm({ ...form, [field]: [...current, value.trim()] });
    }
    setter("");
  };

  const removeTag = (field: "key_themes" | "vocabulary", index: number) => {
    const current = (form[field] as string[]) || [];
    setForm({ ...form, [field]: current.filter((_, i) => i !== index) });
  };

  const addToneItem = (type: "do" | "dont", value: string, setter: (v: string) => void) => {
    if (!value.trim()) return;
    const current = form.tone_guidelines || { do: [], dont: [] };
    const list = current[type] || [];
    if (!list.includes(value.trim())) {
      setForm({
        ...form,
        tone_guidelines: { ...current, [type]: [...list, value.trim()] },
      });
    }
    setter("");
  };

  const removeToneItem = (type: "do" | "dont", index: number) => {
    const current = form.tone_guidelines || { do: [], dont: [] };
    setForm({
      ...form,
      tone_guidelines: {
        ...current,
        [type]: (current[type] || []).filter((_, i) => i !== index),
      },
    });
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
          Brand Identity
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            AI Suggest
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Show Name"
          value={form.show_name || ""}
          onChange={(e) => setForm({ ...form, show_name: e.target.value })}
          placeholder="My Amazing Podcast"
        />
        <Input
          label="Tagline"
          value={form.tagline || ""}
          onChange={(e) => setForm({ ...form, tagline: e.target.value })}
          placeholder="Where tech meets humanity"
        />
      </div>

      <Textarea
        label="Personality"
        value={form.personality || ""}
        onChange={(e) => setForm({ ...form, personality: e.target.value })}
        placeholder="Describe the show's voice and personality (e.g., witty and informative, serious and authoritative)"
        rows={3}
      />

      <Textarea
        label="Target Audience"
        value={form.target_audience || ""}
        onChange={(e) =>
          setForm({ ...form, target_audience: e.target.value })
        }
        placeholder="Who is this podcast for? (e.g., tech professionals aged 25-45 interested in startups)"
        rows={2}
      />

      {/* Tone Guidelines */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[hsl(var(--foreground))]">
          Tone Guidelines
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs text-green-600 font-medium">DO</p>
            <div className="flex flex-wrap gap-1.5">
              {(form.tone_guidelines?.do || []).map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs"
                >
                  {item}
                  <button onClick={() => removeToneItem("do", i)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <Input
                value={newDo}
                onChange={(e) => setNewDo(e.target.value)}
                placeholder="Add guideline..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addToneItem("do", newDo, setNewDo);
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => addToneItem("do", newDo, setNewDo)}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-red-600 font-medium">DON&apos;T</p>
            <div className="flex flex-wrap gap-1.5">
              {(form.tone_guidelines?.dont || []).map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs"
                >
                  {item}
                  <button onClick={() => removeToneItem("dont", i)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <Input
                value={newDont}
                onChange={(e) => setNewDont(e.target.value)}
                placeholder="Add guideline..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addToneItem("dont", newDont, setNewDont);
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => addToneItem("dont", newDont, setNewDont)}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Themes */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[hsl(var(--foreground))]">
          Key Themes
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {(form.key_themes || []).map((theme, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 text-xs font-medium"
            >
              {theme}
              <button onClick={() => removeTag("key_themes", i)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          <Input
            value={newTheme}
            onChange={(e) => setNewTheme(e.target.value)}
            placeholder="Add theme (press Enter)..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag("key_themes", newTheme, setNewTheme);
              }
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => addTag("key_themes", newTheme, setNewTheme)}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Vocabulary */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[hsl(var(--foreground))]">
          Preferred Vocabulary / Jargon
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {(form.vocabulary || []).map((term, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] text-xs"
            >
              {term}
              <button onClick={() => removeTag("vocabulary", i)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          <Input
            value={newVocab}
            onChange={(e) => setNewVocab(e.target.value)}
            placeholder="Add term (press Enter)..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag("vocabulary", newVocab, setNewVocab);
              }
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => addTag("vocabulary", newVocab, setNewVocab)}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <Textarea
        label="Content Rules"
        value={form.content_rules || ""}
        onChange={(e) => setForm({ ...form, content_rules: e.target.value })}
        placeholder="What should always/never be included? (e.g., Always mention our website at the end, Never discuss competitor products)"
        rows={3}
      />

      {/* Brand Colors */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-[hsl(var(--foreground))]">
            Primary Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.brand_colors?.primary || "#6366f1"}
              onChange={(e) =>
                setForm({
                  ...form,
                  brand_colors: {
                    ...form.brand_colors,
                    primary: e.target.value,
                  },
                })
              }
              className="w-10 h-10 rounded border border-[hsl(var(--border))] cursor-pointer"
            />
            <Input
              value={form.brand_colors?.primary || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  brand_colors: {
                    ...form.brand_colors,
                    primary: e.target.value,
                  },
                })
              }
              placeholder="#6366f1"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-[hsl(var(--foreground))]">
            Secondary Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.brand_colors?.secondary || "#8b5cf6"}
              onChange={(e) =>
                setForm({
                  ...form,
                  brand_colors: {
                    ...form.brand_colors,
                    secondary: e.target.value,
                  },
                })
              }
              className="w-10 h-10 rounded border border-[hsl(var(--border))] cursor-pointer"
            />
            <Input
              value={form.brand_colors?.secondary || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  brand_colors: {
                    ...form.brand_colors,
                    secondary: e.target.value,
                  },
                })
              }
              placeholder="#8b5cf6"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
