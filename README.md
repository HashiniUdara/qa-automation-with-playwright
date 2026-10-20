# The Internet - Playwright QA Automation Starter

Playwright + JavaScript Page Object Model (POM) sample test suite for https://the-internet.herokuapp.com/.

## Requirements

- Node.js 20+ and npm

## Installation

```bash
npm install
npx playwright install chromium
```

Copy `.env.example` into `.env` if needed (a demo `.env` is already included in the starter ZIP).

## Run tests

```bash
npm test
npm run test:headed
npm run test:debug
npm run test:ui
npm run report
```

Run one file: `npx playwright test tests/login.spec.js`

## Project structure

- `tests/`: runnable Playwright specs
- `pages/`: Page Object Model locators/actions
- `utils/`: sample reusable test data
- `playwright.config.js`: base URL, browser, reports, retries, screenshots and traces
- `.env.example`: example non-sensitive environment configuration

## Reports

- HTML: `playwright-report/index.html` (created by tests)
- JSON: `test-results/results.json` (created by tests)
- Screenshots and traces are retained on test failure.

## Note

`utils/testData.js` contains **public demonstration credentials** from the target website. Do not use this pattern for real passwords or commit real secrets.
