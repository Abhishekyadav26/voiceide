import { test, expect } from '@playwright/test';

const landings = ['terminal', 'clean', 'gradient', 'editorial'];
const layouts = ['classic', 'command-first', 'split', 'wizard'];

for (const l of landings) {
  for (const w of [1440, 375]) {
    test(`landing ${l} @ ${w}px`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(`/?landing=${l}`, { waitUntil: 'networkidle' });
      await page.screenshot({ path: `screenshots/landing-${l}-${w}.png`, fullPage: true });
      await expect(page.locator('text=Launch App').first()).toBeVisible();
    });
  }
}

for (const l of layouts) {
  for (const w of [1440, 375]) {
    test(`layout ${l} @ ${w}px`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(`/app?layout=${l}`, { waitUntil: 'networkidle' });
      await page.screenshot({ path: `screenshots/layout-${l}-${w}.png`, fullPage: true });
    });
  }
}
