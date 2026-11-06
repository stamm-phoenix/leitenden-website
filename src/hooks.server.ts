/**
 * Every request passes here: the login addresses of Static Web Apps (`/.auth/*`), the API of
 * website-astro (`/api/*`) and the protection of the pages, as `staticwebapp.config.json` does
 * it for the website.
 */
import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { handleApiRequest } from '#lib/server/functions/router';
import { finishLogin, safeReturnPath, startLogin } from '#lib/server/login';
import { principalHeader, principalOf } from '#lib/server/principal';
import { clearSession, readSession } from '#lib/server/session';
import { env } from '#lib/server/env';
import { STAFF_ROLE, routeAccess } from '#lib/server/access';
import { MOVED_PAGES, staffRegistryPath } from '#lib/staffPages';

const PRINCIPAL_HEADER = 'x-ms-client-principal';

/** Like the headers of `staticwebapp.config.json`; the CSP follows with the custom domain. */
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Strict-Transport-Security': 'max-age=31536000',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'X-Robots-Tag': 'noindex, nofollow',
};

async function handleAuth(event: RequestEvent): Promise<Response> {
  const { url, cookies } = event;
  const { pathname } = url;
  if (pathname === '/.auth/login/aad') return startLogin(url, cookies);
  if (pathname === '/.auth/login/aad/callback') return finishLogin(url, cookies);
  if (pathname === '/logout')
    return redirect(302, '/.auth/logout?post_logout_redirect_uri=/abgemeldet');
  if (pathname === '/.auth/logout') {
    clearSession(cookies, url.protocol === 'https:');
    return redirect(
      302,
      safeReturnPath(url.searchParams.get('post_logout_redirect_uri'), '/abgemeldet')
    );
  }
  if (pathname === '/.auth/me') {
    const session = readSession(cookies);
    const clientPrincipal = session ? await principalOf(session) : null;
    return Response.json({ clientPrincipal }, { headers: { 'cache-control': 'no-store' } });
  }
  return new Response(null, { status: 404 });
}

/** The API request with the principal of the login instead of anything the browser sent. */
async function forwardToApi(event: RequestEvent): Promise<Response> {
  const { request } = event;
  const headers = new Headers(request.headers);
  headers.delete(PRINCIPAL_HEADER);
  const principal = event.locals.principal;
  if (principal) headers.set(PRINCIPAL_HEADER, principalHeader(principal));
  const forwarded = new Request(request.url, {
    method: request.method,
    headers,
    body: request.body,
    signal: request.signal,
    // @ts-expect-error Node needs it to stream a request body; not yet in the DOM types
    duplex: 'half',
  });
  return handleApiRequest(forwarded);
}

const handleRequest: Handle = async ({ event, resolve }): Promise<Response> => {
  const { pathname } = event.url;
  if (pathname.startsWith('/.auth/') || pathname === '/logout') {
    return handleAuth(event);
  }

  const session = readSession(event.cookies);
  event.locals.principal = session ? await principalOf(session) : undefined;
  const roles = event.locals.principal?.userRoles ?? [];

  const access = routeAccess(event.request.method, pathname);
  if (access === 'staff' && !roles.includes(STAFF_ROLE)) {
    if (pathname.startsWith('/api/')) {
      return Response.json(
        { error: { code: session ? 'FORBIDDEN' : 'UNAUTHENTICATED' } },
        { status: session ? 403 : 401 }
      );
    }
    if (!session) {
      return redirect(
        302,
        `/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent(pathname + event.url.search)}`
      );
    }
    return redirect(302, '/kein-zugang');
  }
  if (access === 'none') return new Response(null, { status: 404 });

  if (pathname.startsWith('/api/')) return forwardToApi(event);
  return resolve(event);
};

/**
 * BaseLayout.astro marks the body of a bare page (no background pattern) in its HTML. The
 * layout keeps the class right on navigations; this sets it before the first paint.
 */
function withBareBody(resolve: Parameters<Handle>[0]['resolve']): Parameters<Handle>[0]['resolve'] {
  return (event, opts) =>
    resolve(event, {
      ...opts,
      transformPageChunk: MOVED_PAGES[staffRegistryPath(event.url.pathname)]?.bare
        ? ({ html }) => html.replace('<body class="', '<body class="is-bare ')
        : opts?.transformPageChunk,
    });
}

export const handle: Handle = async (input) => {
  const resolve = withBareBody(input.resolve);
  // In the demo mode the mock API of website-astro answers /api and /.auth (vite.config.ts)
  const response =
    env.mockApi && !env.inAzure
      ? await resolve(input.event)
      : await handleRequest({ event: input.event, resolve });
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!response.headers.has(name)) response.headers.set(name, value);
  }
  return response;
};
