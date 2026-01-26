<!-- ABOUTME: User guide for the keynote slides skill repo. -->
<!-- ABOUTME: Covers deck workflow, resources, media generation, and best practices. -->
# Keynote Slides Skill

**AI generates your infographics. You focus on the story.**

Slide tools force a choice: drag boxes in Keynote or wrestle with code in reveal.js. Neither lets you generate brand-perfect visuals on demand.

This skill flips that tradeoff. Single-file HTML decks with Gemini-powered infographics, multi-brand theming, and a Narrative Engine that matches your content to proven storytelling frameworks.

**[See it in action](https://dbmcco.github.io/keynote-slides-skill/decks/skill-demo/index.html)** — arrow keys to navigate

---

## 60-Second Start

```bash
# Create a deck
skills/keynote-slides/scripts/new-deck.sh my-pitch --entity northwind --title "Q1 Results"

# Preview it
skills/keynote-slides/scripts/serve-decks.sh
open http://localhost:8921/decks/my-pitch/index.html

# Generate visuals (press 'g' in browser, add your Gemini API key)
```

That's it. One HTML file. AI-generated infographics. Brand tokens applied automatically.

---

## What Makes This Different

| Traditional Slides | This Skill |
|-------------------|------------|
| Export to PNG, reimport | Generate infographics inline |
| One brand per template | Switch brands with `?entity=name` |
| 47 files per deck | One portable HTML file |
| Manual consistency checks | Automated layout + narrative review |
| Start from blank slide | Start from storytelling framework |

---

## The Workflow

```
Brief → Framework Match → Slide Generation → AI Visuals → Review Panel → Ship
```

### 1. Narrative Engine matches your content to structure

Answer five questions. Get framework recommendations with your content pre-mapped:

| Your Content | Framework |
|--------------|-----------|
| Surprise finding | The Prestige |
| Strategy roadmap | The Heist |
| Origin story | Hero's Journey |
| Root cause analysis | Columbo |
| Paradigm shift | Trojan Horse |

Narrative Engine references (including the selection guide and review checklists) are synced from [nraford7/Narrative-Engine](https://github.com/nraford7/Narrative-Engine).

### 2. AI generates brand-aware infographics

Add `data-gen` and `data-prompt` to any image. Press `g`. Gemini generates diagrams, charts, and visualizations that match your brand tokens.

```html
<img data-gen data-prompt="Flowchart: data pipeline from ingestion to dashboard.
     Use brand colors. Flat vector style. Labels 24pt+." />
```

Or use the `/acquire-images` skill which decides whether to **generate** (Gemini) or **search** (stock photos) for each slide:

| Content Type | Decision |
|--------------|----------|
| Diagrams, charts | Generate |
| Real people, places | Search (Unsplash/Pexels) |
| Branded hero images | Hybrid (search + AI overlay) |

### 3. Five-agent review panel challenges your deck

| Agent | Questions |
|-------|-----------|
| Audience Advocate | Does this land for your specific audience? |
| Comms Specialist | Is every headline tight and bulletproof? |
| Visual Designer | What visual makes the reveal unforgettable? |
| Critic | What's the weakest slide? Cut it. |
| Content Expert | Can every claim be defended? |

Optional **Stress Test Panel** pressure-tests with stakeholder personas (Engineer, Skeptic, CFO, Risk Officer, Lawyer, Conservative, COO) auto-selected by content type.

---

## Model-Mediated Architecture

**Model decides. Code executes.** Judgment lives in prompts; code only gathers
signals, runs tools, and writes artifacts.

What that means in practice:
- `scripts/narrative-build.js` prepares ingestion + prompt packets for the model.
- `scripts/review-all.js` emits analyzer signals (no severity); the model prioritizes.
- `scripts/deck-review.js` packages prompts for antagonistic agents.
- `scripts/model-mediated-conformance.js` validates required artifacts.

Artifacts you can audit:
- `resources/materials/ingestion.json`
- `resources/materials/narrative-build-prompts.json`
- `resources/materials/review-prompts.json`
- `resources/materials/analysis-summary.json`
- `resources/materials/work-runs/*.json`

If we keep heuristics temporarily, they are logged in `docs/model-mediated-deviation-register.md`.

---

## Deck Structure

```
decks/
├── brands.js                 # Shared brand profiles
└── my-pitch/
    ├── index.html            # The deck (single portable file)
    ├── deck.json             # Metadata
    ├── slides.md             # Draft copy
    └── resources/
        ├── assets/           # Generated infographics, logos
        └── materials/        # Briefs, research, source docs
```

---

## Brand System

One template. Multiple identities. Switch instantly.

```javascript
// decks/brands.js
northwind: {
  tokens: {
    '--brand-accent': '#ed8936',
    '--brand-ink': '#1a1a2e',
  },
  mediaPromptPrefix: 'Modern tech aesthetic, amber highlights...'
}
```

Switch brands:
- URL: `?entity=coastal`
- Slide: `data-entity="apex"`
- Generator panel dropdown

---

## Media Generation

### Browser (recommended)

1. Open deck → Press `g`
2. Save Gemini API key to localStorage
3. Click "Generate slide" or "Generate all"

### CLI

```bash
# Generate image with Gemini
python3 -m lib.media.model_mediated generate \
  "Network diagram showing microservices..." \
  decks/my-pitch/resources/assets/architecture.png \
  --brand "Modern tech aesthetic"

# Search stock photos
python3 -m lib.media.model_mediated search "team collaboration modern office"

# Download selected result
python3 -m lib.media.model_mediated download \
  "https://images.unsplash.com/photo-abc" \
  decks/my-pitch/resources/assets/team.jpg \
  --source unsplash --photographer "Jane Doe"

# Video (Veo)
python3 -m lib.media.generate video \
  --prompt "Data flowing through nodes, camera tracks left..." \
  --output decks/my-pitch/resources/assets/flow.mp4
```

### Prompt Structure

```
SIZE: 1600×900px (2× for retina)
LAYOUT: [Flowchart / Central Hub / Timeline / Split-Screen]
STYLE: Flat vector, brand hex codes only
TYPOGRAPHY: Headers 36pt+, labels 24pt+
CONTENT: [Detailed explanation, 3+ paragraphs]
KEY INSIGHT: [The one thing that must come through]
```

---

## Review Tools

```bash
# Layout issues (Playwright-based screenshot analysis)
node scripts/layout-review.js decks/my-pitch

# Narrative analysis (arc, flow, redundancy)
node scripts/narrative-review.js decks/my-pitch
```

## Copy Editor (sidecar)

Open a second window to edit copy without touching HTML.

```bash
# For existing decks (new-deck.sh now copies this file automatically)
cp skills/keynote-slides/assets/keynote-editor.html decks/my-pitch/editor.html

# Preview and edit
skills/keynote-slides/scripts/serve-decks.sh
open http://localhost:8921/decks/my-pitch/editor.html
```

In the editor window, click "Open deck" to connect the live preview. Edits are saved in localStorage; export JSON to hand off changes.

## Speaker Notes

Add notes per slide without affecting layout:

```html
<aside class="slide-notes">
  Speaker notes go here. Line breaks are preserved in the notes panel.
</aside>
```

Toggle the notes panel with the "Notes" button or press `n`. Add `?notes=1` to the deck URL to open notes by default. Use "Export notes" to download `speaker-notes-<deck-id>.md`.

## Animation + SVG

Use `data-anim` for lightweight animations (no JS libraries required):

```html
<h2 class="section-title" data-anim="slide-up" style="--anim-delay: 0.1s">
  The headline lands with motion
</h2>
```

Disable animation with `?motion=off` and respect `prefers-reduced-motion`.

SVG diagrams are first-class:

```html
<div class="media-frame" data-media="svg">
  <svg class="diagram" data-media="svg" viewBox="0 0 800 450" role="img" aria-label="Flow diagram">
    <!-- SVG markup -->
  </svg>
</div>
```

### Media lanes (avoid confusion)

- **Gemini**: only elements with `data-gen` (optionally `data-media="gemini"`).
- **SVG**: inline `<svg class="diagram" data-media="svg">` (no `data-gen`).
- **Static**: `<img src="...">` or `<video src="...">` without `data-gen`.
- **Animation**: `data-anim` only; it never implies media choice.

---

## Navigation

| Key | Action |
|-----|--------|
| `→` `↓` `Space` | Next slide |
| `←` `↑` | Previous |
| `Home` / `End` | First / Last |
| `g` | Generator panel |
| `n` | Notes panel |
| `#slide-title` | Direct link |

---

## Export

Print dialog → Save as PDF → Enable "Background graphics"

### CLI (Playwright)

```bash
node scripts/export-pdf.js decks/my-pitch --out /tmp/my-pitch.pdf
```

---

## Network Preview

```bash
# Bind to all interfaces for Tailscale
skills/keynote-slides/scripts/serve-decks.sh 5200 0.0.0.0
```

---

## Acknowledgments

The Narrative Engine (17 storytelling frameworks, 5-agent review panel) is based on [nraford7/Narrative-Engine](https://github.com/nraford7/Narrative-Engine).

---

## Documentation

| Doc | Purpose |
|-----|---------|
| [Storytelling Guide](docs/storytelling-guide.md) | Narrative arcs and slide best practices |
| [Framework Selection Guide](skills/keynote-slides/references/narrative-engine/framework_selection_guide.md) | Deep pairing guidance for arcs + frameworks |
| [Narrative Engine Checklists](skills/keynote-slides/references/narrative-engine/checklists.md) | Review gates for narrative + copy quality |
| [Infographic Prompting](docs/nano-banana-prompting.md) | Gemini image generation |
| [Video Guide](docs/veo-video-guide.md) | Veo video generation |
| [Brand Guidelines](skills/keynote-slides/references/brand-guidelines.md) | Token reference |

---

## Troubleshooting

**Media won't generate:** Check `$GEMINI_API_KEY` is set. Verify in generator panel localStorage.

**Image search fails:** Set at least one of `$UNSPLASH_ACCESS_KEY`, `$PEXELS_API_KEY`, or `$GOOGLE_CUSTOM_SEARCH_KEY`.

**Colors wrong:** Use exact hex codes. Add "STRICT COLOR PALETTE" to prompt.

**Text illegible:** Generate at 2× display size. Specify "minimum 24pt text."

**Server won't start:** `lsof -i :8921` then `pkill -f "http.server 8921"`
