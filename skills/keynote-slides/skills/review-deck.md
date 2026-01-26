---
name: review-deck
description: Run comprehensive antagonistic review of slide decks using specialized sub-agents. Spawns narrative, clarity, brand, audience, and accessibility reviewers that challenge each other. Use when reviewing a completed deck before presenting.
---

# /review-deck - Model-Mediated Deck Review

Run a comprehensive, antagonistic review of a slide deck using specialized sub-agents.

## Usage

```
/review-deck [deck-path]
/review-deck decks/my-deck
/review-deck decks/skill-demo --quick  (skip optional interview questions)
/review-deck decks/my-deck --stress-test  (include stress test phase)
```

## What This Does

1. **Interview Phase**: Gathers context from you about:
   - Audience (who will see this?)
   - Goal (what should they do after?)
   - Context (how delivered?)
   - Duration (how long?)
   - Stakes (how important?)

2. **Antagonistic Review Phase**: Spawns specialized agents that challenge each other:
   - Narrative Critic vs Defender
   - Clarity Skeptic vs Simplicity Advocate
   - Brand Guardian vs Creative Challenger
   - Audience Advocate vs Expert Perspective
   - Accessibility Auditor

3. **Synthesis Phase**: Resolves conflicts and prioritizes findings based on YOUR stated goals.

4. **Stress Test Phase** (optional): Pressure-tests the deck with stakeholder personas:
   - Auto-selects personas based on content type
   - Engineer, Skeptic, Risk Officer, CFO, Lawyer, Conservative, COO
   - Director triages into Must Fix / Should Fix / Could Fix

## Execution

When invoked, this skill will:

1. Run the interview (or load existing context with --skip-interview)
2. Spawn sub-agents in parallel where possible
3. Feed findings between antagonistic pairs
4. Synthesize into prioritized recommendations

## Example Output

```
🎯 DECK REVIEW FINDINGS

BLOCKING (fix before presenting):
1. [Slide 4] Missing transition from problem to solution
   - Audience (investors) will wonder "so what's the answer?"
   - Add explicit solution slide before team slide

IMPORTANT (should fix):
2. [Slide 7] Technical jargon for non-technical audience
   - "Kubernetes orchestration" → "automatic scaling"
   - Expert Perspective: investors know "cloud" not "k8s"

3. [Slides 3,8] Redundant problem statements
   - Simplicity Advocate: combine or cut
   - Saves 2 minutes, tightens narrative

SUGGESTIONS (nice to have):
4. [Slide 1] Hook could be stronger
   - Current: company overview
   - Consider: surprising market stat or provocative question

---

🔬 STRESS TEST FINDINGS (--stress-test)

MUST FIX:
1. [CFO] Slide 9 ROI claim has no supporting data
   - "10x return" needs methodology or case study

SHOULD FIX:
2. [Skeptic] Slide 5 competitive comparison feels cherry-picked
   - Add dates, sources, or acknowledge limitations
3. [Risk Officer] No mention of implementation timeline risks

COULD FIX:
4. [Engineer] Slide 8 architecture diagram oversimplifies
   - Acceptable for exec audience, but add appendix for technical follow-up
```

## Model-Mediated Design

This review follows model-mediated principles:
- **Model decides**: All judgment is in agent prompts, not code
- **Code executes**: Scripts gather data and run tools
- **Antagonistic**: Agents challenge each other's conclusions
- **Context-aware**: Findings weighted by YOUR stated goals

See `docs/model-mediated-review.md` for architecture details.
