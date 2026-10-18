import { test, expect } from '@playwright/test';
test('authroom loads and creates session', async ({ page }) => {
  await page.goto('http://localhost:3000/room/demo');
  await expect(page.locator('h1')).toContainText('AuthRoom: demo');
  await page.locator('.user-input').fill('alice');
  await page.locator('.provider-input').selectOption('google');
  await page.locator('.mfa-check').check();
  await page.locator('.mfa-method-input').selectOption('totp');
  await page.locator('.add-btn').click();
  await expect(page.locator('.session-list').locator('div').first()).toBeVisible();
});