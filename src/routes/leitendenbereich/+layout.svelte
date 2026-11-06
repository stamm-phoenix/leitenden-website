<script lang="ts">
  /**
   * Port of StaffLayout.astro (with BaseLayout.astro) of website-astro. It stays mounted while
   * leaders move between pages, so header, sidebar and the bar on the phone keep their state and
   * only the content is exchanged.
   */
  import type { Snippet } from 'svelte';
  import { page } from '$app/state';
  import StaffNav from '#legacy/web/src/components/StaffNav.svelte';
  import StaffSidebar from '#legacy/web/src/components/StaffSidebar.svelte';
  import StaffIntro from '#legacy/web/src/components/StaffIntro.svelte';
  import GeretteteEingaben from '#legacy/web/src/components/GeretteteEingaben.svelte';
  import {
    NIKOLAUS_CONTROL_MODULE,
    NIKOLAUS_MODULES,
    STAFF_MODULE_SECTIONS,
    staffBreadcrumbs,
    staffModuleOf,
    staffPage,
  } from '#legacy/web/src/lib/staffModules';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
  import PageHeader from '#lib/components/PageHeader.svelte';
  import StaffFooter from '#lib/components/StaffFooter.svelte';
  import StaffHeader from '#lib/components/StaffHeader.svelte';
  import OfflineNotice from '#lib/components/OfflineNotice.svelte';
  import { MOVED_PAGES, staffPath } from '#lib/staffPages';
  import { PAGE_HEADER_CONTENT } from '#lib/staffPageHeaders';

  let { children }: { children: Snippet } = $props();

  const sections = STAFF_MODULE_SECTIONS.filter((section) => section.modules.length > 0);
  const path = $derived(staffPath(page.url.pathname));
  // Pages not moved yet redirect to the website before they render (leitendenbereich/[...rest])
  const options = $derived(MOVED_PAGES[path] ?? { header: 'none' as const });
  const current = $derived(MOVED_PAGES[path] ? staffPage(path) : undefined);
  const heading = $derived(current ? (current.heading ?? current.title) : 'Leitendenbereich');
  const breadcrumbs = $derived(current ? staffBreadcrumbs(current) : []);
  // One step up: the page above, or the start page („Übersicht“)
  const back = $derived(breadcrumbs.at(-1));
  const intro = $derived(current ? (current.intro ?? current.description) : undefined);
  const title = $derived(
    breadcrumbs.length === 0
      ? `${heading} | Stamm Phoenix`
      : `${heading} | Leitendenbereich | Stamm Phoenix`
  );
  const navProps = $derived({
    sections,
    nikolausModules: NIKOLAUS_MODULES,
    nikolausControl: NIKOLAUS_CONTROL_MODULE,
    current: current?.href ?? path,
    ancestors: breadcrumbs.map((ancestor) => ancestor.href),
  });
  const module = $derived(current ? staffModuleOf(current)?.href : undefined);
  const bare = $derived(options.bare === true);
  const HeaderContent = $derived(PAGE_HEADER_CONTENT[path]);

  // BaseLayout.astro marks the body of a bare page (no background pattern, global.css)
  $effect(() => {
    document.body.classList.toggle('is-bare', bare);
    return () => document.body.classList.remove('is-bare');
  });
</script>

<svelte:head>
  <title>{title}</title>
  {#if current}<meta name="description" content={current.description} />{/if}
</svelte:head>

<a
  href="#staff-content"
  class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded focus:bg-surface focus:p-2 focus:text-brand-900 focus:shadow-lift"
>
  Zum Inhalt springen
</a>

{#if !bare}
  <header class="ui-topbar sticky top-0 z-50 border-b border-[var(--color-neutral-200)] bg-surface">
    <StaffHeader />
    <div class="ui-topbar-line h-1 w-full bg-danger"></div>
  </header>
{/if}

<main
  id="main"
  tabindex="-1"
  class={['relative z-20 w-full flex-1', !bare && 'container container-wide py-8 md:py-12']}
>
  <div class={[!bare && 'xl:flex xl:items-start xl:gap-8']}>
    {#if !bare}<StaffSidebar {...navProps} />{/if}

    <!-- „Zum Inhalt springen“ leads here, past the sidebar -->
    <div id="staff-content" tabindex="-1" class="min-w-0 flex-1">
      {#if !bare}<ClientOnly><GeretteteEingaben /></ClientOnly>{/if}
      {#if !bare && options.offlineNotice !== false}<OfflineNotice />{/if}
      {#if !bare && back}
        <nav aria-label="Zurück" class="-mt-4 mb-2 md:-mt-6">
          <a
            href={back.href}
            class="-ml-1 inline-flex min-h-11 items-center gap-1 pr-2 text-sm font-semibold text-link"
          >
            <svg
              aria-hidden="true"
              class="size-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M15 6l-6 6 6 6" />
            </svg>
            {breadcrumbs.length === 1 ? 'Übersicht' : (back.heading ?? back.title)}
          </a>
        </nav>
      {/if}

      {#if options.header === 'page'}
        <PageHeader title={heading} tight>
          {#snippet besideTitle()}
            {#if intro && !current?.introOpen}<StaffIntro {heading} {intro} />{/if}
          {/snippet}
          {#if intro && current?.introOpen}<StaffIntro {heading} {intro} open />{/if}
          {#if HeaderContent}<HeaderContent />{/if}
        </PageHeader>
      {:else if options.header === 'sr-only'}
        <h1 class="sr-only">{heading}</h1>
      {/if}

      <div
        class={[
          'staff-page',
          options.header === 'page' && !options.compact && 'mt-4',
          ((options.header === 'page' && options.compact) ||
            (options.header === 'sr-only' && !bare)) &&
            'mt-2',
        ]}
      >
        {@render children()}
      </div>
    </div>
  </div>
</main>

{#if !bare}
  <!-- Mounted anew on every page, like on the website: it records the visit of the page -->
  {#key navProps.current}
    <StaffNav {...navProps} {module} />
  {/key}

  <footer
    class="ui-footer relative z-10 mt-12 border-t border-[var(--color-neutral-200)] bg-surface"
  >
    <StaffFooter />
  </footer>
{/if}

<style>
  :global(html:has(#staff-content)) {
    scroll-padding-top: 6rem;
  }
</style>
