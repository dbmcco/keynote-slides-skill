// ABOUTME: Tests review-all emits model-mediated signal summary fields.
// ABOUTME: Ensures summary uses heuristic fields and flags instead of severity buckets.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const scriptPath = path.join(repoRoot, 'scripts', 'review-all.js');

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

test('review-all summary uses heuristic fields', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'keynote-review-all-'));
  const deckPath = path.join(tempDir, 'decks', 'unit-review');

  writeFile(
    path.join(deckPath, 'index.html'),
    '<section class="slide" data-title="Intro"><h1 class="title">Intro</h1><p>Short intro text.</p></section>'
  );

  execFileSync('node', [scriptPath, deckPath, '--json'], {
    cwd: repoRoot,
    stdio: 'ignore',
  });

  const reportPath = path.join(deckPath, 'resources', 'materials', 'full-analysis.json');
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
  assert.ok(report.summary, 'summary should exist');
  assert.ok(report.summary.northStarSignals, 'northStarSignals should exist');
  assert.ok(report.summary.overall, 'overall summary should exist');
  assert.ok(Array.isArray(report.summary.overall.flags), 'overall.flags should be an array');
  assert.ok('heuristicScore' in report.summary.overall, 'heuristicScore should exist');
  assert.ok('heuristicGrade' in report.summary.overall, 'heuristicGrade should exist');
  assert.equal(report.summary.overall.criticalIssues, undefined);
  assert.equal(report.summary.overall.importantIssues, undefined);
});
