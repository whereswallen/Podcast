"""Sound effects library."""
import io
import math
import struct
from pydub import AudioSegment

SFX_LIBRARY = [
    {"id": "sfx-transition-01", "name": "Swoosh", "category": "transitions", "duration_ms": 800},
    {"id": "sfx-transition-02", "name": "Whoosh", "category": "transitions", "duration_ms": 600},
    {"id": "sfx-transition-03", "name": "Chime", "category": "transitions", "duration_ms": 1200},
    {"id": "sfx-stinger-01", "name": "News Flash", "category": "stingers", "duration_ms": 2000},
    {"id": "sfx-stinger-02", "name": "Dramatic Hit", "category": "stingers", "duration_ms": 1500},
    {"id": "sfx-stinger-03", "name": "Tech Glitch", "category": "stingers", "duration_ms": 1000},
    {"id": "sfx-ambient-01", "name": "Coffee Shop", "category": "ambient", "duration_ms": 30000},
    {"id": "sfx-ambient-02", "name": "Rain", "category": "ambient", "duration_ms": 30000},
    {"id": "sfx-ambient-03", "name": "Office", "category": "ambient", "duration_ms": 30000},
    {"id": "sfx-notification-01", "name": "Ding", "category": "notifications", "duration_ms": 500},
    {"id": "sfx-notification-02", "name": "Pop", "category": "notifications", "duration_ms": 300},
    {"id": "sfx-applause-01", "name": "Applause", "category": "audience", "duration_ms": 5000},
    {"id": "sfx-laugh-01", "name": "Laughter", "category": "audience", "duration_ms": 3000},
]


class SFXEngine:
    """Sound effects generator and library."""

    def list_sfx(self) -> list[dict]:
        return SFX_LIBRARY

    def generate_tone(self, frequency: float, duration_ms: int, volume_db: float = -10) -> AudioSegment:
        """Generate a sine wave tone."""
        sample_rate = 44100
        num_samples = int(sample_rate * duration_ms / 1000)
        samples = []
        for i in range(num_samples):
            t = i / sample_rate
            sample = math.sin(2 * math.pi * frequency * t)
            # Apply fade in/out
            if i < sample_rate * 0.01:  # 10ms fade in
                sample *= i / (sample_rate * 0.01)
            if i > num_samples - sample_rate * 0.01:  # 10ms fade out
                sample *= (num_samples - i) / (sample_rate * 0.01)
            samples.append(int(sample * 32767))
        raw_data = struct.pack(f"<{num_samples}h", *samples)
        audio = AudioSegment(data=raw_data, sample_width=2, frame_rate=sample_rate, channels=1)
        return audio + volume_db

    def generate_swoosh(self, duration_ms: int = 800) -> AudioSegment:
        """Generate a swoosh transition effect using frequency sweep."""
        sample_rate = 44100
        num_samples = int(sample_rate * duration_ms / 1000)
        samples = []
        for i in range(num_samples):
            t = i / num_samples
            freq = 200 + 2000 * t  # Sweep from 200Hz to 2200Hz
            sample = math.sin(2 * math.pi * freq * i / sample_rate)
            envelope = math.sin(math.pi * t)  # Bell curve envelope
            samples.append(int(sample * envelope * 32767 * 0.3))
        raw_data = struct.pack(f"<{num_samples}h", *samples)
        return AudioSegment(data=raw_data, sample_width=2, frame_rate=sample_rate, channels=1)

    def generate_chime(self, duration_ms: int = 1200) -> AudioSegment:
        """Generate a pleasant chime sound."""
        freqs = [523.25, 659.25, 783.99]  # C5, E5, G5 chord
        combined = AudioSegment.silent(duration=duration_ms)
        for freq in freqs:
            tone = self.generate_tone(freq, duration_ms, volume_db=-15)
            tone = tone.fade_out(duration_ms - 100)
            combined = combined.overlay(tone)
        return combined

    def generate_notification(self, duration_ms: int = 500) -> AudioSegment:
        """Generate a notification ding."""
        tone1 = self.generate_tone(880, duration_ms // 2, -10).fade_out(duration_ms // 3)
        tone2 = self.generate_tone(1320, duration_ms // 2, -12).fade_out(duration_ms // 3)
        return tone1 + tone2

    def get_sfx(self, sfx_id: str) -> AudioSegment | None:
        """Get a sound effect by ID. Returns generated audio for built-in SFX."""
        sfx_map = {
            "sfx-transition-01": lambda: self.generate_swoosh(800),
            "sfx-transition-02": lambda: self.generate_swoosh(600),
            "sfx-transition-03": lambda: self.generate_chime(1200),
            "sfx-stinger-01": lambda: self.generate_chime(2000),
            "sfx-notification-01": lambda: self.generate_notification(500),
            "sfx-notification-02": lambda: self.generate_tone(1000, 300, -8),
        }
        generator = sfx_map.get(sfx_id)
        if generator:
            return generator()
        return None
