# Model-Mediated Deck Review Architecture

## Overview

The deck review system uses **model-mediated** design where:
- Models own judgment and interpretation
- Code provides tools and executes decisions
- Multiple specialized agents challenge each other (antagonistic prompting)
- Human interview establishes context before review

## Agent Mesh

```
┌─────────────────────────────────────────────────────────────────┐
│                        ORCHESTRATOR                              │
│         (coordinates review, synthesizes, resolves conflicts)    │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   INTERVIEW   │    │    REVIEW     │    │   SYNTHESIS   │
│    AGENT      │    │    AGENTS     │    │    AGENT      │
│               │    │  (antagonistic│    │               │
│ Gathers deck  │    │    pairs)     │    │ Resolves      │
│ context from  │    │               │    │ conflicts,    │
│ human         │    │ • Narrative   │    │ prioritizes   │
│               │    │ • Clarity     │    │ findings      │
│               │    │ • Brand       │    │               │
│               │    │ • Audience    │    │               │
│               │    │ • Accessibility│   │               │
└───────────────┘    └───────────────┘    └───────────────┘
```

## Phase 1: Interview (Context Gathering)

Before any review, the Interview Agent gathers:

### Required Context
- **Audience**: Who will see this? (executives, technical team, investors, customers)
- **Goal**: What should they do/feel/know after? (decide, approve, understand, buy)
- **Context**: How delivered? (keynote, meeting, async reading, pitch)
- **Time**: How long is the presentation? (5 min, 15 min, 30 min, async)
- **Stakes**: What's at risk? (informational, important decision, critical deal)

### Optional Deep Context
- **Objections**: What pushback do you expect?
- **Competition**: What alternatives is the audience considering?
- **History**: What do they already know about this topic?
- **Constraints**: What CAN'T you say? (legal, confidential, premature)

## Phase 2: Antagonistic Review

Each review domain has **two agents with opposing perspectives**:

### Narrative Review
| Agent | Perspective | Questions |
|-------|-------------|-----------|
| **Narrative Critic** | What's broken? | "Where does the logic fail? What's missing? Where do I get lost?" |
| **Narrative Defender** | What works? | "Why might this structure be intentional? What's the throughline?" |

### Clarity Review
| Agent | Perspective | Questions |
|-------|-------------|-----------|
| **Clarity Skeptic** | What's confusing? | "What jargon exists? What assumes too much knowledge?" |
| **Simplicity Advocate** | What's unnecessary? | "What can be cut? What's redundant? What's over-explained?" |

### Brand Review
| Agent | Perspective | Questions |
|-------|-------------|-----------|
| **Brand Guardian** | What violates guidelines? | "What's off-brand in tone, color, voice, or style?" |
| **Creative Challenger** | What's too safe? | "What's boring? What's missing personality? Where's the distinctive voice?" |

### Audience Review
| Agent | Perspective | Questions |
|-------|-------------|-----------|
| **Audience Advocate** | Speaking AS the audience | "As a [persona], what doesn't resonate? What do I not care about?" |
| **Expert Perspective** | What's patronizing? | "What does [audience] already know that we're over-explaining?" |

### Accessibility Review
| Agent | Perspective | Questions |
|-------|-------------|-----------|
| **Accessibility Auditor** | What barriers exist? | "Color contrast? Font sizes? Alt text? Cognitive load?" |

## Phase 3: Synthesis

The Synthesis Agent:
1. Receives all findings from antagonistic pairs
2. Identifies **conflicts** (where agents disagree)
3. Weighs findings against **interview context** (audience, goal, stakes)
4. Prioritizes by **impact** (blocking, important, nice-to-have)
5. Generates **actionable recommendations**

## Tools (Code Layer)

Agents have access to these tools (code executes, model decides when to call):

```typescript
interface DeckReviewTools {
  // Deck inspection
  get_slide(index: number): SlideContent;
  get_deck_overview(): { title: string; type: string }[];
  get_slide_text(index: number): string;
  get_slide_visual_description(index: number): string; // From Playwright screenshot

  // Context
  get_interview_context(): InterviewContext;
  get_brand_profile(entity: string): BrandProfile;

  // Reporting
  report_finding(finding: Finding): void;
  report_conflict(agentA: string, agentB: string, topic: string, resolution: string): void;

  // Collaboration
  request_human_clarification(question: string): string;
  challenge_finding(findingId: string, counterargument: string): void;
}

interface Finding {
  agent: string;
  type: 'narrative' | 'clarity' | 'brand' | 'audience' | 'accessibility';
  severity: 'blocking' | 'important' | 'suggestion';
  slide?: number;
  description: string;
  suggestion: string;
  evidence: string;
}
```

Automated analyzer outputs are treated as **signals** only; severity and priority
are model decisions during synthesis.

## Adversarial Prompting Patterns

### Challenge Assumptions
```
Before accepting this finding, consider:
- What if this was intentional?
- What context might justify this choice?
- Who would disagree and why?
```

### Steel-man Opposition
```
Argue the STRONGEST case for the opposing view.
Don't strawman. Find the best reason this might be correct.
```

### Audience Embodiment
```
You ARE a [senior executive with 5 minutes].
React authentically. What do you skip? What makes you tune out?
Don't analyze—experience.
```

### Red Team
```
Your job is to find problems others missed.
Assume the other reviewers were too generous.
What would a hostile critic say?
```

## Example Flow

```
1. Human: "Review my pitch deck"

2. Interview Agent:
   → "Who is the audience for this presentation?"
   ← "Series A investors, mostly technical backgrounds"
   → "What's the primary goal?"
   ← "Get a second meeting, not close the deal"
   → "How long is the presentation?"
   ← "12 minutes plus Q&A"
   → "What objections do you expect?"
   ← "Team is too small, market is crowded"

3. Orchestrator spawns antagonistic review agents with context

4. Narrative Critic: "Slide 4 jumps from problem to team—where's the solution?"
   Narrative Defender: "The solution IS the team for deep-tech investors"
   → Conflict logged, Synthesis will resolve

5. Audience Advocate (as investor): "I don't care about your tech stack on slide 7"
   Expert Perspective: "But technical investors DO care—it's credibility"
   → Conflict logged

6. Synthesis Agent:
   - Reviews all findings
   - Notes: "Audience is technical, so slide 7 stays but move earlier"
   - Notes: "Add explicit solution slide between 4-5, Defender's point noted"
   - Prioritizes by impact on "get second meeting" goal

7. Final report with prioritized, context-aware recommendations
```

## Non-Goals

- **Not auto-fixing**: Agents recommend, human decides
- **Not replacing creativity**: Agents critique, not create
- **Not binary pass/fail**: Nuanced findings with context

## Implementation Notes

- Use Claude with tool_use for each agent
- Spawn agents as sub-processes (Task tool with specialized prompts)
- Store interview context in deck's `resources/materials/review-context.json`
- Playwright provides visual context (screenshots → descriptions)
- All findings logged to `resources/materials/review-findings.json`
