import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { describe, expect, test } from 'bun:test';
import { LEGACY_API_BUNDLE } from '../vite/legacyCode';
import workerConfig from '../vite.worker.config';

const read = (path: string): string => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const BUNDLE = relative(process.cwd(), LEGACY_API_BUNDLE);

// The build itself runs the worker (scripts/check-build.mjs); this checks that the image has it.
describe('PDF worker of the minutes', () => {
  test('the API still starts it by this name next to its bundle', () => {
    expect(read('vendor/website-astro/api/lib/protokoll-text.ts')).toContain(
      "join(__dirname, 'protokoll-pdf-worker.js')"
    );
    expect(read('src/lib/server/functions/context.ts')).toContain(`resolve('${BUNDLE}')`);
  });

  test('is built into the folder of the bundle', () => {
    expect(workerConfig.build?.outDir).toBe(LEGACY_API_BUNDLE);
    expect(workerConfig.build?.ssr).toBe('vendor/website-astro/api/lib/protokoll-pdf-worker.ts');
  });

  test('is copied into the image', () => {
    expect(read('Dockerfile')).toContain(
      `COPY --from=build --chown=node:node /app/${BUNDLE}/protokoll-pdf-worker.js ./${BUNDLE}/`
    );
    expect(read('package.json')).toContain(
      'vite build --config vite.worker.config.ts && node scripts/check-build.mjs'
    );
  });
});
