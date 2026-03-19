"use client";

import { useState, useRef } from "react";
import {
  Upload,
  Mic2,
  Play,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileAudio,
  Zap,
} from "lucide-react";
import { useVoiceCloneStore } from "@/stores/voiceClone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { VoiceCloneJob, VoiceCloneTrainRequest } from "@/types";

const emotionOptions = [
  { value: "neutral", label: "Neutral" },
  { value: "warm", label: "Warm" },
  { value: "energetic", label: "Energetic" },
  { value: "calm", label: "Calm" },
  { value: "authoritative", label: "Authoritative" },
  { value: "cheerful", label: "Cheerful" },
];

const styleOptions = [
  { value: "conversational", label: "Conversational" },
  { value: "professional", label: "Professional" },
  { value: "storytelling", label: "Storytelling" },
  { value: "news", label: "News Anchor" },
  { value: "educational", label: "Educational" },
  { value: "documentary", label: "Documentary" },
];

interface VoiceCloneWizardProps {
  onComplete?: () => void;
}

type WizardStep = "name" | "upload" | "configure" | "complete";

export function VoiceCloneWizard({ onComplete }: VoiceCloneWizardProps) {
  const {
    activeJob,
    isUploading,
    isTraining,
    error,
    createJob,
    uploadSample,
    trainVoice,
  } = useVoiceCloneStore();

  const [step, setStep] = useState<WizardStep>("name");
  const [voiceName, setVoiceName] = useState("");
  const [trainConfig, setTrainConfig] = useState<VoiceCloneTrainRequest>({
    speed: 1.0,
    pitch: 0.0,
    emotion: "neutral",
    style: "conversational",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = async () => {
    if (!voiceName.trim()) return;
    const job = await createJob(voiceName);
    if (job) {
      setStep("upload");
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !activeJob) return;

    for (let i = 0; i < files.length; i++) {
      await uploadSample(activeJob.id, files[i]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleTrain = async () => {
    if (!activeJob) return;
    await trainVoice(activeJob.id, trainConfig);
    setStep("complete");
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const statusBadge = (status: string) => {
    const map: Record<string, "default" | "secondary" | "warning" | "success" | "destructive"> = {
      pending: "default",
      uploading: "secondary",
      processing: "warning",
      training: "warning",
      ready: "success",
      failed: "destructive",
    };
    return <Badge variant={map[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Step 1: Name */}
      {step === "name" && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <Mic2 className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                  Clone a Voice
                </h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Create a custom voice from audio samples
                </p>
              </div>
            </div>

            <Input
              label="Voice Name"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              placeholder="e.g., My Voice, CEO Voice, Narrator..."
            />

            <Button
              onClick={handleCreate}
              disabled={!voiceName.trim()}
              className="w-full"
            >
              <Zap className="w-4 h-4" />
              Start Voice Clone
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Upload */}
      {step === "upload" && activeJob && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                Upload Audio Samples
              </h3>
              {statusBadge(activeJob.status)}
            </div>

            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Upload clear audio recordings of the voice you want to clone.
              More samples = better quality. Minimum 10 seconds total.
            </p>

            {/* Upload zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[hsl(var(--border))] rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 dark:hover:bg-primary-950/10 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              {isUploading ? (
                <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-primary-600" />
              ) : (
                <Upload className="w-8 h-8 mx-auto mb-3 text-[hsl(var(--muted-foreground))]" />
              )}
              <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                {isUploading ? "Uploading..." : "Click to upload audio files"}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                MP3, WAV, OGG, FLAC, M4A (max 50MB each)
              </p>
            </div>

            {/* Uploaded samples */}
            {activeJob.sample_urls.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                  Uploaded Samples ({activeJob.sample_urls.length})
                </p>
                {activeJob.sample_urls.map((url, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 rounded-md bg-[hsl(var(--muted))]"
                  >
                    <FileAudio className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    <span className="text-xs text-[hsl(var(--foreground))] truncate flex-1">
                      Sample {i + 1}
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                ))}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[hsl(var(--muted-foreground))]">
                    Total duration:
                  </span>
                  <span
                    className={`font-medium ${
                      activeJob.total_duration_seconds >= 10
                        ? "text-green-600"
                        : "text-amber-600"
                    }`}
                  >
                    {formatDuration(activeJob.total_duration_seconds)}
                  </span>
                  {activeJob.total_duration_seconds < 10 && (
                    <span className="text-xs text-amber-600">
                      (need at least 10s)
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("name")}
              >
                Back
              </Button>
              <Button
                onClick={() => setStep("configure")}
                disabled={
                  activeJob.sample_urls.length === 0 ||
                  activeJob.total_duration_seconds < 10
                }
                className="flex-1"
              >
                Next: Configure Voice
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Configure */}
      {step === "configure" && activeJob && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
              Configure Voice Settings
            </h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Fine-tune the cloned voice characteristics. These settings adjust
              how the voice is synthesized.
            </p>

            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
                Speed: {trainConfig.speed.toFixed(1)}x
              </label>
              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.1}
                value={trainConfig.speed}
                onChange={(e) =>
                  setTrainConfig({
                    ...trainConfig,
                    speed: parseFloat(e.target.value),
                  })
                }
                className="w-full h-2 accent-primary-600"
              />
              <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))] mt-1">
                <span>Slow (0.5x)</span>
                <span>Normal (1.0x)</span>
                <span>Fast (2.0x)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
                Pitch: {trainConfig.pitch > 0 ? "+" : ""}
                {trainConfig.pitch.toFixed(1)}
              </label>
              <input
                type="range"
                min={-0.5}
                max={0.5}
                step={0.05}
                value={trainConfig.pitch}
                onChange={(e) =>
                  setTrainConfig({
                    ...trainConfig,
                    pitch: parseFloat(e.target.value),
                  })
                }
                className="w-full h-2 accent-secondary-600"
              />
              <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))] mt-1">
                <span>Lower</span>
                <span>Natural</span>
                <span>Higher</span>
              </div>
            </div>

            <Select
              label="Emotion"
              options={emotionOptions}
              value={trainConfig.emotion}
              onChange={(value) =>
                setTrainConfig({ ...trainConfig, emotion: value })
              }
            />

            <Select
              label="Style"
              options={styleOptions}
              value={trainConfig.style}
              onChange={(value) =>
                setTrainConfig({ ...trainConfig, style: value })
              }
            />

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button
                onClick={handleTrain}
                disabled={isTraining}
                className="flex-1"
              >
                {isTraining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Training...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Create Cloned Voice
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Complete */}
      {step === "complete" && activeJob && (
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
              Voice Cloned Successfully!
            </h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              &quot;{activeJob.name}&quot; is now available in your voice
              library. You can use it when generating podcast scripts.
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("name");
                  setVoiceName("");
                }}
              >
                Clone Another Voice
              </Button>
              <Button onClick={onComplete}>Done</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
