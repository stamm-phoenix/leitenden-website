/**
 * Signs the test account of PR previews in on a preview of this app and keeps the session, so
 * pages can be checked there with the real API and the test data of the preview database. Like
 * `web/scripts/preview-login.ts` of website-astro (`docs/preview-testkonto.md` there), whose
 * steps cannot be imported: that script runs on import and exports nothing.
 *
 *   bun scripts/preview-login.ts <preview URL> [--out <file>] [--shot <path>]... [--width <px>]
 *
 * Reads the login, password and TOTP secret from `PREVIEW_TEST_LOGIN`, `PREVIEW_TEST_PASSWORD`
 * and `PREVIEW_TEST_TOTP_SECRET`. The session goes to `--out` (default
 * `test-results/preview-auth/<host>.json`, ignored by git) and is reused while it is valid; load
 * it as `storageState` in Playwright. Each `--shot` path is saved as a full-page screenshot in
 * `test-results/preview-shots/` (390px wide unless `--width` says otherwise).
 */
import { createHmac } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { chromium } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import { APP_CONFIG } from '#lib/server/config';

/** The only pages the login data is ever typed into. */
const MICROSOFT_LOGIN = new Set([
  'https://login.microsoftonline.com',
  'https://login.microsoft.com',
]);
const STEP_TIMEOUT_MS = 20_000;
const MAX_STEPS = 12;

interface Options {
  base: URL;
  out: string;
  shots: string[];
  width: number;
}

interface Account {
  login: string;
  password: string;
  totpSecret: string;
}

interface Me {
  clientPrincipal?: { userDetails?: string; userRoles?: string[] } | null;
}

function usage(message: string): never {
  console.error(message);
  console.error(
    'Usage: bun scripts/preview-login.ts <preview URL> [--out <file>] [--shot <path>]... [--width <px>]'
  );
  process.exit(1);
}

/** Only PR previews of this app: the account is refused in production anyway (`previewLogin.ts`). */
export function isPreviewUrl(url: URL): boolean {
  return url.protocol === 'https:' && !url.port && APP_CONFIG.hosts.preview.test(url.hostname);
}

function parseArgs(args: string[]): Options {
  let base: URL | undefined;
  let out: string | undefined;
  const shots: string[] = [];
  let width = 390;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--out') out = args[++i];
    else if (arg === '--shot') shots.push(args[++i]);
    else if (arg === '--width') width = Number(args[++i]);
    else if (!base && URL.canParse(arg)) base = new URL(arg);
    else usage(`Unknown argument: ${arg}`);
  }
  if (!base) usage('The preview URL is missing.');
  if (!isPreviewUrl(base)) usage(`Not a PR preview of this app: ${base.origin}`);
  if (!Number.isInteger(width) || width < 320) usage('--width needs a number of at least 320.');
  if (shots.some((path) => !path?.startsWith('/') || path.startsWith('//'))) {
    usage('--shot needs a path of the preview, e.g. /leitendenbereich/aufgaben.');
  }
  return {
    base: new URL(base.origin),
    out: out ?? join('test-results', 'preview-auth', `${base.hostname}.json`),
    shots,
    width,
  };
}

function account(): Account {
  const login = process.env.PREVIEW_TEST_LOGIN;
  const password = process.env.PREVIEW_TEST_PASSWORD;
  const totpSecret = process.env.PREVIEW_TEST_TOTP_SECRET;
  if (!login || !password || !totpSecret) {
    usage('PREVIEW_TEST_LOGIN, PREVIEW_TEST_PASSWORD and PREVIEW_TEST_TOTP_SECRET must be set.');
  }
  return { login, password, totpSecret };
}

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function fromBase32(value: string): Buffer {
  const bytes: number[] = [];
  let bits = 0;
  let acc = 0;
  for (const char of value.toUpperCase().replace(/[\s=-]/g, '')) {
    const index = BASE32.indexOf(char);
    if (index < 0) throw new Error('PREVIEW_TEST_TOTP_SECRET is not a Base32 key.');
    acc = ((acc << 5) | index) & 0xffff;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((acc >> bits) & 0xff);
    }
  }
  return Buffer.from(bytes);
}

/** The six-digit code of an authenticator app (RFC 6238: HMAC-SHA-1, 30-second steps). */
export function totp(secret: string, step: number): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hash = createHmac('sha1', fromBase32(secret)).update(counter).digest();
  const offset = hash[hash.length - 1] & 0x0f;
  return ((hash.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).toString().padStart(6, '0');
}

const sleep = (ms: number): Promise<void> => new Promise((done) => setTimeout(done, ms));

/** A code that stays valid for at least five more seconds and was not typed before. */
async function freshCode(secret: string, used: number | null): Promise<[string, number]> {
  for (;;) {
    const seconds = Date.now() / 1000;
    const step = Math.floor(seconds / 30);
    if (step !== used && 30 - (seconds % 30) > 5) return [totp(secret, step), step];
    await sleep(1000);
  }
}

async function me(context: BrowserContext, base: URL): Promise<Me['clientPrincipal']> {
  const response = await context.request.get(new URL('/.auth/me', base).href);
  if (!response.ok()) return null;
  return ((await response.json()) as Me).clientPrincipal ?? null;
}

type Step = 'done' | 'email' | 'password' | 'code' | 'other-way' | 'choose-code' | 'stay' | 'error';

function onMicrosoftLogin(page: Page): boolean {
  return MICROSOFT_LOGIN.has(new URL(page.url()).origin);
}

/** Which page of the Microsoft login is shown (English, forced via the browser locale). */
async function stepOf(page: Page, base: URL): Promise<Step | null> {
  if (new URL(page.url()).origin === base.origin) return 'done';
  if (!onMicrosoftLogin(page)) {
    throw new Error(`The login led to ${new URL(page.url()).origin}; nothing was entered there.`);
  }
  // Each page also holds the hidden fields of the others for password managers
  const shown = (selector: string): Promise<boolean> =>
    page
      .locator(selector)
      .evaluateAll((elements) =>
        elements.some(
          (element) =>
            element.checkVisibility({ opacityProperty: true, visibilityProperty: true }) &&
            !element.closest('[aria-hidden="true"]')
        )
      )
      .catch(() => false);
  if (await shown('#usernameError, #passwordError, #idSpan_SAOTCC_Error_OTC')) return 'error';
  if (await shown('input[name="otc"]')) return 'code';
  if (await shown('input[name="passwd"]')) return 'password';
  if (await shown('input[name="loginfmt"]')) return 'email';
  if (await shown('#KmsiCheckboxField, input[name="DontShowAgain"]')) return 'stay';
  if (await shown('[data-value="PhoneAppOTP"]')) return 'choose-code';
  if (await shown('#signInAnotherWay')) return 'other-way';
  return null;
}

async function nextStep(page: Page, base: URL, previous: Step | null): Promise<Step> {
  const until = Date.now() + STEP_TIMEOUT_MS;
  while (Date.now() < until) {
    const step = await stepOf(page, base);
    if (step && (step !== previous || step === 'done')) return step;
    await sleep(500);
  }
  throw new Error(`The login got stuck at ${page.url()}.`);
}

/**
 * Types a value of the account and submits it, only on the Microsoft login. Playwright's errors
 * list the typed value, so they are replaced by a message without it.
 */
async function enter(page: Page, selector: string, value: string): Promise<void> {
  if (!onMicrosoftLogin(page)) throw new Error('Left the Microsoft login unexpectedly.');
  try {
    await page.locator(selector).fill(value, { timeout: STEP_TIMEOUT_MS });
    await page.keyboard.press('Enter');
  } catch {
    throw new Error(`Could not fill ${selector} at ${new URL(page.url()).origin}.`);
  }
}

async function signIn(page: Page, base: URL, credentials: Account): Promise<void> {
  await page.goto(new URL('/.auth/login/aad?post_login_redirect_uri=/leitendenbereich', base).href);
  let step: Step | null = null;
  let usedCode: number | null = null;
  for (let i = 0; i < MAX_STEPS; i++) {
    step = await nextStep(page, base, step);
    if (step === 'done') {
      if (new URL(page.url()).pathname.startsWith('/anmeldung-fehlgeschlagen')) {
        throw new Error('Microsoft accepted the login, but the preview refused it.');
      }
      return;
    }
    if (!onMicrosoftLogin(page)) throw new Error('Left the Microsoft login unexpectedly.');
    switch (step) {
      case 'error': {
        const text = await page.locator('[role="alert"], .alert-error').first().textContent();
        throw new Error(`Microsoft refused the login: ${text?.trim() ?? page.url()}`);
      }
      case 'email':
        await enter(page, 'input[name="loginfmt"]', credentials.login);
        break;
      case 'password':
        await enter(page, 'input[name="passwd"]', credentials.password);
        break;
      case 'other-way':
        await page.locator('#signInAnotherWay').click();
        break;
      case 'choose-code':
        await page.locator('[data-value="PhoneAppOTP"]').first().click();
        break;
      case 'code': {
        const [code, counter] = await freshCode(credentials.totpSecret, usedCode);
        usedCode = counter;
        await enter(page, 'input[name="otc"]', code);
        break;
      }
      case 'stay':
        await page.locator('#idBtn_Back').click();
        break;
    }
  }
  throw new Error(`The login did not finish after ${MAX_STEPS} steps, last at ${page.url()}.`);
}

function shotFile(path: string, width: number): string {
  const name = path.replace(/^\/|\/$/g, '').replace(/[^a-z0-9]+/gi, '-') || 'start';
  return join('test-results', 'preview-shots', `${name}-${width}.png`);
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const browser = await chromium.launch();
  try {
    const contextOptions = {
      locale: 'en-US',
      colorScheme: 'light' as const,
      viewport: { width: options.width, height: 844 },
      isMobile: options.width < 768,
      hasTouch: options.width < 768,
    };
    let context = await browser.newContext({
      ...contextOptions,
      storageState: existsSync(options.out) ? options.out : undefined,
    });
    let principal = await me(context, options.base);
    if (principal) {
      console.log(`Session still valid for ${principal.userDetails}.`);
    } else {
      await context.close();
      context = await browser.newContext(contextOptions);
      await signIn(await context.newPage(), options.base, account());
      principal = await me(context, options.base);
      if (!principal) throw new Error('The login finished, but the preview knows no user.');
      mkdirSync(dirname(options.out), { recursive: true });
      await context.storageState({ path: options.out });
      // Holds the Microsoft cookies of the account too
      chmodSync(options.out, 0o600);
      console.log(`Logged in as ${principal.userDetails}.`);
    }
    console.log(`Roles: ${(principal.userRoles ?? []).join(', ')}`);
    console.log(`Session: ${options.out}`);

    if (options.shots.length > 0) {
      const page = await context.newPage();
      for (const path of options.shots) {
        const response = await page.goto(new URL(path, options.base).href);
        // Some pages keep a request open, so the network never goes quiet there
        await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
        const file = shotFile(path, options.width);
        mkdirSync(dirname(file), { recursive: true });
        await page.screenshot({ path: file, fullPage: true });
        console.log(`${response?.status() ?? '?'} ${path} → ${file}`);
      }
    }
    await context.close();
  } finally {
    await browser.close();
  }
}

if (import.meta.main) {
  main().catch((failure: unknown) => {
    // Only the first line: Playwright's call logs may hold typed values
    console.error(failure instanceof Error ? failure.message.split('\n')[0] : 'The login failed.');
    process.exit(1);
  });
}
