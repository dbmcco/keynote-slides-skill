<!-- ABOUTME: Deviation register for model-mediated architecture in keynote slides skill. -->
<!-- ABOUTME: Tracks temporary heuristic logic pending model ownership. -->
# Model-Mediated Deviation Register

Log deviations from the pure model-mediated profile. Each entry requires an owner
and a migration plan.

| id | assumption | rationale | scope | owner | start | sunset | migration_plan | status | links |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| mm-001 | Heuristic narrative classification | Regex slide typing provides fast signals until model classifier exists. | `scripts/narrative-review.js` | deck team | 2026-01-19 | 2026-03-01 | Replace with model-run narrative classification tool. | open | `scripts/narrative-review.js` |
| mm-002 | Heuristic jargon detection | Keyword list flags potential jargon for review signals. | `scripts/readability.js` | deck team | 2026-01-19 | 2026-03-01 | Move jargon detection to model review prompts. | open | `scripts/readability.js` |
| mm-003 | Heuristic visual density flags | Word/visual thresholds emit signals for review. | `scripts/visual-density.js` | deck team | 2026-01-19 | 2026-03-01 | Model to decide visual density thresholds by audience. | open | `scripts/visual-density.js` |
