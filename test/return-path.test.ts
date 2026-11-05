import { expect, test } from 'bun:test';

// login.ts needs SvelteKit and MSAL at import; the check is small enough to mirror its contract
const { safeReturnPath } = await import('../src/lib/server/login');

test('only paths of this app are accepted after the login', () => {
  expect(safeReturnPath('/leitendenbereich/aufgaben?x=1')).toBe('/leitendenbereich/aufgaben?x=1');
  expect(safeReturnPath('//evil.example')).toBe('/leitendenbereich');
  expect(safeReturnPath('/\\evil.example')).toBe('/leitendenbereich');
  expect(safeReturnPath('https://evil.example')).toBe('/leitendenbereich');
  expect(safeReturnPath(null, '/abgemeldet')).toBe('/abgemeldet');
});
