<!-- ABOUTME: User guide for the keynote slides skill repo. -->
<!-- ABOUTME: Covers deck workflow, resources, preview, and PDF export. -->
# Keynote Slides Skill

Keynote-style single-file HTML decks with brand adherence, deck-specific resources, and optional Gemini media generation.

## Quickstart

Create a new deck:
```bash
skills/keynote-slides/scripts/new-deck.sh lfw-pitch-2026 --entity lightforgeworks --title "LFW Pitch 2026" --type pitch
```

Preview locally:
```bash
skills/keynote-slides/scripts/serve-decks.sh 8000
```
Open `http://localhost:8000/decks/lfw-pitch-2026/index.html`.

## Deck Structure

```
decks/
  brands.js
  <deck-id>/
    index.html
    deck-config.js
    deck.json
    slides.md
    resources/
      assets/
      materials/
```

### Resources

- `resources/assets/`: logos, existing graphics, images for nano-banana reprocessing.
- `resources/materials/`: briefs, pricing guides, P&L, slide-by-slide outlines.

## Brand Profiles

Entity-level brand identities live in `decks/brands.js`. Each profile includes:
- Token colors
- Font stacks
- Prompt guidance (`mediaPromptPrefix`)
- Deck-type preferences (voice, narrative, density)

Decks load their entity automatically from `deck-config.js`, so switching decks switches brand identity.

## Working with the Model

- Use `resources/materials/brief.md` to capture goals, audience, and narrative.
- Expect co-authoring: POV, headlines, and slide ordering.
- Update deck preferences in `deck.json` as choices solidify.

## PDF Export

- Use the browser print dialog and "Save as PDF".
- Enable background graphics so gradients render correctly.
- Print styles paginate one slide per page.

## Media Generation (Optional)

- Nano-banana for images (`gemini-2.5-flash-image`).
- Veo for video (`veo-3.1-generate-preview`).
- Use the generator panel in the deck to run prompts.
