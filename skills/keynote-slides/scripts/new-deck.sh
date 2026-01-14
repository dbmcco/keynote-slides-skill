#!/usr/bin/env bash
# ABOUTME: Bootstrap script to create a new deck folder from the template.
# ABOUTME: Writes deck metadata, config, and resource scaffolding.
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: new-deck.sh <deck-id> [--entity ENTITY_ID] [--title TITLE] [--type DECK_TYPE] [--audience AUDIENCE] [--force]

Examples:
  new-deck.sh lfw-pitch-2026 --entity lightforgeworks --title "LFW Pitch 2026" --type pitch
  new-deck.sh synthyra-seed --entity synthyra
EOF
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi

deck_id=""
entity="lightforgeworks"
title=""
deck_type=""
audience=""
force="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --entity)
      entity="${2:-}"
      shift 2
      ;;
    --title)
      title="${2:-}"
      shift 2
      ;;
    --type|--deck-type)
      deck_type="${2:-}"
      shift 2
      ;;
    --audience)
      audience="${2:-}"
      shift 2
      ;;
    --force)
      force="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      if [[ -z "$deck_id" ]]; then
        deck_id="$1"
        shift
      else
        echo "Unknown argument: $1" >&2
        usage
        exit 1
      fi
      ;;
  esac
done

if [[ -z "$deck_id" ]]; then
  usage
  exit 1
fi

if [[ -z "$title" ]]; then
  title="$deck_id"
fi

if [[ -z "$deck_type" ]]; then
  deck_type="pitch"
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../../.." && pwd)"
template_path="${script_dir}/../assets/keynote-slides.html"
deck_dir="${repo_root}/decks/${deck_id}"

if [[ ! -f "$template_path" ]]; then
  echo "Template not found: $template_path" >&2
  exit 1
fi

if [[ -d "$deck_dir" && "$force" != "true" ]]; then
  echo "Deck already exists: $deck_dir (use --force to overwrite)" >&2
  exit 1
fi

rm -rf "$deck_dir"
mkdir -p "$deck_dir/resources/assets" "$deck_dir/resources/materials"
cp "$template_path" "$deck_dir/index.html"

python3 - "$deck_dir" "$deck_id" "$entity" "$title" "$deck_type" "$audience" <<'PY'
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

deck_dir = Path(sys.argv[1])
deck_id = sys.argv[2]
entity = sys.argv[3]
title = sys.argv[4]
deck_type = sys.argv[5]
audience = sys.argv[6] or ""
timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

payload = {
    "id": deck_id,
    "title": title,
    "entity": entity,
    "deckType": deck_type,
    "audience": audience,
    "createdAt": timestamp,
    "updatedAt": timestamp,
    "preferences": {
        "voice": "",
        "headlineStyle": "",
        "density": "",
        "visualMood": "",
    },
    "resources": {
        "assets": [],
        "materials": ["materials/brief.md"],
        "notes": ["slides.md"],
    },
}

(deck_dir / "deck.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

config_lines = [
    "// ABOUTME: Deck configuration for Keynote-style slides.",
    "// ABOUTME: Loaded before the main deck script.",
    f"window.KEYNOTE_DECK = {json.dumps(payload, indent=2)};",
    "",
]
(deck_dir / "deck-config.js").write_text("\n".join(config_lines), encoding="utf-8")
PY

cat <<'EOF' > "${deck_dir}/slides.md"
# Slides

- Capture slide copy, outlines, and notes here.
- Drop assets in ./resources/assets and reference them in the deck.
EOF

cat <<'EOF' > "${deck_dir}/resources/materials/brief.md"
# Brief

## Goals

## Audience

## Narrative

## Key proof points

## Must-include slides

## Risks / constraints
EOF

echo "Created deck: ${deck_dir}"
echo "Entity: ${entity}"
echo "Deck type: ${deck_type}"
