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
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
    environment: 'node',
  },
});
