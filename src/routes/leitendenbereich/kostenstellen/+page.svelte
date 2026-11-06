<script lang="ts">
  // Port of pages/leitendenbereich/kostenstellen.astro of website-astro
  import Kostenstellen from '#legacy/web/src/components/kostenstellen/Kostenstellen.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<ClientOnly><Kostenstellen /></ClientOnly>
