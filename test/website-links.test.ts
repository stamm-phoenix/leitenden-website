import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'bun:test';

const LEGACY_WEB = join(import.meta.dir, '../vendor/website-astro/web/src');
const read = (path: string): string => readFileSync(join(LEGACY_WEB, path), 'utf8');

// The generator runs on this app's host; a QR code printed on a poster must never lead there.
// It encodes only what the leader types: no address of the page it runs on, not even as default.
test('the QR code generator encodes only the text the leader types', () => {
  const generator = read('components/qrcode/QrCodeGenerator.svelte');
  for (const source of [generator, read('lib/qrCode.ts'), read('lib/qrCodePdf.ts')]) {
    expect(source).not.toMatch(/\blocation\b|\borigin\b|document\.URL|\$app\//);
  }
  expect(generator).toMatch(/text: '',/);
});
