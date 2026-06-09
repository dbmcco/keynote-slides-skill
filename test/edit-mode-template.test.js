// ABOUTME: Browser tests for the Keynote deck in-deck edit mode runtime.
// ABOUTME: Verifies draft patch editing/export and published deck locking.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const repoRoot = path.resolve(__dirname, '..');
const templatePath = path.join(repoRoot, 'skills', 'keynote-slides', 'assets', 'keynote-slides.html');

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function createDeck({ status = 'draft', deckId = 'unit-edit' } = {}) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'keynote-edit-mode-'));
  const decksRoot = path.join(tempDir, 'decks');
  const deckPath = path.join(decksRoot, deckId);

  writeFile(path.join(deckPath, 'index.html'), fs.readFileSync(templatePath, 'utf8'));
  writeFile(
    path.join(deckPath, 'deck-config.js'),
    `window.KEYNOTE_DECK = ${JSON.stringify({ id: deckId, title: 'Unit Edit', entity: 'northwind', status })};\n`
  );
  writeFile(
    path.join(decksRoot, 'brands.js'),
    `window.KEYNOTE_DEFAULT_ENTITY = "northwind";
window.KEYNOTE_BRANDS = {
  northwind: {
    label: "Northwind",
    tokens: {
      "brand-ink": "#0f172a",
      "brand-paper": "#ffffff",
      "brand-accent": "#ff6b35",
      "brand-sage": "#93a77a",
      "brand-slate": "#475569",
      "brand-line": "rgba(15,23,42,0.12)"
    },
    fonts: { display: "Arial, sans-serif", body: "Arial, sans-serif" }
  }
};\n`
  );
  writeFile(path.join(decksRoot, 'model-routes.js'), 'window.KEYNOTE_MODEL_ROUTES = {};\n');

  return {
    deckId,
    url: pathToFileURL(path.join(deckPath, 'index.html')).href,
  };
}

async function openDeck(deck, initScript) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.setDefaultTimeout(1500);
  if (initScript) {
    await page.addInitScript(initScript);
  }
  await page.goto(deck.url);
  return { browser, page };
}

test('draft decks support bounded in-deck edits and persist patches', async () => {
  const deck = createDeck({ status: 'draft', deckId: 'unit-edit-draft' });
  const { browser, page } = await openDeck(deck);

  try {
    await page.locator('#edit-toggle').click();
    await assert.doesNotReject(() => page.locator('body.edit-mode').waitFor({ timeout: 1000 }));

    const title = page.locator('.slide.is-active .title').first();
    await title.click();
    await assert.doesNotReject(() => page.locator('#edit-panel.is-open').waitFor({ timeout: 1000 }));

    await page.locator('#edit-text').fill('Sharper headline');
    await page.locator('#edit-font-size').fill('56');
    await page.locator('#edit-color').fill('#123456');
    await page.locator('#edit-offset-x').fill('12');
    await page.locator('#edit-offset-y').fill('-4');

    await assert.equal(await title.textContent(), 'Sharper headline');
    await assert.equal(await title.evaluate((node) => node.style.fontSize), '56px');
    await assert.equal(await title.evaluate((node) => node.style.color), 'rgb(18, 52, 86)');
    await assert.equal(await title.evaluate((node) => node.style.transform), 'translate(12px, -4px)');

    const patch = await page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey)), `KEYNOTE_EDIT_PATCH_${deck.deckId}`);
    assert.equal(patch.deckId, deck.deckId);
    assert.equal(patch.schemaVersion, 1);
    assert.equal(patch.deckStatusAtExport, 'draft');
    const titlePatch = Object.values(patch.edits).find((edit) => edit.text === 'Sharper headline');
    assert.ok(titlePatch, 'title text edit should be stored');
    assert.deepEqual(titlePatch.transform, { x: 12, y: -4 });

    await page.reload();
    const reloadedTitle = page.locator('.slide.is-active .title').first();
    await assert.equal(await reloadedTitle.textContent(), 'Sharper headline');
    await assert.equal(await reloadedTitle.evaluate((node) => node.style.fontSize), '56px');
  } finally {
    await browser.close();
  }
});

test('edit patches export as JSON handoff artifacts', async () => {
  const deck = createDeck({ status: 'draft', deckId: 'unit-edit-export' });
  const { browser, page } = await openDeck(deck);

  try {
    await page.locator('#edit-toggle').click();
    await page.locator('.slide.is-active .title').first().click();
    await page.locator('#edit-text').fill('Exported headline');

    const downloadPromise = page.waitForEvent('download');
    await page.locator('#edit-export').click();
    const download = await downloadPromise;
    const payload = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));

    assert.equal(download.suggestedFilename(), `edit-patch-${deck.deckId}.json`);
    assert.equal(payload.deckId, deck.deckId);
    assert.equal(payload.deckStatusAtExport, 'draft');
    assert.ok(Object.values(payload.edits).some((edit) => edit.text === 'Exported headline'));
  } finally {
    await browser.close();
  }
});

test('published decks disable edit mode and ignore local patches', async () => {
  const deck = createDeck({ status: 'published', deckId: 'unit-edit-published' });
  const storageKey = `KEYNOTE_EDIT_PATCH_${deck.deckId}`;
  const localPatch = {
    deckId: deck.deckId,
    schemaVersion: 1,
    deckStatusAtExport: 'draft',
    exportedAt: new Date().toISOString(),
    edits: {
      'title-title-1': {
        text: 'Should not apply',
        style: { fontSize: '80px', color: '#ff0000' },
      },
    },
  };
  const { browser, page } = await openDeck(deck);

  try {
    await page.evaluate(({ key, patch }) => localStorage.setItem(key, JSON.stringify(patch)), {
      key: storageKey,
      patch: localPatch,
    });
    await page.reload();

    await assert.equal(await page.locator('#edit-toggle').count(), 0);
    await assert.equal(await page.locator('#publish-status').textContent(), 'Published');
    await assert.notEqual(await page.locator('.slide.is-active .title').first().textContent(), 'Should not apply');
  } finally {
    await browser.close();
  }
});
