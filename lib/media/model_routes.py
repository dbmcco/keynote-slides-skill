# ABOUTME: Shared model route access for Keynote media generation.
# ABOUTME: Resolves concrete models through paia-agent-runtime's central registry.

from __future__ import annotations

import sys
from functools import lru_cache
from pathlib import Path


_ROUTE_RUNTIME_SRC = Path(__file__).resolve().parents[3] / "paia-agent-runtime" / "src"
if _ROUTE_RUNTIME_SRC.is_dir() and str(_ROUTE_RUNTIME_SRC) not in sys.path:
    sys.path.insert(0, str(_ROUTE_RUNTIME_SRC))

from paia_agent_runtime import CognitionRegistry, ModelRoute  # noqa: E402


KEYNOTE_IMAGE_GENERATION_ROUTE = "keynote.image_generation"
KEYNOTE_GEMINI_VIDEO_PRIMARY_ROUTE = "keynote.gemini_video_primary"
KEYNOTE_GEMINI_VIDEO_SECONDARY_ROUTE = "keynote.gemini_video_secondary"
KEYNOTE_KIE_VEO_QUALITY_ROUTE = "keynote.kie_veo_quality"
KEYNOTE_KIE_VEO_FAST_ROUTE = "keynote.kie_veo_fast"

KEYNOTE_BROWSER_ROUTES = (
    KEYNOTE_IMAGE_GENERATION_ROUTE,
    KEYNOTE_GEMINI_VIDEO_PRIMARY_ROUTE,
    KEYNOTE_GEMINI_VIDEO_SECONDARY_ROUTE,
)


@lru_cache(maxsize=1)
def _registry() -> CognitionRegistry:
    return CognitionRegistry()


def route_for(route_id: str) -> ModelRoute:
    return _registry().model_route(route_id)


def model_for_route(route_id: str) -> str:
    return route_for(route_id).model


def browser_route_ids() -> tuple[str, ...]:
    return KEYNOTE_BROWSER_ROUTES
