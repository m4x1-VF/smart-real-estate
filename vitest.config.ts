import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': projectRoot,
    },
  },
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'tests/**/*.spec.ts', 'tests/**/*.spec.tsx'],
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    environmentMatchGlobs: [
      ['tests/integration/**/*.test.ts', 'happy-dom'],
      ['tests/e2e/**/*.test.ts', 'happy-dom'],
    ],
  },
});
