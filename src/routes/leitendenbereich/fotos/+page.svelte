<script lang="ts">
  // Port of pages/leitendenbereich/fotos.astro of website-astro
  import Fotos from '#legacy/web/src/components/fotos/Fotos.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<ClientOnly><Fotos /></ClientOnly>
