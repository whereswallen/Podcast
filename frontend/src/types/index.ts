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
