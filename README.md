<!-- ABOUTME: User guide for the keynote slides skill repo. -->
<!-- ABOUTME: Covers deck workflow, resources, media generation, and best practices. -->
# Keynote Slides Skill

Keynote-style single-file HTML decks with brand adherence, embedded infographics via Gemini (nano-banana), and video generation via Veo.

**[View Live Demo Deck](https://dbmcco.github.io/keynote-slides-skill/decks/skill-demo/index.html)** — Navigate with arrow keys or swipe

---

## How It Works

Generate professional infographics with AI and embed them directly in your slides:

![Workflow Diagram](decks/skill-demo/resources/assets/workflow-diagram.png)

*From zero to presentation in minutes, with AI-generated visuals.*

## Multi-Brand System

One template supports multiple visual identities. Switch brands instantly:

![Brand System](decks/skill-demo/resources/assets/brand-system.png)

*Same deck structure, completely different look — just change `?entity=name`*

---

## Features

- **Single-file decks** — Each deck is one portable HTML file
- **Brand system** — Entity-specific color tokens, typography, and prompt prefixes
- **Embedded infographics** — Generate diagrams, charts, and visualizations with nano-banana
- **Video generation** — Create animated content with Veo 3
- **Claude Code integration** — Visual evaluation and iterative refinement

## Quickstart

```bash
# Create a new deck
skills/keynote-slides/scripts/new-deck.sh my-deck --entity northwind --title "My Presentation" --type pitch

# Preview locally
skills/keynote-slides/scripts/serve-decks.sh

# Open in browser
open http://localhost:8921/decks/my-deck/index.html
```

## Deck Structure

```
decks/
├── brands.js                 # Shared brand profiles (all entities)
└── <deck-id>/
    ├── index.html            # The deck (single-file, editable)
    ├── deck-config.js        # Deck metadata (entity, title)
    ├── deck.json             # Same metadata in JSON
    ├── slides.md             # Draft copy and notes
    └── resources/
        ├── assets/           # Logos, images, generated media
        │   ├── logo.png
        │   ├── diagram.png   # Generated infographics
        │   └── animation.mp4 # Generated videos
        ├── materials/        # Strategy docs, briefs, outlines
        │   └── brief.md
        └── prompts/          # Saved generation prompts (optional)
            └── slide3-diagram.txt
```

## Serving Over Network

```bash
# Bind to all interfaces for Tailscale/remote access
skills/keynote-slides/scripts/serve-decks.sh 5200 0.0.0.0

# Access via Tailscale IP or MagicDNS
open http://<tailscale-ip>:5200/decks/<deck-id>/index.html

# Run in background
nohup skills/keynote-slides/scripts/serve-decks.sh 5200 0.0.0.0 > /tmp/serve-decks.log 2>&1 &

# Stop the server
pkill -f "http.server 5200"
```

---

## Media Generation

### Environment Setup

```bash
# Required API keys (add to shell profile or .env)
export GEMINI_API_KEY="your-gemini-api-key"
export KIE_API_KEY="your-kie-api-key"  # For Veo video generation
```

### Browser-Based Generation

1. Open a deck in the browser
2. Press `g` or click the **Gen** button to open the generator panel
3. Save your API key to localStorage (never committed)
4. Add `data-gen` and `data-prompt` attributes to `<img>` or `<video>` elements
5. Click **Generate slide** or **Generate all**

### Python CLI Generation

```bash
# Generate an image
python -m lib.media.generate image \
  --prompt "Create a workflow diagram showing data processing pipeline..." \
  --output decks/my-deck/resources/assets/workflow.png

# Generate a video
python -m lib.media.generate video \
  --prompt "Tracking shot of data flowing through network nodes..." \
  --output decks/my-deck/resources/assets/animation.mp4 \
  --aspect-ratio 16:9

# Image-to-video (animate a static infographic)
python -m lib.media.veo \
  "Animate this diagram: nodes pulse, connections glow..." \
  decks/my-deck/resources/assets/animated.mp4 \
  --image decks/my-deck/resources/assets/static-diagram.png
```

---

## Infographic Best Practices

**Core principle:** Generate infographics to *embed* in slides, not full slides themselves.

### Recommended Types

| Type | Use For |
|------|---------|
| **Flowchart** | Processes, workflows, decision trees |
| **Timeline** | Progression, milestones, history |
| **Network/Concept Map** | Relationships, ecosystems |
| **Comparison Matrix** | Side-by-side evaluations |
| **Metrics Dashboard** | KPIs, statistics |

### Prompt Structure

```
SIZE & PLACEMENT:
- Output: [width]px × [height]px (2× display size for retina)
- Placement: [where on slide]

LAYOUT: [Flowchart Nodes / Central Hub / Timeline / Split-Screen]

STYLE: [Flat vector / Isometric / Glassmorphism]
Color palette: [brand hex codes]

TYPOGRAPHY:
- Headers: Bold Sans-Serif, 36pt+
- Labels: Regular, 24pt+

CONTENT TO VISUALIZE:
[Detailed explanation of the concept, 3+ paragraphs]

Key insight: [The one thing that must come through]
```

### Layout Keywords

- **Knolling** — Organized grids, top-down
- **Modular Panels** — Boxed sections, cards
- **Flowchart Nodes** — Step-by-step processes
- **Central Hub** — Radiating networks
- **Timeline/Roadmap** — Linear progression
- **Split-Screen** — Side-by-side comparisons

See [docs/nano-banana-prompting.md](docs/nano-banana-prompting.md) for complete guidance.

---

## Video Generation Best Practices

**Core principle:** Short, focused videos that enhance specific moments.

### Embedding Videos

```html
<video class="gen-media" controls muted loop playsinline>
  <source src="resources/assets/animation.mp4" type="video/mp4" />
</video>
```

### Recommended Attributes

- `muted` — Always for autoplay, usually for embeds
- `loop` — For background/ambient videos
- `playsinline` — Prevents fullscreen on mobile
- `controls` — For user-paced content
- `autoplay` — For background ambience

### Camera Movements

Use film grammar in prompts:

- **Dolly in/out** — Move toward/away from subject
- **Tracking shot** — Follow subject movement
- **Pan/Tilt** — Pivot camera horizontally/vertically
- **Orbit** — Circle around subject
- **Static** — No movement (focus on subject motion)

### Aspect Ratios

- **16:9** — Standard slides
- **9:16** — Vertical/mobile
- **1:1** — Square embeds

See [docs/veo-video-guide.md](docs/veo-video-guide.md) for complete guidance.

---

## Claude Code CLI Integration

Claude Code can evaluate generated media qualitatively and suggest refinements.

### Evaluation Workflow

```
1. Generate infographic/video with detailed prompt
2. Read/view the generated file
3. Assess: clarity, accuracy, brand alignment, balance
4. Document issues found
5. Refine prompt with specific corrections
6. Regenerate and compare
```

### Evaluation Criteria

**Images:**
- Text legible at display size?
- Visual hierarchy clear?
- Brand colors correct?
- Appropriate whitespace?

**Videos:**
- Motion smooth and natural?
- Camera movement matches prompt?
- Loop seamless (if applicable)?
- Complements slide content?

### Prompt Refinement

If issues found, add specific corrections:

```
# Text too small
"Minimum text size 28pt at output resolution."

# Wrong colors
"STRICT COLOR PALETTE — use ONLY: Primary #ed8936, Secondary #00b5d8"

# Too cluttered
"Leave 15% margin on all edges. Increase spacing between elements."
```

---

## Brand Profiles

Entity-level brand identities in `decks/brands.js`:

```javascript
northwind: {
  tokens: {
    '--brand-ink': '#1a1a2e',
    '--brand-paper': '#fafbfc',
    '--brand-accent': '#ed8936',
    // ...
  },
  fonts: {
    display: '"Inter", sans-serif',
    body: '"Inter", sans-serif'
  },
  mediaPromptPrefix: 'Modern tech aesthetic, amber and cyan highlights...'
}
```

Switch entities:
- URL parameter: `?entity=northwind`
- Slide attribute: `data-entity="apex"`
- Generator panel dropdown

---

## PDF Export

1. Open deck in browser
2. Print dialog (Cmd+P / Ctrl+P)
3. Select "Save as PDF"
4. **Enable "Background graphics"** for gradients
5. Print styles auto-paginate one slide per page

---

## Navigation

| Key | Action |
|-----|--------|
| `→` `↓` `Space` `PageDown` | Next slide |
| `←` `↑` `PageUp` | Previous slide |
| `Home` | First slide |
| `End` | Last slide |
| `g` | Toggle generator panel |
| `#slide-title` | Direct link to slide |

---

## Documentation

| Document | Purpose |
|----------|---------|
| [docs/nano-banana-prompting.md](docs/nano-banana-prompting.md) | Complete infographic generation guide |
| [docs/veo-video-guide.md](docs/veo-video-guide.md) | Video generation and embedding guide |
| [skills/keynote-slides/references/brand-guidelines.md](skills/keynote-slides/references/brand-guidelines.md) | Brand tokens and style guidance |
| [skills/keynote-slides/references/gemini-media.md](skills/keynote-slides/references/gemini-media.md) | API endpoint reference |

---

## Troubleshooting

### Media generation fails

1. Check API key is set: `echo $GEMINI_API_KEY`
2. Verify key in generator panel localStorage
3. Check browser console for error details
4. Try simpler prompt to isolate issue

### Video won't play

1. Ensure `<source>` path is correct (relative to index.html)
2. Check file format is MP4 (H.264)
3. Add `playsinline` attribute for mobile
4. Try adding `muted` if autoplay blocked

### Colors don't match brand

1. Use exact hex codes, not color names
2. Add "STRICT COLOR PALETTE" instruction to prompt
3. Reference `brands.js` for correct values
4. Specify "no additional colors"

### Text illegible in generated images

1. Generate at 2× intended display size
2. Specify minimum text size in prompt (24pt+ at output size)
3. Request "high-contrast text against backgrounds"
4. Use flat vector style (not photorealism)

### Server won't start

```bash
# Check if port in use
lsof -i :8921

# Kill existing process
pkill -f "http.server 8921"

# Try different port
skills/keynote-slides/scripts/serve-decks.sh 9000
```
