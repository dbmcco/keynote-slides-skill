---
name: keynote-slides
description: Build Keynote-style single-file HTML slide decks with brand-ready templates, minimal navigation, and Gemini nano banana media generation. Includes Narrative Engine integration for framework-driven deck creation with 17 proven storytelling structures and 5-agent review panel. Use when creating or editing slide decks, transforming content into presentations, or generating slide visuals.
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
scripts/new-deck.sh example-pitch --entity northwind --title "Example Pitch" --type pitch
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

## Speaker notes

- Add per-slide notes with a hidden block:
  ```html
  <aside class="slide-notes">Speaker notes here.</aside>
  ```
- Toggle the notes panel with the "Notes" button or press `n`.
- Append `?notes=1` to open notes by default.
- Use "Export notes" to download a markdown file.

## Animation + SVG

- Use `data-anim` for lightweight animations (fade, slide-up, slide-left, slide-right, scale-in).
- Set `--anim-delay` to stagger; avoid mixing with `reveal` on the same element.
- Disable animation with `?motion=off` or rely on `prefers-reduced-motion`.
- Inline SVG diagrams use `.diagram` and `data-media="svg"`:
  ```html
  <svg class="diagram" data-media="svg" viewBox="0 0 800 450" role="img" aria-label="Diagram"></svg>
  ```
- Keep media lanes explicit:
  - `data-gen` = Gemini only (optional `data-media="gemini"`).
  - Inline SVG = no `data-gen`.
  - Static images/videos = no `data-gen`.

## Copy editor

- Open `decks/<deck-id>/editor.html` in a second window to edit copy without touching HTML.
- Use the editor "Open deck" button to connect and update the live preview.
- For existing decks, copy the template first:
  ```bash
  cp skills/keynote-slides/assets/keynote-editor.html decks/<deck-id>/editor.html
  ```
- Edits are stored in localStorage; export JSON from the editor for handoff.

## PDF export

- Use the browser print dialog and "Save as PDF".
- Enable background graphics for gradients and color fills.
- The template includes print styles to paginate each slide.
- CLI option:
  ```bash
  node scripts/export-pdf.js decks/<deck-id> --out /tmp/<deck-id>.pdf
  ```

## Navigation

- Arrow keys, PageUp/PageDown, Space.
- Home/End for first or last slide.
- Use `#slide-title` hash navigation for direct jumps.

---

## Narrative Engine Integration

For content-driven deck creation, use the Narrative Engine workflow that matches your material to proven storytelling frameworks.

### Reference Files

- `references/narrative-engine/narrative-arcs.md` — Beat-by-beat structures for 10 narrative arcs
- `references/narrative-engine/framework-selection.md` — Selection matrix by audience/purpose/content
- `references/narrative-engine/framework_selection_guide.md` — Deep pairing guidance for arcs + frameworks
- `references/narrative-engine/communication-frameworks.md` — 7 efficiency-optimized frameworks
- `references/narrative-engine/checklists.md` — Quality gates for narrative + copy review
- `references/narrative-engine/agent-reference-*.md` — Agent-specific frameworks for review

### Workflow: Narrative Build

1. **Ingest resources:** Run `node scripts/ingest-resources.js decks/<deck-id>` to read all materials
   - Or use `node scripts/narrative-build.js decks/<deck-id>` to prepare model-mediated prompts
2. **Focal discovery + discovery:** Align on the one point, then answer 5 questions (audience, purpose, content type, tone, reveal)
3. **Density + framework match:** Choose density mode, then get 2-3 recommendations with content mapped to structure
4. **Deck generation:** Build slides with source attribution tags
5. **Review panel:** 5 agents + Director synthesize feedback

### Discovery Questions

| Question | Options |
|----------|---------|
| **Audience** | Executive, Technical, Investors, Skeptics, General, Mixed |
| **Purpose** | Persuade, Inform, Inspire, Align, Report, Defend, Entertain |
| **Content type** | Research, Strategy, Origin story, Post-mortem, Pattern insight, etc. |
| **Tone** | Authoritative, Provocative, Warm, Urgent, Balanced, Visionary |
| **Reveal potential** | Yes (has surprise), No (straightforward), Help me find one |

### Framework Selection Quick Reference

| If your content has... | Consider... |
|------------------------|-------------|
| A genuine surprise | The Prestige or Mystery Box |
| Multiple stakeholder views | Rashomon |
| A transformation story | Hero's Journey |
| Future vision | Time Machine |
| Root cause analysis | Columbo |
| Strategy/roadmap | The Heist |
| Paradigm shift | Trojan Horse |

### 5-Agent Review Panel

| Agent | Lens | Key Question |
|-------|------|--------------|
| **Audience Advocate** | Target audience persona | "Does this land for [audience]?" |
| **Comms Specialist** | Messaging, emotion, PR risk | "Is this tight and bulletproof?" |
| **Visual Designer** | Metaphor coherence, S.T.A.R. moments | "What visual makes this unforgettable?" |
| **Critic** | Pacing, weak links, efficacy | "What's the weakest link?" |
| **Content Expert** | Accuracy, logic, sources | "Can every claim be defended?" |

### Source Attribution Tags

| Tag | Meaning |
|-----|---------|
| `[DIRECT]` | Verbatim from source material |
| `[PARAPHRASE]` | Restated ideas |
| `[ELABORATED]` | Expanded concept |
| `[SYNTHESIZED]` | Combined multiple sources |
| `[GENERATED]` | New content for flow |

### Headline Rules

- **Image & Action:** Concrete nouns + strong transitive verbs; avoid "is/are"
- **Tension & Turn:** Because/Therefore, Not/But, Before/After
- **Cadence:** 8-14 words; two-beat rhythm
- **Specific Anchors:** Time/place/actor/number in every third headline
- **Power verbs:** tilts, unseats, ignites, drains, compounds, unlocks, anchors, accelerates
- **Metaphor family:** One per deck (journey OR ecology OR weather, etc.)

See `/docs/integrated-architecture.md` for full technical details.
