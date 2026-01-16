# ABOUTME: Gemini image generation client (nano-banana / gemini-2.5-flash-image).
# ABOUTME: Supports text-to-image and image-to-image generation.

from __future__ import annotations

import base64
import json
import os
import urllib.request
import urllib.error
from dataclasses import dataclass
from pathlib import Path
from typing import Optional


# Default to grok-aurora-cli .env if no env var set
DEFAULT_ENV_PATH = Path(__file__).parent.parent.parent.parent / "grok-aurora-cli" / ".env"


def _load_api_key() -> str:
    """Load Gemini API key from environment or grok-aurora-cli .env file."""
    # Check environment first
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("NANO_BANANA_API_KEY")
    if api_key:
        return api_key

    # Try loading from grok-aurora-cli .env
    if DEFAULT_ENV_PATH.exists():
        for line in DEFAULT_ENV_PATH.read_text().splitlines():
            if line.startswith("GEMINI_API_KEY="):
                return line.split("=", 1)[1].strip()

    raise ValueError(
        "No Gemini API key found. Set GEMINI_API_KEY environment variable "
        "or ensure grok-aurora-cli/.env exists with the key."
    )


@dataclass(frozen=True)
class ImageResult:
    """Result from image generation."""
    bytes: bytes
    mime_type: str

    def save(self, path: Path | str) -> Path:
        """Save image to file."""
        path = Path(path)
        path.write_bytes(self.bytes)
        return path


@dataclass(frozen=True)
class ImageInput:
    """Input image for image-to-image generation."""
    bytes: bytes
    mime_type: str

    @classmethod
    def from_file(cls, path: Path | str) -> "ImageInput":
        """Load image from file."""
        path = Path(path)
        mime_types = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
            ".gif": "image/gif",
        }
        suffix = path.suffix.lower()
        mime_type = mime_types.get(suffix, "image/jpeg")
        return cls(bytes=path.read_bytes(), mime_type=mime_type)


class NanoBananaError(Exception):
    """Error from Nano Banana API."""
    pass


class NanoBananaClient:
    """Client for Gemini image generation (nano-banana)."""

    BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"
    DEFAULT_MODEL = "gemini-2.5-flash-image"

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
    ):
        self.api_key = api_key or _load_api_key()
        self.model = model or os.environ.get("NANO_BANANA_IMAGE_MODEL", self.DEFAULT_MODEL)

    def generate_image(
        self,
        prompt: str,
        temperature: float = 1.0,
        aspect_ratio: Optional[str] = None,
    ) -> ImageResult:
        """
        Generate an image from a text prompt.

        Args:
            prompt: Text description of the image to generate
            temperature: Randomness (0.0-2.0, default 1.0)
            aspect_ratio: Optional aspect ratio hint in prompt

        Returns:
            ImageResult with generated image bytes
        """
        # Build the prompt with aspect ratio if provided
        full_prompt = prompt
        if aspect_ratio:
            full_prompt = f"{prompt}\n\nAspect ratio: {aspect_ratio}"

        payload = {
            "contents": [{
                "role": "user",
                "parts": [{"text": full_prompt}]
            }],
            "generationConfig": {
                "temperature": temperature,
                "responseModalities": ["image", "text"],
            }
        }

        return self._make_request(payload)

    def edit_image(
        self,
        prompt: str,
        inputs: list[ImageInput],
        temperature: float = 0.2,
    ) -> ImageResult:
        """
        Edit or transform existing images based on a prompt.

        Args:
            prompt: Text description of the desired edit
            inputs: List of input images to edit/reference
            temperature: Randomness (0.0-2.0, default 0.2 for edits)

        Returns:
            ImageResult with generated image bytes
        """
        parts = []

        # Add input images first
        for img in inputs:
            parts.append({
                "inline_data": {
                    "mime_type": img.mime_type,
                    "data": base64.b64encode(img.bytes).decode("utf-8")
                }
            })

        # Add the prompt
        parts.append({"text": prompt})

        payload = {
            "contents": [{
                "role": "user",
                "parts": parts
            }],
            "generationConfig": {
                "temperature": temperature,
                "responseModalities": ["image", "text"],
            }
        }

        return self._make_request(payload)

    def _make_request(self, payload: dict) -> ImageResult:
        """Make API request and extract image result."""
        url = f"{self.BASE_URL}/{self.model}:generateContent"

        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": self.api_key,
        }

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")

        try:
            with urllib.request.urlopen(req, timeout=120) as response:
                result = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8") if e.fp else str(e)
            raise NanoBananaError(f"API error {e.code}: {error_body}") from e
        except urllib.error.URLError as e:
            raise NanoBananaError(f"Network error: {e.reason}") from e

        # Extract image from response
        return self._extract_image(result)

    def _extract_image(self, response: dict) -> ImageResult:
        """Extract image data from API response."""
        try:
            candidates = response.get("candidates", [])
            if not candidates:
                raise NanoBananaError("No candidates in response")

            content = candidates[0].get("content", {})
            parts = content.get("parts", [])

            for part in parts:
                inline_data = part.get("inlineData") or part.get("inline_data")
                if inline_data:
                    image_data = base64.b64decode(inline_data["data"])
                    mime_type = inline_data.get("mimeType", inline_data.get("mime_type", "image/png"))
                    return ImageResult(bytes=image_data, mime_type=mime_type)

            # Check if there's text explaining why no image
            for part in parts:
                if "text" in part:
                    raise NanoBananaError(f"No image generated. Response: {part['text']}")

            raise NanoBananaError("No image data in response")

        except KeyError as e:
            raise NanoBananaError(f"Unexpected response format: {e}") from e


def generate_image(
    prompt: str,
    output_path: Optional[Path | str] = None,
    temperature: float = 1.0,
    aspect_ratio: Optional[str] = None,
) -> ImageResult:
    """
    Convenience function to generate an image.

    Args:
        prompt: Text description of the image
        output_path: Optional path to save the image
        temperature: Randomness (0.0-2.0)
        aspect_ratio: Optional aspect ratio (e.g., "16:9", "1:1", "9:16")

    Returns:
        ImageResult with generated image
    """
    client = NanoBananaClient()
    result = client.generate_image(prompt, temperature=temperature, aspect_ratio=aspect_ratio)

    if output_path:
        result.save(output_path)

    return result


def edit_image(
    prompt: str,
    input_paths: list[Path | str],
    output_path: Optional[Path | str] = None,
    temperature: float = 0.2,
) -> ImageResult:
    """
    Convenience function to edit images.

    Args:
        prompt: Text description of the desired edit
        input_paths: Paths to input images
        output_path: Optional path to save the result
        temperature: Randomness (0.0-2.0)

    Returns:
        ImageResult with edited image
    """
    client = NanoBananaClient()
    inputs = [ImageInput.from_file(p) for p in input_paths]
    result = client.edit_image(prompt, inputs, temperature=temperature)

    if output_path:
        result.save(output_path)

    return result


if __name__ == "__main__":
    # Simple test
    import sys

    if len(sys.argv) < 2:
        print("Usage: python nano_banana.py <prompt> [output_path]")
        sys.exit(1)

    prompt = sys.argv[1]
    output = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("output.png")

    print(f"Generating image for: {prompt[:50]}...")
    result = generate_image(prompt, output)
    print(f"Saved to: {output} ({result.mime_type})")
