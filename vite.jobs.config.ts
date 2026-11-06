/**
 * Second build of `bun run build`: the entry of the timer jobs (`src/jobs/timer.ts`) as
 * `build/jobs/timer.js`, with the same replacements as the server of the app (vite.config.ts).
 * Like adapter-node, it bundles everything except the `dependencies`, which the image installs.
 */
import { defineConfig } from 'vite';
import packageJson from './package.json' with { type: 'json' };
import { FUNCTIONS_SHIM, legacyCode } from './vite/legacyCode.ts';

export default defineConfig({
  plugins: [legacyCode()],
  tsconfig: 'tsconfig.json',
  resolve: {
    alias: { '@azure/functions': FUNCTIONS_SHIM },
  },
  ssr: {
    noExternal: true,
    external: Object.keys(packageJson.dependencies),
  },
  build: {
    ssr: 'src/jobs/timer.ts',
    outDir: 'build/jobs',
    emptyOutDir: true,
    target: 'node24',
    rolldownOptions: { output: { entryFileNames: '[name].js' } },
  },
});
