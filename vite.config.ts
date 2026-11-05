import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { FUNCTIONS_SHIM, legacyCode } from './vite/legacyCode.ts';

const local = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

function buildCommit(): string {
  if (process.env.BUILD_COMMIT_SHA) return process.env.BUILD_COMMIT_SHA;
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return '';
  }
}

/** `bun run dev:mock`: the demo API and login of website-astro answer /api and /.auth. */
function mockApi(): Plugin {
  return {
    name: 'mock-api',
    apply: 'serve',
    async configureServer(server) {
      if (process.env.MOCK_API !== '1') return;
      const { mockApiMiddleware } = await server.ssrLoadModule(
        local('./vendor/website-astro/web/dev/mockApi.ts')
      );
      server.middlewares.use(mockApiMiddleware());
    },
  };
}

export default defineConfig({
  plugins: [
    legacyCode(),
    mockApi(),
    tailwindcss(),
    sveltekit({
      preprocess: vitePreprocess(),
      adapter: adapter({ precompress: true }),
      files: {
        // Icons and other public files of website-astro, without copies
        assets: 'vendor/website-astro/web/public',
      },
    }),
  ],
  // One tsconfig for all files: the one of website-astro/web extends Astro's, which is not installed
  tsconfig: 'tsconfig.json',
  optimizeDeps: { rolldownOptions: { tsconfig: local('./tsconfig.json') } },
  define: {
    __BUILD_COMMIT__: JSON.stringify(buildCommit()),
  },
  resolve: {
    alias: {
      // The islands of website-astro use Astro's client router; here SvelteKit navigates
      'astro:transitions/client': local('./src/lib/astroTransitions.ts'),
      // The API of website-astro registers its endpoints here instead of in a Functions host
      '@azure/functions': FUNCTIONS_SHIM,
    },
    // One Svelte runtime for the app and the components of the submodule
    dedupe: ['svelte'],
  },
  server: {
    fs: { allow: [local('./vendor/website-astro')] },
  },
});
