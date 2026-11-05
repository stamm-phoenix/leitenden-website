/**
 * The user as Static Web Apps would describe them (`ClientPrincipal`), built from the login
 * cookie. The API of website-astro reads it from the `x-ms-client-principal` header and the
 * browser from `/.auth/me`. The team roles are read from Graph like `GetRoles` does at an SWA
 * login, but on every request (cached for a few minutes), so a team change needs no new login.
 */
import type { ClientPrincipal } from '#legacy/api/lib/staff-auth';
import { getTeamRoles } from '#legacy/api/lib/staff-roles';
import type { ReadMemberGroups } from '#legacy/api/lib/staff-roles';
import { APP_CONFIG } from './config';
import type { Session } from './session';

interface CachedRoles {
  roles: string[];
  at: number;
}

const cache = new Map<string, CachedRoles>();
const pending = new Map<string, Promise<string[]>>();

function claimsOf(session: Session): ClientPrincipal['claims'] {
  const claims = [
    { typ: 'oid', val: session.oid },
    { typ: 'tid', val: session.tid },
    { typ: 'preferred_username', val: session.login },
  ];
  if (session.name) claims.push({ typ: 'name', val: session.name });
  if (session.givenName) claims.push({ typ: 'given_name', val: session.givenName });
  return claims;
}

function basePrincipal(session: Session): ClientPrincipal {
  return {
    identityProvider: 'aad',
    userId: session.oid,
    userDetails: session.login,
    userRoles: ['anonymous', 'authenticated'],
    claims: claimsOf(session),
  };
}

/**
 * The team roles of the person. Without an answer from Graph the last known roles stay valid,
 * and someone never seen before gets none (like `GetRoles`).
 */
export async function teamRoles(
  session: Session,
  read?: ReadMemberGroups,
  now = Date.now()
): Promise<string[]> {
  const cached = cache.get(session.oid);
  if (cached && now - cached.at < APP_CONFIG.roleCacheMs) return cached.roles;
  let request = pending.get(session.oid);
  if (!request) {
    request = getTeamRoles(basePrincipal(session), read)
      .then((roles) => {
        cache.set(session.oid, { roles, at: now });
        return roles;
      })
      .catch((error: unknown) => {
        console.error('[rollen] Teams konnten nicht gelesen werden', error);
        return cached?.roles ?? [];
      })
      .finally(() => pending.delete(session.oid));
    pending.set(session.oid, request);
  }
  return request;
}

export async function principalOf(
  session: Session,
  read?: ReadMemberGroups
): Promise<ClientPrincipal> {
  const principal = basePrincipal(session);
  principal.userRoles.push(...(await teamRoles(session, read)));
  return principal;
}

/** The header value that Static Web Apps passes to its API. */
export function principalHeader(principal: ClientPrincipal): string {
  return Buffer.from(JSON.stringify(principal), 'utf8').toString('base64');
}

/** Only for tests. */
export function clearRoleCache(): void {
  cache.clear();
  pending.clear();
}
