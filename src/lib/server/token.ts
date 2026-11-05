/**
 * Replaces `api/lib/token.ts` of website-astro (vite/legacyCode.ts). The API signs in as the
 * app registration `website-astro` like before, but proves it with the Managed Identity of the
 * Container App (federated credential) instead of a certificate. Locally it uses the Azure CLI.
 */
import {
  AzureCliCredential,
  ClientAssertionCredential,
  ManagedIdentityCredential,
} from '@azure/identity';
import type { TokenCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { APP_CONFIG } from './config';
import { env } from './env';

let cachedIdentity: ManagedIdentityCredential | undefined;
let cachedCredential: TokenCredential | undefined;
let cachedClient: Client | undefined;

/** A token of the Managed Identity that the app registration accepts as its credential. */
export async function getClientAssertion(): Promise<string> {
  cachedIdentity ??= new ManagedIdentityCredential({
    clientId: APP_CONFIG.azure.runtimeIdentityClientId,
  });
  const token = await cachedIdentity.getToken('api://AzureADTokenExchange/.default');
  if (!token) throw new Error('No token of the Managed Identity');
  return token.token;
}

export function getCredential(): TokenCredential {
  cachedCredential ??= env.inAzure
    ? new ClientAssertionCredential(
        APP_CONFIG.azure.tenantId,
        APP_CONFIG.azure.appClientId,
        getClientAssertion
      )
    : new AzureCliCredential();
  return cachedCredential;
}

export function getClient(): Client {
  cachedClient ??= Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => {
        const token = await getCredential().getToken('https://graph.microsoft.com/.default');
        if (!token) throw new Error('Failed to acquire access token');
        return token.token;
      },
    },
  });
  return cachedClient;
}
