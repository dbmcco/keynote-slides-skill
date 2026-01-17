#!/usr/bin/env node
/**
 * Layout Review Script
 *
 * Uses Playwright to screenshot slides and output layout analysis.
 * Can be run manually or as a Claude Code hook after deck changes.
 *
 * Usage:
 *   node scripts/layout-review.js [deck-path] [--serve]
 *
 * Examples:
 *   node scripts/layout-review.js decks/skill-demo
 *   node scripts/layout-review.js decks/skill-demo --serve
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const VIEWPORT = { width: 1280, height: 800 };
const SCREENSHOT_DIR = '/tmp/layout-review';

async function startServer(port = 8921) {
  return new Promise((resolve, reject) => {
    const server = spawn('python3', ['-m', 'http.server', port.toString()], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe']
    });

    server.stdout.on('data', () => resolve(server));
    server.stderr.on('data', (data) => {
      if (data.toString().includes('Serving')) resolve(server);
    });

    setTimeout(() => resolve(server), 1000);
  });
}

async function captureSlides(url, maxSlides = 6) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: VIEWPORT });

  await page.goto(url);
  await page.waitForTimeout(2000);

  const slideCount = await page.locator('.slide').count();
  const screenshots = [];

  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  for (let i = 0; i < Math.min(slideCount, maxSlides); i++) {
    const filepath = path.join(SCREENSHOT_DIR, `slide-${i + 1}.png`);
    await page.screenshot({ path: filepath });
    screenshots.push({ index: i + 1, path: filepath });

    // Get slide title
    const title = await page.locator('.slide.is-active').getAttribute('data-title') || `Slide ${i + 1}`;
    screenshots[i].title = title;

    // Check for common layout issues
    const issues = [];

    // Check if images are cropped (overflow hidden)
    const images = await page.locator('.slide.is-active img').all();
    for (const img of images) {
      const box = await img.boundingBox();
      if (box && (box.y < 0 || box.y + box.height > VIEWPORT.height)) {
        issues.push('Image may be cropped vertically');
      }
    }

    // Check for empty media frames
    const emptyFrames = await page.locator('.slide.is-active .media-placeholder').count();
    if (emptyFrames > 0) {
      issues.push('Contains empty media placeholder');
    }

    screenshots[i].issues = issues;

    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(600);
  }

  await browser.close();
  return { slideCount, screenshots };
}

async function main() {
  const args = process.argv.slice(2);
  const deckPath = args.find(a => !a.startsWith('--')) || 'decks/skill-demo';
  const shouldServe = args.includes('--serve');

  let server = null;
  let url;

  if (shouldServe) {
    const port = 8921;
    server = await startServer(port);
    url = `http://localhost:${port}/${deckPath}/index.html`;
    console.log(`Started local server on port ${port}`);
  } else {
    // Try GitHub Pages URL first
    url = `https://dbmcco.github.io/keynote-slides-skill/${deckPath}/index.html`;
  }

  console.log(`Reviewing: ${url}\n`);

  try {
    const result = await captureSlides(url);

    console.log(`Found ${result.slideCount} slides\n`);
    console.log('Layout Review Results:');
    console.log('======================\n');

    for (const slide of result.screenshots) {
      console.log(`Slide ${slide.index}: ${slide.title}`);
      console.log(`  Screenshot: ${slide.path}`);
      if (slide.issues.length > 0) {
        console.log(`  ⚠️  Issues:`);
        slide.issues.forEach(issue => console.log(`      - ${issue}`));
      } else {
        console.log(`  ✓ No issues detected`);
      }
      console.log('');
    }

    console.log(`\nScreenshots saved to: ${SCREENSHOT_DIR}`);
  } finally {
    if (server) {
      server.kill();
    }
  }
}

main().catch(console.error);
