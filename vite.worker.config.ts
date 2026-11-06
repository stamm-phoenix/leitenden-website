/**
 * Third build of `bun run build`: the worker that reads the text of uploaded PDF minutes
 * (`api/lib/protokoll-pdf-worker.ts` of website-astro). `protokoll-text.ts` starts it next to the
 * API bundle, `join(__dirname, 'protokoll-pdf-worker.js')`, and here `__dirname` is
 * `globalThis.__legacyApiDir` (vite/legacyCode.ts), so it is built into that folder.
 * scripts/check-build.mjs then runs it on a small PDF.
 */
import { defineConfig } from 'vite';
import packageJson from './package.json' with { type: 'json' };
import { LEGACY_API_BUNDLE, legacyCode } from './vite/legacyCode.ts';

export default defineConfig({
  plugins: [legacyCode()],
  tsconfig: 'tsconfig.json',
  ssr: {
    noExternal: true,
    // pdfjs-dist stays a package of the image, as in the website's bundle
    external: Object.keys(packageJson.dependencies),
  },
  build: {
    ssr: 'vendor/website-astro/api/lib/protokoll-pdf-worker.ts',
    outDir: LEGACY_API_BUNDLE,
    // The folder may hold a build of the website's API; only this file belongs to the app
    emptyOutDir: false,
    target: 'node24',
    rolldownOptions: { output: { entryFileNames: '[name].js' } },
  },
});
