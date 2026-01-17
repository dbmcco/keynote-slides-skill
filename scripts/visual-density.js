#!/usr/bin/env node
/**
 * Visual Density Analysis Script
 *
 * Extracts factual metrics about slide content density for model-mediated review.
 * This is the CODE LAYER - it gathers data without making judgments.
 *
 * Metrics extracted per slide:
 * - Word count
 * - Character count (excluding HTML)
 * - Image count and total image area (if dimensions available)
 * - Estimated text-to-visual ratio
 * - Whitespace estimation (content density proxy)
 *
 * Usage:
 *   node scripts/visual-density.js decks/my-deck
 *   node scripts/visual-density.js decks/my-deck --json
 */

const fs = require('fs');
const path = require('path');

// Thresholds for flagging (factual boundaries, not judgments)
const THRESHOLDS = {
  highWordCount: 100,
  highCharCount: 600,
  lowWordCount: 5,
  noBulletMin: 0,
  manyBullets: 5,
};

// Slide type patterns (to identify content slides vs title/quote slides)
const SLIDE_TYPE_PATTERNS = {
  title: /layout-title/,
  quote: /layout-quote/,
  metrics: /layout-metrics/,
  split: /layout-split/,
  grid: /layout-grid/,
};

function extractSlides(html) {
  const slides = [];
  const slideRegex = /<section[^>]*class="slide([^"]*)"[^>]*data-title="([^"]*)"[^>]*>([\s\S]*?)<\/section>/g;

  let match;
  while ((match = slideRegex.exec(html)) !== null) {
    const classAttr = match[1];
    const title = match[2];
    const content = match[3];

    // Detect slide type from class
    let slideType = 'content';
    for (const [type, pattern] of Object.entries(SLIDE_TYPE_PATTERNS)) {
      if (pattern.test(content)) {
        slideType = type;
        break;
      }
    }

    // Detect theme
    const theme = /theme-ink/.test(classAttr) ? 'ink' : 'ivory';

    slides.push({
      title,
      rawHtml: content,
      slideType,
      theme,
    });
  }

  return slides;
}

function extractTextContent(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/g, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countWords(text) {
  if (!text) return 0;
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function countBullets(html) {
  // Count bullet list items
  const liCount = (html.match(/<li[^>]*>/gi) || []).length;
  // Count chip elements (used as tags/labels)
  const chipCount = (html.match(/class="[^"]*chip[^"]*"/gi) || []).length;
  // Count card elements
  const cardCount = (html.match(/class="[^"]*card[^"]*"/gi) || []).length;

  return { liCount, chipCount, cardCount, total: liCount + chipCount + cardCount };
}

function extractImages(html) {
  const images = [];
  const imgRegex = /<img[^>]*>/gi;
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    const imgTag = match[0];

    // Extract src
    const srcMatch = imgTag.match(/src="([^"]*)"/);
    const src = srcMatch ? srcMatch[1] : null;

    // Extract alt text
    const altMatch = imgTag.match(/alt="([^"]*)"/);
    const alt = altMatch ? altMatch[1] : null;

    // Extract dimensions if available
    const widthMatch = imgTag.match(/width="?(\d+)"?/);
    const heightMatch = imgTag.match(/height="?(\d+)"?/);
    const width = widthMatch ? parseInt(widthMatch[1], 10) : null;
    const height = heightMatch ? parseInt(heightMatch[1], 10) : null;

    // Check if it's a placeholder
    const isPlaceholder = /placeholder/i.test(imgTag) || !src || src.startsWith('data:image/svg');

    images.push({
      src,
      alt,
      width,
      height,
      area: width && height ? width * height : null,
      isPlaceholder,
    });
  }

  return images;
}

function extractSvgDiagrams(html) {
  const svgs = [];
  const svgRegex = /<svg[^>]*>([\s\S]*?)<\/svg>/gi;
  let match;

  while ((match = svgRegex.exec(html)) !== null) {
    const svgTag = match[0];
    const viewBoxMatch = svgTag.match(/viewBox="([^"]*)"/);
    const viewBox = viewBoxMatch ? viewBoxMatch[1] : null;

    let width = null;
    let height = null;
    if (viewBox) {
      const parts = viewBox.split(/\s+/);
      if (parts.length >= 4) {
        width = parseInt(parts[2], 10);
        height = parseInt(parts[3], 10);
      }
    }

    svgs.push({
      viewBox,
      width,
      height,
      area: width && height ? width * height : null,
    });
  }

  return svgs;
}

function extractMediaFrames(html) {
  const frames = [];
  const frameRegex = /<div[^>]*class="[^"]*media-frame[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  let match;

  while ((match = frameRegex.exec(html)) !== null) {
    const frameContent = match[1];
    const hasPlaceholder = /media-placeholder/.test(frameContent);
    const hasImage = /<img[^>]*class="[^"]*gen-media[^"]*"/.test(frameContent);
    const hasVideo = /<video/.test(frameContent);
    const isReady = /data-ready="true"/.test(match[0]);

    frames.push({
      hasPlaceholder,
      hasImage,
      hasVideo,
      isReady,
      isEmpty: hasPlaceholder && !hasImage && !hasVideo,
    });
  }

  return frames;
}

function analyzeSlide(slide, index) {
  const textContent = extractTextContent(slide.rawHtml);
  const wordCount = countWords(textContent);
  const charCount = textContent.length;
  const bullets = countBullets(slide.rawHtml);
  const images = extractImages(slide.rawHtml);
  const svgs = extractSvgDiagrams(slide.rawHtml);
  const mediaFrames = extractMediaFrames(slide.rawHtml);

  // Calculate image metrics
  const realImages = images.filter(img => !img.isPlaceholder);
  const totalImageArea = realImages.reduce((sum, img) => sum + (img.area || 0), 0);
  const totalSvgArea = svgs.reduce((sum, svg) => sum + (svg.area || 0), 0);
  const totalVisualArea = totalImageArea + totalSvgArea;

  // Calculate visual count (images + diagrams)
  const visualCount = realImages.length + svgs.length;

  // Text-to-visual ratio (higher = more text-heavy)
  // Uses word count as proxy for text density
  const textToVisualRatio = visualCount > 0
    ? Math.round((wordCount / visualCount) * 10) / 10
    : wordCount > 0 ? Infinity : 0;

  // Content density estimation (0-100 scale)
  // Based on word count relative to "ideal" slide (30-50 words)
  const idealWords = 40;
  const contentDensity = Math.min(100, Math.round((wordCount / idealWords) * 50));

  // Whitespace estimation (100 - contentDensity)
  const whitespaceEstimate = 100 - contentDensity;

  // Flag detection (factual, not judgmental)
  const flags = [];

  if (wordCount > THRESHOLDS.highWordCount) {
    flags.push({
      type: 'high_word_count',
      value: wordCount,
      threshold: THRESHOLDS.highWordCount,
    });
  }

  if (charCount > THRESHOLDS.highCharCount) {
    flags.push({
      type: 'high_char_count',
      value: charCount,
      threshold: THRESHOLDS.highCharCount,
    });
  }

  // Only flag missing visuals on content slides (not title/quote/metrics)
  const isContentSlide = ['split', 'grid', 'content'].includes(slide.slideType);
  if (isContentSlide && visualCount === 0 && wordCount > 20) {
    flags.push({
      type: 'no_visuals_on_content_slide',
      slideType: slide.slideType,
    });
  }

  if (bullets.total > THRESHOLDS.manyBullets) {
    flags.push({
      type: 'many_list_items',
      value: bullets.total,
      threshold: THRESHOLDS.manyBullets,
    });
  }

  const emptyFrames = mediaFrames.filter(f => f.isEmpty);
  if (emptyFrames.length > 0) {
    flags.push({
      type: 'empty_media_frames',
      count: emptyFrames.length,
    });
  }

  return {
    index: index + 1,
    title: slide.title,
    slideType: slide.slideType,
    theme: slide.theme,
    metrics: {
      wordCount,
      charCount,
      bulletCount: bullets.total,
      bulletBreakdown: {
        listItems: bullets.liCount,
        chips: bullets.chipCount,
        cards: bullets.cardCount,
      },
      imageCount: realImages.length,
      svgCount: svgs.length,
      visualCount,
      totalImageArea: totalImageArea || null,
      totalSvgArea: totalSvgArea || null,
      totalVisualArea: totalVisualArea || null,
      mediaFrameCount: mediaFrames.length,
      emptyMediaFrames: emptyFrames.length,
      textToVisualRatio,
      contentDensity,
      whitespaceEstimate,
    },
    flags,
  };
}

function calculateDeckAverages(slideAnalyses) {
  const count = slideAnalyses.length;
  if (count === 0) {
    return {
      avgWordCount: 0,
      avgCharCount: 0,
      avgBulletCount: 0,
      avgVisualCount: 0,
      avgContentDensity: 0,
      avgWhitespace: 0,
    };
  }

  const sum = slideAnalyses.reduce(
    (acc, s) => ({
      wordCount: acc.wordCount + s.metrics.wordCount,
      charCount: acc.charCount + s.metrics.charCount,
      bulletCount: acc.bulletCount + s.metrics.bulletCount,
      visualCount: acc.visualCount + s.metrics.visualCount,
      contentDensity: acc.contentDensity + s.metrics.contentDensity,
      whitespace: acc.whitespace + s.metrics.whitespaceEstimate,
    }),
    { wordCount: 0, charCount: 0, bulletCount: 0, visualCount: 0, contentDensity: 0, whitespace: 0 }
  );

  return {
    avgWordCount: Math.round(sum.wordCount / count),
    avgCharCount: Math.round(sum.charCount / count),
    avgBulletCount: Math.round((sum.bulletCount / count) * 10) / 10,
    avgVisualCount: Math.round((sum.visualCount / count) * 10) / 10,
    avgContentDensity: Math.round(sum.contentDensity / count),
    avgWhitespace: Math.round(sum.whitespace / count),
  };
}

function generateReport(deckPath, outputJson = false) {
  const htmlPath = path.join(deckPath, 'index.html');

  if (!fs.existsSync(htmlPath)) {
    console.error(`Deck not found: ${htmlPath}`);
    process.exit(1);
  }

  const html = fs.readFileSync(htmlPath, 'utf-8');
  const slides = extractSlides(html);

  if (slides.length === 0) {
    console.error('No slides found in deck');
    process.exit(1);
  }

  const slideAnalyses = slides.map((slide, i) => analyzeSlide(slide, i));
  const deckAverages = calculateDeckAverages(slideAnalyses);

  // Collect all flags
  const allFlags = slideAnalyses.flatMap(s =>
    s.flags.map(f => ({ ...f, slideIndex: s.index, slideTitle: s.title }))
  );

  // Group flags by type
  const flagsByType = allFlags.reduce((acc, flag) => {
    if (!acc[flag.type]) acc[flag.type] = [];
    acc[flag.type].push(flag);
    return acc;
  }, {});

  const report = {
    deckPath,
    slideCount: slides.length,
    thresholds: THRESHOLDS,
    deckAverages,
    slides: slideAnalyses,
    flagSummary: {
      totalFlags: allFlags.length,
      slidesWithFlags: new Set(allFlags.map(f => f.slideIndex)).size,
      flagsByType,
    },
  };

  if (outputJson) {
    console.log(JSON.stringify(report, null, 2));
    return report;
  }

  // Pretty print CLI output
  console.log(`\nVisual Density Analysis: ${deckPath}`);
  console.log('='.repeat(50));
  console.log(`\nSlides: ${slides.length}`);

  console.log('\nDeck Averages:');
  console.log(`  Words per slide: ${deckAverages.avgWordCount}`);
  console.log(`  Characters per slide: ${deckAverages.avgCharCount}`);
  console.log(`  Bullets/items per slide: ${deckAverages.avgBulletCount}`);
  console.log(`  Visuals per slide: ${deckAverages.avgVisualCount}`);
  console.log(`  Content density: ${deckAverages.avgContentDensity}%`);
  console.log(`  Whitespace estimate: ${deckAverages.avgWhitespace}%`);

  console.log('\nPer-Slide Metrics:');
  for (const slide of slideAnalyses) {
    const flagIndicator = slide.flags.length > 0 ? ` [${slide.flags.length} flags]` : '';
    console.log(`\n  Slide ${slide.index}: ${slide.title} (${slide.slideType})${flagIndicator}`);
    console.log(`    Words: ${slide.metrics.wordCount} | Chars: ${slide.metrics.charCount}`);
    console.log(`    Bullets: ${slide.metrics.bulletCount} | Visuals: ${slide.metrics.visualCount}`);
    console.log(`    Text:Visual ratio: ${slide.metrics.textToVisualRatio === Infinity ? 'N/A (no visuals)' : slide.metrics.textToVisualRatio}`);
    console.log(`    Content density: ${slide.metrics.contentDensity}% | Whitespace: ${slide.metrics.whitespaceEstimate}%`);

    if (slide.flags.length > 0) {
      console.log('    Flags:');
      for (const flag of slide.flags) {
        if (flag.type === 'high_word_count') {
          console.log(`      - High word count: ${flag.value} (threshold: ${flag.threshold})`);
        } else if (flag.type === 'high_char_count') {
          console.log(`      - High character count: ${flag.value} (threshold: ${flag.threshold})`);
        } else if (flag.type === 'no_visuals_on_content_slide') {
          console.log(`      - No visuals on ${flag.slideType} slide`);
        } else if (flag.type === 'many_list_items') {
          console.log(`      - Many list items: ${flag.value} (threshold: ${flag.threshold})`);
        } else if (flag.type === 'empty_media_frames') {
          console.log(`      - Empty media frames: ${flag.count}`);
        }
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Summary: ${allFlags.length} flags across ${report.flagSummary.slidesWithFlags} slides`);

  if (allFlags.length === 0) {
    console.log('No density flags detected.');
  }

  return report;
}

// Main
const args = process.argv.slice(2);
const deckPath = args.find(a => !a.startsWith('--')) || 'decks/skill-demo';
const outputJson = args.includes('--json');

generateReport(deckPath, outputJson);
