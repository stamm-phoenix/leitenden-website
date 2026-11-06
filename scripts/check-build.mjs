// Last step of `bun run build` and of the image (Dockerfile): checks that the PDF worker of the
// website's API (vite.worker.config.ts) is there and reads the text of a PDF, started as
// `api/lib/protokoll-text.ts` starts it. Paths as in the container: from the app folder.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Worker } from 'node:worker_threads';

const WORKER = resolve('vendor/website-astro/api/dist/bundle/protokoll-pdf-worker.js');
const EXPECTED = 'Protokoll Leiterrunde';

/** A one-page PDF with a text layer, the smallest that pdf.js accepts. */
function samplePdf() {
  const content = `BT /F1 12 Tf 72 720 Td (${EXPECTED}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = objects.map((object, index) => {
    const offset = pdf.length;
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    return offset;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(pdf);
}

function extract(bytes) {
  return new Promise((done, fail) => {
    const worker = new Worker(WORKER, {
      workerData: bytes,
      transferList: [bytes.buffer],
      resourceLimits: { maxOldGenerationSizeMb: 96, maxYoungGenerationSizeMb: 16, stackSizeMb: 4 },
    });
    // More time than the API gives it (5 s): a busy build machine must not fail the build
    const timer = setTimeout(() => {
      fail(new Error('no answer within 30 s'));
      void worker.terminate();
    }, 30_000);
    worker.once('message', (text) => {
      clearTimeout(timer);
      done(text);
      void worker.terminate();
    });
    worker.once('error', fail);
    worker.once('exit', (code) => {
      clearTimeout(timer);
      fail(new Error(`exited with code ${code}`));
    });
  });
}

if (!existsSync(WORKER)) {
  console.error(`The PDF worker is missing: ${WORKER} (vite.worker.config.ts)`);
  process.exit(1);
}
try {
  const text = await extract(samplePdf());
  if (typeof text !== 'string' || !text.includes(EXPECTED))
    throw new Error(`unexpected text ${JSON.stringify(text)}`);
  console.log('PDF worker reads the sample PDF');
} catch (error) {
  console.error(`The PDF worker failed: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
