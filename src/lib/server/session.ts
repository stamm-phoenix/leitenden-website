/**
 * The login of a person, kept in an encrypted cookie. It holds who signed in, not what they
 * may do: the teams are read fresh (`roles.ts`), so a team change applies without a new login.
 */
import { z } from 'zod';
import type { Cookies } from '@sveltejs/kit';
import { APP_CONFIG } from './config';
import { env } from './env';
import { seal, unseal } from './sealed';

const sessionSchema = z.object({
  /** Object ID in Entra; stays when the login is renamed. */
  oid: z.string().min(1),
  tid: z.string().min(1),
  /** Login (`preferred_username`), e.g. vorname.nachname@stamm-phoenix.de. */
  login: z.string().min(1),
  name: z.string().optional(),
  givenName: z.string().optional(),
});

export type Session = z.infer<typeof sessionSchema>;

const PURPOSE = 'session';

function cookieOptions(secure: boolean, maxAge: number) {
  return { path: '/', httpOnly: true, secure, sameSite: 'lax' as const, maxAge };
}

export function readSession(cookies: Cookies): Session | undefined {
  const value = unseal(cookies.get(APP_CONFIG.session.cookie), env.sessionSecret, PURPOSE);
  const parsed = sessionSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

export function writeSession(cookies: Cookies, session: Session, secure: boolean): void {
  const { maxAgeSeconds } = APP_CONFIG.session;
  cookies.set(
    APP_CONFIG.session.cookie,
    seal(session, env.sessionSecret, PURPOSE, maxAgeSeconds),
    cookieOptions(secure, maxAgeSeconds)
  );
}

export function clearSession(cookies: Cookies, secure: boolean): void {
  cookies.delete(APP_CONFIG.session.cookie, cookieOptions(secure, 0));
}
