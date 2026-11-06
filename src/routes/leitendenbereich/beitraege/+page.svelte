<script lang="ts">
  // Port of pages/leitendenbereich/beitraege.astro of website-astro
  import Beitraege from '#legacy/web/src/components/beitraege/Beitraege.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<ClientOnly><Beitraege /></ClientOnly>
