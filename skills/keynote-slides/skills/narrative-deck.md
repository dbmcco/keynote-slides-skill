---
name: narrative-deck
description: Create a presentation using the Narrative Engine workflow. Ingests resources, guides discovery, recommends frameworks, generates deck outline, and runs 5-agent review. Use when transforming content (articles, research, briefs) into structured presentations.
---

# Narrative Deck Creation

Transform content into compelling presentations using proven storytelling frameworks.

## Workflow

### Step 1: Ingest Resources

Read all materials from the deck folder:

```bash
node scripts/ingest-resources.js decks/<deck-id>
```

Or manually review:
- `resources/materials/` — briefs, research, notes, data
- `resources/assets/` — logos, images, charts

**Synthesize materials into:**
- Key themes and arguments
- Specific data points (numbers, statistics)
- Narrative elements (quotes, stories)
- Potential surprises or counterintuitive findings
- Gaps that need to be filled

### Step 2: Discovery Questions

Ask these 5 questions to understand context:

**Q1: Audience**
> Who will see this presentation?
> 1. Executive / Board (time-constrained)
> 2. Technical / Engineering (methodology-focused)
> 3. Investors / VCs (seeking growth story)
> 4. Skeptics / Resisters (need to be won over)
> 5. General Public / Keynote (broad accessibility)
> 6. Mixed / Cross-functional (varied expertise)

**Q2: Purpose**
> What are you trying to accomplish?
> 1. Persuade to act (get approval, close deal)
> 2. Inform / Educate (transfer knowledge)
> 3. Inspire / Motivate (energize, create vision)
> 4. Align / Build consensus (get buy-in)
> 5. Report / Update (share status)
> 6. Defend / Justify (support a position)
> 7. Entertain / Engage (keynote, thought leadership)

**Q3: Content Type**
> What type of content is this?
> 1. Counterintuitive research findings
> 2. Strategic plan / transformation
> 3. Scenario planning / decision fork
> 4. Paradigm shift / new mental model
> 5. Origin story / case study
> 6. Post-mortem / retrospective
> 7. Pattern recognition / hidden dynamics
> 8. Multi-stakeholder / controversial
> 9. Sales / investor pitch
> 10. Product launch

**Q4: Tone**
> What tone do you want?
> 1. Authoritative / Expert
> 2. Provocative / Challenging
> 3. Warm / Relatable
> 4. Urgent / Action-oriented
> 5. Balanced / Objective
> 6. Visionary / Aspirational

**Q5: Reveal Potential**
> Does your material contain a genuine surprise or reframe?
> 1. Yes — there's a twist or "aha moment"
> 2. No — straightforward information
> 3. Help me find one

### Step 3: Framework Recommendation

Based on discovery, recommend 2-3 frameworks from:

**Narrative Arcs (engagement-optimized):**
| Arc | Best For | Reveal Position |
|-----|----------|-----------------|
| The Prestige | Counterintuitive findings | ~60% |
| Mystery Box | Research with unexpected conclusions | ~60% |
| The Heist | Strategy, transformation roadmaps | ~75% |
| Time Machine | Scenario planning, vision | ~55% |
| Trojan Horse | Paradigm shifts, skeptical audiences | ~50% |
| Hero's Journey | Origin stories, change management | ~65% |
| Columbo | Post-mortems, root cause analysis | ~70% |
| Game of Scene | Pattern recognition, cross-domain | ~65% |
| Rashomon | Multi-stakeholder, controversial | ~70% |

**Communication Frameworks (efficiency-optimized):**
| Framework | Best For |
|-----------|----------|
| Minto Pyramid | Executive updates, board decks |
| SCQA | Opening hooks, problem framing |
| AIDA | Sales, fundraising |
| PAS | Change management, skeptics |
| Raskin Sales Deck | B2B sales, category creation |
| Duarte Resonate | Keynotes, vision |

For each recommendation, show:
1. Framework name and fit score
2. Why it works for their situation
3. Their content mapped to the structure
4. Tradeoffs

See `references/narrative-engine/framework-selection.md` for the selection matrix.
See `references/narrative-engine/framework_selection_guide.md` for deeper arc + framework pairing.

### Step 4: Length Selection

> How long is your presentation?
> 1. Short (10-12 min) — ~12-15 slides
> 2. Medium (30 min) — ~25-35 slides
> 3. Full (60 min) — ~45-55 slides

### Step 5: Deck Generation

Generate slides with:

**Per slide:**
- **Headline:** ≤14 words, active voice, power verbs
- **Spotlight:** ≤60 words, one supporting element
- **Design note:** Specific visual suggestion
- **Source tag:** [DIRECT/PARAPHRASE/ELABORATED/SYNTHESIZED/GENERATED]

**Headline rules:**
- Image & Action: concrete nouns + strong verbs
- Tension & Turn: Because/Therefore, Not/But
- 8-14 words, two-beat rhythm
- One metaphor family per deck

**Power verbs:** tilts, unseats, ignites, drains, compounds, widens, narrows, unlocks, hardens, softens, amplifies, sharpens, bends, anchors, accelerates, stalls

### Step 6: Review Panel

Run 5 specialist agents in parallel:

**1. Audience Advocate**
> You are the [audience description]. Review through their eyes.
> - What resonates? What makes you skeptical?
> - What's missing that you'd need?
> - Which slides would you tune out on?

**2. Comms Specialist**
> Review for messaging, emotion, and persuasion.
> - Is there one clear takeaway?
> - Map the emotional arc — where are dead spots?
> - Flag any PR risks
> - Identify 3 headlines to sharpen

Reference: `references/narrative-engine/agent-reference-persuasion.md`

**3. Visual Designer**
> Review visual storytelling and metaphor coherence.
> - Is metaphor family consistent?
> - Which slides have weak design notes?
> - What visual makes the reveal unforgettable?
> - Identify 3 most memorable potential visuals

Reference: `references/narrative-engine/agent-reference-visual.md`

**4. Critic**
> Ruthless editor focused on efficacy.
> - If you cut 5 slides, which?
> - Rank slides strongest to weakest
> - Where does pacing drag?
> - Probability this achieves purpose: X%

**5. Content Expert**
> Fact-check and ensure accuracy.
> - Flag unsupported claims
> - Are [GENERATED] slides factually defensible?
> - Logical leaps where conclusions don't follow?
> - Rate confidence in major claims

Reference: `references/narrative-engine/agent-reference-verification.md`

Use `references/narrative-engine/checklists.md` for final quality gates before delivery.

### Director Synthesis

Integrate all agent feedback:

```markdown
## Review Panel Synthesis

### Strengths
- [What's working] — *Agent attribution*

### Recommended Changes
**Messaging:** [Changes] — *Comms Specialist*
**Audience Fit:** [Changes] — *Audience Advocate*
**Visuals:** [Upgrades] — *Visual Designer*
**Cuts:** [Recommendations] — *Critic*
**Accuracy:** [Flags] — *Content Expert*

### Points Requiring Decision
> **Conflict:** [Agent disagreement]
> **Options:** 1) [A] 2) [B] 3) Keep as-is

### Overall Assessment
**Ready?** Yes / Yes with edits / Needs revision
**Most important:** [Single sentence]
**Efficacy confidence:** X%
```

## Output

After review, generate:
1. Complete slide outline (slides.md)
2. Narrative context (narrative-context.json)
3. HTML deck (index.html)
4. Image generation queue

## Files Created

```
decks/<deck-id>/
├── index.html              # Visual deck
├── slides.md               # Slide outline with sources
├── narrative-context.json  # Discovery + framework + scores
└── resources/
    └── materials/
        └── review-synthesis.md  # Review panel output
```
