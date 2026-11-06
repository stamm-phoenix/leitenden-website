import { expect, test } from 'bun:test';

const { tokenRequest } = await import('../src/lib/server/login');

test('the code is redeemed with the nonce and verifier of its login', () => {
  // Without the nonce MSAL rejects every ID token with nonce_mismatch
  const request = tokenRequest('the-code', 'https://host/.auth/login/aad/callback', {
    state: 's',
    nonce: 'n-123',
    verifier: 'v-456',
    returnTo: '/leitendenbereich',
  });
  expect(request.code).toBe('the-code');
  expect(request.nonce).toBe('n-123');
  expect(request.codeVerifier).toBe('v-456');
  expect(request.redirectUri).toBe('https://host/.auth/login/aad/callback');
});
