# AI Podcast Generator

AI-powered podcast creation platform. Generate scripts, assign voices, and produce professional podcasts.

## Quick Start

```bash
# 1. Copy environment file
cp backend/.env.example backend/.env
# Edit backend/.env with your ANTHROPIC_API_KEY

# 2. Start all services
docker compose up -d

# 3. Run database migrations
docker compose exec backend alembic upgrade head

# 4. Open the app
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000/docs
# MinIO Console: http://localhost:9001
```

## Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Zustand, TipTap, WaveSurfer.js
- **Backend**: FastAPI, SQLAlchemy, Celery, PostgreSQL, Redis
- **AI**: Claude API (script generation), Coqui TTS (voice synthesis)
- **Storage**: MinIO (S3-compatible)

## Development

```bash
# Backend only
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload

# Frontend only
cd frontend && npm install && npm run dev
```
