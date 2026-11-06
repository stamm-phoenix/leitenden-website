import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const path = (relative: string): string => fileURLToPath(new URL(relative, import.meta.url));

const LEGACY_API = path('../vendor/website-astro/api/');
const LEGACY_WEB = path('../vendor/website-astro/web/');

/**
 * The folder of the website's API bundle: `__dirname` of its code (see `transform`) and the
 * place of the PDF worker (vite.worker.config.ts).
 */
export const LEGACY_API_BUNDLE = `${LEGACY_API}dist/bundle`;

/**
 * Modules of the website-astro API that this app replaces: the API runs here as one Node
 * server instead of Azure Functions, signs in with the Managed Identity instead of the
 * certificate and reads the preview names from its environment instead of a rewritten file.
 * A PR preview never starts the content refresh of the production website.
 */
const REPLACED_MODULES: Record<string, string> = {
  [`${LEGACY_API}lib/token.ts`]: path('../src/lib/server/token.ts'),
  [`${LEGACY_API}lib/deployment.ts`]: path('../src/lib/server/deployment.ts'),
  [`${LEGACY_API}lib/site-rebuild.ts`]: path('../src/lib/server/siteRebuild.ts'),
};

/**
 * Modules of the website-astro frontend that this app replaces for the components of the
 * submodule: the links to the Essensplanung for guests point to the website, not to this app.
 */
const REPLACED_WEB_MODULES: Record<string, string> = {
  [`${LEGACY_WEB}src/lib/essensplanung.ts`]: path('../src/lib/essensplanungLinks.ts'),
};

/**
 * The module that replaces `resolved` when code of the submodule at `importer` imports it.
 * The replacements import the originals themselves; they are not in the submodule.
 */
export function replacementOf(resolved: string, importer: string): string | undefined {
  if (importer.startsWith(LEGACY_API)) return REPLACED_MODULES[resolved];
  if (importer.startsWith(LEGACY_WEB)) return REPLACED_WEB_MODULES[resolved];
  return undefined;
}

/** Stand-in for `@azure/functions` (resolve.alias in vite.config.ts). */
export const FUNCTIONS_SHIM = path('../src/lib/server/functions/shim.ts');

/** Lets the code of the submodule run in SvelteKit, see AGENTS.md „Shared code“. */
export function legacyCode(): Plugin {
  return {
    name: 'legacy-code',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!importer || !/(token|deployment|site-rebuild|essensplanung)(\.ts)?$/.test(source))
        return;
      if (!importer.startsWith(LEGACY_API) && !importer.startsWith(LEGACY_WEB)) return;
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      return resolved ? replacementOf(resolved.id, importer) : undefined;
    },
    transform(code, id) {
      // The API is CommonJS for the Functions host; its few file paths start at `__dirname`
      if (!id.startsWith(LEGACY_API) || !code.includes('__dirname')) return;
      return { code: code.replace(/\b__dirname\b/g, 'globalThis.__legacyApiDir'), map: null };
    },
  };
}
