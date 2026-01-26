---
name: acquire-images
description: Acquire images for slide decks by deciding whether to generate (Gemini) or search (stock photos). Use when populating slides with visuals after the deck structure is complete.
---

# /acquire-images - Image Acquisition for Decks

Acquire images for slides by choosing the right approach for each visual need.

## Usage

```
/acquire-images <deck-path>
/acquire-images decks/my-pitch
/acquire-images decks/my-pitch --slide 3   (single slide only)
```

## When to Use

- After `/narrative-deck` or `/new-deck-wizard` has created the deck structure
- When `slides.md` has design notes but slides lack actual images
- When refreshing visuals for an existing deck

## Decision Framework

For each slide image, decide:

| Content Type | Decision | Why |
|--------------|----------|-----|
| Diagrams, flowcharts, process maps | **GENERATE** | Need custom layout, brand colors, specific relationships |
| Data visualizations, charts | **GENERATE** | Precise data representation required |
| Abstract concepts, metaphors | **GENERATE** | Brand-specific style, creative interpretation |
| Icons, illustrations | **GENERATE** | Consistent style with deck |
| Real people, teams, portraits | **SEARCH** | AI faces look uncanny; real photos are authentic |
| Real locations, buildings, cityscapes | **SEARCH** | Authentic imagery |
| Products, objects, equipment | **SEARCH** | Real-world accuracy |
| Lifestyle, action shots | **SEARCH** | Human authenticity matters |
| Branded hero with real photo base | **HYBRID** | Search for base, then add brand overlay |

## Workflow

### Step 1: Inventory Image Needs

Review the deck and list images needed:

```markdown
| Slide | Current Prompt | Decision | Reasoning |
|-------|----------------|----------|-----------|
| 3 | "Team collaboration" | SEARCH | Real people |
| 5 | "Data pipeline diagram" | GENERATE | Custom technical diagram |
| 8 | "Growth metrics chart" | GENERATE | Specific data |
| 12 | "Customer success moment" | SEARCH | Authentic emotion |
```

### Step 2: Execute by Type

#### For GENERATE decisions:

```bash
python -m lib.media.model_mediated generate "<prompt>" decks/<deck-id>/resources/assets/<filename>.png \
  --brand "<brand context from entity mediaPromptPrefix>" \
  --slide <number> \
  --deck decks/<deck-id>
```

Compose the prompt with:
- Brand style prefix (from `mediaPromptPrefix` in brands.js)
- Specific visual description
- Layout hints (16:9 aspect for slides)
- Color guidance if needed

#### For SEARCH decisions:

First, search to see options:

```bash
python -m lib.media.model_mediated search "<query>" --orientation landscape
```

Review results (shows URLs and metadata), then download the best match:

```bash
python -m lib.media.model_mediated download "<image-url>" decks/<deck-id>/resources/assets/<filename>.jpg \
  --source unsplash \
  --photographer "Photographer Name" \
  --photo-url "https://unsplash.com/photos/abc123" \
  --slide <number> \
  --deck decks/<deck-id>
```

**Search query tips:**
- Extract key visual concepts from the slide intent
- Add context modifiers: "professional", "modern", "business", "diverse"
- Avoid brand jargon—search engines don't know your product names

| Slide Intent | Good Search Query |
|--------------|-------------------|
| "Our team collaborating" | "diverse team collaboration modern office whiteboard" |
| "Customer success" | "happy business customer handshake celebration" |
| "Digital transformation" | "business technology digital transformation professional" |
| "Data security" | "cybersecurity data protection shield professional" |

#### For HYBRID decisions:

1. Search and download a base image
2. Edit with Gemini to add brand elements:

```bash
python -m lib.media.model_mediated edit "<edit prompt>" \
  <input-path> \
  <output-path> \
  --brand "<brand context>"
```

### Step 3: Review and Iterate

After acquiring images:
1. View in browser: `scripts/serve-decks.sh` then open the deck
2. Check: Does each image support its headline?
3. Check: Is the style consistent across slides?
4. Check: Are real photos authentic and appropriate?

Re-generate or re-search if needed.

## Attribution

Search images require attribution. The tools automatically track credits in:
```
decks/<deck-id>/resources/materials/image-credits.json
```

For presentations shared externally, include a credits slide or appendix.

## Environment Setup

Required API keys (set in environment):

```bash
# For image generation
export GEMINI_API_KEY=...

# For image search (at least one)
export UNSPLASH_ACCESS_KEY=...
export PEXELS_API_KEY=...
export GOOGLE_CUSTOM_SEARCH_KEY=...
export GOOGLE_CUSTOM_SEARCH_CX=...
```

## Output

After completion:
- Images saved to `decks/<deck-id>/resources/assets/`
- Attribution tracked in `decks/<deck-id>/resources/materials/image-credits.json`
- Work runs logged to `decks/<deck-id>/resources/materials/work-runs/`

## Example Session

```
User: "/acquire-images decks/my-pitch"

Claude reads decks/my-pitch/slides.md, finds:
- Slide 1: Title with abstract tech visual → GENERATE
- Slide 3: Team photo → SEARCH
- Slide 5: Pipeline diagram → GENERATE
- Slide 8: Customer testimonial → SEARCH
- Slide 12: Call to action with branded hero → HYBRID

Claude executes each:

$ python -m lib.media.model_mediated generate "Abstract flowing data visualization, modern tech aesthetic, blue and white gradients, 16:9 aspect ratio" decks/my-pitch/resources/assets/slide1-hero.png --brand "Modern minimalist tech company, clean lines, blue (#0066CC) accent" --slide 1 --deck decks/my-pitch

$ python -m lib.media.model_mediated search "diverse startup team modern office casual professional"
[Reviews 15 results, selects #3]

$ python -m lib.media.model_mediated download "https://images.unsplash.com/photo-abc123" decks/my-pitch/resources/assets/slide3-team.jpg --source unsplash --photographer "Jane Doe" --photo-url "https://unsplash.com/photos/abc123" --slide 3 --deck decks/my-pitch

[continues for remaining slides...]

Claude: "All images acquired. View at http://localhost:8921/decks/my-pitch/"
```
