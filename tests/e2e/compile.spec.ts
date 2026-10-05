import { test, expect } from '@playwright/test';

// Regression test: the compile Web Worker must load solc and compile the
// starter contract in a real browser (guards against "factory is not a function").
test('compile starter contract in the IDE', async ({ page }) => {
  test.setTimeout(180000);
  await page.goto('/app?layout=classic', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Compile \(solc/ }).click();
  await expect(page.getByText('✅ clean')).toBeVisible({ timeout: 150000 });
});
