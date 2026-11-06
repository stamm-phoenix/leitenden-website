<script lang="ts">
  // Port of pages/leitendenbereich/abstimmungen/index.astro of website-astro
  import Abstimmungen from '#legacy/web/src/components/abstimmungen/Abstimmungen.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<ClientOnly><Abstimmungen /></ClientOnly>
