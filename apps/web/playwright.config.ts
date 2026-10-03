import { defineConfig } from '@playwright/test';

const CI = !!process.env.CI;
// PORT lets the grow loop serve each country on its own port, so a second
// site in the family never collides with this one.
const PORT = process.env.PORT ?? process.env.E2E_PORT ?? '3000';
// Normalized to end with "/" so relative page.goto() URLs resolve against the
// baseURL path (the site may be served under a base path rather than at the
// origin root).
const BASE_URL = (process.env.BASE_URL ?? `http://localhost:${PORT}`).replace(/\/?$/, '/');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 4 : undefined,
  reporter: CI ? 'github' : 'html',
  snapshotDir: './e2e/__snapshots__',
  timeout: 60_000,
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'mobile',
      use: {
        viewport: { width: 375, height: 812 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) Mobile',
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'tablet',
      use: {
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: 'laptop',
      use: {
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'desktop',
      use: {
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
  webServer: {
    // The app is a static export (output: 'export'), so the server must be
    // the built `out/` directory in both CI and local runs. Run `npm run
    // build` (or `npm run check`) first so `out/` exists.
    command: `npx serve out -l ${PORT}`,
    port: Number(PORT),
    reuseExistingServer: false,
  },
});
