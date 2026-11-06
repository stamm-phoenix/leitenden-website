import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'bun:test';
import {
  MAX_BELEG_CHECK_PAGES,
  MAX_BELEG_PDF_BYTES,
  MAX_BELEG_PHOTO_BYTES,
} from '#legacy/api/lib/validation/beleg';

/** BODY_SIZE_LIMIT of adapter-node as set in the Dockerfile, in bytes (`30M` = 30 MiB). */
function bodySizeLimit(): number {
  const dockerfile = readFileSync(join(import.meta.dir, '../Dockerfile'), 'utf8');
  const match = dockerfile.match(/BODY_SIZE_LIMIT=(\d+)([KMG]?)\b/);
  if (!match) throw new Error('BODY_SIZE_LIMIT fehlt im Dockerfile');
  const unit = { '': 1, K: 1024, M: 1024 ** 2, G: 1024 ** 3 }[match[2]] ?? 1;
  return Number(match[1]) * unit;
}

const base64 = (bytes: number): number => Math.ceil(bytes / 3) * 4;

// A Beleg as PDF is sent as JSON (api/lib/validation/beleg-upload.ts): its first page as `photo`,
// the PDF and the further pages for the check, all base64. Whatever the API accepts must not be
// refused by the server before it gets there.
test('the largest Beleg the API accepts fits into a request', () => {
  const pdfBeleg =
    base64(MAX_BELEG_PHOTO_BYTES) +
    base64(MAX_BELEG_PDF_BYTES) +
    (MAX_BELEG_CHECK_PAGES - 1) * base64(MAX_BELEG_PHOTO_BYTES);
  // The other fields of the form (shop, note, Aktion, …) and the JSON around it
  const fields = 64 * 1024;
  expect(pdfBeleg + fields).toBeLessThanOrEqual(bodySizeLimit());
});
