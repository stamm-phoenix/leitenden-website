import { expect, test } from 'bun:test';
import { routeAccess } from '../src/lib/server/access';
import { seal, unseal } from '../src/lib/server/sealed';

const SECRET = 'test-secret-test-secret-test-secret-1234';

test('a sealed value only opens with the same secret and purpose, and not after it expired', () => {
  const sealed = seal({ oid: 'x' }, SECRET, 'session', 60);
  expect(unseal(sealed, SECRET, 'session')).toEqual({ oid: 'x' });
  expect(unseal(sealed, `${SECRET}!`, 'session')).toBeUndefined();
  expect(unseal(sealed, SECRET, 'login')).toBeUndefined();
  expect(unseal(seal({ oid: 'x' }, SECRET, 'session', -1), SECRET, 'session')).toBeUndefined();
  const [version, iv, data, tag] = sealed.split('.');
  const flipped = `${data.slice(0, -2)}${data.at(-2) === 'A' ? 'B' : 'A'}${data.at(-1)}`;
  expect(unseal([version, iv, flipped, tag].join('.'), SECRET, 'session')).toBeUndefined();
});

test('the Leitendenbereich and its API need the team, public writes are not served', () => {
  expect(routeAccess('GET', '/leitendenbereich')).toBe('staff');
  expect(routeAccess('GET', '/leitendenbereich/aufgaben')).toBe('staff');
  expect(routeAccess('POST', '/api/intern/pflege/aufgaben')).toBe('staff');
  expect(routeAccess('GET', '/api/aktionen')).toBe('public');
  expect(routeAccess('POST', '/api/kontakt')).toBe('none');
  expect(routeAccess('GET', '/leitendenbereich-app')).toBe('public');
});
