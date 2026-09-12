import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir: './test/browser',
  outputDir: './output/playwright/results',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  timeout: 30_000,
  expect: {timeout: 5_000},
  reporter: [['list'], ['html', {outputFolder: 'output/playwright/report', open: 'never'}]],
  use: {
    browserName: 'chromium',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {name: 'desktop', use: {viewport: {width: 1280, height: 800}, colorScheme: 'dark'}},
    {name: 'mobile', use: {viewport: {width: 390, height: 844}, colorScheme: 'light'}},
  ],
});
