<!-- ABOUTME: Repo-specific agent guidance for the keynote slides skill. -->
<!-- ABOUTME: Defines workflow, deck structure, and session completion steps. -->
# AGENTS.md

- Scope: Applies to this repo only.
- Precedence: Deeper AGENTS.md overrides higher-level files.
- Purpose: Guidance for Codex/Claude CLI agents working on decks and templates.
- Practices: Keep edits minimal and scoped; follow repo style; avoid unrelated changes.
- Validation: This is a content/templates repo; no automated tests required.

## Quickstart

```bash
skills/keynote-slides/scripts/new-deck.sh lfw-pitch-2026 --entity lightforgeworks --title "LFW Pitch 2026"
skills/keynote-slides/scripts/serve-decks.sh
```

Open `http://<tailscale-ip>:8921/decks/lfw-pitch-2026/index.html`.

## Deck Structure

- `decks/brands.js` stores persistent brand profiles and deck-type preferences.
- `decks/<deck-id>/index.html` is the deck template.
- `decks/<deck-id>/deck-config.js` and `deck.json` store metadata.
- `decks/<deck-id>/resources/assets/` holds logos and visuals (incl. nano-banana inputs).
- `decks/<deck-id>/resources/materials/` holds briefs, pricing, P&L, and notes.

## Review Loop

- Use Chrome Devtools MCP tools to capture snapshots/screenshots for review.
- Check hierarchy, spacing rhythm, contrast, and pacing before generating visuals.

## Issue Tracking

This project uses **bd** (beads). Run `bd onboard` to get started.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
