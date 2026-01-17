const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto('https://dbmcco.github.io/keynote-slides-skill/decks/skill-demo/index.html');
  await page.waitForTimeout(2000);

  const slideCount = await page.locator('.slide').count();
  console.log(`Found ${slideCount} slides`);

  // Capture slides 8-11 (the media demo slides)
  for (let i = 0; i < slideCount; i++) {
    if (i >= 7 && i <= 10) {
      await page.screenshot({ path: `/tmp/slide-${i + 1}.png` });
      console.log(`Captured slide ${i + 1}`);
    }
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
  }

  await browser.close();
})();
