#!/usr/bin/env node
/**
 * Design Quality Analysis Script
 *
 * Uses Playwright to capture visual metrics from rendered slides:
 * - Typography hierarchy (heading vs body font sizes)
 * - Color contrast between text and backgrounds
 * - Element positions for balance analysis
 * - Consistency across similar slide types
 * - Grid alignment
 *
 * Usage:
 *   node scripts/design-quality.js [deck-path] [--serve] [--json]
 *
 * Examples:
 *   node scripts/design-quality.js decks/skill-demo
 *   node scripts/design-quality.js decks/skill-demo --serve --json
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const VIEWPORT = { width: 1280, height: 800 };
const OUTPUT_DIR = '/tmp/design-quality';

// Grid positions for alignment checking (percentage-based)
const GRID_POSITIONS = [0, 10, 20, 25, 33.33, 50, 66.67, 75, 80, 90, 100];
const GRID_TOLERANCE = 2; // Percentage tolerance for "snapping"

// Typography hierarchy thresholds
const HIERARCHY_THRESHOLDS = {
  excellent: 1.8, // Heading 1.8x+ body size
  good: 1.5,
  acceptable: 1.3,
  poor: 1.0, // Below this is poor hierarchy
};

// Minimum contrast ratios (simplified WCAG-inspired)
const CONTRAST_THRESHOLDS = {
  excellent: 7,
  good: 4.5,
  acceptable: 3,
};

async function startServer(port = 8922) {
  return new Promise((resolve) => {
    const server = spawn('python3', ['-m', 'http.server', port.toString()], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    server.stdout.on('data', () => resolve(server));
    server.stderr.on('data', (data) => {
      if (data.toString().includes('Serving')) resolve(server);
    });

    setTimeout(() => resolve(server), 1000);
  });
}

/**
 * Calculate relative luminance for contrast ratio
 */
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(rgb1, rgb2) {
  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Parse CSS color to RGB
 */
function parseColor(color) {
  if (!color) return { r: 0, g: 0, b: 0 };

  // Handle rgb/rgba
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return { r: parseInt(rgbMatch[1]), g: parseInt(rgbMatch[2]), b: parseInt(rgbMatch[3]) };
  }

  // Handle hex
  const hexMatch = color.match(/#([a-fA-F0-9]{6})/);
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1].substring(0, 2), 16),
      g: parseInt(hexMatch[1].substring(2, 4), 16),
      b: parseInt(hexMatch[1].substring(4, 6), 16),
    };
  }

  return { r: 0, g: 0, b: 0 };
}

/**
 * Check if a position snaps to grid
 */
function snapsToGrid(position, containerSize) {
  const percentage = (position / containerSize) * 100;
  return GRID_POSITIONS.some((grid) => Math.abs(percentage - grid) <= GRID_TOLERANCE);
}

/**
 * Calculate visual weight distribution
 */
function calculateWeightDistribution(elements, viewport) {
  if (elements.length === 0) {
    return { horizontal: 'balanced', vertical: 'balanced', score: 1 };
  }

  let leftWeight = 0;
  let rightWeight = 0;
  let topWeight = 0;
  let bottomWeight = 0;

  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;

  for (const el of elements) {
    const elCenterX = el.x + el.width / 2;
    const elCenterY = el.y + el.height / 2;
    const weight = el.width * el.height; // Area as weight proxy

    if (elCenterX < centerX) {
      leftWeight += weight * (1 - elCenterX / centerX);
    } else {
      rightWeight += weight * (elCenterX / centerX - 1);
    }

    if (elCenterY < centerY) {
      topWeight += weight * (1 - elCenterY / centerY);
    } else {
      bottomWeight += weight * (elCenterY / centerY - 1);
    }
  }

  const totalHorizontal = leftWeight + rightWeight || 1;
  const totalVertical = topWeight + bottomWeight || 1;

  const horizontalRatio = leftWeight / totalHorizontal;
  const verticalRatio = topWeight / totalVertical;

  // Score: 1.0 = perfectly balanced, 0.0 = completely one-sided
  const horizontalScore = 1 - Math.abs(horizontalRatio - 0.5) * 2;
  const verticalScore = 1 - Math.abs(verticalRatio - 0.5) * 2;

  return {
    horizontal: horizontalRatio < 0.35 ? 'left-heavy' : horizontalRatio > 0.65 ? 'right-heavy' : 'balanced',
    vertical: verticalRatio < 0.35 ? 'top-heavy' : verticalRatio > 0.65 ? 'bottom-heavy' : 'balanced',
    horizontalRatio: Math.round(horizontalRatio * 100),
    verticalRatio: Math.round(verticalRatio * 100),
    score: (horizontalScore + verticalScore) / 2,
  };
}

/**
 * Classify layout based on element positions
 */
function classifyLayout(elements, viewport) {
  if (elements.length === 0) return 'empty';

  const centerX = viewport.width / 2;
  const tolerance = viewport.width * 0.15;

  let centeredCount = 0;
  let leftCount = 0;
  let rightCount = 0;

  for (const el of elements) {
    const elCenterX = el.x + el.width / 2;
    if (Math.abs(elCenterX - centerX) < tolerance) {
      centeredCount++;
    } else if (elCenterX < centerX) {
      leftCount++;
    } else {
      rightCount++;
    }
  }

  const total = elements.length;
  if (centeredCount / total > 0.7) return 'centered';
  if (leftCount > 0 && rightCount > 0 && Math.abs(leftCount - rightCount) <= 1) return 'split';
  if (leftCount > rightCount * 2) return 'left-aligned';
  if (rightCount > leftCount * 2) return 'right-aligned';
  return 'asymmetric';
}

/**
 * Extract design metrics from a single slide
 */
async function extractSlideMetrics(page, slideIndex) {
  return await page.evaluate(
    ({ viewport }) => {
      const activeSlide = document.querySelector('.slide.is-active');
      if (!activeSlide) return null;

      const slideInner = activeSlide.querySelector('.slide-inner');
      const theme = activeSlide.classList.contains('theme-ink') ? 'ink' : 'ivory';
      const layout = [...(slideInner?.classList || [])].find((c) => c.startsWith('layout-'))?.replace('layout-', '') || 'unknown';

      // Get all significant elements with their bounding boxes
      const elements = [];
      const significantSelectors = ['.title', '.section-title', '.subtitle', '.body-text', '.card', '.media-frame', '.quote', '.metric', '.chip-row'];

      for (const selector of significantSelectors) {
        const els = activeSlide.querySelectorAll(selector);
        for (const el of els) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            elements.push({
              type: selector.replace('.', ''),
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            });
          }
        }
      }

      // Typography analysis
      const headings = activeSlide.querySelectorAll('.title, .section-title, .quote');
      const bodyText = activeSlide.querySelectorAll('.subtitle, .body-text, .card-caption');

      let headingSize = 0;
      let bodySize = 0;

      for (const h of headings) {
        const computed = window.getComputedStyle(h);
        const size = parseFloat(computed.fontSize);
        if (size > headingSize) headingSize = size;
      }

      for (const b of bodyText) {
        const computed = window.getComputedStyle(b);
        const size = parseFloat(computed.fontSize);
        if (size > bodySize) bodySize = size;
      }

      // Color contrast analysis
      const textElements = activeSlide.querySelectorAll('.title, .section-title, .subtitle, .body-text, .quote');
      const contrastSamples = [];

      // Get slide background color
      const slideStyle = window.getComputedStyle(slideInner);
      const bgColor = slideStyle.backgroundColor;

      for (const el of textElements) {
        const computed = window.getComputedStyle(el);
        contrastSamples.push({
          element: el.className,
          color: computed.color,
          background: bgColor,
        });
      }

      // Grid alignment check
      const alignmentResults = [];
      for (const el of elements) {
        alignmentResults.push({
          type: el.type,
          xAligned: false, // Will be calculated in Node
          yAligned: false,
          x: el.x,
          y: el.y,
        });
      }

      return {
        theme,
        layout,
        elements,
        typography: {
          headingSize,
          bodySize,
          ratio: bodySize > 0 ? headingSize / bodySize : 0,
        },
        contrast: contrastSamples,
        alignmentResults,
      };
    },
    { viewport: VIEWPORT }
  );
}

/**
 * Calculate typography hierarchy score
 */
function scoreTypographyHierarchy(ratio) {
  if (ratio >= HIERARCHY_THRESHOLDS.excellent) return { score: 'excellent', value: 1.0 };
  if (ratio >= HIERARCHY_THRESHOLDS.good) return { score: 'good', value: 0.8 };
  if (ratio >= HIERARCHY_THRESHOLDS.acceptable) return { score: 'acceptable', value: 0.6 };
  if (ratio >= HIERARCHY_THRESHOLDS.poor) return { score: 'poor', value: 0.3 };
  return { score: 'very-poor', value: 0.0 };
}

/**
 * Analyze consistency across similar slide types
 */
function analyzeConsistency(slideMetrics) {
  const byLayout = {};

  for (const slide of slideMetrics) {
    const layout = slide.layout;
    if (!byLayout[layout]) {
      byLayout[layout] = [];
    }
    byLayout[layout].push(slide);
  }

  const consistencyIssues = [];

  for (const [layout, slides] of Object.entries(byLayout)) {
    if (slides.length < 2) continue;

    // Check typography consistency within same layout type
    const headingSizes = slides.map((s) => s.typography.headingSize).filter((s) => s > 0);
    const bodySizes = slides.map((s) => s.typography.bodySize).filter((s) => s > 0);

    if (headingSizes.length > 1) {
      const headingVariance = Math.max(...headingSizes) - Math.min(...headingSizes);
      if (headingVariance > 8) {
        consistencyIssues.push({
          type: 'typography-variance',
          layout,
          message: `Heading sizes vary by ${headingVariance.toFixed(1)}px across ${layout} slides`,
          severity: headingVariance > 16 ? 'high' : 'medium',
        });
      }
    }

    // Check element count consistency
    const elementCounts = slides.map((s) => s.elements.length);
    const countVariance = Math.max(...elementCounts) - Math.min(...elementCounts);
    if (countVariance > 3) {
      consistencyIssues.push({
        type: 'element-count-variance',
        layout,
        message: `Element counts vary significantly in ${layout} slides (${Math.min(...elementCounts)}-${Math.max(...elementCounts)})`,
        severity: 'low',
      });
    }
  }

  return { byLayout, issues: consistencyIssues };
}

/**
 * Main analysis function
 */
async function analyzeDesignQuality(url, maxSlides = 20) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: VIEWPORT });

  await page.goto(url);
  await page.waitForTimeout(2000);

  const slideCount = await page.locator('.slide').count();
  const slideMetrics = [];
  const flags = [];

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (let i = 0; i < Math.min(slideCount, maxSlides); i++) {
    const title = (await page.locator('.slide.is-active').getAttribute('data-title')) || `Slide ${i + 1}`;

    const metrics = await extractSlideMetrics(page, i);
    if (!metrics) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(600);
      continue;
    }

    // Calculate additional metrics in Node
    const weightDistribution = calculateWeightDistribution(metrics.elements, VIEWPORT);
    const layoutClassification = classifyLayout(metrics.elements, VIEWPORT);
    const typographyScore = scoreTypographyHierarchy(metrics.typography.ratio);

    // Calculate contrast ratios
    const contrastResults = [];
    for (const sample of metrics.contrast) {
      const textColor = parseColor(sample.color);
      const bgColor = parseColor(sample.background);
      const ratio = getContrastRatio(textColor, bgColor);
      contrastResults.push({
        element: sample.element,
        ratio: Math.round(ratio * 10) / 10,
        passes: ratio >= CONTRAST_THRESHOLDS.acceptable,
      });
    }

    // Check grid alignment
    let alignedCount = 0;
    for (const el of metrics.elements) {
      const xAligned = snapsToGrid(el.x, VIEWPORT.width);
      const yAligned = snapsToGrid(el.y, VIEWPORT.height);
      if (xAligned || yAligned) alignedCount++;
    }
    const gridAlignmentScore = metrics.elements.length > 0 ? alignedCount / metrics.elements.length : 1;

    const slideResult = {
      index: i + 1,
      title,
      theme: metrics.theme,
      layout: metrics.layout,
      typography: {
        ...metrics.typography,
        hierarchyScore: typographyScore,
      },
      balance: weightDistribution,
      layoutClassification,
      contrast: {
        samples: contrastResults,
        worstRatio: contrastResults.length > 0 ? Math.min(...contrastResults.map((c) => c.ratio)) : null,
        allPass: contrastResults.every((c) => c.passes),
      },
      gridAlignment: {
        score: Math.round(gridAlignmentScore * 100),
        alignedElements: alignedCount,
        totalElements: metrics.elements.length,
      },
      elementCount: metrics.elements.length,
    };

    slideMetrics.push(slideResult);

    // Flag issues for this slide
    if (typographyScore.score === 'poor' || typographyScore.score === 'very-poor') {
      flags.push({
        slide: i + 1,
        title,
        type: 'poor-hierarchy',
        message: `Typography hierarchy is ${typographyScore.score} (ratio: ${metrics.typography.ratio.toFixed(2)})`,
        severity: 'high',
      });
    }

    if (weightDistribution.score < 0.5) {
      flags.push({
        slide: i + 1,
        title,
        type: 'imbalanced-layout',
        message: `Layout is ${weightDistribution.horizontal} and ${weightDistribution.vertical}`,
        severity: 'medium',
      });
    }

    if (!slideResult.contrast.allPass) {
      const failedCount = contrastResults.filter((c) => !c.passes).length;
      flags.push({
        slide: i + 1,
        title,
        type: 'contrast-issue',
        message: `${failedCount} element(s) have insufficient contrast (min ratio: ${slideResult.contrast.worstRatio})`,
        severity: slideResult.contrast.worstRatio < 2 ? 'high' : 'medium',
      });
    }

    if (gridAlignmentScore < 0.5) {
      flags.push({
        slide: i + 1,
        title,
        type: 'grid-misalignment',
        message: `Only ${slideResult.gridAlignment.score}% of elements align to grid`,
        severity: 'low',
      });
    }

    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(600);
  }

  await browser.close();

  // Analyze consistency across slides
  const consistency = analyzeConsistency(slideMetrics);
  flags.push(...consistency.issues.map((issue) => ({ ...issue, slide: 'global' })));

  return {
    deckUrl: url,
    slideCount,
    analyzedSlides: slideMetrics.length,
    slides: slideMetrics,
    consistency: {
      layoutDistribution: Object.fromEntries(Object.entries(consistency.byLayout).map(([k, v]) => [k, v.length])),
      issues: consistency.issues,
    },
    flags,
    summary: {
      totalFlags: flags.length,
      byType: flags.reduce((acc, f) => {
        acc[f.type] = (acc[f.type] || 0) + 1;
        return acc;
      }, {}),
      bySeverity: flags.reduce((acc, f) => {
        acc[f.severity] = (acc[f.severity] || 0) + 1;
        return acc;
      }, {}),
    },
  };
}

async function main() {
  const args = process.argv.slice(2);
  const deckPath = args.find((a) => !a.startsWith('--')) || 'decks/skill-demo';
  const shouldServe = args.includes('--serve');
  const outputJson = args.includes('--json');

  let server = null;
  let url;

  if (shouldServe) {
    const port = 8922;
    server = await startServer(port);
    url = `http://localhost:${port}/${deckPath}/index.html`;
    console.log(`Started local server on port ${port}`);
  } else {
    url = `https://dbmcco.github.io/keynote-slides-skill/${deckPath}/index.html`;
  }

  console.log(`Analyzing design quality: ${url}\n`);

  try {
    const result = await analyzeDesignQuality(url);

    if (outputJson) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    // Pretty print report
    console.log(`Design Quality Report: ${deckPath}`);
    console.log('='.repeat(60));
    console.log(`\nSlides Analyzed: ${result.analyzedSlides}/${result.slideCount}`);

    console.log('\n--- Layout Distribution ---');
    for (const [layout, count] of Object.entries(result.consistency.layoutDistribution)) {
      console.log(`  ${layout}: ${count} slide(s)`);
    }

    console.log('\n--- Slide Analysis ---\n');
    for (const slide of result.slides) {
      console.log(`Slide ${slide.index}: ${slide.title}`);
      console.log(`  Theme: ${slide.theme} | Layout: ${slide.layout} (${slide.layoutClassification})`);
      console.log(`  Typography: ${slide.typography.hierarchyScore.score} (ratio ${slide.typography.ratio.toFixed(2)})`);
      console.log(`  Balance: ${slide.balance.horizontal}/${slide.balance.vertical} (score: ${(slide.balance.score * 100).toFixed(0)}%)`);
      console.log(`  Grid Alignment: ${slide.gridAlignment.score}%`);
      if (slide.contrast.worstRatio !== null) {
        console.log(`  Contrast: ${slide.contrast.allPass ? 'Pass' : 'FAIL'} (min ratio: ${slide.contrast.worstRatio})`);
      }
      console.log('');
    }

    if (result.flags.length > 0) {
      console.log('--- Flags ---\n');
      const bySeverity = { high: [], medium: [], low: [] };
      for (const flag of result.flags) {
        bySeverity[flag.severity].push(flag);
      }

      for (const severity of ['high', 'medium', 'low']) {
        if (bySeverity[severity].length === 0) continue;
        const icon = severity === 'high' ? '!!!' : severity === 'medium' ? '!!' : '!';
        console.log(`[${icon}] ${severity.toUpperCase()} (${bySeverity[severity].length}):`);
        for (const flag of bySeverity[severity]) {
          const slideRef = flag.slide === 'global' ? 'Global' : `Slide ${flag.slide}`;
          console.log(`  - ${slideRef}: ${flag.message}`);
        }
        console.log('');
      }
    } else {
      console.log('\nNo design issues flagged.');
    }

    console.log('='.repeat(60));
    console.log(`Summary: ${result.summary.totalFlags} flag(s)`);

    // Save JSON output
    const outputPath = path.join(OUTPUT_DIR, 'design-quality.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`\nFull report saved to: ${outputPath}`);
  } finally {
    if (server) {
      server.kill();
    }
  }
}

main().catch(console.error);
