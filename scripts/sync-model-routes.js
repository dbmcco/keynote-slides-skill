#!/usr/bin/env node
// ABOUTME: Generates browser-readable route data from the central registry.
// ABOUTME: Used by static deck previews so templates do not hardcode concrete models.

const fs = require('fs');
const path = require('path');

const { ROUTES, loadRoutes } = require('./model-routes');

const repoRoot = path.resolve(__dirname, '..');
const outputPath = path.join(repoRoot, 'decks', 'model-routes.js');
const browserRouteIds = [
  ROUTES.imageGeneration,
  ROUTES.geminiVideoPrimary,
  ROUTES.geminiVideoSecondary,
];

function main() {
  const routes = loadRoutes();
  const browserRoutes = {};
  for (const routeId of browserRouteIds) {
    if (!routes[routeId]) {
      throw new Error(`Missing model route: ${routeId}`);
    }
    browserRoutes[routeId] = routes[routeId];
  }

  const body = [
    '// ABOUTME: Generated from paia-agent-runtime central model registry.',
    '// ABOUTME: Do not edit by hand; run scripts/sync-model-routes.js.',
    `window.KEYNOTE_MODEL_ROUTES = ${JSON.stringify(browserRoutes, null, 2)};`,
    '',
  ].join('\n');

  fs.writeFileSync(outputPath, body);
  console.log(`Synced model routes: ${path.relative(repoRoot, outputPath)}`);
}

main();
