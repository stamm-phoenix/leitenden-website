<script lang="ts">
  // Port of pages/leitendenbereich/protokolle/praesentation.astro of website-astro
  import { page } from '$app/state';
  import ProtokollPraesentation from '#legacy/web/src/components/protokolle/ProtokollPraesentation.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

{#key page.url.searchParams.get('id')}
  <ClientOnly><ProtokollPraesentation /></ClientOnly>
{/key}
