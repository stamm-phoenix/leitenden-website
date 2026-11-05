import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const path = (relative: string): string => fileURLToPath(new URL(relative, import.meta.url));

const LEGACY_API = path('../vendor/website-astro/api/');

/**
 * Modules of the website-astro API that this app replaces: the API runs here as one Node
 * server instead of Azure Functions, signs in with the Managed Identity instead of the
 * certificate and reads the preview names from its environment instead of a rewritten file.
 */
const REPLACED_MODULES: Record<string, string> = {
  [`${LEGACY_API}lib/token.ts`]: path('../src/lib/server/token.ts'),
  [`${LEGACY_API}lib/deployment.ts`]: path('../src/lib/server/deployment.ts'),
};

/** Stand-in for `@azure/functions` (resolve.alias in vite.config.ts). */
export const FUNCTIONS_SHIM = path('../src/lib/server/functions/shim.ts');

/** Lets the code of the submodule run in SvelteKit, see AGENTS.md „Shared code“. */
export function legacyCode(): Plugin {
  return {
    name: 'legacy-code',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!importer?.startsWith(LEGACY_API) || !/(token|deployment)(\.ts)?$/.test(source)) return;
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      return resolved && REPLACED_MODULES[resolved.id];
    },
    transform(code, id) {
      // The API is CommonJS for the Functions host; its few file paths start at `__dirname`
      if (!id.startsWith(LEGACY_API) || !code.includes('__dirname')) return;
      return { code: code.replace(/\b__dirname\b/g, 'globalThis.__legacyApiDir'), map: null };
    },
  };
}
