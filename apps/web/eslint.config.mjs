import config from '@uk-open-data-lab/config-eslint/nextjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default [
  ...config,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        projectService: {
          allowDefaultProject: [
            'eslint.config.mjs',
            'postcss.config.mjs',
            'playwright.config.ts',
            'scripts/generate-csp.mjs',
            'scripts/check-deployed-security-headers.mjs',
          ],
        },
      },
    },
  },
  {
    // Standalone config files aren't part of the TS project, so type-aware
    // unsafe rules can't resolve their imports. They're config, not app code.
    files: [
      'eslint.config.mjs',
      'postcss.config.mjs',
      'playwright.config.ts',
      'scripts/generate-csp.mjs',
      'scripts/check-deployed-security-headers.mjs',
      'scripts/csp-nonce.mjs',
      'vercel.ts',
    ],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
  {
    // Next-generated types file.
    files: ['next-env.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
  {
    // e2e specs and build output aren't part of the TS project.
    ignores: ['e2e/**', 'screenshots/**', 'out/**', '.next/**'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // Logs go to stdout via console (12-factor XI). warn/error allowed for
      // signal severity; log is discouraged in source but allowed in scripts.
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Test files run via vitest with jest-dom matchers; relax unsafe-call for them
    files: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },
];
