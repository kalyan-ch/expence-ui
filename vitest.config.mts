import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Pinned west of Greenwich so the formatDate tests actually catch UTC-midnight drift.
// Under TZ=UTC the naive `new Date(iso)` implementation passes and the guard is useless.
process.env.TZ = 'America/New_York';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
});
