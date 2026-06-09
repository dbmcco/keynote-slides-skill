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

0. **Resolve entity + detect content-db.** Read `deck.json` → `entity` field; fall back to `<section data-entity="...">` on the active slide; then to `brands.js` default entity (the entity whose export key is `"default"`, or the single entity in the file). Check whether `content-db/<entity>/` exists alongside `brands.js`. If it does and is well-formed, content-db mode is active — load relevant atoms before generating any content. If it does not exist or is malformed, proceed normally with no message. See the [Content Database](#content-database) section for the full protocol.

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

### PMF Panel Integration

Export PMF Panel findings as deck input materials:

```bash
# From pmf-panel directory
.claude/export-deck-brief.sh <scenario-id>

# Copy to deck materials
cp scenarios/<scenario-id>/deck-brief.md \
   ../keynote-slides-skill/decks/<deck-id>/resources/materials/pmf-brief.md
```

The brief includes diagnosis, scenarios, 30/60/90 plan, and specialist perspectives ready for narrative engine ingestion.

## Collaboration

- Co-author the narrative: propose headlines, POV, and slide ordering based on `deckType` and entity preferences.
- Keep the brief in `resources/materials/brief.md` and capture evolving preferences in `deck.json` or `decks/brands.js`.
- Use concise headline options (3-5 variants) and confirm direction before building slides.

## Review loop

- Use the Chrome Devtools MCP tools to capture a snapshot/screenshot and review layout.
- Check hierarchy, alignment, spacing rhythm, and contrast; then adjust copy and spacing.
- Use the generator panel for brand-aware media, then re-check balance and whitespace.
- **Register new content-db atoms (if active).** After review, write new atoms to `content-db/<entity>/` for any claims (`cl###`), copy strings (`cp###`), or assets (`as###`) introduced during the build. Run `node content-db/validate.js` (or equivalent). The output package is not complete until validation exits 0. Do not modify existing atoms — add a `vl###` validation record and mark the original `status: disputed` if wording conflicts.

## Templates

- Copy markup from the `<template>` blocks at the bottom of the file.
- Replace placeholders with branded copy, numbers, and visuals.

## Media generation

1. Add `data-gen` and `data-prompt` to `<img>` or `<video>` elements.
2. Open the generator panel with `g` or the `Gen` button.
3. Save the API key and model settings to localStorage (never commit keys).
4. For image-to-image or image-to-video, load a base image in the panel.
5. Run "Generate slide" or "Generate all" and review outputs.

### Model-Mediated Image Acquisition

Use the `/acquire-images` skill (see `skills/acquire-images.md`) to populate slides with visuals.

Claude decides whether to **generate** (Gemini) or **search** (stock photos) for each slide:

| Content Type | Decision | Why |
|--------------|----------|-----|
| Diagrams, flowcharts | GENERATE | Custom layouts, brand colors |
| Data visualizations | GENERATE | Precise data representation |
| Real-world photos | SEARCH | Authentic people, places |
| Team/people shots | SEARCH | Realistic human photos |
| Abstract concepts | GENERATE | Metaphorical, brand-styled |
| Branded hero images | HYBRID | Search base + AI overlay |

**Search sources:** Unsplash, Pexels, Google Custom Search.

**Attribution:** Downloaded images tracked in `resources/materials/image-credits.json`.

See `skills/acquire-images.md` for the full workflow.

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

- Use `data-anim` for lightweight entrance animations (fade, slide-up, slide-left, slide-right, scale-in).
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

### Micro Animations

Micro animations are **small decorative accent elements** that add subtle motion to slides without distracting from content.

**What micro animations ARE:**
- Small accent lines that expand/draw next to headlines
- Subtle decorative strokes or shapes that pulse gently
- Tiny visual flourishes positioned near text (not on text)
- CSS-driven, lightweight, and unobtrusive

**What micro animations are NOT:**
- Large SVG graphics or overlays covering slide areas
- Animations applied directly to text (no flashing, glowing, or bouncing text)
- Complex particle systems or heavy motion graphics
- Anything that competes with or obscures content

**Implementation:**
```html
<!-- Accent line after a headline -->
<h1 class="title">Your headline here</h1>
<span class="accent-line"></span>
```

**Available classes:**
- `.accent-line` — 80px amber line that expands from left, then pulses
- `.accent-line.long` — 120px version for major headlines

**Behavior:**
- Line draws in from left (0.8s ease-out) when slide becomes active
- Then gently pulses (opacity + slight scale) on a 4s cycle
- Respects `prefers-reduced-motion` and `?motion=off`

**When to use:**
- Title slides (layout-title) to add visual interest
- Key message slides where you want emphasis
- Sparingly — 3-4 slides per deck maximum

## Copy editor

- Open `decks/<deck-id>/editor.html` in a second window to edit copy without touching HTML.
- Use the editor "Open deck" button to connect and update the live preview.
- For existing decks, copy the template first:
  ```bash
  cp skills/keynote-slides/assets/keynote-editor.html decks/<deck-id>/editor.html
  ```
- Edits are stored in localStorage; export JSON from the editor for handoff.

## Edit mode

- Use in-deck Edit mode for human slide polish after the agent has generated the deck.
- Click the "Edit" button, press `e`, or add `?edit=1` to enter Edit mode.
- Only bounded targets are editable: approved text/layout role classes or elements with `data-editable`, `data-edit-id`, `data-copy-id`, or `data-copy-role`.
- Select an editable element to open the inspector. V1 supports text, font size, text color, fill/background color, X/Y offsets, width, and height where the element allows them.
- Arrow keys nudge selected elements by 1px; Shift+Arrow nudges by 10px.
- Draft edits are stored in localStorage under `KEYNOTE_EDIT_PATCH_<deck-id>`.
- Use "Export patch" to download `edit-patch-<deck-id>.json` for agent handoff. The deck HTML remains the source of truth until an agent/script applies the patch.
- Edit mode and Review mode are mutually exclusive; entering one exits the other.

### Publish lock

- Add `status: "published"` to both `deck.json` and `window.KEYNOTE_DECK` in `deck-config.js` when a deck is final.
- Published decks hide Edit mode, ignore `?edit=1`, and do not apply local edit patches.
- Published decks still allow presentation, notes, PDF export, and review comments.
- The publish lock is a static workflow guard, not a security boundary. To revise a published deck, create a new version or change status back to `draft`.

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
- Edit mode with `e`.
- Use `#slide-title` hash navigation for direct jumps.

## Review Mode / Feedback System

Enable reviewers to leave comments on deck elements for collaborative feedback.

### Entering Review Mode

- Click the "Review" button in the bottom toolbar (next to Gen)
- Press `r` key to toggle review mode
- Add `?review=1` to the URL to start in review mode

### Adding Comments

1. In review mode, hover over elements to see them highlighted
2. **Click** any commentable element (titles, text, cards, metrics, media frames)
3. **Or select text** within an element to comment on specific wording/typos
4. First-time commenters enter name and email (stored in session)
5. Type feedback in the popover and click "Add Comment"
6. A numbered badge (①②③) appears on commented elements for easy reference

### Viewing Comments

- Press `c` or click the sidebar toggle to open the comment sidebar
- Comments are grouped by slide
- Click "Go to slide" to navigate to the commented element
- Mark comments as resolved or delete them

### Exporting Feedback

From the comment sidebar:
- **Export JSON** - Downloads `comments-<deck-id>.json` for backup or import
- **Export MD** - Downloads markdown summary for sharing or Claude iteration

### Feedback Viewer Page

Use `assets/feedback-viewer.html` to review all feedback outside the deck:

1. Open `feedback-viewer.html` in a browser
2. Load a `comments.json` file or enter a URL
3. Filter by open/resolved status
4. Mark comments as resolved
5. Export updated JSON or markdown

Add `?url=<path-to-json>` to auto-load comments.

### Comment Data Structure

Comments are stored in localStorage keyed by deck ID. Export structure:

```json
{
  "deckId": "example-pitch",
  "nextNumber": 4,
  "comments": [
    {
      "id": "c_1706123456789_abc123",
      "number": 1,
      "slideIndex": 2,
      "slideTitle": "Our Solution",
      "elementSelector": "[data-comment-target='headline']",
      "elementText": "First 50 chars of element...",
      "selectedText": "specific phrase",
      "comment": "This needs more specificity",
      "author": {
        "name": "Sarah Chen",
        "email": "sarah@example.com"
      },
      "createdAt": "2024-01-24T10:30:00Z",
      "resolved": false
    }
  ]
}
```

- `number`: Sequential comment number (①②③) for easy reference in feedback
- `selectedText`: If reviewer selected specific text, captures that selection (null otherwise)

### Element Targeting

For precise comment targeting, add `data-comment-target` attributes:

```html
<h2 data-comment-target="solution-headline">Our Solution</h2>
<p data-comment-target="value-prop-1">We reduce costs by 40%...</p>
```

Elements without explicit targets use a generated CSS selector path.

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
1a. **Load content-db atoms (if active).** If content-db mode is active, pull `copy.md` and `claims.md` atoms for the resolved entity. Filter atoms by `audience` tag if present. Surface any atom with a non-null `gate` value before proceeding — do not include gated content without user confirmation. If content-db is not active, skip this step.
2. **Focal discovery + discovery:** Align on the one point, then answer 5 questions (audience, purpose, content type, tone, reveal)
3. **Density + framework match:** Choose density mode, then get 2-3 recommendations with content mapped to structure
4. **Deck generation:** Build slides with source attribution tags. If content-db is active: use each claim's exact approved text — do not paraphrase. For any claim or copy string not found in the db, pause and ask: *"That claim isn't in `content-db/<entity>/claims.md` — want me to register it as unverified, or use the closest approved atom?"* Do not silently include or skip unapproved content.
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

### Stress Test Panel (Optional)

After the 5-agent review, optionally stress-test with stakeholder personas auto-selected by content type:

| Persona | Questions | Best For |
|---------|-----------|----------|
| **Engineer** | "How does this actually work?" | Technical proposals, product launches |
| **Skeptic** | "Why should I believe this?" | Bold claims, paradigm shifts |
| **Risk Officer** | "What could go wrong?" | Strategy, transformation, investment |
| **CFO** | "What are the numbers?" | Pitches, business cases, ROI claims |
| **Lawyer** | "What's the exposure?" | Policy, compliance, external-facing |
| **Conservative** | "Why change what's working?" | Change management |
| **COO** | "Would this actually work?" | Execution plans, go-to-market |

The Director triages findings into **Must Fix**, **Should Fix**, and **Could Fix** categories.

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

---

## Content Database

A modular, approved-content management layer for any project using keynote-slides. When a `content-db/<entity>/` directory exists alongside `brands.js`, agents automatically load and enforce approved atoms. When it does not exist, the skill runs exactly as before — no config, no warnings.

### Directory Structure

```
<deck-repo>/
├── brands.js                  ← entity source of truth (unchanged)
├── content-db/
│   └── <entity>/              ← one directory per entity
│       ├── README.md          ← schema reference + agent protocol
│       ├── claims.md          ← cl### atoms — stats, benchmarks, data points
│       ├── validation.md      ← vl### atoms — experimental evidence blocks
│       ├── assets.md          ← as### atoms — images, video, SVG with provenance
│       ├── copy.md            ← cp### atoms — approved text passages
│       ├── brand.md           ← br### atoms — color tokens, typography
│       └── layouts.md         ← ly### atoms — approved slide structures
└── <deck-id>/                 ← decks alongside (unchanged)
```

`content-db/` always lives next to `brands.js`. Multi-entity repos have one subdirectory per entity.

### Entity Resolution

Resolve the active entity in this order:

1. `deck.json` → `entity` field
2. `<section data-entity="...">` on the active slide
3. `brands.js` → the entity whose export key is `"default"`, or the single entity in the file. If multiple entities exist without a `"default"` key, surface the ambiguity — do not guess.

### Detection

```
resolve entity
→ content-db/<entity>/ exists and is well-formed?
  → YES: load relevant atom files, activate compliance
  → MALFORMED: log warning, proceed without compliance
  → NO: proceed as normal, no message
```

| Operation | Atom files loaded |
|-----------|------------------|
| Narrative planning | `copy.md`, `claims.md` |
| Full build | all six files |
| Targeted edit | only types relevant to the change |

### Compliance Rules

1. **Read before write.** Load relevant atoms before generating content. Never re-derive brand colors or claim text if an atom already exists.
2. **Surface unapproved content (Build and Edit only — not planning).** If a claim or copy string is not in the db (different number, source, or framing = new claim; minor rewording = same), pause: *"That claim isn't in `content-db/<entity>/claims.md` — want me to register it as unverified, or use the closest approved atom?"*
3. **Register new atoms.** After any build or edit, write atoms for all claims (`cl###`), copy strings (`cp###`), and assets (`as###`) introduced. Run `node content-db/validate.js`. Output is not complete until exit 0.
4. **Never modify existing atoms.** If content conflicts with an existing atom, add a `vl###` validation record and update `status: disputed` in the original. Surface the conflict to the user.

### Atom Prefixes

All new atoms use a two-letter prefix + zero-padded three-digit number. Existing atoms with single-letter prefixes are grandfathered.

| File | Prefix | Contents |
|------|--------|----------|
| `claims.md` | `cl###` | Stats, benchmarks — `status: validated \| disputed \| unverified` |
| `validation.md` | `vl###` | Experimental evidence — `experiment_type`, `result`, `institution` |
| `assets.md` | `as###` | Images, video, SVG — `file`, `deck`, `type`, `used_in` |
| `copy.md` | `cp###` | Approved text passages — `concept`, `audience_level`, `tone`, `variants` |
| `brand.md` | `br###` | Color tokens, typography — `element`, `css_var`, `value`, `usage_rules` |
| `layouts.md` | `ly###` | Slide structures — `slide_type`, `css_classes`, `js_required`, `data_density` |

Each atom is a `## <id>` heading with bullet-field body. Full schema in `content-db/<entity>/README.md`.

### Bootstrap

The skill does not scaffold a content-db unprompted. If a user asks why content-db is not active, explain the directory is absent and offer to create it. Only scaffold if the user says yes.

Bootstrap steps (when approved):
1. Create `content-db/<entity>/` directory
2. Create six empty atom files with schema header comments
3. Create `README.md` with schema reference and compliance rules
4. Offer (separately) to extract initial atoms from existing deck HTML

If the user declines, proceed in no-compliance mode and do not raise the topic again in the same session.
