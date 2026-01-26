# ABOUTME: Media generation utilities for keynote decks.
# ABOUTME: Supports Gemini image generation (nano-banana), Veo video, and image search.

from .nano_banana import NanoBananaClient, ImageResult
from .veo import VeoClient, VideoResult
from .image_search import ImageSearchClient, SearchResult, search_images
from .model_mediated import ImageAcquisitionTools, get_tools_for_deck

__all__ = [
    # Image generation
    "NanoBananaClient",
    "ImageResult",
    # Video generation
    "VeoClient",
    "VideoResult",
    # Image search
    "ImageSearchClient",
    "SearchResult",
    "search_images",
    # Model-mediated tools (Claude decides, tools execute)
    "ImageAcquisitionTools",
    "get_tools_for_deck",
]
