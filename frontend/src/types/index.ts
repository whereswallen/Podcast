// ---- User ----
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// ---- Auth ----
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ---- Podcast ----
export interface Podcast {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  language: string;
  cover_image_url?: string;
  episode_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePodcastRequest {
  title: string;
  description: string;
  category: string;
  language: string;
}

export interface UpdatePodcastRequest {
  title?: string;
  description?: string;
  category?: string;
  language?: string;
}

// ---- Episode ----
export type EpisodeFormat =
  | "solo"
  | "conversation"
  | "interview"
  | "panel"
  | "narrative";

export type EpisodeStatus = "draft" | "scripted" | "rendering" | "rendered" | "published";

export interface Episode {
  id: string;
  podcast_id: string;
  title: string;
  description?: string;
  format: EpisodeFormat;
  status: EpisodeStatus;
  target_duration: number;
  actual_duration?: number;
  audio_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEpisodeRequest {
  title: string;
  format: EpisodeFormat;
  target_duration: number;
  description?: string;
}

// ---- Script ----
export interface ScriptBlock {
  id: string;
  order: number;
  speaker: string;
  text: string;
  stage_direction?: string;
  voice_id?: string;
}

export interface Script {
  id: string;
  episode_id: string;
  blocks: ScriptBlock[];
  version: number;
  created_at: string;
  updated_at: string;
}

export interface SaveScriptRequest {
  blocks: Omit<ScriptBlock, "id">[];
}

export interface GenerateScriptRequest {
  topic: string;
  format: EpisodeFormat;
  tone: "casual" | "professional" | "educational" | "comedic";
  target_duration?: number;
  source_material?: string;
}

export interface GenerateScriptResponse {
  script: Script;
}

// ---- Voice ----
export type VoiceType = "built_in" | "custom";

export interface VoiceSettings {
  speed: number;
  pitch: number;
  emotion: string;
  style: string;
}

export interface VoiceProfile {
  id: string;
  user_id?: string;
  name: string;
  type: VoiceType;
  language: string;
  gender: string;
  preview_url?: string;
  settings: VoiceSettings;
  created_at: string;
  updated_at: string;
}

export interface CreateVoiceRequest {
  name: string;
  settings: VoiceSettings;
}

// ---- Render ----
export type RenderStatus = "idle" | "queued" | "rendering" | "completed" | "failed";

export interface RenderJob {
  id: string;
  episode_id: string;
  status: RenderStatus;
  progress: number;
  audio_url?: string;
  error?: string;
  created_at: string;
  updated_at: string;
}

// ---- API Response wrappers ----
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface ApiError {
  detail: string;
}

// ---- Script Revision ----
export interface ScriptRevision {
  id: string;
  script_id: string;
  version: number;
  content: ScriptBlock[];
  created_at: string;
}

// ---- AI Inline ----
export interface InlineRewriteRequest {
  text: string;
  instruction: string;
  context?: string;
}

export interface InlineRewriteResponse {
  text: string;
}

// ---- Audio Project / Timeline ----
export interface TrackSegment {
  id: string;
  start_ms: number;
  end_ms: number;
  source_url?: string;
  source_type: "speech" | "music" | "sfx";
  trim_start_ms: number;
  trim_end_ms: number;
  fade_in_ms: number;
  fade_out_ms: number;
  volume_db: number;
}

export interface Track {
  id: string;
  type: "speech" | "music" | "sfx";
  name: string;
  segments: TrackSegment[];
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
}

export interface AudioProject {
  id: string;
  episode_id: string;
  tracks: Track[];
  master_volume: number;
  duration_ms: number;
}

export interface MusicItem {
  id: string;
  name: string;
  category: string;
  bpm: number;
  duration: number;
  mood: string;
}

export interface SFXItem {
  id: string;
  name: string;
  category: string;
  duration_ms: number;
}

// ---- Brand Profile ----
export interface BrandProfile {
  id: string;
  podcast_id: string;
  show_name?: string;
  tagline?: string;
  personality?: string;
  target_audience?: string;
  tone_guidelines?: { do: string[]; dont: string[] };
  key_themes?: string[];
  vocabulary?: string[];
  content_rules?: string;
  default_voice_assignments?: Record<string, string>;
  default_music_id?: string;
  default_sfx_ids?: string[];
  brand_colors?: { primary?: string; secondary?: string };
  created_at: string;
  updated_at: string;
}

export interface BrandProfileUpdate {
  show_name?: string;
  tagline?: string;
  personality?: string;
  target_audience?: string;
  tone_guidelines?: { do: string[]; dont: string[] };
  key_themes?: string[];
  vocabulary?: string[];
  content_rules?: string;
  default_voice_assignments?: Record<string, string>;
  default_music_id?: string;
  default_sfx_ids?: string[];
  brand_colors?: { primary?: string; secondary?: string };
}

// ---- Intro/Outro Templates ----
export interface IntroOutroTemplate {
  id: string;
  podcast_id: string;
  type: "intro" | "outro";
  name: string;
  script_template: string;
  speaker_id?: string;
  voice_id?: string;
  music_id?: string;
  sfx_id?: string;
  duration_target?: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface IntroOutroCreateRequest {
  type: "intro" | "outro";
  name: string;
  script_template: string;
  speaker_id?: string;
  voice_id?: string;
  music_id?: string;
  sfx_id?: string;
  duration_target?: number;
  is_default?: boolean;
}

// ---- Knowledge Base ----
export type KnowledgeEntryType =
  | "episode_summary"
  | "topic"
  | "guest"
  | "segment_template"
  | "source_material"
  | "key_fact"
  | "note"
  | "business_context";

export type RevisitLevel = "never" | "brief" | "recurring";

export interface KnowledgeEntry {
  id: string;
  podcast_id: string;
  episode_id?: string;
  entry_type: KnowledgeEntryType;
  title: string;
  content?: string;
  tags?: string[];
  metadata_?: Record<string, unknown>;
  revisit: RevisitLevel;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeEntryCreateRequest {
  entry_type: KnowledgeEntryType;
  title: string;
  content?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  revisit?: RevisitLevel;
  episode_id?: string;
}

export interface KnowledgeContext {
  never_repeat: string[];
  brief_recap: string[];
  recurring: string[];
  total_entries: number;
}

// ---- Voice Cloning ----
export type CloneJobStatus = "pending" | "uploading" | "processing" | "training" | "ready" | "failed";

export interface VoiceCloneJob {
  id: string;
  user_id: string;
  voice_profile_id?: string;
  name: string;
  status: CloneJobStatus;
  sample_urls: string[];
  total_duration_seconds: number;
  training_config?: Record<string, unknown>;
  error_message?: string;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface VoiceCloneCreateRequest {
  name: string;
  description?: string;
}

export interface VoiceCloneTrainRequest {
  speed: number;
  pitch: number;
  emotion: string;
  style: string;
}
