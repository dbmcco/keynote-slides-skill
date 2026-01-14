---
name: keynote-slides
description: Build Keynote-style single-file HTML slide decks with brand-ready templates, minimal navigation, and Gemini nano banana media generation (text-to-image, image-to-image, text-to-video, image-to-video). Use when creating or editing slide decks, applying brand tokens, or generating slide visuals and diagrams.
---
<!-- ABOUTME: Skill guide for building Keynote-style HTML decks with brand tokens and Gemini media hooks. -->
<!-- ABOUTME: Points to the single-file template, templates, and media generation workflow. -->
# Keynote Slides

## Assets

- `assets/keynote-slides.html` holds the single-file slide deck template.
- `references/brand-guidelines.md` captures brand tokens, typography, and image style guidance.
- `references/gemini-media.md` documents the Gemini nano banana and Veo media settings.

## Workflow

1. Run the deck bootstrap to create a deck folder:
```bash
scripts/new-deck.sh lfw-pitch-2026 --entity lightforgeworks --title "LFW Pitch 2026" --type pitch
```
2. Update `decks/brands.js` when brand tokens change.
3. Edit `decks/<deck-id>/index.html` and duplicate slides inside `<main id="deck">`, keeping each `data-title` unique.
4. Use layout classes (`layout-title`, `layout-split`, `layout-grid`, `layout-metrics`, `layout-quote`) to keep spacing consistent.
5. Apply `reveal` plus `--reveal-index` to stagger key elements.

## Entities

- Use the generator panel to select the active entity profile.
- Add `data-entity="entity-id"` on a slide to override the global profile for that slide.
- Add `?entity=entity-id` to the URL for a quick switch.
- Use `mediaPromptPrefix` in `brandProfiles` to keep Gemini media outputs on brand.

## Deck storage

- `decks/<deck-id>/index.html` is the editable deck file.
- `decks/<deck-id>/deck-config.js` stores deck metadata (entity, title, resources).
- `decks/<deck-id>/deck.json` stores the same metadata in JSON form.
- `decks/<deck-id>/slides.md` is for draft copy and notes.
- `decks/<deck-id>/resources/assets/` holds logos, images, and media inputs.
- `decks/<deck-id>/resources/materials/` holds briefs, pricing docs, P&L inputs, and outlines.

## Collaboration

- Co-author the narrative: propose headlines, POV, and slide ordering based on `deckType` and entity preferences.
- Keep the brief in `resources/materials/brief.md` and capture evolving preferences in `deck.json` or `decks/brands.js`.
- Use concise headline options (3-5 variants) and confirm direction before building slides.

## Review loop

- Use the Chrome Devtools MCP tools to capture a snapshot/screenshot and review layout.
- Check hierarchy, alignment, spacing rhythm, and contrast; then adjust copy and spacing.
- Use the generator panel for brand-aware media, then re-check balance and whitespace.

## Templates

- Copy markup from the `<template>` blocks at the bottom of the file.
- Replace placeholders with branded copy, numbers, and visuals.

## Media generation

1. Add `data-gen` and `data-prompt` to `<img>` or `<video>` elements.
2. Open the generator panel with `g` or the `Gen` button.
3. Save the API key and model settings to localStorage (never commit keys).
4. For image-to-image or image-to-video, load a base image in the panel.
5. Run "Generate slide" or "Generate all" and review outputs.

## Preview

```bash
scripts/serve-decks.sh
```
Then open `http://<tailscale-ip>:8921/decks/<deck-id>/index.html`.

## PDF export

- Use the browser print dialog and "Save as PDF".
- Enable background graphics for gradients and color fills.
- The template includes print styles to paginate each slide.

## Navigation

- Arrow keys, PageUp/PageDown, Space.
- Home/End for first or last slide.
- Use `#slide-title` hash navigation for direct jumps.
