"""Pillow-based social media card generator for podcast episodes."""

import io
import math
import random
import textwrap

from PIL import Image, ImageDraw, ImageFont


class CardGenerator:
    """Generates branded social media cards for podcast episodes."""

    def __init__(self, brand_colors: dict | None = None, show_name: str = "CastNode") -> None:
        self.show_name = show_name
        primary = (brand_colors or {}).get("primary", "#6366f1")
        secondary = (brand_colors or {}).get("secondary", "#8b5cf6")
        self.primary_rgb = self._hex_to_rgb(primary)
        self.secondary_rgb = self._hex_to_rgb(secondary)
        self.text_color = self._get_contrast_color(self.primary_rgb)

        # Try to load a good font, fall back to default
        self._font_cache: dict[int, ImageFont.FreeTypeFont | ImageFont.ImageFont] = {}

    @staticmethod
    def _hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
        hex_color = hex_color.lstrip("#")
        if len(hex_color) != 6:
            return (99, 102, 241)  # Default indigo
        return (int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16))

    @staticmethod
    def _get_contrast_color(rgb: tuple[int, int, int]) -> tuple[int, int, int]:
        luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255
        return (255, 255, 255) if luminance < 0.5 else (30, 30, 30)

    def _get_font(self, size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
        if size in self._font_cache:
            return self._font_cache[size]

        font_paths = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
            "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
        ]
        for path in font_paths:
            try:
                font = ImageFont.truetype(path, size)
                self._font_cache[size] = font
                return font
            except (OSError, IOError):
                continue

        font = ImageFont.load_default()
        self._font_cache[size] = font
        return font

    def _draw_gradient_bg(
        self, img: Image.Image, color1: tuple[int, int, int], color2: tuple[int, int, int]
    ) -> None:
        """Draw a vertical gradient background."""
        draw = ImageDraw.Draw(img)
        w, h = img.size
        for y in range(h):
            ratio = y / h
            r = int(color1[0] + (color2[0] - color1[0]) * ratio)
            g = int(color1[1] + (color2[1] - color1[1]) * ratio)
            b = int(color1[2] + (color2[2] - color1[2]) * ratio)
            draw.line([(0, y), (w, y)], fill=(r, g, b))

    def _wrap_text(self, text: str, max_chars_per_line: int) -> list[str]:
        return textwrap.wrap(text, width=max_chars_per_line)

    def generate_quote_card(self, quote: str, episode_title: str) -> bytes:
        """Generate a 1080x1080 quote card for Instagram/social sharing."""
        size = (1080, 1080)
        img = Image.new("RGB", size)
        self._draw_gradient_bg(img, self.primary_rgb, self.secondary_rgb)
        draw = ImageDraw.Draw(img)
        tc = self.text_color
        dim = (tc[0], tc[1], tc[2], 180)

        # Show name at top
        font_name = self._get_font(28)
        draw.text((540, 80), self.show_name.upper(), fill=dim, font=font_name, anchor="mt")

        # Opening quote mark
        font_quote_mark = self._get_font(120)
        draw.text((100, 180), "\u201c", fill=(*tc, 100), font=font_quote_mark)

        # Quote text — centered, wrapped
        font_quote = self._get_font(42)
        lines = self._wrap_text(quote, 35)
        y = 320
        line_height = 58
        for line in lines[:8]:  # Max 8 lines
            draw.text((540, y), line, fill=tc, font=font_quote, anchor="mt")
            y += line_height

        # Closing quote mark
        draw.text((980, y - 20), "\u201d", fill=(*tc, 100), font=font_quote_mark)

        # Divider line
        div_y = max(y + 60, 800)
        draw.line([(340, div_y), (740, div_y)], fill=(*tc, 80), width=2)

        # Episode title at bottom
        font_title = self._get_font(24)
        title_lines = self._wrap_text(episode_title, 45)
        title_y = div_y + 30
        for line in title_lines[:2]:
            draw.text((540, title_y), line, fill=dim, font=font_title, anchor="mt")
            title_y += 34

        return self._export_png(img)

    def generate_topic_card(self, episode_title: str, takeaways: list[str]) -> bytes:
        """Generate a 1200x628 topic card for Twitter/LinkedIn."""
        size = (1200, 628)
        img = Image.new("RGB", size)
        self._draw_gradient_bg(img, self.primary_rgb, self.secondary_rgb)
        draw = ImageDraw.Draw(img)
        tc = self.text_color
        dim = (tc[0], tc[1], tc[2], 180)

        # Show name top-left
        font_name = self._get_font(22)
        draw.text((60, 40), self.show_name.upper(), fill=dim, font=font_name)

        # Episode title
        font_title = self._get_font(38)
        title_lines = self._wrap_text(episode_title, 40)
        y = 100
        for line in title_lines[:2]:
            draw.text((60, y), line, fill=tc, font=font_title)
            y += 50

        # Divider
        y += 15
        draw.line([(60, y), (400, y)], fill=(*tc, 80), width=2)
        y += 25

        # Key takeaways as bullets
        font_bullet = self._get_font(24)
        for takeaway in takeaways[:5]:
            text = f"\u2022  {takeaway}"
            wrapped = self._wrap_text(text, 55)
            for line in wrapped[:2]:
                draw.text((60, y), line, fill=tc, font=font_bullet)
                y += 34
            y += 6

        return self._export_png(img)

    def generate_audiogram_preview(self, quote: str, episode_title: str) -> bytes:
        """Generate a 1080x1080 audiogram-style card with simulated waveform."""
        size = (1080, 1080)
        img = Image.new("RGB", size)
        self._draw_gradient_bg(img, self.primary_rgb, self.secondary_rgb)
        draw = ImageDraw.Draw(img)
        tc = self.text_color
        dim = (tc[0], tc[1], tc[2], 180)

        # Show name at top
        font_name = self._get_font(24)
        draw.text((540, 60), self.show_name.upper(), fill=dim, font=font_name, anchor="mt")

        # Episode title
        font_title = self._get_font(28)
        title_lines = self._wrap_text(episode_title, 40)
        y = 110
        for line in title_lines[:2]:
            draw.text((540, y), line, fill=tc, font=font_title, anchor="mt")
            y += 38

        # Simulated waveform in the middle
        waveform_y = 400
        waveform_height = 200
        bar_width = 6
        bar_gap = 3
        total_bars = (900) // (bar_width + bar_gap)
        start_x = 90

        random.seed(42)  # Deterministic waveform
        for i in range(total_bars):
            # Create a wave-like pattern using sine + random
            t = i / total_bars
            wave = abs(math.sin(t * math.pi * 4)) * 0.7 + random.uniform(0.1, 0.3)
            bar_h = int(wave * waveform_height)

            x = start_x + i * (bar_width + bar_gap)
            top = waveform_y + (waveform_height - bar_h) // 2
            bottom = top + bar_h

            bar_color = (*tc, 200)
            draw.rounded_rectangle(
                [(x, top), (x + bar_width, bottom)],
                radius=bar_width // 2,
                fill=bar_color,
            )

        # Play button circle in center of waveform
        cx, cy = 540, waveform_y + waveform_height // 2
        draw.ellipse([(cx - 30, cy - 30), (cx + 30, cy + 30)], fill=tc)
        # Triangle play icon
        play_color = self.primary_rgb
        draw.polygon([(cx - 10, cy - 15), (cx - 10, cy + 15), (cx + 15, cy)], fill=play_color)

        # Quote below waveform
        font_quote = self._get_font(32)
        lines = self._wrap_text(f'"{quote}"', 38)
        y = waveform_y + waveform_height + 80
        for line in lines[:5]:
            draw.text((540, y), line, fill=tc, font=font_quote, anchor="mt")
            y += 44

        return self._export_png(img)

    @staticmethod
    def _export_png(img: Image.Image) -> bytes:
        buf = io.BytesIO()
        img.save(buf, format="PNG", optimize=True)
        return buf.getvalue()
