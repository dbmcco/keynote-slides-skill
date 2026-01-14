#!/usr/bin/env bash
# ABOUTME: Serve the decks directory with a local static web server.
# ABOUTME: Useful for previewing and printing decks to PDF.
set -euo pipefail

port="${1:-8000}"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../../.." && pwd)"

echo "Serving decks at http://localhost:${port}/decks/"
python3 -m http.server "$port" --directory "$repo_root"
