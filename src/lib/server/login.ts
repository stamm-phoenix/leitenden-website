/**
 * Login with Microsoft Entra (authorization code flow with PKCE) under the same addresses as
 * the login of Static Web Apps (`/.auth/login/aad`, `/.auth/logout`, `/.auth/me`), so the
 * components of website-astro work unchanged. The app proves itself with its Managed Identity
 * (`getClientAssertion`), not with a secret.
 */
import { ConfidentialClientApplication, CryptoProvider } from '@azure/msal-node';
import type { AuthenticationResult, AuthorizationCodeRequest } from '@azure/msal-node';
import { error, redirect } from '@sveltejs/kit';
import type { Cookies } from '@sveltejs/kit';
import { z } from 'zod';
import { APP_CONFIG } from './config';
import { env } from './env';
import { mayLogInHere } from './previewLogin';
import { seal, unseal } from './sealed';
import { writeSession } from './session';
import { getClientAssertion } from './token';

const SCOPES = ['openid', 'profile', 'email'];
const CALLBACK_PATH = '/.auth/login/aad/callback';
const LOGIN_PURPOSE = 'login';
export const DEFAULT_RETURN = '/leitendenbereich';
export const FAILED_PATH = '/anmeldung-fehlgeschlagen';

const loginStateSchema = z.object({
  state: z.string(),
  nonce: z.string(),
  verifier: z.string(),
  returnTo: z.string(),
});
type LoginState = z.infer<typeof loginStateSchema>;

let client: ConfidentialClientApplication | undefined;
const crypto = new CryptoProvider();

function getClient(): ConfidentialClientApplication {
  client ??= new ConfidentialClientApplication({
    auth: {
      clientId: APP_CONFIG.azure.appClientId,
      authority: `https://login.microsoftonline.com/${APP_CONFIG.azure.tenantId}`,
      clientAssertion: getClientAssertion,
    },
  });
  return client;
}

/** Only paths of this app, never another host (`//evil`, `/\evil`). */
export function safeReturnPath(
  value: string | null | undefined,
  fallback = DEFAULT_RETURN
): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return fallback;
  }
  return value;
}

/** The hosts whose login callback is registered in the app registration. */
export function isKnownHost(host: string): boolean {
  return host === APP_CONFIG.hosts.production || APP_CONFIG.hosts.preview.test(host);
}

function callbackUrl(url: URL): string {
  if (!isKnownHost(url.host)) error(400, 'Unbekannte Adresse für die Anmeldung.');
  return `${url.origin}${CALLBACK_PATH}`;
}

function secure(url: URL): boolean {
  return url.protocol === 'https:';
}

export async function startLogin(url: URL, cookies: Cookies): Promise<never> {
  const returnTo = safeReturnPath(url.searchParams.get('post_login_redirect_uri'));
  const { verifier, challenge } = await crypto.generatePkceCodes();
  const state = crypto.createNewGuid();
  const nonce = crypto.createNewGuid();
  cookies.set(
    APP_CONFIG.session.loginCookie,
    seal(
      { state, nonce, verifier, returnTo },
      env.sessionSecret,
      LOGIN_PURPOSE,
      APP_CONFIG.session.loginMaxAgeSeconds
    ),
    {
      path: '/.auth/',
      httpOnly: true,
      secure: secure(url),
      sameSite: 'lax',
      maxAge: APP_CONFIG.session.loginMaxAgeSeconds,
    }
  );
  const target = await getClient().getAuthCodeUrl({
    scopes: SCOPES,
    redirectUri: callbackUrl(url),
    codeChallenge: challenge,
    codeChallengeMethod: 'S256',
    state,
    nonce,
    responseMode: 'query',
  });
  redirect(302, target, { external: ['https://login.microsoftonline.com'] });
}

function claim(claims: Record<string, unknown>, name: string): string | undefined {
  const value = claims[name];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/**
 * The request that redeems the code. MSAL checks the nonce of the ID token only against the
 * nonce passed here, and rejects every token that has one when none is passed (`nonce_mismatch`).
 */
export function tokenRequest(
  code: string,
  redirectUri: string,
  pending: LoginState
): AuthorizationCodeRequest {
  return {
    code,
    scopes: SCOPES,
    redirectUri,
    codeVerifier: pending.verifier,
    nonce: pending.nonce,
  };
}

/**
 * A redirect, not `error()`: SvelteKit drops the cookies of a thrown error, so the login cookie
 * would stay and a reload would redeem the used code again.
 */
function failed(returnTo: string): never {
  redirect(302, `${FAILED_PATH}?ziel=${encodeURIComponent(returnTo)}`);
}

export async function finishLogin(url: URL, cookies: Cookies): Promise<never> {
  const pending = loginStateSchema.safeParse(
    unseal(cookies.get(APP_CONFIG.session.loginCookie), env.sessionSecret, LOGIN_PURPOSE)
  );
  cookies.delete(APP_CONFIG.session.loginCookie, { path: '/.auth/' });
  // Expired or opened in another browser: start again instead of showing an error
  if (!pending.success) redirect(302, '/.auth/login/aad');
  const { returnTo } = pending.data;

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || state !== pending.data.state) {
    redirect(302, `/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent(returnTo)}`);
  }

  let result: AuthenticationResult;
  try {
    result = await getClient().acquireTokenByCode(
      tokenRequest(code, callbackUrl(url), pending.data)
    );
  } catch (failure: unknown) {
    console.error('[anmeldung] Code konnte nicht eingelöst werden', failure);
    failed(returnTo);
  }
  // Only the claims are needed; the in-memory token cache would otherwise grow with every login
  if (result.account) await getClient().getTokenCache().removeAccount(result.account);

  const claims = result.idTokenClaims as Record<string, unknown>;
  const oid = claim(claims, 'oid');
  const tid = claim(claims, 'tid');
  const login = claim(claims, 'preferred_username') ?? claim(claims, 'email');
  if (claims.nonce !== pending.data.nonce || !oid || !login || tid !== APP_CONFIG.azure.tenantId) {
    console.error('[anmeldung] Anmeldung abgelehnt', { oid, tid, hasLogin: Boolean(login) });
    failed(returnTo);
  }
  // The test account of PR previews never gets a session elsewhere (previewLogin.ts)
  if (!mayLogInHere(login)) {
    console.error('[anmeldung] Testkonto außerhalb einer Vorschau abgelehnt', { oid });
    failed(returnTo);
  }
  writeSession(
    cookies,
    { oid, tid, login, name: claim(claims, 'name'), givenName: claim(claims, 'given_name') },
    secure(url)
  );
  redirect(302, returnTo);
}
