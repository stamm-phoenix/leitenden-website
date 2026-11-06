import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'bun:test';
import { getBlogPostUrl } from '../src/lib/blogLinks';
import { legacyCode } from '../vite/legacyCode';

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

/** What the plugin resolves `source` imported by `importer` to, with Vite's resolution faked. */
async function resolveWithPlugin(source: string, importer: string, id: string): Promise<unknown> {
  const resolveId = legacyCode().resolveId as (
    this: unknown,
    source: string,
    importer: string,
    options: object
  ) => Promise<unknown>;
  const context = { resolve: async (): Promise<{ id: string }> => ({ id }) };
  return resolveId.call(context, source, importer, {});
}

test('the blog modules get the links of this app', async () => {
  const blog = join(LEGACY_WEB, 'lib/blog.ts');
  const links = fileURLToPath(new URL('../src/lib/blogLinks.ts', import.meta.url));
  for (const component of ['BlogPflege.svelte', 'BlogEditor.svelte']) {
    const importer = join(LEGACY_WEB, 'components/pflege', component);
    expect(await resolveWithPlugin('../../lib/blog', importer, blog)).toBe(links);
  }
  // The replacement itself imports the original
  expect(await resolveWithPlugin('#legacy/web/src/lib/blog', links, blog)).toBeUndefined();
});
