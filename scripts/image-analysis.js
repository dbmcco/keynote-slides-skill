#!/usr/bin/env node
/**
 * Image Meaningfulness Analysis
 *
 * Extracts per-slide image data for model-mediated review.
 * Gathers factual data - judgment happens in the model layer.
 *
 * Usage:
 *   node scripts/image-analysis.js decks/my-deck
 *   node scripts/image-analysis.js decks/my-deck --json
 */

const fs = require('fs');
const path = require('path');

/**
 * Extract all image data from a slide's HTML content
 */
function extractImagesFromSlide(slideHtml, slideIndex, slideTitle) {
  const images = [];

  // Match img tags with various attributes
  const imgRegex = /<img[^>]*>/gi;
  let imgMatch;

  while ((imgMatch = imgRegex.exec(slideHtml)) !== null) {
    const imgTag = imgMatch[0];

    // Extract src
    const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
    const src = srcMatch ? srcMatch[1] : null;

    // Extract alt text
    const altMatch = imgTag.match(/alt=["']([^"']*)["']/i);
    const alt = altMatch ? altMatch[1] : null;

    // Extract data-prompt (generation prompt if present)
    const promptMatch = imgTag.match(/data-prompt=["']([^"']*)["']/i);
    const dataPrompt = promptMatch ? promptMatch[1] : null;

    // Extract data-gen (generation mode)
    const genMatch = imgTag.match(/data-gen=["']([^"']*)["']/i);
    const dataGen = genMatch ? genMatch[1] : null;

    // Check if in media-frame
    const beforeImg = slideHtml.substring(0, imgMatch.index);
    const mediaFrameOpen = beforeImg.lastIndexOf('media-frame');
    const divCloseBeforeFrame = beforeImg.lastIndexOf('</div>');
    const inMediaFrame = mediaFrameOpen > divCloseBeforeFrame;

    // Extract filename from src (often descriptive)
    let filename = null;
    if (src) {
      const parts = src.split('/');
      filename = parts[parts.length - 1];
    }

    images.push({
      src,
      alt,
      filename,
      dataPrompt,
      dataGen,
      inMediaFrame,
      hasAlt: alt !== null && alt.trim().length > 0,
    });
  }

  return images;
}

/**
 * Extract surrounding text context for a slide
 */
function extractTextContext(slideHtml) {
  // Extract headline (h1, h2 with title class, or section-title)
  let headline = null;
  const h1Match = slideHtml.match(/<h1[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i);
  const h2Match = slideHtml.match(/<h2[^>]*class="[^"]*(?:section-title|title)[^"]*"[^>]*>([\s\S]*?)<\/h2>/i);

  if (h1Match) {
    headline = h1Match[1].replace(/<[^>]+>/g, '').trim();
  } else if (h2Match) {
    headline = h2Match[1].replace(/<[^>]+>/g, '').trim();
  }

  // Extract eyebrow text
  const eyebrowMatch = slideHtml.match(/<div[^>]*class="[^"]*eyebrow[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  const eyebrow = eyebrowMatch ? eyebrowMatch[1].replace(/<[^>]+>/g, '').trim() : null;

  // Extract body text
  const bodyMatches = slideHtml.matchAll(/<p[^>]*class="[^"]*(?:body-text|subtitle)[^"]*"[^>]*>([\s\S]*?)<\/p>/gi);
  const bodyText = [];
  for (const match of bodyMatches) {
    const text = match[1].replace(/<[^>]+>/g, '').trim();
    if (text) bodyText.push(text);
  }

  // Extract quote text
  const quoteMatch = slideHtml.match(/<p[^>]*class="[^"]*quote[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
  const quote = quoteMatch ? quoteMatch[1].replace(/<[^>]+>/g, '').replace(/<br\s*\/?>/gi, ' ').trim() : null;

  // Extract chips/tags
  const chipMatches = slideHtml.matchAll(/<div[^>]*class="[^"]*chip[^"]*"[^>]*>([\s\S]*?)<\/div>/gi);
  const chips = [];
  for (const match of chipMatches) {
    const text = match[1].replace(/<[^>]+>/g, '').trim();
    if (text && !text.includes('chip-row')) chips.push(text);
  }

  // Extract card titles and captions
  const cardTitleMatches = slideHtml.matchAll(/<div[^>]*class="[^"]*card-title[^"]*"[^>]*>([\s\S]*?)<\/div>/gi);
  const cardTitles = [];
  for (const match of cardTitleMatches) {
    const text = match[1].replace(/<[^>]+>/g, '').trim();
    if (text) cardTitles.push(text);
  }

  return {
    headline,
    eyebrow,
    bodyText,
    quote,
    chips,
    cardTitles,
  };
}

/**
 * Extract slide data from deck HTML
 */
function extractSlideData(html) {
  const slides = [];
  const slideRegex = /<section[^>]*class="slide[^"]*"[^>]*data-title="([^"]*)"[^>]*>([\s\S]*?)<\/section>/g;

  let match;
  let index = 0;

  while ((match = slideRegex.exec(html)) !== null) {
    index++;
    const title = match[1];
    const content = match[2];

    const images = extractImagesFromSlide(content, index, title);
    const textContext = extractTextContext(content);

    // Determine if slide is text-only (no images)
    const isTextOnly = images.length === 0;

    // Check for empty media frames (placeholder without actual image)
    const hasEmptyMediaFrame = content.includes('media-placeholder') &&
      !content.includes('data-ready="true"');

    slides.push({
      index,
      title,
      images,
      textContext,
      isTextOnly,
      hasEmptyMediaFrame,
      imageCount: images.length,
    });
  }

  return slides;
}

/**
 * Generate analysis report
 */
function generateReport(deckPath, outputJson = false) {
  const htmlPath = path.join(deckPath, 'index.html');

  if (!fs.existsSync(htmlPath)) {
    console.error(`Deck not found: ${htmlPath}`);
    process.exit(1);
  }

  const html = fs.readFileSync(htmlPath, 'utf-8');
  const slides = extractSlideData(html);

  // Summary stats
  const totalSlides = slides.length;
  const slidesWithImages = slides.filter(s => s.imageCount > 0).length;
  const textOnlySlides = slides.filter(s => s.isTextOnly).length;
  const slidesWithEmptyFrames = slides.filter(s => s.hasEmptyMediaFrame).length;

  // Image stats
  const allImages = slides.flatMap(s => s.images);
  const totalImages = allImages.length;
  const imagesWithAlt = allImages.filter(i => i.hasAlt).length;
  const imagesWithPrompt = allImages.filter(i => i.dataPrompt).length;
  const imagesInMediaFrame = allImages.filter(i => i.inMediaFrame).length;

  const report = {
    deckPath,
    summary: {
      totalSlides,
      slidesWithImages,
      textOnlySlides,
      slidesWithEmptyFrames,
      totalImages,
      imagesWithAlt,
      imagesMissingAlt: totalImages - imagesWithAlt,
      imagesWithPrompt,
      imagesInMediaFrame,
      standaloneImages: totalImages - imagesInMediaFrame,
    },
    slides,
  };

  if (outputJson) {
    console.log(JSON.stringify(report, null, 2));
    return report;
  }

  // Pretty print
  console.log(`\nImage Analysis: ${deckPath}`);
  console.log('='.repeat(50));
  console.log(`\nSlides: ${totalSlides} total, ${slidesWithImages} with images, ${textOnlySlides} text-only`);
  console.log(`Images: ${totalImages} total, ${imagesWithAlt} with alt text, ${imagesWithPrompt} with prompts`);

  if (slidesWithEmptyFrames > 0) {
    console.log(`\nEmpty media frames: ${slidesWithEmptyFrames}`);
  }

  console.log('\n--- Per-Slide Breakdown ---\n');

  for (const slide of slides) {
    console.log(`Slide ${slide.index}: ${slide.title}`);

    if (slide.textContext.headline) {
      console.log(`  Headline: "${slide.textContext.headline}"`);
    }

    if (slide.isTextOnly) {
      console.log('  [TEXT-ONLY] No images on this slide');
      if (slide.hasEmptyMediaFrame) {
        console.log('  [EMPTY FRAME] Has media placeholder without content');
      }
    } else {
      for (const img of slide.images) {
        console.log(`  Image: ${img.filename || img.src}`);
        if (img.hasAlt) {
          console.log(`    Alt: "${img.alt}"`);
        } else {
          console.log('    Alt: [MISSING]');
        }
        if (img.dataPrompt) {
          console.log(`    Prompt: "${img.dataPrompt}"`);
        }
        console.log(`    In media-frame: ${img.inMediaFrame ? 'yes' : 'no (standalone)'}`);
      }
    }

    if (slide.textContext.bodyText.length > 0) {
      console.log(`  Body text: "${slide.textContext.bodyText[0].substring(0, 60)}..."`);
    }

    console.log('');
  }

  console.log('='.repeat(50));
  console.log('Analysis complete. Use --json for machine-readable output.\n');

  return report;
}

// Save report for model-mediated review
function saveForReview(deckPath, report) {
  const outputPath = path.join(deckPath, 'resources', 'materials', 'image-analysis.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`Saved analysis to: ${outputPath}`);
}

// Main
const args = process.argv.slice(2);
const deckPath = args.find(a => !a.startsWith('--')) || 'decks/skill-demo';
const outputJson = args.includes('--json');
const saveReport = args.includes('--save');

const report = generateReport(deckPath, outputJson);

if (saveReport && report) {
  saveForReview(deckPath, report);
}
