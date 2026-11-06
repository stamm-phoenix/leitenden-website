/**
 * Answers `/api/*` with the Azure Functions endpoints of website-astro, unchanged: their
 * `app.http()` registrations (shim.ts) become routes, and the Fetch request of SvelteKit is
 * handed over as the `HttpRequest` they expect.
 */
import { createContext, useLegacyApiDir } from './context';
import { matchRoute, registeredRoutes } from './registry';
import type { Cookie, HttpRequest, HttpResponseInit } from './types';

let loading: Promise<void> | undefined;

/** Imports `api/main.ts` of the submodule once; its imports register every endpoint. */
export function loadLegacyApi(): Promise<void> {
  useLegacyApiDir();
  loading ??= import('#legacy/api/main').then(() => undefined);
  return loading;
}

function toHttpRequest(request: Request, params: Record<string, string>): HttpRequest {
  const url = new URL(request.url);
  return {
    method: request.method,
    url: request.url,
    headers: request.headers,
    query: url.searchParams,
    params,
    user: null,
    get body() {
      return request.body;
    },
    get bodyUsed() {
      return request.bodyUsed;
    },
    arrayBuffer: () => request.arrayBuffer(),
    blob: () => request.blob(),
    formData: () => request.formData() as Promise<FormData>,
    json: () => request.json(),
    text: () => request.text(),
    clone: () => toHttpRequest(request.clone(), params),
  };
}

function serializeCookie(cookie: Cookie): string {
  const parts = [`${cookie.name}=${encodeURIComponent(cookie.value)}`];
  if (cookie.domain) parts.push(`Domain=${cookie.domain}`);
  parts.push(`Path=${cookie.path ?? '/'}`);
  if (cookie.expires !== undefined) {
    parts.push(`Expires=${new Date(cookie.expires).toUTCString()}`);
  }
  if (cookie.maxAge !== undefined) parts.push(`Max-Age=${cookie.maxAge}`);
  if (cookie.secure) parts.push('Secure');
  if (cookie.httpOnly) parts.push('HttpOnly');
  if (cookie.sameSite) parts.push(`SameSite=${cookie.sameSite}`);
  return parts.join('; ');
}

function toBody(init: HttpResponseInit, headers: Headers): BodyInit | null {
  if (init.jsonBody !== undefined) {
    if (!headers.has('content-type')) headers.set('content-type', 'application/json');
    return JSON.stringify(init.jsonBody);
  }
  const body = init.body;
  if (body === undefined || body === null) return null;
  if (
    typeof body === 'object' &&
    Symbol.asyncIterator in body &&
    !(body instanceof ReadableStream)
  ) {
    // Node has ReadableStream.from; the DOM types do not know it yet
    const from = (
      ReadableStream as unknown as { from(source: AsyncIterable<Uint8Array>): ReadableStream }
    ).from;
    return from(body);
  }
  return body as BodyInit;
}

export function toResponse(init: HttpResponseInit): Response {
  const headers = new Headers(init.headers);
  for (const cookie of init.cookies ?? []) headers.append('set-cookie', serializeCookie(cookie));
  const status = init.status ?? 200;
  const body = toBody(init, headers);
  // 204 and 304 must not have a body in the Fetch API
  return new Response(status === 204 || status === 304 ? null : body, { status, headers });
}

function splitPath(pathname: string): string[] {
  return pathname
    .replace(/^\/api\/?/, '')
    .split('/')
    .filter(Boolean)
    .map((part) => decodeURIComponent(part));
}

/** The answer of the endpoint for `request`, whose path starts with `/api/`. */
export async function handleApiRequest(request: Request): Promise<Response> {
  await loadLegacyApi();
  const path = splitPath(new URL(request.url).pathname);
  for (const route of registeredRoutes()) {
    if (!route.methods.has(request.method)) continue;
    const params = matchRoute(route, path);
    if (!params) continue;
    const context = createContext(route.name);
    try {
      return toResponse(await route.handler(toHttpRequest(request, params), context));
    } catch (error: unknown) {
      context.error('Unhandled error', error);
      return new Response(null, { status: 500 });
    }
  }
  return new Response(null, { status: 404 });
}
