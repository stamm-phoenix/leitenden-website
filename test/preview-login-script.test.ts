import { expect, test } from 'bun:test';
import { isPreviewUrl, totp } from '../scripts/preview-login';
import { APP_CONFIG } from '../src/lib/server/config';

const DOMAIN = APP_CONFIG.hosts.production.replace(/^leitenden-website\./, '');

test('the script only signs in on PR previews of this app', () => {
  expect(isPreviewUrl(new URL(`https://leitenden-website---pr-6.${DOMAIN}/`))).toBe(true);
  for (const url of [
    `https://${APP_CONFIG.hosts.production}/`,
    `http://leitenden-website---pr-6.${DOMAIN}/`,
    `https://leitenden-website---pr-6.${DOMAIN}:8443/`,
    `https://leitenden-website---pr-6.${DOMAIN}.evil.example/`,
    `https://other-app---pr-6.${DOMAIN}/`,
    'https://zealous-water-04f606303-6.westeurope.1.azurestaticapps.net/',
    'https://www.stamm-phoenix.de/',
  ]) {
    expect(isPreviewUrl(new URL(url))).toBe(false);
  }
});

// RFC 6238, appendix B: SHA-1 key "12345678901234567890", the last six of eight digits
test('the code is the one of an authenticator app', () => {
  const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  expect(totp(secret, Math.floor(59 / 30))).toBe('287082');
  expect(totp(secret, Math.floor(1111111109 / 30))).toBe('081804');
  expect(totp(secret, Math.floor(20000000000 / 30))).toBe('353130');
});
