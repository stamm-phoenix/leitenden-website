import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { APP_ADDRESSES, appManifest } from '#lib/appManifest';
import type { WebAppManifest } from '#lib/appManifest';

const PUBLIC = new URL('../vendor/website-astro/web/public/', import.meta.url);
const website = JSON.parse(
  readFileSync(new URL('leitendenbereich.webmanifest', PUBLIC), 'utf8')
) as WebAppManifest;

describe('app manifest', () => {
  const manifest = appManifest(website);

  test('opens the Leitendenbereich of this app', () => {
    expect(manifest.start_url).toBe('/leitendenbereich');
    expect(manifest.scope).toBe('/');
    // Changing the id puts a second icon on the home screens of people who installed the app
    expect(manifest.id).toBe('/leitendenbereich');
    expect(manifest).toMatchObject(APP_ADDRESSES);
  });

  test('keeps name, colours and icons of the website', () => {
    expect(manifest.short_name).toBe(website.short_name);
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons).toEqual(website.icons);
  });

  test('has installable icons that this app serves', () => {
    const sizes = manifest.icons.filter((icon) => icon.type === 'image/png').map((i) => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
    expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true);
    for (const icon of [...manifest.icons, { src: '/apple-touch-icon.png' }]) {
      expect(existsSync(new URL(`.${icon.src}`, PUBLIC))).toBe(true);
    }
  });
});
