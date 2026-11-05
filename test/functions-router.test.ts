import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'bun:test';
import { compareRoutes, matchRoute, parseTemplate } from '../src/lib/server/functions/registry';
import type { Route } from '../src/lib/server/functions/registry';
import { toResponse } from '../src/lib/server/functions/router';

function route(template: string): Route {
  return {
    name: template,
    template,
    segments: parseTemplate(template),
    methods: new Set(['GET']),
    handler: () => ({}),
  };
}

const path = (value: string): string[] => value.split('/').filter(Boolean);

describe('matchRoute', () => {
  test('matches literals case-insensitively and reads parameters', () => {
    expect(matchRoute(route('intern/aufgaben/{id}'), path('Intern/Aufgaben/42'))).toEqual({
      id: '42',
    });
    expect(matchRoute(route('intern/aufgaben/{id}'), path('intern/aufgaben'))).toBeUndefined();
    expect(matchRoute(route('intern/aufgaben/{id}'), path('intern/aufgaben/1/x'))).toBeUndefined();
  });

  test('honours int constraints and optional parameters', () => {
    expect(matchRoute(route('items/{id:int}'), path('items/abc'))).toBeUndefined();
    expect(matchRoute(route('items/{id:int}'), path('items/7'))).toEqual({ id: '7' });
    expect(matchRoute(route('items/{id:int?}'), path('items'))).toEqual({});
  });

  test('catch-all takes the rest of the path', () => {
    expect(matchRoute(route('files/{*rest}'), path('files/a/b'))).toEqual({ rest: 'a/b' });
  });
});

test('literal routes win over parameter routes, as in the Functions host', () => {
  const routes = [route('aufgaben/{id}'), route('aufgaben/projekte'), route('aufgaben/{id:int}')];
  expect(routes.sort(compareRoutes).map((r) => r.template)).toEqual([
    'aufgaben/projekte',
    'aufgaben/{id:int}',
    'aufgaben/{id}',
  ]);
});

describe('toResponse', () => {
  test('serializes jsonBody with its content type', async () => {
    const response = toResponse({ status: 201, jsonBody: { ok: true } });
    expect(response.status).toBe(201);
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(await response.json()).toEqual({ ok: true });
  });

  test('keeps cookies and drops the body of a 204', async () => {
    const response = toResponse({
      status: 204,
      body: 'ignored',
      cookies: [{ name: 'a', value: 'b c', httpOnly: true, sameSite: 'Lax' }],
    });
    expect(response.headers.get('set-cookie')).toBe('a=b%20c; Path=/; HttpOnly; SameSite=Lax');
    expect(await response.text()).toBe('');
  });
});

test('text and a parameter can share a segment', () => {
  expect(matchRoute(route('aktionen/{stufe}.ics'), path('aktionen/woelflinge.ics'))).toEqual({
    stufe: 'woelflinge',
  });
  expect(matchRoute(route('aktionen/{stufe}.ics'), path('aktionen/woelflinge'))).toBeUndefined();
  expect(matchRoute(route('aktionen/{stufe}.ics'), path('aktionen/.ics'))).toBeUndefined();
});

test('every route template of website-astro can be parsed', async () => {
  const root = new URL('../vendor/website-astro/api/', import.meta.url).pathname;
  const files = ['main.ts', ...new Bun.Glob('endpoints/**/*.ts').scanSync(root)];
  const templates = files.flatMap((file) =>
    [...readFileSync(root + file, 'utf8').matchAll(/route: '([^']*)'/g)].map(
      (match: RegExpMatchArray) => match[1]
    )
  );
  expect(templates.length).toBeGreaterThan(200);
  for (const template of templates) expect(() => parseTemplate(template)).not.toThrow();
});
