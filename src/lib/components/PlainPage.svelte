<script lang="ts">
  // Pages outside the Leitendenbereich (logged out, no access): header without menu
  import type { Snippet } from 'svelte';
  import BrandMark from './BrandMark.svelte';
  import PageHeader from './PageHeader.svelte';

  interface Props {
    title: string;
    children: Snippet;
  }
  let { title, children }: Props = $props();
</script>

<svelte:head><title>{title} | Stamm Phoenix</title></svelte:head>

<header class="ui-topbar border-b border-[var(--color-neutral-200)] bg-surface">
  <div class="container flex items-center gap-3 py-2 md:py-3">
    <BrandMark decorative class="h-10 select-none sm:h-12" />
    <span class="ui-wordmark font-serif text-lg font-bold text-brand-900">Leitendenbereich</span>
  </div>
  <div class="ui-topbar-line h-1 w-full bg-danger"></div>
</header>
<main id="main" class="container py-8 md:py-12">
  <PageHeader {title} />
  {@render children()}
</main>
