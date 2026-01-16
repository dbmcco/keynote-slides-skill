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

Add one entry per entity in `decks/brands.js`. Capture deck-type preferences there too:

```js
window.KEYNOTE_BRANDS = {
  mycompany: {
    label: "My Company",
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
    mediaPromptPrefix: "warm parchment palette, editorial linework, soft studio lighting",
    defaultDeckType: "pitch",
    deckPreferences: {
      pitch: {
        voice: "confident, concise",
        headlineStyle: "short, verb-led",
        narrative: ["Context", "Problem", "Solution", "Proof", "Ask"]
      }
    }
  }
};
```

For per-slide overrides, set `data-entity="mycompany"` on the slide.

## Example entity baselines

### Northwind Labs (Tech)

Suggested tokens:
- Ink: `#1a1a2e`
- Paper: `#fafbfc`
- Paper deep: `#f0f2f5`
- Accent: `#ed8936` (amber)
- Accent strong: `#dd6b20`
- Sage: `#00b5d8` (cyan)
- Slate: `#4a5568`

Style note: Modern tech palette, amber and cyan highlights, clean studio lighting

### Apex Consulting (Professional Services)

Suggested tokens:
- Ink: `#1a1a1a`
- Paper: `#f5f1e8`
- Paper deep: `#e8dcc6`
- Accent: `#b8956f` (brass)
- Accent strong: `#9a7a57`
- Sage: `#d4a574`
- Slate: `#666666`

Style note: Warm parchment palette, refined brass accents, minimal editorial lighting

### Coastal Biotech (Life Sciences)

Suggested tokens:
- Ink: `#0e2841` (navy)
- Paper: `#f6f7f9`
- Paper deep: `#e8e8e8`
- Accent: `#156082` (teal)
- Accent strong: `#0f9ed5`
- Sage: `#196b24`
- Slate: `#0e2841`

Style note: Navy biotech palette, teal accents, high-clarity lab lighting

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
