/**
 * Encrypted, authenticated cookie values (AES-256-GCM). Nothing in them can be read or changed
 * without `SESSION_SECRET`; every value carries its own expiry.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const VERSION = 'v1';

function key(secret: string, purpose: string): Buffer {
  return createHash('sha256').update(`${purpose}\0${secret}`).digest();
}

export function seal(
  value: object,
  secret: string,
  purpose: string,
  maxAgeSeconds: number
): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(secret, purpose), iv);
  const payload = JSON.stringify({ value, exp: Date.now() + maxAgeSeconds * 1000 });
  const data = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()]);
  return [VERSION, iv, data, cipher.getAuthTag()]
    .map((part) => (typeof part === 'string' ? part : part.toString('base64url')))
    .join('.');
}

/** The value, or `undefined` if the cookie is missing, forged, from another purpose or expired. */
export function unseal(sealed: string | undefined, secret: string, purpose: string): unknown {
  const [version, iv, data, tag] = sealed?.split('.') ?? [];
  if (version !== VERSION || !iv || !data || !tag) return undefined;
  try {
    const decipher = createDecipheriv(
      'aes-256-gcm',
      key(secret, purpose),
      Buffer.from(iv, 'base64url')
    );
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    const payload = Buffer.concat([
      decipher.update(Buffer.from(data, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
    const parsed: unknown = JSON.parse(payload);
    if (!parsed || typeof parsed !== 'object' || !('exp' in parsed) || !('value' in parsed))
      return undefined;
    if (typeof parsed.exp !== 'number' || parsed.exp < Date.now()) return undefined;
    return parsed.value;
  } catch {
    return undefined;
  }
}
