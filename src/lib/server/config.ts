/**
 * Non-secret configuration of this app. Secrets and switches come from the environment
 * (`env.ts`); the configuration shared with website-astro stays in its `api/lib/config.ts`.
 */
import { CONFIG } from '#legacy/api/lib/config';

const ENVIRONMENT_DOMAIN = 'proudfield-37525178.germanywestcentral.azurecontainerapps.io';

export const APP_CONFIG = {
  /**
   * The app registration `website-astro`: leaders sign in with it, and the API reaches Azure
   * SQL, Blob Storage and Graph as it, so this app has exactly the rights of the website's API.
   */
  azure: {
    tenantId: CONFIG.azure.tenantId,
    appClientId: CONFIG.azure.clientId,
    /**
     * Managed Identity `leitenden-website-runtime` of the Container App. The app registration
     * trusts it (federated credential), so no certificate or secret is needed.
     */
    runtimeIdentityClientId: '44262fa9-27f6-41a2-9cf7-2893b2852ee4',
  },
  /** Hosts this app answers on; every one needs its login callback in the app registration. */
  hosts: {
    production: `leitenden-website.${ENVIRONMENT_DOMAIN}`,
    preview: new RegExp(
      `^leitenden-website---pr-[1-9]\\d{0,5}\\.${ENVIRONMENT_DOMAIN.replaceAll('.', '\\.')}$`
    ),
  },
  /** The public website; modules not moved yet open there. */
  website: 'https://www.stamm-phoenix.de',
  session: {
    cookie: 'lw_session',
    loginCookie: 'lw_login',
    /** A login lasts two weeks; the teams are checked again on every request (`roles.ts`). */
    maxAgeSeconds: 14 * 24 * 60 * 60,
    loginMaxAgeSeconds: 10 * 60,
  },
  /** How long the teams of a person are trusted before Graph is asked again. */
  roleCacheMs: 5 * 60_000,
} as const;
