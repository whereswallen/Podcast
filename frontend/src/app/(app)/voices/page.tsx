"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Play,
  Mic2,
  Settings2,
  Volume2,
  Wand2,
} from "lucide-react";
import api from "@/lib/api";
import type { VoiceProfile, VoiceSettings, CreateVoiceRequest } from "@/types";
import { VoiceCloneWizard } from "@/components/voices/VoiceCloneWizard";
import { VoiceCloneList } from "@/components/voices/VoiceCloneList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const emotionOptions = [
  { value: "neutral", label: "Neutral" },
  { value: "happy", label: "Happy" },
  { value: "serious", label: "Serious" },
  { value: "excited", label: "Excited" },
  { value: "calm", label: "Calm" },
  { value: "sad", label: "Sad" },
];

const styleOptions = [
  { value: "conversational", label: "Conversational" },
  { value: "formal", label: "Formal" },
  { value: "narration", label: "Narration" },
  { value: "news", label: "News Anchor" },
  { value: "storytelling", label: "Storytelling" },
];

export default function VoicesPage() {
  const [voices, setVoices] = useState<VoiceProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showCloneWizard, setShowCloneWizard] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [newVoice, setNewVoice] = useState<CreateVoiceRequest>({
    name: "",
    settings: {
      speed: 1.0,
      pitch: 1.0,
      emotion: "neutral",
      style: "conversational",
    },
  });

  const fetchVoices = useCallback(async () => {
    try {
      const response = await api.get<VoiceProfile[]>("/api/voices");
      setVoices(Array.isArray(response.data) ? response.data : []);
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVoices();
  }, [fetchVoices]);

  const handleCreateVoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await api.post("/api/voices", newVoice);
      setDialogOpen(false);
      setNewVoice({
        name: "",
        settings: { speed: 1.0, pitch: 1.0, emotion: "neutral", style: "conversational" },
      });
      fetchVoices();
    } catch {
      // Handle error
    } finally {
      setIsCreating(false);
    }
  };

  const handlePreview = async (voice: VoiceProfile) => {
    if (previewingId === voice.id) {
      setPreviewingId(null);
      return;
    }
    setPreviewingId(voice.id);
    try {
      if (voice.preview_url) {
        const audio = new Audio(voice.preview_url);
        audio.addEventListener("ended", () => setPreviewingId(null));
        await audio.play();
      } else {
        // Trigger a preview via API
        await api.post(`/api/voices/${voice.id}/preview`);
        setTimeout(() => setPreviewingId(null), 3000);
      }
    } catch {
      setPreviewingId(null);
    }
  };

  const updateSettings = (updates: Partial<VoiceSettings>) => {
    setNewVoice({
      ...newVoice,
      settings: { ...newVoice.settings, ...updates },
    });
  };

  return (
    <div>
      <Header
        title="Voice Library"
        description="Manage built-in and custom voice profiles"
      >
        <Button
          variant="outline"
          onClick={() => setShowCloneWizard(!showCloneWizard)}
        >
          <Wand2 className="w-4 h-4" />
          Clone Voice
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button>
              <Plus className="w-4 h-4" />
              Create Custom Voice
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Custom Voice</DialogTitle>
              <DialogDescription>
                Configure a custom voice profile with your preferred settings.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateVoice} className="space-y-4">
              <Input
                label="Voice Name"
                placeholder="e.g., Professional Narrator"
                value={newVoice.name}
                onChange={(e) =>
                  setNewVoice({ ...newVoice, name: e.target.value })
                }
                required
              />

              {/* Speed Slider */}
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
                  Speed: {newVoice.settings.speed.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={newVoice.settings.speed}
                  onChange={(e) =>
                    updateSettings({ speed: parseFloat(e.target.value) })
                  }
                  className="w-full h-2 accent-primary-600"
                />
                <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  <span>0.5x</span>
                  <span>1.0x</span>
                  <span>2.0x</span>
                </div>
              </div>

              {/* Pitch Slider */}
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
                  Pitch: {newVoice.settings.pitch.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={newVoice.settings.pitch}
                  onChange={(e) =>
                    updateSettings({ pitch: parseFloat(e.target.value) })
                  }
                  className="w-full h-2 accent-secondary-600"
                />
                <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  <span>Low</span>
                  <span>Normal</span>
                  <span>High</span>
                </div>
              </div>

              <Select
                label="Emotion"
                options={emotionOptions}
                value={newVoice.settings.emotion}
                onChange={(value) => updateSettings({ emotion: value })}
              />

              <Select
                label="Style"
                options={styleOptions}
                value={newVoice.settings.style}
                onChange={(value) => updateSettings({ style: value })}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isCreating}>
                  Create Voice
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </Header>

      {/* Voice Clone Section */}
      {showCloneWizard && (
        <div className="mb-8">
          <VoiceCloneWizard
            onComplete={() => {
              setShowCloneWizard(false);
              fetchVoices();
            }}
          />
        </div>
      )}

      <VoiceCloneList />

      {/* Voice Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-[hsl(var(--muted))] rounded w-2/3 mb-3" />
                <div className="h-4 bg-[hsl(var(--muted))] rounded w-1/2 mb-4" />
                <div className="h-8 bg-[hsl(var(--muted))] rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : voices.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center">
            <Mic2 className="w-10 h-10 text-[hsl(var(--muted-foreground))]" />
          </div>
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">
            No voices available
          </h3>
          <p className="text-[hsl(var(--muted-foreground))] mb-6 max-w-sm mx-auto">
            Create a custom voice profile to get started, or voices will be
            loaded from the API.
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Create Your First Voice
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {voices.map((voice) => (
            <Card
              key={voice.id}
              className="hover:border-primary-300 dark:hover:border-primary-700 transition-all"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-[hsl(var(--foreground))]">
                      {voice.name}
                    </h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] capitalize mt-0.5">
                      {voice.gender} &middot; {voice.language}
                    </p>
                  </div>
                  <Badge
                    variant={voice.type === "built_in" ? "default" : "secondary"}
                  >
                    {voice.type === "built_in" ? "Built-in" : "Custom"}
                  </Badge>
                </div>

                {/* Settings summary */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                    <Volume2 className="w-3 h-3" />
                    Speed: {voice.settings.speed.toFixed(1)}x
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                    <Settings2 className="w-3 h-3" />
                    Pitch: {voice.settings.pitch.toFixed(1)}x
                  </div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] capitalize">
                    {voice.settings.emotion}
                  </div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] capitalize">
                    {voice.settings.style}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handlePreview(voice)}
                >
                  <Play
                    className={`w-3.5 h-3.5 ${
                      previewingId === voice.id ? "text-primary-600" : ""
                    }`}
                  />
                  {previewingId === voice.id ? "Playing..." : "Preview"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
