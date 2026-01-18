#!/usr/bin/env node
/**
 * ABOUTME: Export a Keynote-style deck to PDF using Playwright print styles.
 * ABOUTME: Supports local deck paths or http(s) URLs.
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const VIEWPORT = { width: 1600, height: 900 };

const usage = () => {
  console.log(`\nUsage: node scripts/export-pdf.js <deck-path|url> [--out PATH]\n\n` +
    `Examples:\n` +
    `  node scripts/export-pdf.js decks/my-pitch\n` +
    `  node scripts/export-pdf.js decks/my-pitch --out /tmp/my-pitch.pdf\n` +
    `  node scripts/export-pdf.js https://example.com/decks/my-pitch/index.html --out my-pitch.pdf\n`);
};

const isHttpUrl = (value) => /^https?:\/\//i.test(value);
const isFileUrl = (value) => /^file:\/\//i.test(value);

const resolveDeckPath = (deckArg) => {
  const resolved = path.resolve(deckArg);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Deck path not found: ${resolved}`);
  }
  if (fs.statSync(resolved).isDirectory()) {
    const indexPath = path.join(resolved, 'index.html');
    if (!fs.existsSync(indexPath)) {
      throw new Error(`index.html not found in ${resolved}`);
    }
    return indexPath;
  }
  return resolved;
};

const parseArgs = (args) => {
  let deckArg = null;
  let outputPath = null;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--out' || arg === '-o') {
      outputPath = args[i + 1] || null;
      i += 1;
      continue;
    }
    if (!arg.startsWith('-') && !deckArg) {
      deckArg = arg;
    }
  }

  if (!deckArg) return null;
  return { deckArg, outputPath };
};

const main = async () => {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    usage();
    process.exit(0);
  }

  const parsed = parseArgs(args);
  if (!parsed) {
    usage();
    process.exit(1);
  }

  const { deckArg } = parsed;
  let { outputPath } = parsed;
  let url;
  let deckId = 'deck';

  if (isHttpUrl(deckArg) || isFileUrl(deckArg)) {
    url = deckArg;
    if (!outputPath) {
      outputPath = path.resolve(process.cwd(), 'deck.pdf');
    }
  } else {
    const indexPath = resolveDeckPath(deckArg);
    const deckDir = path.dirname(indexPath);
    deckId = path.basename(deckDir);
    url = pathToFileURL(indexPath).href;
    if (!outputPath) {
      outputPath = path.join(deckDir, `${deckId}.pdf`);
    }
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: VIEWPORT });

  console.log(`Loading deck: ${url}`);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(1000);

  console.log(`Exporting PDF to: ${outputPath}`);
  await page.pdf({
    path: outputPath,
    printBackground: true,
    preferCSSPageSize: true,
  });

  await browser.close();
  console.log('PDF export complete.');
};

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
