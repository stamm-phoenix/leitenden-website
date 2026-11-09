import { expect, test } from 'bun:test';

// login.ts needs SvelteKit and MSAL at import; the check is small enough to mirror its contract
const { safeReturnPath } = await import('../src/lib/server/login');

test('only paths of this app are accepted after the login', () => {
  expect(safeReturnPath('/leitendenbereich/aufgaben?x=1')).toBe('/leitendenbereich/aufgaben?x=1');
  expect(safeReturnPath('/leitendenbereich/aufgaben?x=1#neu')).toBe(
    '/leitendenbereich/aufgaben?x=1#neu'
  );
  expect(safeReturnPath('//evil.example')).toBe('/leitendenbereich');
  expect(safeReturnPath('/\\evil.example')).toBe('/leitendenbereich');
  expect(safeReturnPath('https://evil.example')).toBe('/leitendenbereich');
  expect(safeReturnPath(null, '/abgemeldet')).toBe('/abgemeldet');
});

test('characters the browser drops or rewrites do not lead to another host', () => {
  for (const value of [
    '/\t/evil.example',
    '/\n/evil.example',
    '/\r/evil.example',
    '/\t\\evil.example',
    '\t//evil.example',
    '/\\/evil.example',
  ]) {
    expect(safeReturnPath(value, '/abgemeldet')).toBe('/abgemeldet');
  }
});

test('the returned path has no tab or line break left for the Location header', () => {
  expect(safeReturnPath('/leitenden\tbereich\n/aufgaben')).toBe('/leitendenbereich/aufgaben');
});
