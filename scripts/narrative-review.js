#!/usr/bin/env node
/**
 * Narrative Review Script
 *
 * Analyzes slide deck content for storytelling quality:
 * - Narrative arc (hook → problem → solution → proof → CTA)
 * - One idea per slide
 * - Redundancy detection
 * - Flow and transitions
 * - Clarity scoring
 *
 * Usage:
 *   node scripts/narrative-review.js decks/my-deck
 *   node scripts/narrative-review.js decks/my-deck --json
 */

const fs = require('fs');
const path = require('path');

// Slide type detection patterns
const SLIDE_PATTERNS = {
  hook: /^(what if|imagine|the (biggest|#1|top)|did you know|why|how)/i,
  problem: /(problem|challenge|pain|cost|risk|threat|struggle|failing|broken)/i,
  solution: /(solution|approach|how we|introducing|meet|our (platform|product|service))/i,
  proof: /(case study|results|metrics|testimonial|evidence|\d+%|\d+x)/i,
  cta: /(next step|get started|contact|let's|ready to|call|schedule|demo)/i,
  quote: /^[""].*[""]$/,
  title: /^[^.!?]+$/, // No punctuation, likely a title
};

// Anti-pattern detection
const ANTI_PATTERNS = {
  wallOfText: (text) => text.length > 500,
  tooManyBullets: (text) => (text.match(/^[-•*]/gm) || []).length > 5,
  weakHeadline: (headline) => /^(about|overview|agenda|introduction|summary)$/i.test(headline),
  jargon: (text) => /synerg|leverage|paradigm|holistic|scalable|robust|seamless/i.test(text),
  // Only flag very short label-style headlines
  labelHeadline: (headline) => headline.length < 20 && /^[A-Z][a-z]+ ?[A-Z]?[a-z]*$/.test(headline) && !/\b(is|are|will|can|do|get|make)\b/i.test(headline),
};

function extractSlideContent(html) {
  const slides = [];
  const slideRegex = /<section[^>]*class="slide[^"]*"[^>]*data-title="([^"]*)"[^>]*>([\s\S]*?)<\/section>/g;

  let match;
  while ((match = slideRegex.exec(html)) !== null) {
    const title = match[1];
    const content = match[2];

    // Extract text content
    const textContent = content
      .replace(/<script[^>]*>[\s\S]*?<\/script>/g, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract headlines
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

function classifySlide(slide) {
  const text = `${slide.headline} ${slide.content}`.toLowerCase();

  for (const [type, pattern] of Object.entries(SLIDE_PATTERNS)) {
    if (pattern.test(text)) {
      return type;
    }
  }

  return 'content';
}

function detectAntiPatterns(slide) {
  const issues = [];

  if (ANTI_PATTERNS.wallOfText(slide.content)) {
    issues.push('Wall of text - too much content for one slide');
  }

  if (ANTI_PATTERNS.tooManyBullets(slide.content)) {
    issues.push('Too many bullets - consider splitting into multiple slides');
  }

  if (ANTI_PATTERNS.weakHeadline(slide.headline)) {
    issues.push(`Weak headline "${slide.headline}" - use a complete thought instead`);
  }

  if (ANTI_PATTERNS.jargon(slide.content)) {
    issues.push('Contains jargon - consider simpler language');
  }

  if (ANTI_PATTERNS.labelHeadline(slide.headline)) {
    issues.push(`Consider expanding "${slide.headline}" to a complete thought`);
  }

  return issues;
}

function findRedundancy(slides) {
  const redundancies = [];

  for (let i = 0; i < slides.length; i++) {
    for (let j = i + 1; j < slides.length; j++) {
      const similarity = calculateSimilarity(slides[i].content, slides[j].content);
      if (similarity > 0.5) {
        redundancies.push({
          slides: [i + 1, j + 1],
          titles: [slides[i].title, slides[j].title],
          similarity: Math.round(similarity * 100),
        });
      }
    }
  }

  return redundancies;
}

function calculateSimilarity(text1, text2) {
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3));

  const intersection = [...words1].filter(w => words2.has(w)).length;
  const union = new Set([...words1, ...words2]).size;

  return union > 0 ? intersection / union : 0;
}

function analyzeNarrativeArc(slides) {
  const arc = slides.map((slide, i) => ({
    index: i + 1,
    title: slide.title,
    type: classifySlide(slide),
  }));

  const issues = [];
  const types = arc.map(s => s.type);

  // Check for hook in first 2 slides
  if (!types.slice(0, 2).includes('hook') && !types.slice(0, 2).includes('quote')) {
    issues.push('Consider adding a hook or provocative opening in first 2 slides');
  }

  // Check problem comes before solution
  const problemIndex = types.indexOf('problem');
  const solutionIndex = types.indexOf('solution');
  if (solutionIndex !== -1 && problemIndex === -1) {
    issues.push('Solution presented without establishing the problem first');
  }
  if (solutionIndex !== -1 && problemIndex > solutionIndex) {
    issues.push('Problem comes after solution - consider reordering');
  }

  // Check for proof/evidence
  if (!types.includes('proof') && slides.length > 5) {
    issues.push('No proof/evidence slides detected - add metrics or case studies');
  }

  // Check for CTA at end
  if (slides.length > 3 && !types.slice(-2).includes('cta')) {
    issues.push('No clear call-to-action in final slides');
  }

  return { arc, issues };
}

function analyzeFlow(slides) {
  const issues = [];

  for (let i = 1; i < slides.length; i++) {
    const prev = slides[i - 1];
    const curr = slides[i];

    // Check for topic jumps (very different content)
    const similarity = calculateSimilarity(prev.content, curr.content);
    if (similarity < 0.1 && i < slides.length - 1) {
      // Low similarity might indicate a topic jump
      const prevType = classifySlide(prev);
      const currType = classifySlide(curr);
      if (prevType === currType) {
        // Same type but different content - might be okay
      } else if (Math.abs(i - slides.length) > 2) {
        // Only flag if not near the end
        issues.push(`Potential topic jump between slide ${i} ("${prev.title}") and ${i + 1} ("${curr.title}")`);
      }
    }
  }

  return issues;
}

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

  // Analysis
  const narrativeAnalysis = analyzeNarrativeArc(slides);
  const flowIssues = analyzeFlow(slides);
  const redundancies = findRedundancy(slides);

  const slideAnalysis = slides.map((slide, i) => ({
    index: i + 1,
    title: slide.title,
    headline: slide.headline,
    type: classifySlide(slide),
    contentLength: slide.content.length,
    issues: detectAntiPatterns(slide),
  }));

  const report = {
    deckPath,
    slideCount: slides.length,
    narrativeArc: narrativeAnalysis.arc,
    narrativeIssues: narrativeAnalysis.issues,
    flowIssues,
    redundancies,
    slides: slideAnalysis,
    summary: {
      totalIssues:
        narrativeAnalysis.issues.length +
        flowIssues.length +
        redundancies.length +
        slideAnalysis.reduce((sum, s) => sum + s.issues.length, 0),
      slidesWithIssues: slideAnalysis.filter(s => s.issues.length > 0).length,
    },
  };

  if (outputJson) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  // Pretty print
  console.log(`\nNarrative Review: ${deckPath}`);
  console.log('='.repeat(50));
  console.log(`\nSlides: ${slides.length}`);

  console.log('\n📊 Narrative Arc:');
  narrativeAnalysis.arc.forEach(s => {
    console.log(`  ${s.index}. [${s.type.toUpperCase()}] ${s.title}`);
  });

  if (narrativeAnalysis.issues.length > 0) {
    console.log('\n⚠️  Narrative Issues:');
    narrativeAnalysis.issues.forEach(issue => console.log(`  - ${issue}`));
  }

  if (flowIssues.length > 0) {
    console.log('\n🔀 Flow Issues:');
    flowIssues.forEach(issue => console.log(`  - ${issue}`));
  }

  if (redundancies.length > 0) {
    console.log('\n🔄 Potential Redundancies:');
    redundancies.forEach(r => {
      console.log(`  - Slides ${r.slides[0]} & ${r.slides[1]}: ${r.similarity}% similar`);
      console.log(`    ("${r.titles[0]}" / "${r.titles[1]}")`);
    });
  }

  const slidesWithIssues = slideAnalysis.filter(s => s.issues.length > 0);
  if (slidesWithIssues.length > 0) {
    console.log('\n📝 Slide-Level Issues:');
    slidesWithIssues.forEach(s => {
      console.log(`  Slide ${s.index} (${s.title}):`);
      s.issues.forEach(issue => console.log(`    - ${issue}`));
    });
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Summary: ${report.summary.totalIssues} issues across ${report.summary.slidesWithIssues} slides`);

  if (report.summary.totalIssues === 0) {
    console.log('✅ No issues detected - narrative looks solid!');
  }
}

// Main
const args = process.argv.slice(2);
const deckPath = args.find(a => !a.startsWith('--')) || 'decks/skill-demo';
const outputJson = args.includes('--json');

generateReport(deckPath, outputJson);
