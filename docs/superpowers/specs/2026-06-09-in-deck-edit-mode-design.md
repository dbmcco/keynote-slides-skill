<!-- ABOUTME: Design spec for human-editable in-deck slide polish mode. -->
<!-- ABOUTME: Defines editable elements, patch persistence, and publish locking. -->
# In-Deck Edit Mode Design

## Summary

Add a human-facing Edit mode to Keynote Slides decks so non-developers can polish approved deck content in the browser. The mode supports text edits, typography tweaks, color changes, and bounded position/size adjustments on explicitly editable elements. It preserves the current single-file HTML deck model by storing edits as structured JSON patches first, with a later path for agents or scripts to apply those patches back to `index.html`.

Published decks are locked by lifecycle state. When a deck is marked `published`, Edit mode is disabled and local edit patches are not applied automatically.

## Goals

- Let humans make final slide polish changes without editing HTML by hand.
- Keep deck HTML as the canonical source of truth.
- Reuse the existing deck toolbar pattern used by Gen, Review, Comments, and Notes.
- Reuse the existing copy editor idea of stable element identifiers and JSON exports.
- Keep the first version bounded by requiring explicit editable targets.
- Prevent draft-only browser overrides from affecting published output.

## Non-Goals

- No full slide-builder interface.
- No free dragging of every element on the slide.
- No arbitrary HTML editing.
- No layer panel, slide creation, slide deletion, or asset upload in v1.
- No direct browser write-back to disk.
- No security-grade locking for static files. The publish lock is a workflow guard.

## Deck Lifecycle

Deck metadata should include a lifecycle status:

```json
{
  "status": "draft"
}
```

Allowed values:

- `draft`: Edit mode is enabled.
- `review`: Edit mode may be enabled for owners, but the default static deck can treat it like `draft` unless a stricter policy is added later.
- `published`: Edit mode is disabled and local edit patches are not applied automatically.

The status should be represented in both deck metadata surfaces already used by the skill:

- `decks/<deck-id>/deck.json`
- `decks/<deck-id>/deck-config.js` as `window.KEYNOTE_DECK.status`

If status is missing, the deck should behave as `draft` for backward compatibility.

## User Experience

Add an `Edit` button next to the existing `Gen` and `Review` controls. Pressing `e` may also toggle Edit mode, as long as the event does not originate from an input, textarea, select, or contenteditable element.

When Edit mode is active:

- Editable elements receive a subtle outline on hover.
- Clicking an editable element selects it.
- The selected element receives a stronger outline and resize/nudge affordances where applicable.
- A compact inspector opens near the lower left or right side of the viewport.
- Text elements can be edited inline with `contenteditable` or through the inspector.
- Arrow keys nudge selected elements by 1px; Shift+Arrow nudges by 10px.
- Controls allow font size, text color, fill/background color, X/Y offset, width, and height where supported.
- The inspector includes Reset selected, Reset all, and Export patch actions.

When Edit mode is inactive, no edit affordances or contenteditable behavior should remain active.

When status is `published`:

- Hide or disable the `Edit` button.
- Ignore `?edit=1`.
- Do not apply localStorage edit patches on load.
- Show a small `Published` state in the toolbar or navigation.
- Continue to allow presentation, notes, PDF export, and review comments.

## Editable Targets

V1 should be attribute-gated. An element is editable if it matches one of these conditions:

- It has `data-editable`.
- It has `data-copy-id`.
- It has `data-copy-role`.
- It matches an approved deck role class, such as `.title`, `.subtitle`, `.section-title`, `.body-text`, `.card-title`, `.card-caption`, `.metric-number`, `.metric-label`, `.quote`, `.quote-meta`, `.chip`, `.media-placeholder`, `.metric`, `.card`, or `.media-frame`.

Template contents, hidden notes, panels, nav controls, review UI, generator UI, and anything outside an active slide should not become editable.

For generated or complex elements, decks can opt into only the safe controls:

```html
<h1 class="title" data-editable data-edit-controls="text font-size color position">Headline</h1>
<div class="media-frame" data-editable data-edit-controls="position size fill"></div>
```

If `data-edit-controls` is missing, defaults should be conservative based on element type:

- Text roles: `text font-size color position`
- Cards and metrics: `position size fill`
- Media frames: `position size`

## Stable Identifiers

Every editable element needs a stable key for patch storage. Resolution order:

1. Existing `data-edit-id`
2. Existing `data-copy-id`
3. Existing `data-comment-target`
4. Generated deterministic ID from slide title, role, and ordinal

When the runtime generates an ID, it should set `data-edit-id` on the element during the browser session. Agents can later persist those IDs into HTML when applying patches.

## Patch Data Model

Edits are stored as structured patches, keyed by element ID:

```json
{
  "deckId": "example-pitch",
  "deckStatusAtExport": "draft",
  "schemaVersion": 1,
  "exportedAt": "2026-06-09T00:00:00.000Z",
  "edits": {
    "title-slide-title-1": {
      "text": "Sharper headline",
      "style": {
        "fontSize": "56px",
        "color": "#0f172a",
        "backgroundColor": ""
      },
      "transform": {
        "x": 12,
        "y": -4
      },
      "size": {
        "width": "640px",
        "height": ""
      }
    }
  }
}
```

Patch fields are optional. Empty values mean no override for that property. This keeps text-only and style-only edits compact.

## Persistence

Draft edits persist in browser localStorage:

```text
KEYNOTE_EDIT_PATCH_<deck-id>
```

On load:

- If deck status is `draft` or `review`, apply the stored patch after brand tokens are applied.
- If deck status is `published`, do not apply the stored patch automatically.

The exported JSON patch is the handoff artifact. A future script can apply patches back to `index.html` by setting text content, adding explicit `data-edit-id` values, and writing inline style overrides or CSS custom properties.

## Interaction With Existing Modes

Edit mode should be mutually exclusive with Review mode. Entering Edit mode exits Review mode, and entering Review mode exits Edit mode.

Gen and Notes panels can remain available, but opening them should not leave any contenteditable element focused. Keyboard shortcuts should ignore events from edit inputs.

Comments should refer to the rendered element after draft edits are applied. Exported comments remain separate from edit patches.

## Error Handling

- If a patch references a missing element, skip it and record a console warning.
- If a patch contains unsupported controls for an element, ignore unsupported fields.
- If localStorage JSON is malformed, ignore it and leave the deck unmodified.
- If status is `published`, do not delete local patches; simply do not apply them.

## Testing And Review

Because this is a static template feature, validation should focus on browser behavior:

- Create or use a demo deck.
- Enter Edit mode and verify selectable elements are bounded to approved targets.
- Edit text, font size, color, position, and size where applicable.
- Reload and verify draft localStorage patches apply.
- Export JSON and inspect schema.
- Set deck status to `published` and verify Edit mode is disabled and patches do not apply.
- Verify Review mode, Comments sidebar, Notes, Gen panel, keyboard navigation, and PDF print styles still work.

## Future Work

- Add a script to apply exported edit patches back into `index.html`.
- Add versioning for published decks, such as `publishedVersion` or `revisionOf`.
- Add owner-only edit unlock policy if hosted behind an authenticated wrapper.
- Add visual diff/export summary for edit patches.
- Add optional snap-to-grid and alignment guides.
