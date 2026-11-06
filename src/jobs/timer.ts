/**
 * Entry of the Container Apps Jobs that run the timers of website-astro
 * (`.github/scripts/timer-jobs.sh`), built to `build/jobs/timer.js` by `vite.jobs.config.ts`:
 *
 *   node build/jobs/timer.js <timer>           runs one timer, e.g. taskReminders
 *   node build/jobs/timer.js check-identity  only signs in to Azure SQL and Graph and reads
 *                                             `SELECT 1` from the database; sends nothing
 */
import { sql } from 'kysely';
import { closeDatabase, getDb } from '#legacy/api/lib/db';
import { env } from '#lib/server/env';
import { loadLegacyTimers, runTimer } from '#lib/server/functions/timers';
import { getCredential } from '#lib/server/token';

const SCOPES = ['https://database.windows.net/.default', 'https://graph.microsoft.com/.default'];

async function checkIdentity(): Promise<number> {
  console.info(`[timer] in Azure: ${env.inAzure}`);
  for (const scope of SCOPES) {
    try {
      await getCredential().getToken(scope);
      console.info(`[timer] token for ${scope}: ok`);
    } catch (error) {
      console.error(`[timer] token for ${scope} failed:`, error instanceof Error ? error.name : '');
      return 1;
    }
  }
  try {
    await sql`SELECT 1 AS ok`.execute(getDb());
    console.info('[timer] database: ok');
  } catch (error) {
    console.error('[timer] database failed:', error instanceof Error ? error.name : '');
    return 1;
  } finally {
    await closeDatabase();
  }
  return 0;
}

async function main(args: string[]): Promise<number> {
  if (args[0] === 'check-identity') return checkIdentity();
  await loadLegacyTimers();
  return runTimer(args[0]);
}

// Open database pools would keep the process alive; the job is done when the timer is
process.exit(await main(process.argv.slice(2)));
