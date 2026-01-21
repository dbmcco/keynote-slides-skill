// ABOUTME: Tests model-mediated conformance checker for narrative build artifacts.
// ABOUTME: Ensures required artifacts exist for build conformance.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const buildScript = path.join(repoRoot, 'scripts', 'narrative-build.js');
const conformanceScript = path.join(repoRoot, 'scripts', 'model-mediated-conformance.js');

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

test('conformance passes after narrative build prep', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'keynote-conformance-'));
  const deckPath = path.join(tempDir, 'decks', 'unit-conformance');

  writeFile(
    path.join(deckPath, 'index.html'),
    '<section class="slide" data-title="Intro"><h1 class="title">Intro</h1><p>Short intro text.</p></section>'
  );
  writeFile(
    path.join(deckPath, 'deck.json'),
    JSON.stringify({ entity: 'northwind', title: 'Unit Conformance', deckType: 'pitch' }, null, 2)
  );
  writeFile(
    path.join(deckPath, 'resources', 'materials', 'brief.md'),
    '## Brief\nWe solve a real problem with measurable impact.'
  );

  execFileSync('node', [buildScript, deckPath], {
    cwd: repoRoot,
    stdio: 'ignore',
  });

  const output = execFileSync('node', [conformanceScript, deckPath], {
    cwd: repoRoot,
    encoding: 'utf-8',
  });

  assert.match(output, /Conformance OK/);
});
