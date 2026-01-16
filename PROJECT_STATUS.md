<!-- ABOUTME: Project status and handoff log for the keynote-slides-skill repo. -->
<!-- ABOUTME: Update this file with completed work, tests, blockers, and next steps. -->
# PROJECT_STATUS

## Completed

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

- Not run (no automated test suite set up).

## Blockers

- None noted.

## Deliverables

- `skills/keynote-slides/assets/keynote-slides.html` slide deck template.
- `skills/keynote-slides/SKILL.md` skill instructions.
- `skills/keynote-slides/references/brand-guidelines.md` brand token sheet.
- `skills/keynote-slides/references/gemini-media.md` Gemini media reference.
- `skills/keynote-slides/scripts/new-deck.sh` deck bootstrap script.
- `skills/keynote-slides/scripts/serve-decks.sh` local preview script.
- `decks/brands.js` shared brand profiles.
- `decks/example-pitch/` example deck with synthetic content.
- `lib/media/` Python media generation library.
- `docs/nano-banana-prompting.md` infographic generation guide.
- `docs/veo-video-guide.md` video generation guide.

## Next steps

- Add your own brand profiles to `decks/brands.js`.
- Create decks for your specific use cases.
- Consider packaging this skill into a .skill artifact.
