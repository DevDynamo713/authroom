import { test, expect } from '@playwright/test';
const PROD_URL = process.env.PROD_URL || 'https://authroom.vercel.app';
test('authroom prod: two browsers sync', async ({ browser }) => {
  const room = `prod-${Date.now()}`;
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();
  await pageA.goto(`${PROD_URL}/room/${room}`);
  await pageB.goto(`${PROD_URL}/room/${room}`);
  await pageA.waitForSelector('html[data-hydrated="1"]', { timeout: 15000 });
  await pageB.waitForSelector('html[data-hydrated="1"]', { timeout: 15000 });
  await pageA.locator('.device-input').fill('SyncDevice');
  await pageA.locator('.open-btn').click();
  await expect(pageB.locator('.session-row').first()).toContainText('SyncDevice', { timeout: 10000 });
  await ctxA.close();
  await ctxB.close();
});