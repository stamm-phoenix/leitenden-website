import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, mock, test } from 'bun:test';
import * as shim from '../src/lib/server/functions/shim';
import {
  clearTimers,
  registeredTimers,
  registerTimer,
  runTimer,
  toJobCron,
} from '../src/lib/server/functions/timers';
import type { InvocationContext, Timer } from '../src/lib/server/functions/types';

interface Logged {
  level: string;
  args: unknown[];
}

function recorder(): { logged: Logged[]; context: (name: string) => InvocationContext } {
  const logged: Logged[] = [];
  const at =
    (level: string) =>
    (...args: unknown[]): void => {
      logged.push({ level, args });
    };
  return {
    logged,
    context: (name) => ({
      invocationId: 'test',
      functionName: name,
      log: at('log'),
      trace: at('trace'),
      debug: at('debug'),
      info: at('info'),
      warn: at('warn'),
      error: at('error'),
    }),
  };
}

afterEach(() => clearTimers());

describe('timer registry', () => {
  test('app.timer() of the shim registers the timer with its schedule', () => {
    const handler = (): void => {};
    shim.app.timer('example', { schedule: '0 5 * * * *', handler });
    expect(registeredTimers()).toEqual([{ name: 'example', schedule: '0 5 * * * *', handler }]);
  });

  test('a name registered twice is an error', () => {
    registerTimer('example', { schedule: '0 5 * * * *', handler: () => {} });
    expect(() => registerTimer('example', { schedule: '0 6 * * * *', handler: () => {} })).toThrow(
      'registered twice'
    );
  });
});

describe('runTimer', () => {
  test('runs only the named timer once, with a timer that is not late', async () => {
    const calls: { name: string; timer: Timer }[] = [];
    for (const name of ['first', 'second']) {
      registerTimer(name, {
        schedule: '0 0 * * * *',
        handler: (timer, context) => {
          calls.push({ name: context.functionName, timer });
        },
      });
    }
    const { logged, context } = recorder();
    expect(await runTimer('second', context)).toBe(0);
    expect(calls).toEqual([{ name: 'second', timer: { isPastDue: false } }]);
    expect(logged.at(-1)?.level).toBe('info');
  });

  test('a failing timer ends with exit code 1 and logs only the message', async () => {
    registerTimer('broken', {
      schedule: '0 0 * * * *',
      handler: async () => {
        throw new Error('Task reminder execution failed', { cause: new Error('SQL secret') });
      },
    });
    const { logged, context } = recorder();
    expect(await runTimer('broken', context)).toBe(1);
    expect(logged).toEqual([
      { level: 'error', args: ['failed', 'Task reminder execution failed'] },
    ]);
  });

  test('an unknown or missing name runs nothing and ends with exit code 2', async () => {
    let called = false;
    registerTimer('known', { schedule: '0 0 * * * *', handler: () => void (called = true) });
    const errors = mock(() => {});
    const original = console.error;
    console.error = errors;
    try {
      expect(await runTimer('unknown')).toBe(2);
      expect(await runTimer(undefined)).toBe(2);
    } finally {
      console.error = original;
    }
    expect(called).toBe(false);
    expect(String(errors.mock.calls[0])).toContain('known: known');
  });
});

describe('toJobCron', () => {
  test('drops the seconds of the NCRONTAB schedule', () => {
    expect(toJobCron('0 17 * * * *')).toBe('17 * * * *');
    expect(toJobCron('0 23 3 * * *')).toBe('23 3 * * *');
  });

  test('refuses schedules a job cannot express', () => {
    expect(() => toJobCron('30 17 * * * *')).toThrow();
    expect(() => toJobCron('*/10 * * * * *')).toThrow();
    expect(() => toJobCron('17 * * * *')).toThrow();
  });
});

/** The jobs of `.github/scripts/timer-jobs.sh`: timer name → cron. */
function scriptSchedules(): Record<string, string> {
  const script = readFileSync(new URL('../.github/scripts/timer-jobs.sh', import.meta.url), 'utf8');
  const entries = [...script.matchAll(/^ {2}"[a-z-]+\|(\w+)\|([^|]+)\|[A-Z_]+"$/gm)];
  return Object.fromEntries(entries.map(([, timer, cron]) => [timer, cron]));
}

test('every timer of website-astro has a job with the same schedule', async () => {
  mock.module('@azure/functions', () => shim);
  await import('#legacy/api/timers/index');
  const timers = registeredTimers();
  expect(timers.map((timer) => timer.name).sort()).toEqual(
    ['essensplanungAufbewahrung', 'leitendenrundeReminders', 'taskReminders'].sort()
  );
  expect(scriptSchedules()).toEqual(
    Object.fromEntries(timers.map((timer) => [timer.name, toJobCron(timer.schedule)]))
  );
});
