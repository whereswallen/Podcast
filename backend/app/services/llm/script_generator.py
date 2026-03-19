import json
import uuid

import anthropic

from app.core.config import settings
from app.schemas.script import ScriptBlockSchema

FORMAT_SPEAKER_MAP = {
    "solo": ["Host"],
    "conversation": ["Host", "Co-Host"],
    "interview": ["Interviewer", "Guest"],
    "panel": ["Moderator", "Panelist 1", "Panelist 2", "Panelist 3"],
    "narrative": ["Narrator"],
}

SYSTEM_PROMPT = """You are an expert podcast script writer. Your job is to write engaging, natural-sounding podcast scripts.

You MUST output valid JSON — an array of script block objects. Each block represents a segment of speech.

Each block must have these fields:
- "id": a unique string identifier (use format "block-001", "block-002", etc.)
- "order": integer starting from 0
- "speaker_id": a short identifier for the speaker (e.g., "host", "cohost", "guest")
- "speaker_name": the display name of the speaker
- "text": the actual spoken text for this block
- "stage_direction": optional stage direction or tone note (e.g., "[enthusiastic]", "[thoughtful pause]"), or null
- "voice_overrides": null

Guidelines:
- Write naturally as people actually speak — use contractions, conversational language
- Include brief stage directions for tone and delivery
- Vary sentence length and structure
- Include transitions between topics
- For conversations, make the dialogue feel organic with back-and-forth
- Aim for approximately 150 words per minute of target duration
- Start with an engaging introduction and end with a clear conclusion

Output ONLY the JSON array. No markdown, no code fences, no explanation."""


def _build_brand_prompt_section(brand_profile: dict) -> str:
    """Build the brand guidelines section for the system prompt."""
    parts = ["\n## Brand Guidelines"]

    if brand_profile.get("show_name"):
        line = f"Show: {brand_profile['show_name']}"
        if brand_profile.get("tagline"):
            line += f' — "{brand_profile["tagline"]}"'
        parts.append(line)

    if brand_profile.get("personality"):
        parts.append(f"Personality: {brand_profile['personality']}")

    if brand_profile.get("target_audience"):
        parts.append(f"Audience: {brand_profile['target_audience']}")

    tone = brand_profile.get("tone_guidelines")
    if tone:
        do_list = ", ".join(tone.get("do", []))
        dont_list = ", ".join(tone.get("dont", []))
        if do_list:
            parts.append(f"Tone DO: {do_list}")
        if dont_list:
            parts.append(f"Tone DON'T: {dont_list}")

    if brand_profile.get("key_themes"):
        parts.append(f"Key Themes: {', '.join(brand_profile['key_themes'])}")

    if brand_profile.get("vocabulary"):
        parts.append(f"Preferred Vocabulary: {', '.join(brand_profile['vocabulary'])}")

    if brand_profile.get("content_rules"):
        parts.append(f"Content Rules: {brand_profile['content_rules']}")

    return "\n".join(parts)


def _build_knowledge_prompt_section(knowledge_context: dict) -> str:
    """Build the knowledge context section for the system prompt."""
    parts = ["\n## PREVIOUS EPISODE KNOWLEDGE"]

    never = knowledge_context.get("never_repeat", [])
    brief = knowledge_context.get("brief_recap", [])
    recurring = knowledge_context.get("recurring", [])

    if never:
        parts.append("\n### DO NOT REPEAT (fully covered — skip or at most reference by name):")
        for bullet in never[:30]:  # Cap at 30 to stay within token budget
            parts.append(f"- {bullet}")

    if brief:
        parts.append("\n### BRIEF RECAP OK (touch on quickly if relevant, don't deep-dive):")
        for bullet in brief[:20]:
            parts.append(f"- {bullet}")

    if recurring:
        parts.append("\n### RECURRING / ALWAYS RELEVANT (core themes — weave in naturally):")
        for bullet in recurring[:15]:
            parts.append(f"- {bullet}")

    if not never and not brief and not recurring:
        parts.append("\nNo previous episodes yet — this is the first episode.")

    return "\n".join(parts)


class ScriptGenerator:
    def __init__(self) -> None:
        self.client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    async def generate_script(
        self,
        topic: str,
        format: str = "solo",
        tone: str = "conversational",
        target_duration: int = 300,
        source_material: str | None = None,
        brand_profile: dict | None = None,
        knowledge_context: dict | None = None,
        intro_template: str | None = None,
        outro_template: str | None = None,
    ) -> list[ScriptBlockSchema]:
        speakers = FORMAT_SPEAKER_MAP.get(format, ["Host"])
        target_words = int((target_duration / 60) * 150)

        # Build enhanced system prompt
        system_prompt = SYSTEM_PROMPT

        if brand_profile:
            system_prompt += _build_brand_prompt_section(brand_profile)

        if knowledge_context:
            system_prompt += _build_knowledge_prompt_section(knowledge_context)

        if intro_template or outro_template:
            system_prompt += "\n\n## Required Structure"
            if intro_template:
                system_prompt += f"\nThe script MUST start with this intro (adapt variables as needed): {intro_template}"
            if outro_template:
                system_prompt += f"\nThe script MUST end with this outro (adapt variables as needed): {outro_template}"

        user_prompt = f"""Write a podcast script about: {topic}

Format: {format}
Tone: {tone}
Target duration: {target_duration} seconds (approximately {target_words} words)
Speakers: {', '.join(speakers)}
"""
        if source_material:
            user_prompt += f"\nSource material to incorporate:\n{source_material}\n"

        user_prompt += f"\nRemember: Output ONLY a JSON array of script blocks. Use these speakers: {', '.join(speakers)}."

        message = await self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )

        response_text = message.content[0].text.strip()
        # Strip markdown code fences if present
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            # Remove first line (```json or ```) and last line (```)
            lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            response_text = "\n".join(lines)

        blocks_data = json.loads(response_text)
        blocks = []
        for i, block_data in enumerate(blocks_data):
            block = ScriptBlockSchema(
                id=block_data.get("id", f"block-{i:03d}"),
                order=block_data.get("order", i),
                speaker_id=block_data.get("speaker_id", "host"),
                speaker_name=block_data.get("speaker_name", speakers[0]),
                text=block_data.get("text", ""),
                stage_direction=block_data.get("stage_direction"),
                voice_overrides=block_data.get("voice_overrides"),
            )
            blocks.append(block)

        return blocks

    async def rewrite_blocks(
        self,
        blocks: list[ScriptBlockSchema],
        instruction: str,
    ) -> list[ScriptBlockSchema]:
        blocks_json = json.dumps([block.model_dump() for block in blocks], indent=2)

        user_prompt = f"""Here are podcast script blocks to rewrite:

{blocks_json}

Instruction: {instruction}

Rewrite ONLY these blocks according to the instruction. Keep the same block IDs, order, and speaker assignments unless the instruction specifically asks to change them. Output ONLY a JSON array of the rewritten blocks."""

        message = await self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
        )

        response_text = message.content[0].text.strip()
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            response_text = "\n".join(lines)

        blocks_data = json.loads(response_text)
        rewritten = []
        for i, block_data in enumerate(blocks_data):
            original = blocks[i] if i < len(blocks) else blocks[0]
            block = ScriptBlockSchema(
                id=block_data.get("id", original.id),
                order=block_data.get("order", original.order),
                speaker_id=block_data.get("speaker_id", original.speaker_id),
                speaker_name=block_data.get("speaker_name", original.speaker_name),
                text=block_data.get("text", ""),
                stage_direction=block_data.get("stage_direction"),
                voice_overrides=block_data.get("voice_overrides"),
            )
            rewritten.append(block)

        return rewritten

    async def rewrite_inline(self, text: str, instruction: str, context: str | None = None) -> str:
        """Rewrite a single text block based on an instruction."""
        # Parse instruction type
        instruction_map = {
            "rewrite": "Rewrite this text in a different way while keeping the same meaning.",
            "expand": "Expand this text with more detail, examples, and depth. Make it 2-3x longer.",
            "condense": "Condense this text to be shorter and more concise while keeping key points. Make it about half the length.",
            "formal": "Rewrite this in a more formal, professional tone.",
            "casual": "Rewrite this in a more casual, conversational tone.",
            "energetic": "Rewrite this with more energy and enthusiasm.",
            "dramatic": "Rewrite this with more dramatic flair and impact.",
        }

        system = "You are a podcast script editor. Output ONLY the rewritten text. No explanations, no quotes, no markdown."

        instruction_text = instruction_map.get(instruction, instruction)

        prompt = f"Text to modify:\n\n{text}\n\nInstruction: {instruction_text}"
        if context:
            prompt += f"\n\nSurrounding context for reference:\n{context}"

        message = await self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            system=system,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text.strip()
