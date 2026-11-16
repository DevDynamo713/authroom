import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  testMatch: 'authroom.prod.spec.ts',
  use: {
    headless: true,
    launchOptions: { args: ['--host-resolver-rules=MAP *.devdynamo713.workers.dev 172.67.140.137'] },
  },
});