#!/usr/bin/env node
// ABOUTME: Model-mediated narrative build runner for deck creation prompts.
// ABOUTME: Emits ingestion, prompt packet, and work-run artifacts without decisions.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function runIngestion(deckPath) {
  const scriptPath = path.join(__dirname, 'ingest-resources.js');
  const result = spawnSync('node', [scriptPath, deckPath, '--json'], {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  });

  if (result.error) {
    throw new Error(`Ingestion failed: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`Ingestion failed: ${result.stderr || `exit ${result.status}`}`);
  }

  try {
    return JSON.parse(result.stdout);
  } catch (err) {
    throw new Error(`Ingestion JSON parse error: ${err.message}`);
  }
}

function buildPrompt({ deckPath, ingestionPath, deckConfig, narrativeContextPath }) {
  const title = deckConfig?.title || 'Untitled';
  const entity = deckConfig?.entity || 'unknown';
  const deckType = deckConfig?.deckType || 'unspecified';

  return [
    'You are the Narrative Engine for keynote slides.',
    'Model decides; code executes. Do not hardcode decisions in code.',
    '',
    `Deck title: ${title}`,
    `Deck entity: ${entity}`,
    `Deck type: ${deckType}`,
    '',
    'Inputs:',
    `- Resource ingestion: ${ingestionPath}`,
    `- Existing narrative context (if any): ${narrativeContextPath}`,
    '',
    'Workflow:',
    '1) Confirm output format: presentation (default).',
    '2) Focal discovery: propose 2-3 focal statements and ask the user to pick.',
    '3) Ask discovery questions one at a time: audience, purpose, content type, tone, reveal.',
    '4) Ask density mode: High-Impact, Narrative, or Evidence.',
    '5) Recommend 2-3 frameworks (arc + communication).',
    '6) Ask for length: short, medium, or full.',
    '7) Generate slides.md with: headline, spotlight, design note, source tag.',
    '8) Write narrative-context.json with decisions and rationale.',
    '9) Build generation-queue.json for visuals to generate.',
    '',
    'Source tags: [DIRECT], [PARAPHRASE], [ELABORATED], [SYNTHESIZED], [GENERATED].',
    '',
    'References:',
    '- skills/keynote-slides/references/narrative-engine/framework-selection.md',
    '- skills/keynote-slides/references/narrative-engine/framework_selection_guide.md',
    '- skills/keynote-slides/references/narrative-engine/narrative-arcs.md',
    '- skills/keynote-slides/references/narrative-engine/communication-frameworks.md',
    '- skills/keynote-slides/references/narrative-engine/checklists.md',
  ].join('\n');
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

function main() {
  const args = process.argv.slice(2);
  const deckPath = args.find((arg) => !arg.startsWith('--'));

  if (!deckPath) {
    console.error('Usage: node scripts/narrative-build.js decks/<deck-id>');
    process.exit(1);
  }

  if (!fs.existsSync(deckPath)) {
    console.error(`Deck path not found: ${deckPath}`);
    process.exit(1);
  }

  const ingestion = runIngestion(deckPath);
  const materialsDir = path.join(deckPath, 'resources', 'materials');
  const ingestionPath = path.join(materialsDir, 'ingestion.json');
  const promptPath = path.join(materialsDir, 'narrative-build-prompts.json');
  const narrativeContextPath = path.join(deckPath, 'narrative-context.json');

  writeJson(ingestionPath, ingestion);

  const promptPayload = {
    deckPath,
    createdAt: new Date().toISOString(),
    ingestionPath,
    narrativeContextPath,
    prompt: buildPrompt({
      deckPath,
      ingestionPath,
      deckConfig: ingestion.deckConfig,
      narrativeContextPath,
    }),
  };

  writeJson(promptPath, promptPayload);

  const workRunsDir = path.join(materialsDir, 'work-runs');
  const runId = `narrative-build-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const workRunPath = path.join(workRunsDir, `${runId}.json`);
  const workRun = {
    id: runId,
    type: 'narrative-build',
    status: 'prepared',
    createdAt: promptPayload.createdAt,
    deckPath,
    inputs: {
      ingestionPath,
      promptPath,
    },
  };

  writeJson(workRunPath, workRun);

  console.log('Model-mediated narrative build prepared.');
  console.log(`Ingestion saved to: ${ingestionPath}`);
  console.log(`Prompt saved to: ${promptPath}`);
  console.log(`Work run saved to: ${workRunPath}`);
  console.log('Next: run the prompt in the model to generate slides.md and narrative-context.json.');
}

main();
