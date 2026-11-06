<script lang="ts">
  // Port of pages/leitendenbereich/neuigkeiten.astro of website-astro
  import Neuigkeiten from '#legacy/web/src/components/changelog/Neuigkeiten.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<ClientOnly><Neuigkeiten /></ClientOnly>
