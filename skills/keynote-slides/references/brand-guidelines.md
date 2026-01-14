<!-- ABOUTME: Placeholder brand token sheet for the keynote-slides deck template. -->
<!-- ABOUTME: Fill these fields to keep decks consistent with the brand system. -->
# Brand Guidelines

## Core tokens

- Brand ink: `#000000`
- Brand paper: `#ffffff`
- Accent: `#ff6b35`
- Secondary: `#93a77a`
- Neutral: `#3a4654`

## Entity profiles

Add one entry per entity in `decks/brands.js`:

```js
window.KEYNOTE_BRANDS = {
  acme: {
    label: "Acme",
    tokens: {
      "brand-ink": "#0d1117",
      "brand-ink-soft": "#18202a",
      "brand-paper": "#f7f1e8",
      "brand-paper-deep": "#efe3d4",
      "brand-accent": "#ff6b35",
      "brand-accent-strong": "#ff4d1a",
      "brand-sage": "#93a77a",
      "brand-slate": "#3a4654",
      "brand-line": "rgba(13, 17, 23, 0.12)",
      "brand-glow": "rgba(255, 107, 53, 0.35)"
    },
    fonts: {
      display: "\"Fraunces\", \"Iowan Old Style\", \"Palatino\", serif",
      body: "\"Space Grotesk\", \"Avenir Next\", \"Gill Sans\", sans-serif"
    },
    fontLabel: "Display: Fraunces. Body: Space Grotesk.",
    mediaPromptPrefix: "warm parchment palette, editorial linework, soft studio lighting"
  }
};
```

For per-slide overrides, set `data-entity="acme"` on the slide.

## Current entity baselines

### LightForge Works

Sources:
- `work/lfw/lfw-website/src/app/globals.css`
- `work/lfw/lfw-website/tailwind.config.ts`

Suggested tokens:
- Ink: `#1a1a1a`
- Paper: `#f5f1e8`
- Paper deep: `#e8dcc6`
- Accent: `#b8956f`
- Accent strong: `#9a7a57`
- Sage: `#d4a574`
- Slate: `#666666`

### Synthyra

Source:
- `work/synth/Fundraising/pipeline-slide.html`

Suggested tokens:
- Ink: `#0b1f24`
- Paper: `#f6f8fb`
- Paper deep: `#e4edf4`
- Accent: `#2e7d32`
- Accent strong: `#e67e22`
- Sage: `#6fb27b`
- Slate: `#1f3f5b`

### Navicyte Biotech

Source:
- `work/navicyte/navicyte-shared/Navicyte Slide Deck Jan25.pptx` (theme colors)

Suggested tokens:
- Ink: `#0e2841`
- Paper: `#f6f7f9`
- Paper deep: `#e8e8e8`
- Accent: `#156082`
- Accent strong: `#0f9ed5`
- Sage: `#196b24`
- Slate: `#0e2841`

## Typography

- Display font: `Fraunces`
- Body font: `Space Grotesk`
- Alternate: `Iowan Old Style` for display, `Avenir Next` for body
- Update the `@import` fonts in the template if you swap typefaces.

## Logo usage

- Primary logo file:
- Monochrome logo file:
- Clear space rule:
- Minimum size:

## Image style

- Lighting: soft studio, even contrast
- Palette: warm paper tones, accent highlights
- Composition: strong negative space, centered subjects
- Avoid: harsh saturation, noisy backgrounds

## Diagram style

- Stroke weight: 2px
- Corners: 12px radius
- Labels: uppercase, 0.2em tracking
- Icon style: outline, no gradients

## Voice and tone

- Voice: confident, concise, high signal
- Do: lead with outcomes
- Avoid: jargon stacks and filler slides
