<script lang="ts">
  // Port of StaffFooter.astro of website-astro
  import { page } from '$app/state';
  import { WEBSITE } from '#lib/website';

  const year = new Date().getFullYear();
  const commit = __BUILD_COMMIT__;
  const problemLink = $derived(
    `${WEBSITE}/problem-melden?quelle=footer&seite=${encodeURIComponent(page.url.pathname)}`
  );
</script>

<div
  class="container flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-3 text-sm text-neutral-700"
>
  <span>&copy; {year} Stamm Phoenix</span>
  <nav aria-label="Fußnavigation" class="flex flex-wrap gap-x-4">
    <a class="inline-flex min-h-11 items-center text-link" href={problemLink}>Problem melden</a>
    <a class="inline-flex min-h-11 items-center text-link" href="{WEBSITE}/impressum">Impressum</a>
    <a class="inline-flex min-h-11 items-center text-link" href="{WEBSITE}/datenschutz">
      Datenschutz
    </a>
  </nav>
  {#if commit}
    <a
      href="https://github.com/stamm-phoenix/leitenden-website/commit/{commit}"
      class="inline-flex min-h-11 items-center text-xs"
    >
      Version {commit.slice(0, 7)}
    </a>
  {/if}
</div>
