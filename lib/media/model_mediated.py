# ABOUTME: Image acquisition tools for model-mediated workflow.
# ABOUTME: Claude decides generate vs search; these tools execute that decision.

from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Optional, Literal

from .nano_banana import NanoBananaClient, ImageResult
from .image_search import ImageSearchClient, SearchResult


@dataclass
class WorkRunRecord:
    """Record of an image acquisition for auditability."""
    timestamp: str
    slide: Optional[int]
    action: str  # GENERATE | SEARCH | HYBRID
    prompt: str
    brand_context: str
    reasoning: str
    search_query: Optional[str] = None
    search_results_count: Optional[int] = None
    selected_result: Optional[dict] = None
    output_path: Optional[str] = None


class ImageAcquisitionTools:
    """
    Tools for Claude to acquire images.

    Claude decides whether to generate or search, then calls the appropriate tool.
    These are execution tools, not decision-making code.
    """

    def __init__(
        self,
        work_runs_dir: Optional[Path] = None,
        credits_file: Optional[Path] = None,
    ):
        self.generator = NanoBananaClient()
        self.searcher = ImageSearchClient()
        self.work_runs_dir = work_runs_dir
        self.credits_file = credits_file

    def generate(
        self,
        prompt: str,
        output_path: Path,
        brand_context: str = "",
        slide_number: Optional[int] = None,
        reasoning: str = "",
    ) -> ImageResult:
        """
        Generate an image with Gemini.

        Call this when the model decides GENERATE is appropriate
        (diagrams, infographics, abstract concepts, brand-specific visuals).

        Args:
            prompt: Full image generation prompt
            output_path: Where to save the image
            brand_context: Brand guidelines to prepend
            slide_number: For logging
            reasoning: Model's reasoning for choosing GENERATE

        Returns:
            ImageResult with generated image
        """
        full_prompt = prompt
        if brand_context:
            full_prompt = f"{brand_context}\n\n{prompt}"

        result = self.generator.generate_image(full_prompt)

        # Save
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        result.save(output_path)

        # Log
        self._log_work_run(WorkRunRecord(
            timestamp=datetime.now().isoformat(),
            slide=slide_number,
            action="GENERATE",
            prompt=prompt,
            brand_context=brand_context,
            reasoning=reasoning,
            output_path=str(output_path),
        ))

        return result

    def search(
        self,
        query: str,
        sources: Optional[list[str]] = None,
        per_page: int = 10,
        orientation: str = "landscape",
    ) -> list[SearchResult]:
        """
        Search for images across stock photo sources.

        Call this when the model decides SEARCH is appropriate
        (real-world photos, people, locations, products).

        Args:
            query: Search query (model composes this)
            sources: Which sources to search (default: all available)
            per_page: Results per source
            orientation: landscape | portrait | square

        Returns:
            List of SearchResult for model to review and select from
        """
        return self.searcher.search(
            query=query,
            sources=sources,
            per_page=per_page,
            orientation=orientation,
        )

    def download_selected(
        self,
        result: SearchResult,
        output_path: Path,
        slide_number: Optional[int] = None,
        reasoning: str = "",
        search_query: str = "",
        total_results: int = 0,
    ) -> Path:
        """
        Download a selected search result.

        Call this after model reviews search results and selects the best one.

        Args:
            result: The SearchResult to download
            output_path: Where to save
            slide_number: For attribution tracking
            reasoning: Model's reasoning for selection
            search_query: Original query (for logging)
            total_results: How many results were considered

        Returns:
            Path to downloaded image
        """
        output_path = Path(output_path)

        path = self.searcher.download(
            result,
            output_path,
            credits_file=self.credits_file,
            slide_number=slide_number,
        )

        # Log
        self._log_work_run(WorkRunRecord(
            timestamp=datetime.now().isoformat(),
            slide=slide_number,
            action="SEARCH",
            prompt=f"Search: {search_query}",
            brand_context="",
            reasoning=reasoning,
            search_query=search_query,
            search_results_count=total_results,
            selected_result={
                "id": result.id,
                "source": result.source,
                "description": result.description,
                "photographer": result.photographer,
            },
            output_path=str(path),
        ))

        return path

    def edit_image(
        self,
        prompt: str,
        input_path: Path,
        output_path: Path,
        brand_context: str = "",
        slide_number: Optional[int] = None,
        reasoning: str = "",
    ) -> ImageResult:
        """
        Edit an existing image with Gemini.

        Call this for HYBRID mode: search found a base image,
        now apply brand styling or overlays.

        Args:
            prompt: Edit instructions
            input_path: Path to base image
            output_path: Where to save result
            brand_context: Brand guidelines
            slide_number: For logging
            reasoning: Model's reasoning

        Returns:
            ImageResult with edited image
        """
        from .nano_banana import ImageInput

        full_prompt = prompt
        if brand_context:
            full_prompt = f"{brand_context}\n\n{prompt}"

        base_input = ImageInput.from_file(input_path)
        result = self.generator.edit_image(full_prompt, [base_input])

        # Save
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        result.save(output_path)

        # Log
        self._log_work_run(WorkRunRecord(
            timestamp=datetime.now().isoformat(),
            slide=slide_number,
            action="HYBRID",
            prompt=prompt,
            brand_context=brand_context,
            reasoning=reasoning,
            output_path=str(output_path),
        ))

        return result

    def _log_work_run(self, record: WorkRunRecord) -> None:
        """Log work run to file for auditability."""
        if not self.work_runs_dir:
            return

        self.work_runs_dir.mkdir(parents=True, exist_ok=True)
        filename = f"image-{record.timestamp.replace(':', '-').replace('.', '-')}.json"
        path = self.work_runs_dir / filename
        path.write_text(json.dumps(asdict(record), indent=2))


def get_tools_for_deck(deck_path: Path) -> ImageAcquisitionTools:
    """
    Get image acquisition tools configured for a specific deck.

    Args:
        deck_path: Path to deck directory

    Returns:
        Configured ImageAcquisitionTools instance
    """
    deck_path = Path(deck_path)
    return ImageAcquisitionTools(
        work_runs_dir=deck_path / "resources" / "materials" / "work-runs",
        credits_file=deck_path / "resources" / "materials" / "image-credits.json",
    )


# CLI for direct tool invocation

if __name__ == "__main__":
    import sys
    import argparse

    parser = argparse.ArgumentParser(
        description="Image acquisition tools for keynote decks",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate an image
  python3 -m lib.media.model_mediated generate "Abstract data flow diagram" output.png --brand "Modern tech aesthetic"

  # Search for images (returns URLs)
  python3 -m lib.media.model_mediated search "team collaboration office"

  # Download a search result by URL
  python3 -m lib.media.model_mediated download "https://images.unsplash.com/photo-abc" output.jpg --source unsplash --photographer "Jane Doe"

  # Edit an image (HYBRID mode)
  python3 -m lib.media.model_mediated edit "Add blue gradient overlay" input.jpg output.jpg --brand "Tech aesthetic"
        """
    )

    subparsers = parser.add_subparsers(dest="command", required=True)

    # Generate command
    gen_parser = subparsers.add_parser("generate", help="Generate image with Gemini")
    gen_parser.add_argument("prompt", help="Generation prompt")
    gen_parser.add_argument("output", type=Path, help="Output path")
    gen_parser.add_argument("--brand", default="", help="Brand context")
    gen_parser.add_argument("--slide", type=int, help="Slide number")
    gen_parser.add_argument("--deck", type=Path, help="Deck path for logging")

    # Search command
    search_parser = subparsers.add_parser("search", help="Search for images")
    search_parser.add_argument("query", help="Search query")
    search_parser.add_argument("--sources", nargs="+", help="Sources to search")
    search_parser.add_argument("--count", type=int, default=10, help="Results per source")
    search_parser.add_argument("--orientation", default="landscape", help="Image orientation")

    # Download command
    dl_parser = subparsers.add_parser("download", help="Download search result")
    dl_parser.add_argument("url", help="Image URL to download")
    dl_parser.add_argument("output", type=Path, help="Output path")
    dl_parser.add_argument("--source", default="unknown", help="Source name (unsplash, pexels, google)")
    dl_parser.add_argument("--photographer", default="Unknown", help="Photographer name for attribution")
    dl_parser.add_argument("--photo-url", help="URL to original photo page for attribution")
    dl_parser.add_argument("--slide", type=int, help="Slide number")
    dl_parser.add_argument("--deck", type=Path, help="Deck path for logging/credits")

    # Edit command (for HYBRID mode)
    edit_parser = subparsers.add_parser("edit", help="Edit image with Gemini (HYBRID mode)")
    edit_parser.add_argument("prompt", help="Edit instructions")
    edit_parser.add_argument("input", type=Path, help="Input image path")
    edit_parser.add_argument("output", type=Path, help="Output path")
    edit_parser.add_argument("--brand", default="", help="Brand context")
    edit_parser.add_argument("--slide", type=int, help="Slide number")
    edit_parser.add_argument("--deck", type=Path, help="Deck path for logging")

    args = parser.parse_args()

    if args.command == "generate":
        tools = get_tools_for_deck(args.deck) if args.deck else ImageAcquisitionTools()
        result = tools.generate(
            prompt=args.prompt,
            output_path=args.output,
            brand_context=args.brand,
            slide_number=args.slide,
        )
        print(f"Generated: {args.output} ({result.mime_type})")

    elif args.command == "search":
        tools = ImageAcquisitionTools()
        results = tools.search(
            query=args.query,
            sources=args.sources,
            per_page=args.count,
            orientation=args.orientation,
        )
        print(f"Found {len(results)} results:\n")
        for i, r in enumerate(results):
            print(f"{i+1}. [{r.source}] {r.description[:60]}...")
            print(f"   Size: {r.width}x{r.height}")
            print(f"   Photographer: {r.photographer}")
            print(f"   Photo page: {r.photo_page_url}")
            print(f"   Download URL: {r.url}")
            print(f"   Thumbnail: {r.thumbnail_url}")
            print()

    elif args.command == "download":
        import urllib.request

        # Download the image directly
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        print(f"Downloading from {args.url}...")
        req = urllib.request.Request(args.url)
        req.add_header("User-Agent", "Mozilla/5.0")
        with urllib.request.urlopen(req, timeout=60) as response:
            output_path.write_bytes(response.read())

        # Track attribution if deck specified
        if args.deck:
            import json
            from datetime import datetime

            credits_file = Path(args.deck) / "resources" / "materials" / "image-credits.json"
            credits_file.parent.mkdir(parents=True, exist_ok=True)

            # Load or create credits
            if credits_file.exists():
                data = json.loads(credits_file.read_text())
            else:
                data = {"images": []}

            data["images"].append({
                "file": str(output_path),
                "source": args.source,
                "photographer": args.photographer,
                "photographer_url": "",
                "photo_url": args.photo_url or args.url,
                "license": f"{args.source.title()} License",
                "slide": args.slide,
                "downloaded_at": datetime.now().isoformat(),
            })

            credits_file.write_text(json.dumps(data, indent=2))

        print(f"Downloaded to: {output_path}")

    elif args.command == "edit":
        tools = get_tools_for_deck(args.deck) if args.deck else ImageAcquisitionTools()
        result = tools.edit_image(
            prompt=args.prompt,
            input_path=args.input,
            output_path=args.output,
            brand_context=args.brand,
            slide_number=args.slide,
        )
        print(f"Edited: {args.output} ({result.mime_type})")
