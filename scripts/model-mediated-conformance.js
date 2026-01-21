#!/usr/bin/env node
// ABOUTME: Model-mediated conformance checker for deck workflow artifacts.
// ABOUTME: Validates required build/review artifacts and flags missing items.
const fs = require('fs');
const path = require('path');

function ensureFile(missing, deckPath, relativePath) {
  const fullPath = path.join(deckPath, relativePath);
  if (!fs.existsSync(fullPath)) {
    missing.push(relativePath);
  }
  return fullPath;
}

function ensureWorkRuns(missing, deckPath) {
  const workRunsDir = path.join(deckPath, 'resources', 'materials', 'work-runs');
  if (!fs.existsSync(workRunsDir)) {
    missing.push('resources/materials/work-runs');
    return;
  }
  const runFiles = fs.readdirSync(workRunsDir).filter((name) => name.endsWith('.json'));
  if (runFiles.length === 0) {
    missing.push('resources/materials/work-runs (no JSON files)');
  }
}

function checkBuild(deckPath) {
  const missing = [];
  ensureFile(missing, deckPath, 'resources/materials/ingestion.json');
  ensureFile(missing, deckPath, 'resources/materials/narrative-build-prompts.json');
  ensureWorkRuns(missing, deckPath);
  return missing;
}

function checkReview(deckPath) {
  const missing = [];
  const reviewContext = ensureFile(missing, deckPath, 'resources/materials/review-context.json');
  const reviewPrompts = ensureFile(missing, deckPath, 'resources/materials/review-prompts.json');
  const analysisSummary = ensureFile(missing, deckPath, 'resources/materials/analysis-summary.json');

  if (fs.existsSync(reviewContext) && fs.existsSync(reviewPrompts) && fs.existsSync(analysisSummary)) {
    try {
      const summary = JSON.parse(fs.readFileSync(analysisSummary, 'utf-8'));
      if (!Array.isArray(summary.analysisFlags)) {
        missing.push('analysis-summary.json (missing analysisFlags)');
      }
    } catch (err) {
      missing.push(`analysis-summary.json (invalid JSON: ${err.message})`);
    }
  }

  return missing;
}

function main() {
  const args = process.argv.slice(2);
  const deckPath = args.find((arg) => !arg.startsWith('--'));
  const checkReviewMode = args.includes('--review');

  if (!deckPath) {
    console.error('Usage: node scripts/model-mediated-conformance.js decks/<deck-id> [--review]');
    process.exit(1);
  }

  if (!fs.existsSync(deckPath)) {
    console.error(`Deck path not found: ${deckPath}`);
    process.exit(1);
  }

  const missing = checkBuild(deckPath);
  if (checkReviewMode) {
    missing.push(...checkReview(deckPath));
  }

  if (missing.length > 0) {
    console.error('Conformance FAILED. Missing artifacts:');
    missing.forEach((item) => console.error(`- ${item}`));
    process.exit(1);
  }

  console.log('Conformance OK.');
}

main();
