require('dotenv').config({ quiet: true });
const { defineConfig, devices } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: process.env.REPORT_HTML_DIR || 'playwright-report', open: 'never' }],
    ['json', { outputFile: process.env.REPORT_JSON_PATH || 'test-results/results.json' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://the-internet.herokuapp.com',
    headless: process.env.HEADED === '1' ? false : true,
    launchOptions: { slowMo: Number(process.env.SLOW_MO || 0), args: ['--no-sandbox'] },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  outputDir: process.env.TEST_OUTPUT_DIR || 'test-results/artifacts',
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
