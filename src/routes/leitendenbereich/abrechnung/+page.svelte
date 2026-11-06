<script lang="ts">
  // Port of pages/leitendenbereich/abrechnung/index.astro of website-astro
  import AbrechnungList from '#legacy/web/src/components/abrechnung/AbrechnungList.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<ClientOnly><AbrechnungList /></ClientOnly>
