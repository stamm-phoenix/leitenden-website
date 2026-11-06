import { expect, test } from 'bun:test';
import { fileURLToPath } from 'node:url';
import { CONFIG } from '#legacy/api/lib/config';
import { mayLogInHere } from '../src/lib/server/previewLogin';
import { APP_CONFIG } from '../src/lib/server/config';
import { FAILED_PATH } from '../src/lib/server/login';

const TEST_ACCOUNT = CONFIG.staff.previewOnlyLogins[0];
const ALL_ROLES = Object.values(CONFIG.staff.teams).map((team) => team.role);

interface LoginResult {
  location?: string;
  sessionWritten: boolean;
  roles: string[] | null;
  copiedSessionValid: boolean;
}

/** `finishLogin` for the account `login` in a process with `PREVIEW_DATABASE` (test/fixtures). */
function finishLoginAs(login: string, previewDatabase: string): LoginResult {
  const claims = {
    oid: '00000000-0000-0000-0000-00000000000a',
    tid: APP_CONFIG.azure.tenantId,
    preferred_username: login,
    nonce: 'nonce',
  };
  const run = Bun.spawnSync(
    [process.execPath, fileURLToPath(new URL('fixtures/login-run.ts', import.meta.url))],
    {
      env: {
        ...process.env,
        SESSION_SECRET: 'test-secret-test-secret-test-secret-1234',
        PREVIEW_DATABASE: previewDatabase,
        LOGIN_CLAIMS: JSON.stringify(claims),
      },
    }
  );
  expect(run.exitCode).toBe(0);
  return JSON.parse(run.stdout.toString().trim().split('\n').at(-1) ?? '{}') as LoginResult;
}

test('the test account is listed in the configuration of website-astro', () => {
  expect(TEST_ACCOUNT).toMatch(/@stamm-phoenix\.de$/);
});

test('on a PR preview the test account signs in and gets the roles of every team', () => {
  expect(finishLoginAs(TEST_ACCOUNT, 'leitende-pr-6')).toEqual({
    location: '/leitendenbereich',
    sessionWritten: true,
    roles: ['anonymous', 'authenticated', ...ALL_ROLES],
    copiedSessionValid: true,
  });
});

test('in production the login of the test account is refused, and a copied session of it is none', () => {
  const result = finishLoginAs(TEST_ACCOUNT.toUpperCase(), '');
  expect(result.location).toStartWith(FAILED_PATH);
  expect(result).toMatchObject({ sessionWritten: false, roles: null, copiedSessionValid: false });
});

test('a normal account signs in as before, in production and on a preview', () => {
  for (const preview of ['', 'leitende-pr-6']) {
    expect(finishLoginAs('vorname.nachname@stamm-phoenix.de', preview)).toEqual({
      location: '/leitendenbereich',
      sessionWritten: true,
      roles: ['anonymous', 'authenticated', 'team_leitende'],
      copiedSessionValid: true,
    });
  }
});

test('outside a preview a session of the test account counts as none', () => {
  expect(mayLogInHere(TEST_ACCOUNT, false)).toBe(false);
  expect(mayLogInHere(TEST_ACCOUNT, true)).toBe(true);
  expect(mayLogInHere('vorname.nachname@stamm-phoenix.de', false)).toBe(true);
});
