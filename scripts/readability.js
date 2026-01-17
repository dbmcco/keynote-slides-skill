#!/usr/bin/env node
/**
 * Readability Analysis Script
 *
 * Measures text complexity per slide and across deck:
 * - Flesch-Kincaid grade level
 * - Average sentence/word length
 * - Passive voice detection
 * - Jargon density
 *
 * Usage:
 *   node scripts/readability.js decks/my-deck
 *   node scripts/readability.js decks/my-deck --json
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// SYLLABLE COUNTING (Heuristic)
// ============================================================================

/**
 * Count syllables in a word using vowel group heuristic.
 * Not perfect, but reasonable for readability scoring.
 */
function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 2) return 1;

  // Handle common silent-e endings
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');

  // Count vowel groups
  const matches = word.match(/[aeiouy]+/g);
  return matches ? Math.max(1, matches.length) : 1;
}

// ============================================================================
// PASSIVE VOICE DETECTION
// ============================================================================

/**
 * Detect passive voice patterns: was/were/been/being + past participle
 * Past participles often end in -ed, -en, -t, or are irregular
 */
const PASSIVE_PATTERNS = [
  /\b(is|are|was|were|been|being|be)\s+(\w+ed)\b/gi,
  /\b(is|are|was|were|been|being|be)\s+(\w+en)\b/gi,
  /\b(is|are|was|were|been|being|be)\s+(built|made|done|given|taken|shown|known|seen|found|thought|told|held|brought|bought|caught|taught|sent|spent|left|lost|met|paid|sold|read|written|driven|spoken|chosen|broken|frozen|stolen|worn|torn|born|drawn|grown|thrown|blown|flown|hidden|ridden|bitten|eaten|beaten|forgotten|forgiven)\b/gi,
  /\b(get|gets|got|gotten|getting)\s+(\w+ed)\b/gi,
];

function findPassiveVoice(text) {
  const passives = [];

  for (const pattern of PASSIVE_PATTERNS) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(text)) !== null) {
      passives.push({
        match: match[0],
        index: match.index,
      });
    }
  }

  // Deduplicate by index
  const seen = new Set();
  return passives.filter(p => {
    if (seen.has(p.index)) return false;
    seen.add(p.index);
    return true;
  });
}

// ============================================================================
// JARGON DETECTION
// ============================================================================

/**
 * Common jargon patterns:
 * - Business buzzwords
 * - Unexpanded acronyms (2-5 uppercase letters not followed by expansion)
 * - Technical terms without context
 */
const JARGON_PATTERNS = {
  buzzwords: /\b(synerg|leverage|paradigm|holistic|scalable|robust|seamless|disrupt|ideate|actionable|incentivize|optimize|streamline|empower|innovate|pivot|ecosystem|bandwidth|circle back|deep dive|low-hanging fruit|move the needle|best practice|game-?changer|value-?add|thought leader|core competenc|stakeholder|deliverable|proactive|take offline|double-?click|unpack)\w*\b/gi,
  acronyms: /\b[A-Z]{2,5}\b/g,
  techTerms: /\b(API|SDK|SaaS|IaaS|PaaS|DevOps|CI\/CD|microservice|containeriz|kubernetes|serverless|blockchain|machine learning|neural network|algorithm|backend|frontend|middleware|deployment|integration|infrastructure|architecture|repository|framework|runtime|endpoint)\w*\b/gi,
};

// Common acronyms that are well-known and don't count as jargon
const COMMON_ACRONYMS = new Set([
  'CEO', 'CFO', 'CTO', 'COO', 'VP', 'USA', 'UK', 'EU', 'UN', 'FBI', 'CIA',
  'NASA', 'HTML', 'CSS', 'PDF', 'URL', 'FAQ', 'DIY', 'ASAP', 'FYI', 'TBD',
  'AM', 'PM', 'TV', 'DVD', 'USB', 'GPS', 'ATM', 'PIN', 'ID', 'HR', 'PR',
  'VS', 'EG', 'IE', 'OK', 'PS', 'AD', 'BC', 'AI', 'IT', 'VR', 'AR',
]);

function findJargon(text) {
  const jargon = [];

  // Find buzzwords
  let match;
  const buzzwordRegex = new RegExp(JARGON_PATTERNS.buzzwords.source, JARGON_PATTERNS.buzzwords.flags);
  while ((match = buzzwordRegex.exec(text)) !== null) {
    jargon.push({ term: match[0], type: 'buzzword' });
  }

  // Find unexpanded acronyms
  const acronymRegex = new RegExp(JARGON_PATTERNS.acronyms.source, JARGON_PATTERNS.acronyms.flags);
  while ((match = acronymRegex.exec(text)) !== null) {
    const acronym = match[0];
    if (!COMMON_ACRONYMS.has(acronym)) {
      // Check if it's expanded nearby (within 50 chars before)
      const context = text.substring(Math.max(0, match.index - 100), match.index);
      const expanded = new RegExp(`\\b${acronym.split('').join('\\w*\\s+')}`, 'i').test(context);
      if (!expanded) {
        jargon.push({ term: acronym, type: 'acronym' });
      }
    }
  }

  // Find technical terms
  const techRegex = new RegExp(JARGON_PATTERNS.techTerms.source, JARGON_PATTERNS.techTerms.flags);
  while ((match = techRegex.exec(text)) !== null) {
    jargon.push({ term: match[0], type: 'technical' });
  }

  return jargon;
}

// ============================================================================
// TEXT EXTRACTION
// ============================================================================

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
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#?\w+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    slides.push({
      title,
      content: textContent,
    });
  }

  return slides;
}

// ============================================================================
// READABILITY ANALYSIS
// ============================================================================

function tokenize(text) {
  // Split into sentences (simple heuristic)
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  // Split into words
  const words = text
    .toLowerCase()
    .split(/\s+/)
    .filter(w => /^[a-z]+$/i.test(w) && w.length > 0);

  return { sentences, words };
}

function analyzeSlide(slide) {
  const { sentences, words } = tokenize(slide.content);

  if (words.length === 0) {
    return {
      title: slide.title,
      content: slide.content,
      wordCount: 0,
      sentenceCount: 0,
      fleschKincaidGrade: null,
      avgSentenceLength: null,
      avgWordLength: null,
      avgSyllablesPerWord: null,
      passiveVoice: [],
      passiveVoicePercent: 0,
      jargon: [],
      jargonDensity: 0,
      complexSentences: [],
      flags: [],
    };
  }

  // Word and syllable counts
  const syllableCounts = words.map(countSyllables);
  const totalSyllables = syllableCounts.reduce((sum, c) => sum + c, 0);
  const totalCharacters = words.reduce((sum, w) => sum + w.length, 0);

  // Averages
  const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : words.length;
  const avgSyllablesPerWord = totalSyllables / words.length;
  const avgWordLength = totalCharacters / words.length;

  // Flesch-Kincaid Grade Level
  // FK Grade = 0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59
  const fleschKincaidGrade = sentences.length > 0
    ? 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59
    : null;

  // Passive voice detection
  const passiveMatches = findPassiveVoice(slide.content);
  const passiveVoicePercent = sentences.length > 0
    ? (passiveMatches.length / sentences.length) * 100
    : 0;

  // Jargon detection
  const jargonMatches = findJargon(slide.content);
  const jargonDensity = words.length > 0
    ? (jargonMatches.length / words.length) * 100
    : 0;

  // Find complex sentences (long or passive)
  const complexSentences = [];
  for (const sentence of sentences) {
    const sentenceWords = sentence.split(/\s+/).filter(w => w.length > 0);
    const isLong = sentenceWords.length > 25;
    const passiveInSentence = findPassiveVoice(sentence);
    const hasPassive = passiveInSentence.length > 0;

    if (isLong || hasPassive) {
      complexSentences.push({
        text: sentence.length > 100 ? sentence.substring(0, 100) + '...' : sentence,
        wordCount: sentenceWords.length,
        issues: [
          ...(isLong ? ['Long sentence (>25 words)'] : []),
          ...(hasPassive ? [`Passive voice: "${passiveInSentence[0].match}"`] : []),
        ],
      });
    }
  }

  // Generate flags
  const flags = [];
  if (fleschKincaidGrade !== null && fleschKincaidGrade > 10) {
    flags.push(`High grade level: ${fleschKincaidGrade.toFixed(1)} (target: <10)`);
  }
  if (passiveVoicePercent > 20) {
    flags.push(`High passive voice: ${passiveVoicePercent.toFixed(0)}% (target: <20%)`);
  }
  if (jargonDensity > 5) {
    flags.push(`High jargon density: ${jargonDensity.toFixed(1)}% (target: <5%)`);
  }

  return {
    title: slide.title,
    content: slide.content,
    wordCount: words.length,
    sentenceCount: sentences.length,
    fleschKincaidGrade: fleschKincaidGrade !== null ? parseFloat(fleschKincaidGrade.toFixed(2)) : null,
    avgSentenceLength: parseFloat(avgSentenceLength.toFixed(2)),
    avgWordLength: parseFloat(avgWordLength.toFixed(2)),
    avgSyllablesPerWord: parseFloat(avgSyllablesPerWord.toFixed(2)),
    passiveVoice: passiveMatches.map(p => p.match),
    passiveVoicePercent: parseFloat(passiveVoicePercent.toFixed(1)),
    jargon: jargonMatches,
    jargonDensity: parseFloat(jargonDensity.toFixed(2)),
    complexSentences,
    flags,
  };
}

function analyzeDeck(deckPath) {
  const htmlPath = path.join(deckPath, 'index.html');

  if (!fs.existsSync(htmlPath)) {
    throw new Error(`Deck not found: ${htmlPath}`);
  }

  const html = fs.readFileSync(htmlPath, 'utf-8');
  const slides = extractSlideContent(html);

  if (slides.length === 0) {
    throw new Error('No slides found in deck');
  }

  // Analyze each slide
  const slideAnalysis = slides.map((slide, i) => ({
    index: i + 1,
    ...analyzeSlide(slide),
  }));

  // Calculate deck averages
  const slidesWithContent = slideAnalysis.filter(s => s.wordCount > 0);
  const totalWords = slidesWithContent.reduce((sum, s) => sum + s.wordCount, 0);
  const totalSentences = slidesWithContent.reduce((sum, s) => sum + s.sentenceCount, 0);

  const avgGrade = slidesWithContent.length > 0
    ? slidesWithContent
        .filter(s => s.fleschKincaidGrade !== null)
        .reduce((sum, s) => sum + s.fleschKincaidGrade, 0) /
      slidesWithContent.filter(s => s.fleschKincaidGrade !== null).length
    : null;

  const avgPassivePercent = slidesWithContent.length > 0
    ? slidesWithContent.reduce((sum, s) => sum + s.passiveVoicePercent, 0) / slidesWithContent.length
    : 0;

  const avgJargonDensity = slidesWithContent.length > 0
    ? slidesWithContent.reduce((sum, s) => sum + s.jargonDensity, 0) / slidesWithContent.length
    : 0;

  // Collect all complex sentences
  const allComplexSentences = slideAnalysis.flatMap(s =>
    s.complexSentences.map(cs => ({
      slide: s.index,
      slideTitle: s.title,
      ...cs,
    }))
  );

  // Deck-level flags
  const deckFlags = [];
  if (avgGrade !== null && avgGrade > 10) {
    deckFlags.push(`Average grade level high: ${avgGrade.toFixed(1)}`);
  }
  if (avgPassivePercent > 20) {
    deckFlags.push(`Average passive voice high: ${avgPassivePercent.toFixed(0)}%`);
  }
  if (avgJargonDensity > 5) {
    deckFlags.push(`Average jargon density high: ${avgJargonDensity.toFixed(1)}%`);
  }

  return {
    deckPath,
    slideCount: slides.length,
    totalWords,
    totalSentences,
    deckAverage: {
      fleschKincaidGrade: avgGrade !== null ? parseFloat(avgGrade.toFixed(2)) : null,
      avgSentenceLength: totalSentences > 0
        ? parseFloat((totalWords / totalSentences).toFixed(2))
        : null,
      passiveVoicePercent: parseFloat(avgPassivePercent.toFixed(1)),
      jargonDensity: parseFloat(avgJargonDensity.toFixed(2)),
    },
    deckFlags,
    slides: slideAnalysis,
    complexSentences: allComplexSentences,
    summary: {
      slidesWithFlags: slideAnalysis.filter(s => s.flags.length > 0).length,
      totalFlags: slideAnalysis.reduce((sum, s) => sum + s.flags.length, 0),
      totalComplexSentences: allComplexSentences.length,
    },
  };
}

// ============================================================================
// OUTPUT
// ============================================================================

function printReport(report) {
  console.log(`\nReadability Analysis: ${report.deckPath}`);
  console.log('='.repeat(50));

  console.log(`\nSlides: ${report.slideCount}`);
  console.log(`Total words: ${report.totalWords}`);
  console.log(`Total sentences: ${report.totalSentences}`);

  console.log('\n--- Deck Averages ---');
  if (report.deckAverage.fleschKincaidGrade !== null) {
    console.log(`Flesch-Kincaid Grade: ${report.deckAverage.fleschKincaidGrade} (target: <10)`);
  }
  if (report.deckAverage.avgSentenceLength !== null) {
    console.log(`Avg sentence length: ${report.deckAverage.avgSentenceLength} words`);
  }
  console.log(`Passive voice: ${report.deckAverage.passiveVoicePercent}% (target: <20%)`);
  console.log(`Jargon density: ${report.deckAverage.jargonDensity}% (target: <5%)`);

  if (report.deckFlags.length > 0) {
    console.log('\n--- Deck Flags ---');
    report.deckFlags.forEach(flag => console.log(`  - ${flag}`));
  }

  const slidesWithIssues = report.slides.filter(s => s.flags.length > 0);
  if (slidesWithIssues.length > 0) {
    console.log('\n--- Slide Flags ---');
    slidesWithIssues.forEach(s => {
      console.log(`\nSlide ${s.index}: ${s.title}`);
      console.log(`  Words: ${s.wordCount}, Grade: ${s.fleschKincaidGrade || 'N/A'}`);
      s.flags.forEach(flag => console.log(`  - ${flag}`));
      if (s.jargon.length > 0) {
        const uniqueJargon = [...new Set(s.jargon.map(j => j.term))].slice(0, 5);
        console.log(`  Jargon: ${uniqueJargon.join(', ')}${s.jargon.length > 5 ? '...' : ''}`);
      }
    });
  }

  if (report.complexSentences.length > 0) {
    console.log('\n--- Complex Sentences ---');
    report.complexSentences.slice(0, 10).forEach(cs => {
      console.log(`\nSlide ${cs.slide} (${cs.slideTitle}):`);
      console.log(`  "${cs.text}"`);
      console.log(`  Issues: ${cs.issues.join(', ')}`);
    });
    if (report.complexSentences.length > 10) {
      console.log(`\n  ... and ${report.complexSentences.length - 10} more`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Summary: ${report.summary.totalFlags} flags across ${report.summary.slidesWithFlags} slides`);
  console.log(`Complex sentences: ${report.summary.totalComplexSentences}`);

  if (report.summary.totalFlags === 0 && report.summary.totalComplexSentences === 0) {
    console.log('No readability issues detected!');
  }
}

// ============================================================================
// MAIN
// ============================================================================

const args = process.argv.slice(2);
const deckPath = args.find(a => !a.startsWith('--')) || 'decks/skill-demo';
const outputJson = args.includes('--json');

try {
  const report = analyzeDeck(deckPath);

  if (outputJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printReport(report);
  }
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
