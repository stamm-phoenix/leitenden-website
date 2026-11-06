import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'bun:test';
import { getBlogPostUrl } from '../src/lib/blogLinks';
import { replacementOf } from '../vite/legacyCode';

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

// Pages of the public website that the moved modules link to on www.stamm-phoenix.de
test('the public pages linked from here exist on the website', () => {
  for (const page of ['fragen-und-antworten.astro', 'blog/[id]']) {
    expect(existsSync(join(LEGACY_WEB, 'pages', page))).toBe(true);
  }
});

// „Ansehen“ and „Auf der Website ansehen“ of a published post lead to its baked page
test('links to a published blog post point to the website', () => {
  expect(getBlogPostUrl('sommerlager-2026')).toBe(
    'https://www.stamm-phoenix.de/blog/sommerlager-2026/'
  );
});

test('the blog modules get the links of this app', () => {
  const blog = join(LEGACY_WEB, 'lib/blog.ts');
  for (const component of ['BlogPflege.svelte', 'BlogEditor.svelte']) {
    expect(replacementOf(blog, join(LEGACY_WEB, 'components/pflege', component))).toBe(
      fileURLToPath(new URL('../src/lib/blogLinks.ts', import.meta.url))
    );
  }
  // The replacement itself imports the original
  expect(
    replacementOf(blog, fileURLToPath(new URL('../src/lib/blogLinks.ts', import.meta.url)))
  ).toBeUndefined();
});
