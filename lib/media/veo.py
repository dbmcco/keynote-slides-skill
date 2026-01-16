# ABOUTME: Veo video generation client via Kie.ai API.
# ABOUTME: Supports text-to-video and image-to-video generation.

from __future__ import annotations

import base64
import json
import os
import time
import urllib.request
import urllib.error
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Literal


def _load_api_key() -> str:
    """Load Kie.ai API key from environment."""
    api_key = os.environ.get("KIE_API_KEY")
    if api_key:
        return api_key

    raise ValueError(
        "No Kie.ai API key found. Set KIE_API_KEY environment variable."
    )


@dataclass(frozen=True)
class VideoResult:
    """Result from video generation."""
    task_id: str
    status: str
    video_url: Optional[str]
    video_urls: list[str]
    error: Optional[str]

    def download(self, path: Path | str) -> Path:
        """Download video to file."""
        if not self.video_url:
            raise ValueError("No video URL available")

        path = Path(path)
        req = urllib.request.Request(self.video_url)
        with urllib.request.urlopen(req, timeout=120) as response:
            path.write_bytes(response.read())
        return path


class VeoError(Exception):
    """Error from Veo/Kie.ai API."""
    pass


class VeoClient:
    """Client for Veo video generation via Kie.ai."""

    BASE_URL = "https://api.kie.ai/api/v1"
    UPLOAD_URL = "https://kieai.redpandaai.co/api/file-base64-upload"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or _load_api_key()

    def generate_video(
        self,
        prompt: str,
        model: Literal["veo3", "veo3_fast"] = "veo3",
        aspect_ratio: Literal["16:9", "9:16", "1:1"] = "16:9",
        wait: bool = True,
        timeout: int = 600,
        poll_interval: int = 10,
    ) -> VideoResult:
        """
        Generate video from text prompt.

        Args:
            prompt: Text description of the video
            model: "veo3" (quality) or "veo3_fast" (speed)
            aspect_ratio: "16:9", "9:16", or "1:1"
            wait: Whether to wait for completion
            timeout: Max seconds to wait
            poll_interval: Seconds between status checks

        Returns:
            VideoResult with task info and video URL(s)
        """
        payload = {
            "prompt": prompt,
            "model": model,
            "aspectRatio": aspect_ratio,
            "enableTranslation": True,
            "generationType": "TEXT_2_VIDEO",
        }

        task_id = self._submit_task(payload)

        if wait:
            return self._wait_for_completion(task_id, timeout, poll_interval)

        return VideoResult(
            task_id=task_id,
            status="pending",
            video_url=None,
            video_urls=[],
            error=None,
        )

    def generate_video_from_image(
        self,
        prompt: str,
        image_path: Path | str,
        model: Literal["veo3", "veo3_fast"] = "veo3",
        aspect_ratio: Literal["16:9", "9:16", "1:1"] = "16:9",
        wait: bool = True,
        timeout: int = 600,
        poll_interval: int = 10,
    ) -> VideoResult:
        """
        Generate video from image + prompt (image-to-video).

        Args:
            prompt: Text description of the video motion/content
            image_path: Path to the reference image
            model: "veo3" (quality) or "veo3_fast" (speed)
            aspect_ratio: "16:9", "9:16", or "1:1"
            wait: Whether to wait for completion
            timeout: Max seconds to wait
            poll_interval: Seconds between status checks

        Returns:
            VideoResult with task info and video URL(s)
        """
        # Upload image first
        image_url = self._upload_image(Path(image_path))

        payload = {
            "prompt": prompt,
            "imageUrls": [image_url],
            "model": model,
            "aspectRatio": aspect_ratio,
            "enableTranslation": True,
            "generationType": "REFERENCE_2_VIDEO",
        }

        task_id = self._submit_task(payload)

        if wait:
            return self._wait_for_completion(task_id, timeout, poll_interval)

        return VideoResult(
            task_id=task_id,
            status="pending",
            video_url=None,
            video_urls=[],
            error=None,
        )

    def get_status(self, task_id: str) -> VideoResult:
        """Check status of a video generation task."""
        url = f"{self.BASE_URL}/veo/record-info?taskId={task_id}"
        headers = {"Authorization": f"Bearer {self.api_key}"}

        req = urllib.request.Request(url, headers=headers, method="GET")

        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                result = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8") if e.fp else str(e)
            raise VeoError(f"API error {e.code}: {error_body}") from e

        return self._parse_status(task_id, result)

    def _submit_task(self, payload: dict) -> str:
        """Submit generation task and return task ID."""
        url = f"{self.BASE_URL}/veo/generate"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")

        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                result = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8") if e.fp else str(e)
            raise VeoError(f"API error {e.code}: {error_body}") from e

        # Extract task ID from response
        task_id = result.get("data", {}).get("taskId") or result.get("taskId")
        if not task_id:
            raise VeoError(f"No task ID in response: {result}")

        return task_id

    def _upload_image(self, image_path: Path) -> str:
        """Upload image and return URL."""
        mime_types = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
        }
        suffix = image_path.suffix.lower()
        mime_type = mime_types.get(suffix, "image/jpeg")

        image_bytes = image_path.read_bytes()
        base64_data = base64.b64encode(image_bytes).decode("utf-8")
        data_uri = f"data:{mime_type};base64,{base64_data}"

        payload = {
            "base64Data": data_uri,
            "uploadPath": "keynote-slides-uploads",
            "fileName": image_path.name,
        }

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(self.UPLOAD_URL, data=data, headers=headers, method="POST")

        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                result = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8") if e.fp else str(e)
            raise VeoError(f"Upload error {e.code}: {error_body}") from e

        # Extract URL from response
        download_url = result.get("data", {}).get("downloadUrl")
        if not download_url:
            raise VeoError(f"No download URL in upload response: {result}")

        return download_url

    def _wait_for_completion(
        self,
        task_id: str,
        timeout: int,
        poll_interval: int,
    ) -> VideoResult:
        """Poll until task completes or times out."""
        start = time.time()

        while time.time() - start < timeout:
            result = self.get_status(task_id)

            if result.status in ("completed", "success", "succeeded"):
                return result

            if result.status in ("failed", "error"):
                raise VeoError(f"Task failed: {result.error}")

            time.sleep(poll_interval)

        raise VeoError(f"Task {task_id} timed out after {timeout}s")

    def _parse_status(self, task_id: str, response: dict) -> VideoResult:
        """Parse status response into VideoResult."""
        data = response.get("data", response)

        state = data.get("state", data.get("status", "unknown"))

        # Normalize state
        status_map = {
            "pending": "pending",
            "processing": "processing",
            "completed": "completed",
            "success": "completed",
            "succeeded": "completed",
            "failed": "failed",
            "error": "failed",
        }
        status = status_map.get(state.lower(), state)

        # Extract video URLs
        video_urls = []
        result_json = data.get("resultJson")
        if result_json:
            try:
                parsed = json.loads(result_json) if isinstance(result_json, str) else result_json
                video_urls = parsed.get("resultUrls", [])
            except (json.JSONDecodeError, TypeError):
                pass

        error = data.get("failMsg") or data.get("error")

        return VideoResult(
            task_id=task_id,
            status=status,
            video_url=video_urls[0] if video_urls else None,
            video_urls=video_urls,
            error=error,
        )


def generate_video(
    prompt: str,
    output_path: Optional[Path | str] = None,
    model: Literal["veo3", "veo3_fast"] = "veo3",
    aspect_ratio: Literal["16:9", "9:16", "1:1"] = "16:9",
) -> VideoResult:
    """
    Convenience function to generate a video.

    Args:
        prompt: Text description of the video
        output_path: Optional path to download the video
        model: "veo3" (quality) or "veo3_fast" (speed)
        aspect_ratio: "16:9", "9:16", or "1:1"

    Returns:
        VideoResult with video URL(s)
    """
    client = VeoClient()
    result = client.generate_video(prompt, model=model, aspect_ratio=aspect_ratio)

    if output_path and result.video_url:
        result.download(output_path)

    return result


def generate_video_from_image(
    prompt: str,
    image_path: Path | str,
    output_path: Optional[Path | str] = None,
    model: Literal["veo3", "veo3_fast"] = "veo3",
    aspect_ratio: Literal["16:9", "9:16", "1:1"] = "16:9",
) -> VideoResult:
    """
    Convenience function to generate video from image.

    Args:
        prompt: Text description of the video motion/content
        image_path: Path to reference image
        output_path: Optional path to download the video
        model: "veo3" (quality) or "veo3_fast" (speed)
        aspect_ratio: "16:9", "9:16", or "1:1"

    Returns:
        VideoResult with video URL(s)
    """
    client = VeoClient()
    result = client.generate_video_from_image(
        prompt, image_path, model=model, aspect_ratio=aspect_ratio
    )

    if output_path and result.video_url:
        result.download(output_path)

    return result


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python veo.py <prompt> [output_path]")
        sys.exit(1)

    prompt = sys.argv[1]
    output = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("output.mp4")

    print(f"Generating video for: {prompt[:50]}...")
    result = generate_video(prompt, output)
    print(f"Status: {result.status}")
    if result.video_url:
        print(f"Video URL: {result.video_url}")
        print(f"Downloaded to: {output}")
