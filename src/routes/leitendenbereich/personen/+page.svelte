<script lang="ts">
  // Port of pages/leitendenbereich/personen.astro of website-astro
  import PersonenPflege from '#legacy/web/src/components/pflege/PersonenPflege.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<ClientOnly><PersonenPflege /></ClientOnly>
