import json
import logging
from uuid import UUID

import anthropic
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.brand import BrandProfile
from app.models.episode import Episode
from app.models.knowledge import KnowledgeEntry
from app.models.script import Script

logger = logging.getLogger(__name__)


class KnowledgeService:
    def __init__(self) -> None:
        self.client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    async def auto_summarize_episode(
        self, podcast_id: UUID, episode_id: UUID, db: Session
    ) -> list[KnowledgeEntry]:
        """Extract knowledge entries from an episode's script as individual bullet points."""
        episode = db.query(Episode).filter(Episode.id == episode_id).first()
        if not episode:
            raise ValueError(f"Episode {episode_id} not found")

        script = db.query(Script).filter(Script.episode_id == episode_id).first()
        if not script or not script.content:
            raise ValueError(f"No script content for episode {episode_id}")

        # Build script text from blocks
        script_text = ""
        for block in script.content:
            speaker = block.get("speaker_name", "Speaker")
            text = block.get("text", "")
            script_text += f"{speaker}: {text}\n\n"

        # Get brand key themes for auto-tagging revisit levels
        brand = db.query(BrandProfile).filter(BrandProfile.podcast_id == podcast_id).first()
        key_themes = brand.key_themes if brand and brand.key_themes else []

        prompt = f"""Analyze this podcast episode script and extract knowledge as individual bullet points.

Episode Title: {episode.title}
Episode Format: {episode.format}

Script:
{script_text[:8000]}

Extract the following as separate JSON objects in an array:
1. ONE episode summary (entry_type: "episode_summary") - a single sentence summarizing the whole episode
2. Key topics covered (entry_type: "topic") - one entry per distinct topic, each a brief bullet
3. Key facts or positions stated (entry_type: "key_fact") - one per fact/position
4. Guest information if any (entry_type: "guest") - one per guest mentioned

Each object must have:
- "entry_type": one of "episode_summary", "topic", "key_fact", "guest"
- "title": short bullet-point label (under 100 chars)
- "content": 1-2 sentence expansion (optional, can be null)
- "tags": array of relevant keyword tags

{f'The show has these key themes: {json.dumps(key_themes)}. Mark entries related to these themes with "revisit": "brief" instead of "never".' if key_themes else ''}

Output ONLY a JSON array. No markdown, no code fences."""

        message = await self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            system="You are a podcast content analyst. Extract structured knowledge from scripts. Output only valid JSON arrays.",
            messages=[{"role": "user", "content": prompt}],
        )

        response_text = message.content[0].text.strip()
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            response_text = "\n".join(lines)

        extracted = json.loads(response_text)

        # Remove any existing auto-generated entries for this episode
        db.query(KnowledgeEntry).filter(
            KnowledgeEntry.podcast_id == podcast_id,
            KnowledgeEntry.episode_id == episode_id,
        ).delete(synchronize_session="fetch")

        created_entries = []
        for item in extracted:
            entry_type = item.get("entry_type", "note")
            # Determine revisit level
            revisit = item.get("revisit", "never")
            if entry_type == "guest":
                revisit = "brief"  # Guests can always be referenced again

            entry = KnowledgeEntry(
                podcast_id=podcast_id,
                episode_id=episode_id,
                entry_type=entry_type,
                title=item.get("title", "Untitled"),
                content=item.get("content"),
                tags=item.get("tags", []),
                metadata_={"episode_title": episode.title, "episode_format": episode.format},
                revisit=revisit,
            )
            db.add(entry)
            created_entries.append(entry)

        db.commit()
        for entry in created_entries:
            db.refresh(entry)

        logger.info(
            f"Auto-summarized episode {episode_id}: created {len(created_entries)} knowledge entries"
        )
        return created_entries

    def get_context_for_generation(
        self, podcast_id: UUID, db: Session, topic: str | None = None
    ) -> dict:
        """Build knowledge context grouped by revisit level for injection into script generation."""
        entries = (
            db.query(KnowledgeEntry)
            .filter(
                KnowledgeEntry.podcast_id == podcast_id,
                KnowledgeEntry.is_active.is_(True),
            )
            .order_by(KnowledgeEntry.created_at.desc())
            .all()
        )

        never_repeat: list[str] = []
        brief_recap: list[str] = []
        recurring: list[str] = []
        listener_feedback: list[str] = []

        for entry in entries:
            bullet = entry.title
            if entry.content:
                bullet += f" — {entry.content[:200]}"

            # Listener feedback gets its own bucket regardless of revisit level
            if entry.entry_type == "listener_feedback":
                listener_feedback.append(bullet)
            elif entry.revisit == "never":
                never_repeat.append(bullet)
            elif entry.revisit == "brief":
                brief_recap.append(bullet)
            elif entry.revisit == "recurring":
                recurring.append(bullet)

        return {
            "never_repeat": never_repeat,
            "brief_recap": brief_recap,
            "recurring": recurring,
            "listener_feedback": listener_feedback,
            "total_entries": len(entries),
        }
