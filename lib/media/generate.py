#!/usr/bin/env python3
# ABOUTME: CLI for generating images and videos for keynote decks.
# ABOUTME: Uses nano-banana (Gemini) for images and Veo for videos.

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Optional

from .nano_banana import NanoBananaClient, ImageResult


def generate_deck_image(
    prompt: str,
    output_path: Path,
    temperature: float = 1.0,
) -> ImageResult:
    """
    Generate an image for a deck slide.

    Args:
        prompt: Full prompt including size, layout, style, typography, and content
        output_path: Where to save the image
        temperature: Randomness (0.0-2.0)

    Returns:
        ImageResult with generated image
    """
    client = NanoBananaClient()
    result = client.generate_image(prompt, temperature=temperature)
    result.save(output_path)
    return result


def main():
    parser = argparse.ArgumentParser(
        description="Generate images/videos for keynote decks",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate from prompt file
  python -m lib.media.generate --prompt-file prompts/slide2.txt --output decks/synthyra/assets/slide2.png

  # Generate from inline prompt
  python -m lib.media.generate --prompt "Create a diagram..." --output output.png

  # With custom temperature
  python -m lib.media.generate --prompt-file prompts/slide3.txt --output slide3.png --temperature 0.8
        """
    )

    parser.add_argument(
        "--prompt", "-p",
        help="Inline prompt text"
    )
    parser.add_argument(
        "--prompt-file", "-f",
        type=Path,
        help="Path to file containing prompt"
    )
    parser.add_argument(
        "--output", "-o",
        type=Path,
        required=True,
        help="Output file path"
    )
    parser.add_argument(
        "--temperature", "-t",
        type=float,
        default=1.0,
        help="Generation temperature (0.0-2.0, default 1.0)"
    )

    args = parser.parse_args()

    # Get prompt
    if args.prompt_file:
        if not args.prompt_file.exists():
            print(f"Error: Prompt file not found: {args.prompt_file}")
            sys.exit(1)
        prompt = args.prompt_file.read_text()
    elif args.prompt:
        prompt = args.prompt
    else:
        print("Error: Must provide --prompt or --prompt-file")
        sys.exit(1)

    # Ensure output directory exists
    args.output.parent.mkdir(parents=True, exist_ok=True)

    print(f"Generating image...")
    print(f"  Prompt: {prompt[:100]}{'...' if len(prompt) > 100 else ''}")
    print(f"  Output: {args.output}")
    print(f"  Temperature: {args.temperature}")
    print()

    try:
        result = generate_deck_image(
            prompt=prompt,
            output_path=args.output,
            temperature=args.temperature,
        )
        print(f"Success! Saved {result.mime_type} to {args.output}")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
