/**
 * Finishes a login as `finishLogin` does on the callback, with Microsoft's answer faked
 * (`LOGIN_CLAIMS`), and prints where it redirected, the session it wrote and the roles of that
 * session. Run by test/preview-login.test.ts in a process of its own, with `PREVIEW_DATABASE`
 * set or not: the preview name is read on import, and the code of website-astro gets this
 * app's `deployment.ts` as in the build (vite/legacyCode.ts).
 */
import { plugin } from 'bun';
import { fileURLToPath } from 'node:url';
import type { Cookies } from '@sveltejs/kit';
import * as msal from '@azure/msal-node';

const claims = JSON.parse(process.env.LOGIN_CLAIMS ?? '{}') as Record<string, unknown>;
const deployment = fileURLToPath(new URL('../../src/lib/server/deployment.ts', import.meta.url));

plugin({
  name: 'login-run',
  setup(build) {
    build.onLoad({ filter: /vendor\/website-astro\/api\/lib\/deployment\.ts$/ }, () => ({
      contents: `export * from ${JSON.stringify(deployment)};`,
      loader: 'ts',
    }));
    build.module('@azure/msal-node', () => ({
      loader: 'object',
      exports: {
        ...msal,
        ConfidentialClientApplication: class {
          async acquireTokenByCode(): Promise<unknown> {
            return { idTokenClaims: claims, account: null };
          }
        },
      },
    }));
  },
});

const { finishLogin } = await import('../../src/lib/server/login');
const { seal } = await import('../../src/lib/server/sealed');
const { readSession } = await import('../../src/lib/server/session');
const { principalOf } = await import('../../src/lib/server/principal');
const { APP_CONFIG } = await import('../../src/lib/server/config');

const jar = new Map<string, string>();
jar.set(
  APP_CONFIG.session.loginCookie,
  seal(
    {
      state: 'state',
      nonce: String(claims.nonce),
      verifier: 'verifier',
      returnTo: '/leitendenbereich',
    },
    process.env.SESSION_SECRET ?? '',
    'login',
    60
  )
);
const cookies = {
  get: (name: string) => jar.get(name),
  set: (name: string, value: string) => void jar.set(name, value),
  delete: (name: string) => void jar.delete(name),
} as unknown as Cookies;

let location: string | undefined;
try {
  await finishLogin(
    new URL(`https://${APP_CONFIG.hosts.production}/.auth/login/aad/callback?code=c&state=state`),
    cookies
  );
} catch (thrown: unknown) {
  location = (thrown as { location?: string }).location;
}

const sessionWritten = jar.has(APP_CONFIG.session.cookie);
const session = readSession(cookies);
// Graph is never asked here: a normal account gets the team Graph reports, the test account
// its roles without Graph
const roles = session
  ? (await principalOf(session, async (_user, groups) => groups.slice(0, 1))).userRoles
  : null;
// A session of the same account sealed elsewhere (previews share SESSION_SECRET), e.g. a copied cookie
const copied = seal(
  { oid: claims.oid, tid: claims.tid, login: claims.preferred_username },
  process.env.SESSION_SECRET ?? '',
  'session',
  60
);
const copiedSessionValid = Boolean(readSession({ get: () => copied } as unknown as Cookies));
console.log(JSON.stringify({ location, sessionWritten, roles, copiedSessionValid }));
