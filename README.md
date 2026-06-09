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
| Hope your stats are right | Content Database blocks unapproved claims |

---

## The Workflow

```
Brief → Framework Match → Slide Generation → AI Visuals → Content DB Check → Review Panel → Ship
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

### 4. Collect feedback with Review Mode

Share your deck URL with reviewers. They enter review mode, click elements or select text, and leave numbered comments:

| Action | How |
|--------|-----|
| Enter review mode | Click **Review** button, press `r`, or add `?review=1` |
| Comment on element | Click any element → enter feedback → submit |
| Comment on text | Select specific text → comment on that phrase (great for typos) |
| View all comments | Press `c` or click sidebar toggle |
| Export feedback | **Export JSON** or **Export MD** from sidebar |

Each comment gets a sequential number (①②③) so reviewers can reference "fix issue 3" instead of describing location. Comments persist in localStorage. Export to `comments.json` for backup or use the standalone `feedback-viewer.html` to review outside the deck.

### 5. Present with speaker notes

Add notes to any slide without affecting layout. Toggle the notes panel during presentation:

| Action | How |
|--------|-----|
| Add notes | `<aside class="slide-notes">Your notes here</aside>` |
| View notes | Press `n` or click **Notes** button |
| Open by default | Add `?notes=1` to URL |
| Export all notes | Click **Export notes** → downloads markdown |

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

## Content Database — Approved Content Governance

AI slide generation has a silent failure mode: the model confidently drops in a statistic, a brand claim, or a product description that is slightly wrong, outdated, or legally unvetted. You catch it in the final review — or you don't.

The Content Database solves this at the architecture level. It is an entity-scoped library of **approved atoms** that agents load before they generate anything. If a claim, copy string, or asset isn't in the database, the agent stops and asks — it does not silently include or skip it.

### How it works

Drop a `content-db/<entity>/` directory alongside `brands.js`. That's the entire activation step. When it exists and is well-formed, compliance mode activates automatically. When it doesn't exist, the skill behaves exactly as before — no config, no warnings.

```
resolve entity
→ content-db/<entity>/ exists?
  → YES  — load approved atoms, activate compliance
  → NO   — proceed normally, no message
```

The agent resolves the active entity from `deck.json`, then a slide-level `data-entity` attribute, then the `brands.js` default — so compliance follows the brand context automatically.

### The atom schema

Six files, one directory per entity. Every atom is a `## id` heading with bullet-field body.

| File | Prefix | Contents |
|------|--------|----------|
| `claims.md` | `cl###` | Stats, benchmarks, data points — each with `status: validated \| disputed \| unverified` |
| `validation.md` | `vl###` | Experimental evidence — experiment type, result, institution |
| `assets.md` | `as###` | Images, video, SVG — file path, deck, type, provenance |
| `copy.md` | `cp###` | Approved text passages — concept, audience level, tone, variants |
| `brand.md` | `br###` | Color tokens, typography — CSS var, value, usage rules |
| `layouts.md` | `ly###` | Approved slide structures — CSS classes, data density |

### What agents do with it

- **Before generating**: load `claims.md` and `copy.md` for narrative planning; all six files for a full build.
- **During generation**: use each claim's exact approved text — no paraphrasing. For any claim not found, pause and ask: *"That claim isn't in `content-db/<entity>/claims.md` — register as unverified, or use the closest approved atom?"*
- **After review**: register new atoms for every claim, copy string, and asset introduced. Run `node content-db/validate.js`. Output is not complete until it exits 0.
- **Conflicts**: never modify existing atoms. Add a `vl###` validation record and mark the original `status: disputed`. Surface the conflict explicitly.

### Bootstrap

The skill never scaffolds a content-db unprompted. To create one:

```bash
mkdir -p content-db/<entity>
# Claude will scaffold the six atom files and README when asked
```

Or ask Claude: *"Set up a content database for `<entity>`"* — it will create the directory structure and offer to extract initial atoms from existing deck HTML.

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

## Edit Mode (in-deck)

Use Edit mode for final human polish directly inside the deck preview.

| Action | How |
|--------|-----|
| Enter edit mode | Click **Edit**, press `e`, or add `?edit=1` |
| Select an element | Click editable text, cards, metrics, chips, or media frames |
| Change copy/style | Use the inspector for text, font size, text color, fill, offset, width, and height |
| Nudge position | Arrow keys move 1px; Shift+Arrow moves 10px |
| Save locally | Draft edits persist in `KEYNOTE_EDIT_PATCH_<deck-id>` localStorage |
| Hand off edits | Click **Export patch** to download `edit-patch-<deck-id>.json` |

Edit mode is intentionally bounded. Only approved slide elements are editable, or elements explicitly marked with `data-editable`, `data-edit-id`, `data-copy-id`, or `data-copy-role`.

### Publish Lock

Deck metadata can mark a deck as no longer editable:

```json
{
  "status": "published"
}
```

Set the same value in `deck-config.js` as `window.KEYNOTE_DECK.status`. When `status` is `published`, the deck hides Edit mode, ignores `?edit=1`, does not apply local edit patches, and shows a **Published** badge. Review comments, notes, presentation, and PDF export still work. This is a workflow lock for static files, not a security boundary.

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
| `e` | Toggle edit mode |
| `r` | Toggle review mode |
| `c` | Toggle comment sidebar (in review mode) |
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
