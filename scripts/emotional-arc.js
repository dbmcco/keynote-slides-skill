#!/usr/bin/env node
/**
 * Emotional Arc Analysis Script
 *
 * Measures QUALITY of narrative elements, not just presence:
 * - Hook quality grading (provocative / interesting / informational / weak)
 * - Emotional tension/resolution tracking per slide
 * - Stakes indicators analysis
 * - "So What?" chain validation between slides
 *
 * Usage:
 *   node scripts/emotional-arc.js decks/my-deck
 *   node scripts/emotional-arc.js decks/my-deck --json
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// HOOK ANALYSIS
// ============================================================================

const HOOK_INDICATORS = {
  // Question hooks - engaging audience immediately
  question: /^(what if|why do|how can|have you|did you|do you|when was|where is|who|what|why|how|is it|are you|could|would|should)\b/i,

  // Surprise/tension words that create intrigue
  surprise: /(shocking|hidden|secret|surprising|unexpected|little-known|most people|nobody|everyone|actually|truth|myth|lie|mistake|wrong|forgotten|overlooked|untold|reveal|discover|uncover|behind|real reason)/i,

  // Statistical hooks
  statistic: /(\d+%|\d+x|\$[\d,]+|\d+ (million|billion|trillion)|[1-9]\d* (out of|in \d)|\d+\/\d+)/i,

  // Specificity indicators (concrete vs vague)
  specific: /(\d+|specific|exactly|precisely|case study|example|story of|meet|interview|real|actual|named|called)/i,

  // Weak/generic indicators
  weak: /^(about|overview|agenda|introduction|summary|today|presentation|welcome|thank|hello|my name|we will|let me|i want to)/i,
};

function analyzeHook(slide, slideIndex) {
  const text = `${slide.headline} ${slide.content}`.toLowerCase();
  const headline = slide.headline.toLowerCase();

  const analysis = {
    slideIndex: slideIndex + 1,
    title: slide.title,
    headline: slide.headline,
    hookType: 'statement',
    indicators: [],
    grade: 'informational',
    reasons: [],
  };

  // Determine hook type
  if (HOOK_INDICATORS.question.test(headline)) {
    analysis.hookType = 'question';
    analysis.indicators.push('question format');
  } else if (HOOK_INDICATORS.statistic.test(headline)) {
    analysis.hookType = 'statistic';
    analysis.indicators.push('contains data');
  }

  // Check for surprise/tension elements
  const surpriseMatch = text.match(HOOK_INDICATORS.surprise);
  if (surpriseMatch) {
    analysis.indicators.push(`tension word: "${surpriseMatch[0]}"`);
  }

  // Check for specificity
  if (HOOK_INDICATORS.specific.test(text)) {
    analysis.indicators.push('specific/concrete');
  }

  // Check for statistics in content
  if (HOOK_INDICATORS.statistic.test(text)) {
    analysis.indicators.push('contains statistics');
  }

  // Grade the hook
  if (HOOK_INDICATORS.weak.test(headline)) {
    analysis.grade = 'weak';
    analysis.reasons.push('generic opening pattern');
  } else if (analysis.indicators.length >= 3) {
    analysis.grade = 'provocative';
    analysis.reasons.push('multiple engagement elements');
  } else if (analysis.indicators.length >= 2) {
    analysis.grade = 'interesting';
    analysis.reasons.push('good engagement elements');
  } else if (analysis.indicators.length === 1) {
    analysis.grade = 'informational';
    analysis.reasons.push('basic engagement');
  } else {
    analysis.grade = 'weak';
    analysis.reasons.push('missing engagement elements');
  }

  // Bonus: check if headline is a complete thought
  if (headline.length < 15 && !/[.!?]$/.test(headline)) {
    analysis.reasons.push('headline is a label, not a message');
    if (analysis.grade !== 'weak') {
      analysis.grade = analysis.grade === 'provocative' ? 'interesting' :
                       analysis.grade === 'interesting' ? 'informational' : 'weak';
    }
  }

  return analysis;
}

// ============================================================================
// TENSION/RESOLUTION TRACKING
// ============================================================================

const EMOTIONAL_WORDS = {
  tension: {
    // Problems and challenges
    problem: /(problem|issue|challenge|difficulty|obstacle|barrier|hurdle)/gi,
    risk: /(risk|danger|threat|vulnerability|exposure|liability)/gi,
    cost: /(cost|expense|waste|loss|drain|burden|price)/gi,
    negative: /(fail|struggle|pain|suffer|fear|worry|concern|crisis|chaos|mess|broken|wrong|bad|worse|worst|trouble|error|mistake)/gi,
    urgency: /(urgent|critical|immediate|now|before it's too late|running out|deadline|emergency)/gi,
    competition: /(competitor|competition|threat|disruption|obsolete|behind|losing|falling)/gi,
  },
  resolution: {
    // Solutions and outcomes
    solution: /(solution|answer|fix|resolve|solve|address|overcome)/gi,
    success: /(success|achieve|accomplish|win|gain|benefit|advantage|improve)/gi,
    transform: /(transform|change|revolutionize|breakthrough|innovate|reimagine|reinvent)/gi,
    positive: /(better|best|great|amazing|incredible|remarkable|powerful|effective|efficient|easy|simple|fast|quick)/gi,
    proof: /(result|outcome|evidence|proof|data|metric|increase|decrease|improve|grow|save|reduce)/gi,
    future: /(future|tomorrow|next|vision|possibility|potential|opportunity|imagine)/gi,
  },
  stakes: {
    // Impact indicators
    money: /(\$[\d,]+[KMB]?|\d+%|\d+ (million|billion|thousand))/gi,
    time: /(\d+ (years?|months?|weeks?|days?|hours?))/gi,
    scale: /(\d+[KMB]?\+? (users?|customers?|companies|teams|people|employees))/gi,
    impact: /(impact|affect|influence|change|save|lose|gain|grow|reduce|increase|decrease|cut|double|triple|10x|100x)/gi,
  },
};

function analyzeEmotionalContent(slide, slideIndex) {
  const text = `${slide.headline} ${slide.content}`;

  const analysis = {
    slideIndex: slideIndex + 1,
    title: slide.title,
    tension: { score: 0, words: [] },
    resolution: { score: 0, words: [] },
    stakes: { score: 0, indicators: [] },
  };

  // Count tension words
  for (const [category, pattern] of Object.entries(EMOTIONAL_WORDS.tension)) {
    const matches = text.match(pattern) || [];
    if (matches.length > 0) {
      analysis.tension.score += matches.length;
      analysis.tension.words.push(...matches.map(m => m.toLowerCase()));
    }
  }

  // Count resolution words
  for (const [category, pattern] of Object.entries(EMOTIONAL_WORDS.resolution)) {
    const matches = text.match(pattern) || [];
    if (matches.length > 0) {
      analysis.resolution.score += matches.length;
      analysis.resolution.words.push(...matches.map(m => m.toLowerCase()));
    }
  }

  // Count stakes indicators
  for (const [category, pattern] of Object.entries(EMOTIONAL_WORDS.stakes)) {
    const matches = text.match(pattern) || [];
    if (matches.length > 0) {
      analysis.stakes.score += matches.length;
      analysis.stakes.indicators.push(...matches);
    }
  }

  // Deduplicate
  analysis.tension.words = [...new Set(analysis.tension.words)];
  analysis.resolution.words = [...new Set(analysis.resolution.words)];
  analysis.stakes.indicators = [...new Set(analysis.stakes.indicators)];

  return analysis;
}

function classifyArcShape(emotionalAnalysis) {
  const slides = emotionalAnalysis;
  const totalSlides = slides.length;

  if (totalSlides < 3) {
    return { shape: 'too-short', description: 'Not enough slides to analyze arc' };
  }

  // Split into thirds
  const firstThird = slides.slice(0, Math.ceil(totalSlides / 3));
  const middleThird = slides.slice(Math.ceil(totalSlides / 3), Math.ceil(2 * totalSlides / 3));
  const lastThird = slides.slice(Math.ceil(2 * totalSlides / 3));

  const avgTension = (arr) => arr.reduce((sum, s) => sum + s.tension.score, 0) / arr.length;
  const avgResolution = (arr) => arr.reduce((sum, s) => sum + s.resolution.score, 0) / arr.length;

  const firstTension = avgTension(firstThird);
  const middleTension = avgTension(middleThird);
  const lastTension = avgTension(lastThird);

  const firstResolution = avgResolution(firstThird);
  const middleResolution = avgResolution(middleThird);
  const lastResolution = avgResolution(lastThird);

  // Analyze arc pattern
  let shape, description;

  // Ideal: tension builds, then resolves
  if (middleTension > firstTension && lastResolution > middleResolution) {
    shape = 'builds-then-resolves';
    description = 'Good arc: tension builds through middle, resolution comes at end';
  }
  // Front-loaded tension, quick resolution
  else if (firstTension > middleTension && middleResolution > firstResolution) {
    shape = 'front-loaded';
    description = 'Tension established early, resolution builds through deck';
  }
  // Flat - no clear emotional movement
  else if (Math.abs(firstTension - lastTension) < 1 && Math.abs(firstResolution - lastResolution) < 1) {
    shape = 'flat';
    description = 'Warning: No emotional arc - deck feels monotone';
  }
  // Chaotic - emotions all over the place
  else if (Math.abs(middleTension - firstTension) > 2 && Math.abs(lastTension - middleTension) > 2) {
    shape = 'chaotic';
    description = 'Warning: Emotional tone is inconsistent throughout';
  }
  // Resolution without tension
  else if (avgTension(slides) < 1 && avgResolution(slides) > 2) {
    shape = 'all-positive';
    description = 'Warning: No tension established - may feel like a sales pitch';
  }
  // Tension without resolution
  else if (avgTension(slides) > 2 && avgResolution(slides) < 1) {
    shape = 'all-negative';
    description = 'Warning: Lots of problems but no clear solution';
  }
  // Default
  else {
    shape = 'mixed';
    description = 'Mixed emotional arc - consider strengthening the tension-resolution flow';
  }

  return {
    shape,
    description,
    metrics: {
      firstThird: { tension: firstTension.toFixed(1), resolution: firstResolution.toFixed(1) },
      middleThird: { tension: middleTension.toFixed(1), resolution: middleResolution.toFixed(1) },
      lastThird: { tension: lastTension.toFixed(1), resolution: lastResolution.toFixed(1) },
    },
  };
}

// ============================================================================
// "SO WHAT?" CHAIN ANALYSIS
// ============================================================================

function analyzeFlowChain(slides) {
  const gaps = [];

  // Key concepts per slide for tracking flow
  const extractKeyConcepts = (slide) => {
    const text = `${slide.headline} ${slide.content}`.toLowerCase();
    // Extract nouns and key phrases
    const words = text.split(/\s+/).filter(w => w.length > 4);
    return new Set(words);
  };

  for (let i = 1; i < slides.length; i++) {
    const prevSlide = slides[i - 1];
    const currSlide = slides[i];

    const prevConcepts = extractKeyConcepts(prevSlide);
    const currConcepts = extractKeyConcepts(currSlide);

    // Check for conceptual overlap
    const overlap = [...prevConcepts].filter(c => currConcepts.has(c)).length;
    const overlapRatio = overlap / Math.max(prevConcepts.size, 1);

    // Transition indicators
    const hasTransition = /therefore|so|because|thus|as a result|this means|which|building on|next|however|but|instead|alternatively/i.test(currSlide.content);

    // Detect potential disconnects
    if (overlapRatio < 0.1 && !hasTransition) {
      gaps.push({
        fromSlide: i,
        toSlide: i + 1,
        fromTitle: prevSlide.title,
        toTitle: currSlide.title,
        issue: 'No conceptual bridge between slides',
        suggestion: `Consider adding a transition from "${prevSlide.title}" to "${currSlide.title}"`,
      });
    }

    // Check for abrupt topic shifts
    const prevType = classifySlideType(prevSlide);
    const currType = classifySlideType(currSlide);

    if (prevType === 'problem' && currType !== 'solution' && currType !== 'problem') {
      gaps.push({
        fromSlide: i,
        toSlide: i + 1,
        fromTitle: prevSlide.title,
        toTitle: currSlide.title,
        issue: 'Problem slide not followed by solution or deeper problem exploration',
        suggestion: 'After establishing a problem, immediately address it or deepen it',
      });
    }
  }

  return gaps;
}

function classifySlideType(slide) {
  const text = `${slide.headline} ${slide.content}`.toLowerCase();

  if (/problem|challenge|pain|cost|risk|threat|struggle|failing|broken/i.test(text)) return 'problem';
  if (/solution|approach|how we|introducing|meet|our (platform|product|service)/i.test(text)) return 'solution';
  if (/case study|results|metrics|testimonial|evidence|\d+%|\d+x/i.test(text)) return 'proof';
  if (/next step|get started|contact|let's|ready to|call|schedule|demo/i.test(text)) return 'cta';

  return 'content';
}

// ============================================================================
// DECK EXTRACTION (shared pattern from narrative-review.js)
// ============================================================================

function extractSlideContent(html) {
  const slides = [];
  const slideRegex = /<section[^>]*class="slide[^"]*"[^>]*data-title="([^"]*)"[^>]*>([\s\S]*?)<\/section>/g;

  let match;
  while ((match = slideRegex.exec(html)) !== null) {
    const title = match[1];
    const content = match[2];

    const textContent = content
      .replace(/<script[^>]*>[\s\S]*?<\/script>/g, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const headlineMatch = content.match(/<h[12][^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/h[12]>/);
    const headline = headlineMatch
      ? headlineMatch[1].replace(/<[^>]+>/g, '').trim()
      : title;

    slides.push({
      title,
      headline,
      content: textContent,
      rawHtml: content,
    });
  }

  return slides;
}

// ============================================================================
// MAIN ANALYSIS
// ============================================================================

function generateReport(deckPath, outputJson = false) {
  const htmlPath = path.join(deckPath, 'index.html');

  if (!fs.existsSync(htmlPath)) {
    console.error(`Deck not found: ${htmlPath}`);
    process.exit(1);
  }

  const html = fs.readFileSync(htmlPath, 'utf-8');
  const slides = extractSlideContent(html);

  if (slides.length === 0) {
    console.error('No slides found in deck');
    process.exit(1);
  }

  // Analyze opening slides for hooks (first 2)
  const hookAnalysis = slides.slice(0, 2).map((slide, i) => analyzeHook(slide, i));
  const primaryHook = hookAnalysis[0];

  // Determine overall hook quality
  const hookGrades = { provocative: 4, interesting: 3, informational: 2, weak: 1 };
  const bestHookGrade = hookAnalysis.reduce((best, h) =>
    hookGrades[h.grade] > hookGrades[best] ? h.grade : best, 'weak');

  // Analyze emotional content per slide
  const emotionalAnalysis = slides.map((slide, i) => analyzeEmotionalContent(slide, i));

  // Classify arc shape
  const arcShape = classifyArcShape(emotionalAnalysis);

  // Analyze flow/connection chain
  const flowGaps = analyzeFlowChain(slides);

  // Build report
  const report = {
    deckPath,
    slideCount: slides.length,
    hookAnalysis: {
      primaryHook,
      openingSlides: hookAnalysis,
      overallGrade: bestHookGrade,
      summary: {
        provocative: hookAnalysis.filter(h => h.grade === 'provocative').length,
        interesting: hookAnalysis.filter(h => h.grade === 'interesting').length,
        informational: hookAnalysis.filter(h => h.grade === 'informational').length,
        weak: hookAnalysis.filter(h => h.grade === 'weak').length,
      },
    },
    emotionalArc: {
      perSlide: emotionalAnalysis,
      arcShape: arcShape,
      totalTension: emotionalAnalysis.reduce((sum, s) => sum + s.tension.score, 0),
      totalResolution: emotionalAnalysis.reduce((sum, s) => sum + s.resolution.score, 0),
      totalStakes: emotionalAnalysis.reduce((sum, s) => sum + s.stakes.score, 0),
    },
    flowChain: {
      gaps: flowGaps,
      gapCount: flowGaps.length,
      assessment: flowGaps.length === 0 ? 'Good flow' :
                  flowGaps.length <= 2 ? 'Minor flow issues' : 'Significant flow problems',
    },
    summary: {
      hookQuality: bestHookGrade,
      arcShape: arcShape.shape,
      flowGaps: flowGaps.length,
      recommendations: [],
    },
  };

  // Generate recommendations
  if (bestHookGrade === 'weak' || bestHookGrade === 'informational') {
    report.summary.recommendations.push('Strengthen opening hook with question, statistic, or tension element');
  }
  if (arcShape.shape === 'flat') {
    report.summary.recommendations.push('Add emotional dynamics - establish tension before offering resolution');
  }
  if (arcShape.shape === 'all-positive') {
    report.summary.recommendations.push('Establish the problem/stakes before presenting solutions');
  }
  if (arcShape.shape === 'all-negative') {
    report.summary.recommendations.push('Add resolution elements - show how problems get solved');
  }
  if (flowGaps.length > 0) {
    report.summary.recommendations.push(`Fix ${flowGaps.length} slide transition(s) that lack logical connection`);
  }
  if (report.emotionalArc.totalStakes < slides.length / 2) {
    report.summary.recommendations.push('Add more stakes indicators (numbers, impact, consequences)');
  }

  if (outputJson) {
    console.log(JSON.stringify(report, null, 2));
    return report;
  }

  // Pretty print
  console.log(`\nEmotional Arc Analysis: ${deckPath}`);
  console.log('='.repeat(50));
  console.log(`\nSlides: ${slides.length}`);

  // Hook Analysis
  console.log('\n--- HOOK ANALYSIS ---');
  console.log(`Overall Hook Grade: ${bestHookGrade.toUpperCase()}`);
  hookAnalysis.forEach(h => {
    console.log(`\nSlide ${h.slideIndex}: "${h.headline}"`);
    console.log(`  Type: ${h.hookType}`);
    console.log(`  Grade: ${h.grade}`);
    console.log(`  Indicators: ${h.indicators.length > 0 ? h.indicators.join(', ') : 'none'}`);
    console.log(`  Notes: ${h.reasons.join('; ')}`);
  });

  // Emotional Arc
  console.log('\n--- EMOTIONAL ARC ---');
  console.log(`Shape: ${arcShape.shape}`);
  console.log(`Assessment: ${arcShape.description}`);
  console.log('\nPer-section metrics:');
  console.log(`  First third:  Tension ${arcShape.metrics.firstThird.tension}, Resolution ${arcShape.metrics.firstThird.resolution}`);
  console.log(`  Middle third: Tension ${arcShape.metrics.middleThird.tension}, Resolution ${arcShape.metrics.middleThird.resolution}`);
  console.log(`  Last third:   Tension ${arcShape.metrics.lastThird.tension}, Resolution ${arcShape.metrics.lastThird.resolution}`);

  console.log('\nPer-slide breakdown:');
  emotionalAnalysis.forEach(s => {
    const bar = (score) => '|'.repeat(Math.min(score, 10)) || '-';
    console.log(`  ${s.slideIndex}. ${s.title}`);
    console.log(`     Tension: ${bar(s.tension.score)} (${s.tension.score}) ${s.tension.words.slice(0, 3).join(', ')}`);
    console.log(`     Resolution: ${bar(s.resolution.score)} (${s.resolution.score}) ${s.resolution.words.slice(0, 3).join(', ')}`);
    if (s.stakes.indicators.length > 0) {
      console.log(`     Stakes: ${s.stakes.indicators.slice(0, 3).join(', ')}`);
    }
  });

  // Flow Gaps
  console.log('\n--- FLOW CHAIN ("So What?" Analysis) ---');
  console.log(`Assessment: ${report.flowChain.assessment}`);
  if (flowGaps.length > 0) {
    console.log('\nDisconnects found:');
    flowGaps.forEach(gap => {
      console.log(`  Slide ${gap.fromSlide} -> ${gap.toSlide}: ${gap.issue}`);
      console.log(`    "${gap.fromTitle}" -> "${gap.toTitle}"`);
      console.log(`    Suggestion: ${gap.suggestion}`);
    });
  } else {
    console.log('No significant flow gaps detected.');
  }

  // Recommendations
  console.log('\n--- RECOMMENDATIONS ---');
  if (report.summary.recommendations.length > 0) {
    report.summary.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });
  } else {
    console.log('  Emotional arc looks solid!');
  }

  console.log('\n' + '='.repeat(50));

  return report;
}

// Main
const args = process.argv.slice(2);
const deckPath = args.find(a => !a.startsWith('--')) || 'decks/skill-demo';
const outputJson = args.includes('--json');

generateReport(deckPath, outputJson);
