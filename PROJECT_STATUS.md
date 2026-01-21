<!-- ABOUTME: Project status and handoff log for the keynote-slides-skill repo. -->
<!-- ABOUTME: Update this file with completed work, tests, blockers, and next steps. -->
# PROJECT_STATUS

## Completed

- Added model-mediated architecture docs, narrative build runner, review signal refactor, and conformance scaffolding.
- Documented model-mediated workflow in README.
- Synced Narrative Engine persuasion reference, added selection guide + checklists, and refreshed narrative-deck guidance.
- Updated README to call out Narrative Engine references and link to Noah's repo.
- Initialized repository and skill structure.
- Added the single-file slide deck template with navigation, templates, and Gemini media hooks.
- Added multi-entity brand system with example profiles (Northwind Labs, Apex Consulting, Coastal Biotech).
- Added print styles for PDF export.
- Added deck storage scaffolding, shared brand store, and local preview script.
- Added resource separation (assets vs materials) plus deck preference scaffolding.
- Wrote the skill guide plus brand and Gemini media references.
- Added Python media generation library (nano-banana for images, Veo for videos).
- Added comprehensive best practices documentation for infographics and video generation.
- Added Claude Code CLI visual evaluation workflow guidance.

## Tests

- `node --test test/narrative-build.test.js test/review-all-summary.test.js test/model-mediated-conformance.test.js`

## Blockers

- None noted.

## Deliverables

- `docs/model-mediated-architecture.md` model-mediated decision map and workflow spec.
- `docs/model-mediated-deviation-register.md` deviation register for remaining heuristics.
- `skills/keynote-slides/assets/keynote-slides.html` slide deck template.
- `skills/keynote-slides/SKILL.md` skill instructions.
- `skills/keynote-slides/references/narrative-engine/checklists.md` Narrative Engine review checklists.
- `skills/keynote-slides/references/narrative-engine/framework_selection_guide.md` Narrative Engine framework selection guide.
- `skills/keynote-slides/references/brand-guidelines.md` brand token sheet.
- `skills/keynote-slides/references/gemini-media.md` Gemini media reference.
- `skills/keynote-slides/scripts/new-deck.sh` deck bootstrap script.
- `skills/keynote-slides/scripts/serve-decks.sh` local preview script.
- `decks/brands.js` shared brand profiles.
- `decks/example-pitch/` example deck with synthetic content.
- `lib/media/` Python media generation library.
- `docs/nano-banana-prompting.md` infographic generation guide.
- `docs/veo-video-guide.md` video generation guide.
- `scripts/narrative-build.js` model-mediated narrative build prep runner.
- `scripts/model-mediated-conformance.js` conformance checker for build/review artifacts.

## Next steps

- Add your own brand profiles to `decks/brands.js`.
- Create decks for your specific use cases.
- Consider packaging this skill into a .skill artifact.
