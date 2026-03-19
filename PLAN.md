# AI Podcast Generator — Full Feature Plan

## Overview

A full-stack AI-powered podcast creation platform that generates, edits, and produces professional-quality podcasts from minimal user input. Users provide a topic or source material, and the system generates a complete podcast — script, voices, music, and all.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React/Next.js)           │
│  Dashboard │ Script Editor │ Voice Studio │ Player   │
└──────────────────────┬──────────────────────────────┘
                       │ REST + WebSocket
┌──────────────────────▼──────────────────────────────┐
│                   Backend (Python/FastAPI)            │
│  Auth │ Projects │ Script Engine │ Audio Pipeline    │
└──┬───────┬────────────┬──────────────┬──────────────┘
   │       │            │              │
   ▼       ▼            ▼              ▼
  DB    LLM APIs    TTS Engine    Audio Processing
(Postgres) (Claude)  (Multi-voice)  (FFmpeg/pydub)
```

---

## Core Features

### 1. Script Generation Engine

- **Topic-to-Script**: User enters a topic, tone, and format → LLM generates a full podcast script
- **Source Ingestion**: Upload articles, PDFs, URLs, or notes as source material for script generation
- **Format Templates**: Solo monologue, two-host conversation, interview, panel discussion, narrative storytelling
- **Tone Controls**: Casual, professional, educational, comedic, debate-style
- **Length Targeting**: Generate scripts targeting specific durations (5 min, 15 min, 30 min, 60 min)
- **Segment Structure**: Auto-generate intro, segments, transitions, ad-break placeholders, outro

### 2. Full Script Editor

- **Rich Text Editor**: Block-based editor (like Notion) with speaker labels, stage directions, and timing markers
- **Speaker Assignment**: Assign and reassign speakers per line or block with drag-and-drop
- **Inline AI Assist**: Highlight any section → rewrite, expand, condense, change tone, or translate
- **Version History**: Full revision history with diff view and rollback
- **Timing Estimates**: Real-time word-count-to-duration estimates per segment and total
- **Collaboration**: Real-time multi-user editing with presence indicators and comments
- **Export**: Export scripts as PDF, DOCX, Fountain, or plain text

### 3. Voice Model System

- **Built-in Voice Library**: 20+ pre-built voices spanning gender, age, accent, and style
- **Custom Voice Cloning**: Upload 30s–5min of audio to clone a voice (with consent verification)
- **Voice Preview**: Audition any voice with sample text before committing
- **Voice Parameters**:
  - Speed (0.5x – 2.0x)
  - Pitch adjustment
  - Emotion/energy level (calm, neutral, energetic, excited)
  - Speaking style (conversational, formal, whisper, announcement)
- **Per-Line Voice Control**: Override voice settings on individual script lines for emphasis
- **Voice Profiles**: Save named voice configurations for reuse across episodes

### 4. Audio Production Pipeline

- **Multi-Voice TTS Rendering**: Render each speaker's lines with their assigned voice model
- **Auto-Mixing**: Automatically balance levels, normalize loudness (LUFS targeting), and apply EQ
- **Background Music**: Built-in royalty-free music library with auto-ducking under speech
- **Sound Effects**: SFX library for transitions, stingers, and ambient textures
- **Silence & Pacing**: Configurable pause lengths between speakers and segments
- **Audio Post-Processing**:
  - Noise reduction
  - De-essing
  - Compression
  - Limiting
  - Room tone matching

### 5. Project Management

- **Podcast Series**: Group episodes into series with consistent branding
- **Episode Dashboard**: Track episodes through statuses: Draft → Script → Recording → Editing → Published
- **Templates**: Save and reuse episode templates (format, voices, music, structure)
- **Asset Library**: Centralized storage for uploaded audio clips, music, and voice samples

---

## Advanced Features

### 6. Multi-Language Support

- Generate scripts in 20+ languages
- TTS voices for each supported language
- Auto-translate existing scripts between languages
- Bilingual episode support (e.g., alternating languages)

### 7. AI-Powered Enhancements

- **Show Notes Generator**: Auto-generate show notes, timestamps, and key takeaways
- **Transcript Generation**: Produce formatted transcripts synced to audio timestamps
- **SEO Metadata**: Auto-generate episode titles, descriptions, tags, and social media posts
- **Content Suggestions**: AI recommends follow-up topics based on episode content
- **Fact Checking**: Flag claims in the script that may need verification with source links
- **Audience Q&A Episodes**: Ingest listener questions and generate response segments

### 8. Podcast Distribution

- **RSS Feed Generation**: Auto-generate and host podcast RSS feeds
- **Platform Publishing**: One-click publish to Spotify, Apple Podcasts, Google Podcasts, YouTube
- **Embeddable Player**: Generate embed codes for websites and blogs
- **Analytics Dashboard**: Track downloads, listens, retention curves, and geographic distribution

### 9. Interactive Editing Timeline

- **Waveform Editor**: Visual timeline showing all tracks (speech, music, SFX) with drag-and-drop arrangement
- **Non-Destructive Editing**: Cut, trim, rearrange, and crossfade segments on the timeline
- **Marker System**: Add chapter markers, timestamps, and annotations on the timeline
- **Preview Playback**: Scrub and preview any section before final render

### 10. Monetization Tools

- **Dynamic Ad Insertion**: Mark ad slots in the script, auto-insert sponsor reads
- **Premium Content**: Gate episodes behind paywalls or subscription tiers
- **Sponsorship Manager**: Track sponsor reads, generate reports, manage ad inventory

---

## Technical Stack

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| State | Zustand |
| UI Components | shadcn/ui + Tailwind CSS |
| Script Editor | TipTap (ProseMirror-based) |
| Audio Player | WaveSurfer.js |
| Real-time | Socket.IO client |

### Backend
| Layer | Technology |
|-------|-----------|
| Framework | FastAPI (Python) |
| Language | Python 3.12 |
| Database | PostgreSQL + SQLAlchemy |
| Cache | Redis |
| Task Queue | Celery + Redis |
| WebSocket | Socket.IO |
| File Storage | S3-compatible (MinIO for dev) |

### AI & Audio
| Layer | Technology |
|-------|-----------|
| LLM | Claude API (script generation, AI features) |
| TTS | Coqui TTS / Bark / ElevenLabs API |
| Voice Cloning | Coqui TTS XTTS-v2 (open source) |
| Audio Processing | FFmpeg + pydub + librosa |
| Audio Normalization | pyloudnorm |

### Infrastructure
| Layer | Technology |
|-------|-----------|
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Auth | NextAuth.js + JWT |
| API Docs | OpenAPI / Swagger (auto-generated) |

---

## Data Models

### Core Entities

```
User
├── id, email, name, avatar, plan_tier
├── has_many: Podcasts, VoiceProfiles

Podcast (Series)
├── id, title, description, artwork, category, language
├── belongs_to: User
├── has_many: Episodes, Templates

Episode
├── id, title, status, format, target_duration
├── belongs_to: Podcast
├── has_one: Script
├── has_many: AudioTracks, PublishRecords

Script
├── id, version, content (JSON blocks), word_count, est_duration
├── belongs_to: Episode
├── has_many: ScriptRevisions, SpeakerAssignments

ScriptBlock
├── id, order, speaker_id, text, stage_direction, voice_overrides
├── belongs_to: Script

VoiceProfile
├── id, name, engine, model_id, settings (speed, pitch, emotion, style)
├── belongs_to: User (if custom) or System (if built-in)
├── has_one: ClonedVoiceSample (if cloned)

AudioTrack
├── id, type (speech|music|sfx), file_url, duration, position, volume
├── belongs_to: Episode

Template
├── id, name, format, default_voices, structure, music_config
├── belongs_to: Podcast
```

---

## Project Structure

```
Podcast/
├── frontend/                    # Next.js app
│   ├── src/
│   │   ├── app/                 # App router pages
│   │   │   ├── dashboard/
│   │   │   ├── editor/[episodeId]/
│   │   │   ├── voices/
│   │   │   ├── studio/[episodeId]/
│   │   │   └── settings/
│   │   ├── components/
│   │   │   ├── editor/          # Script editor components
│   │   │   ├── voices/          # Voice selection & config
│   │   │   ├── studio/          # Audio timeline & mixer
│   │   │   ├── player/          # Podcast player
│   │   │   └── ui/              # Shared UI (shadcn)
│   │   ├── hooks/
│   │   ├── stores/              # Zustand stores
│   │   ├── lib/                 # Utilities
│   │   └── types/
│   └── public/
├── backend/                     # FastAPI app
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── auth.py
│   │   │   │   ├── podcasts.py
│   │   │   │   ├── episodes.py
│   │   │   │   ├── scripts.py
│   │   │   │   ├── voices.py
│   │   │   │   ├── audio.py
│   │   │   │   └── publish.py
│   │   │   └── deps.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── celery_app.py
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── services/
│   │   │   ├── llm/             # Claude API integration
│   │   │   ├── tts/             # Voice synthesis
│   │   │   ├── audio/           # Audio processing
│   │   │   └── publish/         # Distribution
│   │   └── tasks/               # Celery async tasks
│   ├── migrations/              # Alembic
│   └── tests/
├── docker-compose.yml
├── PLAN.md
└── README.md
```

---

## Implementation Phases

### Phase 1 — Foundation (MVP)
- [ ] Project scaffolding (Next.js + FastAPI + Docker Compose)
- [ ] Database models and migrations
- [ ] User auth (sign up, login, sessions)
- [ ] Basic script generation from topic (Claude API)
- [ ] Simple script editor (plain text with speaker labels)
- [ ] 5 built-in TTS voices
- [ ] Single-voice audio rendering
- [ ] Basic audio player

### Phase 2 — Script Editor & Multi-Voice
- [ ] Block-based rich script editor (TipTap)
- [ ] Speaker assignment per block
- [ ] Inline AI rewrite/expand/condense
- [ ] Multi-voice TTS rendering
- [ ] Voice parameter controls (speed, pitch, emotion)
- [ ] Version history with diff view
- [ ] Timing estimates

### Phase 3 — Audio Production
- [ ] Full voice library (20+ voices)
- [ ] Background music library with auto-ducking
- [ ] Sound effects library
- [ ] Audio post-processing pipeline (normalize, compress, EQ)
- [ ] Interactive waveform timeline editor
- [ ] Non-destructive editing (cut, trim, crossfade)

### Phase 4 — Voice Cloning & Advanced AI
- [ ] Custom voice cloning (XTTS-v2)
- [ ] Consent verification workflow
- [ ] Show notes & transcript generation
- [ ] SEO metadata generation
- [ ] Fact-checking flags
- [ ] Content suggestions engine
- [ ] Multi-language script generation & TTS

### Phase 5 — Distribution & Monetization
- [ ] RSS feed generation
- [ ] One-click platform publishing
- [ ] Embeddable player widget
- [ ] Analytics dashboard
- [ ] Dynamic ad insertion
- [ ] Premium content gating
- [ ] Sponsorship manager

### Phase 6 — Collaboration & Scale
- [ ] Real-time multi-user editing
- [ ] Comments and annotations
- [ ] Team workspaces
- [ ] API access for integrations
- [ ] Webhook support
- [ ] Rate limiting and usage quotas

---

## API Endpoints (Phase 1–2)

```
Auth
  POST   /api/auth/register
  POST   /api/auth/login
  POST   /api/auth/refresh
  GET    /api/auth/me

Podcasts
  GET    /api/podcasts
  POST   /api/podcasts
  GET    /api/podcasts/:id
  PUT    /api/podcasts/:id
  DELETE /api/podcasts/:id

Episodes
  GET    /api/podcasts/:id/episodes
  POST   /api/podcasts/:id/episodes
  GET    /api/episodes/:id
  PUT    /api/episodes/:id
  DELETE /api/episodes/:id

Scripts
  GET    /api/episodes/:id/script
  PUT    /api/episodes/:id/script
  POST   /api/episodes/:id/script/generate     # AI generation
  POST   /api/episodes/:id/script/rewrite      # AI rewrite section
  GET    /api/episodes/:id/script/revisions
  POST   /api/episodes/:id/script/revisions/:rev/restore

Voices
  GET    /api/voices                            # List all available
  GET    /api/voices/builtin                    # System voices
  GET    /api/voices/custom                     # User's custom voices
  POST   /api/voices/custom                     # Create custom voice
  POST   /api/voices/preview                    # Preview TTS
  DELETE /api/voices/custom/:id

Audio
  POST   /api/episodes/:id/render              # Start TTS render
  GET    /api/episodes/:id/render/status        # Check render progress
  GET    /api/episodes/:id/audio                # Get rendered audio
  POST   /api/episodes/:id/audio/mix            # Final mix with music/SFX
```

---

## Key Design Decisions

1. **TipTap for Script Editor** — ProseMirror-based, extensible, supports custom blocks for speaker labels and stage directions. Collaborative editing ready via Y.js.

2. **Celery for Audio Tasks** — TTS rendering and audio processing are CPU-intensive and long-running. Celery workers handle these async with progress reporting via WebSocket.

3. **Coqui XTTS-v2 for Voice Cloning** — Open-source, runs locally, no per-request API costs. ElevenLabs as optional premium tier for higher quality.

4. **Block-Based Script Storage** — Scripts stored as ordered JSON blocks rather than flat text. Each block has its own speaker, voice overrides, and metadata. Enables granular editing and per-block TTS rendering.

5. **Non-Destructive Audio Pipeline** — Source TTS audio is never modified. All edits are stored as a project file (cuts, positions, fades) and rendered on export. Allows unlimited undo.
