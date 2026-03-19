# CastNode AI — Product Description

## Brand Identity

**Product Name:** CastNode
**Domain:** castnode.ai
**Tagline:** Create Professional Podcasts with AI
**Name Concept:** "Cast" (broadcast/podcast) + "Node" (AI network/connection point)

---

## One-Liner

CastNode is an AI-powered podcast production platform that turns a topic into a fully produced, studio-quality podcast episode — no microphone, no editing skills, no recording studio required.

---

## The Problem

Creating a podcast today requires:

- **Writing skills** — scripting engaging content that holds attention for 15-60 minutes
- **Recording equipment** — microphones, audio interfaces, soundproofing
- **Voice talent** — finding and paying hosts, co-hosts, or narrators
- **Audio engineering** — mixing speech, music, and effects into a polished final product
- **Ongoing effort** — repeating this entire process every single week

The result: most aspiring podcasters never launch. Those who do often burn out within the first 10 episodes. The barrier to entry is too high and the production workload is too relentless.

---

## The Solution

CastNode collapses the entire podcast production pipeline into a single AI-powered platform. Users provide a topic. CastNode delivers a finished episode.

### How It Works

```
Topic → AI Script → Voice Synthesis → Audio Mix → Published Episode
```

1. **Enter a topic** — describe what the episode should cover
2. **AI writes the script** — Claude generates a complete podcast script with natural dialogue, pacing, and structure
3. **Choose voices** — pick from 50+ built-in AI voices or clone your own
4. **Auto-produce** — CastNode renders speech, layers in music and sound effects, normalizes audio, and exports a broadcast-ready file
5. **Publish** — download or distribute your finished episode

Total time from idea to finished episode: **minutes, not days**.

---

## Core Product Features

### 1. AI Script Generation Engine

The heart of CastNode. Powered by Anthropic's Claude API, the script engine generates complete podcast scripts from minimal input.

**What makes it different:**

- **5 podcast formats** — solo monologue, two-host conversation, interview, panel discussion, narrative storytelling
- **Smart structure** — automatically generates intro, body segments, transitions, and outro
- **Duration targeting** — specify 5, 15, 30, or 60 minutes and the AI calibrates script length accordingly
- **Block-based architecture** — scripts are structured as ordered blocks, each with speaker assignment, timing metadata, and individual voice controls
- **Knowledge-aware generation** — the Knowledge Base prevents the AI from repeating topics, recycling talking points, or retreading ground covered in previous episodes

**Credit cost:** 10 credits per generation

---

### 2. Script Editor

A professional block-based editor built on TipTap (ProseMirror) for fine-grained control over every line.

**Capabilities:**

- **Per-block editing** — each script block has its own speaker, text content, and stage directions
- **Inline AI rewrite** — highlight any section, right-click, and choose: rewrite, expand, condense, change tone, or simplify (2 credits)
- **Block-level AI rewrite** — regenerate entire blocks with context awareness (5 credits)
- **Timing estimates** — real-time word count and estimated duration per block and total
- **Version history** — full revision tracking with one-click rollback to any previous version
- **Visual timing bar** — see at a glance how long each section will run

---

### 3. Voice System

CastNode's voice engine gives every podcast a unique sonic identity.

**Built-in Voice Library:**
- 50+ pre-built TTS voices spanning gender, age, accent, and speaking style
- Powered by Google Text-to-Speech with customizable parameters
- Per-voice controls: speed (0.5x–2.0x), pitch adjustment, emotion level, speaking style

**Voice Cloning:**
- Upload 30 seconds to 5 minutes of audio to clone any voice
- Built-in consent verification workflow (name, email, explicit consent statement) to ensure ethical use
- Multi-step process: upload samples → verify consent → train model → use in episodes
- Progress tracking with real-time status updates
- Cloned voices are private to the user's account

**Voice Profiles:**
- Save named voice configurations for reuse across episodes
- Assign default voices by role (host, co-host, narrator, guest) in Brand Profile
- Override voice settings on individual script blocks for emphasis or character shifts

---

### 4. Audio Production Studio

A timeline-based audio mixer that produces broadcast-ready output.

**Multi-Track Mixing:**
- **Speech track** — rendered from script via TTS engine
- **Music track** — background music from the built-in licensed music library
- **SFX track** — sound effects, transitions, stingers, ambient textures from the SFX library (1,000+ effects)

**Track Controls:**
- Volume, pan, mute, solo per track
- Segment-level trim, fade-in/fade-out, volume adjustments
- Master volume control
- 44.1kHz sample rate output

**Rendering:**
- Async audio rendering via Celery worker queue
- Real-time status polling during render
- Waveform visualization via WaveSurfer.js
- Download finished audio files from S3/MinIO storage

---

### 5. Brand & Identity System

Maintain a consistent podcast identity across every episode.

**Brand Profile (per podcast):**
- Show name, tagline, personality description
- Target audience definition
- Tone guidelines (e.g., "conversational but authoritative")
- Key themes and vocabulary
- Content rules ("never discuss competitors by name")
- Brand colors for visual consistency
- Default voice assignments by speaker role
- Default music and SFX selections

**AI Brand Generation:**
- Auto-generate a complete brand profile from your podcast title and description (3 credits)
- Brand context is fed into script generation to ensure every episode matches your voice

**Intro/Outro Templates:**
- Create reusable intro and outro scripts with dynamic variables: `{{episode_title}}`, `{{topic}}`, `{{guest_name}}`, `{{date}}`
- Assign specific voices, music, and SFX to each template
- Set a default template that auto-applies to every new episode
- AI-generated templates based on your brand profile (3 credits)

---

### 6. Knowledge Management

A per-podcast knowledge base that makes your AI smarter over time.

**Entry Types:**
| Type | Purpose |
|------|---------|
| `episode_summary` | What was covered in past episodes |
| `topic` | Subject areas the podcast focuses on |
| `guest` | Guest bios and previous appearances |
| `segment_template` | Reusable segment structures |
| `source_material` | Reference material for fact-based content |
| `key_fact` | Important data points to reference or avoid |
| `note` | Free-form context for the AI |
| `business_context` | Sponsorship, partnership, or business constraints |

**Revisit Controls:**
- **Never** — don't repeat this topic (the AI actively avoids it)
- **Brief** — optionally recap in passing
- **Recurring** — core theme that should appear regularly

**Automation:**
- Auto-summarize episode scripts into knowledge entries
- Tag-based organization and full-text search
- Knowledge context is injected into every AI generation call

---

### 7. AI Content Tools

One-click AI tools that generate everything around the episode.

| Tool | Output | Credits |
|------|--------|---------|
| **Show Notes** | Summary, key takeaways, timestamps, resources, guest list, notable quotes | 3 |
| **Transcript** | Formatted transcript with speaker labels and timestamps | 2 |
| **SEO Metadata** | SEO title, meta description, tags, Twitter post, LinkedIn post | 2 |
| **Fact-Check** | Claims flagged for verification with severity levels and source suggestions | 5 |
| **Content Suggestions** | AI-generated topic ideas based on podcast history and trends | 3 |
| **Translation** | Full script translation into 8 major languages | 8 |
| **Inline Rewrite** | Rewrite highlighted text with AI assistance | 2 |

---

### 8. Credit-Based Pricing

A usage-based model that scales with the creator.

| Plan | Price | Monthly Credits | Podcasts | Episodes/Podcast |
|------|-------|----------------|----------|------------------|
| **Free** | $0 | 50 | 2 | 5 |
| **Pro** | $19/mo | 500 | 10 | 50 |
| **Enterprise** | $49/mo | 2,000 (+ 1,000 rollover cap) | Unlimited | Unlimited |

**Credit System Details:**
- Credits deducted only on successful AI operations (failed calls never burn credits)
- Daily spending cap to prevent accidental overuse
- Bonus credits from promotions or admin grants
- Full transaction audit log with operation details
- Credit pack purchases available (100 credits per pack at discounted rate)
- Low-balance warnings and confirmation dialogs before expensive operations

**Payment Infrastructure:**
- Stripe Checkout for subscription upgrades
- Stripe Customer Portal for self-service subscription management
- Stripe Webhooks for real-time subscription event handling
- One-time credit pack purchases via Stripe

---

### 9. Admin Panel

Platform management tools for operators.

- **Dashboard** — total users, podcasts, episodes, auth provider breakdown, plan tier distribution
- **User Management** — search/filter users, change plans, grant credits, toggle admin status, activate/deactivate accounts
- **Content Moderation** — browse all podcasts and episodes across the platform
- **Analytics** — platform-wide usage metrics and trends

---

### 10. Authentication & Security

- Email/password registration with bcrypt hashing
- Google OAuth integration (one-click sign in)
- GitHub OAuth integration (one-click sign in)
- JWT-based session management
- Role-based access control (user vs. admin)
- First registered user automatically promoted to admin
- Provider-agnostic user model (same user can link multiple auth methods)

---

## Technical Architecture

```
┌──────────────────────────────────────────────────────────────┐
│              Frontend — Next.js 14 / React 18                │
│   Dashboard │ Script Editor │ Audio Studio │ Voice Manager   │
│   Brand Editor │ Knowledge Base │ Admin Panel │ Billing      │
└──────────────────────────┬───────────────────────────────────┘
                           │ REST API (Axios)
┌──────────────────────────▼───────────────────────────────────┐
│              Backend — FastAPI / Python                       │
│   17 Route Modules │ 12 Models │ 10+ Services │ Celery Tasks │
└───┬──────────┬─────────────┬──────────────┬──────────────────┘
    │          │             │              │
    ▼          ▼             ▼              ▼
PostgreSQL   Redis      Claude API     AWS S3 / MinIO
  (data)   (cache +      (AI/LLM)      (media files)
           task queue)
                 │
                 ▼
            Celery Workers
         (audio rendering)
```

**Frontend Stack:**
Next.js 14 (App Router), TypeScript 5.3, Tailwind CSS 3.4, Zustand (state), TipTap (editor), WaveSurfer.js (waveforms), Framer Motion (animations), Recharts (analytics), cmdk (command palette), Sonner (toasts), Shadcn/UI (components)

**Backend Stack:**
FastAPI 0.109, SQLAlchemy 2.0, Celery 5.3, Alembic (migrations), python-jose (JWT), Authlib (OAuth), Pydantic 2.5, httpx (async HTTP), gTTS (TTS), pydub + pyloudnorm + scipy (audio), Stripe SDK (payments), boto3 (S3)

**Infrastructure:**
Docker Compose with 6 services: PostgreSQL 16, Redis 7, MinIO, FastAPI (Uvicorn), Celery Worker, Next.js Frontend

---

## Codebase at a Glance

| Metric | Count |
|--------|-------|
| Total source files | 139 |
| Backend Python files | 63 |
| Frontend TypeScript/TSX files | 76 |
| API route modules | 17 |
| API endpoints | 60+ |
| Database models | 12 |
| Frontend pages | 17 |
| UI components | 42 |
| State stores | 10 |

---

## Logo & Visual Identity Brief

**Current State:** Placeholder — Lucide `Mic2` icon in a gradient rounded box

**Current Visual Language:**
- Primary gradient: blue-purple (`primary-500` → `secondary-600`)
- Admin variant: amber gradient with Shield icon
- Rounded corners: `rounded-lg` (8px) at 32x32, `rounded-xl` (12px) at 40x40
- White icon on gradient background
- Text wordmark: gradient `from-primary-600 to-secondary-600` with `bg-clip-text text-transparent`

**Logo Placement in App:**
| Location | Size | Shape | Notes |
|----------|------|-------|-------|
| Sidebar | 32x32 | rounded-lg | Paired with "CastNode" wordmark |
| Mobile Nav | 32x32 | rounded-lg | Same as sidebar |
| Auth Pages | 40x40 | rounded-xl | Larger, centered above form |
| Landing Nav | 32x32 | rounded-lg | With gradient text wordmark |
| Landing Footer | 24x24 | rounded | Compact, with plain text |
| Admin Sidebar | 32x32 | rounded-lg | Amber variant with "Admin" label |

**Logo Requirements:**
- Must work at 24px, 32px, and 40px
- Needs to read clearly on both light and dark backgrounds
- Should convey: AI + podcasting + professional quality
- Concept direction: the intersection of a microphone/audio waveform with a neural network node
- Primary brand colors: blue-purple gradient
- File formats needed: SVG (for inline component), PNG (for favicons/social), ICO (for browser tab)

**Name Breakdown for Designers:**
- **Cast** — broadcasting, podcasting, casting a voice
- **Node** — a connection point in a network, evoking AI neural networks, a hub where content connects

---

## Target Audience

1. **Content creators** who want a podcast but lack recording setup or audio skills
2. **Marketers & businesses** who need branded audio content at scale
3. **Educators** producing lecture-style or educational audio content
4. **Solo entrepreneurs** who want a professional podcast presence without a production team
5. **Agencies** managing multiple podcast brands for clients

---

## Competitive Positioning

CastNode is not a recording tool. It is not an editing tool. It is a **generation tool**.

Traditional podcast tools (Riverside, Descript, Anchor) assume you already have audio to work with. CastNode starts from zero — from a topic or an idea — and produces a complete episode. The closest comparison would be if Descript, ElevenLabs, and ChatGPT had a baby that was purpose-built for podcasting.

**Key differentiators:**
- End-to-end: topic → script → voices → mixed audio → published episode
- Knowledge base prevents AI from repeating itself across episodes
- Brand profile ensures consistent voice and tone
- Credit-based pricing (pay for what you use, not a flat seat fee)
- Voice cloning with built-in consent verification
- Full audio mixing studio, not just raw TTS output
