<!-- ABOUTME: Model-mediated decision map and workflow spec for the keynote slides skill. -->
<!-- ABOUTME: Aligns narrative build, review, and visual generation with model-owned judgment. -->
# Model-Mediated Architecture (Keynote Slides Skill)

## Scope

This document applies the model-mediated reference architecture to the keynote slides
skill. It covers narrative build, deck review, and visual generation.

## Decision Ownership Map

| Decision | Owner | Inputs | Output | Evidence/Artifacts |
| --- | --- | --- | --- | --- |
| Focal statement and primary intent | Model | Ingested materials, user goal | Focal statement | `narrative-context.json`, work run log |
| Framework selection (arc/framework) | Model | Discovery answers, content summary | Selected framework + rationale | `narrative-context.json` |
| Density/length tradeoffs | Model (user can override) | Audience, purpose, time | Density mode + slide count guidance | `narrative-context.json` |
| Slide ordering and narrative arc | Model | Framework + content mapping | Ordered outline | `slides.md` |
| Visual plan (what to generate) | Model | Design notes, assets, brand tokens | Generation queue | `resources/materials/generation-queue.json` |
| Review severity/priority | Model | Analyzer signals + deck context | Prioritized findings | `resources/materials/review-synthesis.md` |
| Analyzer selection | Model | Deck type, audience, time | Tool calls | work run log |

## Pipes vs Decisions

**Pipes (code-owned):**
- Resource ingestion and file reading
- Extracting plain text from slides
- Running analyzers (visual density, readability, etc.)
- Persisting artifacts and prompts
- Calling image/video APIs

**Decisions (model-owned):**
- Interpreting signals into priorities
- Selecting frameworks and arc variants
- Choosing which analyzers to run
- Determining what to generate visually
- Evaluating what is "blocking" vs "nice to have"

## Workflow (Model-Mediated)

1. **Ingest resources (pipe).**
   - `scripts/ingest-resources.js` reads materials/assets and emits JSON for the model.
2. **Discovery and focal intent (model).**
   - Model asks questions, selects focal statement.
3. **Framework recommendation (model).**
   - Model maps content to 2-3 frameworks; user confirms.
4. **Build outline + design notes (model).**
   - Model outputs `slides.md` and `narrative-context.json`.
5. **Analyzer signals (pipe).**
   - Code runs analyzers and stores raw metrics, not decisions.
6. **Review synthesis (model).**
   - Model decides priorities and writes `review-synthesis.md`.
7. **Visual generation queue (model + pipe).**
   - Model selects what to generate; code executes API calls.

## Artifacts (Execution Surface)

- `resources/materials/ingestion.json` (resource summary)
- `resources/materials/narrative-build-prompts.json`
- `resources/materials/generation-queue.json`
- `resources/materials/review-context.json`
- `resources/materials/review-prompts.json`
- `resources/materials/analysis-summary.json` (signals only)
- `resources/materials/review-synthesis.md`
- `resources/materials/work-runs/*.json`

## Memory Mapping

- **Deep memory:** brand defaults in `decks/brands.js`.
- **Mid-term:** `deck.json`, `narrative-context.json`.
- **Now-memory:** `review-context.json`, prompt artifacts.

## Deviations

Any remaining heuristics or thresholds must be logged in
`docs/model-mediated-deviation-register.md` until removed.

## Conformance Checks

Run:

```bash
node scripts/model-mediated-conformance.js decks/<deck-id>
```

Add `--review` after running `scripts/deck-review.js` to validate review artifacts.

## References

- `docs/model-mediated-review.md`
- `docs/integrated-architecture.md`
- `/Users/braydon/projects/experiments/docs/model-mediated/MODEL_MEDIATED_REFERENCE_ARCHITECTURE.md`
- `/Users/braydon/projects/experiments/docs/model-mediated/MODEL_MEDIATED_COOKBOOK.md`
