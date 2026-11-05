/**
 * Database (`leitende-pr-<number>`) and blob container (same name, in the preview storage
 * account) of a PR preview, so previews never use the production data. Same steps as
 * `api/scripts/db-preview.ts` of website-astro, with names of their own so they never meet the
 * previews of website-astro. Runs in the deploy workflow as `website-astro-previews` (role
 * `dbmanager` on the preview server only), signed in with the Azure CLI.
 *
 *   bun scripts/preview-db.ts create <PR>
 *   bun scripts/preview-db.ts drop <PR>
 */
import { resolve } from 'node:path';
import { sql } from 'kysely';
import { AzureCliCredential } from '@azure/identity';
import { CONFIG } from '#legacy/api/lib/config';
import { createContainerClient, useBlobStorage } from '#legacy/api/lib/blob-storage';
import type { BlobTarget } from '#legacy/api/lib/blob-storage';
import { closeDatabase, createDatabase, getDb, useDatabase } from '#legacy/api/lib/db';
import type { DatabaseTarget } from '#legacy/api/lib/db';
import { migrate, readMigrations } from '#legacy/api/lib/db-migrations';
import {
  databaseExists,
  enablePreviewSettings,
  grantWebsiteAccess,
  isPreviewSeeded,
  markPreviewSeeded,
} from '#legacy/api/lib/db-preview';
import { seedPreviewData } from '#legacy/api/scripts/preview-seeds';

const PREVIEW_STORAGE_ACCOUNT = 'stammphoenixpreviews';
const MASTER_TIMEOUT_MS = 10 * 60_000;

export function previewName(pr: string): string {
  if (!/^[1-9]\d{0,5}$/.test(pr)) throw new Error(`Invalid pull request number: ${pr}`);
  return `leitende-pr-${pr}`;
}

function target(database: string): DatabaseTarget {
  return {
    // Never the production server
    server: CONFIG.database.previewServer,
    database,
    ...(database === 'master' ? { requestTimeout: MASTER_TIMEOUT_MS } : {}),
    authentication: {
      type: 'token-credential',
      options: { credential: new AzureCliCredential() },
    },
  };
}

function blobTarget(name: string): BlobTarget {
  return {
    account: PREVIEW_STORAGE_ACCOUNT,
    container: name,
    credential: new AzureCliCredential(),
  };
}

function log(values: Record<string, unknown>): void {
  console.log(JSON.stringify({ scope: 'preview_db', ...values }));
}

async function waitOnline(master: ReturnType<typeof createDatabase>, name: string): Promise<void> {
  const deadline = Date.now() + MASTER_TIMEOUT_MS;
  for (;;) {
    const state = await sql<{ state: string }>`
      SELECT state_desc AS state FROM sys.databases WHERE name = ${name}
    `.execute(master);
    if (state.rows[0]?.state === 'ONLINE') return;
    if (Date.now() > deadline) throw new Error(`Database ${name} did not come online`);
    await new Promise((done) => setTimeout(done, 5_000));
  }
}

async function create(pr: string): Promise<void> {
  const name = previewName(pr);
  const blobs = blobTarget(name);
  log({
    container: name,
    created: (await createContainerClient(blobs).createIfNotExists()).succeeded,
  });

  const master = createDatabase(target('master'));
  let created = false;
  try {
    if (!(await databaseExists(master, name))) {
      // The name is checked in previewName; identifiers cannot be parameters
      await sql
        .raw(
          `CREATE DATABASE [${name}] (EDITION = 'Basic', SERVICE_OBJECTIVE = 'Basic', MAXSIZE = 2 GB) WITH BACKUP_STORAGE_REDUNDANCY = 'LOCAL'`
        )
        .execute(master);
      created = true;
    }
    await waitOnline(master, name);
  } finally {
    await master.destroy();
  }

  const db = createDatabase(target(name));
  let seeded: boolean;
  try {
    // The app signs in as the app registration website-astro (src/lib/server/token.ts)
    await grantWebsiteAccess(db, CONFIG.azure.clientId);
    const migrations = readMigrations(resolve('vendor/website-astro/api/migrations'));
    const result = await migrate(db, migrations);
    seeded = await isPreviewSeeded(db);
    log({ database: name, created, seeded, applied: result.applied });
  } finally {
    await db.destroy();
  }

  if (!seeded) {
    useDatabase(target(name));
    const resetBlobs = useBlobStorage(blobs);
    try {
      const preview = getDb();
      await enablePreviewSettings(preview);
      await seedPreviewData();
      await markPreviewSeeded(preview);
    } finally {
      resetBlobs();
      await closeDatabase();
    }
  }
}

async function drop(pr: string): Promise<void> {
  const name = previewName(pr);
  const master = createDatabase(target('master'));
  try {
    const exists = await databaseExists(master, name);
    if (exists) await sql.raw(`DROP DATABASE [${name}]`).execute(master);
    log({ database: name, dropped: exists });
  } finally {
    await master.destroy();
  }
  log({
    container: name,
    dropped: (await createContainerClient(blobTarget(name)).deleteIfExists()).succeeded,
  });
}

if (import.meta.main) {
  const [command, pr, ...rest] = process.argv.slice(2);
  if (!pr || rest.length > 0 || (command !== 'create' && command !== 'drop')) {
    console.error('Usage: bun scripts/preview-db.ts create|drop <PR>');
    process.exit(2);
  }
  await (command === 'create' ? create(pr) : drop(pr));
}
