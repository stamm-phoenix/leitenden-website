/**
 * The timers of website-astro (`api/timers/`) as jobs: `app.timer()` (shim.ts) records them
 * here, and `src/jobs/timer.ts` runs one of them per Container Apps Job execution. The job's
 * schedule trigger replaces the Functions timer, so each run happens once, however many
 * replicas the web app has, and never in a PR preview (`.github/scripts/timer-jobs.sh`).
 */
import { createContext, useLegacyApiDir } from './context';
import type { InvocationContext, TimerFunctionOptions } from './types';

export interface RegisteredTimer {
  name: string;
  schedule: string;
  handler: TimerFunctionOptions['handler'];
}

const timers = new Map<string, RegisteredTimer>();

/** Called by `app.timer()`. */
export function registerTimer(name: string, options: TimerFunctionOptions): void {
  if (timers.has(name)) throw new Error(`Timer ${name} is registered twice`);
  timers.set(name, { name, schedule: options.schedule, handler: options.handler });
}

export function registeredTimers(): RegisteredTimer[] {
  return [...timers.values()];
}

/** Only for tests. */
export function clearTimers(): void {
  timers.clear();
}

/**
 * The cron expression of a Container Apps Job (five fields, UTC) for the NCRONTAB schedule of
 * a Functions timer (six fields, the first one seconds). Jobs start at the full minute, so only
 * schedules at second 0 have an equivalent.
 */
export function toJobCron(schedule: string): string {
  const fields = schedule.trim().split(/\s+/);
  if (fields.length !== 6 || fields[0] !== '0') {
    throw new Error(`No job schedule for NCRONTAB "${schedule}"`);
  }
  return fields.slice(1).join(' ');
}

/** Imports `api/timers/index.ts` of the submodule; its imports register every timer. */
export async function loadLegacyTimers(): Promise<void> {
  useLegacyApiDir();
  await import('#legacy/api/timers/index');
}

/**
 * Runs the timer `name` once, as the Functions host would at its scheduled time. The exit
 * code of the job: 0 done (also when the timer's switch is off), 1 failed, 2 unknown timer.
 */
export async function runTimer(
  name: string | undefined,
  context: (name: string) => InvocationContext = createContext
): Promise<number> {
  const timer = name === undefined ? undefined : timers.get(name);
  if (!timer) {
    const known = registeredTimers().map((entry) => entry.name);
    console.error(`[timer] unknown timer "${name ?? ''}"; known: ${known.join(', ')}`);
    return 2;
  }
  const started = Date.now();
  const log = context(timer.name);
  try {
    await timer.handler({ isPastDue: false }, log);
  } catch (error) {
    // The timers log their own details; the message of the error says only what failed
    log.error('failed', error instanceof Error ? error.message : 'UnknownError');
    return 1;
  }
  log.info(`done in ${Date.now() - started} ms`);
  return 0;
}
