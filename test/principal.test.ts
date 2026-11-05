import { beforeEach, expect, test } from 'bun:test';
import { clearRoleCache, principalOf, teamRoles } from '../src/lib/server/principal';
import { APP_CONFIG } from '../src/lib/server/config';

const session = {
  oid: '00000000-0000-0000-0000-000000000001',
  tid: APP_CONFIG.azure.tenantId,
  login: 'vorname.nachname@stamm-phoenix.de',
  givenName: 'Vorname',
};

beforeEach(() => clearRoleCache());

test('the principal has the roles of the teams Graph reports, read with the object ID', async () => {
  let asked: string | undefined;
  const principal = await principalOf(session, async (user, groups) => {
    asked = user;
    return groups.slice(0, 1);
  });
  expect(asked).toBe(session.oid);
  expect(principal.userDetails).toBe(session.login);
  expect(principal.userRoles).toEqual(['anonymous', 'authenticated', 'team_leitende']);
  expect(principal.claims).toContainEqual({ typ: 'given_name', val: 'Vorname' });
});

test('roles are cached for a few minutes, then read again', async () => {
  let calls = 0;
  const read = async (_user: string, groups: string[]) => {
    calls += 1;
    return groups.slice(0, 1);
  };
  await teamRoles(session, read, 0);
  await teamRoles(session, read, APP_CONFIG.roleCacheMs - 1);
  expect(calls).toBe(1);
  await teamRoles(session, read, APP_CONFIG.roleCacheMs + 1);
  expect(calls).toBe(2);
});

test('without an answer from Graph the last known roles stay, a new person gets none', async () => {
  const failing = async (): Promise<string[]> => {
    throw new Error('Graph down');
  };
  expect(await teamRoles(session, failing, 0)).toEqual([]);
  await teamRoles(session, async (_u, groups) => groups.slice(0, 1), 0);
  expect(await teamRoles(session, failing, APP_CONFIG.roleCacheMs + 1)).toEqual(['team_leitende']);
});
