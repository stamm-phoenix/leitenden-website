<script lang="ts">
  // Port of pages/leitendenbereich/leitende.astro of website-astro
  import LeitendePflege from '#legacy/web/src/components/pflege/LeitendePflege.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<ClientOnly><LeitendePflege /></ClientOnly>
