<script lang="ts">
  // Port of PageHeader.astro with Heading.astro (variant „section“) of website-astro
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    /** Little space below the heading, for a short line under it. */
    tight?: boolean;
    /** Next to the heading, e.g. the „(i)“ with the intro of a page. */
    besideTitle?: Snippet;
    actions?: Snippet;
    children?: Snippet;
  }

  let { title, tight = false, besideTitle, actions, children }: Props = $props();
  const heading =
    'ui-h ui-h--section text-2xl md:text-3xl font-serif font-semibold text-brand-900 underline-accent';
</script>

<header class="ui-pagehead flex flex-wrap items-end gap-x-8 gap-y-4 pb-4">
  <div class="prose max-w-3xl min-w-0 flex-1 basis-96">
    {#if besideTitle}
      <div class={['flex items-start gap-2', tight ? 'mb-2' : 'mb-8']}>
        <h1 class="{heading} mb-0!">{title}</h1>
        {@render besideTitle()}
      </div>
    {:else}
      <h1 class="{heading} {tight ? 'mb-2!' : 'mb-8'}">{title}</h1>
    {/if}
    {@render children?.()}
  </div>
  {#if actions}
    <div class="page-head-actions flex w-full flex-wrap items-center gap-2 lg:w-auto">
      {@render actions()}
    </div>
  {/if}
</header>
