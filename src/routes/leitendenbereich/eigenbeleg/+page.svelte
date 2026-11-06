<script lang="ts">
  // Port of pages/leitendenbereich/eigenbeleg.astro of website-astro
  import EigenbelegGenerator from '#legacy/web/src/components/eigenbeleg/EigenbelegGenerator.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<ClientOnly><EigenbelegGenerator /></ClientOnly>
