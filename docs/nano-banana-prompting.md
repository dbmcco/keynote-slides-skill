# Nano-Banana Image Generation Guide

> Best practices for using Gemini 2.5 Flash (`nano-banana`) to create diagrams, infographics, and supporting visuals for keynote decks.

## Overview

Nano-banana excels at understanding detailed concepts and translating them into clear visual explanations. Use it for:
- Infographic-style explanations
- Workflow and process diagrams
- Data visualizations
- Conceptual illustrations
- Supporting visuals (not full-slide backgrounds)

**Key principle:** The more detail you provide about the topic, the better the output. Explain the situation thoroughly, give sizing/placement guidance, then let it generate.

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

### Synthyra
```
Background light: #fafbfc
Background dark: #1a1a2e
Primary accent: Amber #ed8936
Secondary accent: Cyan #00b5d8
Tertiary accent: Purple #805ad5
Success: Green #38a169
Danger/Warning: Red #e53e3e
Neutral: Slate #4a5568

Style note: "Modern biotech aesthetic, clean studio lighting"
```

### LightForge Works
```
Background: Warm parchment #f5f1e8
Ink: #1a1a1a
Accent: Brass/Bronze #b8956f
Secondary: Sage #d4a574

Style note: "Warm parchment palette, refined brass accents, minimal editorial lighting"
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
