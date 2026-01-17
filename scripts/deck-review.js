#!/usr/bin/env node
/**
 * Model-Mediated Deck Review
 *
 * Orchestrates a multi-agent review process:
 * 1. Interview agent gathers context from human
 * 2. Antagonistic review agents analyze the deck
 * 3. Synthesis agent resolves conflicts and prioritizes
 *
 * Usage:
 *   node scripts/deck-review.js decks/my-deck
 *   node scripts/deck-review.js decks/my-deck --skip-interview (use existing context)
 *
 * This script prepares context and prompts for Claude Code to execute.
 * The actual model calls happen through Claude Code's agent system.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ============================================================================
// INTERVIEW QUESTIONS
// ============================================================================

const INTERVIEW_QUESTIONS = {
  required: [
    {
      id: 'audience',
      question: 'Who is the audience for this presentation?',
      examples: 'executives, technical team, investors, customers, board members',
      followUp: 'What do they care most about?',
    },
    {
      id: 'goal',
      question: 'What should the audience DO after seeing this?',
      examples: 'approve budget, sign contract, understand strategy, get excited',
    },
    {
      id: 'context',
      question: 'How will this be delivered?',
      examples: 'live keynote, meeting presentation, async/email, pitch competition',
    },
    {
      id: 'duration',
      question: 'How long is the presentation?',
      examples: '5 minutes, 15 minutes, 30 minutes, self-paced reading',
    },
    {
      id: 'stakes',
      question: 'What are the stakes?',
      examples: 'informational update, important decision, critical deal, career-defining',
    },
  ],
  optional: [
    {
      id: 'objections',
      question: 'What pushback or objections do you expect?',
      skip: 'Press Enter to skip',
    },
    {
      id: 'competition',
      question: 'What alternatives is the audience considering?',
      skip: 'Press Enter to skip',
    },
    {
      id: 'priorKnowledge',
      question: 'What does the audience already know about this topic?',
      skip: 'Press Enter to skip',
    },
    {
      id: 'constraints',
      question: "What CAN'T you say? (legal, confidential, premature)",
      skip: 'Press Enter to skip',
    },
  ],
};

// ============================================================================
// AGENT PROMPTS (Model-Mediated: logic in prompts, not code)
// ============================================================================

const AGENT_PROMPTS = {
  narrativeCritic: `You are the NARRATIVE CRITIC. Your job is to find structural problems.

CONTEXT:
{interviewContext}

DECK OVERVIEW:
{deckOverview}

Your perspective: What's BROKEN in the narrative?
- Where does the logic fail or skip steps?
- What's missing that the audience needs?
- Where would someone get lost or confused?
- Does the arc match the goal: {goal}?

Be specific. Cite slide numbers. Explain WHY it's a problem for THIS audience.

ADVERSARIAL CHECK: Before finalizing, ask yourself:
- Am I being too harsh on intentional choices?
- What would the Narrative Defender say?

Report findings as JSON array.`,

  narrativeDefender: `You are the NARRATIVE DEFENDER. Your job is to find what WORKS.

CONTEXT:
{interviewContext}

DECK OVERVIEW:
{deckOverview}

CRITIC'S FINDINGS:
{criticFindings}

Your perspective: Challenge the critic's findings.
- What might be INTENTIONAL that the critic called a problem?
- What's the throughline the critic missed?
- What works well for THIS specific audience?

Steel-man the deck's choices. Find the best interpretation.

Then: Which critic findings do you AGREE with despite your defense?

Report as JSON with: {defended: [...], conceded: [...]}`,

  claritySceptic: `You are the CLARITY SKEPTIC. Your job is to find confusion.

CONTEXT:
{interviewContext}

DECK CONTENT:
{deckContent}

Your perspective: What's CONFUSING?
- What jargon would {audience} not understand?
- What assumes knowledge they might not have?
- What's ambiguous or could be misread?
- What would make someone say "wait, what?"

Consider: {audience} with {priorKnowledge}

Report findings as JSON array.`,

  simplicityAdvocate: `You are the SIMPLICITY ADVOCATE. Your job is to find bloat.

CONTEXT:
{interviewContext}

DECK CONTENT:
{deckContent}

Your perspective: What's UNNECESSARY?
- What can be cut without losing the message?
- What's redundant across slides?
- What's over-explained for {audience}?
- What would a ruthless editor remove?

Given only {duration}, what MUST stay vs what's nice-to-have?

Report findings as JSON array.`,

  brandGuardian: `You are the BRAND GUARDIAN. Your job is to protect brand consistency.

BRAND PROFILE:
{brandProfile}

DECK CONTENT:
{deckContent}

Your perspective: What VIOLATES brand guidelines?
- Wrong colors, fonts, or visual style?
- Tone of voice inconsistencies?
- Messaging that contradicts brand positioning?

Be specific. Cite exact violations.

Report findings as JSON array.`,

  creativeChallenger: `You are the CREATIVE CHALLENGER. Your job is to push past safe.

BRAND PROFILE:
{brandProfile}

DECK CONTENT:
{deckContent}

GUARDIAN'S FINDINGS:
{guardianFindings}

Your perspective: What's TOO SAFE?
- Where is the deck boring or forgettable?
- What's missing personality or distinctive voice?
- Where could it take more creative risk?

Challenge the Guardian: Are they being too restrictive?

Report as JSON with: {tooSafe: [...], guardianOverreach: [...]}`,

  audienceAdvocate: `You ARE the audience. Embody them completely.

YOU ARE: {audiencePersona}

You care about: {audienceCares}
You're skeptical of: {audienceSkeptical}
You have {duration} and {stakes} stakes.

DECK CONTENT:
{deckContent}

React authentically as this person:
- What makes you tune out?
- What do you not care about?
- What's missing that you need?
- What would make you say yes to {goal}?

Don't analyze—EXPERIENCE. Report your genuine reactions.`,

  expertPerspective: `You represent what the audience ALREADY KNOWS.

AUDIENCE: {audience}
THEIR BACKGROUND: {priorKnowledge}

DECK CONTENT:
{deckContent}

Your perspective: What's PATRONIZING?
- What does {audience} already know that's over-explained?
- What basics are wasting their time?
- Where does the deck underestimate their sophistication?

Also: What does {audience} NOT know that's assumed?

Report findings as JSON array.`,

  accessibilityAuditor: `You are the ACCESSIBILITY AUDITOR.

DECK VISUAL DESCRIPTIONS:
{visualDescriptions}

DECK CONTENT:
{deckContent}

Check for barriers:
- Color contrast issues?
- Font sizes too small?
- Missing alt text for images?
- Cognitive overload (too much per slide)?
- Animations that could cause issues?
- Content that requires audio/video without alternatives?

Report findings as JSON array with severity levels.`,

  synthesizer: `You are the SYNTHESIS AGENT. Resolve conflicts and prioritize.

INTERVIEW CONTEXT:
{interviewContext}

ALL FINDINGS:
{allFindings}

CONFLICTS:
{conflicts}

Your job:
1. Review all findings from antagonistic agents
2. Resolve conflicts using interview context as tiebreaker
3. Prioritize by impact on the STATED GOAL: {goal}
4. Consider the STAKES: {stakes}
5. Consider the DURATION: {duration}

Output a prioritized action list:
- BLOCKING: Must fix before presenting
- IMPORTANT: Should fix, significant impact
- SUGGESTION: Nice to have, lower priority

For each item: specific slide, what to change, why it matters for {audience}.`,
};

// ============================================================================
// DECK EXTRACTION (Code layer: factual data gathering)
// ============================================================================

function extractDeckData(deckPath) {
  const htmlPath = path.join(deckPath, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    throw new Error(`Deck not found: ${htmlPath}`);
  }

  const html = fs.readFileSync(htmlPath, 'utf-8');
  const slides = [];

  const slideRegex = /<section[^>]*class="slide[^"]*"[^>]*data-title="([^"]*)"[^>]*>([\s\S]*?)<\/section>/g;
  let match;
  while ((match = slideRegex.exec(html)) !== null) {
    const title = match[1];
    const content = match[2]
      .replace(/<script[^>]*>[\s\S]*?<\/script>/g, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    slides.push({ title, content });
  }

  return {
    path: deckPath,
    slideCount: slides.length,
    overview: slides.map((s, i) => `${i + 1}. ${s.title}`).join('\n'),
    slides,
    fullContent: slides.map((s, i) => `--- SLIDE ${i + 1}: ${s.title} ---\n${s.content}`).join('\n\n'),
  };
}

function loadBrandProfile(deckPath) {
  const brandsPath = path.join(path.dirname(deckPath), 'brands.js');
  if (fs.existsSync(brandsPath)) {
    const content = fs.readFileSync(brandsPath, 'utf-8');
    return content;
  }
  return 'No brand profile found.';
}

// ============================================================================
// INTERVIEW (Human interaction layer)
// ============================================================================

async function conductInterview(deckPath) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

  console.log('\n📋 DECK REVIEW: Interview Phase\n');
  console.log('I need to understand your deck before reviewing it.\n');

  const context = { deckPath, timestamp: new Date().toISOString() };

  // Required questions
  for (const q of INTERVIEW_QUESTIONS.required) {
    console.log(`\n${q.question}`);
    if (q.examples) console.log(`   (e.g., ${q.examples})`);
    const answer = await ask('→ ');
    context[q.id] = answer;

    if (q.followUp && answer) {
      console.log(`   ${q.followUp}`);
      const followUp = await ask('→ ');
      context[`${q.id}FollowUp`] = followUp;
    }
  }

  // Optional questions
  console.log('\n--- Optional (helps with deeper review) ---');
  for (const q of INTERVIEW_QUESTIONS.optional) {
    console.log(`\n${q.question}`);
    if (q.skip) console.log(`   (${q.skip})`);
    const answer = await ask('→ ');
    if (answer.trim()) {
      context[q.id] = answer;
    }
  }

  rl.close();

  // Save context
  const contextPath = path.join(deckPath, 'resources', 'materials', 'review-context.json');
  fs.mkdirSync(path.dirname(contextPath), { recursive: true });
  fs.writeFileSync(contextPath, JSON.stringify(context, null, 2));

  console.log(`\n✅ Interview complete. Context saved to ${contextPath}\n`);
  return context;
}

function loadExistingContext(deckPath) {
  const contextPath = path.join(deckPath, 'resources', 'materials', 'review-context.json');
  if (fs.existsSync(contextPath)) {
    return JSON.parse(fs.readFileSync(contextPath, 'utf-8'));
  }
  return null;
}

// ============================================================================
// PROMPT GENERATION (Prepare for model-mediated review)
// ============================================================================

function generateReviewPrompts(deckData, context, brandProfile) {
  const prompts = {};

  const replacePlaceholders = (template) => {
    return template
      .replace(/{interviewContext}/g, JSON.stringify(context, null, 2))
      .replace(/{deckOverview}/g, deckData.overview)
      .replace(/{deckContent}/g, deckData.fullContent)
      .replace(/{brandProfile}/g, brandProfile)
      .replace(/{audience}/g, context.audience || 'unknown audience')
      .replace(/{goal}/g, context.goal || 'unknown goal')
      .replace(/{duration}/g, context.duration || 'unknown duration')
      .replace(/{stakes}/g, context.stakes || 'unknown stakes')
      .replace(/{priorKnowledge}/g, context.priorKnowledge || 'unknown')
      .replace(/{audiencePersona}/g, context.audience || 'general audience')
      .replace(/{audienceCares}/g, context.audienceFollowUp || 'their goals')
      .replace(/{audienceSkeptical}/g, context.objections || 'nothing specific');
  };

  for (const [name, template] of Object.entries(AGENT_PROMPTS)) {
    prompts[name] = replacePlaceholders(template);
  }

  return prompts;
}

// ============================================================================
// ANALYSIS INTEGRATION
// ============================================================================

function runFullAnalysis(deckPath) {
  const { spawnSync } = require('child_process');
  const reviewAllPath = path.join(__dirname, 'review-all.js');

  console.log('📊 Running comprehensive analysis...');

  const result = spawnSync('node', [reviewAllPath, deckPath], {
    encoding: 'utf-8',
    timeout: 120000,
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  if (result.error) {
    console.warn(`   Warning: Analysis failed: ${result.error.message}`);
    return null;
  }

  // Load the generated analysis
  const analysisPath = path.join(deckPath, 'resources', 'materials', 'full-analysis.json');
  if (fs.existsSync(analysisPath)) {
    return JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
  }
  return null;
}

function formatAnalysisForAgents(analysis) {
  if (!analysis) return {};

  const summary = analysis.summary || {};

  return {
    // North star scores
    northStarScores: summary.northStarScores || {},
    overallGrade: summary.overall?.grade || 'N/A',
    overallScore: summary.overall?.score || 0,

    // Critical issues for agents to address
    criticalIssues: summary.overall?.criticalIssues || [],
    importantIssues: summary.overall?.importantIssues || [],

    // Visual density data
    visualDensity: summary.byCategory?.visualDensity || {},
    slidesWithoutVisuals: analysis.rawResults?.['visual-density']?.flagSummary?.flagsByType?.no_visuals_on_content_slide || [],

    // Emotional arc data
    emotionalArc: summary.byCategory?.emotionalArc || {},
    hookGrade: analysis.rawResults?.['emotional-arc']?.hookAnalysis?.overallGrade || 'unknown',
    arcShape: analysis.rawResults?.['emotional-arc']?.emotionalArc?.arcShape?.shape || 'unknown',
    flowGaps: analysis.rawResults?.['emotional-arc']?.flowChain?.gaps || [],

    // Readability data
    readability: summary.byCategory?.readability || {},
    complexSentences: analysis.rawResults?.readability?.complexSentences || [],
    jargonFound: analysis.rawResults?.readability?.slides?.flatMap((s) => s.jargon) || [],

    // Design quality (if available)
    designQuality: summary.byCategory?.designQuality || {},

    // Per-slide breakdowns
    perSlideVisualDensity: analysis.rawResults?.['visual-density']?.slides || [],
    perSlideEmotional: analysis.rawResults?.['emotional-arc']?.emotionalArc?.perSlide || [],
  };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const deckPath = args.find((a) => !a.startsWith('--')) || 'decks/skill-demo';
  const skipInterview = args.includes('--skip-interview');
  const skipAnalysis = args.includes('--skip-analysis');

  console.log('🎯 Model-Mediated Deck Review');
  console.log('='.repeat(50));

  // Load or conduct interview
  let context = loadExistingContext(deckPath);
  if (!context && skipInterview) {
    console.error('No existing context found. Run without --skip-interview first.');
    process.exit(1);
  }
  if (!context || !skipInterview) {
    context = await conductInterview(deckPath);
  } else {
    console.log(`\n📋 Using existing context from ${deckPath}/resources/materials/review-context.json\n`);
  }

  // Run comprehensive analysis
  let analysisData = null;
  if (!skipAnalysis) {
    analysisData = runFullAnalysis(deckPath);
    if (analysisData) {
      console.log('   Analysis complete.\n');
    }
  }

  // Format analysis for agents
  const formattedAnalysis = formatAnalysisForAgents(analysisData);

  // Extract deck data
  console.log('📊 Extracting deck data...');
  const deckData = extractDeckData(deckPath);
  const brandProfile = loadBrandProfile(deckPath);

  console.log(`   Found ${deckData.slideCount} slides\n`);

  // Generate prompts with analysis data
  console.log('🤖 Generating agent prompts...\n');
  const prompts = generateReviewPrompts(deckData, context, brandProfile);

  // Add analysis context to prompts
  for (const name of Object.keys(prompts)) {
    prompts[name] = prompts[name]
      .replace(/{analysisData}/g, JSON.stringify(formattedAnalysis, null, 2))
      .replace(/{visualDensityData}/g, JSON.stringify(formattedAnalysis.perSlideVisualDensity, null, 2))
      .replace(/{emotionalArcData}/g, JSON.stringify(formattedAnalysis.perSlideEmotional, null, 2))
      .replace(/{northStarScores}/g, JSON.stringify(formattedAnalysis.northStarScores, null, 2))
      .replace(/{criticalIssues}/g, JSON.stringify(formattedAnalysis.criticalIssues, null, 2))
      .replace(/{flowGaps}/g, JSON.stringify(formattedAnalysis.flowGaps, null, 2));
  }

  // Save prompts for Claude Code to execute
  const promptsPath = path.join(deckPath, 'resources', 'materials', 'review-prompts.json');
  fs.writeFileSync(promptsPath, JSON.stringify(prompts, null, 2));

  // Save formatted analysis separately for reference
  const formattedPath = path.join(deckPath, 'resources', 'materials', 'analysis-summary.json');
  fs.writeFileSync(formattedPath, JSON.stringify(formattedAnalysis, null, 2));

  console.log('='.repeat(50));
  console.log('✅ Review preparation complete!\n');

  // Show quick summary from analysis
  if (formattedAnalysis.overallGrade !== 'N/A') {
    console.log('--- AUTOMATED ANALYSIS SUMMARY ---');
    console.log(`   Overall Grade: ${formattedAnalysis.overallGrade} (${formattedAnalysis.overallScore}%)`);
    console.log(`   Storytelling:  ${formattedAnalysis.northStarScores.storytelling || 'N/A'}%`);
    console.log(`   Clarity:       ${formattedAnalysis.northStarScores.clarity || 'N/A'}%`);
    console.log(`   Visual Balance:${formattedAnalysis.northStarScores.visualBalance || 'N/A'}%`);
    console.log(`   Design:        ${formattedAnalysis.northStarScores.design || 'N/A'}%`);
    if (formattedAnalysis.criticalIssues.length > 0) {
      console.log(`\n   Critical Issues: ${formattedAnalysis.criticalIssues.length}`);
      formattedAnalysis.criticalIssues.forEach((i) => console.log(`     - ${i.message}`));
    }
    console.log('');
  }

  console.log('To execute the model-mediated review, use Claude Code:\n');
  console.log('   "Run the deck review agents for decks/skill-demo"');
  console.log('   "Execute antagonistic review with the generated prompts"\n');
  console.log(`Prompts saved to: ${promptsPath}`);
  console.log(`Context saved to: ${deckPath}/resources/materials/review-context.json`);
  console.log(`Analysis saved to: ${formattedPath}\n`);

  // Output summary for Claude Code to use
  console.log('--- AGENT EXECUTION ORDER ---');
  console.log('1. narrativeCritic → narrativeDefender (use critic findings)');
  console.log('2. claritySceptic + simplicityAdvocate (parallel)');
  console.log('3. brandGuardian → creativeChallenger (use guardian findings)');
  console.log('4. audienceAdvocate + expertPerspective (parallel)');
  console.log('5. accessibilityAuditor');
  console.log('6. synthesizer (with all findings + conflicts)');
}

main().catch(console.error);
