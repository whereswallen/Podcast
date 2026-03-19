"""Background music library and auto-ducking system."""
import io
from pydub import AudioSegment

# Built-in music library metadata (actual audio would be user-uploaded or from a CDN)
MUSIC_LIBRARY = [
    {"id": "music-ambient-01", "name": "Ambient Waves", "category": "ambient", "bpm": 80, "duration": 180, "mood": "calm"},
    {"id": "music-upbeat-01", "name": "Morning Energy", "category": "upbeat", "bpm": 120, "duration": 180, "mood": "energetic"},
    {"id": "music-cinematic-01", "name": "Epic Journey", "category": "cinematic", "bpm": 90, "duration": 180, "mood": "dramatic"},
    {"id": "music-lofi-01", "name": "Chill Beats", "category": "lo-fi", "bpm": 85, "duration": 180, "mood": "relaxed"},
    {"id": "music-corporate-01", "name": "Innovation", "category": "corporate", "bpm": 110, "duration": 180, "mood": "professional"},
    {"id": "music-acoustic-01", "name": "Campfire Story", "category": "acoustic", "bpm": 95, "duration": 180, "mood": "warm"},
    {"id": "music-electronic-01", "name": "Future Forward", "category": "electronic", "bpm": 128, "duration": 180, "mood": "exciting"},
    {"id": "music-jazz-01", "name": "Late Night", "category": "jazz", "bpm": 100, "duration": 180, "mood": "smooth"},
    {"id": "music-piano-01", "name": "Reflections", "category": "piano", "bpm": 70, "duration": 180, "mood": "thoughtful"},
    {"id": "music-pop-01", "name": "Good Vibes", "category": "pop", "bpm": 115, "duration": 180, "mood": "happy"},
]


class MusicMixer:
    """Handles background music mixing with auto-ducking."""

    def list_music(self) -> list[dict]:
        return MUSIC_LIBRARY

    def generate_tone_track(self, duration_ms: int, frequency: int = 440, volume_db: float = -30) -> AudioSegment:
        """Generate a simple sine wave tone as placeholder background music."""
        import struct, math
        sample_rate = 44100
        num_samples = int(sample_rate * duration_ms / 1000)
        samples = []
        for i in range(num_samples):
            sample = math.sin(2 * math.pi * frequency * i / sample_rate)
            samples.append(int(sample * 32767 * 0.1))
        raw_data = struct.pack(f"<{num_samples}h", *samples)
        audio = AudioSegment(data=raw_data, sample_width=2, frame_rate=sample_rate, channels=1)
        return audio + volume_db

    def apply_auto_ducking(
        self,
        speech: AudioSegment,
        music: AudioSegment,
        duck_db: float = -15.0,
        attack_ms: int = 200,
        release_ms: int = 500,
    ) -> AudioSegment:
        """Apply auto-ducking to music when speech is present.

        Reduces music volume during speech segments, creating professional podcast audio.
        """
        # Ensure music is at least as long as speech (loop if needed)
        while len(music) < len(speech):
            music = music + music
        music = music[:len(speech)]

        # Analyze speech for silence/voice segments
        from pydub.silence import detect_nonsilent
        speech_segments = detect_nonsilent(speech, min_silence_len=300, silence_thresh=-40)

        # Create ducked music track
        ducked_music = AudioSegment.silent(duration=len(music))

        # Default: music at full volume
        cursor = 0
        for start, end in speech_segments:
            # Before speech: music at full volume
            if cursor < start:
                # Ramp down before speech starts
                ramp_start = max(cursor, start - attack_ms)
                if cursor < ramp_start:
                    ducked_music = ducked_music.overlay(music[cursor:ramp_start], position=cursor)
                # Attack ramp
                if ramp_start < start:
                    segment = music[ramp_start:start].fade(to_gain=duck_db, start=0, end=start-ramp_start)
                    ducked_music = ducked_music.overlay(segment, position=ramp_start)

            # During speech: music ducked
            ducked_segment = music[start:end] + duck_db
            ducked_music = ducked_music.overlay(ducked_segment, position=start)

            # Release ramp after speech
            release_end = min(end + release_ms, len(music))
            if end < release_end:
                segment = music[end:release_end].fade(from_gain=duck_db, start=0, end=release_end-end)
                ducked_music = ducked_music.overlay(segment, position=end)

            cursor = release_end

        # Remaining music at full volume
        if cursor < len(music):
            ducked_music = ducked_music.overlay(music[cursor:], position=cursor)

        # Mix speech and ducked music
        return speech.overlay(ducked_music)

    def mix_with_intro_outro(
        self,
        speech: AudioSegment,
        music: AudioSegment,
        intro_duration_ms: int = 3000,
        outro_duration_ms: int = 5000,
        duck_db: float = -15.0,
    ) -> AudioSegment:
        """Mix speech with music, adding music-only intro and outro."""
        intro = music[:intro_duration_ms].fade_in(500)
        outro = music[:outro_duration_ms].fade_out(2000)

        # Build: intro (music only) -> main (speech + ducked music) -> outro (music only)
        main_section = self.apply_auto_ducking(speech, music[intro_duration_ms:], duck_db)

        result = intro + main_section + outro
        return result
