import { test, expect } from '@playwright/test';
test('authroom open + revoke', async ({ page }) => {
  await page.goto('http://localhost:3000/room/demo');
  await expect(page.locator('h1')).toContainText('AuthRoom: demo');
  await page.waitForSelector('html[data-hydrated="1"]', { timeout: 15000 });
  await page.locator('.device-input').fill('Laptop');
  await page.locator('.open-btn').click();
  await expect(page.locator('.session-row').first()).toContainText('Laptop');
  await expect(page.locator('.session-status').first()).toContainText('active');
  await page.locator('.revoke-btn').click();
  await expect(page.locator('.session-status').first()).toContainText('revoked');
  await expect(page.locator('.revoked-chip')).toContainText('1');
});