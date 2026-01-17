# Integrated Architecture: Narrative Engine + Keynote Slides

## Overview

This document describes how Narrative Engine (content strategy) integrates with keynote-slides-skill (visual execution) while preserving the resources folder pattern for material ingestion.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         INTEGRATED WORKFLOW                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐   │
│   │  RESOURCES   │────▶│  NARRATIVE       │────▶│  VISUAL          │   │
│   │  INGESTION   │     │  ENGINE          │     │  EXECUTION       │   │
│   └──────────────┘     └──────────────────┘     └──────────────────┘   │
│                                                                          │
│   materials/           Discovery +          HTML generation +           │
│   assets/              Framework Match +     Gemini nano banana +       │
│   briefs, data,        5-Agent Review       Brand tokens                │
│   images, notes                                                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## The Model-Mediated Conversation

The core integration point is a model-mediated conversation that:

1. **Reads all resources** in the deck folder
2. **Synthesizes materials** into a content summary
3. **Guides discovery** using Narrative Engine's 5 questions
4. **Recommends frameworks** based on content analysis + user answers
5. **Generates deck** with source attribution
6. **Runs review panel** with 5 specialized agents
7. **Outputs HTML** following keynote-slides-skill patterns
8. **Generates visuals** with Gemini nano banana

## Folder Structure

```
decks/<deck-id>/
├── index.html                    # Final visual output
├── deck-config.js               # Deck metadata
├── deck.json                    # Same in JSON form
├── slides.md                    # Draft copy and notes
├── narrative-context.json       # Discovery answers + framework choice
└── resources/
    ├── assets/                  # Visual inputs
    │   ├── logo.png
    │   ├── chart-data.png
    │   └── generated/           # AI-generated images
    │       ├── hero-visual.png
    │       └── concept-diagram.png
    └── materials/               # Content inputs
        ├── brief.md             # Main briefing document
        ├── research.pdf         # Research/data sources
        ├── interview-notes.txt  # Raw notes
        ├── competitor-data.csv  # Data files
        └── review-context.json  # Review interview results
```

## Phase 1: Resource Ingestion

Before discovery questions, the model reads and synthesizes all materials:

```typescript
interface ResourceSynthesis {
  // What the model extracted from materials
  keyThemes: string[];           // Main topics/arguments
  dataPoints: DataPoint[];       // Statistics, metrics, facts
  narrativeElements: string[];   // Quotes, stories, examples
  visualAssets: string[];        // Available images/charts
  potentialSurprises: string[];  // Counterintuitive findings
  gaps: string[];                // What's missing/needed

  // Source tracking
  sources: {
    filename: string;
    contentType: 'brief' | 'data' | 'notes' | 'research' | 'image';
    extractedItems: number;
  }[];
}
```

### Model Prompt for Ingestion

```markdown
You are preparing to build a presentation. Review all materials in the resources folder.

For each file, extract:
1. Key themes and arguments
2. Specific data points (numbers, statistics, facts)
3. Narrative elements (quotes, stories, examples)
4. Potential "aha moments" or counterintuitive findings
5. What's missing that we'll need to generate

Create a synthesis that will inform framework selection and deck building.
Track which file each element came from for source attribution.
```

## Phase 2: Informed Discovery

The 5 discovery questions now leverage the resource synthesis:

### Question 1: Audience (unchanged)
Standard Narrative Engine question.

### Question 2: Purpose (unchanged)
Standard Narrative Engine question.

### Question 3: Content Type (informed by synthesis)
```markdown
Based on your materials, I see:
- [Extracted themes and patterns]
- [Potential counterintuitive findings]

Which best describes what you're presenting?
1. Counterintuitive research findings  ← Your data on [X] might fit here
2. Strategic plan / transformation roadmap
3. [etc.]
```

### Question 4: Tone (unchanged)
Standard Narrative Engine question.

### Question 5: Reveal Potential (informed by synthesis)
```markdown
I noticed something in your materials that could be a genuine surprise:
"[Extracted potential surprise]"

Does your material contain a counterintuitive finding or reframe?
1. Yes — the finding about [X] is the twist
2. Yes — but it's something else: [let me know]
3. No — straightforward information delivery
4. Help me identify if there's a hidden reveal
```

## Phase 3: Framework Recommendation

Recommendations now reference specific content from materials:

```markdown
## Recommendation 1: The Prestige

**Why this works for your materials:**
Your research shows [specific finding from brief.md] which directly contradicts
the conventional wisdom that [common belief]. This is a perfect "Turn" moment.

**Your materials mapped to this structure:**
1. Pledge: The [competitor-data.csv] shows industry believes X
2. Plant #1: [Stat from research.pdf] hints at anomaly
3. Turn [REVEAL]: [The counterintuitive finding you identified]
4. Prestige: [Conclusion from brief.md]

**Materials coverage:**
- brief.md: 80% used (sections 1-4)
- research.pdf: 60% used (key statistics)
- interview-notes.txt: 40% used (quote on slide 7)
- Gap: Need 3 additional slides to bridge sections 3-4
```

## Phase 4: Deck Generation with Source Attribution

Every slide tracks its origin:

```markdown
## Slide 5 — The Turn

**Headline:** Remote workers outperform hybrid by 23% when meeting load drops below 8 hours weekly

**Spotlight:** The correlation held across all job families, tenure levels, and time zones—
but only after we controlled for the meeting burden that hybrid schedules impose.

**Design note:** Split comparison chart—hybrid vs. remote productivity curves,
with meeting hours as the x-axis. The crossover point is highlighted.

**Source:** [PARAPHRASE from research.pdf, page 12]

**Visual:** [TO GENERATE] — Brand style: editorial illustration, warm parchment palette
```

### Source Tags

| Tag | Meaning | Example |
|-----|---------|---------|
| `[DIRECT from {file}]` | Verbatim quote | `[DIRECT from brief.md, line 47]` |
| `[PARAPHRASE from {file}]` | Restated ideas | `[PARAPHRASE from research.pdf, page 12]` |
| `[ELABORATED from {file}]` | Expanded concept | `[ELABORATED from interview-notes.txt]` |
| `[SYNTHESIZED]` | Combined multiple sources | `[SYNTHESIZED from brief.md + research.pdf]` |
| `[GENERATED]` | New content for flow | `[GENERATED - transition to next section]` |

## Phase 5: Review Panel

The 5-agent review now has access to source materials:

### Content Expert Enhancement

```markdown
You are reviewing this deck for accuracy and sourcing.

**Source materials available:**
- brief.md: [content]
- research.pdf: [extracted text]
- interview-notes.txt: [content]

For each claim in the deck:
1. Verify against source materials
2. Flag if [PARAPHRASE] changed meaning
3. Identify claims marked [GENERATED] that should have source support
4. Find supporting evidence in materials that wasn't used
```

### Visual Designer Enhancement

```markdown
You are reviewing visual suggestions for this deck.

**Visual assets available:**
- resources/assets/logo.png
- resources/assets/chart-data.png

**Brand guidelines:** [from brand-guidelines.md]

For each design note:
1. Can we use an existing asset?
2. What should be generated with Gemini nano banana?
3. Suggest specific prompts for generation
```

## Phase 6: Visual Execution

After review, generate the HTML deck:

### HTML Generation

```typescript
interface DeckOutput {
  html: string;           // Full index.html
  generationQueue: {      // Images to generate
    slideNumber: number;
    prompt: string;       // With brand prefix
    outputPath: string;
  }[];
  assetMapping: {         // Existing assets used
    slideNumber: number;
    assetPath: string;
  }[];
}
```

### Gemini Integration

For slides marked `[TO GENERATE]`:

```bash
# Generate all visuals for the deck
node scripts/generate-image.js --batch decks/<deck-id>
```

The script reads `narrative-context.json` for:
- Brand entity (for mediaPromptPrefix)
- Design notes from each slide
- Metaphor family for consistency

## Workflow Commands

### Create New Deck

```bash
# 1. Bootstrap deck folder
scripts/new-deck.sh my-presentation --entity northwind --title "Q4 Strategy"

# 2. Add materials to resources/materials/
# Drop in: brief.md, data files, research, images

# 3. Run integrated workflow
node scripts/narrative-build.js decks/my-presentation

# This runs:
# - Resource ingestion
# - Discovery questions (interactive)
# - Framework recommendation
# - Deck generation
# - Review panel
# - HTML output
# - Image generation queue
```

### Review Existing Deck

```bash
# Run review panel on existing deck
node scripts/deck-review.js decks/my-presentation --full-panel
```

## Integration Files

### narrative-context.json

```json
{
  "created": "2025-01-17T10:30:00Z",
  "discovery": {
    "audience": "executive",
    "purpose": "persuade",
    "contentType": "counterintuitive-research",
    "tone": "authoritative",
    "revealPotential": "yes"
  },
  "framework": {
    "name": "The Prestige",
    "variant": "pyramid-hybrid",
    "revealPosition": 0.60
  },
  "length": "medium",
  "slideCount": 28,
  "metaphorFamily": "illumination",
  "resourceSynthesis": {
    "sourcesUsed": ["brief.md", "research.pdf"],
    "keyThemes": ["remote productivity", "meeting burden"],
    "dataPoints": [
      {"value": "23%", "context": "productivity increase", "source": "research.pdf"}
    ]
  },
  "sourcingScore": {
    "direct": 4,
    "paraphrase": 8,
    "elaborated": 6,
    "synthesized": 3,
    "generated": 7,
    "userSourcedPercent": 54
  }
}
```

### Review Panel Output

```json
{
  "reviewDate": "2025-01-17T11:00:00Z",
  "agents": {
    "audienceAdvocate": { "rating": "strong", "flags": [] },
    "commsSpecialist": { "rating": "strong", "suggestions": 2 },
    "visualDesigner": { "upgrades": 4 },
    "critic": { "cutSuggestions": 2, "efficacyScore": 78 },
    "contentExpert": { "factualConfidence": "high", "citationsNeeded": 1 }
  },
  "conflicts": [],
  "directorSummary": "Ready with minor edits. Priority: add methodology context.",
  "readyToPresent": true
}
```

## Benefits of Integration

| Before | After |
|--------|-------|
| Manual framework selection | Model recommends based on material analysis |
| Separate discovery and building | Continuous synthesis from resources |
| Generic visual suggestions | Brand-aware prompts with asset awareness |
| Single-perspective review | 5-agent panel with Director synthesis |
| Unknown content origin | Full source attribution per slide |
| Separate narrative and visual | Unified workflow end-to-end |

## Model-Mediated Principles Applied

Following the model-mediated development pattern:

1. **Model reads materials** — Not pre-processed summaries
2. **Model synthesizes** — Identifies themes, surprises, gaps
3. **Model guides discovery** — Informed questions, not rote forms
4. **Model recommends** — Framework selection with material-specific rationale
5. **Model generates** — Deck content with source tracking
6. **Model reviews** — Multi-agent panel with specialized lenses
7. **Code executes** — HTML rendering, Gemini API calls

The code provides:
- File reading (materials, assets)
- API execution (Gemini generation)
- HTML templating (deck output)
- Review infrastructure (agent orchestration)

The model decides:
- What themes matter
- Which framework fits
- How to structure content
- What's working/not working
- What visuals to generate
