import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
  test: {
    globals: true,
    root: './src',
    include: ['**/*.spec.ts'],
    environment: 'node',
    // Path is relative to `root` (./src). Vitest 4 resolves setupFiles against
    // `root`; the file lives one level up, alongside this config.
    setupFiles: ['../vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: '../coverage',
      include: ['**/*.{t,j}s'],
    },
  },
});
