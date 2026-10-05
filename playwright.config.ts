import type { PlaywrightTestConfig } from '@playwright/test';
const config: PlaywrightTestConfig = {
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:3100', channel: 'chrome' },
};
export default config;
