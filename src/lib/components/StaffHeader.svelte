<script lang="ts">
  // Port of StaffHeader.astro of website-astro
  import BrandMark from './BrandMark.svelte';
  import ThemeToggle from './ThemeToggle.svelte';
  import { WEBSITE } from '#lib/website';
</script>

<div class="ui-header w-full">
  <div class="container container-wide relative flex items-center gap-3 py-2 md:py-3">
    <a
      href="/leitendenbereich"
      class="flex items-center gap-3 no-underline hover:no-underline"
      aria-label="Leitendenbereich – Übersicht"
    >
      <BrandMark decorative class="h-10 select-none sm:h-12 md:h-14" />
      <span class="leading-tight">
        <span class="ui-wordmark block font-serif text-lg font-bold text-brand-900 sm:text-xl">
          Leitendenbereich
        </span>
        <span class="mt-0.5 block text-sm text-neutral-700">Stamm Phoenix</span>
      </span>
    </a>

    <div class="ml-auto flex items-center gap-1 sm:gap-2">
      <a href={WEBSITE} class="hidden min-h-11 items-center px-2 text-sm text-link xl:inline-flex">
        Zur Website
      </a>
      <a
        href="/logout"
        data-sveltekit-reload
        class="hidden min-h-11 items-center px-2 text-sm font-semibold text-link sm:inline-flex"
      >
        Abmelden
      </a>
      <ThemeToggle />
    </div>
  </div>
</div>
