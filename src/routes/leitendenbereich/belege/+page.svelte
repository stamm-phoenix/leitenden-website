<script lang="ts">
  // Port of pages/leitendenbereich/belege.astro of website-astro
  import BelegePflege from '#legacy/web/src/components/pflege/BelegePflege.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<ClientOnly><BelegePflege /></ClientOnly>
