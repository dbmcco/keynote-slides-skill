# Model-Mediated Image Search Architecture

## Overview

The image search system uses **model-mediated** design where:
- **Claude (in conversation)** decides whether to generate or search
- **Claude** composes search queries and evaluates results
- **CLI tools** execute those decisions (call Gemini API, search APIs)
- No separate LLM API calls from Python - Claude IS the model

This is a CLI tool workflow: Claude decides, Python executes.

## Decision Framework

```
┌─────────────────────────────────────────────────────────────────┐
│                    SLIDE IMAGE REQUEST                          │
│         data-prompt="Diagram of our three-stage pipeline"       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MODEL DECISION                             │
│                                                                 │
│  Inputs:                                                        │
│  • Prompt text + brand context                                  │
│  • Slide type (hero, diagram, data-viz, portrait, etc.)        │
│  • Entity mediaPromptPrefix                                     │
│                                                                 │
│  Decision: GENERATE | SEARCH | HYBRID                          │
│                                                                 │
│  Reasoning exposed in work-runs/*.json                         │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
       ┌──────────┐    ┌──────────┐    ┌──────────┐
       │ GENERATE │    │  SEARCH  │    │  HYBRID  │
       │          │    │          │    │          │
       │ nano-    │    │ Unsplash │    │ Search + │
       │ banana   │    │ Pexels   │    │ Edit     │
       │          │    │ Google   │    │          │
       └──────────┘    └──────────┘    └──────────┘
              │               │               │
              └───────────────┼───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MODEL REVIEW                                │
│                                                                 │
│  • Does result match brand guidelines?                         │
│  • Does result support the slide's message?                    │
│  • Quality check (resolution, composition)                     │
│  • Retry with adjusted parameters if needed                    │
└─────────────────────────────────────────────────────────────────┘
```

## When to Generate vs Search

The model decides based on context (no heuristic fallback - model judgment is required):

| Content Type | Likely Decision | Reasoning |
|--------------|-----------------|-----------|
| **Diagrams, flowcharts** | GENERATE | Custom layouts, brand colors, specific relationships |
| **Data visualizations** | GENERATE | Precise data representation needed |
| **Abstract concepts** | GENERATE | Metaphorical visuals matching brand style |
| **Real-world photos** | SEARCH | Authentic imagery, people, locations |
| **Product screenshots** | SEARCH (or provided) | Real product, not generated |
| **Team/people** | SEARCH | Realistic human photos |
| **Backgrounds/textures** | SEARCH or GENERATE | Either works |
| **Icons/illustrations** | GENERATE | Brand-consistent style |
| **Branded infographics** | HYBRID | Search base, generate overlays |

## Search Sources

### Unsplash API
- **Best for:** Hero images, backgrounds, lifestyle, nature
- **License:** Free for commercial use
- **Strengths:** High quality, curated, consistent aesthetic
- **Endpoint:** `https://api.unsplash.com/search/photos`

### Pexels API
- **Best for:** Business, people, technology, office
- **License:** Free for commercial use
- **Strengths:** Good video content too, diverse subjects
- **Endpoint:** `https://api.pexels.com/v1/search`

### Google Custom Search API
- **Best for:** Specific niche imagery, news, events
- **License:** Requires filtering by usage rights
- **Strengths:** Broadest coverage
- **Caution:** Must filter for `usageRights=creativeCommon` or similar
- **Endpoint:** `https://www.googleapis.com/customsearch/v1`

## Workflow: Claude + CLI Tools

Claude (in the conversation) makes all decisions. The CLI tools execute.

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLAUDE (in conversation)                     │
│                                                                 │
│  1. Reads slide prompt + brand context                          │
│  2. DECIDES: Generate? Search? Hybrid?                          │
│  3. Composes query/prompt accordingly                           │
│  4. Calls CLI tool to execute                                   │
│  5. Reviews result, retries if needed                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CLI TOOLS (Python)                         │
│                                                                 │
│  python -m lib.media.model_mediated generate "prompt" out.png   │
│  python -m lib.media.model_mediated search "query"              │
│  python -m lib.media.model_mediated download source:id out.jpg  │
│                                                                 │
│  Tools call Gemini API or search APIs, return results           │
└─────────────────────────────────────────────────────────────────┘
```

### Example Claude Workflow

```
User: "Generate an image for slide 3: Team collaboration in action"

Claude thinks:
- "Team collaboration" suggests real people
- Real people photos are more authentic than AI-generated
- Decision: SEARCH

Claude executes:
$ python -m lib.media.model_mediated search "diverse team collaboration modern office whiteboard"

Found 15 results:
1. [unsplash:abc123] Team meeting around whiteboard...
2. [pexels:xyz789] Diverse group collaborating...
...

Claude reviews results, selects #2:
$ python -m lib.media.model_mediated download pexels:xyz789 decks/my-deck/resources/assets/slide3.jpg --deck decks/my-deck --slide 3

Claude confirms: "Downloaded team photo for slide 3. Attribution tracked."
```

## API Integration

### Environment Variables

```bash
# Image generation
GEMINI_API_KEY=...

# Image search
UNSPLASH_ACCESS_KEY=...
PEXELS_API_KEY=...
GOOGLE_CUSTOM_SEARCH_KEY=...
GOOGLE_CUSTOM_SEARCH_CX=...  # Search engine ID
```

### Search Client Interface

```python
@dataclass
class SearchResult:
    """Result from image search."""
    id: str
    source: str  # 'unsplash' | 'pexels' | 'google'
    url: str
    thumbnail_url: str
    description: str
    photographer: str
    width: int
    height: int
    license: str

class ImageSearchClient:
    """Unified client for multiple image search sources."""

    def search(
        self,
        query: str,
        sources: list[str] = ["unsplash", "pexels"],
        per_page: int = 10,
        orientation: str = "landscape",  # landscape | portrait | squarish
        min_width: int = 1600,
    ) -> list[SearchResult]:
        """Search across multiple sources."""
        ...

    def download(self, result: SearchResult, output_path: Path) -> Path:
        """Download image and track attribution."""
        ...
```

## Attribution Tracking

Images from search sources require attribution. Track in deck metadata:

```json
// decks/<deck-id>/resources/materials/image-credits.json
{
  "images": [
    {
      "file": "resources/assets/hero-team.jpg",
      "source": "unsplash",
      "photographer": "Annie Spratt",
      "photographer_url": "https://unsplash.com/@anniespratt",
      "photo_url": "https://unsplash.com/photos/abc123",
      "license": "Unsplash License",
      "slide": 1
    }
  ]
}
```

Generate credits slide or export attribution report.

## Prompt Engineering for Search

The model composes search queries by:
1. Extracting key visual concepts from the prompt
2. Removing brand-specific jargon
3. Adding relevant modifiers (professional, business, modern, etc.)

**Example transformations:**

| Slide Prompt | Search Query |
|--------------|--------------|
| "Team collaboration in our modern office" | "team collaboration modern office business" |
| "Customer success moment" | "happy customer business success celebration" |
| "Data security shield protecting information" | "cybersecurity data protection digital" |
| "Pipeline flowing from left to right" | GENERATE (not searchable) |

## Browser Integration

Extend the generator panel (`g` key) to support search:

```html
<div class="gen-panel-mode">
  <label>
    <input type="radio" name="mode" value="auto" checked> Auto (model decides)
  </label>
  <label>
    <input type="radio" name="mode" value="generate"> Generate only
  </label>
  <label>
    <input type="radio" name="mode" value="search"> Search only
  </label>
</div>

<div class="gen-panel-search-results" hidden>
  <!-- Model-selected search results for review -->
</div>
```

## Work Run Artifacts

All decisions logged for auditability:

```json
// resources/materials/work-runs/image-2024-01-15-143022.json
{
  "slide": 3,
  "prompt": "Team of engineers discussing architecture",
  "decision": {
    "action": "SEARCH",
    "reasoning": "Real people photos are more authentic than AI-generated faces. Brand guidelines emphasize 'genuine human connection'.",
    "preferred_sources": ["unsplash", "pexels"]
  },
  "search": {
    "query": "engineering team discussion whiteboard startup",
    "results_count": 20,
    "selected": {
      "id": "abc123",
      "source": "unsplash",
      "reasoning": "Diverse team, modern office, good composition for 16:9 crop"
    }
  },
  "review": {
    "acceptable": true,
    "notes": "Good match for brand's 'collaborative innovation' theme"
  }
}
```

## Implementation Phases

### Phase 1: Search Client
- [ ] Unsplash API integration
- [ ] Pexels API integration
- [ ] Unified SearchResult model
- [ ] Attribution tracking

### Phase 2: Model Decision Layer
- [ ] Decision prompt engineering
- [ ] Search query composition
- [ ] Result selection logic
- [ ] Review/retry loop

### Phase 3: Integration
- [ ] Browser panel updates
- [ ] CLI support (`--mode auto|generate|search`)
- [ ] Work run logging
- [ ] Credits export

### Phase 4: Hybrid Mode
- [ ] Search + edit pipeline
- [ ] Brand overlay generation
- [ ] Composite workflows
