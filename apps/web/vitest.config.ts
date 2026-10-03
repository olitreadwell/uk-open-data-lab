import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['node_modules', '.next', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        '.next/',
        // The static export the build writes. Measuring it drags the totals
        // down with minified chunks and it is regenerated on every build.
        'out/',
        'e2e/',
        // Test and build artifacts. Playwright's HTML report ships its own
        // bundled JS, which v8 otherwise counts as first-party source.
        'playwright-report/',
        'test-results/',
        '.turbo/',
        'coverage/',
        '**/*.stories.{ts,tsx}',
        '**/*.d.ts',
        'vitest.config.ts',
        'vitest.setup.ts',
        'next.config.ts',
        'postcss.config.mjs',
        'eslint.config.mjs',
        'playwright.config.ts',
        'vercel.ts',
        'scripts/csp-nonce.mjs',
        'scripts/generate-csp.mjs',
        'scripts/check-deployed-security-headers.mjs',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
