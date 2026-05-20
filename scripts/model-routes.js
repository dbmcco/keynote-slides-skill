// ABOUTME: Node access to central model routes for Keynote scripts.
// ABOUTME: Delegates resolution to paia-agent-runtime instead of parsing registry data locally.

const { execFileSync } = require('child_process');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const experimentsRoot = path.resolve(repoRoot, '..');
const runtimeSrc = path.join(experimentsRoot, 'paia-agent-runtime', 'src');

const ROUTES = Object.freeze({
  imageGeneration: 'keynote.image_generation',
  geminiVideoPrimary: 'keynote.gemini_video_primary',
  geminiVideoSecondary: 'keynote.gemini_video_secondary',
  kieVeoQuality: 'keynote.kie_veo_quality',
  kieVeoFast: 'keynote.kie_veo_fast',
});

const routeIds = Object.freeze(Object.values(ROUTES));

let cachedRoutes = null;

function loadRoutes() {
  if (cachedRoutes) return cachedRoutes;
  const script = [
    'import json',
    'from paia_agent_runtime import CognitionRegistry',
    'registry = CognitionRegistry()',
    `route_ids = ${JSON.stringify(routeIds)}`,
    'rows = {}',
    'for route_id in route_ids:',
    '    route = registry.model_route(route_id)',
    '    rows[route.id] = {"id": route.id, "provider": route.provider, "surface": route.surface, "model": route.model, "base_url": route.base_url or "", "api_key_env": route.api_key_env or ""}',
    'print(json.dumps(rows, sort_keys=True))',
  ].join('\n');
  const env = {
    ...process.env,
    PYTHONPATH: [runtimeSrc, process.env.PYTHONPATH].filter(Boolean).join(path.delimiter),
  };
  const stdout = execFileSync('python3', ['-c', script], {
    cwd: repoRoot,
    env,
    encoding: 'utf8',
  });
  cachedRoutes = JSON.parse(stdout);
  return cachedRoutes;
}

function routeFor(routeId) {
  const route = loadRoutes()[routeId];
  if (!route) {
    throw new Error(`Unknown model route: ${routeId}`);
  }
  return route;
}

function modelForRoute(routeId) {
  return routeFor(routeId).model;
}

module.exports = {
  ROUTES,
  loadRoutes,
  modelForRoute,
  routeFor,
};
