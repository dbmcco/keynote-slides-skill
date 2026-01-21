// ABOUTME: Tests narrative-build runner emits model-mediated artifacts.
// ABOUTME: Validates ingestion, prompt packet, and work-run outputs.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const scriptPath = path.join(repoRoot, 'scripts', 'narrative-build.js');

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

test('narrative-build emits prompt packet and work run artifacts', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'keynote-narrative-build-'));
  const deckPath = path.join(tempDir, 'decks', 'unit-deck');

  writeFile(
    path.join(deckPath, 'index.html'),
    '<section class="slide" data-title="Intro"><h1>Intro</h1></section>'
  );
  writeFile(
    path.join(deckPath, 'deck.json'),
    JSON.stringify({ entity: 'northwind', title: 'Unit Deck', deckType: 'pitch' }, null, 2)
  );
  writeFile(
    path.join(deckPath, 'resources', 'materials', 'brief.md'),
    '## Brief\nWe solve a real problem with measurable impact.'
  );

  execFileSync('node', [scriptPath, deckPath], {
    cwd: repoRoot,
    stdio: 'pipe',
  });

  const ingestionPath = path.join(deckPath, 'resources', 'materials', 'ingestion.json');
  const promptPath = path.join(deckPath, 'resources', 'materials', 'narrative-build-prompts.json');
  const workRunsDir = path.join(deckPath, 'resources', 'materials', 'work-runs');

  assert.ok(fs.existsSync(ingestionPath), 'ingestion.json should exist');
  assert.ok(fs.existsSync(promptPath), 'narrative-build-prompts.json should exist');
  assert.ok(fs.existsSync(workRunsDir), 'work-runs directory should exist');

  const promptPayload = JSON.parse(fs.readFileSync(promptPath, 'utf-8'));
  assert.equal(promptPayload.deckPath, deckPath);
  assert.ok(promptPayload.prompt, 'prompt should be present');

  const workRunFiles = fs.readdirSync(workRunsDir).filter((f) => f.endsWith('.json'));
  assert.ok(workRunFiles.length > 0, 'work run file should be created');

  const workRun = JSON.parse(fs.readFileSync(path.join(workRunsDir, workRunFiles[0]), 'utf-8'));
  assert.equal(workRun.type, 'narrative-build');
  assert.equal(workRun.status, 'prepared');
  assert.equal(workRun.deckPath, deckPath);
});
