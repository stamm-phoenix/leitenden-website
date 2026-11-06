<script lang="ts">
  // Port of pages/leitendenbereich/inventur.astro of website-astro
  import Inventur from '#legacy/web/src/components/inventur/Inventur.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<ClientOnly><Inventur /></ClientOnly>
