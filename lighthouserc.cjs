// PORT lets the grow loop serve each country's site on its own port so the
// three countries can run at the same time. E2E_PORT is the older name and
// still works when PORT is unset.
const PORT = process.env.PORT ?? process.env.E2E_PORT ?? '3000';
const ORIGIN = `http://127.0.0.1:${PORT}`;
module.exports = {
  ci: {
    collect: {
      url: [
        `${ORIGIN}/`,
        `${ORIGIN}/contact`,
        `${ORIGIN}/feedback`,
        `${ORIGIN}/help`,
      ],
      startServerCommand: 'pnpm start',
      numberOfRuns: 1,
      settings: { chromeFlags: '--no-sandbox' },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};
