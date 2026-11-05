<script lang="ts">
  // Port of AufgabenBereich.astro of website-astro
  import AufgabenVorlagen from '#legacy/web/src/components/AufgabenVorlagen.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<div class="task-page mt-1 min-h-[70dvh]">
  <ClientOnly><AufgabenVorlagen /></ClientOnly>
</div>

<style>
  .task-page:has(:global([data-toast] > div)) {
    padding-bottom: 8rem;
  }
</style>
