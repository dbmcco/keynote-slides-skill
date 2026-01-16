# Nano-Banana Image Generation Guide

> Best practices for using Gemini 2.5 Flash (`nano-banana`) to create **embedded infographics** and supporting visuals for keynote decks.

## Core Philosophy

**Generate infographics to embed in slides—not full slides themselves.**

Nano-banana excels at creating discrete visual elements that support your narrative:
- **Embedded diagrams** — Process flows, system architectures, concept maps
- **Data visualizations** — Charts, metrics displays, comparison matrices
- **Conceptual illustrations** — Abstract representations of ideas
- **Technical diagrams** — Workflows, timelines, network visualizations
- **Small supporting graphics** — Icons, badges, accent visuals

**What NOT to use it for:**
- Full slide backgrounds (use CSS gradients and brand tokens instead)
- Text-heavy layouts (let HTML/CSS handle typography)
- Simple shapes or UI elements (use SVG or CSS)

**Key principle:** Provide rich context about the *concept*, not just visual instructions. Nano-banana's strength is understanding complex ideas and translating them into clear visual explanations.

---

## Prompt Structure

Always structure prompts in this order:

```
1. SIZE & PLACEMENT (where it goes, output dimensions)
2. LAYOUT (structure keywords)
3. STYLE (visual aesthetic)
4. TYPOGRAPHY (font guidance)
5. CONTENT TO VISUALIZE (the actual topic, with rich detail)
```

---

## 1. Size & Placement

Specify exact dimensions and context:

```
SIZE & PLACEMENT:
- Output: [width]px × [height]px (will display at ~[display size] on slide)
- Placement: [where on slide — left/right of split, below header, etc.]
- [Readability requirement — e.g., "text minimum 24pt at output size"]
```

**Sizing guidelines for 1200×720px slides:**
- Generate at 2× intended display size for retina clarity
- Split layout (half slide): ~500px display → generate at 1000px
- Full width element: ~1000px display → generate at 2000px
- Square supporting visual: ~450px display → generate at 900-1000px

**Common aspect ratios:**
- Vertical infographic: 3:4 or 9:16
- Square network/concept: 1:1
- Horizontal workflow: 4:1 or 16:5
- Wide banner: 3:1

---

## 2. Layout Keywords

Use these keywords to control organization:

| Keyword | Use For |
|---------|---------|
| **Knolling** | Organized grids, top-down arrangements |
| **Modular Panels** | Boxed sections, card-based layouts |
| **Split-Screen** | Side-by-side comparisons |
| **Flowchart Nodes** | Step-by-step processes, workflows |
| **Central Hub** | Radiating networks, concept maps |
| **Timeline/Roadmap** | Linear progression, milestones |
| **Funnel** | Narrowing progressions, filtering |

Always request:
- Clean alignment
- Ample negative space
- Clear visual hierarchy

---

## 3. Visual Style

**Recommended styles for readability:**
- `Flat vector art` — Clean, modern, scalable
- `Isometric` — 3D depth without perspective complexity
- `Glassmorphism` — Modern tech aesthetic with depth
- `Hand-drawn/sketch` — Approachable, conceptual
- `Minimal line art` — Simple, elegant

**Avoid:** Photorealism (competes with text, hard to read)

**Color palette specification:**
```
Color palette: [description] with specific hex codes
- Primary: #hexcode for [element]
- Secondary: #hexcode for [element]
- Accent: #hexcode for [highlights]
```

---

## 4. Typography

Always specify:
- Font style: "Bold Sans-Serif," "Helvetica-style," "Clean geometric"
- Minimum sizes for readability at display scale
- Hierarchy: headers vs. labels vs. body text

```
TYPOGRAPHY:
- Headers: Bold Sans-Serif, [size]pt+
- Labels: Regular weight, [size]pt+
- All text must be legible when image displays at [display size]
```

**Rule of thumb:** If displaying at 50% of output size, minimum text should be 24pt at output size (appears as 12pt).

---

## 5. Content Integration

This is where nano-banana shines. Provide:
- **Context:** What is this explaining? Why does it matter?
- **Data/facts:** Specific numbers, stages, comparisons
- **Relationships:** How elements connect
- **Emphasis:** What's the key insight or takeaway?
- **Feeling:** What should the viewer understand/feel?

```
CONTENT TO VISUALIZE:
[Explain the concept in detail — 3-5 paragraphs is fine]

Key insight: [The one thing that must come through]
Visual emphasis: [What should be largest/brightest/most prominent]
Overall feeling: [What understanding should viewer walk away with]
```

---

## Example Prompt Patterns

### Minimalist Infographic
```
Create a vertical infographic for [Topic].

SIZE & PLACEMENT:
- Output: 1000px × 1400px
- Placement: Right side of slide
- Text minimum 24pt at output size

LAYOUT: Modular Panels. 4 stacked sections with clear dividers.

STYLE: Clean Minimalist. Flat vector art.
Color palette: Monochromatic [color] with white background.

TYPOGRAPHY: Helvetica-style, Bold headers at 36pt, body at 24pt.

CONTENT TO VISUALIZE:
[Rich description of topic...]
```

### Comparison/Split-Screen
```
Create a split-screen comparison: [Option A] vs [Option B].

SIZE & PLACEMENT:
- Output: 1600px × 1000px
- Placement: Full width below header
- Labels must be readable at 50% scale

LAYOUT: Split-Screen. Symmetrical two-column grid with center divider.

STYLE: Flat modern vector.
Color palette: Left side uses [color A], right side uses [color B].

TYPOGRAPHY: Bold Sans-Serif headers, clean labels.

CONTENT TO VISUALIZE:
[Detailed comparison points...]
```

### Workflow/Timeline
```
Create a horizontal workflow diagram for [Process].

SIZE & PLACEMENT:
- Output: 2000px × 500px
- Placement: Full width, below existing content
- Icons 80px+, text 28pt+ for readability

LAYOUT: Flowchart Nodes. Linear horizontal progression with [N] stages.
Clean arrow connectors. Equal spacing.

STYLE: Flat vector art with subtle depth.
Color palette: Each stage distinct — [colors for each].

TYPOGRAPHY: Stage names Bold 36pt, descriptions Regular 24pt.

CONTENT TO VISUALIZE:
[Detailed description of each stage, what happens, why it matters...]
```

### Network/Concept Map
```
Create a network visualization for [Concept].

SIZE & PLACEMENT:
- Output: 1000px × 1000px (square)
- Placement: Hero visual on left side
- Nodes visually distinct at 50% scale

LAYOUT: Central Hub with radiating connections.
10% margin on all edges.

STYLE: Glassmorphism on dark background.
Color palette: [colors for nodes, connections, highlights].

TYPOGRAPHY: One key stat prominently displayed, minimal other text.

CONTENT TO VISUALIZE:
[Rich explanation of what the network represents, scale, relationships...]
```

---

## Brand-Specific Palettes

### Northwind Labs
```
Background light: #fafbfc
Background dark: #1a1a2e
Primary accent: Amber #ed8936
Secondary accent: Cyan #00b5d8
Neutral: Slate #4a5568

Style note: "Modern tech aesthetic, amber and cyan highlights, clean studio lighting"
```

### Apex Consulting
```
Background: Warm parchment #f5f1e8
Ink: #1a1a1a
Accent: Brass/Bronze #b8956f
Secondary: Sage #d4a574

Style note: "Warm parchment palette, refined brass accents, minimal editorial lighting"
```

### Coastal Biotech
```
Background: #f6f7f9
Ink: Navy #0e2841
Accent: Teal #156082
Secondary: Green #196b24

Style note: "Navy biotech palette, teal accents, high-clarity lab lighting"
```

---

## Checklist Before Generating

- [ ] Output dimensions specified (2× display size)
- [ ] Placement on slide described
- [ ] Readability requirements stated (min text size)
- [ ] Layout keyword chosen
- [ ] Visual style specified (not photorealism)
- [ ] Color palette with hex codes
- [ ] Typography sizes defined
- [ ] Content explained in detail (3+ paragraphs)
- [ ] Key insight/emphasis identified
- [ ] Desired feeling/understanding stated

---

## Infographic Types & Best Practices

### When to Use Each Type

| Infographic Type | Best For | Avoid When |
|------------------|----------|------------|
| **Flowchart** | Linear processes, decision trees, workflows | Showing relationships without clear sequence |
| **Timeline/Roadmap** | Historical progression, project phases, milestones | Non-sequential information |
| **Network/Concept Map** | Relationships, ecosystems, interconnected concepts | Simple hierarchies |
| **Comparison Matrix** | Side-by-side evaluation, feature comparisons | More than 4-5 items |
| **Funnel** | Conversion processes, filtering stages | Non-narrowing progressions |
| **Venn Diagram** | Overlapping concepts, shared characteristics | More than 3 categories |
| **Metrics Dashboard** | KPIs, statistics, quantitative highlights | Narrative-heavy content |

### Prompting by Infographic Type

**Flowchart/Process Diagram:**
```
Create a [horizontal/vertical] flowchart showing [process name].

STAGES:
1. [Stage name] — [what happens, inputs/outputs]
2. [Stage name] — [what happens, decision points]
3. [Stage name] — [what happens, outcomes]

VISUAL REQUIREMENTS:
- Use [geometric shapes: rectangles for actions, diamonds for decisions]
- Connectors: [arrows, curved lines, right-angle elbows]
- Each stage visually distinct with [color coding strategy]
- Decision branches clearly labeled with Yes/No paths
```

**Timeline/Roadmap:**
```
Create a [horizontal/vertical] timeline for [subject].

MILESTONES:
- [Date/Phase]: [Event/milestone name] — [significance]
- [Date/Phase]: [Event/milestone name] — [significance]
- [Date/Phase]: [Event/milestone name] — [significance]

VISUAL REQUIREMENTS:
- Central axis with markers at each milestone
- Visual weight emphasizes [current state / key moment]
- Progressive color gradient showing [past→present→future]
```

**Comparison/Split-Screen:**
```
Create a split-screen comparison: [Option A] vs [Option B].

COMPARISON POINTS:
| Aspect | [Option A] | [Option B] |
|--------|------------|------------|
| [Metric 1] | [Value/description] | [Value/description] |
| [Metric 2] | [Value/description] | [Value/description] |

VISUAL REQUIREMENTS:
- Symmetrical layout with clear center divider
- Left uses [color A], right uses [color B]
- Icons or small illustrations for each aspect
- Winner/recommendation subtly highlighted
```

**Network/Concept Map:**
```
Create a network visualization showing [concept/ecosystem].

NODES:
- Central: [Main concept] — [role/importance]
- Connected: [Related concept 1] — [relationship type]
- Connected: [Related concept 2] — [relationship type]
- Peripheral: [Supporting concepts]

RELATIONSHIPS:
- [Node A] ↔ [Node B]: [connection type, strength]
- [Node A] → [Node C]: [directional relationship]

VISUAL REQUIREMENTS:
- Central node largest/most prominent
- Connection line weight indicates relationship strength
- Node clusters for related concepts
- Minimal labels, rely on visual hierarchy
```

### Content Density Guidelines

**Low Density (Hero Visuals):**
- 1-3 key elements
- Large display size (800px+ width)
- Minimal text, rely on visual metaphor
- Use for: Opening slides, key insights, emotional moments

**Medium Density (Supporting Diagrams):**
- 4-8 elements with labels
- Medium display size (400-700px width)
- Concise labels (2-4 words each)
- Use for: Process explanations, comparisons, feature lists

**High Density (Reference Infographics):**
- 10+ elements with detailed labels
- Can be larger for detail
- More text acceptable if hierarchy clear
- Use for: Technical deep-dives, comprehensive overviews

### Common Mistakes to Avoid

1. **Overcrowding** — If you need more than 8-10 elements, split into multiple graphics
2. **Tiny text** — Always specify minimum text size relative to display dimensions
3. **Photorealism** — Flat vector styles render more clearly at small sizes
4. **Missing context** — Don't just list elements; explain relationships and significance
5. **Generic colors** — Always use brand palette hex codes, not vague descriptors
6. **No emphasis** — Every infographic needs a visual focal point

---

## Claude Code CLI Visual Evaluation

Claude Code can evaluate generated infographics qualitatively by examining them through the Read tool or screenshots. Use this workflow to iterate on visual quality.

### Evaluation Criteria

When reviewing generated images, assess:

**1. Clarity & Readability**
- Is text legible at the intended display size?
- Are labels positioned clearly near their referents?
- Is the visual hierarchy obvious (what's most important)?

**2. Accuracy & Completeness**
- Does the infographic capture all required elements?
- Are relationships correctly represented?
- Is any information missing or misrepresented?

**3. Brand Alignment**
- Does it use the correct color palette?
- Is the style consistent with brand guidelines?
- Would it fit seamlessly into the slide deck?

**4. Visual Balance**
- Is there appropriate whitespace/negative space?
- Are elements evenly distributed (unless intentionally asymmetric)?
- Does the composition guide the eye appropriately?

### Evaluation Workflow

```
1. Generate infographic with detailed prompt
2. Read the generated image file with Claude Code
3. Assess against the criteria above
4. Document issues found
5. Refine prompt with specific corrections
6. Regenerate and compare
```

### Prompt Refinement Patterns

**If text is illegible:**
```
Add to prompt: "Minimum text size 28pt at output resolution.
Use high-contrast colors for text against backgrounds."
```

**If layout is cluttered:**
```
Add to prompt: "Leave 15% margin on all edges.
Increase spacing between elements by 50%.
Remove any decorative elements that don't convey information."
```

**If hierarchy is unclear:**
```
Add to prompt: "Make [primary element] 2× larger than secondary elements.
Use color saturation to indicate importance: brightest = most important.
Add subtle drop shadow to lift key elements."
```

**If brand colors are wrong:**
```
Add to prompt: "STRICT COLOR PALETTE — use ONLY these colors:
- Primary: #[exact hex]
- Secondary: #[exact hex]
- Accent: #[exact hex]
- Background: #[exact hex]
Do not introduce any colors not in this list."
```

### Iteration Example

**First attempt prompt:**
```
Create a workflow diagram for our data pipeline.
```

**Claude Code evaluation:**
"The generated diagram has 6 stages but text is too small to read at 400px display width. The colors are generic blue/gray instead of Northwind brand. Missing the feedback loop between stages 4 and 2."

**Refined prompt:**
```
Create a horizontal workflow diagram for Northwind's data pipeline.

SIZE: 1200px × 400px (displays at 600px × 200px)
Text minimum 32pt at output size.

STAGES (left to right):
1. Data Ingestion — sensors, APIs, manual entry
2. Validation — schema checks, anomaly detection
3. Processing — normalization, enrichment
4. Analysis — ML models, pattern recognition
5. Storage — data lake, indexed retrieval
6. Visualization — dashboards, reports

IMPORTANT: Add feedback arrow from stage 4 back to stage 2
(analysis results improve validation rules)

COLOR PALETTE (Northwind brand):
- Background: #fafbfc
- Primary nodes: #ed8936 (amber)
- Secondary elements: #00b5d8 (cyan)
- Connectors: #4a5568 (slate)
- Text: #1a1a2e (dark)

STYLE: Modern tech aesthetic, clean flat vector,
subtle gradients on nodes, no photorealism.
```
