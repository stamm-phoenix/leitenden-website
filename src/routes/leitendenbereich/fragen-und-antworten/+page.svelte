<script lang="ts">
  // Port of pages/leitendenbereich/fragen-und-antworten.astro of website-astro
  import FragenPflege from '#legacy/web/src/components/pflege/FragenPflege.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<ClientOnly><FragenPflege /></ClientOnly>
