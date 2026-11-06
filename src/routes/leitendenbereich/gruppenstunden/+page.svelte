<script lang="ts">
  // Port of pages/leitendenbereich/gruppenstunden.astro of website-astro
  import GruppenstundenPflege from '#legacy/web/src/components/pflege/GruppenstundenPflege.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<ClientOnly><GruppenstundenPflege /></ClientOnly>
