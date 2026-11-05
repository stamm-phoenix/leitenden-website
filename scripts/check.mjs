// svelte-check for this app. Files of the submodule are checked by website-astro itself; here
// they would fail on its svelte.config.js, which needs Astro.
import { spawnSync } from 'node:child_process';

const result = spawnSync(
  'svelte-check',
  ['--tsconfig', './tsconfig.json', '--output', 'machine', '--threshold', 'error'],
  { encoding: 'utf8', shell: process.platform === 'win32' }
);
if (result.error) throw result.error;
const errors = result.stdout
  .split('\n')
  .filter((line) => / ERROR "/.test(line) && !line.includes(' ERROR "vendor/'));
for (const line of errors) console.error(line.replace(/^\d+ /, ''));
const summary = result.stdout.split('\n').find((line) => line.includes('COMPLETED'));
console.log(summary?.replace(/^\d+ /, '') ?? 'svelte-check did not finish');
console.log(`${errors.length} errors in this app`);
process.exit(errors.length > 0 || !summary ? 1 : 0);
