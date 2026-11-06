<script lang="ts">
  // Port of pages/leitendenbereich/protokolle/protokoll.astro of website-astro
  import { page } from '$app/state';
  import ProtokollEditor from '#legacy/web/src/components/protokolle/ProtokollEditor.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<!-- The editor reads the minutes from ?id= once when it opens; another one opens it anew -->
{#key page.url.searchParams.get('id')}
  <ClientOnly><ProtokollEditor /></ClientOnly>
{/key}
