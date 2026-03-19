"""AI-powered content tools for podcast episodes.

Provides: show notes, transcript, SEO metadata, fact-checking,
content suggestions, and multi-language support.
"""

import json
import logging

import anthropic

from app.core.config import settings

logger = logging.getLogger(__name__)

SUPPORTED_LANGUAGES = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "pt": "Portuguese",
    "it": "Italian",
    "nl": "Dutch",
    "pl": "Polish",
    "ru": "Russian",
    "ja": "Japanese",
    "zh": "Chinese (Simplified)",
    "ko": "Korean",
    "ar": "Arabic",
    "hi": "Hindi",
    "tr": "Turkish",
    "sv": "Swedish",
    "da": "Danish",
    "no": "Norwegian",
    "fi": "Finnish",
    "th": "Thai",
}


class ContentTools:
    def __init__(self) -> None:
        self.client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    def _extract_script_text(self, blocks: list[dict]) -> str:
        """Convert script blocks to readable text."""
        lines = []
        for block in blocks:
            speaker = block.get("speaker_name", "Speaker")
            text = block.get("text", "")
            direction = block.get("stage_direction", "")
            if direction:
                lines.append(f"[{direction}]")
            lines.append(f"{speaker}: {text}")
            lines.append("")
        return "\n".join(lines)

    async def generate_show_notes(
        self, episode_title: str, script_blocks: list[dict], format: str = "solo"
    ) -> dict:
        """Generate show notes with timestamps and key takeaways."""
        script_text = self._extract_script_text(script_blocks)

        prompt = f"""Analyze this podcast episode and generate show notes.

Episode Title: {episode_title}
Format: {format}

Script:
{script_text[:10000]}

Generate a JSON object with:
- "summary": 2-3 sentence episode summary
- "key_takeaways": array of 3-5 key takeaway bullet points
- "timestamps": array of objects with "time" (estimated MM:SS) and "topic" for each major section
- "resources": array of any resources, books, tools, or links mentioned (or empty array if none)
- "guests": array of guest names mentioned (or empty array)
- "quotes": array of 1-3 notable quotes from the episode

Output ONLY valid JSON. No markdown, no code fences."""

        message = await self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            system="You are a podcast show notes writer. Output only valid JSON.",
            messages=[{"role": "user", "content": prompt}],
        )

        response_text = message.content[0].text.strip()
        if response_text.startswith("```"):
            lines = response_text.split("\n")[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            response_text = "\n".join(lines)

        return json.loads(response_text)

    async def generate_transcript(
        self, script_blocks: list[dict]
    ) -> dict:
        """Generate a formatted transcript with timestamps from script blocks."""
        transcript_lines = []
        estimated_time = 0  # seconds

        for block in script_blocks:
            speaker = block.get("speaker_name", "Speaker")
            text = block.get("text", "")
            if not text.strip():
                continue

            # Estimate timestamp (150 words per minute)
            word_count = len(text.split())
            minutes = estimated_time // 60
            seconds = estimated_time % 60
            timestamp = f"{minutes:02d}:{seconds:02d}"

            transcript_lines.append({
                "timestamp": timestamp,
                "speaker": speaker,
                "text": text,
            })

            estimated_time += int((word_count / 150) * 60)

        total_minutes = estimated_time // 60
        total_seconds = estimated_time % 60

        return {
            "lines": transcript_lines,
            "total_duration": f"{total_minutes:02d}:{total_seconds:02d}",
            "word_count": sum(len(line["text"].split()) for line in transcript_lines),
        }

    async def generate_seo_metadata(
        self, episode_title: str, script_blocks: list[dict], podcast_category: str | None = None
    ) -> dict:
        """Generate SEO-optimized metadata for the episode."""
        script_text = self._extract_script_text(script_blocks)

        prompt = f"""Generate SEO-optimized metadata for this podcast episode.

Episode Title: {episode_title}
Category: {podcast_category or 'General'}

Script excerpt:
{script_text[:5000]}

Generate a JSON object with:
- "seo_title": SEO-optimized title (under 60 chars, includes keywords)
- "meta_description": compelling meta description (under 160 chars)
- "tags": array of 5-10 relevant tags/keywords
- "social_post_twitter": engaging tweet text (under 280 chars) to promote this episode
- "social_post_linkedin": professional LinkedIn post (2-3 sentences)
- "social_post_short": short teaser for Instagram/TikTok (under 100 chars)
- "episode_description": longer description for podcast platforms (2-4 paragraphs)

Output ONLY valid JSON. No markdown, no code fences."""

        message = await self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            system="You are a podcast marketing and SEO expert. Output only valid JSON.",
            messages=[{"role": "user", "content": prompt}],
        )

        response_text = message.content[0].text.strip()
        if response_text.startswith("```"):
            lines = response_text.split("\n")[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            response_text = "\n".join(lines)

        return json.loads(response_text)

    async def fact_check(self, script_blocks: list[dict]) -> list[dict]:
        """Flag claims in the script that may need fact-checking."""
        script_text = self._extract_script_text(script_blocks)

        prompt = f"""Analyze this podcast script for claims that may need fact-checking.

Script:
{script_text[:10000]}

For each claim that should be verified, create a JSON object with:
- "block_id": the block ID where the claim appears (if identifiable, otherwise null)
- "claim": the specific claim or statement
- "severity": "high" (factual claim that could be wrong), "medium" (statistic or specific detail), or "low" (opinion presented as fact)
- "suggestion": brief suggestion on how to verify or what to check
- "context": surrounding context for the claim

Return a JSON array of flagged claims. If no claims need checking, return an empty array.
Output ONLY valid JSON. No markdown, no code fences."""

        message = await self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            system="You are a fact-checker for podcast content. Be thorough but avoid flagging obvious opinions or subjective statements. Focus on verifiable claims. Output only valid JSON arrays.",
            messages=[{"role": "user", "content": prompt}],
        )

        response_text = message.content[0].text.strip()
        if response_text.startswith("```"):
            lines = response_text.split("\n")[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            response_text = "\n".join(lines)

        return json.loads(response_text)

    async def suggest_content(
        self,
        podcast_title: str,
        podcast_description: str | None,
        previous_topics: list[str],
        category: str | None = None,
    ) -> list[dict]:
        """Suggest future episode topics based on podcast history."""
        topics_str = "\n".join(f"- {t}" for t in previous_topics) if previous_topics else "No previous episodes yet."

        prompt = f"""Suggest 5 new episode topics for this podcast.

Podcast: {podcast_title}
Description: {podcast_description or 'Not provided'}
Category: {category or 'General'}

Previously covered topics:
{topics_str}

For each suggestion, create a JSON object with:
- "title": suggested episode title
- "description": 1-2 sentence description of what the episode would cover
- "format": recommended format ("solo", "conversation", "interview", "panel", "narrative")
- "angle": what makes this angle unique or timely
- "connects_to": which previous topic(s) this builds on (or "standalone" if new)

Avoid repeating previous topics. Build on them or explore adjacent areas.
Output ONLY a JSON array. No markdown, no code fences."""

        message = await self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            system="You are a podcast content strategist. Output only valid JSON arrays.",
            messages=[{"role": "user", "content": prompt}],
        )

        response_text = message.content[0].text.strip()
        if response_text.startswith("```"):
            lines = response_text.split("\n")[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            response_text = "\n".join(lines)

        return json.loads(response_text)

    async def translate_script(
        self,
        script_blocks: list[dict],
        target_language: str,
    ) -> list[dict]:
        """Translate script blocks to a target language while preserving structure."""
        language_name = SUPPORTED_LANGUAGES.get(target_language, target_language)
        blocks_json = json.dumps(script_blocks[:50], indent=2)  # Cap at 50 blocks

        prompt = f"""Translate these podcast script blocks to {language_name}.

{blocks_json}

Rules:
- Translate ONLY the "text" and "stage_direction" fields
- Keep all other fields (id, order, speaker_id, speaker_name, voice_overrides) exactly the same
- Maintain the same speaking style, tone, and energy level
- Adapt idioms and cultural references naturally — don't translate literally
- Keep proper nouns, brand names, and technical terms as-is unless they have standard translations

Output ONLY a JSON array of the translated blocks. No markdown, no code fences."""

        message = await self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            system=f"You are a professional translator specializing in podcast content. Translate to {language_name}. Output only valid JSON arrays.",
            messages=[{"role": "user", "content": prompt}],
        )

        response_text = message.content[0].text.strip()
        if response_text.startswith("```"):
            lines = response_text.split("\n")[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            response_text = "\n".join(lines)

        return json.loads(response_text)

    def get_supported_languages(self) -> dict:
        """Return supported languages for translation."""
        return SUPPORTED_LANGUAGES
