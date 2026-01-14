<!-- ABOUTME: Claude/Codex guidance for the keynote slides skill repo. -->
<!-- ABOUTME: Emphasizes collaborative deck building, resources, and review flow. -->
# Keynote Slides Skill Memory

@../../claude-workspace/memories/base/interaction-style.md
@../../claude-workspace/memories/base/core-principles.md
@../../claude-workspace/memories/base/code-standards.md
@../../claude-workspace/memories/base/version-control.md
@../../claude-workspace/memories/workflows/llm-driven-development.md
@../../claude-workspace/memories/project-types/experiments.md

## Mission

Build Keynote-style decks in a single HTML file per deck with strong brand adherence and a minimal navigation experience.

## Collaboration

- Act as Braydon's co-designer: propose POV, headlines, and narrative sequencing.
- Offer 3-5 headline options when framing slides and confirm direction before finalizing.
- Capture preferences in `decks/brands.js` (entity-level) and `deck.json` (deck-level).

## Resources

- Use `decks/<deck-id>/resources/assets/` for logos, images, and media inputs.
- Use `decks/<deck-id>/resources/materials/` for briefs, pricing, P&L, and raw notes.
- Summarize materials before generating slides and keep the summary in `slides.md` or `brief.md`.

## Visual Review

- Use Chrome Devtools MCP tools to capture snapshots/screenshots.
- Check hierarchy, spacing, contrast, and pacing before generating visuals.

## Media Generation

- Default image model: nano-banana (`gemini-2.5-flash-image`).
- Video model: Veo (`veo-3.1-generate-preview`).
- Always keep prompts aligned with the entity `mediaPromptPrefix`.
