# /new-deck-wizard - Guided Deck Creation

Create a high-quality slide deck through an interactive interview process that enforces good presentation design from the start.

## Usage

```
/new-deck-wizard <deck-id>
/new-deck-wizard my-pitch
/new-deck-wizard my-pitch --entity=coastal
```

## Philosophy

This wizard embeds presentation best practices into the creation process:

**Image > text.** Every slide needs a visual concept. If you cannot picture it, rethink it.

**One idea per slide.** If you have two ideas, make two slides. Complexity kills communication.

**Headlines make claims, not labels.** "Revenue grew 3x" works. "Revenue" does not.

**Duration matters.** Rule of thumb: 1-2 minutes per slide. 10 slides equals a ~15 minute talk.

**Whitespace talks.** When in doubt, remove. Let breathing room do the work.

## The Process

### Phase 1: Deck Parameters

Before any slides are created, the wizard establishes the foundation:

1. **The ONE thing** - What single takeaway should the audience remember? Not three things. One.

2. **Audience** - Who exactly will see this? What do they care about? "Investors" is too vague. "Series A investors who care about TAM" is better.

3. **Action** - What should they DO after? Every deck should drive action.

4. **Delivery** - How long? Live or async? This determines everything about density and slide count.

5. **Constraints** - What cannot be said? Legal issues, sensitive topics, competing narratives to counter.

### Phase 2: Slide-by-Slide Creation

For each slide, the wizard asks:

1. **What's the SINGLE point?** - State it as a claim, not a topic.

2. **How will you SHOW this?** - Describe the visual. What would we SEE?

3. **Write the headline** - A complete sentence that makes your point.

4. **Select layout** - Title, split, metrics, quote, or grid.

## Quality Gates

The wizard prevents common mistakes:

**No empty visuals.** Vague concepts like "image" or "diagram" get rejected. You must describe what we would actually see.

**Headlines must be claims.** Labels like "Overview" or "The Problem" trigger a warning. You can proceed, but the wizard will push back.

**Duration check.** If you create 20 slides for a 10-minute talk, the wizard will flag it. 1-2 minutes per slide is the target.

## Outputs

After the interview, the wizard generates:

```
decks/<deck-id>/
  slides.md           # Outline with headlines and visual concepts
  index.html          # Skeleton with proper structure and media placeholders
  deck.json           # Structured deck metadata
  deck-config.js      # Config for the deck player
  resources/
    materials/
      image-prompts.md  # Ready-to-use prompts for image generation
```

## Difference from new-deck.sh

`new-deck.sh` creates an empty folder structure. It does not guide you.

`/new-deck-wizard` GUIDES you through creating quality content. It asks the hard questions upfront and prevents common presentation mistakes.

Use `new-deck.sh` when you want a blank canvas.
Use `/new-deck-wizard` when you want to build something good.

## Next Steps After Creation

1. Review `slides.md` for the narrative outline
2. Use `image-prompts.md` to generate visuals with Gemini
3. Preview: `scripts/serve-decks.sh` then open the deck URL
4. Review: `node scripts/deck-review.js decks/<deck-id>`

## Example Session

```
$ node scripts/deck-wizard.js cloud-pitch --entity=northwind

============================================================
DECK CREATION WIZARD
============================================================

Philosophy:
  - Image > text. One idea per slide. Headlines make claims, not labels.
  - Every slide needs a visual concept. If you cannot picture it, rethink it.
  ...

============================================================
DECK PARAMETERS
============================================================

What's the ONE thing the audience should remember?
   Not three things. Not a list. The single most important takeaway.
(required) -> We can cut your cloud costs by 40%

Who is the audience? What do they care about?
   Be specific. "Investors" is too vague.
(required) -> CFOs at mid-market SaaS companies who are under pressure to reduce burn

What action should they take after?
   Every deck should drive action. What do you want them to DO?
(required) -> Schedule a 30-minute pilot scoping call

How will this be delivered? How long?
   Live keynote vs async email changes everything.
(required) -> 15-minute live presentation followed by Q&A

============================================================
SLIDE-BY-SLIDE CREATION
============================================================

--- SLIDE 1 ---

What's the SINGLE point of this slide?
(required) -> Cloud costs are eating SaaS margins

How will you SHOW this? (describe the visual)
(required) -> image

   [QUALITY GATE] That visual concept is too vague.
   Be specific: What would we SEE? A chart? A photo? A diagram?

(required) -> Bar chart showing cloud spend as % of revenue, trending up over 3 years

Write the headline (a claim, not a label):
(required) -> Cloud costs have doubled as a share of revenue

Select layout (1-5, or Enter for "split") -> 2

Add another slide? (y/n) -> y
...
```
