# ABOUTME: Unified image search client for Unsplash, Pexels, and Google Custom Search.
# ABOUTME: Model-mediated selection - code searches, model decides which image fits best.

from __future__ import annotations

import json
import os
import urllib.request
import urllib.error
import urllib.parse
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Optional
from datetime import datetime


@dataclass
class SearchResult:
    """Result from image search."""
    id: str
    source: str  # 'unsplash' | 'pexels' | 'google'
    url: str  # Full-size download URL
    thumbnail_url: str  # Preview URL
    description: str
    photographer: str
    photographer_url: str
    width: int
    height: int
    license: str
    photo_page_url: str  # Link to original page for attribution

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class Attribution:
    """Attribution record for a downloaded image."""
    file: str
    source: str
    photographer: str
    photographer_url: str
    photo_url: str
    license: str
    slide: Optional[int] = None
    downloaded_at: Optional[str] = None


class ImageSearchError(Exception):
    """Error from image search API."""
    pass


class UnsplashClient:
    """Client for Unsplash API."""

    BASE_URL = "https://api.unsplash.com"

    def __init__(self, access_key: Optional[str] = None):
        self.access_key = access_key or os.environ.get("UNSPLASH_ACCESS_KEY")
        if not self.access_key:
            raise ValueError("UNSPLASH_ACCESS_KEY not set")

    def search(
        self,
        query: str,
        per_page: int = 10,
        orientation: Optional[str] = None,  # landscape | portrait | squarish
    ) -> list[SearchResult]:
        """Search Unsplash for images."""
        params = {
            "query": query,
            "per_page": per_page,
        }
        if orientation:
            params["orientation"] = orientation

        url = f"{self.BASE_URL}/search/photos?{urllib.parse.urlencode(params)}"
        headers = {
            "Authorization": f"Client-ID {self.access_key}",
            "Accept-Version": "v1",
        }

        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                data = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            raise ImageSearchError(f"Unsplash API error {e.code}: {e.read().decode()}") from e

        results = []
        for photo in data.get("results", []):
            results.append(SearchResult(
                id=photo["id"],
                source="unsplash",
                url=photo["urls"]["full"],
                thumbnail_url=photo["urls"]["small"],
                description=photo.get("description") or photo.get("alt_description") or "",
                photographer=photo["user"]["name"],
                photographer_url=photo["user"]["links"]["html"],
                width=photo["width"],
                height=photo["height"],
                license="Unsplash License",
                photo_page_url=photo["links"]["html"],
            ))

        return results

    def download(self, result: SearchResult) -> bytes:
        """Download image and trigger download tracking on Unsplash."""
        # Trigger download endpoint (required by Unsplash API guidelines)
        trigger_url = f"{self.BASE_URL}/photos/{result.id}/download"
        headers = {"Authorization": f"Client-ID {self.access_key}"}
        req = urllib.request.Request(trigger_url, headers=headers)
        try:
            urllib.request.urlopen(req, timeout=10)
        except Exception:
            pass  # Non-critical

        # Download the actual image
        req = urllib.request.Request(result.url)
        with urllib.request.urlopen(req, timeout=60) as response:
            return response.read()


class PexelsClient:
    """Client for Pexels API."""

    BASE_URL = "https://api.pexels.com/v1"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("PEXELS_API_KEY")
        if not self.api_key:
            raise ValueError("PEXELS_API_KEY not set")

    def search(
        self,
        query: str,
        per_page: int = 10,
        orientation: Optional[str] = None,  # landscape | portrait | square
    ) -> list[SearchResult]:
        """Search Pexels for images."""
        params = {
            "query": query,
            "per_page": per_page,
        }
        if orientation:
            params["orientation"] = orientation

        url = f"{self.BASE_URL}/search?{urllib.parse.urlencode(params)}"
        headers = {"Authorization": self.api_key}

        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                data = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            raise ImageSearchError(f"Pexels API error {e.code}: {e.read().decode()}") from e

        results = []
        for photo in data.get("photos", []):
            results.append(SearchResult(
                id=str(photo["id"]),
                source="pexels",
                url=photo["src"]["original"],
                thumbnail_url=photo["src"]["medium"],
                description=photo.get("alt") or "",
                photographer=photo["photographer"],
                photographer_url=photo["photographer_url"],
                width=photo["width"],
                height=photo["height"],
                license="Pexels License",
                photo_page_url=photo["url"],
            ))

        return results

    def download(self, result: SearchResult) -> bytes:
        """Download image from Pexels."""
        req = urllib.request.Request(result.url)
        with urllib.request.urlopen(req, timeout=60) as response:
            return response.read()


class GoogleImageSearchClient:
    """Client for Google Custom Search API (image search)."""

    BASE_URL = "https://www.googleapis.com/customsearch/v1"

    def __init__(
        self,
        api_key: Optional[str] = None,
        search_engine_id: Optional[str] = None,
    ):
        self.api_key = api_key or os.environ.get("GOOGLE_CUSTOM_SEARCH_KEY")
        self.cx = search_engine_id or os.environ.get("GOOGLE_CUSTOM_SEARCH_CX")
        if not self.api_key or not self.cx:
            raise ValueError("GOOGLE_CUSTOM_SEARCH_KEY and GOOGLE_CUSTOM_SEARCH_CX required")

    def search(
        self,
        query: str,
        per_page: int = 10,
        usage_rights: str = "cc_publicdomain,cc_attribute,cc_sharealike",
    ) -> list[SearchResult]:
        """Search Google for images with usage rights filter."""
        params = {
            "key": self.api_key,
            "cx": self.cx,
            "q": query,
            "searchType": "image",
            "num": min(per_page, 10),  # Google max is 10
            "rights": usage_rights,
            "safe": "active",
        }

        url = f"{self.BASE_URL}?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(url)

        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                data = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            raise ImageSearchError(f"Google API error {e.code}: {e.read().decode()}") from e

        results = []
        for item in data.get("items", []):
            image = item.get("image", {})
            results.append(SearchResult(
                id=item.get("link", "")[:50],  # Use URL fragment as ID
                source="google",
                url=item["link"],
                thumbnail_url=image.get("thumbnailLink", item["link"]),
                description=item.get("title", ""),
                photographer="Unknown",  # Google doesn't always provide this
                photographer_url=item.get("image", {}).get("contextLink", ""),
                width=image.get("width", 0),
                height=image.get("height", 0),
                license="Creative Commons (verify)",
                photo_page_url=item.get("image", {}).get("contextLink", ""),
            ))

        return results

    def download(self, result: SearchResult) -> bytes:
        """Download image from original source."""
        req = urllib.request.Request(result.url)
        req.add_header("User-Agent", "Mozilla/5.0")  # Some sites block default urllib agent
        with urllib.request.urlopen(req, timeout=60) as response:
            return response.read()


class ImageSearchClient:
    """Unified client for multiple image search sources."""

    def __init__(self):
        self._clients: dict[str, object] = {}

        # Initialize available clients
        try:
            self._clients["unsplash"] = UnsplashClient()
        except ValueError:
            pass

        try:
            self._clients["pexels"] = PexelsClient()
        except ValueError:
            pass

        try:
            self._clients["google"] = GoogleImageSearchClient()
        except ValueError:
            pass

        if not self._clients:
            raise ValueError(
                "No image search APIs configured. Set at least one of: "
                "UNSPLASH_ACCESS_KEY, PEXELS_API_KEY, or GOOGLE_CUSTOM_SEARCH_KEY"
            )

    @property
    def available_sources(self) -> list[str]:
        """List of configured sources."""
        return list(self._clients.keys())

    def search(
        self,
        query: str,
        sources: Optional[list[str]] = None,
        per_page: int = 10,
        orientation: Optional[str] = None,  # landscape | portrait | square
        min_width: int = 1600,
    ) -> list[SearchResult]:
        """
        Search across multiple sources.

        Args:
            query: Search query
            sources: Which sources to search (default: all available)
            per_page: Results per source
            orientation: Image orientation filter
            min_width: Minimum image width

        Returns:
            Combined results from all sources
        """
        sources = sources or self.available_sources
        all_results = []

        for source in sources:
            if source not in self._clients:
                continue

            client = self._clients[source]
            try:
                if source == "google":
                    results = client.search(query, per_page=per_page)
                else:
                    results = client.search(query, per_page=per_page, orientation=orientation)

                # Filter by minimum width
                results = [r for r in results if r.width >= min_width]
                all_results.extend(results)

            except ImageSearchError as e:
                print(f"Warning: {source} search failed: {e}")
                continue

        return all_results

    def download(
        self,
        result: SearchResult,
        output_path: Path,
        credits_file: Optional[Path] = None,
        slide_number: Optional[int] = None,
    ) -> Path:
        """
        Download image and track attribution.

        Args:
            result: Search result to download
            output_path: Where to save the image
            credits_file: Optional path to image-credits.json
            slide_number: Optional slide number for attribution

        Returns:
            Path to downloaded image
        """
        if result.source not in self._clients:
            raise ImageSearchError(f"No client for source: {result.source}")

        client = self._clients[result.source]
        image_bytes = client.download(result)

        # Save image
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(image_bytes)

        # Track attribution
        if credits_file:
            self._add_attribution(
                credits_file=credits_file,
                output_path=output_path,
                result=result,
                slide_number=slide_number,
            )

        return output_path

    def _add_attribution(
        self,
        credits_file: Path,
        output_path: Path,
        result: SearchResult,
        slide_number: Optional[int],
    ) -> None:
        """Add attribution to credits file."""
        credits_file = Path(credits_file)

        # Load existing credits
        if credits_file.exists():
            data = json.loads(credits_file.read_text())
        else:
            data = {"images": []}

        # Add new attribution
        attribution = Attribution(
            file=str(output_path),
            source=result.source,
            photographer=result.photographer,
            photographer_url=result.photographer_url,
            photo_url=result.photo_page_url,
            license=result.license,
            slide=slide_number,
            downloaded_at=datetime.now().isoformat(),
        )
        data["images"].append(asdict(attribution))

        # Save
        credits_file.parent.mkdir(parents=True, exist_ok=True)
        credits_file.write_text(json.dumps(data, indent=2))


def search_images(
    query: str,
    sources: Optional[list[str]] = None,
    per_page: int = 10,
    orientation: str = "landscape",
) -> list[SearchResult]:
    """
    Convenience function to search for images.

    Args:
        query: Search query
        sources: Which sources to search
        per_page: Results per source
        orientation: Image orientation

    Returns:
        List of search results
    """
    client = ImageSearchClient()
    return client.search(query, sources=sources, per_page=per_page, orientation=orientation)


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python image_search.py <query> [output_path]")
        print("\nConfigured sources will be used automatically.")
        sys.exit(1)

    query = sys.argv[1]
    output = Path(sys.argv[2]) if len(sys.argv) > 2 else None

    print(f"Searching for: {query}")
    client = ImageSearchClient()
    print(f"Available sources: {client.available_sources}")

    results = client.search(query, per_page=5)
    print(f"\nFound {len(results)} results:\n")

    for i, r in enumerate(results, 1):
        print(f"{i}. [{r.source}] {r.description[:60]}...")
        print(f"   {r.width}x{r.height} by {r.photographer}")
        print(f"   {r.thumbnail_url}\n")

    if output and results:
        print(f"Downloading first result to {output}...")
        client.download(results[0], output)
        print("Done!")
